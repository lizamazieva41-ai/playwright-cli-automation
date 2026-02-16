/**
 * Proxy Manager Module
 * Manages SOCKS proxy list, round-robin selection, and proxy testing
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config/default');
const logger = require('../logger/logger');

class ProxyManager {
  constructor() {
    this.proxies = [];
    this.currentIndex = 0;
    this.loadProxies();
  }

  /**
   * Load proxies from configuration or file
   */
  loadProxies() {
    // Load from config
    if (config.proxy.list && config.proxy.list.length > 0) {
      this.proxies = config.proxy.list;
      logger.info(`Loaded ${this.proxies.length} proxies from config`);
    }

    // Try to load from file
    const proxyFile = path.join(config.paths.data, 'proxies.txt');
    if (fs.existsSync(proxyFile)) {
      const content = fs.readFileSync(proxyFile, 'utf8');
      const fileProxies = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      if (fileProxies.length > 0) {
        this.proxies = [...new Set([...this.proxies, ...fileProxies])];
        logger.info(`Loaded ${fileProxies.length} proxies from file`);
      }
    }

    logger.info(`Total proxies loaded: ${this.proxies.length}`);
  }

  /**
   * Add a proxy to the list
   * @param {string} proxy - Proxy URL (socks5://user:pass@host:port)
   */
  addProxy(proxy) {
    if (proxy && !this.proxies.includes(proxy)) {
      this.proxies.push(proxy);
      logger.debug(`Added proxy: ${proxy}`);
    }
  }

  /**
   * Remove a proxy from the list
   * @param {string} proxy - Proxy to remove
   */
  removeProxy(proxy) {
    const index = this.proxies.indexOf(proxy);
    if (index > -1) {
      this.proxies.splice(index, 1);
      logger.debug(`Removed proxy: ${proxy}`);
    }
  }

  /**
   * Get next proxy using round-robin
   * @returns {string|null} Next proxy URL
   */
  getNextProxy() {
    if (this.proxies.length === 0) {
      return null;
    }

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    
    return proxy;
  }

  /**
   * Get a random proxy
   * @returns {string|null} Random proxy URL
   */
  getRandomProxy() {
    if (this.proxies.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * this.proxies.length);
    return this.proxies[index];
  }

  /**
   * Get all proxies
   * @returns {string[]} All proxies
   */
  getAllProxies() {
    return [...this.proxies];
  }

  /**
   * Get proxy count
   * @returns {number} Number of proxies
   */
  getProxyCount() {
    return this.proxies.length;
  }

  /**
   * Test if a proxy is working
   * @param {string} proxy - Proxy URL to test
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<boolean>} True if proxy works
   */
  async testProxy(proxy, timeout = 10000) {
    const { firefox } = require('playwright');
    
    try {
      logger.debug(`Testing proxy: ${proxy}`);
      
      const browser = await firefox.launch({
        headless: true,
        args: ['--no-sandbox']
      });

      const context = await browser.newContext({
        proxy: { server: proxy },
        timeout: timeout
      });

      // Try to create a page and navigate
      const page = await context.newPage();
      await page.goto('https://httpbin.org/ip', { 
        timeout: timeout,
        waitUntil: 'domcontentloaded'
      });

      await context.close();
      await browser.close();

      logger.info(`Proxy works: ${proxy}`);
      return true;
    } catch (error) {
      logger.warn(`Proxy test failed for ${proxy}:`, error.message);
      return false;
    }
  }

  /**
   * Test all proxies and return working ones
   * @param {number} concurrency - Number of concurrent tests
   * @returns {Promise<string[]>} Array of working proxies
   */
  async testAllProxies(concurrency = 3) {
    const results = [];
    const pLimit = require('p-limit');
    const limit = pLimit(concurrency);

    const testPromises = this.proxies.map(proxy => 
      limit(async () => {
        const works = await this.testProxy(proxy);
        return works ? proxy : null;
      })
    );

    const testResults = await Promise.all(testPromises);
    
    // Filter out failed proxies
    const workingProxies = testResults.filter(p => p !== null);
    
    logger.info(`Proxy test complete: ${workingProxies.length}/${this.proxies.length} working`);
    
    return workingProxies;
  }

  /**
   * Save proxies to file
   * @param {string} filepath - Path to save proxies
   */
  saveProxiesToFile(filepath) {
    try {
      fs.writeFileSync(filepath, this.proxies.join('\n'), 'utf8');
      logger.info(`Saved ${this.proxies.length} proxies to ${filepath}`);
    } catch (error) {
      logger.error('Failed to save proxies:', error);
    }
  }

  /**
   * Parse proxy string to components
   * @param {string} proxy - Proxy URL
   * @returns {Object} Proxy components
   */
  parseProxy(proxy) {
    const match = proxy.match(/^(socks5?|http):\/?\/?(?:(\w+):(\w+)@)?([\w.-]+):(\d+)$/i);
    
    if (!match) {
      return null;
    }

    return {
      protocol: match[1].toLowerCase(),
      username: match[2] || null,
      password: match[3] || null,
      host: match[4],
      port: parseInt(match[5], 10),
      url: proxy
    };
  }

  /**
   * Reset round-robin index
   */
  resetIndex() {
    this.currentIndex = 0;
  }
}

// Export singleton instance
module.exports = new ProxyManager();
