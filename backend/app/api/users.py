from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user, get_current_active_user
from app.schemas.user import UserUpdate, UserResponse
from app.models.user import User
from app.services.user_service import UserService

router = APIRouter(tags=["users"])


@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    users, total = await service.list_users(skip, limit, role, search)
    return {"items": users, "total": total, "skip": skip, "limit": limit}


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.get_user(user_id)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.update_user(user_id, data.model_dump(exclude_none=True))


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.delete_user(user_id)
    return {"message": "User deleted successfully"}


@router.get("/users/{user_id}/sessions")
async def get_user_sessions(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    sessions = await service.get_user_sessions(user_id)
    return {"items": sessions}


@router.delete("/users/{user_id}/sessions/{session_id}")
async def delete_user_session(
    user_id: UUID,
    session_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.delete_user_session(user_id, session_id)
    return {"message": "Session deleted successfully"}


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    return await service.update_role(user_id, data.get("role", "user"))


@router.post("/users/{user_id}/permissions")
async def add_user_permission(
    user_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    perm = await service.add_permission(user_id, data.get("permission", ""), data.get("resource", ""))
    return perm


@router.delete("/users/{user_id}/permissions/{permission_id}")
async def remove_user_permission(
    user_id: UUID,
    permission_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.remove_permission(user_id, permission_id)
    return {"message": "Permission removed successfully"}
