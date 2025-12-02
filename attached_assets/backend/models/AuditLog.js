// ==== models/AuditLog.js ====
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: { model: 'Users', key: 'id' }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceId: {
    type: DataTypes.UUID
  },
  method: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
  },
  endpoint: {
    type: DataTypes.STRING
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.TEXT
  },
  changes: {
    type: DataTypes.JSONB
  },
  status: {
    type: DataTypes.ENUM('success', 'failure'),
    defaultValue: 'success'
  },
  errorMessage: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['action', 'createdAt'] },
    { fields: ['resource', 'resourceId'] }
  ]
});

module.exports = AuditLog;
