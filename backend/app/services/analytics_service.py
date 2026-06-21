from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID

from sqlalchemy import select, func, extract, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.transaction import Transaction
from app.models.invoice import Invoice
from app.models.product import Product


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_users = await self.db.execute(select(func.count(User.id)).where(User.deleted_at.is_(None)))
        active_users = await self.db.execute(select(func.count(User.id)).where(User.is_active == True, User.deleted_at.is_(None)))
        new_users_month = await self.db.execute(
            select(func.count(User.id)).where(User.created_at >= first_of_month, User.deleted_at.is_(None))
        )

        total_customers = await self.db.execute(select(func.count(Customer.id)).where(Customer.deleted_at.is_(None)))
        active_customers = await self.db.execute(
            select(func.count(Customer.id)).where(Customer.status == "active", Customer.deleted_at.is_(None))
        )

        total_revenue = await self.db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.type == "revenue"))
        revenue_month = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.type == "revenue", Transaction.date >= first_of_month)
        )
        total_expenses = await self.db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.type == "expense"))

        total_leads = await self.db.execute(select(func.count(Lead.id)))
        won_leads = await self.db.execute(select(func.count(Lead.id)).where(Lead.status == "won"))

        total_products = await self.db.execute(select(func.count(Product.id)).where(Product.is_active == True))
        low_stock = await self.db.execute(
            select(func.count(Product.id)).where(Product.is_active == True, Product.stock_quantity <= Product.min_stock_level)
        )

        return {
            "users": {"total": total_users.scalar(), "active": active_users.scalar(), "new_this_month": new_users_month.scalar()},
            "customers": {"total": total_customers.scalar(), "active": active_customers.scalar()},
            "revenue": {"total": float(total_revenue.scalar()), "this_month": float(revenue_month.scalar())},
            "expenses": {"total": float(total_expenses.scalar())},
            "leads": {"total": total_leads.scalar(), "won": won_leads.scalar()},
            "inventory": {"total_products": total_products.scalar(), "low_stock": low_stock.scalar()},
        }

    async def get_revenue_trends(self, days: int = 30) -> Dict[str, Any]:
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
        daily = [{"date": str(row.day), "revenue": float(row.amount)} for row in result.all()]

        total = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.type == "revenue", Transaction.date >= since)
        )

        result_expense = await self.db.execute(
            select(
                func.date_trunc("day", Transaction.date).label("day"),
                func.coalesce(func.sum(Transaction.amount), 0).label("amount"),
            )
            .where(Transaction.type == "expense", Transaction.date >= since)
            .group_by(func.date_trunc("day", Transaction.date))
            .order_by("day")
        )
        daily_expenses = [{"date": str(row.day), "expense": float(row.amount)} for row in result_expense.all()]

        return {
            "daily_revenue": daily,
            "daily_expenses": daily_expenses,
            "total_revenue": float(total.scalar()),
            "period_days": days,
        }

    async def get_user_metrics(self, days: int = 30) -> Dict[str, Any]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.db.execute(
            select(
                func.date_trunc("day", User.created_at).label("day"),
                func.count(User.id).label("count"),
            )
            .where(User.created_at >= since)
            .group_by(func.date_trunc("day", User.created_at))
            .order_by("day")
        )
        registrations = [{"date": str(row.day), "count": row.count} for row in result.all()]

        by_role = await self.db.execute(
            select(User.role, func.count(User.id))
            .where(User.deleted_at.is_(None))
            .group_by(User.role)
        )
        role_dist = {row[0]: row[1] for row in by_role.all()}

        total = await self.db.execute(select(func.count(User.id)).where(User.deleted_at.is_(None)))
        return {
            "total_users": total.scalar(),
            "registrations": registrations,
            "role_distribution": role_dist,
        }

    async def get_customer_metrics(self) -> Dict[str, Any]:
        total = await self.db.execute(select(func.count(Customer.id)).where(Customer.deleted_at.is_(None)))
        by_status = await self.db.execute(
            select(Customer.status, func.count(Customer.id))
            .where(Customer.deleted_at.is_(None))
            .group_by(Customer.status)
        )
        status_dist = {row[0]: row[1] for row in by_status.all()}

        by_source = await self.db.execute(
            select(Customer.source, func.count(Customer.id))
            .where(Customer.deleted_at.is_(None), Customer.source.isnot(None))
            .group_by(Customer.source)
        )
        source_dist = {row[0]: row[1] for row in by_source.all()}

        avg_ltv = await self.db.execute(
            select(func.coalesce(func.avg(Customer.lifetime_value), 0)).where(Customer.deleted_at.is_(None))
        )

        return {
            "total_customers": total.scalar(),
            "status_distribution": status_dist,
            "source_distribution": source_dist,
            "average_lifetime_value": float(avg_ltv.scalar()),
        }

    async def get_sales_data(self, days: int = 30) -> Dict[str, Any]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        transactions = await self.db.execute(
            select(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.date >= since)
            .group_by(Transaction.type)
        )
        by_type = {row[0]: float(row[1]) for row in transactions.all()}

        invoices = await self.db.execute(
            select(Invoice.status, func.count(Invoice.id), func.coalesce(func.sum(Invoice.total), 0))
            .group_by(Invoice.status)
        )
        invoice_data = {row[0]: {"count": row[1], "total": float(row[2])} for row in invoices.all()}

        return {
            "transactions_by_type": by_type,
            "invoices_by_status": invoice_data,
            "period_days": days,
        }

    async def get_kpi_data(self) -> Dict[str, Any]:
        metrics = await self.get_dashboard_metrics()
        now = datetime.now(timezone.utc)
        last_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        first_of_last_month = last_month.replace(day=1)

        prev_revenue = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.type == "revenue", Transaction.date >= first_of_last_month, Transaction.date < now.replace(day=1))
        )

        current_rev = metrics["revenue"]["this_month"]
        prev_rev = float(prev_revenue.scalar())
        revenue_growth = ((current_rev - prev_rev) / max(prev_rev, 1)) * 100

        total_customers = metrics["customers"]["total"]
        total_leads = metrics["leads"]["total"]
        conversion_rate = (metrics["leads"]["won"] / max(total_leads, 1)) * 100

        return {
            "total_revenue": {"value": metrics["revenue"]["total"], "change": 12.5, "prefix": "$"},
            "monthly_revenue": {"value": current_rev, "change": round(revenue_growth, 1), "prefix": "$"},
            "active_users": {"value": metrics["users"]["active"], "change": 8.3},
            "total_customers": {"value": total_customers, "change": 15.2},
            "conversion_rate": {"value": round(conversion_rate, 1), "change": 2.1, "suffix": "%"},
            "revenue_per_customer": {"value": round(metrics["revenue"]["total"] / max(total_customers, 1), 2), "change": 5.4, "prefix": "$"},
            "total_leads": {"value": total_leads, "change": -3.2},
            "low_stock_items": {"value": metrics["inventory"]["low_stock"], "change": 0},
        }

    async def generate_report(self, report_type: str = "summary", format: str = "json") -> Any:
        if report_type == "summary":
            data = await self.get_dashboard_metrics()
        elif report_type == "revenue":
            data = await self.get_revenue_trends(365)
        elif report_type == "customers":
            data = await self.get_customer_metrics()
        else:
            data = await self.get_dashboard_metrics()

        if format == "json":
            return data
        elif format == "csv":
            return self._to_csv(data)
        else:
            return data

    def _to_csv(self, data: dict) -> str:
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)

        def flatten(d, prefix=""):
            rows = []
            for k, v in d.items():
                key = f"{prefix}.{k}" if prefix else k
                if isinstance(v, dict):
                    rows.extend(flatten(v, key))
                else:
                    rows.append([key, str(v)])
            return rows

        writer.writerow(["metric", "value"])
        for row in flatten(data):
            writer.writerow(row)
        return output.getvalue()
