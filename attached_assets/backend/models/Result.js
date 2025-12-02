// ==== models/Result.js ====
const Result = sequelize.define('Result', {
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
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Students', key: 'id' }
  },
  session: {
    type: DataTypes.STRING,
    allowNull: false
  },
  term: {
    type: DataTypes.ENUM('First', 'Second', 'Third'),
    allowNull: false
  },
  class: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subjects: {
    type: DataTypes.JSONB, // PostgreSQL JSON type
    defaultValue: []
  },
  totalScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  averageScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  position: {
    type: DataTypes.INTEGER
  },
  totalStudents: {
    type: DataTypes.INTEGER
  },
  teacherComment: {
    type: DataTypes.TEXT
  },
  principalComment: {
    type: DataTypes.TEXT
  },
  attendance: {
    type: DataTypes.JSONB,
    defaultValue: { present: 0, absent: 0, total: 0 }
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
    defaultValue: 'draft'
  },
  approvedById: {
    type: DataTypes.UUID,
    references: { model: 'Users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  rejectionReason: {
    type: DataTypes.TEXT
  },
  uploadedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'results',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['schoolId', 'studentId', 'session', 'term'] },
    { fields: ['schoolId', 'session', 'term', 'status'] }
  ],
  hooks: {
    beforeSave: (result) => {
      if (result.subjects && result.subjects.length > 0) {
        let totalScore = 0;
        
        result.subjects.forEach(subject => {
          subject.total = (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);
          
          if (subject.total >= 80) subject.grade = 'A';
          else if (subject.total >= 70) subject.grade = 'B';
          else if (subject.total >= 60) subject.grade = 'C';
          else if (subject.total >= 50) subject.grade = 'D';
          else if (subject.total >= 40) subject.grade = 'E';
          else subject.grade = 'F';
          
          if (subject.total >= 70) subject.remark = 'Excellent';
          else if (subject.total >= 60) subject.remark = 'Very Good';
          else if (subject.total >= 50) subject.remark = 'Good';
          else if (subject.total >= 40) subject.remark = 'Fair';
          else subject.remark = 'Poor';
          
          totalScore += subject.total;
        });
        
        result.totalScore = totalScore;
        result.averageScore = parseFloat((totalScore / result.subjects.length).toFixed(2));
      }
    }
  }
});

module.exports = Result;
