from fastapi import APIRouter
from models import NotificationPrefs

router = APIRouter()


@router.post("/email")
async def send_email(session_id: str):
    # TODO: send booking confirmation email via SendGrid
    return {"sent": False}


@router.post("/sms")
async def send_sms(body: NotificationPrefs):
    # TODO: send SMS confirmation via Twilio
    return {"sent": False}
