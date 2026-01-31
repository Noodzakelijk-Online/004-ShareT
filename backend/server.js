/**
 * ShareT Backend Server - Platform-Agnostic with PouchDB
 * 
 * Features:
 * - No database installation required (PouchDB stores data locally)
 * - Works on Windows, Mac, Linux
 * - Optional cloud sync via CouchDB
 * - All GitHub optimizations included
 * 
 * Optimizations Applied:
 * 1. PouchDB - Platform-agnostic database (16k+ ⭐)
 * 2. Sirv - 40% faster static file serving (1.2k+ ⭐)
 * 3. Pino Logger - 10x faster logging (14k+ ⭐)
 * 4. LRU Cache - In-memory caching (5k+ ⭐)
 * 5. fast-json-stringify - 2x faster JSON (3.5k+ ⭐)
 * 6. rate-limiter-flexible - Memory-efficient rate limiting (3.1k+ ⭐)
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const sirv = require('sirv');

// Import PouchDB database layer
const { initDatabases, setupSync, closeAll, getStats } = require('./db/pouchdb');

// Import optimized utilities (GitHub Gems)
const { logger, httpLogger, loggers } = require('./utils/logger');
const { getStats: getCacheStats, clearAll: clearCache } = require('./utils/cache');
const { apiRateLimit, authRateLimit } = require('./utils/rateLimiter');
const { errorResponseSchema, sendFastJSON } = require('./utils/jsonSerializer');

// Import routes
const authRoutes = require('./routes/authRoutes');
const trelloRoutes = require('./routes/trelloRoutes');
const sharedLinkRoutes = require('./routes/sharedLinkRoutes');
const sharedAccessRoutes = require('./routes/sharedAccessRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const billingRoutes = require('./routes/billingRoutes');

// Create Express app
const app = express();

// Trust proxy for Cloudflare Tunnel
app.set('trust proxy', 1);

// Pino HTTP Logger (10x faster than Morgan)
app.use(httpLogger);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Compression middleware with Brotli support
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Initialize PouchDB databases
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
let dbInitialized = false;

const initDB = async () => {
  try {
    initDatabases(dataDir);
    loggers.db.info({ dataDir }, 'PouchDB databases initialized');
    
    // Optional: Setup cloud sync if CouchDB URL is provided
    if (process.env.COUCHDB_URL) {
      await setupSync(process.env.COUCHDB_URL, {
        auth: process.env.COUCHDB_AUTH ? JSON.parse(process.env.COUCHDB_AUTH) : undefined
      });
      loggers.db.info('Cloud sync enabled');
    } else {
      loggers.db.info('Running in local-only mode (no cloud sync)');
    }
    
    dbInitialized = true;
    return true;
  } catch (err) {
    loggers.db.error({ err }, 'Failed to initialize PouchDB');
    throw err;
  }
};

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PUBLIC_URL,
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration (using memory store for simplicity)
// For production with cloud sync, consider using a PouchDB-based session store
app.use(session({
  secret: process.env.SESSION_SECRET || 'sharet-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  const cacheStats = getCacheStats();
  let dbStats = {};
  
  try {
    dbStats = await getStats();
  } catch (err) {
    dbStats = { error: err.message };
  }
  
  const health = {
    status: dbInitialized ? 'healthy' : 'initializing',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      type: 'PouchDB',
      status: dbInitialized ? 'connected' : 'initializing',
      cloudSync: process.env.COUCHDB_URL ? 'enabled' : 'disabled',
      stats: dbStats
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    cache: cacheStats,
    features: [
      'No database installation required',
      'Local data storage',
      'Optional cloud sync',
      'Platform agnostic',
      'Offline capable'
    ],
    optimizations: [
      'PouchDB (16k+ ⭐)',
      'Sirv Static Server',
      'Pino Logger',
      'LRU Cache',
      'fast-json-stringify',
      'rate-limiter-flexible'
    ]
  };
  
  res.status(dbInitialized ? 200 : 503).json(health);
});

// Database stats endpoint
app.get('/api/db/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cache management endpoint
app.post('/api/admin/cache/clear', (req, res) => {
  clearCache();
  logger.info('Cache cleared by admin');
  res.json({ success: true, message: 'All caches cleared' });
});

// API Routes with rate limiting
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/trello', apiRateLimit, trelloRoutes);
app.use('/api/shared-links', apiRateLimit, sharedLinkRoutes);
app.use('/api/shared-access', apiRateLimit, sharedAccessRoutes);
app.use('/api/resources', apiRateLimit, resourceRoutes);
app.use('/api/billing', apiRateLimit, billingRoutes);

// Maintenance page
const maintenancePath = path.join(__dirname, 'public', 'maintenance.html');
app.get('/maintenance', (req, res) => {
  res.sendFile(maintenancePath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ShareT - Maintenance</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; }
            .container { max-width: 500px; background: white; padding: 50px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            h1 { color: #333; margin-bottom: 20px; }
            p { color: #666; line-height: 1.8; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 30px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔧 Maintenance in Progress</h1>
            <div class="spinner"></div>
            <p>ShareT is currently being updated.<br>We'll be back shortly!</p>
            <p><small>This page will automatically refresh...</small></p>
          </div>
          <script>setTimeout(() => location.reload(), 5000);</script>
        </body>
        </html>
      `);
    }
  });
});

// SIRV - 40% faster static file serving (GitHub: lukeed/sirv 1.2k+ ⭐)
const frontendPath = path.join(__dirname, 'frontend', 'dist');
const sirvHandler = sirv(frontendPath, {
  maxAge: 31536000,      // 1 year cache for assets
  immutable: true,       // Assets won't change
  gzip: true,            // Enable gzip
  brotli: true,          // Enable brotli (better compression)
  etag: true,            // Enable ETags
  dotfiles: 'ignore',    // Security: ignore dotfiles
  single: true           // SPA mode
});

// Use sirv for static files
app.use(sirvHandler);

// SPA fallback for routes not handled by sirv
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return sendFastJSON(res, errorResponseSchema, {
      success: false,
      error: 'Not Found',
      message: 'API endpoint not found',
      code: 'NOT_FOUND'
    }, 404);
  }
  
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ShareT - Setup Required</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
            code { background: #f8f8f8; padding: 4px 8px; border-radius: 4px; font-family: 'Fira Code', monospace; }
            .steps { text-align: left; background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px; }
            .steps li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Frontend Not Built</h1>
            <p>The frontend application needs to be built before it can be served.</p>
            <div class="steps">
              <strong>Run these commands:</strong>
              <ol>
                <li><code>cd ShareT-main</code></li>
                <li><code>npm install</code></li>
                <li><code>npm run build</code></li>
                <li><code>cd ..</code></li>
                <li><code>node scripts/copy-frontend-build.js</code></li>
              </ol>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// Error handling middleware with fast-json-stringify
app.use((err, req, res, next) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  sendFastJSON(res, errorResponseSchema, {
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    code: 'INTERNAL_ERROR'
  }, 500);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info({ signal }, 'Received shutdown signal, closing gracefully...');
  
  clearCache();
  await closeAll(); // Close PouchDB databases
  
  logger.info('Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
});

// Start server
const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // Initialize PouchDB databases
    await initDB();
    
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info({
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        local: `http://localhost:${PORT}`,
        health: `http://localhost:${PORT}/health`
      }, '🚀 ShareT Server started with PouchDB');
      
      console.log(`
╔════════════════════════════════════════════════════════════╗
║               ShareT Server Ready (PouchDB)                 ║
╠════════════════════════════════════════════════════════════╣
║  Local:    http://localhost:${PORT}                          ║
║  Health:   http://localhost:${PORT}/health                   ║
║  API:      http://localhost:${PORT}/api                      ║
╠════════════════════════════════════════════════════════════╣
║  Database: PouchDB (No installation required!)              ║
║  Data Dir: ${dataDir.substring(0, 40).padEnd(40)}   ║
║  Cloud:    ${(process.env.COUCHDB_URL ? 'Enabled' : 'Disabled (local only)').padEnd(40)}   ║
╠════════════════════════════════════════════════════════════╣
║  Features:                                                  ║
║  ✓ No database installation required                       ║
║  ✓ Works on Windows, Mac, Linux                            ║
║  ✓ Data stored locally in ./data                           ║
║  ✓ Optional cloud sync via CouchDB                         ║
║  ✓ Offline capable                                         ║
╠════════════════════════════════════════════════════════════╣
║  Optimizations Active:                                      ║
║  ✓ PouchDB (platform agnostic)                             ║
║  ✓ Sirv Static Server (40% faster)                         ║
║  ✓ Pino Logger (10x faster)                                ║
║  ✓ LRU Cache (reduced DB queries)                          ║
║  ✓ fast-json-stringify (2x faster)                         ║
║  ✓ rate-limiter-flexible (memory efficient)                ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

// Export for testing
module.exports = { app, server };
