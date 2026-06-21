import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_users(async_client: AsyncClient, admin_headers: dict):
    response = await async_client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_list_users_unauthorized(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/users", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_user(async_client: AsyncClient, admin_headers: dict, test_user):
    response = await async_client.get(f"/api/v1/users/{test_user.id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["email"] == test_user.email


@pytest.mark.asyncio
async def test_update_user(async_client: AsyncClient, admin_headers: dict, test_user):
    response = await async_client.put(f"/api/v1/users/{test_user.id}", headers=admin_headers, json={
        "full_name": "Updated Name",
    })
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_user(async_client: AsyncClient, admin_headers: dict, test_user):
    response = await async_client.delete(f"/api/v1/users/{test_user.id}", headers=admin_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_role(async_client: AsyncClient, admin_headers: dict, test_user):
    response = await async_client.put(f"/api/v1/users/{test_user.id}/role", headers=admin_headers, json={
        "role": "manager",
    })
    assert response.status_code == 200
    assert response.json()["role"] == "manager"
