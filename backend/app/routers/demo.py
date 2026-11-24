from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import User, Organization, Product
from ..auth import hash_password, get_current_user

router = APIRouter(prefix="/api/demo", tags=["Demo Seed"])

SAMPLE_PRODUCTS = [
    {
        "name": "Heavy Duty Steel Ball Bearing (25mm)",
        "sku": "BRG-25MM-HD",
        "description": "Industrial grade carbon steel bearing for heavy machinery rotation shafts.",
        "quantity": 3,
        "cost_price": 4.50,
        "selling_price": 12.00,
        "low_stock_threshold": 10
    },
    {
        "name": "Titanium Coated Hex Drill Bit Set (13pc)",
        "sku": "TL-DB-HEX-13",
        "description": "High-speed titanium nitride drill bits with quick-release 1/4 inch hex shanks.",
        "quantity": 2,
        "cost_price": 18.20,
        "selling_price": 42.99,
        "low_stock_threshold": 5
    },
    {
        "name": "M6 Zinc-Plated Hex Flange Nuts (100pk)",
        "sku": "FST-M6-FLG-100",
        "description": "Corrosion resistant grade 8.8 serrated face flange nuts for automotive framing.",
        "quantity": 85,
        "cost_price": 3.10,
        "selling_price": 8.50,
        "low_stock_threshold": 15
    },
    {
        "name": "Polycarbonate Impact Safety Goggles",
        "sku": "PPE-GOG-CLR-01",
        "description": "ANSI Z87.1 approved anti-fog clear wraparound protective eyewear.",
        "quantity": 4,
        "cost_price": 2.75,
        "selling_price": 9.99,
        "low_stock_threshold": 8
    },
    {
        "name": "High-Torque Brushless Impact Driver 20V",
        "sku": "PWR-IMP-20V-X",
        "description": "Variable speed 2000 in-lbs torque motor with LED work ring light.",
        "quantity": 19,
        "cost_price": 62.00,
        "selling_price": 139.99,
        "low_stock_threshold": 5
    },
    {
        "name": "Industrial Grade Duct Tape 50m Roll",
        "sku": "ADH-DCT-50M-SL",
        "description": "Heavy weave weather-proof silver adhesive tape for ducting and pipe repairs.",
        "quantity": 64,
        "cost_price": 2.10,
        "selling_price": 6.49,
        "low_stock_threshold": 10
    },
    {
        "name": "Digital Vernier Caliper 150mm Stainless",
        "sku": "MSR-CAL-150-SS",
        "description": "High precision LCD micrometric measuring caliper with zero calibrate button.",
        "quantity": 12,
        "cost_price": 14.50,
        "selling_price": 34.95,
        "low_stock_threshold": 4
    },
    {
        "name": "Automotive Grade Copper Gasket Seal 10pk",
        "sku": "AUT-GSK-CU-10",
        "description": "Heat resistant crush washers for oil pans and hydraulic banjo fittings.",
        "quantity": 1,
        "cost_price": 5.20,
        "selling_price": 16.00,
        "low_stock_threshold": 6
    }
]

def ensure_default_demo_data(db: Session):
    demo_email = "alex@apexhardware.com"
    existing_user = db.query(User).filter(User.email == demo_email).first()
    if not existing_user:
        # Create Demo Org
        org = Organization(
            name="Apex Hardware Inc.",
            slug="apex-hardware",
            default_low_stock_threshold=5,
            currency="INR"
        )
        db.add(org)
        db.flush()

        # Create Demo User
        user = User(
            org_id=org.id,
            email=demo_email,
            hashed_password=hash_password("demo12345"),
            full_name="Alex Vance",
            role="Owner"
        )
        db.add(user)
        db.flush()

        # Add sample products
        for item in SAMPLE_PRODUCTS:
            prod = Product(
                org_id=org.id,
                name=item["name"],
                sku=item["sku"],
                description=item["description"],
                quantity=item["quantity"],
                cost_price=item["cost_price"],
                selling_price=item["selling_price"],
                low_stock_threshold=item["low_stock_threshold"],
                last_updated_by=demo_email
            )
            db.add(prod)

        db.commit()

@router.post("/seed")
def seed_current_org(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    created_count = 0
    for item in SAMPLE_PRODUCTS:
        existing = db.query(Product).filter(
            Product.org_id == current_user.org_id,
            Product.sku == item["sku"]
        ).first()
        if not existing:
            prod = Product(
                org_id=current_user.org_id,
                name=item["name"],
                sku=item["sku"],
                description=item["description"],
                quantity=item["quantity"],
                cost_price=item["cost_price"],
                selling_price=item["selling_price"],
                low_stock_threshold=item["low_stock_threshold"],
                last_updated_by=current_user.email
            )
            db.add(prod)
            created_count += 1
    db.commit()
    return {"status": "ok", "message": f"Added {created_count} sample products to your organization."}
