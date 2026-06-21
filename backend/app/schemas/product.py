from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., max_length=255)
    sku: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: float
    cost: float
    stock_quantity: int = 0
    min_stock_level: int = 10
    category: Optional[str] = None
    supplier_id: Optional[UUID] = None
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    category: Optional[str] = None
    supplier_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: UUID
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    cost: float
    stock_quantity: int
    min_stock_level: int
    category: Optional[str] = None
    supplier_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductForecast(BaseModel):
    product_id: UUID
    product_name: str
    current_stock: int
    avg_daily_sales: float
    days_until_out: int
    recommended_reorder: int
    next_month_demand: float
