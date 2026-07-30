require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const getMongoUri = () => {
  return process.env.MONGODB_URI || process.env.MONGODB_URI_STD || process.env.MONGO_URI;
};

const seedAdmin = async () => {
  try {
    await mongoose.connect(getMongoUri());
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@filelocker.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      storageLimit: 107374182400, // 100GB for admin
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
