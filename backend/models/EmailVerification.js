const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  shareId: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  code: { type: String, required: true },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

emailVerificationSchema.index({ shareId: 1, email: 1 });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
