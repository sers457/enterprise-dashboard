from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class InvoiceItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float
    amount: float


class InvoiceCreate(BaseModel):
    customer_id: UUID
    amount: float
    tax: float = 0
    status: str = "draft"
    due_date: datetime
    items: Optional[List[InvoiceItem]] = None
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    amount: Optional[float] = None
    tax: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    items: Optional[List[InvoiceItem]] = None
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: UUID
    invoice_number: str
    customer_id: UUID
    amount: float
    tax: float
    total: float
    status: str
    due_date: datetime
    paid_at: Optional[datetime] = None
    items: Optional[list] = None
    notes: Optional[str] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InvoiceSummary(BaseModel):
    total_invoices: int
    paid_invoices: int
    overdue_invoices: int
    draft_invoices: int
    total_amount: float
    paid_amount: float
    overdue_amount: float
