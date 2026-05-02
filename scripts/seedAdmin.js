// backend/scripts/seedAdmin.js
// Seed an admin account at startup (demo purposes)

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const logger = require('../src/utils/logger');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@studyai.com' });
    if (adminExists) {
      logger.info('Admin account already exists, skipping seed');
      await mongoose.connection.close();
      return;
    }

    // Create admin account
    const admin = new User({
      name: 'Admin',
      email: 'admin@studyai.com',
      password: 'Admin@123', // Will be hashed by pre-save hook
      role: 'admin',
      isActive: true,
    });

    await admin.save();

    logger.info('✅ Admin account created successfully');
    logger.info('Email: admin@studyai.com');
    logger.info('Password: Admin@123');

    // Also create a test user account
    const testUserExists = await User.findOne({ email: 'user@studyai.com' });
    if (!testUserExists) {
      const testUser = new User({
        name: 'Test User',
        email: 'user@studyai.com',
        password: 'User@123', // Will be hashed by pre-save hook
        role: 'user',
        isActive: true,
      });

      await testUser.save();
      logger.info('✅ Test user account created successfully');
      logger.info('Email: user@studyai.com');
      logger.info('Password: User@123');
    }

    await mongoose.connection.close();
    logger.info('Database seeding complete');
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();
