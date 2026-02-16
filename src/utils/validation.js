/**
 * Input Validation Utilities
 * Validates config files for scrape, task, and proxy
 */

/**
 * Validate scrape config
 * @param {Object} config - Scrape config object
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateScrapeConfig(config) {
  const errors = [];
  
  // Must have url or urls
  if (!config.url && (!config.urls || config.urls.length === 0)) {
    errors.push('Config must have "url" or "urls" property');
  }
  
  // Validate urls array if present
  if (config.urls && Array.isArray(config.urls)) {
    config.urls.forEach((url, index) => {
      if (typeof url !== 'string') {
        errors.push(`urls[${index}] must be a string`);
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errors.push(`urls[${index}] must be a valid HTTP(S) URL`);
      }
    });
  }
  
  // Validate url if present
  if (config.url && typeof config.url === 'string') {
    if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      errors.push('url must be a valid HTTP(S) URL');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate task config
 * @param {Object} config - Task config object
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTaskConfig(config) {
  const errors = [];
  
  // Must have at least one step: login, scrape, or test
  if (!config.login && !config.scrape && !config.test) {
    errors.push('Task must have at least one of: login, scrape, or test');
  }
  
  // Validate login step if present
  if (config.login) {
    if (!config.login.url) {
      errors.push('login must have url');
    }
  }
  
  // Validate scrape step if present
  if (config.scrape) {
    const scrapeResult = validateScrapeConfig(config.scrape);
    if (!scrapeResult.valid) {
      errors.push(...scrapeResult.errors.map(e => `scrape.${e}`));
    }
  }
  
  // Validate test step if present
  if (config.test) {
    if (!config.test.url) {
      errors.push('test must have url');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate proxy format
 * @param {string} proxy - Proxy URL
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateProxy(proxy) {
  if (!proxy || typeof proxy !== 'string') {
    return { valid: false, error: 'Proxy must be a non-empty string' };
  }
  
  // Must start with protocol
  if (!proxy.startsWith('http://') && 
      !proxy.startsWith('https://') && 
      !proxy.startsWith('socks4://') && 
      !proxy.startsWith('socks5://')) {
    return { valid: false, error: 'Proxy must start with http://, https://, socks4://, or socks5://' };
  }
  
  // Must have host:port
  const withoutProtocol = proxy.split('://')[1];
  if (!withoutProtocol || !withoutProtocol.includes(':')) {
    return { valid: false, error: 'Proxy must have host:port format' };
  }
  
  return { valid: true, error: null };
}

module.exports = {
  validateScrapeConfig,
  validateTaskConfig,
  validateProxy,
};
