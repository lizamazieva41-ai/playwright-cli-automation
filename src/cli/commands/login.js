/**
 * Login Command
 * Opens browser for manual login and saves session
 */

const { Command } = require('commander');
const browserManager = require('../../core/browser-manager');
const sessionManager = require('../../session/session-manager');
const logger = require('../../logger/logger');

const loginCommand = new Command('login')
  .description('Open browser for manual login and save session')
  .requiredOption('-u, --url <url>', 'Login page URL')
  .option('-s, --session <name>', 'Session name (profile)', 'default')
  .option('-p, --proxy <proxy>', 'Proxy URL (socks5://host:port)')
  .option('--headful', 'Run browser in visible mode (not headless)')
  .option('--wait', 'Wait for manual confirmation before saving', true)
  .action(async (options) => {
    logger.info('Starting login command');
    logger.info(`Target URL: ${options.url}`);
    logger.info(`Session name: ${options.session}`);
    
    let context = null;
    let page = null;

    try {
      // Create context with options
      const contextOptions = {
        headless: !options.headful,
        proxy: options.proxy,
      };
      
      // Create browser session
      const browserSession = await browserManager.createBrowserSession(contextOptions);
      context = browserSession.context;
      page = browserSession.page;
      
      logger.info('Browser opened. Please log in manually...');
      
      // Navigate to login page
      await page.goto(options.url, { waitUntil: 'networkidle' });
      
      if (options.wait) {
        // Wait for user to confirm
        await new Promise(resolve => {
          const readline = require('readline');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          rl.question('\nPress Enter when you have completed login...', (answer) => {
            rl.close();
            resolve();
          });
        });
      } else {
        // Just wait a fixed time
        logger.info('Waiting 30 seconds for login...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      
      // Save session
      const sessionPath = await sessionManager.saveSession(context, options.session);
      logger.info(`Session saved: ${sessionPath}`);
      
      console.log(`\n✅ Login successful! Session saved as "${options.session}"`);
      console.log(`   Path: ${sessionPath}`);
      
    } catch (error) {
      logger.error('Login failed:', error);
      console.error('❌ Login failed:', error.message);
      process.exit(1);
    } finally {
      // Cleanup
      if (context) {
        await context.close();
      }
      await browserManager.closeAll();
    }
  });

module.exports = loginCommand;
