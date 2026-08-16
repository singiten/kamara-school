// models/TimetableTemplate.js - Full timetable for a class
const mongoose = require('mongoose');

const TimetableTemplateSchema = new mongoose.Schema({
  // 📌 Core Fields
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required'],
  },
  name: {
    type: String,
    required: [true, 'Timetable name is required'],
    trim: true,
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
  
  // 📌 The actual schedule
  timeSlots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
  }],
  
  // 📌 Status
  isPublished: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
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

// ✅ Ensure only one active timetable per class per semester
TimetableTemplateSchema.index(
  { classId: 1, semester: 1, academicYear: 1, isActive: 1 },
  { unique: true }
);

module.exports = mongoose.model('TimetableTemplate', TimetableTemplateSchema);