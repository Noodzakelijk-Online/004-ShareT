/**
 * Billing Controller
 * Handles operations related to billing and payments
 * Uses PouchDB for platform-agnostic data storage
 */

const { User, Billing, ResourceUsage, ResourcePricing } = require('../db/pouchdb');

// Helper to get current billing period
const getCurrentBillingPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Get all billing records for current user
 */
exports.getUserBilling = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, limit = 20, page = 1 } = req.query;

    let billings = await Billing.findByUserId(userId);
    
    // Filter by status if provided
    if (status) {
      billings = billings.filter(b => b.status === status);
    }
    
    // Sort by date
    billings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginate
    const total = billings.length;
    const skip = (page - 1) * limit;
    const paginatedBillings = billings.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedBillings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user billing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing records'
    });
  }
};

/**
 * Get billing for specific period
 */
exports.getBillingByPeriod = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period } = req.params;

    // Validate period format
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period format. Use YYYY-MM format.'
      });
    }

    const billings = await Billing.findByUserId(userId);
    const billing = billings.find(b => b.billingPeriod === period);

    if (!billing) {
      return res.status(404).json({
        success: false,
        error: 'Billing record not found for this period'
      });
    }

    res.json({
      success: true,
      data: billing
    });
  } catch (error) {
    console.error('Error fetching billing by period:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing record'
    });
  }
};

/**
 * Get current billing period information
 */
exports.getCurrentBilling = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const currentPeriod = getCurrentBillingPeriod();

    // Get resource usage for current period
    const usage = await ResourceUsage.findByUserId(userId);
    const periodUsage = usage.filter(u => {
      const usageDate = new Date(u.createdAt);
      const usagePeriod = `${usageDate.getFullYear()}-${String(usageDate.getMonth() + 1).padStart(2, '0')}`;
      return usagePeriod === currentPeriod;
    });

    // Calculate totals
    const resourceUsage = {
      cpu: { amount: 0, cost: 0, unit: 'cpu-seconds' },
      ram: { amount: 0, cost: 0, unit: 'mb-seconds' },
      bandwidth: { amount: 0, cost: 0, unit: 'mb' },
      storage: { amount: 0, cost: 0, unit: 'gb-hours' },
      electricity: { amount: 0, cost: 0, unit: 'kwh' }
    };

    periodUsage.forEach(u => {
      if (resourceUsage[u.resourceType]) {
        resourceUsage[u.resourceType].amount += u.amount || 0;
        resourceUsage[u.resourceType].cost += u.cost || 0;
      }
    });

    const total = Object.values(resourceUsage).reduce((sum, r) => sum + r.cost, 0);

    res.json({
      success: true,
      data: {
        billingPeriod: currentPeriod,
        periodStart: new Date(currentPeriod + '-01'),
        periodEnd: new Date(new Date(currentPeriod + '-01').getFullYear(), new Date(currentPeriod + '-01').getMonth() + 1, 0),
        status: 'pending',
        resourceUsage,
        total: total.toFixed(4),
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('Error fetching current billing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current billing'
    });
  }
};

/**
 * Get billing summary
 */
exports.getBillingSummary = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const billings = await Billing.findByUserId(userId);
    const usage = await ResourceUsage.findByUserId(userId);

    const totalBilled = billings.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalPaid = billings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.total || 0), 0);
    const totalUsage = usage.reduce((sum, u) => sum + (u.cost || 0), 0);

    res.json({
      success: true,
      data: {
        totalBilled: totalBilled.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalUsage: totalUsage.toFixed(4),
        balance: (totalUsage - totalPaid).toFixed(2),
        currency: 'USD',
        billingCount: billings.length
      }
    });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing summary'
    });
  }
};

/**
 * Create billing record for a period
 */
exports.createBilling = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period } = req.body;

    const billingPeriod = period || getCurrentBillingPeriod();

    // Check if billing already exists
    const existingBillings = await Billing.findByUserId(userId);
    const existingBilling = existingBillings.find(b => b.billingPeriod === billingPeriod);
    
    if (existingBilling) {
      return res.status(400).json({
        success: false,
        error: 'Billing record already exists for this period'
      });
    }

    // Get resource usage for period
    const usage = await ResourceUsage.findByUserId(userId);
    const periodUsage = usage.filter(u => {
      const usageDate = new Date(u.createdAt);
      const usagePeriod = `${usageDate.getFullYear()}-${String(usageDate.getMonth() + 1).padStart(2, '0')}`;
      return usagePeriod === billingPeriod;
    });

    // Calculate totals
    const resourceUsage = {
      cpu: { amount: 0, cost: 0, unit: 'cpu-seconds' },
      ram: { amount: 0, cost: 0, unit: 'mb-seconds' },
      bandwidth: { amount: 0, cost: 0, unit: 'mb' },
      storage: { amount: 0, cost: 0, unit: 'gb-hours' },
      electricity: { amount: 0, cost: 0, unit: 'kwh' }
    };

    periodUsage.forEach(u => {
      if (resourceUsage[u.resourceType]) {
        resourceUsage[u.resourceType].amount += u.amount || 0;
        resourceUsage[u.resourceType].cost += u.cost || 0;
      }
    });

    const total = Object.values(resourceUsage).reduce((sum, r) => sum + r.cost, 0);

    // Create billing record
    const billing = await Billing.create({
      userId,
      billingPeriod,
      periodStart: new Date(billingPeriod + '-01').toISOString(),
      periodEnd: new Date(new Date(billingPeriod + '-01').getFullYear(), new Date(billingPeriod + '-01').getMonth() + 1, 0).toISOString(),
      resourceUsage,
      total,
      status: 'pending',
      invoiceNumber: `INV-${Date.now()}`
    });

    res.status(201).json({
      success: true,
      data: billing
    });
  } catch (error) {
    console.error('Error creating billing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create billing record'
    });
  }
};

/**
 * Update billing status
 */
exports.updateBillingStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { billingId } = req.params;
    const { status } = req.body;

    const billing = await Billing.findById(billingId);

    if (!billing || billing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Billing record not found'
      });
    }

    await Billing.updateById(billingId, { status });

    res.json({
      success: true,
      data: { ...billing, status }
    });
  } catch (error) {
    console.error('Error updating billing status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update billing status'
    });
  }
};

/**
 * Generate invoice
 */
exports.generateInvoice = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { billingId } = req.params;

    const billing = await Billing.findById(billingId);

    if (!billing || billing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Billing record not found'
      });
    }

    res.json({
      success: true,
      data: {
        invoiceUrl: `/api/billing/${billingId}/invoice/download`,
        invoiceNumber: billing.invoiceNumber || `INV-${billingId}`
      }
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice'
    });
  }
};

/**
 * Download invoice
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { billingId } = req.params;

    const billing = await Billing.findById(billingId);

    if (!billing || billing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Billing record not found'
      });
    }

    res.json({
      success: true,
      data: billing,
      message: 'PDF invoice generation coming soon'
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download invoice'
    });
  }
};

/**
 * Process payment
 */
exports.processPayment = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { billingId } = req.params;
    const { paymentMethod, transactionId } = req.body;

    const billing = await Billing.findById(billingId);

    if (!billing || billing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Billing record not found'
      });
    }

    if (billing.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Billing already paid'
      });
    }

    await Billing.updateById(billingId, {
      status: 'paid',
      payment: {
        method: paymentMethod,
        transactionId,
        paidAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: { ...billing, status: 'paid' },
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment'
    });
  }
};

/**
 * Request refund
 */
exports.requestRefund = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { billingId } = req.params;
    const { reason } = req.body;

    const billing = await Billing.findById(billingId);

    if (!billing || billing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Billing record not found'
      });
    }

    if (billing.status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Can only refund paid billings'
      });
    }

    await Billing.updateById(billingId, {
      status: 'refunded',
      refund: {
        amount: billing.total,
        reason,
        refundedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
};

/**
 * Get all billings (admin only)
 */
exports.getAllBillings = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;

    // Get all billings (admin function)
    let billings = await Billing.getAll();
    
    if (status) {
      billings = billings.filter(b => b.status === status);
    }
    
    billings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = billings.length;
    const skip = (page - 1) * limit;
    const paginatedBillings = billings.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedBillings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all billings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billings'
    });
  }
};

/**
 * Get pricing rates
 */
exports.getPricingRates = async (req, res) => {
  try {
    const pricing = await ResourcePricing.getActive();

    res.json({
      success: true,
      data: pricing || {
        cpu: { unit: 'cpu-seconds', basePrice: 0.00001, multiplier: 2 },
        ram: { unit: 'mb-seconds', basePrice: 0.000001, multiplier: 2 },
        bandwidth: { unit: 'mb', basePrice: 0.0001, multiplier: 2 },
        storage: { unit: 'gb-hours', basePrice: 0.00005, multiplier: 2 },
        electricity: { unit: 'kwh', basePrice: 0.10, multiplier: 2 }
      }
    });
  } catch (error) {
    console.error('Error fetching pricing rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing rates'
    });
  }
};
