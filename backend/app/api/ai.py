from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.ai import ChatRequest, ChatResponse, WorkflowCreate, WorkflowUpdate, WorkflowResponse, InsightRequest, InsightResponse
from app.models.user import User
from app.models.ai_conversation import AIConversation
from app.models.ai_workflow import AIWorkflow
from app.ai.deepseek_client import DeepSeekClient
from app.ai.workflow_engine import WorkflowEngine

router = APIRouter(tags=["ai"])


@router.post("/ai/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)
    result = await client.chat(data.message, data.context, data.conversation_id)
    if data.conversation_id:
        return ChatResponse(message=result["message"], conversation_id=data.conversation_id, sources=result.get("sources"))
    conv = AIConversation(
        id=UUID(result["conversation_id"]) if result["conversation_id"] else None,
        user_id=current_user.id,
        title=data.message[:50],
        messages=[{"role": "user", "content": data.message}, {"role": "assistant", "content": result["message"]}],
    )
    if not result["conversation_id"]:
        import uuid
        conv.id = uuid.uuid4()
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        result["conversation_id"] = str(conv.id)
    return ChatResponse(message=result["message"], conversation_id=result["conversation_id"], sources=result.get("sources"))


@router.post("/ai/chat/stream")
async def chat_stream(
    data: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)

    async def event_generator():
        async for chunk in client.chat_stream(data.message, data.context):
            yield {"event": "message", "data": chunk}

    return EventSourceResponse(event_generator())


@router.get("/ai/conversations")
async def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AIConversation).where(AIConversation.user_id == current_user.id).order_by(AIConversation.updated_at.desc()).offset(skip).limit(limit)
    )
    conversations = result.scalars().all()
    return {"items": conversations, "skip": skip, "limit": limit}


@router.get("/ai/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AIConversation).where(AIConversation.id == conversation_id, AIConversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conv


@router.delete("/ai/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AIConversation).where(AIConversation.id == conversation_id, AIConversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()
    return {"message": "Conversation deleted"}


@router.post("/ai/insights", response_model=InsightResponse)
async def get_insights(
    data: InsightRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)
    result = await client.generate_insights(data.data, data.metric)
    return InsightResponse(**result)


@router.post("/ai/analyze")
async def analyze_data(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)
    text = data.get("text", "")
    chart_data = data.get("chart_data", {})
    if text:
        return await client.analyze_sentiment(text)
    if chart_data:
        return {"analysis": await client.analyze_chart(chart_data)}
    return {"message": "No data to analyze"}


@router.post("/ai/sql-query")
async def generate_sql_query(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)
    query = data.get("query", "")
    schema = data.get("schema", "")
    sql = await client.generate_sql(query, schema)
    return {"sql": sql}


@router.post("/ai/report")
async def generate_ai_report(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)
    topic = data.get("topic", "")
    report_data = data.get("data", [])
    report = await client.generate_report(topic, report_data)
    return {"report": report}


@router.post("/ai/anomalies")
async def detect_anomalies(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)
    metric = data.get("metric", "")
    dataset = data.get("data", [])
    return {"anomalies": await client.detect_anomalies(dataset, metric)}


@router.post("/ai/recommendations")
async def get_recommendations(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    client = DeepSeekClient(db)
    context = data.get("context", {})
    recs = await client.recommend(str(current_user.id), context)
    return {"recommendations": recs}


@router.get("/ai/workflows")
async def list_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AIWorkflow).order_by(AIWorkflow.created_at.desc()).offset(skip).limit(limit)
    )
    workflows = result.scalars().all()
    return {"items": workflows, "skip": skip, "limit": limit}


@router.post("/ai/workflows", status_code=status.HTTP_201_CREATED)
async def create_workflow(
    data: WorkflowCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    import uuid
    workflow = AIWorkflow(
        id=uuid.uuid4(),
        name=data.name,
        description=data.description,
        trigger_type=data.trigger_type,
        trigger_config=data.trigger_config,
        actions=data.actions,
        created_by=current_user.id,
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.get("/ai/workflows/{workflow_id}")
async def get_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AIWorkflow).where(AIWorkflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return workflow


@router.put("/ai/workflows/{workflow_id}")
async def update_workflow(
    workflow_id: UUID,
    data: WorkflowUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AIWorkflow).where(AIWorkflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(workflow, key, value)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/ai/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AIWorkflow).where(AIWorkflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    await db.delete(workflow)
    await db.commit()
    return {"message": "Workflow deleted"}


@router.post("/ai/workflows/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: UUID,
    data: dict = {},
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    engine = WorkflowEngine(db)
    return await engine.execute_workflow(workflow_id, data.get("trigger_data"))
