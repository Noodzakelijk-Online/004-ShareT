const mongoose = require('mongoose');

const trelloConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  trelloToken: { type: String, required: true },
  trelloMemberId: { type: String },
  connectedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('TrelloConnection', trelloConnectionSchema);
