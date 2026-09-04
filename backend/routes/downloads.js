const express = require('express');
const DownloadLog = require('../models/DownloadLog');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const logs = await DownloadLog.find()
      .populate('user', 'nombre email')
      .populate('manual', 'titulo')
      .sort({ timestamp: -1 })
      .limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/mis-descargas', auth, async (req, res) => {
  try {
    const logs = await DownloadLog.find({ user: req.user._id })
      .populate('manual', 'titulo categoria')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const porUsuario = await DownloadLog.aggregate([
      { $group: { _id: '$user', total: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'usuario' } },
      { $unwind: '$usuario' },
      { $project: { nombre: '$usuario.nombre', total: 1 } },
      { $sort: { total: -1 } }
    ]);
    const porManual = await DownloadLog.aggregate([
      { $group: { _id: '$manual', total: { $sum: 1 } } },
      { $lookup: { from: 'manuals', localField: '_id', foreignField: '_id', as: 'manual' } },
      { $unwind: '$manual' },
      { $project: { nombre: '$manual.titulo', total: 1 } },
      { $sort: { total: -1 } }
    ]);
    res.json({ porUsuario, porManual });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
