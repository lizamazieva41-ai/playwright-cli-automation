/**
 * Scraper Module
 * Handles web scraping with configurable selectors and actions
 */

const logger = require('../logger/logger');
const { humanDelay, humanScroll } = require('../stealth/human-behavior');

class Scraper {
  /**
   * Scrape data from page using configuration
   * @param {Page} page - Playwright page
   * @param {Object} config - Scraping configuration
   * @returns {Promise<Object>} Scraped data
   */
  async scrape(page, config) {
    const results = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      data: null,
      error: null,
    };

    try {
      logger.info(`Starting scrape: ${config.url || page.url()}`);
      
      // Navigate to URL if provided
      if (config.url) {
        await page.goto(config.url, {
          waitUntil: config.waitUntil || 'networkidle',
          timeout: config.timeout || 30000,
        });
        
        // Human-like delay after page load
        await humanDelay(500, 1500);
        
        // Scroll page if enabled
        if (config.scroll) {
          await humanScroll(page, config.scroll);
        }
      }

      // Execute pre-actions
      if (config.actions && Array.isArray(config.actions)) {
        await this.executeActions(page, config.actions);
      }

      // Extract data using selectors
      if (config.selectors) {
        results.data = await this.extractData(page, config.selectors);
      }

      // Take screenshot if enabled
      if (config.screenshot) {
        const screenshotPath = await this.takeScreenshot(page, config.screenshot);
        results.screenshot = screenshotPath;
      }

      logger.info(`Scrape completed: ${config.url || page.url()}`);
      return results;
    } catch (error) {
      logger.error(`Scrape failed:`, error);
      results.error = error.message;
      
      // Take error screenshot if enabled
      if (config.screenshotOnError) {
        const screenshotPath = await this.takeScreenshot(page, config.screenshotOnError);
        results.screenshot = screenshotPath;
      }
      
      return results;
    }
  }

  /**
   * Execute pre-defined actions on page
   * @param {Page} page - Playwright page
   * @param {Array} actions - Array of actions
   */
  async executeActions(page, actions) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'click':
            await page.click(action.selector, action.options || {});
            await humanDelay(200, 500);
            break;
            
          case 'fill':
            await page.fill(action.selector, action.value);
            break;
          
          case 'type':
            await page.type(action.selector, action.value, { delay: 50 });
            break;
            
          case 'select':
            await page.selectOption(action.selector, action.value);
            break;
            
          case 'waitForSelector':
            await page.waitForSelector(action.selector, action.options || {});
            break;
            
          case 'waitForNavigation':
            await page.waitForNavigation(action.options || {});
            break;
            
          case 'scroll':
            await humanScroll(page, action.options || {});
            break;
            
          case 'wait':
            await humanDelay(action.min || 100, action.max || 500);
            break;
            
          case 'evaluate':
            await page.evaluate(action.fn);
            break;
            
          default:
            logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        logger.warn(`Action failed: ${action.type}`, error.message);
        if (action.required) {
          throw error;
        }
      }
    }
  }

  /**
   * Extract data using selectors
   * @param {Page} page - Playwright page
   * @param {Object} selectors - Selector configuration
   * @returns {Promise<Object>} Extracted data
   */
  async extractData(page, selectors) {
    const results = {};

    for (const [key, selectorConfig] of Object.entries(selectors)) {
      try {
        if (typeof selectorConfig === 'string') {
          // Simple selector
          results[key] = await page.textContent(selectorConfig);
        } else if (typeof selectorConfig === 'object') {
          // Complex selector with options
          const { selector, attribute, multiple, evaluate, ...waitOptions } = selectorConfig;

          // Wait for selector if specified
          if (waitOptions.waitFor) {
            await page.waitForSelector(selector, waitOptions);
          }

          if (multiple) {
            // Extract multiple elements
            const elements = await page.locator(selector).all();
            results[key] = await Promise.all(
              elements.map(async (el) => {
                if (attribute) {
                  return el.getAttribute(attribute);
                } else if (evaluate) {
                  return el.evaluate(evaluate);
                }
                return el.textContent();
              })
            );
          } else {
            // Extract single element
            const element = await page.locator(selector).first();
            
            if (attribute) {
              results[key] = await element.getAttribute(attribute);
            } else if (evaluate) {
              results[key] = await element.evaluate(evaluate);
            } else {
              results[key] = await element.textContent();
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to extract ${key}:`, error.message);
        results[key] = null;
      }
    }

    return results;
  }

  /**
   * Take screenshot of page
   * @param {Page} page - Playwright page
   * @param {string|Object} options - Screenshot options
   * @returns {Promise<string>} Screenshot path
   */
  async takeScreenshot(page, options) {
    const screenshotOptions = {
      path: options.path || `screenshot-${Date.now()}.png`,
      fullPage: options.fullPage || false,
    };

    if (options.clip) {
      screenshotOptions.clip = options.clip;
    }

    try {
      await page.screenshot(screenshotOptions);
      logger.debug(`Screenshot saved: ${screenshotOptions.path}`);
      return screenshotOptions.path;
    } catch (error) {
      logger.error('Screenshot failed:', error);
      return null;
    }
  }

  /**
   * Scrape multiple pages with pagination
   * @param {Page} page - Playwright page
   * @param {Object} config - Pagination config
   * @returns {Promise<Array>} Array of scraped data
   */
  async scrapeWithPagination(page, config) {
    const results = [];
    const { startPage = 1, maxPages = 10, nextSelector } = config;

    for (let currentPage = startPage; currentPage <= maxPages; currentPage++) {
      logger.info(`Scraping page ${currentPage}/${maxPages}`);
      
      // Scrape current page
      const pageData = await this.scrape(page, {
        ...config,
        url: null, // Already on the page
      });
      
      results.push(pageData);

      // Check if there's a next page
      if (currentPage < maxPages && nextSelector) {
        try {
          const nextButton = await page.locator(nextSelector).first();
          const isVisible = await nextButton.isVisible();
          
          if (!isVisible) {
            logger.info('No more pages to scrape');
            break;
          }
          
          await nextButton.click();
          await humanDelay(1000, 2000);
        } catch (error) {
          logger.warn('Failed to navigate to next page:', error.message);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Scrape list items with detail pages
   * @param {Page} page - Playwright page
   * @param {Object} config - List scraping config
   * @returns {Promise<Array>} Array of scraped items
   */
  async scrapeList(page, config) {
    const { listSelector, itemSelector, detailUrlAttribute = 'href', detailConfig } = config;
    
    // Get all list item URLs
    const urls = await page.locator(listSelector).evaluateAll(items => 
      items.map(item => item.getAttribute(detailUrlAttribute))
    );

    logger.info(`Found ${urls.length} items to scrape`);

    const results = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) continue;

      try {
        logger.debug(`Scraping item ${i + 1}/${urls.length}: ${url}`);
        
        // Navigate to detail page
        await page.goto(url, { waitUntil: 'networkidle' });
        await humanDelay(500, 1000);

        // Extract data from detail page
        const itemData = await this.scrape(page, detailConfig);
        results.push(itemData);

        // Go back to list
        await page.goBack();
        await humanDelay(500, 1000);
      } catch (error) {
        logger.error(`Failed to scrape item ${i + 1}:`, error);
        results.push({ url, error: error.message });
      }
    }

    return results;
  }
}

// Export singleton instance
module.exports = new Scraper();
