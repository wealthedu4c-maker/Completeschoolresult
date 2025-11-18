const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  admissionNumber: {
    type: String,
    required: [true, 'Admission number is required'],
    uppercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  otherNames: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  class: {
    type: String,
    required: [true, 'Class is required']
  },
  classArm: {
    type: String // e.g., 'A', 'B', 'C'
  },
  parentName: {
    type: String,
    required: true
  },
  parentPhone: {
    type: String,
    required: true
  },
  parentEmail: {
    type: String,
    lowercase: true
  },
  address: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
studentSchema.index({ school: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ school: 1, class: 1 });

module.exports = mongoose.model('Student', studentSchema);