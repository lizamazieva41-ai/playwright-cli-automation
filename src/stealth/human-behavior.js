/**
 * Human Behavior Simulation Module
 * Simulates human-like interactions to avoid bot detection
 */

const logger = require('../logger/logger');

/**
 * Random delay between min and max milliseconds
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise<void>}
 */
async function humanDelay(min = 100, max = 500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Type text with random delays between keystrokes
 * @param {Page} page - Playwright page
 * @param {string} selector - Selector to type into
 * @param {string} text - Text to type
 * @param {Object} options - Options for typing
 */
async function humanType(page, selector, text, options = {}) {
  const minDelay = options.minDelay || 50;
  const maxDelay = options.maxDelay || 150;
  
  try {
    await page.click(selector);
    
    // Clear existing text if any
    await page.click(selector, { clickCount: 3 });
    await page.press(selector, 'Backspace');
    
    // Type each character with random delay
    for (const char of text) {
      await page.type(selector, char, { delay: Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay });
    }
    
    logger.debug(`Human-typed text into ${selector}`);
  } catch (error) {
    logger.error(`Failed to type text into ${selector}:`, error);
    throw error;
  }
}

/**
 * Click with human-like mouse movement
 * @param {Page} page - Playwright page
 * @param {string} selector - Selector to click
 * @param {Object} options - Click options
 */
async function humanClick(page, selector, options = {}) {
  const steps = options.steps || Math.floor(Math.random() * 10) + 5;
  
  try {
    // Get element position
    const element = await page.locator(selector).first();
    const box = await element.boundingBox();
    
    if (!box) {
      logger.warn(`Element ${selector} not found, using direct click`);
      await page.click(selector, options);
      return;
    }
    
    // Move mouse to element with steps
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    
    await page.mouse.move(startX, startY);
    
    // Random steps to reach target
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = startX + (box.x + box.width / 2 - startX) * progress + (Math.random() - 0.5) * 10;
      const y = startY + (box.y + box.height / 2 - startY) * progress + (Math.random() - 0.5) * 10;
      await page.mouse.move(x, y);
      await humanDelay(10, 30);
    }
    
    // Click with random delay
    await humanDelay(50, 200);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    
    logger.debug(`Human-clicked ${selector}`);
  } catch (error) {
    logger.warn(`Human click failed, falling back to direct click:`, error.message);
    await page.click(selector, options);
  }
}

/**
 * Scroll page with random movements
 * @param {Page} page - Playwright page
 * @param {Object} options - Scroll options
 */
async function humanScroll(page, options = {}) {
  const maxScrolls = options.maxScrolls || Math.floor(Math.random() * 3) + 1;
  const scrollDelay = options.scrollDelay || 500;
  
  try {
    for (let i = 0; i < maxScrolls; i++) {
      // Random scroll distance
      const scrollAmount = Math.floor(Math.random() * 500) + 200;
      const scrollDirection = Math.random() > 0.2 ? -1 : 1; // Mostly scroll down
      
      await page.mouse.wheel(0, scrollAmount * scrollDirection);
      await humanDelay(scrollDelay, scrollDelay + 500);
      
      // Occasionally scroll back a bit
      if (Math.random() > 0.7) {
        await page.mouse.wheel(0, -scrollAmount * 0.3);
        await humanDelay(200, 400);
      }
    }
    
    logger.debug('Human scroll completed');
  } catch (error) {
    logger.warn('Human scroll failed:', error.message);
  }
}

/**
 * Move mouse randomly on page
 * @param {Page} page - Playwright page
 * @param {number} moves - Number of mouse moves
 */
async function randomMouseMove(page, moves = 5) {
  const viewport = page.viewportSize();
  if (!viewport) return;
  
  let x = Math.random() * viewport.width;
  let y = Math.random() * viewport.height;
  
  for (let i = 0; i < moves; i++) {
    x = Math.random() * viewport.width;
    y = Math.random() * viewport.height;
    await page.mouse.move(x, y);
    await humanDelay(100, 300);
  }
}

/**
 * Simulate reading behavior (scroll slowly through content)
 * @param {Page} page - Playwright page
 * @param {number} duration - Duration in ms
 */
async function simulateReading(page, duration = 3000) {
  const startTime = Date.now();
  const viewport = page.viewportSize();
  if (!viewport) return;
  
  let currentPosition = 0;
  const maxPosition = await page.evaluate(() => document.body.scrollHeight);
  
  while (Date.now() - startTime < duration && currentPosition < maxPosition) {
    const scrollAmount = Math.random() * 100 + 50;
    currentPosition += scrollAmount;
    
    await page.evaluate((pos) => window.scrollTo(0, pos), currentPosition);
    await humanDelay(200, 500);
    
    // Occasionally pause
    if (Math.random() > 0.8) {
      await humanDelay(500, 1500);
    }
  }
}

/**
 * Complete human-like interaction sequence
 * @param {Page} page - Playwright page
 * @param {Object} actions - Array of actions to perform
 */
async function performHumanActions(page, actions) {
  for (const action of actions) {
    switch (action.type) {
      case 'delay':
        await humanDelay(action.min, action.max);
        break;
      case 'click':
        await humanClick(page, action.selector);
        break;
      case 'type':
        await humanType(page, action.selector, action.text);
        break;
      case 'scroll':
        await humanScroll(page, action.options);
        break;
      case 'goto':
        await page.goto(action.url, { waitUntil: 'networkidle' });
        await humanDelay(500, 1000);
        break;
      default:
        logger.warn(`Unknown action type: ${action.type}`);
    }
  }
}

module.exports = {
  humanDelay,
  humanType,
  humanClick,
  humanScroll,
  randomMouseMove,
  simulateReading,
  performHumanActions,
};
