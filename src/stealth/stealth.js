/**
 * Stealth Module
 * Applies various anti-detection scripts to hide browser automation
 */

const logger = require('../logger/logger');

/**
 * Apply stealth scripts to page
 * @param {Page} page - Playwright page object
 */
async function applyStealthScripts(page) {
  try {
    await page.addInitScript(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
        configurable: true
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true
      });

      // Override chrome runtime
      if (window.chrome) {
        window.chrome.runtime = {
          connect: () => {},
          sendMessage: () => {}
        };
      }

      // Add permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Override notification permission
      Object.defineProperty(Notification, 'permission', {
        get: () => 'default',
        configurable: true
      });

      // WebGL fingerprint protection
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, arguments);
      };

      // Canvas fingerprint protection
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (this.width > 0 && this.height > 0) {
          const context = this.getContext('2d');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, this.width, this.height);
        }
        return originalToDataURL.apply(this, arguments);
      };

      // Add fake console debug
      window.console.debug = () => {};
      
      // Property overrides for Firefox
      try {
        // Override permissions for Firefox
        if (navigator.__proto__) {
          Object.defineProperty(navigator.__proto__, 'webdriver', {
            get: () => undefined,
            configurable: true
          });
        }
      } catch (e) {
        // Ignore errors
      }
    });

    logger.debug('Stealth scripts applied');
  } catch (error) {
    logger.warn('Failed to apply some stealth scripts:', error.message);
  }
}

/**
 * Check if page is detectable as bot
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} True if detected as bot
 */
async function isDetectedAsBot(page) {
  try {
    const result = await page.evaluate(() => {
      const indicators = [];
      
      if (navigator.webdriver === true) {
        indicators.push('navigator.webdriver is true');
      }
      
      if (window.cdc_adoQpoasnfa76pfcZLmcfl_Array !== undefined) {
        indicators.push('Playwright CDP detector found');
      }
      
      if (window.$cdc_asdjflasutopfhvcZLmcfl_ !== undefined) {
        indicators.push('Playwright CDP detector found');
      }
      
      return indicators;
    });
    
    return result.length > 0;
  } catch (error) {
    logger.warn('Error checking bot detection:', error.message);
    return false;
  }
}

/**
 * Randomize viewport to avoid fingerprinting
 * @param {Object} baseViewport - Base viewport dimensions
 * @returns {Object} Randomized viewport
 */
function randomizeViewport(baseViewport = { width: 1920, height: 1080 }) {
  const widthVariance = Math.floor(Math.random() * 100) - 50;
  const heightVariance = Math.floor(Math.random() * 60) - 30;
  
  return {
    width: baseViewport.width + widthVariance,
    height: baseViewport.height + heightVariance,
  };
}

module.exports = {
  applyStealthScripts,
  isDetectedAsBot,
  randomizeViewport,
};
