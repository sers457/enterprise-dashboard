import uuid
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_permission import UserPermission
from app.models.user_session import UserSession
from app.models.audit_log import AuditLog


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user(self, user_id: UUID) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_user(self, user_id: UUID, data: dict) -> User:
        user = await self.get_user(user_id)
        allowed_fields = {"full_name", "avatar_url", "role", "is_active"}
        for key, value in data.items():
            if key in allowed_fields and value is not None:
                setattr(user, key, value)
        user.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: UUID) -> None:
        user = await self.get_user(user_id)
        user.deleted_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def list_users(self, skip: int = 0, limit: int = 100, role: Optional[str] = None, search: Optional[str] = None) -> tuple:
        query = select(User).where(User.deleted_at.is_(None))
        if role:
            query = query.where(User.role == role)
        if search:
            query = query.where(
                (User.email.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
            )
        query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        users = result.scalars().all()

        count_query = select(func.count(User.id)).where(User.deleted_at.is_(None))
        if role:
            count_query = count_query.where(User.role == role)
        if search:
            count_query = count_query.where(
                (User.email.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
            )
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(users), total

    async def get_user_sessions(self, user_id: UUID) -> List[UserSession]:
        result = await self.db.execute(
            select(UserSession).where(UserSession.user_id == user_id, UserSession.is_active == True)
        )
        return list(result.scalars().all())

    async def delete_user_session(self, user_id: UUID, session_id: UUID) -> None:
        result = await self.db.execute(
            select(UserSession).where(UserSession.id == session_id, UserSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        session.is_active = False
        await self.db.commit()

    async def update_role(self, user_id: UUID, role: str) -> User:
        valid_roles = {"user", "admin", "superadmin", "manager"}
        if role not in valid_roles:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role. Must be one of: {valid_roles}")
        user = await self.get_user(user_id)
        user.role = role
        user.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def add_permission(self, user_id: UUID, permission: str, resource: str) -> UserPermission:
        perm = UserPermission(
            id=uuid.uuid4(),
            user_id=user_id,
            permission=permission,
            resource=resource,
        )
        self.db.add(perm)
        await self.db.commit()
        await self.db.refresh(perm)
        return perm

    async def remove_permission(self, user_id: UUID, permission_id: UUID) -> None:
        result = await self.db.execute(
            select(UserPermission).where(UserPermission.id == permission_id, UserPermission.user_id == user_id)
        )
        perm = result.scalar_one_or_none()
        if not perm:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
        await self.db.delete(perm)
        await self.db.commit()
