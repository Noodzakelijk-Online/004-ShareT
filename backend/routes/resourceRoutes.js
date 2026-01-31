/**
 * Resource Usage Routes
 * Handles resource tracking and usage reporting
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const resourceController = require('../controllers/resourceController');

// All routes require authentication
router.use(protect);

router.post('/track', resourceController.trackResourceUsage);
router.get('/usage', resourceController.getUserResourceUsage);
router.get('/breakdown', resourceController.getResourceBreakdown);
router.get('/period/:period', resourceController.getUsageByPeriod);
router.get('/by-link', resourceController.getUsageByLink);
router.get('/current-period', resourceController.getCurrentPeriodUsage);
router.get('/export', resourceController.exportUsageReport);

module.exports = router;
