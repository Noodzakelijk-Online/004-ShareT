const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  shareId: { type: String, required: true, index: true },
  email: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  action: { type: String, enum: ['view', 'download', 'upload', 'comment', 'due_date'], default: 'view' },
  accessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

accessLogSchema.index({ shareId: 1, accessedAt: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
