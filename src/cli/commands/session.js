/**
 * Session Command
 * Manage browser sessions (list, info, delete, validate)
 */

const { Command } = require('commander');
const sessionManager = require('../../session/session-manager');
const logger = require('../../logger/logger');

// Create subcommands
const listCommand = new Command('list')
  .description('List all available sessions')
  .action(() => {
    console.log('\n📁 Available Sessions:\n');
    
    const sessions = sessionManager.listSessions();
    
    if (sessions.length === 0) {
      console.log('   No sessions found.');
      console.log('   Sessions are created when using -s/--session option with scrape or test commands.\n');
      return;
    }
    
    sessions.forEach(name => {
      const info = sessionManager.getSessionInfo(name);
      if (info) {
        const created = new Date(info.created).toLocaleDateString();
        console.log(`   ${name}`);
        console.log(`      Created: ${created}, Cookies: ${info.cookieCount}, Size: ${(info.size / 1024).toFixed(1)}KB`);
      }
    });
    
    console.log(`\n   Total: ${sessions.length} session(s)\n`);
  });

const infoCommand = new Command('info')
  .description('Show detailed session information')
  .argument('<name>', 'Session name')
  .action((name) => {
    const info = sessionManager.getSessionInfo(name);
    
    if (!info) {
      console.log(`\n❌ Session "${name}" not found.\n`);
      return;
    }
    
    console.log(`\n📋 Session: ${name}`);
    console.log(`   Path: ${info.path}`);
    console.log(`   Created: ${new Date(info.created).toLocaleString()}`);
    console.log(`   Modified: ${new Date(info.modified).toLocaleString()}`);
    console.log(`   Size: ${(info.size / 1024).toFixed(1)}KB`);
    console.log(`   Cookies: ${info.cookieCount}`);
    console.log(`   Origins: ${info.originCount}\n`);
  });

const deleteCommand = new Command('delete')
  .description('Delete a session')
  .argument('<name>', 'Session name')
  .action((name) => {
    const result = sessionManager.deleteSession(name);
    
    if (result) {
      console.log(`\n✅ Session "${name}" deleted successfully.\n`);
    } else {
      console.log(`\n❌ Session "${name}" not found.\n`);
    }
  });

const validateCommand = new Command('validate')
  .description('Validate session (check for expired cookies)')
  .argument('<name>', 'Session name')
  .option('--check-expiry', 'Check cookie expiry dates')
  .action(async (name, options) => {
    const checkExpiry = options.checkExpiry || false;
    
    const isValid = await sessionManager.isSessionValid(name, checkExpiry);
    
    if (isValid) {
      console.log(`\n✅ Session "${name}" is valid.\n`);
    } else {
      console.log(`\n❌ Session "${name}" is invalid or expired.\n`);
    }
  });

// Main session command
const sessionCommand = new Command('session')
  .description('Manage browser sessions')
  .addCommand(listCommand)
  .addCommand(infoCommand)
  .addCommand(deleteCommand)
  .addCommand(validateCommand);

module.exports = sessionCommand;
