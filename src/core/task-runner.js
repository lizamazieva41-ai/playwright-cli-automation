/**
 * Task Runner Module
 * Handles parallel execution of multiple tasks with concurrency control
 */

const pLimit = require('p-limit');
const config = require('../../config/default');
const logger = require('../logger/logger');

class TaskRunner {
  constructor() {
    this.concurrency = config.taskRunner.defaultConcurrency;
    this.maxConcurrency = config.taskRunner.maxConcurrency;
  }

  /**
   * Run tasks in parallel with concurrency control
   * @param {Array<Function>} tasks - Array of async task functions
   * @param {number} concurrency - Max concurrent tasks
   * @returns {Promise<Array>} Array of task results
   */
  async runParallel(tasks, concurrency) {
    const limit = pLimit(concurrency || this.concurrency);
    
    logger.info(`Starting ${tasks.length} tasks with concurrency ${concurrency || this.concurrency}`);
    
    const taskPromises = tasks.map((task, index) => 
      limit(async () => {
        try {
          logger.debug(`Task ${index + 1} started`);
          const startTime = Date.now();
          const result = await task();
          const duration = Date.now() - startTime;
          
          logger.debug(`Task ${index + 1} completed in ${duration}ms`);
          return {
            index,
            success: true,
            result,
            duration,
            error: null,
          };
        } catch (error) {
          logger.error(`Task ${index + 1} failed:`, error);
          return {
            index,
            success: false,
            result: null,
            duration: 0,
            error: error.message,
          };
        }
      })
    );

    const results = await Promise.all(taskPromises);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    logger.info(`Tasks completed: ${successCount} succeeded, ${failedCount} failed`);
    
    return results;
  }

  /**
   * Run tasks with proxy rotation
   * @param {Array} taskConfigs - Array of task configurations
   * @param {Object} options - Runner options
   * @returns {Promise<Array>} Array of results
   */
  async runWithProxies(taskConfigs, options = {}) {
    const proxyManager = require('../proxy/proxy-manager');
    const concurrency = options.concurrency || this.concurrency;
    
    const tasks = taskConfigs.map((config, index) => async () => {
      // Get next proxy
      const proxy = options.rotateProxy ? proxyManager.getNextProxy() : options.proxy || null;
      
      // Merge options with task config
      const taskOptions = {
        ...options,
        ...config,
        proxy,
      };
      
      // Execute the task
      return this.executeTask(taskOptions);
    });

    return this.runParallel(tasks, concurrency);
  }

  /**
   * Execute a single task
   * @param {Object} options - Task options
   * @returns {Promise<Object>} Task result
   */
  async executeTask(options) {
    const browserManager = require('./browser-manager');
    const scraper = require('../scraper/scraper');
    const sessionManager = require('../session/session-manager');
    
    let browser = null;
    let context = null;
    let page = null;

    try {
      // Load session if specified
      let storageState = null;
      if (options.session) {
        storageState = sessionManager.loadSession(options.session);
        if (!storageState) {
          logger.warn(`Session "${options.session}" not found, proceeding without session`);
        }
      }

      // Create browser session
      const browserSession = await browserManager.createBrowserSession({
        proxy: options.proxy,
        storageState,
        headless: options.headless,
      });

      browser = browserSession.browser;
      context = browserSession.context;
      page = browserSession.page;

      // Execute scrape
      const result = await scraper.scrape(page, options);
      
      return result;
    } catch (error) {
      logger.error('Task execution failed:', error);
      throw error;
    } finally {
      // Cleanup
      if (context) {
        await context.close();
      }
    }
  }

  /**
   * Run tasks sequentially
   * @param {Array<Function>} tasks - Array of async task functions
   * @returns {Promise<Array>} Array of results
   */
  async runSequential(tasks) {
    logger.info(`Running ${tasks.length} tasks sequentially`);
    
    const results = [];
    
    for (let i = 0; i < tasks.length; i++) {
      try {
        logger.debug(`Task ${i + 1}/${tasks.length} started`);
        const result = await tasks[i]();
        results.push({
          index: i,
          success: true,
          result,
          error: null,
        });
      } catch (error) {
        logger.error(`Task ${i + 1} failed:`, error);
        results.push({
          index: i,
          success: false,
          result: null,
          error: error.message,
        });
      }
    }
    
    return results;
  }

  /**
   * Run tasks with retry logic
   * @param {Array<Function>} tasks - Array of async task functions
   * @param {number} maxRetries - Max retry attempts
   * @param {number} concurrency - Max concurrent tasks
   * @returns {Promise<Array>} Array of results
   */
  async runWithRetry(tasks, maxRetries = 3, concurrency) {
    const limit = pLimit(concurrency || this.concurrency);
    
    const tasksWithRetry = tasks.map((task, index) => 
      limit(async () => {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            logger.debug(`Task ${index + 1}, attempt ${attempt}`);
            const result = await task();
            return {
              index,
              success: true,
              result,
              attempts: attempt,
              error: null,
            };
          } catch (error) {
            lastError = error;
            logger.warn(`Task ${index + 1}, attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxRetries) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
        }
        
        return {
          index,
          success: false,
          result: null,
          attempts: maxRetries,
          error: lastError.message,
        };
      })
    );

    return Promise.all(tasksWithRetry);
  }

  /**
   * Set concurrency limit
   * @param {number} concurrency - New concurrency limit
   */
  setConcurrency(concurrency) {
    this.concurrency = Math.min(concurrency, this.maxConcurrency);
    logger.info(`Concurrency set to ${this.concurrency}`);
  }

  /**
   * Get current concurrency setting
   * @returns {number}
   */
  getConcurrency() {
    return this.concurrency;
  }
}

// Export singleton instance
module.exports = new TaskRunner();
