const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Semester 1', 'Semester 2'],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
  },
  records: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

// Ensure only one attendance record per class per day
AttendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

//  Index for fast queries
AttendanceSchema.index({ classId: 1, date: -1 });
AttendanceSchema.index({ 'records.studentId': 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);