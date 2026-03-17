import json
import os
import re
import anthropic
from dotenv import load_dotenv

import session_store

load_dotenv()

# ---------------------------------------------------------------------------
# Anthropic client (lazy singleton)
# ---------------------------------------------------------------------------

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


# ---------------------------------------------------------------------------
# Kyra system prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """
You are Kyra, a warm, professional, and friendly AI receptionist for a medical practice. \
Your job is to help patients schedule appointments, answer basic questions about the practice, \
and guide them through the intake process.

You must NEVER:
- Provide medical advice, diagnoses, or treatment recommendations
- Speculate about what a patient's symptoms might mean
- Recommend medications or dosages
- If asked anything medical, politely say: "I'm not able to provide medical advice, \
but I can help you get scheduled with the right doctor."

Your intake flow:
1. Greet the patient warmly
2. Collect: first name, last name, date of birth, phone number, email, and reason for visit
3. Collect these conversationally — don't present them as a form. Ask naturally, one or two at a time.
4. Once you have ALL six fields (first name, last name, DOB, phone, email, reason), output at the \
END of your message (after your conversational reply):
   ##INTAKE_COMPLETE##
   ##PATIENT_REASON:{the patient's reason for visit, a few keywords}##
   ##PATIENT_PHONE:{phone number exactly as the patient provided it}##
5. After intake is complete, tell the patient warmly that you are pulling up available appointments \
for them and that they will appear on screen shortly.
6. When the patient has selected an appointment slot and confirmed it, output at the END of your message:
   ##BOOKING_COMPLETE##
7. If extra context is provided showing available appointment slots, you may reference specific \
days and times conversationally to help the patient choose — but do NOT reveal slot IDs.
8. Always be concise — this is a chat interface, not an essay.
""".strip()

# Markers the router reads; they must not reach the frontend as-is
_STRIP_PATTERNS = [
    "##INTAKE_COMPLETE##",
    "##BOOKING_COMPLETE##",
    re.compile(r"##PATIENT_REASON:[^#]*##"),
    re.compile(r"##PATIENT_PHONE:[^#]*##"),
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_kyra_response(
    session_id: str,
    user_message: str,
    extra_context: str = "",
) -> tuple[str, list[str], dict[str, str]]:
    """
    Send the user's message to Claude and return:
        (clean_reply, detected_markers, extracted)

    detected_markers — list of ##...## marker strings found in the raw reply.
    extracted        — dict with keys "reason" and "phone" extracted from markers.
    extra_context    — injected as a system note for this turn only (not saved to history).
    """
    session_store.add_message(session_id, "user", user_message)

    system = _SYSTEM_PROMPT
    if extra_context:
        system += f"\n\n--- Context for this turn (not visible to patient) ---\n{extra_context}"

    response = _get_client().messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system,
        messages=session_store.get_history(session_id),
    )

    raw_reply: str = response.content[0].text  # type: ignore[index]

    # Detect named markers
    detected_markers: list[str] = []
    for marker in ["##INTAKE_COMPLETE##", "##BOOKING_COMPLETE##"]:
        if marker in raw_reply:
            detected_markers.append(marker)

    # Extract structured data before stripping
    reason_match = re.search(r"##PATIENT_REASON:([^#]+)##", raw_reply)
    phone_match = re.search(r"##PATIENT_PHONE:([^#]+)##", raw_reply)
    extracted: dict[str, str] = {
        "reason": reason_match.group(1).strip() if reason_match else "",
        "phone": phone_match.group(1).strip() if phone_match else "",
    }

    # Strip all markers from the visible reply
    clean_reply = raw_reply
    for pattern in _STRIP_PATTERNS:
        if isinstance(pattern, str):
            clean_reply = clean_reply.replace(pattern, "")
        else:
            clean_reply = pattern.sub("", clean_reply)
    clean_reply = clean_reply.strip()

    session_store.add_message(session_id, "assistant", clean_reply)

    return clean_reply, detected_markers, extracted


def extract_patient_data(session_id: str) -> dict[str, str]:
    """
    Use Claude (Haiku) to extract structured patient fields from the full
    conversation history.  Returns only the fields that were actually mentioned;
    missing fields are omitted entirely.

    Keys returned (when present):
        first_name, last_name, dob, phone, email, reason_for_visit
    """
    history = session_store.get_history(session_id)

    transcript = "\n".join(
        f"{'Patient' if m['role'] == 'user' else 'Kyra'}: {m['content']}"
        for m in history
    )

    extraction_prompt = (
        "Extract patient intake data from this medical receptionist conversation transcript.\n\n"
        "Return ONLY a valid JSON object with these exact keys:\n"
        '  "first_name", "last_name", "dob", "phone", "email", "reason_for_visit"\n\n'
        "Rules:\n"
        "- Use null for any field the patient has not yet provided\n"
        "- dob: use whatever format the patient gave (e.g. '01/15/1990' or 'January 15 1990')\n"
        "- phone: use the number exactly as the patient provided it\n"
        "- reason_for_visit: a short phrase describing the patient's chief complaint\n"
        "- Output ONLY the JSON object — no explanation, no markdown fences\n\n"
        f"Transcript:\n{transcript}"
    )

    try:
        response = _get_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            messages=[{"role": "user", "content": extraction_prompt}],
        )
        raw: str = response.content[0].text.strip()  # type: ignore[index]

        # Strip accidental markdown code fences
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data: dict[str, str | None] = json.loads(raw)

        # Drop null/empty values so we don't overwrite good data with nulls
        return {k: v for k, v in data.items() if v}

    except Exception as exc:
        print(f"[ai_service] extract_patient_data failed: {exc}")
        return {}
