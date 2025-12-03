const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYear: {
    type: String,
    required: true // e.g., "2023/2024"
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Compound index for uniqueness
teacherAssignmentSchema.index({ teacher: 1, subject: 1, class: 1, academicYear: 1 }, { unique: true });
teacherAssignmentSchema.index({ school: 1, academicYear: 1 });

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);