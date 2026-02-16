/**
 * Email Notifier Module
 * Sends email notifications using NodeMailer
 */

const nodemailer = require('nodemailer');
const config = require('../../config/default');
const logger = require('../logger/logger');

class EmailNotifier {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    if (!config.smtp.user || !config.smtp.pass) {
      logger.debug('Email notifier not configured - missing SMTP credentials');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });

    logger.debug('Email transporter initialized');
  }

  /**
   * Send email notification
   * @param {string} subject - Email subject
   * @param {string} body - Email body (HTML or plain text)
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} True if sent successfully
   */
  async sendEmail(subject, body, options = {}) {
    if (!this.transporter) {
      logger.warn('Email transporter not initialized');
      return false;
    }

    const mailOptions = {
      from: options.from || config.smtp.from,
      to: options.to || config.smtp.to,
      subject: subject,
      html: body,
      text: this.stripHtml(body),
    };

    // Add attachments if provided
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send task completion notification
   * @param {Object} taskResult - Task result data
   * @returns {Promise<boolean>}
   */
  async sendTaskNotification(taskResult) {
    const { success, total, failed, duration, results } = taskResult;
    
    const subject = success ? 
      `✅ Task Completed: ${total} items processed` : 
      `❌ Task Failed: ${failed} errors`;
    
    const body = `
      <h2>Task Notification</h2>
      <p><strong>Status:</strong> ${success ? 'Success' : 'Failed'}</p>
      <p><strong>Total:</strong> ${total}</p>
      <p><strong>Succeeded:</strong> ${total - failed}</p>
      <p><strong>Failed:</strong> ${failed}</p>
      <p><strong>Duration:</strong> ${(duration / 1000).toFixed(2)}s</p>
      <hr>
      <h3>Results Summary</h3>
      <pre>${JSON.stringify(results, null, 2)}</pre>
    `;

    return this.sendEmail(subject, body);
  }

  /**
   * Send error notification
   * @param {string} error - Error message
   * @param {Object} context - Error context
   * @returns {Promise<boolean>}
   */
  async sendErrorNotification(error, context = {}) {
    const subject = `🚨 Error Notification: ${error.message || 'Unknown Error'}`;
    
    const body = `
      <h2>Error Notification</h2>
      <p><strong>Error:</strong> ${error.message || error}</p>
      <p><strong>Stack:</strong></p>
      <pre>${error.stack || 'No stack trace'}</pre>
      <hr>
      <h3>Context</h3>
      <pre>${JSON.stringify(context, null, 2)}</pre>
    `;

    return this.sendEmail(subject, body);
  }

  /**
   * Strip HTML tags from string
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Check if email is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.transporter !== null;
  }
}

// Export singleton instance
module.exports = new EmailNotifier();
