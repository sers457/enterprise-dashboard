import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_transaction(async_client: AsyncClient, auth_headers: dict):
    from datetime import datetime, timezone
    response = await async_client.post("/api/v1/finance/transactions", headers=auth_headers, json={
        "type": "revenue",
        "amount": 1000.00,
        "category": "product_sales",
        "description": "Test transaction",
        "date": datetime.now(timezone.utc).isoformat(),
    })
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_list_transactions(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/finance/transactions", headers=auth_headers)
    assert response.status_code == 200
    assert "items" in response.json()


@pytest.mark.asyncio
async def test_create_invoice(async_client: AsyncClient, auth_headers: dict):
    from datetime import datetime, timezone, timedelta
    cust_resp = await async_client.post("/api/v1/crm/customers", headers=auth_headers, json={
        "name": "Invoice Customer",
        "email": "invoice@test.com",
    })
    customer_id = cust_resp.json()["id"]
    response = await async_client.post("/api/v1/finance/invoices", headers=auth_headers, json={
        "customer_id": customer_id,
        "amount": 5000.00,
        "tax": 500.00,
        "status": "draft",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
    })
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_list_invoices(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/finance/invoices", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_finance_summary(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/finance/summary", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_finance_revenue(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/finance/revenue?days=30", headers=auth_headers)
    assert response.status_code == 200
