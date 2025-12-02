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
