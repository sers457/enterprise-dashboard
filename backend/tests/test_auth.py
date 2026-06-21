import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(async_client: AsyncClient):
    response = await async_client.post("/api/v1/auth/register", json={
        "email": "newuser@test.com",
        "username": "newuser",
        "password": "StrongPass123!",
        "full_name": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["username"] == "newuser"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate(async_client: AsyncClient):
    await async_client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "username": "dupuser",
        "password": "StrongPass123!",
    })
    response = await async_client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "username": "dupuser",
        "password": "StrongPass123!",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login(async_client: AsyncClient):
    await async_client.post("/api/v1/auth/register", json={
        "email": "login@test.com",
        "username": "loginuser",
        "password": "StrongPass123!",
    })
    response = await async_client.post("/api/v1/auth/login", json={
        "email": "login@test.com",
        "password": "StrongPass123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient):
    response = await async_client.post("/api/v1/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "WrongPass123!",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_change_password(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.post("/api/v1/auth/change-password", headers=auth_headers, json={
        "old_password": "TestPass123!",
        "new_password": "NewPass12345!",
    })
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_refresh_token(async_client: AsyncClient):
    await async_client.post("/api/v1/auth/register", json={
        "email": "refresh@test.com",
        "username": "refreshuser",
        "password": "StrongPass123!",
    })
    login_resp = await async_client.post("/api/v1/auth/login", json={
        "email": "refresh@test.com",
        "password": "StrongPass123!",
    })
    tokens = login_resp.json()
    response = await async_client.post("/api/v1/auth/refresh", json={
        "refresh_token": tokens["refresh_token"],
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
