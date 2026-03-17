from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional
import random

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class Doctor:
    doctor_id: str
    name: str
    specialty: str
    keywords: list[str]  # body-part keywords for fuzzy matching


@dataclass
class Slot:
    slot_id: str
    doctor_id: str
    date: str        # ISO format: YYYY-MM-DD
    time: str        # 24-hour: HH:MM
    is_booked: bool = False

    @property
    def display(self) -> str:
        """Human-friendly label, e.g. 'Monday, March 17 at 9am'"""
        d = date.fromisoformat(self.date)
        hour, minute = map(int, self.time.split(":"))
        ampm = "am" if hour < 12 else "pm"
        h12 = hour % 12 or 12
        time_str = f"{h12}:{minute:02d}{ampm}" if minute else f"{h12}{ampm}"
        return f"{d.strftime('%A, %B')} {d.day} at {time_str}"


# ---------------------------------------------------------------------------
# Hardcoded roster
# ---------------------------------------------------------------------------

_DOCTORS: list[Doctor] = [
    Doctor(
        doctor_id="chen",
        name="Dr. Sarah Chen",
        specialty="Cardiology",
        keywords=["heart", "cardiac", "cardiovascular", "chest", "cardiology", "palpitation"],
    ),
    Doctor(
        doctor_id="patel",
        name="Dr. James Patel",
        specialty="Orthopedics",
        keywords=["bone", "bones", "joint", "joints", "orthopedic", "knee", "hip",
                  "shoulder", "back", "spine", "fracture", "muscle", "wrist", "ankle"],
    ),
    Doctor(
        doctor_id="lopez",
        name="Dr. Maria Lopez",
        specialty="Dermatology",
        keywords=["skin", "rash", "acne", "mole", "eczema", "psoriasis", "hair",
                  "nail", "dermatology", "lesion", "itching"],
    ),
    Doctor(
        doctor_id="kim",
        name="Dr. David Kim",
        specialty="Neurology",
        keywords=["brain", "neuro", "nervous", "headache", "migraine", "seizure",
                  "nerve", "neurology", "dizziness", "memory", "stroke", "tremor"],
    ),
]

# Office hours: Mon–Fri, hourly slots 9am–5pm (skipping 12 noon)
_OFFICE_HOURS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]


def _generate_slots(doctor_id: str) -> list[Slot]:
    """Generate 12–15 unique weekday slots spread across the next 45 days."""
    today = date.today()
    rng = random.Random(doctor_id)  # deterministic seed per doctor

    # Build candidate pool: every weekday × every office hour in the window
    pool: list[tuple[date, str]] = [
        (today + timedelta(days=offset), t)
        for offset in range(1, 46)
        for t in _OFFICE_HOURS
        if (today + timedelta(days=offset)).weekday() < 5  # Mon=0 … Fri=4
    ]

    count = rng.randint(12, 15)
    selected = sorted(rng.sample(pool, count))  # chronological order

    return [
        Slot(
            slot_id=f"{doctor_id}-{d.isoformat()}-{t.replace(':', '')}",
            doctor_id=doctor_id,
            date=d.isoformat(),
            time=t,
        )
        for d, t in selected
    ]


# ---------------------------------------------------------------------------
# In-memory slot store  {slot_id: Slot}
# ---------------------------------------------------------------------------

_SLOTS: dict[str, Slot] = {
    slot.slot_id: slot
    for doctor in _DOCTORS
    for slot in _generate_slots(doctor.doctor_id)
}


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def get_all_doctors() -> list[Doctor]:
    """Return all doctors."""
    return list(_DOCTORS)


def get_slots_by_doctor(doctor_id: str) -> list[Slot]:
    """Return available (not booked) slots for a given doctor, chronologically."""
    return [
        s for s in _SLOTS.values()
        if s.doctor_id == doctor_id and not s.is_booked
    ]


def get_slot_by_id(slot_id: str) -> Optional[Slot]:
    """Return a single slot by its ID, or None if not found."""
    return _SLOTS.get(slot_id)


def book_slot(slot_id: str) -> Optional[Slot]:
    """Mark slot as booked and return it. Returns None if not found or already booked."""
    slot = _SLOTS.get(slot_id)
    if slot is None:
        return None
    if slot.is_booked:
        return None
    slot.is_booked = True
    return slot


def get_doctor_by_specialty(body_part: str) -> Optional[Doctor]:
    """
    Fuzzy-match a doctor by body part keyword.
    Checks if any doctor keyword appears in the query, or vice-versa.
    Returns the first match, or None.
    """
    query = body_part.lower()
    for doctor in _DOCTORS:
        for kw in doctor.keywords:
            if kw in query or query in kw:
                return doctor
    return None
