const express = require('express');
const router = express.Router();
const os = require('os');
const { protect, adminOnly } = require('../middleware/auth');
const { getStats, User, SharedLink } = require('../db/pouchdb');
const { getStats: getCacheStats } = require('../utils/cache');
const { getNotificationStatus } = require('../controllers/sharedCommentController');

router.use(protect);
router.use(adminOnly);

// GET /api/admin/status
router.get('/status', async (req, res) => {
  try {
    const [dbStats, cacheStats] = await Promise.all([getStats(), Promise.resolve(getCacheStats())]);
    const mem = process.memoryUsage();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        publicUrl: process.env.PUBLIC_URL || null,
        trelloNotifications: getNotificationStatus(),
        memory: {
          processUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
          processTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
          rssMB: Math.round(mem.rss / 1024 / 1024)
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
          freeMemGB: (os.freemem() / 1024 / 1024 / 1024).toFixed(1),
          loadAvg: os.loadavg()
        },
        database: dbStats,
        cache: cacheStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/shares
router.get('/shares', async (req, res) => {
  try {
    const links = await SharedLink.findAll();
    const active = links.filter(l => l.isActive);
    res.json({
      success: true,
      data: {
        total: links.length,
        active: active.length,
        inactive: links.length - active.length,
        links: links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      data: users.map(u => ({
        id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
        credits: u.credits,
        createdAt: u.createdAt,
        isActive: u.isActive
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/credits/add  { userId, amount }
router.post('/credits/add', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'userId and positive amount required' });
    }
    const newBalance = await User.addCredits(userId, parseInt(amount));
    res.json({ success: true, data: { credits: newBalance } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
