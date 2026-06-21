import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(self, user_id: UUID, type: str, title: str, message: Optional[str] = None, data: Optional[Dict[str, Any]] = None) -> Notification:
        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            data=data,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def get_user_notifications(self, user_id: UUID, skip: int = 0, limit: int = 50, unread_only: bool = False) -> tuple:
        query = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        notifications = result.scalars().all()

        count_query = select(func.count(Notification.id)).where(Notification.user_id == user_id)
        if unread_only:
            count_query = count_query.where(Notification.is_read == False)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(notifications), total

    async def get_unread_count(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read == False)
        )
        return result.scalar()

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> Notification:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        notification.is_read = True
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read == False)
        )
        count = result.scalar()

        result2 = await self.db.execute(
            select(Notification).where(Notification.user_id == user_id, Notification.is_read == False)
        )
        notifications = result2.scalars().all()
        for n in notifications:
            n.is_read = True
        await self.db.commit()
        return count

    async def delete_notification(self, notification_id: UUID, user_id: UUID) -> None:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        await self.db.delete(notification)
        await self.db.commit()
