// models/ReportCard.js - Grade Report Schema

const mongoose = require('mongoose');

const ReportCardSchema = new mongoose.Schema({
  // 📌 Student Info
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required'],
  },
  
  // 📌 Academic Info
  term: {
    type: String,
    enum: ['Term 1', 'Term 2', 'Term 3', 'Final'],
    required: [true, 'Term is required'],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
  },
  
  // 📌 Subjects & Grades
  subjects: [{
    name: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    },
    remarks: {
      type: String,
      trim: true,
    },
  }],
  
  // 📌 Summary
  totalMarks: {
    type: Number,
    default: 0,
  },
  totalObtained: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  gpa: {
    type: Number,
    default: 0,
  },
  overallGrade: {
    type: String,
    enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
  },
  
  // 📌 Remarks
  teacherRemarks: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  principalRemarks: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  
  // 📌 File
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  
  // 📌 Uploader
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
  },
  
  // 📌 Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  isVisibleToStudent: {
    type: Boolean,
    default: true,
  },
  isVisibleToParent: {
    type: Boolean,
    default: true,
  },
  
  // 📌 Timestamps
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
ReportCardSchema.index({ studentId: 1, term: 1, academicYear: 1 });
ReportCardSchema.index({ classId: 1, status: 1 });
ReportCardSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('ReportCard', ReportCardSchema);