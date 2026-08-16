// models/Announcement.js
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  // 📌 Core Fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters'],
  },
  
  // 👥 Audience Targeting
  audience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'admin'],
    default: 'all',
  },
  targetClassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: function() { return this.audience === 'class'; },
  },
  
  // 🎯 Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  
  // 📅 Dates
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30); // Default: 30 days
      return date;
    },
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  
  // 📌 Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  },
  
  // 👤 Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
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

// ✅ Indexes for fast queries
AnnouncementSchema.index({ audience: 1, status: 1 });
AnnouncementSchema.index({ createdBy: 1 });
AnnouncementSchema.index({ expiresAt: 1 });
AnnouncementSchema.index({ priority: 1 });

// ✅ Virtual: Check if announcement is expired
AnnouncementSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// ✅ Virtual: Get time remaining
AnnouncementSchema.virtual('timeRemaining').get(function() {
  if (!this.expiresAt) return null;
  const diff = this.expiresAt - new Date();
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
});

// ✅ Enable virtuals in JSON output
AnnouncementSchema.set('toJSON', { virtuals: true });
AnnouncementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);