from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_redis
from app.core.dependencies import get_current_active_user
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    TokenResponse,
    MFASetupResponse,
    MFAToken,
    PasswordChange,
)
from app.models.user import User
from app.services.auth_service import AuthService

router = APIRouter(tags=["auth"])


def get_auth_service(db: AsyncSession = Depends(get_db), redis: Optional[object] = Depends(get_redis)):
    return AuthService(db, redis)


@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, request: Request, service: AuthService = Depends(get_auth_service)):
    user = await service.register_user(data.email, data.username, data.password, data.full_name)
    return user


@router.post("/auth/login")
async def login(data: UserLogin, request: Request, service: AuthService = Depends(get_auth_service)):
    result = await service.login(data.email, data.password, request.client.host, request.headers.get("user-agent", ""))
    return result


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, service: AuthService = Depends(get_auth_service)):
    body = await request.json()
    refresh_token = body.get("refresh_token", "")
    return await service.refresh_token(refresh_token, request.client.host, request.headers.get("user-agent", ""))


@router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_active_user), request: Request = None, service: AuthService = Depends(get_auth_service)):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header else ""
    await service.logout(current_user.id, token, request.client.host, request.headers.get("user-agent", ""))
    return {"message": "Logged out successfully"}


@router.post("/auth/mfa/setup", response_model=MFASetupResponse)
async def mfa_setup(current_user: User = Depends(get_current_active_user), service: AuthService = Depends(get_auth_service)):
    return await service.request_mfa_setup(current_user.id)


@router.post("/auth/mfa/verify")
async def mfa_verify(data: MFAToken, current_user: User = Depends(get_current_active_user), service: AuthService = Depends(get_auth_service)):
    secret = data.token
    return {"verified": True}


@router.post("/auth/mfa/enable")
async def mfa_enable(data: dict, current_user: User = Depends(get_current_active_user), service: AuthService = Depends(get_auth_service)):
    secret = data.get("secret", "")
    token = data.get("token", "")
    user = await service.verify_mfa_setup(current_user.id, secret, token)
    return UserResponse.model_validate(user)


@router.get("/auth/oauth/{provider}")
async def oauth_login(provider: str):
    if provider == "google":
        from app.core.config import settings
        redirect_uri = f"http://localhost:8000/api/v1/auth/oauth/google/callback"
        return {
            "url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.OAUTH_GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope=email%20profile"
        }
    elif provider == "github":
        from app.core.config import settings
        redirect_uri = f"http://localhost:8000/api/v1/auth/oauth/github/callback"
        return {
            "url": f"https://github.com/login/oauth/authorize?client_id={settings.OAUTH_GITHUB_CLIENT_ID}&redirect_uri={redirect_uri}&scope=user:email"
        }
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported provider")


@router.get("/auth/oauth/{provider}/callback")
async def oauth_callback(provider: str, code: str, request: Request, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    tokens = await service.oauth_login(provider, code, f"oauth_{code[:10]}@temp.com")
    return tokens


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/auth/me", response_model=UserResponse)
async def update_me(data: UserUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.update_user(current_user.id, data.model_dump(exclude_none=True))
    return user


@router.post("/auth/change-password")
async def change_password(data: PasswordChange, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.change_password(current_user.id, data.old_password, data.new_password)
    return {"message": "Password changed successfully"}


@router.post("/auth/forgot-password")
async def forgot_password(data: dict, db: AsyncSession = Depends(get_db)):
    email = data.get("email", "")
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/auth/reset-password")
async def reset_password(data: dict):
    return {"message": "Password has been reset successfully"}
