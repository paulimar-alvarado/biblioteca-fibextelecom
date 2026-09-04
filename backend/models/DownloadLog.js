const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manual: { type: mongoose.Schema.Types.ObjectId, ref: 'Manual', required: true },
  action: { type: String, enum: ['download', 'preview'], default: 'download' },
  timestamp: { type: Date, default: Date.now },
  ip_address: { type: String, default: '' }
});

module.exports = mongoose.model('DownloadLog', downloadLogSchema);
