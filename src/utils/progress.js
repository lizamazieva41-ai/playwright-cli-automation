/**
 * Progress Bar Helper
 * Wrapper for cli-progress to provide consistent progress tracking
 */

const cliProgress = require('cli-progress');

/**
 * Create a new progress bar
 * @param {number} total - Total number of items
 * @param {string} format - Custom format string
 * @returns {cliProgress.SingleBar} Progress bar instance
 */
function createProgressBar(total, format) {
  const defaultFormat = '{bar} {percentage}% | {value}/{total} | {passed} passed | {failed} failed | ETA: {eta}s';
  
  return new cliProgress.SingleBar({
    format: format || defaultFormat,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    stopOnComplete: true,
  });
}

/**
 * Format duration in milliseconds to human readable
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

module.exports = {
  createProgressBar,
  formatDuration,
};
