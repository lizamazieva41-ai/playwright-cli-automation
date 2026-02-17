#!/usr/bin/env bash
set -euo pipefail

# deploy/deploy.sh — idempotent helper to deploy to a Linux server
# Usage:
#   sudo ./deploy/deploy.sh [--target-dir /opt/playwright-cli-automation] [--user autobot] [--pm2 | --systemd]
# The script copies current workspace to target dir, installs production deps,
# installs Playwright browsers, and registers either a systemd unit or starts with PM2.

TARGET_DIR="/opt/playwright-cli-automation"
SERVICE_USER="autobot"
MODE="pm2" # pm2 or systemd

while [[ $# -gt 0 ]]; do
  case $1 in
    --target-dir) TARGET_DIR="$2"; shift 2;;
    --user) SERVICE_USER="$2"; shift 2;;
    --systemd) MODE="systemd"; shift;;
    --pm2) MODE="pm2"; shift;;
    --help) echo "Usage: $0 [--target-dir DIR] [--user USER] [--systemd|--pm2]"; exit 0;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

echo "Deploy mode: $MODE"

if [ "$(id -u)" -ne 0 ]; then
  echo "This script should be run as root (it will create system user, install files)." >&2
  echo "Rerun with: sudo $0" >&2
  exit 1
fi

# Create service user if not exists (system account without shell)
if ! id "$SERVICE_USER" &>/dev/null; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER" || true
  echo "Created system user: $SERVICE_USER"
fi

# Ensure target dir
mkdir -p "$TARGET_DIR"
chown -R "$SUDO_USER":"$SUDO_USER" "$TARGET_DIR"

# Sync files (exclude node_modules and data)
rsync -a --delete --exclude node_modules --exclude data --exclude .git ./ "$TARGET_DIR/"

# Install node deps (run as normal user if possible)
if command -v npm >/dev/null 2>&1; then
  echo "Installing npm dependencies (production)..."
  pushd "$TARGET_DIR" >/dev/null
  npm ci --only=production
  popd >/dev/null
else
  echo "Node/npm not found — please install Node.js 18+ on the server and re-run." >&2
  exit 1
fi

# Install Playwright browser binaries (server must have OS deps installed)
pushd "$TARGET_DIR" >/dev/null
if npx playwright --version >/dev/null 2>&1; then
  echo "Installing Playwright Firefox binary..."
  npx playwright install firefox || true
else
  echo "Playwright not available via npx; ensure dependencies are installed." >&2
fi
popd >/dev/null

# Create data dirs and set permissions
mkdir -p "$TARGET_DIR/data/logs" "$TARGET_DIR/data/output" "$TARGET_DIR/data/sessions"
chown -R "$SERVICE_USER":"$SERVICE_USER" "$TARGET_DIR/data"

# Copy environment example to /etc/autobot if not exists
mkdir -p /etc/autobot
if [ ! -f /etc/autobot/autobot.env ]; then
  cp "$TARGET_DIR/.env.example" /etc/autobot/autobot.env
  echo "Copied example env to /etc/autobot/autobot.env — edit this file before start."
fi

# Install pm2 and start app (or install systemd unit)
if [ "$MODE" = "pm2" ]; then
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "Installing pm2 globally..."
    npm i -g pm2
  fi

  # Start app under pm2 as the deploy user
  sudo -u "$SUDO_USER" -H bash -c "cd '$TARGET_DIR' && pm2 start ecosystem.config.js --env production || pm2 reload ecosystem.config.js --env production"
  pm2 save
  echo "PM2 process started. To enable startup on boot run: pm2 startup systemd && pm2 save"
else
  # Install systemd service
  cp "$TARGET_DIR/deploy/autobot.service" /etc/systemd/system/autobot.service
  systemctl daemon-reload
  systemctl enable --now autobot.service
  echo "Systemd service installed and started: systemctl status autobot"
fi

echo "Deployment finished. Check logs in $TARGET_DIR/data/logs and service status."