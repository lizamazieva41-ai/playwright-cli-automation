Deployment helper scripts

Files included:

- `deploy/deploy.sh` — idempotent helper that copies the repository to `/opt/playwright-cli-automation`, installs production dependencies, installs Playwright browser binaries, and can register the app either with PM2 or systemd.
- `deploy/autobot.service` — example systemd unit (drop-in to `/etc/systemd/system/autobot.service`).
- `deploy/logrotate/autobot` — logrotate entry for `data/logs/*.log`.

Quick server checklist (Ubuntu/Debian)

1. Install OS deps for Playwright (run as root):

   apt-get update && apt-get install -y ca-certificates curl gnupg --no-install-recommends
   # Playwright system deps (example list; run `npx playwright install-deps` for full list)
   apt-get install -y libx11-xcb1 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 \
     libxfixes3 libxi6 libgtk-3-0 libatk1.0-0 libcairo2 libgdk-pixbuf2.0-0 libasound2

2. Ensure Node.js 18+ is installed (NodeSource, nvm, or distro package).
3. Copy repository to server (or `git clone`).
4. Edit `/etc/autobot/autobot.env` with production secrets (SMTP, SLACK, PROXY_LIST, etc.).
5. Run deployment helper (as root):

   sudo ./deploy/deploy.sh --target-dir /opt/playwright-cli-automation --user autobot --pm2

   or to use systemd unit:

   sudo ./deploy/deploy.sh --target-dir /opt/playwright-cli-automation --user autobot --systemd

6. Verify:

   # PM2
   pm2 status
   pm2 logs autobot

   # systemd
   systemctl status autobot
   journalctl -u autobot -f

CI notes

- The repository includes a GitHub Actions workflow that runs the full test suite inside the official Playwright Docker image; integration browser tests will run reliably in CI.
