// models/AttendanceSummary.js
const mongoose = require('mongoose');

const AttendanceSummarySchema = new mongoose.Schema({
  // 📌 Core Fields
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
  
  // 📌 Period Information
  period: {
    type: String,
    enum: ['week', 'month', 'semester', 'annual'],
    required: [true, 'Period is required'],
  },
  periodStart: {
    type: Date,
    required: [true, 'Period start is required'],
  },
  periodEnd: {
    type: Date,
    required: [true, 'Period end is required'],
  },
  weekNumber: {
    type: Number,
    default: 0,
  },
  month: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  semester: {
    type: String,
    enum: ['Semester 1', 'Semester 2'],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
  },
  
  // 📊 Summary Data
  summary: {
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    late: { type: Number, default: 0 },
    excused: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 }, // percentage
  },
  
  // 📅 Tracking
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Indexes for fast queries
AttendanceSummarySchema.index({ studentId: 1, period: 1, academicYear: 1 });
AttendanceSummarySchema.index({ classId: 1, periodStart: -1 });
AttendanceSummarySchema.index({ studentId: 1, periodStart: -1 });

module.exports = mongoose.model('AttendanceSummary', AttendanceSummarySchema);