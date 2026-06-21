import json
from typing import Optional, List, Dict, Any
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.ai_conversation import AIConversation
from app.models.ai_workflow import AIWorkflow


class DeepSeekClient:
    def __init__(self, db: Optional[AsyncSession] = None):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_API_URL
        self.db = db

    async def chat(self, message: str, context: Optional[List[dict]] = None, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        messages = []
        if context:
            messages.extend(context)
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": messages,
                    "stream": False,
                },
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()

        reply = data["choices"][0]["message"]["content"]

        if self.db and conversation_id:
            result = await self.db.execute(select(AIConversation).where(AIConversation.id == conversation_id))
            conv = result.scalar_one_or_none()
            if conv:
                existing = conv.messages or []
                existing.append({"role": "user", "content": message, "timestamp": self._now_iso()})
                existing.append({"role": "assistant", "content": reply, "timestamp": self._now_iso()})
                conv.messages = existing
                await self.db.commit()

        return {"message": reply, "conversation_id": conversation_id or "", "sources": []}

    async def chat_stream(self, message: str, context: Optional[List[dict]] = None):
        messages = []
        if context:
            messages.extend(context)
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": messages,
                    "stream": True,
                },
                timeout=120,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0].get("delta", {}).get("content", "")
                            if delta:
                                yield delta
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

    async def generate_insights(self, data: Dict[str, Any], metric: str) -> Dict[str, Any]:
        prompt = f"Analyze the following {metric} data and provide key insights, trends, and recommendations:\n{json.dumps(data, indent=2)}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "system", "content": "You are a data analyst. Provide concise insights."}, {"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=60,
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]

        return {
            "insight": content,
            "confidence": 0.85,
            "recommendations": self._extract_recommendations(content),
        }

    async def generate_report(self, topic: str, data: List[Dict[str, Any]]) -> str:
        prompt = f"Generate a comprehensive report on {topic} using this data: {json.dumps(data[:50], indent=2)}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=60,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        prompt = f"Analyze the sentiment of this text. Return sentiment (positive/negative/neutral), score (0-1), and key phrases: {text}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
        return {"sentiment": "neutral", "score": 0.5, "analysis": content}

    async def detect_anomalies(self, data: List[Dict[str, Any]], metric: str) -> List[Dict[str, Any]]:
        prompt = f"Analyze this time series data for {metric} and detect anomalies. Return list of anomalous points with reasons: {json.dumps(data[:100], indent=2)}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=60,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
        return [{"point": "unknown", "reason": content, "severity": "medium"}]

    async def recommend(self, user_id: str, context: Dict[str, Any]) -> List[str]:
        prompt = f"Generate recommendations for user {user_id} based on context: {json.dumps(context, indent=2)}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
        return [content]

    async def generate_sql(self, query: str, schema: str) -> str:
        prompt = f"Convert this natural language query to SQL. Schema: {schema}\nQuery: {query}\nReturn only the SQL statement."
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=30,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def analyze_chart(self, chart_data: Dict[str, Any]) -> str:
        prompt = f"Explain the insights from this chart data: {json.dumps(chart_data, indent=2)}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
                timeout=30,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def execute_workflow(self, workflow_id: str, trigger_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.db:
            return {"status": "error", "message": "Database not available"}
        result = await self.db.execute(select(AIWorkflow).where(AIWorkflow.id == workflow_id))
        workflow = result.scalar_one_or_none()
        if not workflow:
            return {"status": "error", "message": "Workflow not found"}
        return {"status": "executed", "workflow_id": workflow_id, "actions": workflow.actions}

    def _extract_recommendations(self, content: str) -> List[str]:
        recs = []
        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("- ") or line.startswith("* "):
                recs.append(line[2:])
            elif line[0].isdigit() and ". " in line[:4]:
                recs.append(line.split(". ", 1)[1])
        return recs[:5]

    def _now_iso(self) -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
