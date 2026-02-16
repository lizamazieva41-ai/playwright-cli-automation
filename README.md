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
│   ├── index.js              # Entry point
│   ├── cli/commands/         # CLI commands
│   │   ├── login.js
│   │   ├── scrape.js
│   │   ├── test.js
│   │   └── run.js
│   ├── core/
│   │   ├── browser-manager.js
│   │   └── task-runner.js
│   ├── session/
│   │   └── session-manager.js
│   ├── stealth/
│   │   ├── stealth.js
│   │   ├── user-agents.js
│   │   └── human-behavior.js
│   ├── proxy/
│   │   └── proxy-manager.js
│   ├── scraper/
│   │   └── scraper.js
│   ├── logger/
│   │   └── logger.js
│   ├── notifier/
│   │   ├── notifier.js
│   │   ├── email.js
│   │   └── slack.js
│   └── storage/
│       └── storage.js
├── config/
│   └── default.js
├── data/
│   ├── sessions/
│   ├── output/
│   └── logs/
└── package.json
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

## License

MIT
