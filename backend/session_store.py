from typing import Any

# ---------------------------------------------------------------------------
# In-memory store  {session_id: {"history": [...], "patient": {...}}}
# ---------------------------------------------------------------------------

_store: dict[str, dict[str, Any]] = {}


def _ensure(session_id: str) -> dict[str, Any]:
    if session_id not in _store:
        _store[session_id] = {"history": [], "patient": {}}
    return _store[session_id]


# ---------------------------------------------------------------------------
# Conversation history
# ---------------------------------------------------------------------------

def get_history(session_id: str) -> list[dict[str, str]]:
    """Return the full message history as a list of {role, content} dicts."""
    return _ensure(session_id)["history"]


def add_message(session_id: str, role: str, content: str) -> None:
    """Append a single message to the session history."""
    _ensure(session_id)["history"].append({"role": role, "content": content})


# ---------------------------------------------------------------------------
# Patient intake data
# ---------------------------------------------------------------------------

def get_patient_data(session_id: str) -> dict[str, Any]:
    """Return the stored intake data for this session."""
    return _ensure(session_id)["patient"]


def update_patient_data(session_id: str, data: dict[str, Any]) -> None:
    """Merge `data` into the session's patient record (shallow update)."""
    _ensure(session_id)["patient"].update(data)


# ---------------------------------------------------------------------------
# Session lifecycle
# ---------------------------------------------------------------------------

def clear_session(session_id: str) -> None:
    """Remove all data for this session."""
    _store.pop(session_id, None)
