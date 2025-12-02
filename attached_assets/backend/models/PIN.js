// ==== models/PIN.js ====
const PIN = sequelize.define('PIN', {
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
  pin: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  session: {
    type: DataTypes.STRING,
    allowNull: false
  },
  term: {
    type: DataTypes.ENUM('First', 'Second', 'Third'),
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usedBy: {
    type: DataTypes.JSONB
  },
  attempts: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  generatedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'pins',
  timestamps: true,
  indexes: [
    { fields: ['pin'] },
    { fields: ['schoolId', 'session', 'term'] },
    { fields: ['isUsed', 'expiryDate'] }
  ]
});

module.exports = PIN;
