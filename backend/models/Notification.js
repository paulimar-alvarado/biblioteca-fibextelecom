const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  tipo: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  leida: { type: Boolean, default: false },
  enlace: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
