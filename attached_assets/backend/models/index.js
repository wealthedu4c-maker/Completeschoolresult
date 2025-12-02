// models/index.js - Central export for all models
const { sequelize } = require('../config/db');

// Import all models
const User = require('./User');
const School = require('./School');
const Student = require('./Student');
const Subject = require('./Subject');
const Class = require('./Class');
const Result = require('./Result');
const PIN = require('./PIN');
const PINRequest = require('./PINRequest');
const TeacherAssignment = require('./TeacherAssignment');
const AuditLog = require('./AuditLog');

// Define relationships
School.hasMany(User, { foreignKey: 'schoolId', as: 'users' });
User.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

School.hasMany(Student, { foreignKey: 'schoolId', as: 'students' });
Student.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

School.hasMany(Subject, { foreignKey: 'schoolId', as: 'subjects' });
Subject.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

School.hasMany(Class, { foreignKey: 'schoolId', as: 'classes' });
Class.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

School.hasMany(Result, { foreignKey: 'schoolId', as: 'results' });
Result.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

Student.hasMany(Result, { foreignKey: 'studentId', as: 'results' });
Result.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

User.hasMany(Result, { foreignKey: 'uploadedById', as: 'uploadedResults' });
Result.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

School.hasMany(PIN, { foreignKey: 'schoolId', as: 'pins' });
PIN.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

School.hasMany(PINRequest, { foreignKey: 'schoolId', as: 'pinRequests' });
PINRequest.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

User.hasMany(PINRequest, { foreignKey: 'requestedById', as: 'pinRequests' });
PINRequest.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });

School.hasMany(TeacherAssignment, { foreignKey: 'schoolId', as: 'teacherAssignments' });
TeacherAssignment.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

User.hasMany(TeacherAssignment, { foreignKey: 'teacherId', as: 'assignments' });
TeacherAssignment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

Subject.hasMany(TeacherAssignment, { foreignKey: 'subjectId', as: 'assignments' });
TeacherAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

Class.hasMany(TeacherAssignment, { foreignKey: 'classId', as: 'assignments' });
TeacherAssignment.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  School,
  Student,
  Subject,
  Class,
  Result,
  PIN,
  PINRequest,
  TeacherAssignment,
  AuditLog
};
