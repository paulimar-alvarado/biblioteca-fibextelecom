const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const Manual = require('../models/Manual');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const manuals = await Manual.find().populate('asignados', 'nombre email');
    const porUsuario = {};
    manuals.forEach((manual) => {
      manual.asignados.forEach((user) => {
        if (!porUsuario[user.nombre]) {
          porUsuario[user.nombre] = 0;
        }
        porUsuario[user.nombre]++;
      });
    });
    const porManual = {};
    manuals.forEach((manual) => {
      porManual[manual.titulo] = manual.asignados.length;
    });
    res.json({
      porUsuario: Object.entries(porUsuario).map(([nombre, cantidad]) => ({ nombre, cantidad })),
      porManual: Object.entries(porManual).map(([nombre, cantidad]) => ({ nombre, cantidad }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'nombre email')
      .populate('manual', 'titulo')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
