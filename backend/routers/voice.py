import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

from models import VoiceInitiateRequest
import session_store
from services import voice_service, ai_service
from services.email_service import send_booking_confirmation

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


@router.post("/webhook")
async def vapi_webhook(payload: dict) -> dict[str, Any]:
    """
    Receive Vapi.ai webhook events.
    On end-of-call-report: analyze transcript for booking, persist to session,
    send confirmation email, and flag the session as voice_booking_complete.
    """
    message = payload.get("message", {})
    event_type = message.get("type", "")

    print(f"[voice] Webhook received: {event_type}")

    if event_type == "end-of-call-report":
        call = message.get("call", {})
        metadata = call.get("metadata", {})
        session_id = metadata.get("session_id")
        transcript = message.get("transcript", "")

        if not session_id:
            print("[voice] No session_id in call metadata — cannot link to session")
            return {"received": True}

        print(f"[voice] Call ended for session {session_id}")
        print(f"[voice] Transcript length: {len(transcript)} chars")

        if transcript:
            analysis = ai_service.analyze_call_transcript(transcript)
            print(f"[voice] Transcript analysis: {analysis}")

            if analysis.get("appointment_booked"):
                booking = {
                    "confirmed": True,
                    "doctor": analysis.get("doctor_name"),
                    "date": analysis.get("date"),
                    "time": analysis.get("time"),
                }

                patient_data = session_store.get_patient_data(session_id)
                session_store.update_patient_data(session_id, {
                    "booking": booking,
                    "voice_booking_complete": True,
                })
                print(f"[voice] Booking saved to session {session_id}: {booking}")

                await send_booking_confirmation(patient_data, booking)

    return {"received": True}


@router.get("/call-status/{session_id}")
async def get_voice_call_status(session_id: str) -> dict[str, Any]:
    """
    Poll endpoint for the frontend to check if a voice call resulted in a booking.
    Returns booking_complete flag and booking details (if any).
    """
    patient_data = session_store.get_patient_data(session_id)
    booking_complete: bool = patient_data.get("voice_booking_complete", False)
    booking = patient_data.get("booking") if booking_complete else None

    return {
        "booking_complete": booking_complete,
        "booking": booking,
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
