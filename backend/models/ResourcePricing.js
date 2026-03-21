/**
 * Resource Pricing Model
 * Manages pricing configuration for different resource types
 * Formula: cost = resource_usage × pricing_multiplier
 * Default multiplier: 2
 */

const mongoose = require('mongoose');

const resourcePricingSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['cpu', 'ram', 'bandwidth', 'storage', 'electricity'],
    required: true,
    unique: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    // Base price per unit before applying multiplier
  },
  unit: {
    type: String,
    required: true,
    enum: ['cpu-seconds', 'mb-seconds', 'mb', 'gb-hours', 'kwh']
  },
  multiplier: {
    type: Number,
    required: true,
    default: 2,
    min: 1
    // User requirement: cost = usage × 2
  },
  effectivePrice: {
    type: Number,
    required: true,
    min: 0
    // Calculated as: basePrice × multiplier
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveUntil: {
    type: Date
  },
  metadata: {
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updateReason: String,
    previousPrice: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate effective price
resourcePricingSchema.pre('save', function(next) {
  this.effectivePrice = this.basePrice * this.multiplier;
  next();
});

// Static method to get current pricing for all resources
resourcePricingSchema.statics.getCurrentPricing = async function() {
  const now = new Date();
  return await this.find({
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveUntil: { $exists: false } },
      { effectiveUntil: null },
      { effectiveUntil: { $gte: now } }
    ]
  });
};

// Static method to get pricing for a specific resource type
resourcePricingSchema.statics.getPricing = async function(resourceType) {
  const now = new Date();
  return await this.findOne({
    resourceType: resourceType,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveUntil: { $exists: false } },
      { effectiveUntil: null },
      { effectiveUntil: { $gte: now } }
    ]
  });
};

// Static method to calculate cost for a given usage
resourcePricingSchema.statics.calculateCost = async function(resourceType, amount) {
  const pricing = await this.getPricing(resourceType);
  
  if (!pricing) {
    throw new Error(`Pricing not found for resource type: ${resourceType}`);
  }
  
  return amount * pricing.effectivePrice;
};

// Static method to initialize default pricing
resourcePricingSchema.statics.initializeDefaultPricing = async function() {
  const defaultPricing = [
    {
      resourceType: 'cpu',
      basePrice: 0.0001,  // $0.0001 per CPU-second
      unit: 'cpu-seconds',
      multiplier: 2,
      description: 'CPU processing time in seconds'
    },
    {
      resourceType: 'ram',
      basePrice: 0.00001,  // $0.00001 per MB-second
      unit: 'mb-seconds',
      multiplier: 2,
      description: 'RAM usage in megabyte-seconds'
    },
    {
      resourceType: 'bandwidth',
      basePrice: 0.001,  // $0.001 per MB
      unit: 'mb',
      multiplier: 2,
      description: 'Data transfer bandwidth in megabytes'
    },
    {
      resourceType: 'storage',
      basePrice: 0.0001,  // $0.0001 per GB-hour
      unit: 'gb-hours',
      multiplier: 2,
      description: 'Storage space in gigabyte-hours'
    },
    {
      resourceType: 'electricity',
      basePrice: 0.12,  // $0.12 per kWh (typical electricity cost)
      unit: 'kwh',
      multiplier: 2,
      description: 'Electricity consumption in kilowatt-hours'
    }
  ];
  
  for (const pricing of defaultPricing) {
    await this.findOneAndUpdate(
      { resourceType: pricing.resourceType },
      pricing,
      { upsert: true, new: true }
    );
  }
  
  return await this.getCurrentPricing();
};

// Method to update pricing with history tracking
resourcePricingSchema.methods.updatePricing = function(newBasePrice, newMultiplier, updatedBy, reason) {
  this.metadata.previousPrice = this.effectivePrice;
  this.metadata.lastUpdatedBy = updatedBy;
  this.metadata.updateReason = reason;
  
  this.basePrice = newBasePrice;
  this.multiplier = newMultiplier;
  
  return this.save();
};

// Index for efficient querying
resourcePricingSchema.index({ resourceType: 1, isActive: 1, effectiveFrom: -1 });

module.exports = mongoose.model('ResourcePricing', resourcePricingSchema);

