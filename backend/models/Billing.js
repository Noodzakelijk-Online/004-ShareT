/**
 * Billing Model
 * Manages billing records, invoices, and payment tracking
 */

const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  billingPeriod: {
    type: String,
    required: true,
    index: true
    // Format: 'YYYY-MM'
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  resourceUsage: {
    cpu: {
      amount: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      unit: { type: String, default: 'cpu-seconds' }
    },
    ram: {
      amount: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      unit: { type: String, default: 'mb-seconds' }
    },
    bandwidth: {
      amount: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      unit: { type: String, default: 'mb' }
    },
    storage: {
      amount: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      unit: { type: String, default: 'gb-hours' }
    },
    electricity: {
      amount: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      unit: { type: String, default: 'kwh' }
    }
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountCode: {
    type: String
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'credit_card', 'bank_transfer', 'other'],
      default: 'stripe'
    },
    transactionId: String,
    stripePaymentIntentId: String,
    stripeInvoiceId: String,
    paidAt: Date,
    paidAmount: Number,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceUrl: {
    type: String
  },
  notes: {
    type: String
  },
  dueDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },
  metadata: {
    totalSharedLinks: Number,
    totalAccessLogs: Number,
    totalAttachments: Number,
    averageCostPerLink: Number
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

// Compound indexes
billingSchema.index({ userId: 1, billingPeriod: 1 }, { unique: true });
billingSchema.index({ userId: 1, status: 1 });
billingSchema.index({ status: 1, dueDate: 1 });

// Pre-save middleware to calculate total
billingSchema.pre('save', function(next) {
  // Calculate subtotal from resource usage
  this.subtotal = 
    this.resourceUsage.cpu.cost +
    this.resourceUsage.ram.cost +
    this.resourceUsage.bandwidth.cost +
    this.resourceUsage.storage.cost +
    this.resourceUsage.electricity.cost;
  
  // Calculate tax
  this.tax = this.subtotal * this.taxRate;
  
  // Calculate total
  this.total = this.subtotal + this.tax - this.discount;
  
  // Ensure total is not negative
  if (this.total < 0) {
    this.total = 0;
  }
  
  next();
});

// Static method to generate invoice number
billingSchema.statics.generateInvoiceNumber = async function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Find the last invoice for this month
  const lastInvoice = await this.findOne({
    invoiceNumber: new RegExp(`^INV-${year}${month}-`)
  }).sort({ invoiceNumber: -1 });
  
  let sequence = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
};

// Static method to get billing summary for a user
billingSchema.statics.getUserBillingSummary = async function(userId) {
  const summary = await this.aggregate([
    {
      $match: { userId: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' }
      }
    }
  ]);
  
  const result = {
    pending: { count: 0, totalAmount: 0 },
    paid: { count: 0, totalAmount: 0 },
    overdue: { count: 0, totalAmount: 0 },
    cancelled: { count: 0, totalAmount: 0 },
    refunded: { count: 0, totalAmount: 0 }
  };
  
  summary.forEach(item => {
    result[item._id] = {
      count: item.count,
      totalAmount: item.totalAmount
    };
  });
  
  return result;
};

// Method to mark as paid
billingSchema.methods.markAsPaid = function(paymentDetails) {
  this.status = 'paid';
  this.paidDate = new Date();
  this.payment.paidAt = new Date();
  this.payment.paidAmount = this.total;
  
  if (paymentDetails) {
    Object.assign(this.payment, paymentDetails);
  }
  
  return this.save();
};

// Method to mark as overdue
billingSchema.methods.markAsOverdue = function() {
  if (this.status === 'pending' && this.dueDate && this.dueDate < new Date()) {
    this.status = 'overdue';
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Billing', billingSchema);

