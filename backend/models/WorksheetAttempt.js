// models/WorksheetAttempt.js - FIXED
const mongoose = require('mongoose');

const WorksheetAttemptSchema = new mongoose.Schema({
  worksheetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worksheet',
    required: [true, 'Worksheet ID is required'],
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true,
    },
    selectedOption: {
      type: Number,
      // ✅ REMOVED: min: 0
      // This allows -1 or null as default
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
  }],
  score: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
  },
  timeTaken: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted'],
    default: 'not_started',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Indexes
WorksheetAttemptSchema.index({ worksheetId: 1, studentId: 1 }, { unique: true });
WorksheetAttemptSchema.index({ studentId: 1 });

module.exports = mongoose.model('WorksheetAttempt', WorksheetAttemptSchema);