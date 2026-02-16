/**
 * Unified Notifier Module
 * Coordinates notifications across multiple channels (Email, Slack)
 */

const emailNotifier = require('./email');
const slackNotifier = require('./slack');
const logger = require('../logger/logger');

class Notifier {
  constructor() {
    this.channels = [];
    
    // Determine available channels
    if (emailNotifier.isConfigured()) {
      this.channels.push('email');
    }
    if (slackNotifier.isConfigured()) {
      this.channels.push('slack');
    }
    
    logger.info(`Notifier initialized with channels: ${this.channels.join(', ') || 'none'}`);
  }

  /**
   * Send notification through all configured channels
   * @param {string} type - Notification type: 'task', 'error', 'custom'
   * @param {Object} data - Notification data
   * @param {Object} options - Channel options
   * @returns {Promise<Object>} Results from each channel
   */
  async notify(type, data, options = {}) {
    const results = {
      email: false,
      slack: false,
    };

    const channels = options.channels || this.channels;
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (type === 'task') {
              results.email = await emailNotifier.sendTaskNotification(data);
            } else if (type === 'error') {
              results.email = await emailNotifier.sendErrorNotification(data.error, data.context);
            } else if (type === 'custom') {
              results.email = await emailNotifier.sendEmail(data.subject, data.body, data.options);
            }
            break;
            
          case 'slack':
            if (type === 'task') {
              results.slack = await slackNotifier.sendTaskNotification(data);
            } else if (type === 'error') {
              results.slack = await slackNotifier.sendErrorNotification(data.error, data.context);
            } else if (type === 'custom') {
              results.slack = await slackNotifier.sendRichMessage(data.title, data.message, data.color);
            }
            break;
        }
      } catch (error) {
        logger.error(`Failed to send ${channel} notification:`, error);
      }
    }

    return results;
  }

  /**
   * Send task completion notification
   * @param {Object} taskResult - Task result data
   * @param {Object} options - Notification options
   * @returns {Promise<Object>}
   */
  async notifyTask(taskResult, options = {}) {
    return this.notify('task', taskResult, options);
  }

  /**
   * Send error notification
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   * @param {Object} options - Notification options
   * @returns {Promise<Object>}
   */
  async notifyError(error, context = {}, options = {}) {
    return this.notify('error', { error, context }, options);
  }

  /**
   * Send custom notification
   * @param {string} subject - Subject/title
   * @param {string} message - Message body
   * @param {Object} options - Options (color for Slack)
   * @returns {Promise<Object>}
   */
  async notifyCustom(subject, message, options = {}) {
    // For email
    const emailData = {
      subject,
      body: message,
      options: {},
    };
    
    // For Slack
    const slackData = {
      title: subject,
      message,
      color: options.color || 'good',
    };
    
    return this.notify('custom', { ...emailData, ...slackData }, options);
  }

  /**
   * Check if any notification channel is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.channels.length > 0;
  }

  /**
   * Get available channels
   * @returns {string[]}
   */
  getChannels() {
    return [...this.channels];
  }
}

// Export singleton instance
module.exports = new Notifier();
