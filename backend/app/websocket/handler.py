import json
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect, status

from app.core.security import decode_token
from app.websocket.manager import manager


async def websocket_handler(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_uuid = UUID(user_id)
    await manager.connect(user_uuid, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                await manager.send_personal_message(user_uuid, {"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = message.get("type", "")

            if msg_type == "ping":
                await manager.send_personal_message(user_uuid, {"type": "pong"})

            elif msg_type == "subscribe":
                channel = message.get("channel", "")
                if channel:
                    manager.subscribe(user_uuid, channel)
                    await manager.send_personal_message(user_uuid, {
                        "type": "subscribed",
                        "channel": channel,
                    })

            elif msg_type == "unsubscribe":
                channel = message.get("channel", "")
                if channel:
                    manager.unsubscribe(user_uuid, channel)
                    await manager.send_personal_message(user_uuid, {
                        "type": "unsubscribed",
                        "channel": channel,
                    })

            else:
                await manager.send_personal_message(user_uuid, {
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}",
                })

    except WebSocketDisconnect:
        manager.disconnect(user_uuid, websocket)
    except Exception:
        manager.disconnect(user_uuid, websocket)
