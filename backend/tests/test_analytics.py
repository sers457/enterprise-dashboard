import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/analytics/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert "customers" in data
    assert "revenue" in data


@pytest.mark.asyncio
async def test_kpi(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/analytics/kpi", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "active_users" in data


@pytest.mark.asyncio
async def test_revenue(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/analytics/revenue?days=30", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_user_analytics(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/analytics/users", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_customer_analytics(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/analytics/customers", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_sales_data(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/analytics/sales", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_report(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/analytics/report?report_type=summary&format=json", headers=auth_headers)
    assert response.status_code == 200
