const mongoose = require('mongoose');

const manualSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, default: '' },
  categoria: { type: String, default: 'Manuales' },
  archivo: { type: String },
  folder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  asignados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  fecha_vencimiento: { type: Date, default: null },
  prioridad: { type: String, enum: ['baja', 'media', 'alta', 'critica'], default: 'media' },
  version: { type: String, default: '1.0' },
  autor: { type: String, default: '' },
 tags: [{ type: String }],
  vistas: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Manual', manualSchema);
