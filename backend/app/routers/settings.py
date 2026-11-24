from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Organization
from ..schemas import OrganizationResponse, OrganizationUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=OrganizationResponse)
def get_settings(current_user: User = Depends(get_current_user)):
    return OrganizationResponse.model_validate(current_user.organization)

@router.patch("", response_model=OrganizationResponse)
def update_settings(
    req: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    if req.name is not None and req.name.strip():
        org.name = req.name.strip()
    if req.default_low_stock_threshold is not None:
        org.default_low_stock_threshold = req.default_low_stock_threshold
    if req.currency is not None:
        org.currency = req.currency.strip().upper()

    db.commit()
    db.refresh(org)
    return OrganizationResponse.model_validate(org)
