import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_customer(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.post("/api/v1/crm/customers", headers=auth_headers, json={
        "name": "Test Customer",
        "email": "customer@test.com",
        "status": "lead",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Customer"
    assert data["email"] == "customer@test.com"


@pytest.mark.asyncio
async def test_list_customers(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/crm/customers", headers=auth_headers)
    assert response.status_code == 200
    assert "items" in response.json()


@pytest.mark.asyncio
async def test_get_customer(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/crm/customers", headers=auth_headers, json={
        "name": "Get Test",
        "email": "gettest@test.com",
    })
    customer_id = create_resp.json()["id"]
    response = await async_client.get(f"/api/v1/crm/customers/{customer_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Get Test"


@pytest.mark.asyncio
async def test_update_customer(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/crm/customers", headers=auth_headers, json={
        "name": "Update Test",
        "email": "updatetest@test.com",
    })
    customer_id = create_resp.json()["id"]
    response = await async_client.put(f"/api/v1/crm/customers/{customer_id}", headers=auth_headers, json={
        "name": "Updated Name",
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_customer(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/crm/customers", headers=auth_headers, json={
        "name": "Delete Test",
        "email": "deletetest@test.com",
    })
    customer_id = create_resp.json()["id"]
    response = await async_client.delete(f"/api/v1/crm/customers/{customer_id}", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_crm_pipeline(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/crm/pipeline", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_crm_analytics(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/crm/analytics", headers=auth_headers)
    assert response.status_code == 200
