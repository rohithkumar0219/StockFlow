import os

# Force offline SQLite in-memory & local auth for deterministic unit tests
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["DATABASE_URL_POOLED"] = ""
os.environ["NEON_AUTH_BASE_URL"] = ""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.database import Base, get_db
from backend.app.main import app

# In-memory database with StaticPool ensures all connections share the same memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_signup_and_login(client):
    # Signup Org 1
    signup_data = {
        "email": "user1@org1.com",
        "password": "password123",
        "org_name": "Org One Supply",
        "full_name": "Alice Tester"
    }
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "user1@org1.com"
    assert data["user"]["organization"]["name"] == "Org One Supply"

    # Duplicate signup fails
    res_dup = client.post("/api/auth/signup", json=signup_data)
    assert res_dup.status_code == 400

    # Login Org 1
    login_res = client.post("/api/auth/login", json={
        "email": "user1@org1.com",
        "password": "password123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Invalid login fails
    bad_res = client.post("/api/auth/login", json={
        "email": "user1@org1.com",
        "password": "wrongpassword"
    })
    assert bad_res.status_code == 401

def test_multitenancy_isolation(client):
    # Create Tenant A
    res_a = client.post("/api/auth/signup", json={
        "email": "tenant_a@test.com",
        "password": "password123",
        "org_name": "Tenant A Corp"
    })
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Create Tenant B
    res_b = client.post("/api/auth/signup", json={
        "email": "tenant_b@test.com",
        "password": "password123",
        "org_name": "Tenant B Corp"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Tenant A creates product SKU-100
    prod_a_res = client.post("/api/products", headers=headers_a, json={
        "name": "Widget A",
        "sku": "SKU-100",
        "quantity": 10,
        "cost_price": 5.0,
        "selling_price": 10.0,
        "low_stock_threshold": 3
    })
    assert prod_a_res.status_code == 201
    prod_a_id = prod_a_res.json()["id"]

    # Tenant B can ALSO create product with SAME SKU-100 (allowed across different orgs!)
    prod_b_res = client.post("/api/products", headers=headers_b, json={
        "name": "Widget B",
        "sku": "SKU-100",
        "quantity": 25,
        "cost_price": 7.0,
        "selling_price": 14.0
    })
    assert prod_b_res.status_code == 201
    prod_b_id = prod_b_res.json()["id"]

    # Tenant A trying to create duplicate SKU within Org A must FAIL
    prod_a_dup = client.post("/api/products", headers=headers_a, json={
        "name": "Widget A Dup",
        "sku": "SKU-100",
        "quantity": 1
    })
    assert prod_a_dup.status_code == 400

    # Tenant A lists products -> only sees Widget A, NOT Widget B
    list_a = client.get("/api/products", headers=headers_a).json()
    assert len(list_a) == 1
    assert list_a[0]["name"] == "Widget A"
    assert list_a[0]["quantity"] == 10

    # Tenant B lists products -> only sees Widget B, NOT Widget A
    list_b = client.get("/api/products", headers=headers_b).json()
    assert len(list_b) == 1
    assert list_b[0]["name"] == "Widget B"
    assert list_b[0]["quantity"] == 25

    # Tenant B CANNOT read Tenant A's product by ID
    get_cross = client.get(f"/api/products/{prod_a_id}", headers=headers_b)
    assert get_cross.status_code == 404

    # Tenant B CANNOT update Tenant A's product
    update_cross = client.patch(f"/api/products/{prod_a_id}", headers=headers_b, json={"quantity": 999})
    assert update_cross.status_code == 404

    # Tenant B CANNOT delete Tenant A's product
    del_cross = client.delete(f"/api/products/{prod_a_id}", headers=headers_b)
    assert del_cross.status_code == 404

def test_product_crud_and_stock_adjust(client):
    # Signup user
    signup_res = client.post("/api/auth/signup", json={
        "email": "crud_user@test.com",
        "password": "password123",
        "org_name": "CRUD Warehouse"
    })
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Product
    create_res = client.post("/api/products", headers=headers, json={
        "name": "Heavy Bolt M10",
        "sku": "BOLT-M10",
        "description": "Grade 8.8 Hex Bolt",
        "quantity": 20,
        "cost_price": 1.50,
        "selling_price": 4.00,
        "low_stock_threshold": 10
    })
    assert create_res.status_code == 201
    prod = create_res.json()
    prod_id = prod["id"]
    assert prod["is_low_stock"] is False

    # 2. Adjust Stock down to 8 (below threshold of 10 -> becomes low stock)
    adj_res = client.post(f"/api/products/{prod_id}/adjust-stock", headers=headers, json={
        "delta": -12,
        "note": "Damaged batch discarded"
    })
    assert adj_res.status_code == 200
    adj_prod = adj_res.json()
    assert adj_prod["quantity"] == 8
    assert adj_prod["is_low_stock"] is True

    # 3. Negative stock reduction beyond inventory is rejected
    invalid_adj = client.post(f"/api/products/{prod_id}/adjust-stock", headers=headers, json={
        "delta": -50,
        "note": "Too much reduction"
    })
    assert invalid_adj.status_code == 400

    # 4. Check Dashboard stats
    dash_stats = client.get("/api/dashboard/stats", headers=headers).json()
    assert dash_stats["total_products"] == 1
    assert dash_stats["total_units"] == 8
    assert dash_stats["low_stock_count"] == 1

    # 5. Check Dashboard low stock list
    low_stock_list = client.get("/api/dashboard/low-stock", headers=headers).json()
    assert len(low_stock_list) == 1
    assert low_stock_list[0]["sku"] == "BOLT-M10"

    # 6. Update Product fields
    update_res = client.patch(f"/api/products/{prod_id}", headers=headers, json={
        "name": "Heavy Bolt M10 (Stainless)",
        "selling_price": 4.50
    })
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Heavy Bolt M10 (Stainless)"
    assert update_res.json()["selling_price"] == 4.50

    # 7. Delete Product
    del_res = client.delete(f"/api/products/{prod_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_del = client.get(f"/api/products/{prod_id}", headers=headers)
    assert get_del.status_code == 404

def test_settings_and_default_low_stock(client):
    signup_res = client.post("/api/auth/signup", json={
        "email": "settings_user@test.com",
        "password": "password123",
        "org_name": "Settings Org"
    })
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Product with no custom threshold (low_stock_threshold=None)
    prod_res = client.post("/api/products", headers=headers, json={
        "name": "General Washer",
        "sku": "WSH-01",
        "quantity": 8
        # low_stock_threshold omitted -> falls back to default 5
    })
    assert prod_res.status_code == 201
    prod = prod_res.json()
    assert prod["effective_low_stock_threshold"] == 5
    assert prod["is_low_stock"] is False  # 8 > 5

    # Change org default low stock threshold to 10
    patch_settings = client.patch("/api/settings", headers=headers, json={
        "default_low_stock_threshold": 10
    })
    assert patch_settings.status_code == 200
    assert patch_settings.json()["default_low_stock_threshold"] == 10

    # Now re-fetching product list: 8 <= 10 -> is_low_stock should now be True!
    prods = client.get("/api/products", headers=headers).json()
    assert prods[0]["effective_low_stock_threshold"] == 10
    assert prods[0]["is_low_stock"] is True
