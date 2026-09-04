const mongoose = require('mongoose');

const prestamoSchema = new mongoose.Schema({
  manual: { type: mongoose.Schema.Types.ObjectId, ref: 'Manual', required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fecha_prestamo: { type: Date, default: Date.now },
  fecha_devolucion: { type: Date, default: null },
  fecha_limite: { type: Date, required: true },
  estado: { type: String, enum: ['activo', 'devuelto', 'vencido'], default: 'activo' },
  observaciones: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Prestamo', prestamoSchema);
