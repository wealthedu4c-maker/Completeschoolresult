// ==== models/PINRequest.js ====
const PINRequest = sequelize.define('PINRequest', {
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
  requestedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  session: {
    type: DataTypes.STRING,
    allowNull: false
  },
  term: {
    type: DataTypes.ENUM('First', 'Second', 'Third'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 1000 }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  processedById: {
    type: DataTypes.UUID,
    references: { model: 'Users', key: 'id' }
  },
  processedAt: {
    type: DataTypes.DATE
  },
  rejectionReason: {
    type: DataTypes.TEXT
  },
  generatedPINs: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'pin_requests',
  timestamps: true,
  indexes: [
    { fields: ['schoolId', 'status'] },
    { fields: ['status', 'createdAt'] }
  ]
});

module.exports = PINRequest;
