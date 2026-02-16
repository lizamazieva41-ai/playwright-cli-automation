/**
 * Session Manager Module
 * Handles saving and loading browser session state (cookies, localStorage)
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config/default');
const logger = require('../logger/logger');

class SessionManager {
  constructor() {
    this.sessionsDir = config.paths.sessions;
    this.ensureSessionsDir();
  }

  /**
   * Ensure sessions directory exists
   */
  ensureSessionsDir() {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
      logger.debug(`Created sessions directory: ${this.sessionsDir}`);
    }
  }

  /**
   * Get session file path
   * @param {string} profileName - Profile name
   * @returns {string} Full path to session file
   */
  getSessionPath(profileName) {
    return path.join(this.sessionsDir, `${profileName}.json`);
  }

  /**
   * Save session state (cookies, localStorage) to file
   * @param {BrowserContext} context - Browser context to save
   * @param {string} profileName - Profile name for the session
   * @returns {Promise<string>} Path to saved session file
   */
  async saveSession(context, profileName) {
    try {
      const sessionPath = this.getSessionPath(profileName);
      
      // Get storage state from context
      const storageState = await context.storageState({ path: sessionPath });
      
      logger.info(`Session saved: ${sessionPath}`);
      return sessionPath;
    } catch (error) {
      logger.error(`Failed to save session "${profileName}":`, error);
      throw error;
    }
  }

  /**
   * Get session file path for loading
   * @param {string} profileName - Profile name
   * @returns {string|null} Path to session file or null if not exists
   */
  loadSession(profileName) {
    const sessionPath = this.getSessionPath(profileName);
    
    if (fs.existsSync(sessionPath)) {
      logger.debug(`Session found: ${sessionPath}`);
      return sessionPath;
    }
    
    logger.warn(`Session not found: ${sessionPath}`);
    return null;
  }

  /**
   * Check if session is valid
   * @param {string} profileName - Profile name
   * @param {boolean} checkExpiry - Whether to check cookie expiry
   * @returns {Promise<boolean>} True if session is valid
   */
  async isSessionValid(profileName, checkExpiry = false) {
    const sessionPath = this.getSessionPath(profileName);
    
    if (!fs.existsSync(sessionPath)) {
      return false;
    }

    if (!checkExpiry) {
      return true;
    }

    try {
      const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      
      // Check if cookies are expired
      if (sessionData.cookies && sessionData.cookies.length > 0) {
        const now = Date.now();
        const expired = sessionData.cookies.some(cookie => {
          if (cookie.expires && cookie.expires !== -1) {
            return cookie.expires * 1000 < now;
          }
          return false;
        });
        
        if (expired) {
          logger.debug(`Session "${profileName}" has expired cookies`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error checking session validity:`, error);
      return false;
    }
  }

  /**
   * Delete session file
   * @param {string} profileName - Profile name
   * @returns {boolean} True if deleted
   */
  deleteSession(profileName) {
    const sessionPath = this.getSessionPath(profileName);
    
    if (fs.existsSync(sessionPath)) {
      try {
        fs.unlinkSync(sessionPath);
        logger.info(`Session deleted: ${sessionPath}`);
        return true;
      } catch (error) {
        logger.error(`Failed to delete session:`, error);
        return false;
      }
    }
    
    logger.warn(`Session not found for deletion: ${sessionPath}`);
    return false;
  }

  /**
   * List all available sessions
   * @returns {string[]} Array of profile names
   */
  listSessions() {
    this.ensureSessionsDir();
    
    try {
      const files = fs.readdirSync(this.sessionsDir);
      const sessions = files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
      
      return sessions;
    } catch (error) {
      logger.error('Failed to list sessions:', error);
      return [];
    }
  }

  /**
   * Get session info
   * @param {string} profileName - Profile name
   * @returns {Object|null} Session info
   */
  getSessionInfo(profileName) {
    const sessionPath = this.getSessionPath(profileName);
    
    if (!fs.existsSync(sessionPath)) {
      return null;
    }

    try {
      const stats = fs.statSync(sessionPath);
      const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      
      return {
        profileName,
        path: sessionPath,
        created: stats.birthtime,
        modified: stats.mtime,
        size: stats.size,
        cookieCount: sessionData.cookies?.length || 0,
        originCount: sessionData.origins?.length || 0,
      };
    } catch (error) {
      logger.error(`Failed to get session info:`, error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new SessionManager();
