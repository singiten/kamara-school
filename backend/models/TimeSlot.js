// models/TimeSlot.js - Individual time slot for a class
const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  // 📌 Core Fields
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    required: [true, 'Day is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true,
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true,
  },
  periodNumber: {
    type: Number,
    required: [true, 'Period number is required'],
  },
  
  // 📌 What happens in this slot
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required'],
  },
  room: {
    type: String,
    required: [true, 'Room is required'],
    trim: true,
  },
  
  // 📌 Metadata
  isBreak: {
    type: Boolean,
    default: false,
  },
  breakDuration: {
    type: Number,
    default: 0,
    min: 0,
    max: 60,
  },
  semester: {
    type: String,
    enum: ['Semester 1', 'Semester 2'],
    required: [true, 'Semester is required'],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
  },
  
  // 📌 Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
TimeSlotSchema.index({ classId: 1, day: 1, semester: 1, academicYear: 1 });
TimeSlotSchema.index({ teacherId: 1, day: 1, startTime: 1, semester: 1, academicYear: 1 });
TimeSlotSchema.index({ classId: 1, periodNumber: 1, day: 1 });

// ✅ Custom method to get time in 12-hour format
TimeSlotSchema.methods.getFormattedTime = function() {
  return `${this.startTime} - ${this.endTime}`;
};

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);