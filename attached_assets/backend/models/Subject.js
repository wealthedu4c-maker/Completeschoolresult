const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true // e.g., "Mathematics", "English Language"
  },
  code: {
    type: String,
    required: true,
    uppercase: true // e.g., "MATH101", "ENG101"
  },
  category: {
    type: String,
    enum: ['Core', 'Elective', 'Vocational'],
    default: 'Core'
  },
  description: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Compound index for uniqueness
subjectSchema.index({ school: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);