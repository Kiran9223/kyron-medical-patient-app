from pydantic import BaseModel
from typing import Any, Optional


class PatientIntake(BaseModel):
    first_name: str
    last_name: str
    dob: str
    phone: str
    email: str
    reason_for_visit: str


class ChatMessage(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    response: str
    intake_complete: bool
    booking_complete: bool
    patient_data: Optional[dict[str, Any]] = None


class BookingRequest(BaseModel):
    session_id: str
    slot_id: str


class NotificationPrefs(BaseModel):
    session_id: str
    sms_opt_in: bool


class VoiceInitiateRequest(BaseModel):
    session_id: str


class SendConfirmationRequest(BaseModel):
    session_id: str
