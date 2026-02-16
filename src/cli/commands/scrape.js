/**
 * Scrape Command
 * Runs web scraping tasks with configuration file
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

const scrapeCommand = new Command('scrape')
  .description('Scrape data from websites using configuration file')
  .requiredOption('-c, --config <file>', 'Configuration file path (JSON)')
  .option('-s, --session <name>', 'Session name to use')
  .option('-p, --proxy <proxy>', 'Proxy URL (socks5://host:port)')
  .option('--rotate-proxy', 'Rotate through proxy list')
  .option('--parallel <n>', 'Number of parallel tasks', parseInt)
  .option('-r, --retry <n>', 'Number of retry attempts on failure', parseInt, 0)
  .option('-o, --output <format>', 'Output format: json, csv', 'json')
  .option('--headful', 'Run browser in visible mode (not headless)')
  .option('--notify', 'Send notification on completion')
  .action(async (options) => {
    const startTime = Date.now();
    logger.info('Starting scrape command');
    
    let config;
    
    try {
      // Load config file
      const configPath = path.resolve(options.config);
      if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found: ${configPath}`);
      }
      
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      logger.info(`Loaded config from: ${configPath}`);
      
      // Handle single URL or multiple URLs
      let urls = config.urls || (config.url ? [config.url] : []);
      
      if (urls.length === 0) {
        throw new Error('No URLs provided in config');
      }
      
      // Determine concurrency
      const concurrency = options.parallel || config.parallel || 1;
      
      // Prepare session if specified
      let storageState = null;
      if (options.session) {
        storageState = sessionManager.loadSession(options.session);
        if (!storageState) {
          logger.warn(`Session "${options.session}" not found, proceeding without session`);
        }
      }
      
      // Prepare proxy
      let proxy = options.proxy || config.proxy || null;
      const rotateProxy = options.rotateProxy || config.rotateProxy || false;
      const maxRetries = options.retry || config.retry || 0;
      
      // Execute scraping
      const results = [];
      
      if (concurrency === 1) {
        // Single task - with optional retry
        const browserSession = await browserManager.createBrowserSession({
          proxy,
          storageState,
          headless: !options.headful,
        });
        
        for (const url of urls) {
          let lastError;
          let attempt = 0;
          
          for (attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
              const result = await scraper.scrape(browserSession.page, {
                ...config,
                url,
              });
              results.push(result);
              break;
            } catch (error) {
              lastError = error;
              logger.warn(`URL ${url} attempt ${attempt} failed: ${error.message}`);
              if (attempt <= maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            }
          }
          
          if (attempt > maxRetries + 1) {
            results.push({ url, error: lastError?.message || 'Unknown error' });
          }
        }
        
        await browserSession.context.close();
      } else {
        // Parallel tasks using TaskRunner
        const taskRunner = require('../../core/task-runner');
        
        const taskConfigs = urls.map(url => ({
          ...config,
          url,
          proxy: rotateProxy ? proxyManager.getNextProxy() : proxy,
          storageState,
          headless: !options.headful,
        }));
        
        let taskResults;
        if (maxRetries > 0) {
          // Use runWithRetry when retry is enabled
          const tasks = taskConfigs.map(taskConfig => async () => {
            const browserSession = await browserManager.createBrowserSession({
              proxy: taskConfig.proxy,
              storageState: taskConfig.storageState,
              headless: taskConfig.headless,
            });
            try {
              return await scraper.scrape(browserSession.page, taskConfig);
            } finally {
              if (browserSession.context) {
                await browserSession.context.close();
              }
            }
          });
          
          taskResults = await taskRunner.runWithRetry(tasks, maxRetries, concurrency);
        } else {
          // Use runWithProxies for normal parallel execution
          taskResults = await taskRunner.runWithProxies(taskConfigs, {
            concurrency,
            rotateProxy,
          });
        }
        
        results.push(...taskResults.map(r => r.result).filter(Boolean));
      }
      
      // Save results
      const outputPath = await storage.save(results, options.output);
      logger.info(`Results saved: ${outputPath}`);
      
      // Calculate stats
      const duration = Date.now() - startTime;
      const successCount = results.filter(r => !r.error).length;
      const failedCount = results.filter(r => r.error).length;
      
      console.log(`\n✅ Scrape completed!`);
      console.log(`   Total: ${results.length}`);
      console.log(`   Succeeded: ${successCount}`);
      console.log(`   Failed: ${failedCount}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
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
      logger.error('Scrape failed:', error);
      console.error('❌ Scrape failed:', error.message);
      
      // Send error notification
      if (options.notify) {
        await notifier.notifyError(error, { command: 'scrape' });
      }
      
      process.exit(1);
    } finally {
      await browserManager.closeAll();
    }
  });

module.exports = scrapeCommand;
