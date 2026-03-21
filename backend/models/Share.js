const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  shareId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cardId: { type: String, required: true },
  cardName: { type: String, required: true },
  boardId: { type: String, required: true },
  boardName: { type: String, required: true },
  permissions: {
    canView: { type: Boolean, default: true },
    canComment: { type: Boolean, default: false },
    canUpload: { type: Boolean, default: false },
    canDownload: { type: Boolean, default: true },
    canSetDueDate: { type: Boolean, default: false }
  },
  allowedEmails: [{ type: String, lowercase: true, trim: true }],
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  accessCount: { type: Number, default: 0 },
  lastAccessedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Share', shareSchema);
