#!/usr/bin/env bash
# ShareT VPS Deploy Script — works on any Ubuntu/Debian VPS
# Usage: bash deploy/vps-deploy.sh [--update]
set -e

INSTALL_DIR="/opt/sharet"
REPO_URL="https://github.com/Noodzakelijk-Online/004-ShareT"

log()  { echo -e "\033[1;32m[ShareT]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERROR]\033[0m $*"; exit 1; }

# ── 1. Verify root ────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Run as root: sudo bash deploy/vps-deploy.sh"

# ── 2. Install Docker ─────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  apt-get update -q
  apt-get install -y -q ca-certificates curl gnupg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  log "Docker installed"
else
  log "Docker already installed"
fi

# Docker Compose v2 (plugin or standalone)
if ! docker compose version &>/dev/null; then
  apt-get install -y -q docker-compose-plugin 2>/dev/null || \
    pip3 install docker-compose 2>/dev/null || \
    warn "Install docker-compose manually"
fi

# ── 3. Clone or update repo ───────────────────────────────────
if [[ -d "$INSTALL_DIR/.git" ]]; then
  log "Updating existing install..."
  git -C "$INSTALL_DIR" pull origin main
else
  log "Cloning ShareT to $INSTALL_DIR..."
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# ── 4. Environment file ───────────────────────────────────────
if [[ ! -f .env.docker ]]; then
  cp .env.docker.example .env.docker 2>/dev/null || true
  warn ".env.docker not found — please fill it in before continuing:"
  warn "  nano $INSTALL_DIR/.env.docker"
  warn "Then re-run: cd $INSTALL_DIR && docker compose up -d --build"
  exit 0
fi

# ── 5. Build and start ────────────────────────────────────────
log "Building and starting ShareT..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

# ── 6. Health check ───────────────────────────────────────────
log "Waiting for health endpoint..."
for i in $(seq 1 20); do
  sleep 3
  if curl -sf http://localhost:5005/health &>/dev/null; then
    log "ShareT is healthy!"
    break
  fi
  [[ $i -eq 20 ]] && warn "Health check timed out — check: docker logs sharet-app"
done

# ── 7. Systemd auto-restart on reboot ────────────────────────
cat > /etc/systemd/system/sharet.service <<EOF
[Unit]
Description=ShareT
Requires=docker.service
After=docker.service

[Service]
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable sharet
log "ShareT auto-start on reboot: enabled"

# ── Done ──────────────────────────────────────────────────────
SERVER_IP=$(curl -sf https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "=============================================="
echo "  ShareT deployed!"
echo "  Local:  http://localhost:5005"
echo "  Server: http://${SERVER_IP}:5005"
echo ""
echo "  Set PUBLIC_URL in .env.docker to your domain"
echo "  then run: docker compose up -d --build"
echo "=============================================="
