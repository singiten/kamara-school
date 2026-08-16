// models/StudentFee.js - COMPLETE UPDATE

const mongoose = require('mongoose');

const StudentFeeSchema = new mongoose.Schema({
  // 📌 References
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
  },
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: [true, 'Fee structure ID is required'],
  },
  
  // 📌 Fee Details (copied from FeeStructure)
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  feeName: {
    type: String,
    required: [true, 'Fee name is required'],
  },
  feeType: {
    type: String,
    enum: ['tuition', 'registration', 'activity', 'library', 'lab', 'sports', 'other'],
    required: [true, 'Fee type is required'],
  },
  
  // ✅ Class Level
  classLevel: {
    type: String,
    enum: ['primary', 'middle', 'secondary'],
    required: [true, 'Class level is required'],
  },
  
  // ✅ Date Range
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  
  // ✅ Penalty System
  lateFeeAmount: {
    type: Number,
    default: 0,
    min: [0, 'Late fee cannot be negative'],
  },
  gracePeriodDays: {
    type: Number,
    default: 0,
    min: [0, 'Grace period cannot be negative'],
  },
  
  // 📌 Status
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
  
  // 📌 Payment Info
  paidAt: {
    type: Date,
  },
  
  // 📌 Academic Period
  semester: {
    type: String,
    required: [true, 'Semester is required'],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
  },
  
  // 📅 Timestamps
  assignedAt: {
    type: Date,
    default: Date.now,
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

// ✅ Indexes for faster queries
StudentFeeSchema.index({ studentId: 1, status: 1 });
StudentFeeSchema.index({ feeStructureId: 1 });
StudentFeeSchema.index({ classLevel: 1, status: 1 });
StudentFeeSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model('StudentFee', StudentFeeSchema);