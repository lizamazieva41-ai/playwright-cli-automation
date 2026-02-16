/**
 * Browser Manager Module
 * Handles Playwright browser and context creation with proxy, session, user-agent, and viewport support
 */

const { firefox } = require('playwright');
const config = require('../../config/default');
const logger = require('../logger/logger');
const { getRandomUserAgent } = require('../stealth/user-agents');
const { applyStealthScripts } = require('../stealth/stealth');

class BrowserManager {
  constructor() {
    this.browser = null;
    this.contexts = [];
  }

  /**
   * Launch browser instance
   * @param {Object} options - Browser launch options
   * @returns {Promise<Browser>} Browser instance
   */
  async launchBrowser(options = {}) {
    try {
      const launchOptions = {
        headless: options.headless ?? config.browser.headless,
        args: options.args ?? config.browser.args,
      };

      logger.info('Launching Firefox browser...');
      this.browser = await firefox.launch(launchOptions);
      logger.info('Browser launched successfully');
      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser:', error);
      throw error;
    }
  }

  /**
   * Create a new browser context
   * @param {Object} options - Context options
   * @param {string} options.proxy - Proxy URL (socks5://user:pass@host:port)
   * @param {string} options.storageState - Path to session file
   * @param {string} options.userAgent - Custom user agent
   * @param {Object} options.viewport - Viewport dimensions
   * @returns {Promise<BrowserContext>} New browser context
   */
  async createContext(options = {}) {
    if (!this.browser) {
      await this.launchBrowser();
    }

    try {
      const contextOptions = {
        viewport: options.viewport ?? config.browser.viewport,
        ignoreHTTPSErrors: true,
      };

      // Apply proxy if provided
      if (options.proxy) {
        contextOptions.proxy = {
          server: options.proxy,
        };
        logger.debug(`Using proxy: ${options.proxy}`);
      }

      // Apply storage state (session) if provided
      if (options.storageState) {
        contextOptions.storageState = options.storageState;
        logger.debug(`Loading session from: ${options.storageState}`);
      }

      // Apply user agent
      contextOptions.userAgent = options.userAgent ?? getRandomUserAgent();

      logger.info('Creating new browser context...');
      const context = await this.browser.newContext(contextOptions);
      this.contexts.push(context);
      logger.info('Context created successfully');

      return context;
    } catch (error) {
      logger.error('Failed to create context:', error);
      throw error;
    }
  }

  /**
   * Create a new page with stealth scripts injected
   * @param {BrowserContext} context - Browser context
   * @returns {Promise<Page>} New page with stealth
   */
  async createPage(context) {
    try {
      const page = await context.newPage();
      
      // Apply stealth scripts
      await applyStealthScripts(page);
      
      // Set default timeout
      page.setDefaultTimeout(config.browser.timeout);
      
      logger.debug('New page created with stealth scripts');
      return page;
    } catch (error) {
      logger.error('Failed to create page:', error);
      throw error;
    }
  }

  /**
   * Create a complete browser setup with context and page
   * @param {Object} options - Options for browser, context, and page
   * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page}>}
   */
  async createBrowserSession(options = {}) {
    // Reuse existing browser if already launched and connected
    if (!this.browser || !this.browser.isConnected()) {
      await this.launchBrowser(options);
    }
    
    const context = await this.createContext(options);
    const page = await this.createPage(context);

    return { browser: this.browser, context, page };
  }

  /**
   * Close a specific context
   * @param {BrowserContext} context - Context to close
   */
  async closeContext(context) {
    try {
      await context.close();
      this.contexts = this.contexts.filter(c => c !== context);
      logger.debug('Context closed');
    } catch (error) {
      logger.error('Failed to close context:', error);
    }
  }

  /**
   * Close all contexts and browser
   */
  async closeAll() {
    logger.info('Closing all browser resources...');
    
    // Close all contexts
    for (const context of this.contexts) {
      try {
        await context.close();
      } catch (error) {
        logger.warn('Error closing context:', error);
      }
    }
    this.contexts = [];

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Error closing browser:', error);
      }
    }
  }

  /**
   * Get current browser instance
   * @returns {Browser|null}
   */
  getBrowser() {
    return this.browser;
  }

  /**
   * Check if browser is launched
   * @returns {boolean}
   */
  isLaunched() {
    return this.browser !== null;
  }
}

// Export singleton instance
module.exports = new BrowserManager();
