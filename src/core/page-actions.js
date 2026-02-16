/**
 * Page Actions Module
 * Reusable page interaction functions with retry and stealth integration
 */

const logger = require('../logger/logger');
const stealth = require('../stealth/stealth');
const humanBehavior = require('../stealth/human-behavior');

/**
 * Navigate to URL with retry and stealth
 * @param {Page} page - Playwright page
 * @param {string} url - URL to navigate to
 * @param {Object} options - Navigation options
 * @returns {Promise<void>}
 */
async function goto(page, url, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 2000;
  const waitUntil = options.waitUntil || 'networkidle';
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Navigating to ${url} (attempt ${attempt}/${maxRetries})`);
      
      await page.goto(url, {
        waitUntil,
        timeout: options.timeout || 30000,
      });
      
      // Apply stealth after navigation
      await stealth.applyStealthScripts(page);
      
      // Random human delay after navigation
      await humanBehavior.humanDelay(500, 1500);
      
      logger.debug(`Successfully navigated to ${url}`);
      return;
    } catch (error) {
      lastError = error;
      logger.warn(`Navigation attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        await humanBehavior.humanDelay(retryDelay, retryDelay * 2);
      }
    }
  }
  
  throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Click element with retry and human-like behavior
 * @param {Page} page - Playwright page
 * @param {string} selector - Element selector
 * @param {Object} options - Click options
 * @returns {Promise<void>}
 */
async function clickElement(page, selector, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const useHumanBehavior = options.human !== false;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Clicking ${selector} (attempt ${attempt}/${maxRetries})`);
      
      // Wait for element to be visible
      await page.waitForSelector(selector, { 
        state: 'visible', 
        timeout: options.timeout || 10000 
      });
      
      if (useHumanBehavior) {
        await humanBehavior.humanClick(page, selector, options);
      } else {
        await page.click(selector, options);
      }
      
      logger.debug(`Successfully clicked ${selector}`);
      return;
    } catch (error) {
      lastError = error;
      logger.warn(`Click attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        await humanBehavior.humanDelay(1000, 2000);
      }
    }
  }
  
  throw new Error(`Failed to click ${selector} after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Fill input with human-like typing
 * @param {Page} page - Playwright page
 * @param {string} selector - Input selector
 * @param {string} value - Value to fill
 * @param {Object} options - Fill options
 * @returns {Promise<void>}
 */
async function fillInput(page, selector, value, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const useHumanTyping = options.human !== false;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Filling ${selector} (attempt ${attempt}/${maxRetries})`);
      
      // Wait for input to be visible
      await page.waitForSelector(selector, { 
        state: 'visible', 
        timeout: options.timeout || 10000 
      });
      
      // Clear existing content
      await page.click(selector, { clickCount: 3 });
      await page.press(selector, 'Backspace');
      
      if (useHumanTyping) {
        await humanBehavior.humanType(page, selector, value, options);
      } else {
        await page.fill(selector, value);
      }
      
      logger.debug(`Successfully filled ${selector}`);
      return;
    } catch (error) {
      lastError = error;
      logger.warn(`Fill attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        await humanBehavior.humanDelay(1000, 2000);
      }
    }
  }
  
  throw new Error(`Failed to fill ${selector} after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Get text content from element
 * @param {Page} page - Playwright page
 * @param {string} selector - Element selector
 * @param {Object} options - Options
 * @returns {Promise<string>} Text content
 */
async function getText(page, selector, options = {}) {
  try {
    await page.waitForSelector(selector, { 
      state: 'visible', 
      timeout: options.timeout || 10000 
    });
    
    const text = await page.textContent(selector);
    logger.debug(`Got text from ${selector}: ${text ? text.substring(0, 50) : 'empty'}`);
    
    return text ? text.trim() : '';
  } catch (error) {
    logger.error(`Failed to get text from ${selector}:`, error.message);
    throw error;
  }
}

/**
 * Get all elements matching selector
 * @param {Page} page - Playwright page
 * @param {string} selector - Element selector
 * @param {Object} options - Options
 * @returns {Promise<Array>} Array of elements
 */
async function getElements(page, selector, options = {}) {
  try {
    const elements = await page.locator(selector).all();
    logger.debug(`Found ${elements.length} elements matching ${selector}`);
    
    return elements;
  } catch (error) {
    logger.error(`Failed to get elements ${selector}:`, error.message);
    throw error;
  }
}

/**
 * Wait for page to load completely
 * @param {Page} page - Playwright page
 * @param {Object} options - Wait options
 * @returns {Promise<void>}
 */
async function waitForPage(page, options = {}) {
  const waitUntil = options.waitUntil || 'domcontentloaded';
  const timeout = options.timeout || 30000;
  
  try {
    await page.waitForLoadState(waitUntil, { timeout });
    
    // Additional wait for dynamic content
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, {
        state: 'visible',
        timeout: options.selectorTimeout || 10000
      });
    }
    
    // Random delay for page stability
    await humanBehavior.humanDelay(300, 800);
    
    logger.debug('Page loaded successfully');
  } catch (error) {
    logger.error('Page load wait failed:', error.message);
    throw error;
  }
}

/**
 * Take screenshot of page
 * @param {Page} page - Playwright page
 * @param {string} path - Screenshot path
 * @param {Object} options - Screenshot options
 * @returns {Promise<string>} Screenshot path
 */
async function screenshot(page, path, options = {}) {
  try {
    const screenshotOptions = {
      path,
      fullPage: options.fullPage || false,
    };
    
    if (options.type) {
      screenshotOptions.type = options.type;
    }
    
    await page.screenshot(screenshotOptions);
    logger.debug(`Screenshot saved: ${path}`);
    
    return path;
  } catch (error) {
    logger.error(`Screenshot failed:`, error.message);
    throw error;
  }
}

/**
 * Scroll to bottom of page
 * @param {Page} page - Playwright page
 * @param {Object} options - Scroll options
 * @returns {Promise<void>}
 */
async function scrollToBottom(page, options = {}) {
  try {
    if (options.human) {
      await humanBehavior.humanScroll(page, options);
    } else {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    }
    
    logger.debug('Scrolled to bottom');
  } catch (error) {
    logger.error('Scroll failed:', error.message);
    throw error;
  }
}

/**
 * Check if element exists
 * @param {Page} page - Playwright page
 * @param {string} selector - Element selector
 * @returns {Promise<boolean>} True if element exists
 */
async function elementExists(page, selector) {
  try {
    const count = await page.locator(selector).count();
    return count > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for element to appear
 * @param {Page} page - Playwright page
 * @param {string} selector - Element selector
 * @param {Object} options - Wait options
 * @returns {Promise<boolean>} True if element appeared
 */
async function waitForElement(page, selector, options = {}) {
  try {
    await page.waitForSelector(selector, {
      state: options.visible ? 'visible' : 'attached',
      timeout: options.timeout || 30000,
    });
    return true;
  } catch (error) {
    if (options.silent) {
      return false;
    }
    throw error;
  }
}

module.exports = {
  goto,
  clickElement,
  fillInput,
  getText,
  getElements,
  waitForPage,
  screenshot,
  scrollToBottom,
  elementExists,
  waitForElement,
};
