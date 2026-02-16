/**
 * Proxy Command
 * Manage proxies (list, test, add, remove)
 */

const { Command } = require('commander');
const proxyManager = require('../../proxy/proxy-manager');
const logger = require('../../logger/logger');

// Create subcommands
const listCommand = new Command('list')
  .description('List all available proxies')
  .action(() => {
    console.log('\n🌐 Available Proxies:\n');
    
    const proxies = proxyManager.getAllProxies();
    
    if (proxies.length === 0) {
      console.log('   No proxies found.');
      console.log('   Add proxies using PROXY_LIST env var or data/proxies.txt file.\n');
      return;
    }
    
    proxies.forEach((proxy, index) => {
      const parsed = proxyManager.parseProxy(proxy);
      if (parsed) {
        console.log(`   ${index + 1}. ${parsed.protocol}://${parsed.host}:${parsed.port}`);
        if (parsed.username) {
          console.log(`      User: ${parsed.username}`);
        }
      } else {
        console.log(`   ${index + 1}. ${proxy}`);
      }
    });
    
    console.log(`\n   Total: ${proxies.length} proxy(ies)\n`);
  });

const testCommand = new Command('test')
  .description('Test all proxies')
  .option('-c, --concurrency <n>', 'Number of concurrent tests', parseInt, 3)
  .option('-t, --timeout <ms>', 'Timeout per proxy in ms', parseInt, 10000)
  .action(async (options) => {
    console.log('\n🧪 Testing proxies...\n');
    
    const concurrency = options.concurrency || 3;
    const timeout = options.timeout || 10000;
    
    try {
      const working = await proxyManager.testAllProxies(concurrency);
      
      console.log(`\n📊 Results: ${working.length}/${proxyManager.getProxyCount()} proxies working\n`);
      
      if (working.length > 0) {
        console.log('   Working proxies:');
        working.forEach(proxy => {
          console.log(`   ✅ ${proxy}`);
        });
      }
      
      console.log('');
    } catch (error) {
      console.log(`\n❌ Error testing proxies: ${error.message}\n`);
    }
  });

const addCommand = new Command('add')
  .description('Add a proxy to the list')
  .argument('<proxy>', 'Proxy URL (e.g., socks5://user:pass@host:port)')
  .action((proxy) => {
    const parsed = proxyManager.parseProxy(proxy);
    
    if (!parsed) {
      console.log(`\n❌ Invalid proxy format: ${proxy}\n`);
      console.log('   Valid formats:');
      console.log('   - http://host:port');
      console.log('   - socks5://host:port');
      console.log('   - socks5://user:pass@host:port\n');
      return;
    }
    
    proxyManager.addProxy(proxy);
    console.log(`\n✅ Proxy added: ${proxy}\n`);
    console.log(`   Total proxies: ${proxyManager.getProxyCount()}\n`);
  });

const removeCommand = new Command('remove')
  .description('Remove a proxy from the list')
  .argument('<proxy>', 'Proxy URL to remove')
  .action((proxy) => {
    const beforeCount = proxyManager.getProxyCount();
    proxyManager.removeProxy(proxy);
    const afterCount = proxyManager.getProxyCount();
    
    if (afterCount < beforeCount) {
      console.log(`\n✅ Proxy removed: ${proxy}\n`);
      console.log(`   Total proxies: ${afterCount}\n`);
    } else {
      console.log(`\n❌ Proxy not found: ${proxy}\n`);
    }
  });

// Main proxy command
const proxyCommand = new Command('proxy')
  .description('Manage proxies')
  .addCommand(listCommand)
  .addCommand(testCommand)
  .addCommand(addCommand)
  .addCommand(removeCommand);

module.exports = proxyCommand;
