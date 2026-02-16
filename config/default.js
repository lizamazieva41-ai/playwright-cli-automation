/**
 * Default Configuration
 * Central configuration for the Playwright CLI Automation tool
 */

const fs = require('fs');
const path = require('path');

// Resolve paths relative to project root
const projectRoot = path.resolve(__dirname, '..');

const config = {
  // Project paths
  paths: {
    root: projectRoot,
    data: path.join(projectRoot, 'data'),
    sessions: path.join(projectRoot, 'data', 'sessions'),
    output: path.join(projectRoot, 'data', 'output'),
    logs: path.join(projectRoot, 'data', 'logs'),
  },

  // Browser configuration
  browser: {
    browserType: 'firefox',
    headless: process.env.BROWSER_HEADLESS !== 'false',
    viewport: {
      width: parseInt(process.env.BROWSER_VIEWPORT_WIDTH || '1920', 10),
      height: parseInt(process.env.BROWSER_VIEWPORT_HEIGHT || '1080', 10),
    },
    timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  },

  // Session configuration
  session: {
    dir: process.env.SESSION_DIR || './data/sessions',
    defaultExpiryDays: parseInt(process.env.SESSION_DEFAULT_EXPIRY_DAYS || '30', 10),
  },

  // Output configuration
  output: {
    dir: process.env.OUTPUT_DIR || './data/output',
    format: process.env.OUTPUT_FORMAT || 'json',
  },

  // Logging configuration
  logging: {
    dir: process.env.LOG_DIR || './data/logs',
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '30', 10),
    maxSize: '20m',
  },

  // Proxy configuration
  proxy: {
    list: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',').filter(p => p.trim()) : [],
  },

  // Task runner configuration
  taskRunner: {
    defaultConcurrency: parseInt(process.env.DEFAULT_CONCURRENCY || '3', 10),
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '10', 10),
  },

  // SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Autobot <noreply@example.com>',
    to: process.env.SMTP_TO || '',
  },

  // Slack configuration
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  },
};

// Auto-create required directories if they don't exist
const dirsToCreate = [
  config.paths.data,
  config.paths.sessions,
  config.paths.output,
  config.paths.logs,
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

module.exports = config;
