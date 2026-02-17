# Playwright CLI Automation

CLI browser automation tool using Playwright with Firefox, supporting stealth browsing, SOCKS proxy, parallel execution, logging, and notifications.

## Features

- 🚀 **Browser Automation** - Control Firefox with Playwright
- 👤 **Stealth Mode** - Anti-bot detection with randomized User-Agent, WebGL fingerprint protection, human behavior simulation
- 🔄 **Session Management** - Save and load login sessions (cookies, localStorage)
- 🌐 **Proxy Support** - SOCKS5 proxy with round-robin rotation
- ⚡ **Parallel Execution** - Run multiple tasks concurrently with configurable concurrency
- 📝 **Flexible Logging** - Winston logging with file output and error tracking
- 📧 **Notifications** - Email and Slack notifications
- 💾 **Storage** - Save results to JSON or CSV

## Installation

```bash
# Clone or download the project
cd playwright-cli-automation

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Install Playwright browsers
npx playwright install firefox
```

## Configuration

Edit `.env` file with your settings:

```env
# Browser
BROWSER_HEADLESS=true
BROWSER_VIEWPORT_WIDTH=1920
BROWSER_VIEWPORT_HEIGHT=1080

# Proxy (comma-separated)
PROXY_LIST=socks5://user:pass@host:port

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_TO=recipient@example.com

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Concurrency
DEFAULT_CONCURRENCY=3
MAX_CONCURRENCY=10
```

## Usage

### Login Command

Save a login session for later use:

```bash
node src/index.js login -u https://example.com/login -s mysession
```

Options:
- `-u, --url <url>` - Login page URL (required)
- `-s, --session <name>` - Session name (default: "default")
- `-p, --proxy <proxy>` - Proxy URL
- `--headful` - Run browser in visible mode

### Scrape Command

Scrape data from websites:

```bash
node src/index.js scrape -c config.json
```

Options:
- `-c, --config <file>` - Configuration file (required)
- `-s, --session <name>` - Session to use
- `-p, --proxy <proxy>` - Proxy URL
- `--rotate-proxy` - Rotate through proxy list
- `--parallel <n>` - Number of parallel tasks
- `-o, --output <format>` - Output format (json/csv)
- `--notify` - Send notification on completion

### Test Command

Run web tests:

```bash
node src/index.js test -u https://example.com -c checks.json
```

Options:
- `-u, --url <url>` - URL to test (required)
- `-c, --checks <file>` - Checks file
- `-p, --proxy <proxy>` - Proxy URL
- `-s, --screenshot` - Take screenshot on failure

### Session Command

Manage browser sessions:

```bash
# List all sessions
node src/index.js session list

# Show session info
node src/index.js session info <name>

# Delete a session
node src/index.js session delete <name>

# Validate session (check expiry)
node src/index.js session validate <name>
node src/index.js session validate <name> --check-expiry
```

### Proxy Command

Manage proxies:

```bash
# List all proxies
node src/index.js proxy list

# Test all proxies
node src/index.js proxy test
node src/index.js proxy test -c 5

# Add a proxy
node src/index.js proxy add socks5://user:pass@host:port

# Remove a proxy
node src/index.js proxy remove socks5://host:port
```

### Run Command

Run comprehensive tasks:

```bash
node src/index.js run -t task.json
```

## Configuration Files

### Scrape Config (JSON)

```json
{
  "url": "https://example.com",
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "waitUntil": "networkidle",
  "scroll": { "maxScrolls": 3 },
  "selectors": {
    "title": "h1",
    "description": ".description",
    "links": {
      "selector": "a",
      "attribute": "href",
      "multiple": true
    }
  },
  "actions": [
    { "type": "click", "selector": ".button" },
    { "type": "wait", "min": 500, "max": 1000 }
  ],
  "screenshot": { "path": "screenshot.png" }
}
```

### Task Config (JSON)

```json
{
  "login": {
    "url": "https://example.com/login",
    "session": "myaccount"
  },
  "scrape": {
    "url": "https://example.com/data",
    "selectors": { "title": "h1" }
  },
  "test": {
    "url": "https://example.com",
    "checks": [
      { "type": "title", "expected": "Example" }
    ]
  }
}
```

## Project Structure

```
automatic/
├── src/
│   ├── index.js              # Entry point with CLI setup
│   ├── cli/commands/         # CLI commands
│   │   ├── login.js         # Save login session
│   │   ├── scrape.js        # Scrape data from websites
│   │   ├── test.js          # Run web tests/checks
│   │   ├── run.js           # Execute comprehensive tasks
│   │   ├── session.js       # Manage sessions (list/info/delete/validate)
│   │   └── proxy.js        # Manage proxies (list/test/add/remove)
│   ├── core/
│   │   ├── browser-manager.js  # Browser lifecycle management
│   │   ├── task-runner.js     # Parallel task execution
│   │   └── page-actions.js    # Reusable page actions
│   ├── session/
│   │   └── session-manager.js # Session storage (cookies, localStorage)
│   ├── stealth/
│   │   ├── stealth.js         # Anti-bot detection
│   │   ├── user-agents.js    # User-Agent rotation
│   │   └── human-behavior.js # Human-like behavior simulation
│   ├── proxy/
│   │   └── proxy-manager.js  # Proxy rotation and management
│   ├── scraper/
│   │   └── scraper.js        # Web scraping logic
│   ├── logger/
│   │   └── logger.js         # Winston logging
│   ├── notifier/
│   │   ├── notifier.js      # Notification dispatcher
│   │   ├── email.js         # Email notifications
│   │   └── slack.js         # Slack notifications
│   ├── storage/
│   │   └── storage.js       # JSON/CSV storage
│   └── utils/
│       └── progress.js      # CLI progress bar
├── config/
│   └── default.js          # Default configuration
├── tests/
│   ├── unit/               # Unit tests
│   │   ├── session-manager.test.js
│   │   ├── proxy-manager.test.js
│   │   ├── storage.test.js
│   │   ├── stealth.test.js
│   │   ├── user-agents.test.js
│   │   └── human-behavior.test.js
│   └── integration/         # Integration tests
├── examples/               # Sample configuration files
├── data/
│   ├── sessions/           # Stored browser sessions
│   ├── output/             # Scraped data output
│   └── logs/               # Log files
├── package.json
├── jest.config.js          # Jest test configuration
├── CHANGELOG.md            # Version history
└── .env.example           # Environment variables template
```

## PM2 Deployment

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'autobot',
    script: './src/index.js',
    args: 'run -t task.json',
    interpreter: 'node',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 logs
pm2 stop all
```

---

## Docker image & health endpoint ✅

A small Dockerfile and a `/health` HTTP endpoint were added so you can run the service in a container and perform container health checks.

Build and run locally:

```bash
# build image
npm run docker:build

# run container (exposes health on :3000)
docker run --rm -e NODE_ENV=production -p 3000:3000 autobot:latest
```

Docker image (GitHub Container Registry — GHCR)

[![GHCR Image](https://img.shields.io/badge/ghcr.io-lizamazieva41-ai%2Fplaywright--cli--automation-blue)](https://github.com/lizamazieva41-ai/packages)

You can pull the published image from GHCR (image is pushed by CI on tag/release):

```bash
# public image (no auth required if image is public)
docker pull ghcr.io/lizamazieva41-ai/playwright-cli-automation:latest

docker run --rm -e NODE_ENV=production -p 3000:3000 ghcr.io/lizamazieva41-ai/playwright-cli-automation:latest
```

If the image is private, authenticate with a PAT that has `read:packages` scope:

```bash
# on CI or local: set CR_PAT (Personal Access Token)
echo "$CR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

docker pull ghcr.io/lizamazieva41-ai/playwright-cli-automation:latest
```

Notes:
- CI workflow `docker-publish.yml` builds and pushes the image when you create a release/tag (vX.Y.Z).
- Replace `latest` with a specific tag (recommended for production deployments).


Health checks:

- Shallow check: `GET /health` → basic process/session/proxy counters
- Deep check: `GET /health?deep=1` → attempts to launch a short-lived browser

You can also run an ephemeral health probe from the CLI:

```bash
# one-shot shallow check
node src/index.js health --once

# one-shot deep check
node src/index.js health --once --deep

# start long-running health server
node src/index.js health --port 3000
```

Deployment options (systemd or PM2)

- Use the helper `deploy/deploy.sh` to install and register the app (see `deploy/README.md`).
- `deploy/autobot.service` — systemd unit template (copy to `/etc/systemd/system/autobot.service`).
- `ecosystem.config.js` — PM2 configuration already present; use `pm2 start ecosystem.config.js`.
- Add the `deploy/logrotate/autobot` entry to your system `logrotate` configuration to rotate `data/logs/*.log`.

Continuous Integration

- The GitHub Actions CI runs the full test suite and includes an extra job that executes tests inside the official Playwright Docker image so browser integration tests run reliably in CI.

## Troubleshooting

### Playwright Installation Issues

If Playwright fails to install:
```bash
# Install Playwright browsers manually
npx playwright install firefox

# On macOS, you may need to accept licenses
sudo softwareupdate --install-rosetta
```

### Proxy Connection Timeout

If proxy times out:
- Verify proxy format: `socks5://user:pass@host:port`
- Test proxy separately before using
- Increase timeout in config: `BROWSER_TIMEOUT=60000`

### Session Expired

If sessions expire unexpectedly:
- Use `session validate <name> --check-expiry` to check
- Re-create login session if expired
- Adjust `SESSION_DEFAULT_EXPIRY_DAYS` in `.env`

### Memory Issues

If running out of memory with parallel tasks:
- Reduce `--parallel` value
- Set `MAX_CONCURRENCY=2` in `.env`
- Use `--headless` mode (default)

### Browser Detection

If being detected as bot:
- Use stealth mode (enabled by default)
- Add proxies for rotation
- Check `src/stealth/` modules for customization

## Development Guide

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npx jest tests/unit/proxy-manager.test.js
```

### Project Structure

- `src/cli/commands/` - CLI command implementations
- `src/core/` - Core modules (browser, task-runner)
- `src/stealth/` - Anti-detection modules
- `src/utils/` - Utility functions (progress, validation)
- `config/default.js` - Configuration
- `tests/` - Test files

### Coding Conventions

- Use ES6+ features
- Async/await for asynchronous operations
- JSDoc comments for functions
- Jest for testing

### Adding New Commands

1. Create file in `src/cli/commands/`
2. Use Commander.js for CLI parsing
3. Export Command object
4. Register in `src/index.js`

### Adding New Test Types

1. Add validation in `src/utils/validation.js`
2. Add test implementation in relevant command
3. Add tests in `tests/`

## API Reference

### Core Modules

#### BrowserManager (`src/core/browser-manager.js`)
```javascript
const browserManager = require('./src/core/browser-manager');

// Create browser session
const session = await browserManager.createBrowserSession({
  proxy: 'socks5://host:port',
  storageState: '/path/to/session',
  headless: false
});

// Close all
await browserManager.closeAll();
```

#### TaskRunner (`src/core/task-runner.js`)
```javascript
const taskRunner = require('./src/core/task-runner');

// Run parallel tasks
const results = await taskRunner.runParallel(tasks, 3);

// Run with retry
const results = await taskRunner.runWithRetry(tasks, 3, 3);
```

#### SessionManager (`src/session/session-manager.js`)
```javascript
const sessionManager = require('./src/session/session-manager');

// Save session
const path = await sessionManager.saveSession(context, 'myprofile');

// Load session
const sessionPath = sessionManager.loadSession('myprofile');

// List sessions
const sessions = sessionManager.listSessions();
```

#### ProxyManager (`src/proxy/proxy-manager.js`)
```javascript
const proxyManager = require('./src/proxy/proxy-manager');

// Add proxy
proxyManager.addProxy('socks5://host:port');

// Get next proxy (round-robin)
const proxy = proxyManager.getNextProxy();

// Get random proxy
const proxy = proxyManager.getRandomProxy();
```

### Validation Utils (`src/utils/validation.js`)
```javascript
const { validateScrapeConfig, validateTaskConfig, validateProxy } = 
  require('./src/utils/validation');

// Validate scrape config
const result = validateScrapeConfig({ url: 'https://example.com' });
// result: { valid: true, errors: [] }

// Validate proxy format
const result = validateProxy('socks5://host:8080');
// result: { valid: true, error: null }
```

### Configuration

Configuration is loaded from:
1. `config/default.js` (defaults)
2. `.env` file (environment variables)
3. Command line arguments (highest priority)

Key config sections:
- `browser` - Browser settings
- `paths` - Directory paths
- `proxy` - Proxy list
- `taskRunner` - Concurrency settings
- `smtp` / `slack` - Notifications

## License

MIT
