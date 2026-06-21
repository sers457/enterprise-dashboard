import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_workflow(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.post("/api/v1/ai/workflows", headers=auth_headers, json={
        "name": "Test Workflow",
        "description": "A test workflow",
        "trigger_type": "manual",
        "actions": [{"type": "notification", "config": {"title": "Test", "message": "Hello"}}],
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Workflow"


@pytest.mark.asyncio
async def test_list_workflows(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/ai/workflows", headers=auth_headers)
    assert response.status_code == 200
    assert "items" in response.json()


@pytest.mark.asyncio
async def test_get_workflow(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/ai/workflows", headers=auth_headers, json={
        "name": "Get WF",
        "description": "Get test",
        "trigger_type": "manual",
    })
    wf_id = create_resp.json()["id"]
    response = await async_client.get(f"/api/v1/ai/workflows/{wf_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Get WF"


@pytest.mark.asyncio
async def test_update_workflow(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/ai/workflows", headers=auth_headers, json={
        "name": "Update WF",
        "description": "Update test",
        "trigger_type": "manual",
    })
    wf_id = create_resp.json()["id"]
    response = await async_client.put(f"/api/v1/ai/workflows/{wf_id}", headers=auth_headers, json={
        "name": "Updated WF",
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Updated WF"


@pytest.mark.asyncio
async def test_delete_workflow(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/ai/workflows", headers=auth_headers, json={
        "name": "Delete WF",
        "trigger_type": "manual",
    })
    wf_id = create_resp.json()["id"]
    response = await async_client.delete(f"/api/v1/ai/workflows/{wf_id}", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_conversations(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/ai/conversations", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_execute_workflow(async_client: AsyncClient, auth_headers: dict):
    create_resp = await async_client.post("/api/v1/ai/workflows", headers=auth_headers, json={
        "name": "Exec WF",
        "trigger_type": "manual",
        "actions": [{"type": "notification", "config": {"title": "Exec", "message": "Running"}}],
    })
    wf_id = create_resp.json()["id"]
    response = await async_client.post(f"/api/v1/ai/workflows/{wf_id}/execute", headers=auth_headers, json={})
    assert response.status_code == 200
