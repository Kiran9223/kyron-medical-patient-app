from datetime import date as date_type
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from models import BookingRequest, SendConfirmationRequest
import session_store
from data.doctors import (
    get_all_doctors,
    get_doctor_by_specialty,
    get_slot_by_id,
    get_slots_by_doctor,
    book_slot,
)
from services.email_service import send_booking_confirmation

router = APIRouter()


def _format_date_label(iso_date: str) -> str:
    """'2026-03-20' → 'Friday, March 20'"""
    d = date_type.fromisoformat(iso_date)
    return f"{d.strftime('%A, %B')} {d.day}"


def _format_time(time_str: str) -> str:
    """'09:00' → '9am', '14:30' → '2:30pm'"""
    hour, minute = map(int, time_str.split(":"))
    ampm = "am" if hour < 12 else "pm"
    h12 = hour % 12 or 12
    return f"{h12}:{minute:02d}{ampm}" if minute else f"{h12}{ampm}"


@router.get("/slots/{session_id}")
async def get_slots(session_id: str) -> dict[str, Any]:
    """
    Match the patient's reason for visit to a doctor and return
    available slots grouped by date.
    """
    patient_data = session_store.get_patient_data(session_id)
    reason = patient_data.get("reason_for_visit", "")

    if not reason:
        raise HTTPException(
            status_code=400,
            detail="No reason for visit found in session. Complete intake first.",
        )

    doctor = get_doctor_by_specialty(reason)
    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="We don't currently treat that condition",
        )

    slots = get_slots_by_doctor(doctor.doctor_id)

    slots_by_date: dict[str, list[dict[str, str]]] = {}
    for slot in slots:
        label = _format_date_label(slot.date)
        if label not in slots_by_date:
            slots_by_date[label] = []
        slots_by_date[label].append(
            {
                "slot_id": slot.slot_id,
                "time": _format_time(slot.time),
                "doctor_id": slot.doctor_id,
            }
        )

    return {
        "doctor": {
            "id": doctor.doctor_id,
            "name": doctor.name,
            "specialty": doctor.specialty,
        },
        "slots_by_date": slots_by_date,
    }


@router.post("/book")
async def book_appointment(
    body: BookingRequest, background_tasks: BackgroundTasks
) -> dict[str, Any]:
    """Book a slot, persist the confirmation, send a confirmation email, and return a clean summary."""
    slot = get_slot_by_id(body.slot_id)

    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found.")
    if slot.is_booked:
        raise HTTPException(status_code=409, detail="Slot is already booked.")

    booked = book_slot(body.slot_id)
    if booked is None:
        raise HTTPException(status_code=409, detail="Slot could not be booked.")

    doctor = next(
        (d for d in get_all_doctors() if d.doctor_id == booked.doctor_id), None
    )
    doctor_name = doctor.name if doctor else booked.doctor_id
    specialty = doctor.specialty if doctor else ""

    date_label = _format_date_label(booked.date)
    time_label = _format_time(booked.time)

    # Build patient name from whatever intake data is available
    patient_data = session_store.get_patient_data(body.session_id)
    first = patient_data.get("first_name", "")
    last = patient_data.get("last_name", "")
    patient_name = f"{first} {last}".strip() or "Patient"

    confirmation = {
        "confirmed": True,
        "doctor": doctor_name,
        "specialty": specialty,
        "date": date_label,
        "time": time_label,
        "patient_name": patient_name,
    }

    session_store.update_patient_data(body.session_id, {"booking": confirmation})

    # Send confirmation email in the background — don't block the response
    async def _send_and_log():
        email_result = await send_booking_confirmation(patient_data, confirmation)
        print("[appointments] Email result:", email_result)

    background_tasks.add_task(_send_and_log)

    return confirmation


@router.post("/send-confirmation")
async def send_confirmation(
    body: SendConfirmationRequest, background_tasks: BackgroundTasks
) -> dict[str, Any]:
    """Manually trigger a confirmation email for an already-booked session."""
    patient_data = session_store.get_patient_data(body.session_id)
    booking = patient_data.get("booking")

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="No booking found for this session.",
        )

    background_tasks.add_task(send_booking_confirmation, patient_data, booking)

    return {"queued": True, "to": patient_data.get("email", "")}
