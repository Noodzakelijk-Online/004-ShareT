/**
 * Process Clustering using Throng
 * Utilizes all CPU cores for better performance
 * GitHub: https://github.com/hunterloftis/throng (1.1k+ stars)
 */

const throng = require('throng');
const os = require('os');

// Number of workers - use WEB_CONCURRENCY env var or number of CPUs
const WORKERS = parseInt(process.env.WEB_CONCURRENCY, 10) || os.cpus().length;

// Minimum 1 worker, maximum 8 (to prevent resource exhaustion)
const workerCount = Math.min(Math.max(WORKERS, 1), 8);

console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ShareT Cluster Mode                      ║
╠════════════════════════════════════════════════════════════╣
║  CPU Cores Available: ${os.cpus().length.toString().padEnd(35)}║
║  Workers to Spawn:    ${workerCount.toString().padEnd(35)}║
║  Node.js Version:     ${process.version.padEnd(35)}║
║  Platform:            ${os.platform().padEnd(35)}║
╚════════════════════════════════════════════════════════════╝
`);

throng({
  workers: workerCount,
  lifetime: Infinity,
  grace: 5000,  // 5 seconds for graceful shutdown
  
  // Master process - runs once
  master() {
    console.log(`[Master] Started with PID ${process.pid}`);
    console.log(`[Master] Spawning ${workerCount} workers...`);
    
    // Handle master process signals
    process.on('SIGTERM', () => {
      console.log('[Master] Received SIGTERM, shutting down...');
    });
    
    process.on('SIGINT', () => {
      console.log('[Master] Received SIGINT, shutting down...');
    });
  },
  
  // Worker process - runs for each worker
  worker(id, disconnect) {
    console.log(`[Worker ${id}] Started with PID ${process.pid}`);
    
    // Import and start the server
    const { server, closeConnections } = require('./server');
    
    // Graceful shutdown handler
    const shutdown = async () => {
      console.log(`[Worker ${id}] Shutting down gracefully...`);
      
      try {
        // Close HTTP connections
        if (closeConnections) {
          await closeConnections();
        }
        
        // Close server
        server.close(() => {
          console.log(`[Worker ${id}] Server closed`);
          disconnect();
        });
        
        // Force exit after 10 seconds
        setTimeout(() => {
          console.log(`[Worker ${id}] Forcing exit...`);
          process.exit(0);
        }, 10000);
        
      } catch (error) {
        console.error(`[Worker ${id}] Error during shutdown:`, error);
        process.exit(1);
      }
    };
    
    // Handle worker signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error(`[Worker ${id}] Uncaught Exception:`, error);
      shutdown();
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error(`[Worker ${id}] Unhandled Rejection:`, reason);
    });
  }
});
