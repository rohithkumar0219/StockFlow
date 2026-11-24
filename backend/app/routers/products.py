from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from ..database import get_db
from ..models import User, Product, StockAdjustmentLog, Organization
from ..schemas import (
    ProductCreate, ProductUpdate, ProductResponse, StockAdjustRequest
)
from ..auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["Products & Inventory"])

def enrich_product(product: Product, org_default_threshold: int) -> dict:
    effective_thresh = (
        product.low_stock_threshold 
        if product.low_stock_threshold is not None 
        else org_default_threshold
    )
    is_low = product.quantity <= effective_thresh
    return {
        "id": product.id,
        "org_id": product.org_id,
        "name": product.name,
        "sku": product.sku,
        "description": product.description,
        "quantity": product.quantity,
        "cost_price": product.cost_price,
        "selling_price": product.selling_price,
        "low_stock_threshold": product.low_stock_threshold,
        "effective_low_stock_threshold": effective_thresh,
        "is_low_stock": is_low,
        "last_updated_by": product.last_updated_by,
        "created_at": product.created_at,
        "updated_at": product.updated_at
    }

@router.get("", response_model=List[ProductResponse])
def list_products(
    q: Optional[str] = Query(None, description="Search term for name or SKU"),
    low_stock_only: Optional[bool] = Query(False, description="Filter for low stock items only"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.org_id == current_user.org_id)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(Product.name.ilike(term), Product.sku.ilike(term)))

    products = query.order_by(desc(Product.updated_at)).all()
    org_default_threshold = current_user.organization.default_low_stock_threshold

    enriched = [enrich_product(p, org_default_threshold) for p in products]

    if low_stock_only:
        enriched = [p for p in enriched if p["is_low_stock"]]

    return enriched

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    req: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_sku = req.sku.strip()
    # Check if SKU already exists in this organization
    existing = db.query(Product).filter(
        Product.org_id == current_user.org_id,
        Product.sku == clean_sku
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A product with SKU '{clean_sku}' already exists in your organization."
        )

    product = Product(
        org_id=current_user.org_id,
        name=req.name.strip(),
        sku=clean_sku,
        description=req.description.strip() if req.description else None,
        quantity=req.quantity,
        cost_price=req.cost_price,
        selling_price=req.selling_price,
        low_stock_threshold=req.low_stock_threshold,
        last_updated_by=current_user.email
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    return enrich_product(product, current_user.organization.default_low_stock_threshold)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.org_id == current_user.org_id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return enrich_product(product, current_user.organization.default_low_stock_threshold)

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    req: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.org_id == current_user.org_id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if req.sku is not None:
        clean_sku = req.sku.strip()
        if clean_sku != product.sku:
            existing = db.query(Product).filter(
                Product.org_id == current_user.org_id,
                Product.sku == clean_sku
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"SKU '{clean_sku}' is already used by another product."
                )
            product.sku = clean_sku

    if req.name is not None:
        product.name = req.name.strip()
    if req.description is not None:
        product.description = req.description.strip() if req.description else None
    if req.quantity is not None:
        product.quantity = req.quantity
    if req.cost_price is not None:
        product.cost_price = req.cost_price
    if req.selling_price is not None:
        product.selling_price = req.selling_price
    if req.low_stock_threshold is not None:
        product.low_stock_threshold = req.low_stock_threshold

    product.last_updated_by = current_user.email
    db.commit()
    db.refresh(product)

    return enrich_product(product, current_user.organization.default_low_stock_threshold)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.org_id == current_user.org_id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    db.delete(product)
    db.commit()
    return None

@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(
    product_id: int,
    req: StockAdjustRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.org_id == current_user.org_id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    new_quantity = product.quantity + req.delta
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reduce stock by {abs(req.delta)}. Current stock is {product.quantity}."
        )

    product.quantity = new_quantity
    product.last_updated_by = current_user.email

    # Log the adjustment
    log = StockAdjustmentLog(
        org_id=current_user.org_id,
        product_id=product.id,
        delta=req.delta,
        resulting_quantity=new_quantity,
        note=req.note,
        adjusted_by=current_user.email
    )
    db.add(log)
    db.commit()
    db.refresh(product)

    return enrich_product(product, current_user.organization.default_low_stock_threshold)
