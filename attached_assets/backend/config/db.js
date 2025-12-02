const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.POSTGRESQL_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected Successfully');

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false }); // Set to true only in development
    console.log('Database tables synchronized');

    // Create Super Admin if not exists
    await createSuperAdmin();
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    const User = require('../models/User');
    
    const superAdminExists = await User.findOne({ 
      where: { role: 'super_admin' } 
    });

    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
        10
      );

      await User.create({
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartresult.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true
      });

      console.log('✅ Super Admin created successfully');
    }
  } catch (error) {
    console.error('Error creating super admin:', error.message);
  }
};

module.exports = connectDB;
module.exports.sequelize = sequelize;
