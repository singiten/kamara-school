// models/FeeStructure.js - COMPLETE UPDATE

const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
  // 📌 Core Fields
  name: {
    type: String,
    required: [true, 'Fee name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  
  // 📌 Fee Type
  feeType: {
    type: String,
    enum: ['tuition', 'registration', 'activity', 'library', 'lab', 'sports', 'other'],
    required: [true, 'Fee type is required'],
  },
  
  // 📌 Class Level
  classLevel: {
    type: String,
    enum: ['primary', 'middle', 'secondary'],
    required: [true, 'Class level is required'],
  },
  
  // 📌 Academic Period
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true,
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
  },
  
  // 📅 Date Range
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
  
  // ⚠️ Penalty System
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
  isLateFeeActive: {
    type: Boolean,
    default: false,
  },
  
  // 📌 Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // 📅 Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔍 Indexes
FeeStructureSchema.index({ classLevel: 1, academicYear: 1, isActive: 1 });
FeeStructureSchema.index({ startDate: 1, endDate: 1 });

// 🧮 Virtual: Total amount with late fee
FeeStructureSchema.virtual('totalAmount').get(function() {
  const now = new Date();
  const deadline = new Date(this.endDate);
  deadline.setDate(deadline.getDate() + (this.gracePeriodDays || 0));
  
  let total = this.amount;
  if (now > deadline && this.lateFeeAmount > 0) {
    total += this.lateFeeAmount;
  }
  return total;
});

// 🧮 Virtual: Check if overdue
FeeStructureSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const deadline = new Date(this.endDate);
  deadline.setDate(deadline.getDate() + (this.gracePeriodDays || 0));
  return now > deadline;
});

FeeStructureSchema.set('toJSON', { virtuals: true });
FeeStructureSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);