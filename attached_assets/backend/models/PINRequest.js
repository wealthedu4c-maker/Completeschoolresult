const mongoose = require('mongoose');

const pinRequestSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: String,
    required: true // e.g., "2023/2024"
  },
  term: {
    type: String,
    enum: ['First', 'Second', 'Third'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  // ✅ REMOVED: reason field
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  generatedPINs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PIN'
  }]
}, { 
  timestamps: true 
});

// Indexes for performance
pinRequestSchema.index({ school: 1, status: 1 });
pinRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PINRequest', pinRequestSchema);