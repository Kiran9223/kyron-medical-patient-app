#!/bin/bash
# =============================================================================
# Kyron Medical — EC2 Bootstrap Script
#
# This script runs once on first boot via EC2 user_data.
# It installs all dependencies, clones the repo, configures systemd for
# FastAPI, and sets up Nginx as a reverse proxy.
#
# Assumes Ubuntu 22.04 LTS.
# =============================================================================

set -euo pipefail
exec > /var/log/kyron-bootstrap.log 2>&1
echo "=== Kyron bootstrap started at $(date) ==="

# ── 1. System update ──────────────────────────────────────────────────────────

apt-get update -y
apt-get upgrade -y

# ── 2. Install runtime dependencies ───────────────────────────────────────────

apt-get install -y \
  python3 \
  python3-pip \
  python3-venv \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  curl

# ── 3. Clone the repository ───────────────────────────────────────────────────
# Replace the URL below with your actual GitHub repo before deploying.

REPO_URL="https://github.com/YOUR_USERNAME/kyron-patient-app.git"
APP_DIR="/opt/kyron"

git clone "$REPO_URL" "$APP_DIR"

# ── 4. Python virtual environment + dependencies ──────────────────────────────

python3 -m venv "$APP_DIR/backend/.venv"
"$APP_DIR/backend/.venv/bin/pip" install --upgrade pip
"$APP_DIR/backend/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

# ── 5. Environment variables ──────────────────────────────────────────────────
# Write the .env file for the backend.
# In production, prefer AWS Secrets Manager or Parameter Store instead of
# hardcoding secrets here. The placeholders below must be replaced.

cat > "$APP_DIR/backend/.env" << 'EOF'
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@kyronmedical.com
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
EOF

# ── 6. Build the frontend ─────────────────────────────────────────────────────

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

cd "$APP_DIR/frontend"
npm install
VITE_API_URL="http://localhost:8000" npm run build

# ── 7. Systemd service for FastAPI ────────────────────────────────────────────
# Runs uvicorn on port 8000, managed by systemd (auto-restart on crash).

cat > /etc/systemd/system/kyron-backend.service << EOF
[Unit]
Description=Kyron Medical FastAPI backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$APP_DIR/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kyron-backend
systemctl start kyron-backend

# ── 8. Nginx configuration ────────────────────────────────────────────────────
# Serves the React build as static files and proxies /api/* to FastAPI.

cat > /etc/nginx/sites-available/kyron << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain name, e.g. kyronmedical.com

    # Serve the React frontend build
    root /opt/kyron/frontend/dist;
    index index.html;

    # React Router — serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy /api/* requests to the FastAPI backend on port 8000
    location /api/ {
        proxy_pass         http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable the site and remove the default
ln -sf /etc/nginx/sites-available/kyron /etc/nginx/sites-enabled/kyron
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# ── 9. SSL via Let's Encrypt (commented out — requires a real domain) ─────────
# Once you have a domain pointing to this server's Elastic IP, uncomment and
# replace "your-domain.com" with the actual domain:
#
# certbot --nginx \
#   --non-interactive \
#   --agree-tos \
#   --email admin@your-domain.com \
#   --domains your-domain.com,www.your-domain.com
#
# Certbot will also install a cron job to auto-renew the certificate.

echo "=== Kyron bootstrap complete at $(date) ==="
