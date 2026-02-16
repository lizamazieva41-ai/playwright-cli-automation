/**
 * Slack Notifier Module
 * Sends Slack notifications via Incoming Webhook
 */

const config = require('../../config/default');
const logger = require('../logger/logger');

class SlackNotifier {
  constructor() {
    this.webhookUrl = config.slack.webhookUrl;
    this.initialized = !!this.webhookUrl;
    
    if (!this.initialized) {
      logger.warn('Slack notifier not configured - missing webhook URL');
    } else {
      logger.info('Slack notifier initialized');
    }
  }

  /**
   * Send message to Slack webhook
   * @param {Object} payload - Slack message payload
   * @returns {Promise<boolean>} True if sent successfully
   */
  async sendMessage(payload) {
    if (!this.initialized) {
      logger.warn('Slack webhook not configured');
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }

      logger.info('Slack notification sent');
      return true;
    } catch (error) {
      logger.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  /**
   * Send simple text message
   * @param {string} text - Message text
   * @returns {Promise<boolean>}
   */
  async sendText(text) {
    return this.sendMessage({ text });
  }

  /**
   * Send rich message with blocks
   * @param {string} title - Message title
   * @param {string} message - Message body
   * @param {string} color - Message color (good, warning, danger)
   * @returns {Promise<boolean>}
   */
  async sendRichMessage(title, message, color = 'good') {
    const payload = {
      attachments: [
        {
          color: color,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: title,
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: message,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Sent from *Autobot* at ${new Date().toISOString()}`,
                },
              ],
            },
          ],
        },
      ],
    };

    return this.sendMessage(payload);
  }

  /**
   * Send task completion notification
   * @param {Object} taskResult - Task result data
   * @returns {Promise<boolean>}
   */
  async sendTaskNotification(taskResult) {
    const { success, total, failed, duration, results } = taskResult;
    
    const color = success ? 'good' : 'danger';
    const emoji = success ? '✅' : '❌';
    const status = success ? 'Completed Successfully' : 'Failed';
    
    const message = `
*Status:* ${status}
*Total:* ${total}
*Succeeded:* ${total - failed}
*Failed:* ${failed}
*Duration:* ${(duration / 1000).toFixed(2)}s
    `.trim();

    return this.sendRichMessage(`${emoji} Task ${status}`, message, color);
  }

  /**
   * Send error notification
   * @param {string} error - Error message
   * @param {Object} context - Error context
   * @returns {Promise<boolean>}
   */
  async sendErrorNotification(error, context = {}) {
    const errorMessage = error.message || error;
    const contextText = Object.keys(context).length > 0 
      ? `\n\n*Context:*\n\`\`\`\n${JSON.stringify(context, null, 2)}\n\`\`\``
      : '';

    const message = `
*Error:* ${errorMessage}${contextText}
    `.trim();

    return this.sendRichMessage('🚨 Error Notification', message, 'danger');
  }

  /**
   * Check if Slack is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.initialized;
  }
}

// Export singleton instance
module.exports = new SlackNotifier();
