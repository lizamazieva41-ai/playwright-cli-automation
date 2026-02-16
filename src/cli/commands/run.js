/**
 * Run Command
 * Runs comprehensive tasks from configuration file (includes login, scrape, test)
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const browserManager = require('../../core/browser-manager');
const sessionManager = require('../../session/session-manager');
const proxyManager = require('../../proxy/proxy-manager');
const scraper = require('../../scraper/scraper');
const storage = require('../../storage/storage');
const notifier = require('../../notifier/notifier');
const logger = require('../../logger/logger');

const runCommand = new Command('run')
  .description('Run comprehensive tasks from configuration file')
  .requiredOption('-t, --task <file>', 'Task configuration file path (JSON)')
  .option('-p, --proxy <proxy>', 'Override proxy URL')
  .option('--rotate-proxy', 'Rotate through proxy list')
  .option('--parallel <n>', 'Number of parallel tasks', parseInt)
  .option('-o, --output <format>', 'Output format: json, csv', 'json')
  .option('--headful', 'Run browser in visible mode (not headless)')
  .option('--notify', 'Send notification on completion')
  .action(async (options) => {
    const startTime = Date.now();
    logger.info('Starting run command');
    
    let config;
    
    try {
      // Load task config file
      const configPath = path.resolve(options.task);
      if (!fs.existsSync(configPath)) {
        throw new Error(`Task file not found: ${configPath}`);
      }
      
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      logger.info(`Loaded task config from: ${configPath}`);
      
      // Execute tasks in sequence
      const results = [];
      
      // 1. Login step (if specified)
      if (config.login) {
        logger.info('Executing login step...');
        const loginResult = await executeLogin(config.login, options);
        results.push({ step: 'login', ...loginResult });
        
        if (loginResult.session) {
          config.scrape = config.scrape || {};
          config.scrape.session = loginResult.session;
        }
      }
      
      // 2. Scrape step (if specified)
      if (config.scrape) {
        logger.info('Executing scrape step...');
        const scrapeResult = await executeScrape(config.scrape, options);
        results.push({ step: 'scrape', ...scrapeResult });
      }
      
      // 3. Test step (if specified)
      if (config.test) {
        logger.info('Executing test step...');
        const testResult = await executeTest(config.test, options);
        results.push({ step: 'test', ...testResult });
      }
      
      // Calculate stats
      const duration = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      console.log(`\n✅ Run completed!`);
      console.log(`   Steps: ${results.length}`);
      console.log(`   Succeeded: ${successCount}`);
      console.log(`   Failed: ${failedCount}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      
      // Save results
      const outputPath = await storage.save(results, options.output);
      console.log(`   Output: ${outputPath}`);
      
      // Send notification if enabled
      if (options.notify) {
        await notifier.notifyTask({
          success: failedCount === 0,
          total: results.length,
          failed: failedCount,
          duration,
          results: { outputPath },
        });
      }
      
    } catch (error) {
      logger.error('Run failed:', error);
      console.error('❌ Run failed:', error.message);
      
      // Send error notification
      if (options.notify) {
        await notifier.notifyError(error, { command: 'run' });
      }
      
      process.exit(1);
    } finally {
      await browserManager.closeAll();
    }
  });

/**
 * Execute login step
 * @param {Object} config - Login config
 * @param {Object} options - Command options
 * @returns {Promise<Object>} Login result
 */
async function executeLogin(config, options) {
  let context = null;
  
  try {
    const browserSession = await browserManager.createBrowserSession({
      proxy: options.proxy || config.proxy,
      headless: !options.headful,
    });
    
    context = browserSession.context;
    const page = browserSession.page;
    
    // Navigate to login URL
    await page.goto(config.url, { waitUntil: 'networkidle' });
    
    // Wait for user to complete login
    console.log('\n⏳ Waiting for login... (Press Enter when done)');
    await new Promise(resolve => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
    
    // Save session
    const sessionName = config.session || 'default';
    const sessionPath = await sessionManager.saveSession(context, sessionName);
    
    return {
      success: true,
      session: sessionName,
      sessionPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

/**
 * Execute scrape step
 * @param {Object} config - Scrape config
 * @param {Object} options - Command options
 * @returns {Promise<Object>} Scrape result
 */
async function executeScrape(config, options) {
  try {
    // Load session if specified
    let storageState = null;
    if (config.session) {
      storageState = sessionManager.loadSession(config.session);
    }
    
    // Prepare URLs
    const urls = config.urls || [config.url];
    const results = [];
    
    const browserSession = await browserManager.createBrowserSession({
      proxy: options.proxy || config.proxy,
      storageState,
      headless: !options.headful,
    });
    
    for (const url of urls) {
      const result = await scraper.scrape(browserSession.page, {
        ...config,
        url,
      });
      results.push(result);
    }
    
    await browserSession.context.close();
    
    return {
      success: true,
      results,
      count: results.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute test step
 * @param {Object} config - Test config
 * @param {Object} options - Command options
 * @returns {Promise<Object>} Test result
 */
async function executeTest(config, options) {
  try {
    const browserSession = await browserManager.createBrowserSession({
      proxy: options.proxy || config.proxy,
      headless: !options.headful,
    });
    
    await browserSession.page.goto(config.url, { waitUntil: 'networkidle' });
    
    // Run basic checks
    const checks = config.checks || [];
    let passed = 0;
    let failed = 0;
    
    for (const check of checks) {
      // Simple title check as default
      if (check.type === 'title') {
        const title = await browserSession.page.title();
        if (title) passed++;
        else failed++;
      }
    }
    
    await browserSession.context.close();
    
    return {
      success: failed === 0,
      passed,
      failed,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = runCommand;
