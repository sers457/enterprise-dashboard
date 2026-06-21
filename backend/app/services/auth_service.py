import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
    get_password_hash,
    generate_mfa_secret,
    verify_mfa_token,
    generate_mfa_qr,
)
from app.models.user import User
from app.models.user_session import UserSession
from app.models.audit_log import AuditLog


class AuthService:
    def __init__(self, db: AsyncSession, redis: Optional[object] = None):
        self.db = db
        self.redis = redis

    async def register_user(self, email: str, username: str, password: str, full_name: Optional[str] = None) -> User:
        existing = await self.db.execute(
            select(User).where((User.email == email) | (User.username == username))
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username already exists")

        user = User(
            id=uuid.uuid4(),
            email=email,
            username=username,
            hashed_password=get_password_hash(password),
            full_name=full_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def login(self, email: str, password: str, ip_address: str = "", user_agent: str = "") -> dict:
        result = await self.db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if user.mfa_enabled:
            return {"mfa_required": True, "user_id": str(user.id)}

        tokens = await self._create_tokens(user, ip_address, user_agent)
        user.last_login = datetime.now(timezone.utc)
        await self.db.commit()

        await self._log_audit(user.id, "login", "auth", str(user.id), {"method": "password"}, ip_address, user_agent)
        return tokens

    async def refresh_token(self, refresh_token: str, ip_address: str = "", user_agent: str = "") -> dict:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        result = await self.db.execute(
            select(UserSession).where(
                UserSession.refresh_token == refresh_token,
                UserSession.is_active == True,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")

        result = await self.db.execute(select(User).where(User.id == session.user_id, User.deleted_at.is_(None)))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

        session.is_active = False
        tokens = await self._create_tokens(user, ip_address, user_agent)
        await self.db.commit()
        return tokens

    async def logout(self, user_id: UUID, token: str, ip_address: str = "", user_agent: str = "") -> None:
        result = await self.db.execute(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.token == token,
                UserSession.is_active == True,
            )
        )
        session = result.scalar_one_or_none()
        if session:
            session.is_active = False
            await self.db.commit()

        await self._log_audit(user_id, "logout", "auth", str(user_id), {}, ip_address, user_agent)

    async def request_mfa_setup(self, user_id: UUID) -> dict:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        secret = generate_mfa_secret()
        qr_code = generate_mfa_qr(secret, user.email)
        return {"secret": secret, "qr_code": qr_code}

    async def verify_mfa_setup(self, user_id: UUID, secret: str, token: str) -> User:
        if not verify_mfa_token(secret, token):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid MFA token")

        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.mfa_secret = secret
        user.mfa_enabled = True
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def verify_mfa(self, user_id: UUID, token: str, ip_address: str = "", user_agent: str = "") -> dict:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.mfa_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA not configured")

        if not verify_mfa_token(user.mfa_secret, token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA token")

        tokens = await self._create_tokens(user, ip_address, user_agent)
        user.last_login = datetime.now(timezone.utc)
        await self.db.commit()

        await self._log_audit(user.id, "login_mfa", "auth", str(user.id), {"method": "mfa"}, ip_address, user_agent)
        return tokens

    async def oauth_login(self, provider: str, oauth_id: str, email: str, full_name: Optional[str] = None) -> dict:
        result = await self.db.execute(
            select(User).where(
                User.oauth_provider == provider,
                User.oauth_id == oauth_id,
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            existing = await self.db.execute(select(User).where(User.email == email))
            user = existing.scalar_one_or_none()
            if user:
                user.oauth_provider = provider
                user.oauth_id = oauth_id
            else:
                username = email.split("@")[0]
                user = User(
                    id=uuid.uuid4(),
                    email=email,
                    username=username,
                    hashed_password=get_password_hash(uuid.uuid4().hex),
                    full_name=full_name,
                    oauth_provider=provider,
                    oauth_id=oauth_id,
                    is_verified=True,
                )
                self.db.add(user)

            await self.db.commit()
            await self.db.refresh(user)

        tokens = await self._create_tokens(user, "", "")
        user.last_login = datetime.now(timezone.utc)
        await self.db.commit()
        return tokens

    async def get_user_by_id(self, user_id: UUID) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
        return result.scalar_one_or_none()

    async def update_user(self, user_id: UUID, update_data: dict) -> User:
        user = await self.get_user_by_id(user_id)
        for key, value in update_data.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        user.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: UUID) -> None:
        user = await self.get_user_by_id(user_id)
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

    async def change_password(self, user_id: UUID, old_password: str, new_password: str) -> None:
        user = await self.get_user_by_id(user_id)
        if not verify_password(old_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        user.hashed_password = get_password_hash(new_password)
        await self.db.commit()

    async def _create_tokens(self, user: User, ip_address: str, user_agent: str) -> dict:
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
        access_token = create_access_token({**token_data, "type": "access"})
        refresh_token = create_refresh_token({**token_data, "type": "refresh"})

        session = UserSession(
            id=uuid.uuid4(),
            user_id=user.id,
            token=access_token,
            refresh_token=refresh_token,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(session)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def _log_audit(self, user_id: UUID, action: str, resource: str, resource_id: str, details: dict, ip_address: str, user_agent: str) -> None:
        log = AuditLog(
            id=uuid.uuid4(),
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log)
        await self.db.commit()
