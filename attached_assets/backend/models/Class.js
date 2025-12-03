const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true // e.g., "Primary 1", "JSS 1", "SS 2"
  },
  level: {
    type: String,
    enum: ['Primary', 'JSS', 'SS'], // ✅ UPDATED: Added 'Primary'
    required: true
  },
  grade: {
    type: Number,
    required: true, // 1, 2, 3, 4, 5, 6 (for Primary); 1, 2, 3 (for JSS/SS)
    min: 1,
    max: 6 // ✅ UPDATED: Changed from 3 to 6 to accommodate Primary
  },
  arm: {
    type: String // A, B, C (optional)
  },
  academicYear: {
    type: String,
    required: true // e.g., "2023/2024"
  },
  capacity: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Compound index for uniqueness
classSchema.index({ school: 1, name: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);