const mongoose = require('mongoose');

const pinSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  pin: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  session: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['First', 'Second', 'Third'],
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    admissionNumber: String,
    studentName: String,
    usedAt: Date,
    ipAddress: String
  },
  attempts: [{
    admissionNumber: String,
    attemptedAt: Date,
    ipAddress: String,
    success: Boolean
  }],
  maxAttempts: {
    type: Number,
    default: 3
  },
  expiryDate: {
    type: Date,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
pinSchema.index({ pin: 1 });
pinSchema.index({ school: 1, session: 1, term: 1 });
pinSchema.index({ isUsed: 1, expiryDate: 1 });

module.exports = mongoose.model('PIN', pinSchema);