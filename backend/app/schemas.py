from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str
    default_low_stock_threshold: int = Field(default=5, ge=0)
    currency: str = "INR"

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    default_low_stock_threshold: Optional[int] = Field(default=None, ge=0)
    currency: Optional[str] = None

class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime


# User & Auth Schemas
class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    org_name: str = Field(min_length=2, max_length=100)
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    org_id: int
    email: str
    full_name: Optional[str]
    role: str
    organization: OrganizationResponse

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    quantity: int = Field(default=0)
    cost_price: Optional[float] = Field(default=None, ge=0.0)
    selling_price: Optional[float] = Field(default=None, ge=0.0)
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    quantity: Optional[int] = None
    cost_price: Optional[float] = Field(default=None, ge=0.0)
    selling_price: Optional[float] = Field(default=None, ge=0.0)
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)

class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    org_id: int
    effective_low_stock_threshold: int
    is_low_stock: bool
    last_updated_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class StockAdjustRequest(BaseModel):
    delta: int = Field(description="Amount to add or subtract, e.g. +5 or -3")
    note: Optional[str] = Field(default=None, max_length=255)


# Dashboard Schemas
class DashboardStatsResponse(BaseModel):
    total_products: int
    total_units: int
    total_cost_value: float
    total_retail_value: float
    low_stock_count: int
    healthy_stock_count: int

class LowStockItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    sku: str
    quantity: int
    low_stock_threshold: int
    cost_price: Optional[float]
    selling_price: Optional[float]
    updated_at: datetime
