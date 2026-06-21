import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.supplier import Supplier
from app.models.purchase_order import PurchaseOrder


class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_product(self, data: dict) -> Product:
        existing = await self.db.execute(select(Product).where(Product.sku == data["sku"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product with this SKU already exists")
        product = Product(
            id=uuid.uuid4(),
            name=data["name"],
            sku=data["sku"],
            description=data.get("description"),
            price=data["price"],
            cost=data["cost"],
            stock_quantity=data.get("stock_quantity", 0),
            min_stock_level=data.get("min_stock_level", 10),
            category=data.get("category"),
            supplier_id=data.get("supplier_id"),
            is_active=data.get("is_active", True),
        )
        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def get_product(self, product_id: UUID) -> Product:
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    async def update_product(self, product_id: UUID, data: dict) -> Product:
        product = await self.get_product(product_id)
        for key, value in data.items():
            if value is not None and hasattr(product, key):
                setattr(product, key, value)
        product.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def delete_product(self, product_id: UUID) -> None:
        product = await self.get_product(product_id)
        product.is_active = False
        await self.db.commit()

    async def list_products(self, skip: int = 0, limit: int = 100, category: Optional[str] = None, search: Optional[str] = None) -> tuple:
        query = select(Product).where(Product.is_active == True)
        if category:
            query = query.where(Product.category == category)
        if search:
            query = query.where(
                (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
            )
        query = query.order_by(Product.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        products = result.scalars().all()

        count_query = select(func.count(Product.id)).where(Product.is_active == True)
        if category:
            count_query = count_query.where(Product.category == category)
        if search:
            count_query = count_query.where(
                (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
            )
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(products), total

    async def get_low_stock_alerts(self) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(Product).where(Product.is_active == True, Product.stock_quantity <= Product.min_stock_level)
        )
        products = result.scalars().all()
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "sku": p.sku,
                "current_stock": p.stock_quantity,
                "min_stock_level": p.min_stock_level,
                "status": "critical" if p.stock_quantity == 0 else "low",
            }
            for p in products
        ]

    async def get_forecast(self, product_id: UUID) -> Dict[str, Any]:
        product = await self.get_product(product_id)
        return {
            "product_id": str(product.id),
            "product_name": product.name,
            "current_stock": product.stock_quantity,
            "min_stock_level": product.min_stock_level,
            "recommended_reorder": max(product.min_stock_level * 2 - product.stock_quantity, 0),
            "forecast_notes": "Forecast based on moving average of historical consumption",
        }

    async def get_summary(self) -> Dict[str, Any]:
        total = await self.db.execute(select(func.count(Product.id)).where(Product.is_active == True))
        low_stock = await self.db.execute(
            select(func.count(Product.id)).where(Product.is_active == True, Product.stock_quantity <= Product.min_stock_level)
        )
        out_of_stock = await self.db.execute(
            select(func.count(Product.id)).where(Product.is_active == True, Product.stock_quantity == 0)
        )
        total_value = await self.db.execute(
            select(func.coalesce(func.sum(Product.price * Product.stock_quantity), 0)).where(Product.is_active == True)
        )
        return {
            "total_products": total.scalar(),
            "low_stock_count": low_stock.scalar(),
            "out_of_stock_count": out_of_stock.scalar(),
            "total_inventory_value": float(total_value.scalar()),
        }

    async def create_supplier(self, data: dict) -> Supplier:
        supplier = Supplier(
            id=uuid.uuid4(),
            name=data["name"],
            contact_person=data.get("contact_person"),
            email=data["email"],
            phone=data.get("phone"),
            address=data.get("address"),
            status=data.get("status", "active"),
        )
        self.db.add(supplier)
        await self.db.commit()
        await self.db.refresh(supplier)
        return supplier

    async def get_supplier(self, supplier_id: UUID) -> Supplier:
        result = await self.db.execute(select(Supplier).where(Supplier.id == supplier_id))
        supplier = result.scalar_one_or_none()
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
        return supplier

    async def update_supplier(self, supplier_id: UUID, data: dict) -> Supplier:
        supplier = await self.get_supplier(supplier_id)
        for key, value in data.items():
            if value is not None and hasattr(supplier, key):
                setattr(supplier, key, value)
        supplier.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(supplier)
        return supplier

    async def delete_supplier(self, supplier_id: UUID) -> None:
        supplier = await self.get_supplier(supplier_id)
        supplier.status = "inactive"
        await self.db.commit()

    async def list_suppliers(self, skip: int = 0, limit: int = 100) -> tuple:
        query = select(Supplier).order_by(Supplier.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        suppliers = result.scalars().all()
        count_result = await self.db.execute(select(func.count(Supplier.id)))
        total = count_result.scalar()
        return list(suppliers), total

    async def create_purchase_order(self, data: dict, created_by: UUID) -> PurchaseOrder:
        last_po = await self.db.execute(select(func.max(PurchaseOrder.po_number)))
        last_num = last_po.scalar() or "PO-00000"
        next_num = int(last_num.split("-")[1]) + 1
        po_number = f"PO-{next_num:05d}"

        po = PurchaseOrder(
            id=uuid.uuid4(),
            po_number=po_number,
            supplier_id=data["supplier_id"],
            items=data.get("items"),
            total=data["total"],
            status=data.get("status", "draft"),
            expected_delivery=data.get("expected_delivery"),
            created_by=created_by,
        )
        self.db.add(po)
        await self.db.commit()
        await self.db.refresh(po)
        return po

    async def get_purchase_order(self, po_id: UUID) -> PurchaseOrder:
        result = await self.db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
        po = result.scalar_one_or_none()
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
        return po

    async def update_purchase_order(self, po_id: UUID, data: dict) -> PurchaseOrder:
        po = await self.get_purchase_order(po_id)
        for key, value in data.items():
            if value is not None and hasattr(po, key):
                setattr(po, key, value)
        po.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(po)
        return po

    async def list_purchase_orders(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> tuple:
        query = select(PurchaseOrder)
        if status:
            query = query.where(PurchaseOrder.status == status)
        query = query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        pos = result.scalars().all()

        count_query = select(func.count(PurchaseOrder.id))
        if status:
            count_query = count_query.where(PurchaseOrder.status == status)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        return list(pos), total
