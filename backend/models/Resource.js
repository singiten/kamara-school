// models/Resource.js - COMPLETE WITH GRADE & SECTIONS

const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  // 📌 Basic Info
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  
  // 📌 File Info
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'image', 'video', 'link', 'other'],
    required: [true, 'File type is required'],
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  mimeType: {
    type: String,
  },
  
  // 📌 Academic Info
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  topic: {
    type: String,
    trim: true,
  },
  classLevel: {
    type: String,
    enum: ['primary', 'middle', 'secondary'],
    required: [true, 'Class level is required'],
  },
  
  // ✅ NEW: Grade and Sections
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true,
  },
  sections: [{
    type: String,
    trim: true,
  }],
  
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  }],
  semester: {
    type: String,
    required: [true, 'Semester is required'],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
  },
  
  // 📌 Uploader Info
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
  },
  
  // 📌 Stats
  downloadCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  
  // 📌 Status
  isActive: {
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
ResourceSchema.index({ classLevel: 1, semester: 1, academicYear: 1 });
ResourceSchema.index({ uploadedBy: 1, createdAt: -1 });
ResourceSchema.index({ subject: 1, topic: 1 });
ResourceSchema.index({ assignedClasses: 1 });
ResourceSchema.index({ grade: 1, sections: 1 });

module.exports = mongoose.model('Resource', ResourceSchema);