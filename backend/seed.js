require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const existingAdmin = await User.findOne({ email: 'admin@fibextelecom.com' });
    if (existingAdmin) {
      console.log('El usuario admin ya existe');
      process.exit(0);
    }

    const admin = new User({
      nombre: 'Administrador',
      email: 'admin@fibextelecom.com',
      password: 'admin123',
      rol: 'admin',
      departamento: 'Sistemas'
    });

    await admin.save();
    console.log('Usuario admin creado exitosamente');
    console.log('Email: admin@fibextelecom.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedAdmin();
