from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.analytics import router as analytics_router
from app.api.crm import router as crm_router
from app.api.finance import router as finance_router
from app.api.inventory import router as inventory_router
from app.api.ai import router as ai_router
from app.api.notifications import router as notifications_router
from app.api.audit import router as audit_router
from app.api.upload import router as upload_router

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(analytics_router)
v1_router.include_router(crm_router)
v1_router.include_router(finance_router)
v1_router.include_router(inventory_router)
v1_router.include_router(ai_router)
v1_router.include_router(notifications_router)
v1_router.include_router(audit_router)
v1_router.include_router(upload_router)
