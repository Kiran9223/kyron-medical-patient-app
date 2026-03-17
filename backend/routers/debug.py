from typing import Any

from fastapi import APIRouter

import session_store

router = APIRouter()


@router.get("/session/{session_id}")
async def get_session_debug(session_id: str) -> dict[str, Any]:
    """Return full session state for debugging — not for production use."""
    history = session_store.get_history(session_id)
    patient_data = session_store.get_patient_data(session_id)

    return {
        "session_id": session_id,
        "conversation_history": history,
        "patient_data": patient_data,
        "message_count": len(history),
    }
