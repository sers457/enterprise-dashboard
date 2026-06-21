from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.models.user import User
from app.services.inventory_service import InventoryService

router = APIRouter(tags=["inventory"])


@router.get("/inventory/products")
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    products, total = await service.list_products(skip, limit, category, search)
    return {"items": products, "total": total, "skip": skip, "limit": limit}


@router.post("/inventory/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.create_product(data.model_dump())


@router.get("/inventory/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.get_product(product_id)


@router.put("/inventory/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.update_product(product_id, data.model_dump(exclude_none=True))


@router.delete("/inventory/products/{product_id}")
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    await service.delete_product(product_id)
    return {"message": "Product deleted successfully"}


@router.get("/inventory/products/{product_id}/forecast")
async def get_product_forecast(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.get_forecast(product_id)


@router.get("/inventory/purchase-orders")
async def list_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    pos, total = await service.list_purchase_orders(skip, limit, status)
    return {"items": pos, "total": total, "skip": skip, "limit": limit}


@router.post("/inventory/purchase-orders", status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.create_purchase_order(data, current_user.id)


@router.get("/inventory/purchase-orders/{po_id}")
async def get_purchase_order(
    po_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.get_purchase_order(po_id)


@router.put("/inventory/purchase-orders/{po_id}")
async def update_purchase_order(
    po_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.update_purchase_order(po_id, data)


@router.get("/inventory/suppliers")
async def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    suppliers, total = await service.list_suppliers(skip, limit)
    return {"items": suppliers, "total": total, "skip": skip, "limit": limit}


@router.post("/inventory/suppliers", status_code=status.HTTP_201_CREATED)
async def create_supplier(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.create_supplier(data)


@router.get("/inventory/suppliers/{supplier_id}")
async def get_supplier(
    supplier_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.get_supplier(supplier_id)


@router.put("/inventory/suppliers/{supplier_id}")
async def update_supplier(
    supplier_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.update_supplier(supplier_id, data)


@router.delete("/inventory/suppliers/{supplier_id}")
async def delete_supplier(
    supplier_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    await service.delete_supplier(supplier_id)
    return {"message": "Supplier deleted successfully"}


@router.get("/inventory/alerts")
async def get_low_stock_alerts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return {"alerts": await service.get_low_stock_alerts()}


@router.get("/inventory/summary")
async def get_inventory_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = InventoryService(db)
    return await service.get_summary()
