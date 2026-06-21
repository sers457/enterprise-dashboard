import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_product(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.post("/api/v1/inventory/products", headers=auth_headers, json={
        "name": "Test Product",
        "sku": "TST-001",
        "price": 99.99,
        "cost": 50.00,
        "stock_quantity": 100,
        "min_stock_level": 10,
        "category": "Testing",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["sku"] == "TST-001"


@pytest.mark.asyncio
async def test_list_products(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/inventory/products", headers=auth_headers)
    assert response.status_code == 200
    assert "items" in response.json()


@pytest.mark.asyncio
async def test_get_product(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/inventory/products", headers=auth_headers, json={
        "name": "Get Product",
        "sku": "TST-GET-001",
        "price": 49.99,
        "cost": 20.00,
    })
    product_id = create_resp.json()["id"]
    response = await async_client.get(f"/api/v1/inventory/products/{product_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Get Product"


@pytest.mark.asyncio
async def test_update_product(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/inventory/products", headers=auth_headers, json={
        "name": "Update Product",
        "sku": "TST-UPD-001",
        "price": 29.99,
        "cost": 10.00,
    })
    product_id = create_resp.json()["id"]
    response = await async_client.put(f"/api/v1/inventory/products/{product_id}", headers=auth_headers, json={
        "price": 39.99,
    })
    assert response.status_code == 200
    assert float(response.json()["price"]) == 39.99


@pytest.mark.asyncio
async def test_inventory_summary(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/inventory/summary", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_low_stock_alerts(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/inventory/alerts", headers=auth_headers)
    assert response.status_code == 200
    assert "alerts" in response.json()


@pytest.mark.asyncio
async def test_create_supplier(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.post("/api/v1/inventory/suppliers", headers=auth_headers, json={
        "name": "Test Supplier",
        "email": "supplier@test.com",
    })
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_list_suppliers(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/inventory/suppliers", headers=auth_headers)
    assert response.status_code == 200
