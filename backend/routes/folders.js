const express = require('express');
const Folder = require('../models/Folder');
const Manual = require('../models/Manual');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const folders = await Folder.find()
      .populate('usuarios', 'nombre email');
    const foldersWithManuales = await Promise.all(
      folders.map(async (folder) => {
        const manuales = await Manual.find({ folder_id: folder._id })
          .populate('asignados', 'nombre email');
        return { ...folder.toObject(), manuales };
      })
    );
    res.json(foldersWithManuales);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/mis-carpetas', auth, async (req, res) => {
  try {
    const folders = await Folder.find({ usuarios: req.user._id })
      .populate('usuarios', 'nombre email');
    const foldersWithManuales = await Promise.all(
      folders.map(async (folder) => {
        const manuales = await Manual.find({ folder_id: folder._id })
          .populate('asignados', 'nombre email');
        return { ...folder.toObject(), manuales };
      })
    );
    res.json(foldersWithManuales);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const folder = new Folder({ nombre, descripcion });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion },
      { new: true }
    );
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const folder = await Folder.findByIdAndDelete(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    await Manual.updateMany({ folder_id: req.params.id }, { folder_id: null });
    res.json({ message: 'Carpeta eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/:id/usuarios', auth, adminOnly, async (req, res) => {
  try {
    const { usuarios } = req.body;
    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { usuarios },
      { new: true }
    ).populate('usuarios', 'nombre email');
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
