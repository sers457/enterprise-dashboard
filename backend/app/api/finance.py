from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.models.user import User
from app.services.finance_service import FinanceService

router = APIRouter(tags=["finance"])


@router.get("/finance/transactions")
async def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    type_filter: Optional[str] = Query(None, alias="type"),
    category: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    transactions, total = await service.list_transactions(skip, limit, type_filter, category, date_from, date_to)
    return {"items": transactions, "total": total, "skip": skip, "limit": limit}


@router.post("/finance/transactions", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.create_transaction(data.model_dump(), current_user.id)


@router.get("/finance/transactions/{transaction_id}")
async def get_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.get_transaction(transaction_id)


@router.get("/finance/invoices")
async def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    customer_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    invoices, total = await service.list_invoices(skip, limit, status, customer_id)
    return {"items": invoices, "total": total, "skip": skip, "limit": limit}


@router.post("/finance/invoices", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    data: InvoiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.create_invoice(data.model_dump(), current_user.id)


@router.get("/finance/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.get_invoice(invoice_id)


@router.put("/finance/invoices/{invoice_id}")
async def update_invoice(
    invoice_id: UUID,
    data: InvoiceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.update_invoice(invoice_id, data.model_dump(exclude_none=True))


@router.delete("/finance/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    await service.delete_invoice(invoice_id)
    return {"message": "Invoice deleted successfully"}


@router.post("/finance/invoices/{invoice_id}/send")
async def send_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.send_invoice(invoice_id)


@router.post("/finance/invoices/{invoice_id}/pay")
async def pay_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.pay_invoice(invoice_id)


@router.get("/finance/reports")
async def get_finance_reports(
    report_type: str = Query("pnl"),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.get_reports(report_type, date_from, date_to)


@router.get("/finance/summary")
async def get_finance_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.get_summary()


@router.get("/finance/revenue")
async def get_finance_revenue(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceService(db)
    return await service.get_revenue_data(days)
