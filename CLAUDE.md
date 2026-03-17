# Kyron Medical — Patient Appointment Booking App

## Project Overview
A patient-facing web app for Kyron Medical (medical billing AI startup).
Patients chat with an AI receptionist named "Kyra", complete intake,
book appointments, and optionally hand off to a voice call.

## Stack
- Frontend: React + Vite + Tailwind + Framer Motion
- Backend: Python FastAPI
- AI: Anthropic Claude claude-sonnet-4-20250514
- Email: SendGrid
- SMS: Twilio
- Voice: Vapi.ai
- Session: In-memory store (session_store.py)

## Folder Structure
kyron-patient-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── AppointmentPicker.jsx
│   │   │   └── VoiceHandoffButton.jsx
│   │   ├── hooks/useChat.js
│   │   └── App.jsx
├── backend/
│   ├── routers/ (chat.py, appointments.py, notifications.py, voice.py)
│   ├── data/doctors.py
│   ├── services/ (ai_service.py, email_service.py, sms_service.py, voice_service.py)
│   ├── models.py
│   ├── session_store.py
│   └── main.py
├── CLAUDE.md
├── .env.example
└── requirements.txt

## Doctors (Hardcoded)
- Dr. Sarah Chen → Cardiology (heart)
- Dr. James Patel → Orthopedics (bones/joints)
- Dr. Maria Lopez → Dermatology (skin)
- Dr. David Kim → Neurology (brain/nervous system)
Availability: 12–15 slots each, spread across next 45 days

## AI Persona — Kyra
- Warm, professional, human-like medical receptionist
- NEVER gives medical advice or diagnoses
- Guides patient through: intake → doctor matching → slot
  selection → booking confirmation
- Handles natural language scheduling requests
  (e.g. "do you have a Tuesday?")

## Patient Intake Fields
- First name, last name, DOB, phone, email, reason for visit

## Key Workflows
1. Intake → doctor matching → appointment booking → confirmation
2. Email confirmation via SendGrid after booking
3. SMS opt-in + text confirmation via Twilio
4. Voice handoff via Vapi.ai — retains full chat context

## UI Guidelines
- Liquid glass aesthetic (frosted glass, backdrop blur, transparency)
- Kyron Medical colors: teal/blue tones (#0EA5E9, #06B6D4), dark background
- Framer Motion animations: messages slide in, typing indicator,
  stagger on slot cards
- Mobile responsive
- "Call Instead" button top right

## Environment Variables (see .env.example)
- ANTHROPIC_API_KEY
- SENDGRID_API_KEY
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- VAPI_API_KEY, VAPI_PHONE_NUMBER_ID

## Deployment (End Goal)
- Host on AWS EC2 via Terraform
- HTTPS via Let's Encrypt + Nginx reverse proxy
- Frontend build served as static files via Nginx
- Backend FastAPI running via systemd or Docker on EC2
- Terraform files go in /infrastructure folder at project root

## Infrastructure Folder (to be built last)
infrastructure/
├── main.tf         ← EC2 instance, security groups
├── variables.tf    ← region, instance type, key pair
├── outputs.tf      ← public IP, DNS
└── user_data.sh    ← bootstrap script (install deps, start app)

## Current Build Status
- Session 1 ✅ — Project scaffolded, FastAPI + React + Vite + Tailwind initialized, .env.example created, dependencies installed
- Session 2 ✅ — backend/data/doctors.py complete with 4 doctors, 56 total slots, fuzzy specialty matching, and helper functions (get_all_doctors, get_slots_by_doctor, get_slot_by_id, book_slot, get_doctor_by_specialty)
- Session 3 ✅ — backend/session_store.py and backend/services/ai_service.py complete. Kyra persona with system prompt, ##INTAKE_COMPLETE## and ##BOOKING_COMPLETE## markers, conversation history per session, Anthropic API integrated
- Session 4 ✅ — Chat API complete. POST /api/chat, GET /api/chat/history/{session_id}, and POST /api/chat/patient-data/{session_id} all working. ##INTAKE_COMPLETE## and ##BOOKING_COMPLETE## marker detection confirmed. Kyra responding live via Anthropic API. Backend tested and verified.
- Session 5 ✅ — Frontend chat UI complete. Liquid glass design, dark background (#0A0F1E), gradient orbs, Kyra left-aligned bubbles with avatar, patient right-aligned bubbles (#0EA5E9), typing indicator, Framer Motion animations, auto-scroll, Enter-to-send, "Call Instead" button (UI only), mobile responsive. Chat verified working end to end with live Anthropic API.
- Session 6 ✅ — Appointment scheduling flow complete. GET /api/appointments/slots/{session_id} matches doctor by specialty, returns slots grouped by date. POST /api/appointments/book books slot and saves confirmation. AppointmentPicker component with stagger animation, ConfirmationBanner. GET /api/debug/session/{session_id} added for testing. In-memory session store chosen deliberately for MVP. Extensible to Redis/PostgreSQL by swapping session_store.py.
- Session 7 ✅ — Voice handoff complete. Vapi.ai outbound call initiated with full chat context passed as system prompt. Kyra speaks on the call, retains full conversation history, and can book appointments over voice. Call transcripts and recordings verified in Vapi dashboard. Carrier blocking issue documented.
- Session 8 ✅ — Email confirmation working via SendGrid. HTML email template with Kyron Medical branding, patient name, doctor name, appointment date/time, practice address. Patient data extraction from conversation history fixed — structured fields (first_name, last_name, dob, phone, email, reason) now correctly parsed and saved to session_store. Call in progress overlay UI added with pulsing animation and end call button.
- Session 9 🔄 — AWS + Terraform deployment next. (Note: Official Kyron Medical color scheme applied — #3B82F6 blue, #06B6D4 teal, #7C3AED purple, #111827 card background, #0A0F1E base. CSS variables in index.css. Rainbow shimmer removed.)

## Rules for Claude Code
- Always read existing files before making changes
- Build one focused piece at a time
- Prioritize clean, extensible code over clever code
- Never hardcode API keys — always use .env
- After each change, state what you did and what to test