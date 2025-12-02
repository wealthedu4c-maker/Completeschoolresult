// ==== models/Subject.js ====
const Subject = sequelize.define('Subject', {
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
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('Core', 'Elective', 'Vocational'),
    defaultValue: 'Core'
  },
  description: {
    type: DataTypes.TEXT
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'subjects',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['schoolId', 'code'] }
  ]
});

module.exports = Subject;
