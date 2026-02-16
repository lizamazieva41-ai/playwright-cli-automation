/**
 * Logger Module
 * Winston-based logging with console and file output
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../../config/default');

// Ensure logs directory exists
const logsDir = config.paths.logs;
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    return msg;
  })
);

// Create console format with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let msg = `${timestamp} ${level}: ${message}`;
    if (stack && level === 'error') {
      msg += `\n${stack}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // General log file
    new winston.transports.File({
      filename: path.join(logsDir, `app-${getDateString()}.log`),
      maxsize: parseSize(config.logging.maxSize),
      maxFiles: config.logging.maxFiles,
      level: 'info',
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, `error-${getDateString()}.log`),
      maxsize: parseSize(config.logging.maxSize),
      maxFiles: config.logging.maxFiles,
      level: 'error',
    }),
    
    // Debug log file (optional)
    new winston.transports.File({
      filename: path.join(logsDir, `debug-${getDateString()}.log`),
      maxsize: parseSize(config.logging.maxSize),
      maxFiles: 5,
      level: 'debug',
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, `exceptions-${getDateString()}.log`),
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, `rejections-${getDateString()}.log`),
    }),
  ],
});

/**
 * Get current date string for filename
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Parse size string to bytes
 * @param {string} size - Size string (e.g., '20m')
 * @returns {number} Size in bytes
 */
function parseSize(size) {
  const match = size.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 20 * 1024 * 1024; // default 20MB
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'k':
      return value * 1024;
    case 'm':
      return value * 1024 * 1024;
    case 'g':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

/**
 * Create a child logger with additional context
 * @param {string} context - Context label
 * @returns {winston.Logger} Child logger
 */
function createChildLogger(context) {
  return logger.child({ context });
}

/**
 * Log HTTP request
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 */
function logRequest(method, url, statusCode, duration) {
  logger.info(`${method} ${url} ${statusCode} - ${duration}ms`);
}

/**
 * Log task execution
 * @param {string} taskName - Name of the task
 * @param {string} status - Task status (started/completed/failed)
 * @param {Object} metadata - Additional metadata
 */
function logTask(taskName, status, metadata = {}) {
  logger.info(`Task [${taskName}] ${status}`, metadata);
}

// Export logger and helper functions
module.exports = logger;
module.exports.createChildLogger = createChildLogger;
module.exports.logRequest = logRequest;
module.exports.logTask = logTask;
module.exports.getDateString = getDateString;
