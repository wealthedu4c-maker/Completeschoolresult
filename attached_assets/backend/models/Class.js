// ==== models/Class.js ====
const Class = sequelize.define('Class', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('Primary', 'JSS', 'SS'),
    allowNull: false
  },
  grade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 6 }
  },
  arm: {
    type: DataTypes.STRING
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'classes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['schoolId', 'name', 'academicYear'] }
  ]
});

module.exports = Class;
