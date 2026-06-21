from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    type: str = Field(..., pattern="^(revenue|expense|refund|transfer)$")
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    reference: Optional[str] = None
    customer_id: Optional[UUID] = None
    invoice_id: Optional[UUID] = None
    date: datetime


class TransactionResponse(BaseModel):
    id: UUID
    type: str
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    reference: Optional[str] = None
    customer_id: Optional[UUID] = None
    invoice_id: Optional[UUID] = None
    created_by: UUID
    created_at: datetime
    date: datetime

    model_config = {"from_attributes": True}


class TransactionSummary(BaseModel):
    total_revenue: float
    total_expenses: float
    net_profit: float
    transaction_count: int
    revenue_count: int
    expense_count: int
