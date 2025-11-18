const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'School code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'Nigeria'
  },
  phone: {
    type: String,
    required: [true, 'Phone is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  logo: {
    type: String // URL to logo
  },
  motto: {
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

// Indexes
schoolSchema.index({ code: 1 });
schoolSchema.index({ isActive: 1 });

module.exports = mongoose.model('School', schoolSchema);