/**
 * Test Command
 * Runs web tests with configurable checks
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const browserManager = require('../../core/browser-manager');
const logger = require('../../logger/logger');

const testCommand = new Command('test')
  .description('Run web tests with configurable checks')
  .requiredOption('-u, --url <url>', 'URL to test')
  .option('-c, --checks <file>', 'Checks file path (JSON)')
  .option('-p, --proxy <proxy>', 'Proxy URL (socks5://host:port)')
  .option('-s, --screenshot', 'Take screenshot on failure')
  .option('--headful', 'Run browser in visible mode (not headless)')
  .action(async (options) => {
    logger.info('Starting test command');
    logger.info(`Testing URL: ${options.url}`);
    
    let page = null;
    let context = null;

    try {
      // Create browser session
      const browserSession = await browserManager.createBrowserSession({
        proxy: options.proxy,
        headless: !options.headful,
      });
      
      context = browserSession.context;
      page = browserSession.page;
      
      // Navigate to URL
      await page.goto(options.url, { waitUntil: 'networkidle' });
      
      // Default checks if no file provided
      let checks = [];
      
      if (options.checks) {
        const checksPath = path.resolve(options.checks);
        if (fs.existsSync(checksPath)) {
          checks = JSON.parse(fs.readFileSync(checksPath, 'utf8'));
        } else {
          throw new Error(`Checks file not found: ${checksPath}`);
        }
      } else {
        // Default checks
        checks = [
          { type: 'title', expected: null, description: 'Page has title' },
          { type: 'status', expected: 200, description: 'Page loaded successfully' },
        ];
      }
      
      // Run checks
      const results = [];
      let passed = 0;
      let failed = 0;
      
      for (const check of checks) {
        const result = await runCheck(page, check);
        results.push(result);
        
        if (result.passed) {
          passed++;
          console.log(`✅ ${check.description || check.type}`);
        } else {
          failed++;
          console.log(`❌ ${check.description || check.type}: ${result.error}`);
          
          // Take screenshot on failure if enabled
          if (options.screenshot) {
            const screenshotPath = `data/output/test-failure-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath });
            console.log(`   Screenshot: ${screenshotPath}`);
          }
        }
      }
      
      // Summary
      console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
      
      if (failed > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      logger.error('Test failed:', error);
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    } finally {
      if (context) {
        await context.close();
      }
      await browserManager.closeAll();
    }
  });

/**
 * Run a single check on the page
 * @param {Page} page - Playwright page
 * @param {Object} check - Check configuration
 * @returns {Promise<Object>} Check result
 */
async function runCheck(page, check) {
  try {
    switch (check.type) {
      case 'title':
        const title = await page.title();
        if (check.expected) {
          return {
            type: check.type,
            passed: title.includes(check.expected),
            actual: title,
            expected: check.expected,
            error: title.includes(check.expected) ? null : `Title "${title}" does not contain "${check.expected}"`,
          };
        }
        return {
          type: check.type,
          passed: !!title,
          actual: title,
          error: null,
        };
        
      case 'status':
        const response = await page.evaluate(() => {
          return window.performance?.getEntriesByType('navigation')[0]?.responseStatus || 200;
        });
        return {
          type: check.type,
          passed: response === check.expected,
          actual: response,
          expected: check.expected,
          error: response === check.expected ? null : `Status ${response} does not match ${check.expected}`,
        };
        
      case 'selector':
        const element = await page.$(check.selector);
        return {
          type: check.type,
          passed: !!element,
          actual: element ? 'found' : 'not found',
          expected: check.selector,
          error: element ? null : `Selector "${check.selector}" not found`,
        };
        
      case 'text':
        const text = await page.textContent(check.selector);
        return {
          type: check.type,
          passed: text?.includes(check.expected),
          actual: text,
          expected: check.expected,
          error: text?.includes(check.expected) ? null : `Text "${text}" does not contain "${check.expected}"`,
        };
        
      case 'attribute':
        const attr = await page.getAttribute(check.selector, check.attribute);
        return {
          type: check.type,
          passed: attr === check.expected,
          actual: attr,
          expected: check.expected,
          error: attr === check.expected ? null : `Attribute ${check.attribute} is "${attr}" instead of "${check.expected}"`,
        };
        
      case 'visible':
        const isVisible = await page.isVisible(check.selector);
        return {
          type: check.type,
          passed: isVisible === (check.expected !== false),
          actual: isVisible ? 'visible' : 'hidden',
          expected: check.expected !== false ? 'visible' : 'hidden',
          error: isVisible === (check.expected !== false) ? null : `Element is ${isVisible ? 'visible' : 'hidden'}`,
        };
        
      case 'evaluate':
        const evalResult = await page.evaluate(check.fn);
        return {
          type: check.type,
          passed: !!evalResult,
          actual: evalResult,
          error: evalResult ? null : 'Evaluation returned falsy value',
        };
        
      default:
        return {
          type: check.type,
          passed: false,
          error: `Unknown check type: ${check.type}`,
        };
    }
  } catch (error) {
    return {
      type: check.type,
      passed: false,
      error: error.message,
    };
  }
}

module.exports = testCommand;
