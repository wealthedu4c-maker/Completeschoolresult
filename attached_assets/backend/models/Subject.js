// ==== models/Student.js ====
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Schools', key: 'id' }
  },
  admissionNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  otherNames: {
    type: DataTypes.STRING
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female'),
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false
  },
  class: {
    type: DataTypes.STRING,
    allowNull: false
  },
  classArm: {
    type: DataTypes.STRING
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentEmail: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'students',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['schoolId', 'admissionNumber'] },
    { fields: ['schoolId', 'class'] }
  ]
});

module.exports = Student;
