from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.models.user import User
from app.services.crm_service import CRMService

router = APIRouter(tags=["crm"])


@router.get("/crm/customers")
async def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    customers, total = await service.list_customers(skip, limit, status, search)
    return {"items": customers, "total": total, "skip": skip, "limit": limit}


@router.post("/crm/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.create_customer(data.model_dump())


@router.get("/crm/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.get_customer(customer_id)


@router.put("/crm/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    data: CustomerUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.update_customer(customer_id, data.model_dump(exclude_none=True))


@router.delete("/crm/customers/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    await service.delete_customer(customer_id)
    return {"message": "Customer deleted successfully"}


@router.get("/crm/leads")
async def list_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    assigned_to: Optional[UUID] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    leads, total = await service.list_leads(skip, limit, status, assigned_to)
    return {"items": leads, "total": total, "skip": skip, "limit": limit}


@router.post("/crm/leads", status_code=status.HTTP_201_CREATED)
async def create_lead(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.create_lead(data)


@router.get("/crm/leads/{lead_id}")
async def get_lead(
    lead_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.get_lead(lead_id)


@router.put("/crm/leads/{lead_id}")
async def update_lead(
    lead_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.update_lead(lead_id, data)


@router.delete("/crm/leads/{lead_id}")
async def delete_lead(
    lead_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    await service.delete_lead(lead_id)
    return {"message": "Lead deleted successfully"}


@router.put("/crm/leads/{lead_id}/stage")
async def update_lead_stage(
    lead_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.update_lead_stage(lead_id, data.get("status", ""))


@router.get("/crm/pipeline")
async def get_pipeline(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.get_pipeline_data()


@router.get("/crm/analytics")
async def get_crm_analytics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = CRMService(db)
    return await service.get_analytics()
