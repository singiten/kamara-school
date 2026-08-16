// models/Worksheet.js - NO pre-save hooks
const mongoose = require('mongoose');

const WorksheetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required'],
  },
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          return v.length >= 2 && v.length <= 5;
        },
        message: 'Options must be between 2 and 5',
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  duration: {
    type: Number,
    default: 30,
    min: 5,
    max: 180,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
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
WorksheetSchema.index({ classId: 1, subject: 1 });
WorksheetSchema.index({ teacherId: 1 });
WorksheetSchema.index({ status: 1 });


module.exports = mongoose.model('Worksheet', WorksheetSchema);