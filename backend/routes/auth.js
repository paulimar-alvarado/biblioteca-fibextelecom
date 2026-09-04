const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
    if (!user.activo) {
      return res.status(401).json({ message: 'Usuario desactivado. Contacte al administrador.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
    user.ultimo_acceso = new Date();
    await user.save();
    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, email, password, rol, departamento, telefono, cargo } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya esta registrado' });
    }
    const user = new User({ nombre, email, password, rol, departamento, telefono, cargo });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, email, password, rol, departamento, telefono, cargo, activo } = req.body;
    const updateData = { nombre, email, rol, departamento, telefono, cargo, activo };
    if (password) {
      updateData.password = password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
