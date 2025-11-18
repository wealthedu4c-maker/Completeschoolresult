const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create Super Admin if not exists
    await createSuperAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    const superAdminExists = await User.findOne({ role: 'super_admin' });
    
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456', 10);
      
      await User.create({
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartresult.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true
      });
      
      console.log('Super Admin created successfully');
    }
  } catch (error) {
    console.error('Error creating super admin:', error.message);
  }
};

module.exports = connectDB;