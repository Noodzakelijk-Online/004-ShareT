module.exports = {
  apps: [{
    name: 'sharet',
    script: './backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Restart delays
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Merge logs from all instances
    merge_logs: true,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Windows-specific settings
    windowsHide: true,
    
    // Cron restart (optional - restart daily at 3 AM)
    cron_restart: '0 3 * * *',
    
    // Health check
    health_check: {
      enable: true,
      endpoint: 'http://localhost:5000/health',
      interval: 30000, // 30 seconds
      timeout: 5000
    }
  }]
};
