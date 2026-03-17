import json
import os
import re

import httpx
from dotenv import load_dotenv

import session_store

load_dotenv()


def _build_call_context(session_id: str) -> str:
    """Build a system prompt for Kyra on the voice call using full chat history."""
    history = session_store.get_history(session_id)
    patient_data = session_store.get_patient_data(session_id)

    history_lines = "\n".join(
        f"{'Patient' if m['role'] == 'user' else 'Kyra'}: {m['content']}"
        for m in history
    )

    booking = patient_data.get("booking")
    booking_note = ""
    if booking:
        booking_note = (
            f"\n\nNote: The patient has already booked an appointment with "
            f"{booking.get('doctor')} on {booking.get('date')} at {booking.get('time')}."
        )

    return (
        "You are Kyra, a warm and professional AI receptionist for Kyron Medical. "
        "You are continuing a conversation that began in the web chat interface. "
        "Here is the full chat history so far:\n\n"
        f"{history_lines}\n\n"
        "Continue naturally from where the chat left off. "
        "Be warm, concise, and helpful. "
        "Do not re-collect information already provided. "
        "Never give medical advice or diagnoses."
        f"{booking_note}"
    )


def format_e164(phone: str) -> str:
    """Normalize a US phone number string to E.164 format (+1XXXXXXXXXX)."""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"+1{digits}"
    elif len(digits) == 11 and digits.startswith('1'):
        return f"+{digits}"
    else:
        return f"+{digits}"


async def initiate_voice_call(session_id: str, phone_number: str) -> dict[str, object]:
    """
    Initiate an outbound Vapi.ai call to the patient.
    Returns {"success": bool, "call_id": str | None}.
    """
    api_key = os.environ.get("VAPI_API_KEY", "")
    phone_number_id = os.environ.get("VAPI_PHONE_NUMBER_ID", "")

    print("[voice_service] API KEY present:", bool(api_key))
    print("[voice_service] PHONE NUMBER ID:", phone_number_id)

    if not api_key or not phone_number_id:
        return {"success": False, "call_id": None}

    # Resolve phone from session if not provided, then normalize to E.164
    patient_data = session_store.get_patient_data(session_id)
    raw_phone = phone_number or patient_data.get("phone", "")

    if not raw_phone:
        return {"success": False, "call_id": None, "error": "No phone number found for patient"}

    formatted_phone = format_e164(raw_phone)
    print(f"[voice_service] Phone: {raw_phone} → {formatted_phone}")

    context = _build_call_context(session_id)
    first_name = patient_data.get("first_name", "there")

    payload = {
        "phoneNumberId": phone_number_id,
        "customer": {
            "number": formatted_phone,
        },
        # Pass session_id in metadata so the webhook handler can link
        # the call back to the correct session
        "metadata": {
            "session_id": session_id,
        },
        "assistant": {
            "name": "Kyra",
            "model": {
                "provider": "anthropic",
                "model": "claude-sonnet-4-20250514",
                "messages": [
                    {
                        "role": "system",
                        "content": context,
                    }
                ],
            },
            "voice": {
                "provider": "11labs",
                "voiceId": "21m00Tcm4TlvDq8ikWAM",
            },
            "firstMessage": (
                f"Hi {first_name}, this is Kyra from Kyron Medical continuing your web chat. "
                "How can I help you?"
            ),
        },
    }

    print("[voice_service] Request body:", json.dumps(payload, indent=2))

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.vapi.ai/call/phone",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    print("[voice_service] Response status:", response.status_code)
    print("[voice_service] Response body:", response.text)

    if response.status_code in (200, 201):
        data = response.json()
        return {"success": True, "call_id": data.get("id")}

    return {"success": False, "call_id": None}
