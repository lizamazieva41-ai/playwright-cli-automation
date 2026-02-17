const { Command } = require('commander');
const healthServer = require('../../health/server');
const logger = require('../../logger/logger');

const healthCommand = new Command('health')
  .description('Start a lightweight HTTP health endpoint (or run a one-shot check)')
  .option('-p, --port <n>', 'Port to listen on', parseInt, process.env.HEALTH_PORT || 3000)
  .option('--deep', 'Enable deep checks (attempt to launch browser)')
  .option('--once', 'Run a single health check and exit')
  .action(async (options) => {
    const port = options.port;

    // One-shot check
    if (options.once) {
      try {
        const status = await healthServer.check(!!options.deep);
        console.log(JSON.stringify(status, null, 2));
        process.exit(status.ok ? 0 : 1);
      } catch (err) {
        logger.error('Health check failed:', err);
        console.error(err.message);
        process.exit(2);
      }
    }

    // Long-running server
    try {
      await healthServer.start(port, { deep: !!options.deep });
      console.log(`Health endpoint available at http://localhost:${port}/health`);
      // keep process alive
      process.on('SIGINT', () => process.exit(0));
      process.on('SIGTERM', () => process.exit(0));
    } catch (err) {
      logger.error('Failed to start health server:', err);
      console.error(err.message);
      process.exit(1);
    }
  });

module.exports = healthCommand;
