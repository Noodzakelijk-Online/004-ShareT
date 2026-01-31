/**
 * Resource Usage Model
 * Tracks CPU, RAM, bandwidth, storage, and electricity usage for billing
 */

const mongoose = require('mongoose');

const resourceUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sharedLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedLink',
    index: true
  },
  resourceType: {
    type: String,
    enum: ['cpu', 'ram', 'bandwidth', 'storage', 'electricity'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: [
      'cpu-seconds',    // CPU time in seconds
      'mb-seconds',     // RAM usage in MB-seconds
      'mb',             // Bandwidth in megabytes
      'gb-hours',       // Storage in GB-hours
      'kwh'             // Electricity in kilowatt-hours
    ]
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String
  },
  metadata: {
    operation: String,      // e.g., 'card_view', 'attachment_download', 'comment_post'
    cardId: String,         // Trello card ID
    ipAddress: String,      // IP address of the request
    userAgent: String,      // Browser user agent
    duration: Number,       // Duration in milliseconds
    dataSize: Number        // Size of data transferred in bytes
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  billingPeriod: {
    type: String,
    required: true,
    index: true
    // Format: 'YYYY-MM' for monthly billing
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
resourceUsageSchema.index({ userId: 1, billingPeriod: 1 });
resourceUsageSchema.index({ userId: 1, timestamp: -1 });
resourceUsageSchema.index({ sharedLinkId: 1, timestamp: -1 });

// Static method to calculate total cost for a user in a billing period
resourceUsageSchema.statics.calculatePeriodCost = async function(userId, billingPeriod) {
  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        billingPeriod: billingPeriod
      }
    },
    {
      $group: {
        _id: null,
        totalCost: { $sum: '$cost' },
        totalRecords: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { totalCost: 0, totalRecords: 0 };
};

// Static method to get resource breakdown by type
resourceUsageSchema.statics.getResourceBreakdown = async function(userId, billingPeriod) {
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        billingPeriod: billingPeriod
      }
    },
    {
      $group: {
        _id: '$resourceType',
        totalAmount: { $sum: '$amount' },
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        resourceType: '$_id',
        totalAmount: 1,
        totalCost: 1,
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Static method to get usage by shared link
resourceUsageSchema.statics.getUsageByLink = async function(userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate },
        sharedLinkId: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$sharedLinkId',
        totalCost: { $sum: '$cost' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'sharedlinks',
        localField: '_id',
        foreignField: '_id',
        as: 'linkInfo'
      }
    },
    {
      $unwind: '$linkInfo'
    },
    {
      $project: {
        sharedLinkId: '$_id',
        totalCost: 1,
        totalAmount: 1,
        count: 1,
        cardName: '$linkInfo.cardName',
        cardId: '$linkInfo.cardId',
        _id: 0
      }
    }
  ]);
};

// Method to get current billing period
resourceUsageSchema.statics.getCurrentBillingPeriod = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

module.exports = mongoose.model('ResourceUsage', resourceUsageSchema);

