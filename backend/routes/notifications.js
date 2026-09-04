const express = require('express');
const Notification = require('../models/Notification');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/unread', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, leida: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { leida: true });
    res.json({ message: 'Marcada como leida' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, leida: false }, { leida: true });
    res.json({ message: 'Todas marcadas como leidas' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notificacion eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/create', auth, adminOnly, async (req, res) => {
  try {
    const { user_id, titulo, mensaje, tipo, enlace } = req.body;
    const notification = new Notification({
      user: user_id,
      titulo,
      mensaje,
      tipo,
      enlace
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
