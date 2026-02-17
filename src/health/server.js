const http = require('http');
const config = require('../../config/default');
const sessionManager = require('../session/session-manager');
const proxyManager = require('../proxy/proxy-manager');
const browserManager = require('../core/browser-manager');
const logger = require('../logger/logger');

async function check(deep = false) {
  const result = {
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    sessions: sessionManager.listSessions().length,
    proxies: proxyManager.getProxyCount(),
    browserLaunched: browserManager.isLaunched(),
    details: {},
  };

  if (deep) {
    // Deep check: try to launch a short-lived browser session
    try {
      const b = await browserManager.launchBrowser({ headless: true });
      result.details.launch = 'ok';
      // Close immediately
      await browserManager.closeAll();
      result.browserLaunched = false;
    } catch (err) {
      result.ok = false;
      result.details.launch = `error: ${err.message}`;
    }
  }

  return result;
}

function createHandler(opts = {}) {
  const deepByDefault = !!opts.deep;

  return async (req, res) => {
    if (req.url.startsWith('/health')) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const deep = url.searchParams.get('deep') === '1' || deepByDefault;

      try {
        const status = await check(deep);
        const body = JSON.stringify(status, null, 2);
        res.writeHead(status.ok ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(body);
      } catch (err) {
        logger.error('Health check failed:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    // Default response
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  };
}

function start(port = process.env.HEALTH_PORT || 3000, opts = {}) {
  const server = http.createServer(createHandler(opts));

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, () => {
      logger.info(`Health server listening on port ${port}`);
      resolve(server);
    });
  });
}

module.exports = { check, start };
