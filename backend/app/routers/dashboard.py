from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, Product
from ..schemas import DashboardStatsResponse, LowStockItemResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.org_id == current_user.org_id).all()
    org_default_threshold = current_user.organization.default_low_stock_threshold

    total_products = len(products)
    total_units = sum(p.quantity for p in products)
    total_cost_value = sum((p.cost_price or 0.0) * p.quantity for p in products)
    total_retail_value = sum((p.selling_price or 0.0) * p.quantity for p in products)

    low_stock_count = 0
    for p in products:
        thresh = p.low_stock_threshold if p.low_stock_threshold is not None else org_default_threshold
        if p.quantity <= thresh:
            low_stock_count += 1

    return DashboardStatsResponse(
        total_products=total_products,
        total_units=total_units,
        total_cost_value=round(total_cost_value, 2),
        total_retail_value=round(total_retail_value, 2),
        low_stock_count=low_stock_count,
        healthy_stock_count=max(0, total_products - low_stock_count)
    )

@router.get("/low-stock", response_model=List[LowStockItemResponse])
def get_low_stock_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.org_id == current_user.org_id).all()
    org_default_threshold = current_user.organization.default_low_stock_threshold

    low_stock_items = []
    for p in products:
        thresh = p.low_stock_threshold if p.low_stock_threshold is not None else org_default_threshold
        if p.quantity <= thresh:
            low_stock_items.append(LowStockItemResponse(
                id=p.id,
                name=p.name,
                sku=p.sku,
                quantity=p.quantity,
                low_stock_threshold=thresh,
                cost_price=p.cost_price,
                selling_price=p.selling_price,
                updated_at=p.updated_at
            ))

    # Sort items by quantity ascending (most critical first)
    low_stock_items.sort(key=lambda x: x.quantity)
    return low_stock_items
