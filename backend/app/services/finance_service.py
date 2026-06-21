import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, extract, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.models.invoice import Invoice
from app.models.customer import Customer


class FinanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_transaction(self, data: dict, created_by: UUID) -> Transaction:
        transaction = Transaction(
            id=uuid.uuid4(),
            type=data["type"],
            amount=data["amount"],
            category=data.get("category"),
            description=data.get("description"),
            reference=data.get("reference"),
            customer_id=data.get("customer_id"),
            invoice_id=data.get("invoice_id"),
            created_by=created_by,
            date=data.get("date", datetime.now(timezone.utc)),
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def get_transaction(self, transaction_id: UUID) -> Transaction:
        result = await self.db.execute(select(Transaction).where(Transaction.id == transaction_id))
        transaction = result.scalar_one_or_none()
        if not transaction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        return transaction

    async def list_transactions(self, skip: int = 0, limit: int = 100, type_filter: Optional[str] = None, category: Optional[str] = None, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> tuple:
        query = select(Transaction)
        if type_filter:
            query = query.where(Transaction.type == type_filter)
        if category:
            query = query.where(Transaction.category == category)
        if date_from:
            query = query.where(Transaction.date >= date_from)
        if date_to:
            query = query.where(Transaction.date <= date_to)
        query = query.order_by(Transaction.date.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        transactions = result.scalars().all()

        count_query = select(func.count(Transaction.id))
        if type_filter:
            count_query = count_query.where(Transaction.type == type_filter)
        if category:
            count_query = count_query.where(Transaction.category == category)
        if date_from:
            count_query = count_query.where(Transaction.date >= date_from)
        if date_to:
            count_query = count_query.where(Transaction.date <= date_to)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(transactions), total

    async def create_invoice(self, data: dict, created_by: UUID) -> Invoice:
        total = data["amount"] + data.get("tax", 0)
        last_invoice = await self.db.execute(select(func.max(Invoice.invoice_number)))
        last_num = last_invoice.scalar() or "INV-00000"
        next_num = int(last_num.split("-")[1]) + 1
        invoice_number = f"INV-{next_num:05d}"

        invoice = Invoice(
            id=uuid.uuid4(),
            invoice_number=invoice_number,
            customer_id=data["customer_id"],
            amount=data["amount"],
            tax=data.get("tax", 0),
            total=total,
            status=data.get("status", "draft"),
            due_date=data["due_date"],
            items=data.get("items"),
            notes=data.get("notes"),
            created_by=created_by,
        )
        self.db.add(invoice)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice

    async def get_invoice(self, invoice_id: UUID) -> Invoice:
        result = await self.db.execute(select(Invoice).where(Invoice.id == invoice_id))
        invoice = result.scalar_one_or_none()
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
        return invoice

    async def update_invoice(self, invoice_id: UUID, data: dict) -> Invoice:
        invoice = await self.get_invoice(invoice_id)
        for key, value in data.items():
            if value is not None and hasattr(invoice, key):
                setattr(invoice, key, value)
        if "amount" in data or "tax" in data:
            invoice.total = (data.get("amount", invoice.amount) or invoice.amount) + (data.get("tax", invoice.tax) or invoice.tax)
        invoice.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice

    async def delete_invoice(self, invoice_id: UUID) -> None:
        invoice = await self.get_invoice(invoice_id)
        await self.db.delete(invoice)
        await self.db.commit()

    async def list_invoices(self, skip: int = 0, limit: int = 100, status: Optional[str] = None, customer_id: Optional[UUID] = None) -> tuple:
        query = select(Invoice)
        if status:
            query = query.where(Invoice.status == status)
        if customer_id:
            query = query.where(Invoice.customer_id == customer_id)
        query = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        invoices = result.scalars().all()

        count_query = select(func.count(Invoice.id))
        if status:
            count_query = count_query.where(Invoice.status == status)
        if customer_id:
            count_query = count_query.where(Invoice.customer_id == customer_id)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(invoices), total

    async def send_invoice(self, invoice_id: UUID) -> Invoice:
        invoice = await self.get_invoice(invoice_id)
        invoice.status = "sent"
        invoice.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice

    async def pay_invoice(self, invoice_id: UUID) -> Invoice:
        invoice = await self.get_invoice(invoice_id)
        invoice.status = "paid"
        invoice.paid_at = datetime.now(timezone.utc)
        invoice.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(invoice)

        transaction = Transaction(
            id=uuid.uuid4(),
            type="revenue",
            amount=invoice.total,
            category="invoice_payment",
            description=f"Payment for invoice {invoice.invoice_number}",
            customer_id=invoice.customer_id,
            invoice_id=invoice.id,
            created_by=invoice.created_by,
            date=datetime.now(timezone.utc),
        )
        self.db.add(transaction)
        await self.db.commit()
        return invoice

    async def get_revenue_data(self, days: int = 30) -> Dict[str, Any]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.db.execute(
            select(
                func.date_trunc("day", Transaction.date).label("day"),
                func.coalesce(func.sum(Transaction.amount), 0).label("amount"),
            )
            .where(Transaction.type == "revenue", Transaction.date >= since)
            .group_by(func.date_trunc("day", Transaction.date))
            .order_by("day")
        )
        daily_revenue = [{"date": str(row.day), "amount": float(row.amount)} for row in result.all()]

        total = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.type == "revenue", Transaction.date >= since)
        )

        return {"daily_revenue": daily_revenue, "total": float(total.scalar()), "period_days": days}

    async def get_summary(self) -> Dict[str, Any]:
        revenue = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.type == "revenue")
        )
        expenses = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.type == "expense")
        )
        invoices_result = await self.db.execute(
            select(
                func.count(Invoice.id),
                func.coalesce(func.sum(Invoice.total), 0),
            ).where(Invoice.status == "paid")
        )
        inv_count, inv_total = invoices_result.one()

        pending = await self.db.execute(
            select(func.coalesce(func.sum(Invoice.total), 0)).where(Invoice.status.in_(["draft", "sent"]))
        )

        return {
            "total_revenue": float(revenue.scalar()),
            "total_expenses": float(expenses.scalar()),
            "net_profit": float(revenue.scalar()) - float(expenses.scalar()),
            "paid_invoices_count": inv_count,
            "paid_invoices_total": float(inv_total),
            "pending_invoices_total": float(pending.scalar()),
        }

    async def get_reports(self, report_type: str = "pnl", date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> Dict[str, Any]:
        if not date_from:
            date_from = datetime.now(timezone.utc) - timedelta(days=30)
        if not date_to:
            date_to = datetime.now(timezone.utc)

        if report_type == "pnl":
            revenue = await self.db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0))
                .where(Transaction.type == "revenue", Transaction.date >= date_from, Transaction.date <= date_to)
            )
            expenses = await self.db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0))
                .where(Transaction.type == "expense", Transaction.date >= date_from, Transaction.date <= date_to)
            )
            by_category = await self.db.execute(
                select(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0))
                .where(Transaction.date >= date_from, Transaction.date <= date_to)
                .group_by(Transaction.category)
            )
            return {
                "report_type": "pnl",
                "date_from": date_from.isoformat(),
                "date_to": date_to.isoformat(),
                "total_revenue": float(revenue.scalar()),
                "total_expenses": float(expenses.scalar()),
                "net_profit": float(revenue.scalar()) - float(expenses.scalar()),
                "by_category": {row[0]: float(row[1]) for row in by_category.all()},
            }
        elif report_type == "revenue":
            by_month = await self.db.execute(
                select(
                    func.date_trunc("month", Transaction.date).label("month"),
                    func.coalesce(func.sum(Transaction.amount), 0).label("amount"),
                )
                .where(Transaction.type == "revenue", Transaction.date >= date_from, Transaction.date <= date_to)
                .group_by(func.date_trunc("month", Transaction.date))
                .order_by("month")
            )
            return {
                "report_type": "revenue_breakdown",
                "date_from": date_from.isoformat(),
                "date_to": date_to.isoformat(),
                "monthly": [{"month": str(row.month), "amount": float(row.amount)} for row in by_month.all()],
            }
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report type")
