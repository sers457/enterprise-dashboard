import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.lead import Lead
from app.models.transaction import Transaction


class CRMService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_customer(self, data: dict) -> Customer:
        customer = Customer(
            id=uuid.uuid4(),
            name=data["name"],
            email=data["email"],
            phone=data.get("phone"),
            company=data.get("company"),
            status=data.get("status", "lead"),
            source=data.get("source"),
            assigned_to=data.get("assigned_to"),
            notes=data.get("notes"),
        )
        self.db.add(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        return customer

    async def get_customer(self, customer_id: UUID) -> Customer:
        result = await self.db.execute(
            select(Customer).where(Customer.id == customer_id, Customer.deleted_at.is_(None))
        )
        customer = result.scalar_one_or_none()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return customer

    async def update_customer(self, customer_id: UUID, data: dict) -> Customer:
        customer = await self.get_customer(customer_id)
        for key, value in data.items():
            if value is not None and hasattr(customer, key):
                setattr(customer, key, value)
        customer.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(customer)
        return customer

    async def delete_customer(self, customer_id: UUID) -> None:
        customer = await self.get_customer(customer_id)
        customer.deleted_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def list_customers(self, skip: int = 0, limit: int = 100, status: Optional[str] = None, search: Optional[str] = None) -> tuple:
        query = select(Customer).where(Customer.deleted_at.is_(None))
        if status:
            query = query.where(Customer.status == status)
        if search:
            query = query.where(
                (Customer.name.ilike(f"%{search}%")) | (Customer.email.ilike(f"%{search}%")) | (Customer.company.ilike(f"%{search}%"))
            )
        query = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        customers = result.scalars().all()

        count_query = select(func.count(Customer.id)).where(Customer.deleted_at.is_(None))
        if status:
            count_query = count_query.where(Customer.status == status)
        if search:
            count_query = count_query.where(
                (Customer.name.ilike(f"%{search}%")) | (Customer.email.ilike(f"%{search}%")) | (Customer.company.ilike(f"%{search}%"))
            )
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(customers), total

    async def create_lead(self, data: dict) -> Lead:
        lead = Lead(
            id=uuid.uuid4(),
            customer_id=data["customer_id"],
            status=data.get("status", "new"),
            source=data.get("source"),
            score=data.get("score", 0),
            expected_revenue=data.get("expected_revenue", 0),
            probability=data.get("probability", 0),
            notes=data.get("notes"),
            assigned_to=data.get("assigned_to"),
            next_followup=data.get("next_followup"),
        )
        self.db.add(lead)
        await self.db.commit()
        await self.db.refresh(lead)
        return lead

    async def get_lead(self, lead_id: UUID) -> Lead:
        result = await self.db.execute(select(Lead).where(Lead.id == lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        return lead

    async def update_lead(self, lead_id: UUID, data: dict) -> Lead:
        lead = await self.get_lead(lead_id)
        for key, value in data.items():
            if value is not None and hasattr(lead, key):
                setattr(lead, key, value)
        lead.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(lead)
        return lead

    async def delete_lead(self, lead_id: UUID) -> None:
        lead = await self.get_lead(lead_id)
        await self.db.delete(lead)
        await self.db.commit()

    async def list_leads(self, skip: int = 0, limit: int = 100, status: Optional[str] = None, assigned_to: Optional[UUID] = None) -> tuple:
        query = select(Lead)
        if status:
            query = query.where(Lead.status == status)
        if assigned_to:
            query = query.where(Lead.assigned_to == assigned_to)
        query = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        leads = result.scalars().all()

        count_query = select(func.count(Lead.id))
        if status:
            count_query = count_query.where(Lead.status == status)
        if assigned_to:
            count_query = count_query.where(Lead.assigned_to == assigned_to)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(leads), total

    async def update_lead_stage(self, lead_id: UUID, status: str) -> Lead:
        valid_statuses = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
        if status not in valid_statuses:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Must be one of: {valid_statuses}")
        lead = await self.get_lead(lead_id)
        lead.status = status
        lead.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(lead)
        return lead

    async def get_pipeline_data(self) -> List[Dict[str, Any]]:
        stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
        pipeline = []
        for stage in stages:
            result = await self.db.execute(
                select(func.count(Lead.id), func.coalesce(func.sum(Lead.expected_revenue), 0))
                .where(Lead.status == stage)
            )
            count, value = result.one()
            pipeline.append({"stage": stage, "count": count, "value": float(value)})
        return pipeline

    async def get_analytics(self) -> Dict[str, Any]:
        total_customers = await self.db.execute(select(func.count(Customer.id)).where(Customer.deleted_at.is_(None)))
        total_leads = await self.db.execute(select(func.count(Lead.id)))
        won_leads = await self.db.execute(select(func.count(Lead.id)).where(Lead.status == "won"))

        by_status = await self.db.execute(
            select(Customer.status, func.count(Customer.id))
            .where(Customer.deleted_at.is_(None))
            .group_by(Customer.status)
        )
        status_dist = {row[0]: row[1] for row in by_status.all()}

        revenue_result = await self.db.execute(
            select(func.coalesce(func.sum(Customer.revenue), 0)).where(Customer.deleted_at.is_(None))
        )
        total_revenue = float(revenue_result.scalar())

        return {
            "total_customers": total_customers.scalar(),
            "total_leads": total_leads.scalar(),
            "won_leads": won_leads.scalar(),
            "conversion_rate": round(won_leads.scalar() / max(total_leads.scalar(), 1) * 100, 2),
            "status_distribution": status_dist,
            "total_revenue": total_revenue,
        }
