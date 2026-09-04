const express = require('express');
const path = require('path');
const fs = require('fs');
const Manual = require('../models/Manual');
const ActivityLog = require('../models/ActivityLog');
const DownloadLog = require('../models/DownloadLog');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const manuals = await Manual.find({ asignados: req.user._id })
      .populate('asignados', 'nombre email')
      .populate('folder_id', 'nombre');
    res.json(manuals);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    const manuals = await Manual.find()
      .populate('asignados', 'nombre email')
      .populate('folder_id', 'nombre');
    res.json(manuals);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', auth, adminOnly, upload.single('archivo'), async (req, res) => {
  try {
    const { titulo, descripcion, categoria, folder_id, asignados, fecha_vencimiento, prioridad, version, autor, tags } = req.body;
    const manual = new Manual({
      titulo,
      descripcion,
      categoria,
      folder_id: folder_id || null,
      archivo: req.file ? req.file.filename : null,
      asignados: asignados ? JSON.parse(asignados) : [],
      fecha_vencimiento: fecha_vencimiento || null,
      prioridad: prioridad || 'media',
      version: version || '1.0',
      autor: autor || '',
      tags: tags ? JSON.parse(tags) : []
    });
    await manual.save();
    await ActivityLog.create({
      user: req.user._id,
      action: 'Creo un manual',
      manual: manual._id
    });
    const populated = await manual.populate('asignados', 'nombre email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/:id', auth, adminOnly, upload.single('archivo'), async (req, res) => {
  try {
    const { titulo, descripcion, categoria, folder_id, asignados, fecha_vencimiento, prioridad, version, autor, tags } = req.body;
    const updateData = { titulo, descripcion, categoria, prioridad, version, autor };
    if (folder_id !== undefined) updateData.folder_id = folder_id || null;
    if (asignados) updateData.asignados = JSON.parse(asignados);
    if (fecha_vencimiento) updateData.fecha_vencimiento = fecha_vencimiento;
    if (tags) updateData.tags = JSON.parse(tags);
    if (req.file) {
      const manual = await Manual.findById(req.params.id);
      if (manual && manual.archivo) {
        const oldPath = path.join(__dirname, '../uploads', manual.archivo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.archivo = req.file.filename;
    }
    const manual = await Manual.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('asignados', 'nombre email')
      .populate('folder_id', 'nombre');
    if (!manual) {
      return res.status(404).json({ message: 'Manual no encontrado' });
    }
    await ActivityLog.create({
      user: req.user._id,
      action: 'Actualizo un manual',
      manual: manual._id
    });
    res.json(manual);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const manual = await Manual.findById(req.params.id);
    if (!manual) {
      return res.status(404).json({ message: 'Manual no encontrado' });
    }
    if (manual.archivo) {
      const filePath = path.join(__dirname, '../uploads', manual.archivo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await Manual.findByIdAndDelete(req.params.id);
    await ActivityLog.create({
      user: req.user._id,
      action: 'Elimino un manual',
      manual: manual._id
    });
    res.json({ message: 'Manual eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/download/:id', auth, async (req, res) => {
  try {
    const manual = await Manual.findById(req.params.id);
    if (!manual || !manual.archivo) {
      return res.status(404).json({ message: 'Manual no encontrado' });
    }
    const filePath = path.join(__dirname, '../uploads', manual.archivo);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    manual.vistas = (manual.vistas || 0) + 1;
    await manual.save();
    await DownloadLog.create({
      user: req.user._id,
      manual: manual._id,
      action: 'download',
      ip_address: req.ip
    });
    await ActivityLog.create({
      user: req.user._id,
      action: 'Descargo un manual',
      manual: manual._id
    });
    res.download(filePath, manual.titulo + '.pdf');
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/preview/:id', auth, async (req, res) => {
  try {
    const manual = await Manual.findById(req.params.id);
    if (!manual || !manual.archivo) {
      return res.status(404).json({ message: 'Manual no encontrado' });
    }
    const filePath = path.join(__dirname, '../uploads', manual.archivo);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    manual.vistas = (manual.vistas || 0) + 1;
    await manual.save();
    await DownloadLog.create({
      user: req.user._id,
      manual: manual._id,
      action: 'preview',
      ip_address: req.ip
    });
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
