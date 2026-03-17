# Kyron Medical — Patient Assistant

AI-powered patient appointment booking web app built for Kyron Medical.

## Features
- Conversational AI intake via Kyra (Claude claude-sonnet-4-20250514)
- Semantic doctor matching by specialty
- Real-time appointment scheduling
- Email confirmation via SendGrid
- Voice call handoff via Vapi.ai with full chat context
- Liquid glass UI matching Kyron Medical branding

## Tech Stack
- Frontend: React 18 + Vite + Tailwind + Framer Motion
- Backend: Python FastAPI
- AI: Anthropic Claude claude-sonnet-4-20250514
- Voice: Vapi.ai
- Email: SendGrid
- Deployment: Vercel (frontend) + Railway (backend)

## Architecture Notes
- In-memory session store (extensible to Redis)
- 4 hardcoded doctors with 45-day availability
- Modular service layer for easy extension
- AWS EC2 + Terraform infrastructure ready (see /infrastructure folder)

## Environment Variables
```
ANTHROPIC_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## Local Setup

**Backend**
```bash
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend && npm install
npm run dev
```

## Deployment

The app is deployed on Railway (backend) and Vercel 
(frontend) for rapid delivery within the 48-hour 
deadline. Both services provide HTTPS, auto-scaling, 
and zero-config deployment.

### AWS EC2 Production Path
The infrastructure/ folder contains Terraform 
configuration to deploy this app to AWS EC2 with:
- EC2 t2.micro instance (free tier eligible)
- Nginx reverse proxy with Let's Encrypt HTTPS
- systemd process management for FastAPI
- Security groups for HTTP/HTTPS/SSH

To deploy to EC2:
terraform init && terraform apply
