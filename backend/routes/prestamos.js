const express = require('express');
const Prestamo = require('../models/Prestamo');
const Manual = require('../models/Manual');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const prestamos = await Prestamo.find()
      .populate('manual', 'titulo categoria')
      .populate('usuario', 'nombre email')
      .sort({ fecha_prestamo: -1 });
    res.json(prestamos);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/mis-prestamos', auth, async (req, res) => {
  try {
    const prestamos = await Prestamo.find({ usuario: req.user._id })
      .populate('manual', 'titulo categoria')
      .sort({ fecha_prestamo: -1 });
    res.json(prestamos);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { manual_id, usuario_id, fecha_limite, observaciones } = req.body;
    const prestamo = new Prestamo({
      manual: manual_id,
      usuario: usuario_id,
      fecha_limite,
      observaciones
    });
    await prestamo.save();
    const populated = await prestamo.populate(['manual', 'usuario']);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/:id/devolver', auth, async (req, res) => {
  try {
    const prestamo = await Prestamo.findByIdAndUpdate(
      req.params.id,
      { fecha_devolucion: new Date(), estado: 'devuelto' },
      { new: true }
    ).populate(['manual', 'usuario']);
    if (!prestamo) {
      return res.status(404).json({ message: 'Prestamo no encontrado' });
    }
    res.json(prestamo);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const prestamo = await Prestamo.findByIdAndDelete(req.params.id);
    if (!prestamo) {
      return res.status(404).json({ message: 'Prestamo no encontrado' });
    }
    res.json({ message: 'Prestamo eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const activos = await Prestamo.countDocuments({ estado: 'activo' });
    const vencidos = await Prestamo.countDocuments({ estado: 'vencido' });
    const devueltos = await Prestamo.countDocuments({ estado: 'devuelto' });
    res.json({ activos, vencidos, devueltos });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
