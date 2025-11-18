const mongoose = require('mongoose');

const subjectScoreSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  ca1: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  ca2: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  exam: {
    type: Number,
    min: 0,
    max: 80,
    default: 0
  },
  total: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F']
  },
  remark: {
    type: String
  }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  session: {
    type: String,
    required: [true, 'Session is required'] // e.g., "2023/2024"
  },
  term: {
    type: String,
    enum: ['First', 'Second', 'Third'],
    required: true
  },
  class: {
    type: String,
    required: true
  },
  subjects: [subjectScoreSchema],
  totalScore: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  position: {
    type: Number
  },
  totalStudents: {
    type: Number
  },
  teacherComment: {
    type: String
  },
  principalComment: {
    type: String
  },
  attendance: {
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate grades and totals before saving
resultSchema.pre('save', function(next) {
  if (this.subjects && this.subjects.length > 0) {
    let totalScore = 0;
    
    this.subjects.forEach(subject => {
      // Calculate total for each subject
      subject.total = (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);
      
      // Calculate grade
      if (subject.total >= 80) subject.grade = 'A';
      else if (subject.total >= 70) subject.grade = 'B';
      else if (subject.total >= 60) subject.grade = 'C';
      else if (subject.total >= 50) subject.grade = 'D';
      else if (subject.total >= 40) subject.grade = 'E';
      else subject.grade = 'F';
      
      // Remark
      if (subject.total >= 70) subject.remark = 'Excellent';
      else if (subject.total >= 60) subject.remark = 'Very Good';
      else if (subject.total >= 50) subject.remark = 'Good';
      else if (subject.total >= 40) subject.remark = 'Fair';
      else subject.remark = 'Poor';
      
      totalScore += subject.total;
    });
    
    this.totalScore = totalScore;
    this.averageScore = parseFloat((totalScore / this.subjects.length).toFixed(2));
  }
  
  next();
});

// Indexes
resultSchema.index({ school: 1, student: 1, session: 1, term: 1 }, { unique: true });
resultSchema.index({ school: 1, session: 1, term: 1, status: 1 });

module.exports = mongoose.model('Result', resultSchema);