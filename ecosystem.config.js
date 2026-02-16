/**
 * PM2 Ecosystem Configuration
 * For running the automation CLI as a service
 */

module.exports = {
  apps: [
    {
      name: 'autobot',
      script: './src/index.js',
      args: 'run -t task.json',
      interpreter: 'node',
      
      // Deployment
      instances: 1,
      exec_mode: 'fork',
      
      // Restart policy
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory management
      max_memory_restart: '1G',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        BROWSER_HEADLESS: 'true',
        LOG_LEVEL: 'info',
      },
      
      // Logging
      out_file: './data/logs/pm2-out.log',
      error_file: './data/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false,
    },
  ],
};
