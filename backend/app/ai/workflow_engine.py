import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_workflow import AIWorkflow
from app.models.notification import Notification


class WorkflowEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_workflow(self, workflow_id: UUID, trigger_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        result = await self.db.execute(select(AIWorkflow).where(AIWorkflow.id == workflow_id, AIWorkflow.is_active == True))
        workflow = result.scalar_one_or_none()
        if not workflow:
            return {"status": "error", "message": "Workflow not found or inactive"}

        if not workflow.actions:
            return {"status": "completed", "message": "No actions to execute"}

        results = []
        for action in workflow.actions:
            action_type = action.get("type")
            action_config = action.get("config", {})
            if trigger_data:
                action_config.update(trigger_data)

            if action_type == "notification":
                result = await self._send_notification(action_config)
            elif action_type == "report":
                result = await self._generate_report(action_config)
            elif action_type == "update_data":
                result = await self._update_data(action_config)
            elif action_type == "webhook":
                result = await self._call_webhook(action_config)
            else:
                result = {"status": "skipped", "reason": f"Unknown action type: {action_type}"}

            results.append(result)

        return {"status": "completed", "workflow_id": str(workflow_id), "results": results}

    async def evaluate_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> bool:
        field = condition.get("field")
        operator = condition.get("operator", "eq")
        value = condition.get("value")

        actual = context.get(field)
        if actual is None:
            return False

        if operator == "eq":
            return actual == value
        elif operator == "neq":
            return actual != value
        elif operator == "gt":
            return actual > value
        elif operator == "gte":
            return actual >= value
        elif operator == "lt":
            return actual < value
        elif operator == "lte":
            return actual <= value
        elif operator == "in":
            return actual in value
        elif operator == "contains":
            return value in actual
        return False

    async def _send_notification(self, config: dict) -> Dict[str, Any]:
        import uuid
        user_id = config.get("user_id")
        title = config.get("title", "Workflow Notification")
        message = config.get("message", "")
        notif_type = config.get("type", "workflow")

        if user_id:
            notification = Notification(
                id=uuid.uuid4(),
                user_id=user_id,
                type=notif_type,
                title=title,
                message=message,
                data=config.get("data"),
            )
            self.db.add(notification)
            await self.db.commit()

        return {"status": "sent", "type": "notification", "user_id": str(user_id) if user_id else None}

    async def _generate_report(self, config: dict) -> Dict[str, Any]:
        topic = config.get("topic", "General")
        return {"status": "generated", "type": "report", "topic": topic}

    async def _update_data(self, config: dict) -> Dict[str, Any]:
        model_name = config.get("model")
        record_id = config.get("record_id")
        updates = config.get("updates", {})
        return {"status": "updated", "type": "data_update", "model": model_name, "record_id": record_id, "updates": updates}

    async def _call_webhook(self, config: dict) -> Dict[str, Any]:
        url = config.get("url")
        payload = config.get("payload", {})
        method = config.get("method", "POST")

        if not url:
            return {"status": "error", "message": "No webhook URL provided"}

        try:
            async with httpx.AsyncClient() as client:
                if method.upper() == "GET":
                    resp = await client.get(url, params=payload, timeout=30)
                else:
                    resp = await client.post(url, json=payload, timeout=30)
                return {"status": "called", "url": url, "response_code": resp.status_code}
        except Exception as e:
            return {"status": "error", "message": str(e)}
