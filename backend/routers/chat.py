from typing import Any

from fastapi import APIRouter, Body

from models import ChatMessage, ChatResponse
import session_store
from services import ai_service
from data.doctors import get_doctor_by_specialty, get_slots_by_doctor

router = APIRouter()


def _build_slot_context(reason: str) -> str:
    """
    If the reason for visit matches a doctor, return a context string
    listing their available slots so Kyra can answer slot questions
    conversationally (e.g. 'do you have a Tuesday?').
    """
    doctor = get_doctor_by_specialty(reason)
    if not doctor:
        return ""

    slots = get_slots_by_doctor(doctor.doctor_id)
    if not slots:
        return ""

    slot_lines = "\n".join(
        f"  - {s.display}" for s in slots[:12]
    )
    return (
        f"Patient intake is complete. Reason for visit: '{reason}'.\n"
        f"Matched doctor: {doctor.name} ({doctor.specialty}).\n"
        f"Available slots visible in the appointment picker UI:\n{slot_lines}\n\n"
        f"You may reference specific days/times conversationally to help the patient choose. "
        f"Do NOT reveal slot IDs. The patient books by clicking a card in the UI."
    )


@router.post("/", response_model=ChatResponse)
async def send_message(body: ChatMessage) -> ChatResponse:
    """
    Main chat endpoint. Sends the patient's message to Kyra and returns
    her reply along with workflow signals (intake/booking complete).
    """
    patient_data = session_store.get_patient_data(body.session_id)

    # Inject slot context after intake so Kyra can answer schedule questions
    reason = patient_data.get("reason_for_visit", "")
    extra_context = _build_slot_context(reason) if reason else ""

    clean_reply, markers, extracted = ai_service.get_kyra_response(
        body.session_id, body.message, extra_context
    )

    intake_complete = "##INTAKE_COMPLETE##" in markers
    booking_complete = "##BOOKING_COMPLETE##" in markers

    # Store reason and phone extracted by Kyra when intake completes
    if intake_complete:
        updates: dict[str, str] = {}
        if extracted.get("reason"):
            updates["reason_for_visit"] = extracted["reason"]
        if extracted.get("phone"):
            updates["phone"] = extracted["phone"]
        if updates:
            session_store.update_patient_data(body.session_id, updates)

        # Extract all structured fields (first_name, last_name, dob, email, etc.)
        # from the full conversation history via a separate Claude call
        structured = ai_service.extract_patient_data(body.session_id)
        if structured:
            session_store.update_patient_data(body.session_id, structured)

        print(
            "[chat] Patient data at intake complete:",
            session_store.get_patient_data(body.session_id),
        )

    patient_data_out = (
        session_store.get_patient_data(body.session_id) if intake_complete else None
    )

    return ChatResponse(
        session_id=body.session_id,
        response=clean_reply,
        intake_complete=intake_complete,
        booking_complete=booking_complete,
        patient_data=patient_data_out or None,
    )


@router.get("/history/{session_id}")
async def get_history(session_id: str) -> dict[str, Any]:
    """Return the full conversation history for a session."""
    return {
        "session_id": session_id,
        "history": session_store.get_history(session_id),
    }


@router.post("/patient-data/{session_id}")
async def update_patient_data(
    session_id: str,
    data: dict[str, Any] = Body(...),
) -> dict[str, Any]:
    """Merge structured intake data into the session store."""
    session_store.update_patient_data(session_id, data)
    return {
        "session_id": session_id,
        "patient_data": session_store.get_patient_data(session_id),
    }
