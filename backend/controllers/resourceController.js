/**
 * Resource Controller
 * Handles resource usage tracking and reporting
 * Uses PouchDB for platform-agnostic data storage
 */

const { ResourceUsage, ResourcePricing } = require('../db/pouchdb');

// Helper to get current billing period
const getCurrentBillingPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Track resource usage
 */
exports.trackResourceUsage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { resourceType, amount, sharedLinkId, metadata } = req.body;

    // Validate input
    if (!resourceType || amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource type or amount'
      });
    }

    // Get pricing for resource type
    const pricing = await ResourcePricing.getActive();
    const resourcePricing = pricing?.[resourceType] || { basePrice: 0.001, multiplier: 2 };

    // Calculate cost (cost = amount × basePrice × multiplier)
    const cost = amount * resourcePricing.basePrice * resourcePricing.multiplier;

    // Create resource usage record
    const resourceUsage = await ResourceUsage.create({
      userId,
      sharedLinkId,
      resourceType,
      amount,
      unit: resourcePricing.unit || resourceType,
      cost,
      billingPeriod: getCurrentBillingPeriod(),
      metadata
    });

    res.status(201).json({
      success: true,
      data: resourceUsage
    });
  } catch (error) {
    console.error('Error tracking resource usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track resource usage'
    });
  }
};

/**
 * Get user's resource usage
 */
exports.getUserResourceUsage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { startDate, endDate, limit = 100, page = 1 } = req.query;

    let usage = await ResourceUsage.findByUserId(userId);

    // Filter by date if provided
    if (startDate || endDate) {
      usage = usage.filter(u => {
        const timestamp = new Date(u.createdAt || u.timestamp);
        if (startDate && timestamp < new Date(startDate)) return false;
        if (endDate && timestamp > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by date (newest first)
    usage.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

    // Paginate
    const total = usage.length;
    const skip = (page - 1) * limit;
    const paginatedUsage = usage.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedUsage,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching resource usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource usage'
    });
  }
};

/**
 * Get resource usage breakdown by type
 */
exports.getResourceBreakdown = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period } = req.query;

    const billingPeriod = period || getCurrentBillingPeriod();

    const usage = await ResourceUsage.findByUserId(userId);
    const periodUsage = usage.filter(u => u.billingPeriod === billingPeriod);

    // Group by resource type
    const breakdownMap = {};
    periodUsage.forEach(u => {
      if (!breakdownMap[u.resourceType]) {
        breakdownMap[u.resourceType] = {
          resourceType: u.resourceType,
          totalAmount: 0,
          totalCost: 0,
          count: 0
        };
      }
      breakdownMap[u.resourceType].totalAmount += u.amount || 0;
      breakdownMap[u.resourceType].totalCost += u.cost || 0;
      breakdownMap[u.resourceType].count++;
    });

    const breakdown = Object.values(breakdownMap);

    // Calculate totals
    const totals = breakdown.reduce((acc, item) => {
      acc.totalCost += item.totalCost;
      acc.totalAmount += item.totalAmount;
      acc.totalCount += item.count;
      return acc;
    }, { totalCost: 0, totalAmount: 0, totalCount: 0 });

    res.json({
      success: true,
      data: {
        breakdown,
        totals,
        billingPeriod
      }
    });
  } catch (error) {
    console.error('Error fetching resource breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource breakdown'
    });
  }
};

/**
 * Get resource usage by billing period
 */
exports.getUsageByPeriod = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period } = req.params;

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period format. Use YYYY-MM format.'
      });
    }

    const allUsage = await ResourceUsage.findByUserId(userId);
    const usage = allUsage.filter(u => u.billingPeriod === period);

    // Calculate summary
    const totalCost = usage.reduce((sum, u) => sum + (u.cost || 0), 0);

    res.json({
      success: true,
      data: {
        usage,
        summary: {
          totalCost: totalCost.toFixed(4),
          totalRecords: usage.length
        },
        period
      }
    });
  } catch (error) {
    console.error('Error fetching usage by period:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage by period'
    });
  }
};

/**
 * Get resource usage grouped by shared link
 */
exports.getUsageByLink = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const allUsage = await ResourceUsage.findByUserId(userId);
    
    // Filter by date
    const filteredUsage = allUsage.filter(u => {
      const timestamp = new Date(u.createdAt || u.timestamp);
      return timestamp >= start && timestamp <= end;
    });

    // Group by shared link
    const usageByLink = {};
    filteredUsage.forEach(u => {
      const linkId = u.sharedLinkId || 'no-link';
      if (!usageByLink[linkId]) {
        usageByLink[linkId] = {
          sharedLinkId: linkId,
          totalCost: 0,
          totalRecords: 0,
          resources: {}
        };
      }
      usageByLink[linkId].totalCost += u.cost || 0;
      usageByLink[linkId].totalRecords++;
      
      if (!usageByLink[linkId].resources[u.resourceType]) {
        usageByLink[linkId].resources[u.resourceType] = { amount: 0, cost: 0 };
      }
      usageByLink[linkId].resources[u.resourceType].amount += u.amount || 0;
      usageByLink[linkId].resources[u.resourceType].cost += u.cost || 0;
    });

    res.json({
      success: true,
      data: Object.values(usageByLink),
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Error fetching usage by link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage by link'
    });
  }
};

/**
 * Get current period usage
 */
exports.getCurrentPeriodUsage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const currentPeriod = getCurrentBillingPeriod();

    const allUsage = await ResourceUsage.findByUserId(userId);
    const periodUsage = allUsage.filter(u => u.billingPeriod === currentPeriod);

    // Group by resource type
    const breakdown = {};
    periodUsage.forEach(u => {
      if (!breakdown[u.resourceType]) {
        breakdown[u.resourceType] = {
          resourceType: u.resourceType,
          totalAmount: 0,
          totalCost: 0,
          count: 0
        };
      }
      breakdown[u.resourceType].totalAmount += u.amount || 0;
      breakdown[u.resourceType].totalCost += u.cost || 0;
      breakdown[u.resourceType].count++;
    });

    const totalCost = Object.values(breakdown).reduce((sum, b) => sum + b.totalCost, 0);

    res.json({
      success: true,
      data: {
        period: currentPeriod,
        breakdown: Object.values(breakdown),
        summary: {
          totalCost: totalCost.toFixed(4),
          totalRecords: periodUsage.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching current period usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current period usage'
    });
  }
};

/**
 * Export usage report
 */
exports.exportUsageReport = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period, format = 'json' } = req.query;

    const billingPeriod = period || getCurrentBillingPeriod();

    const allUsage = await ResourceUsage.findByUserId(userId);
    const usage = allUsage.filter(u => u.billingPeriod === billingPeriod);

    // Calculate breakdown
    const breakdown = {};
    usage.forEach(u => {
      if (!breakdown[u.resourceType]) {
        breakdown[u.resourceType] = { totalAmount: 0, totalCost: 0, count: 0 };
      }
      breakdown[u.resourceType].totalAmount += u.amount || 0;
      breakdown[u.resourceType].totalCost += u.cost || 0;
      breakdown[u.resourceType].count++;
    });

    const totalCost = Object.values(breakdown).reduce((sum, b) => sum + b.totalCost, 0);

    const report = {
      userId,
      period: billingPeriod,
      generatedAt: new Date().toISOString(),
      summary: {
        totalCost: totalCost.toFixed(4),
        totalRecords: usage.length
      },
      breakdown: Object.entries(breakdown).map(([type, data]) => ({
        resourceType: type,
        ...data
      })),
      detailedUsage: usage
    };

    if (format === 'csv') {
      const headers = ['Timestamp', 'Resource Type', 'Amount', 'Unit', 'Cost', 'Description'];
      const rows = usage.map(item => [
        item.createdAt || item.timestamp,
        item.resourceType,
        item.amount,
        item.unit || '',
        item.cost,
        item.description || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=usage-report-${billingPeriod}.csv`);
      return res.send(csvContent);
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error exporting usage report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export usage report'
    });
  }
};
