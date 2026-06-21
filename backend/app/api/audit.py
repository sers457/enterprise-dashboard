from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.services.audit_service import AuditService

router = APIRouter(tags=["audit"])


@router.get("/audit/logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    logs, total = await service.get_logs(skip, limit, user_id, action, resource, date_from, date_to)
    return {"items": logs, "total": total, "skip": skip, "limit": limit}


@router.get("/audit/logs/{log_id}")
async def get_audit_log(
    log_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    log = await service.get_log(log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found")
    return log


@router.get("/audit/user/{user_id}")
async def get_user_audit_logs(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    logs, total = await service.get_user_activity(user_id, skip, limit)
    return {"items": logs, "total": total, "skip": skip, "limit": limit}
