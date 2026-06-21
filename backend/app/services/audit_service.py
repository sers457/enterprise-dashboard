import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_action(
        self,
        user_id: Optional[UUID],
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        audit_log = AuditLog(
            id=uuid.uuid4(),
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit_log)
        await self.db.commit()
        await self.db.refresh(audit_log)
        return audit_log

    async def get_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[UUID] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple:
        query = select(AuditLog)
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if resource:
            query = query.where(AuditLog.resource == resource)
        if date_from:
            query = query.where(AuditLog.timestamp >= date_from)
        if date_to:
            query = query.where(AuditLog.timestamp <= date_to)
        query = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        logs = result.scalars().all()

        count_query = select(func.count(AuditLog.id))
        if user_id:
            count_query = count_query.where(AuditLog.user_id == user_id)
        if action:
            count_query = count_query.where(AuditLog.action == action)
        if resource:
            count_query = count_query.where(AuditLog.resource == resource)
        if date_from:
            count_query = count_query.where(AuditLog.timestamp >= date_from)
        if date_to:
            count_query = count_query.where(AuditLog.timestamp <= date_to)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(logs), total

    async def get_log(self, log_id: UUID) -> AuditLog:
        result = await self.db.execute(select(AuditLog).where(AuditLog.id == log_id))
        log = result.scalar_one_or_none()
        if not log:
            return None
        return log

    async def get_user_activity(self, user_id: UUID, skip: int = 0, limit: int = 50) -> tuple:
        return await self.get_logs(skip=skip, limit=limit, user_id=user_id)
