from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import chat, appointments, notifications, voice, debug

load_dotenv()

app = FastAPI(title="Kyron Medical API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
app.include_router(debug.router, prefix="/api/debug", tags=["debug"])


@app.get("/health")
def health():
    return {"status": "ok"}
