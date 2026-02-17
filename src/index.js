#!/usr/bin/env node

/**
 * Playwright CLI Automation
 * Main entry point for the CLI application
 */

// Load environment variables
require('dotenv').config();

// Import Commander
const { Command } = require('commander');

// Import commands
const loginCommand = require('./cli/commands/login');
const scrapeCommand = require('./cli/commands/scrape');
const testCommand = require('./cli/commands/test');
const runCommand = require('./cli/commands/run');
const sessionCommand = require('./cli/commands/session');
const proxyCommand = require('./cli/commands/proxy');
const healthCommand = require('./cli/commands/health');

// Import logger
const logger = require('./logger/logger');

// Create main program
const program = new Command();

program
  .name('autobot')
  .description('CLI browser automation with Playwright - Firefox, stealth, proxy, parallel execution')
  .version('1.0.0');

// Register commands
program.addCommand(loginCommand);
program.addCommand(scrapeCommand);
program.addCommand(testCommand);
program.addCommand(runCommand);
program.addCommand(sessionCommand);
program.addCommand(proxyCommand);
program.addCommand(healthCommand);

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .hook('preAction', (thisCommand) => {
    // Set logging level based on verbose flag
    if (thisCommand.opts().verbose) {
      logger.level = 'debug';
      logger.info('Verbose logging enabled');
    }
  });

// Import browser manager for graceful shutdown
const browserManager = require('./core/browser-manager');

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  console.log(`\n⚠️  Received ${signal}, closing browsers...`);
  
  try {
    await browserManager.closeAll();
    logger.info('All browsers closed successfully');
    console.log('✅ Shutdown complete');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  console.error('\n❌ An unexpected error occurred:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', reason);
  console.error('\n❌ An unexpected error occurred:', reason);
  process.exit(1);
});

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}
