import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

from models import VoiceInitiateRequest
import session_store
from services import voice_service

router = APIRouter()


@router.post("/initiate")
async def initiate_call(body: VoiceInitiateRequest) -> dict[str, object]:
    """Initiate a Vapi.ai outbound call using the patient's phone from session."""
    phone = session_store.get_patient_data(body.session_id).get("phone", "")

    if not phone:
        raise HTTPException(
            status_code=400,
            detail="No phone number found for this session. Please complete intake first.",
        )

    result = await voice_service.initiate_voice_call(body.session_id, phone)

    return {
        "success": result["success"],
        "call_id": result["call_id"],
        "message": (
            "Call initiated successfully. You will receive a call shortly."
            if result["success"]
            else "Failed to initiate call. Please try again."
        ),
    }


@router.get("/status/{call_id}")
async def get_call_status(call_id: str) -> Any:
    """Return the full Vapi call object for the given call_id."""
    api_key = os.environ.get("VAPI_API_KEY", "")

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"https://api.vapi.ai/call/{call_id}",
            headers={"Authorization": f"Bearer {api_key}"},
        )

    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()
