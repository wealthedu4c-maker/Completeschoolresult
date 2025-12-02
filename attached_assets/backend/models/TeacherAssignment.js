// ==== models/TeacherAssignment.js ====
const TeacherAssignment = sequelize.define('TeacherAssignment', {
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
  teacherId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  subjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Subjects', key: 'id' }
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Classes', key: 'id' }
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  assignedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'teacher_assignments',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['teacherId', 'subjectId', 'classId', 'academicYear'] },
    { fields: ['schoolId', 'academicYear'] }
  ]
});

module.exports = TeacherAssignment;
