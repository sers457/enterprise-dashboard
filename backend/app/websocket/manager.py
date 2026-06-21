import json
from typing import Dict, List, Set, Optional
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[UUID, List[WebSocket]] = {}
        self.channels: Dict[str, Set[UUID]] = {}

    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: UUID, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        for channel, members in self.channels.items():
            if user_id in members:
                members.remove(user_id)

    async def send_personal_message(self, user_id: UUID, message: dict):
        if user_id in self.active_connections:
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(user_id, message)

    async def notify(self, user_id: UUID, notification: dict):
        await self.send_personal_message(user_id, {
            "type": "notification",
            "data": notification,
        })

    async def broadcast_to_channel(self, channel: str, message: dict):
        if channel in self.channels:
            for user_id in self.channels[channel]:
                await self.send_personal_message(user_id, {
                    "type": "channel",
                    "channel": channel,
                    "data": message,
                })

    def subscribe(self, user_id: UUID, channel: str):
        if channel not in self.channels:
            self.channels[channel] = set()
        self.channels[channel].add(user_id)

    def unsubscribe(self, user_id: UUID, channel: str):
        if channel in self.channels:
            self.channels[channel].discard(user_id)


manager = ConnectionManager()
