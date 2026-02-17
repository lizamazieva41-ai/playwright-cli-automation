# Playwright CLI Automation - Docker Image

[![Docker Image](https://img.shields.io/docker/v/lalalaala/playwright-cli-automation?label=Docker%20Image)](https://hub.docker.com/r/lalalaala/playwright-cli-automation)
[![Image Size](https://img.shields.io/docker/image-size/lalalaala/playwright-cli-automation/latest)](https://hub.docker.com/r/lalalaala/playwright-cli-automation)

Production-ready Docker image for Playwright CLI Automation - a powerful browser automation tool with stealth mode, proxy support, and parallel execution.

## Quick Start

```bash
# Pull the image
docker pull lalalaala/playwright-cli-automation:latest

# Run with health endpoint
docker run -d \
  --name playwright-automation \
  -p 3000:3000 \
  -e NODE_ENV=production \
  lalalaala/playwright-cli-automation:latest

# Check health
curl http://localhost:3000/health
```

## Features

- 🚀 **Browser Automation** - Control Firefox with Playwright
- 👤 **Stealth Mode** - Anti-bot detection
- 🔄 **Session Management** - Save and load sessions
- 🌐 **Proxy Support** - SOCKS5 proxy rotation
- ⚡ **Parallel Execution** - Concurrent tasks
- 📝 **Logging** - Winston logging
- 💾 **Data Persistence** - Volume mounts for sessions, output, logs

## Docker Compose

Create `docker-compose.yml`:

```yaml
services:
  playwright-automation:
    image: lalalaala/playwright-cli-automation:latest
    container_name: playwright-automation-prod
    restart: unless-stopped
    command: ["node", "src/index.js", "health"]
    environment:
      - NODE_ENV=production
      - HEALTH_PORT=3000
      - BROWSER_HEADLESS=true
    ports:
      - "3000:3000"
    volumes:
      - ./data/sessions:/usr/src/app/data/sessions
      - ./data/output:/usr/src/app/data/output
      - ./data/logs:/usr/src/app/data/logs
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

Then run:

```bash
docker compose up -d
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `HEALTH_PORT` | `3000` | Health endpoint port |
| `BROWSER_HEADLESS` | `true` | Run browser in headless mode |
| `BROWSER_VIEWPORT_WIDTH` | `1920` | Browser viewport width |
| `BROWSER_VIEWPORT_HEIGHT` | `1080` | Browser viewport height |
| `DEFAULT_CONCURRENCY` | `3` | Parallel task concurrency |
| `LOG_LEVEL` | `info` | Logging level |

## Usage

### Health Check

```bash
# Shallow health check
curl http://localhost:3000/health

# Deep health check (launches browser)
curl http://localhost:3000/health?deep=1
```

### Execute Commands

```bash
# List sessions
docker exec playwright-automation-prod node src/index.js session list

# List proxies
docker exec playwright-automation-prod node src/index.js proxy list

# Run health check
docker exec playwright-automation-prod node src/index.js health --once --deep
```

### Interactive Shell

```bash
docker exec -it playwright-automation-prod /bin/bash
```

## Volumes

Mount these volumes for data persistence:

- `/usr/src/app/data/sessions` - Browser sessions (cookies, localStorage)
- `/usr/src/app/data/output` - Scraped data output
- `/usr/src/app/data/logs` - Application logs

## Health Check

The container includes a built-in health check that:
- Runs every 30 seconds
- Tests the `/health` endpoint
- Has a 5-second timeout
- Retries 3 times before marking unhealthy

## Resource Requirements

**Minimum:**
- CPU: 1 core
- RAM: 1GB
- Storage: 5GB

**Recommended:**
- CPU: 2 cores
- RAM: 2GB
- Storage: 10GB

## Supported Architectures

- `linux/amd64` (x86_64)
- `linux/arm64` (aarch64)

## Tags

- `latest` - Latest stable release
- `v1.0.1` - Specific version tags

## Source Code

- **Repository:** https://github.com/lizamazieva41-ai/playwright-cli-automation
- **Documentation:** https://github.com/lizamazieva41-ai/playwright-cli-automation#readme
- **Issues:** https://github.com/lizamazieva41-ai/playwright-cli-automation/issues

## License

MIT License - see [LICENSE](https://github.com/lizamazieva41-ai/playwright-cli-automation/blob/main/LICENSE)

## Support

For detailed documentation and guides:
- [Deployment Guide](https://github.com/lizamazieva41-ai/playwright-cli-automation/blob/main/docs/DOCKER_DEPLOYMENT_GUIDE.md)
- [Acceptance Testing Plan](https://github.com/lizamazieva41-ai/playwright-cli-automation/blob/main/docs/ACCEPTANCE_TESTING_PLAN.md)

---

**Maintained by:** [lizamazieva41-ai](https://github.com/lizamazieva41-ai)
