// routes/announcementRoutes.js
const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 GET ANNOUNCEMENTS (All authenticated users)
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userRole = user.role;
    
    // ✅ Build filter based on user role
    const filter = { status: 'published' };
    
    // If user is student, show: 'all', 'students', and class-specific
    if (userRole === 'student') {
      filter.$or = [
        { audience: 'all' },
        { audience: 'students' },
        { audience: 'student' },
      ];
      // Add class-specific announcements if student has a class
      if (user.class) {
        // We'll handle class-specific via a separate query
      }
    } else if (userRole === 'teacher') {
      filter.$or = [
        { audience: 'all' },
        { audience: 'teachers' },
        { audience: 'teacher' },
      ];
    } else if (userRole === 'parent') {
      filter.$or = [
        { audience: 'all' },
        { audience: 'parents' },
        { audience: 'parent' },
      ];
    } else if (userRole === 'admin') {
      // Admin sees everything
      delete filter.status;
    } else {
      filter.$or = [
        { audience: 'all' },
        { audience: userRole },
      ];
    }
    
    // ✅ Add expiration filter (only show non-expired)
    filter.expiresAt = { $gt: new Date() };
    
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name email role')
      .populate('targetClassId', 'name')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET SINGLE ANNOUNCEMENT
// ============================================
router.get('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('targetClassId', 'name');
    
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    
    // ✅ Check if user has permission to view
    const user = await User.findById(req.user.id);
    const userRole = user.role;
    
    if (userRole !== 'admin') {
      const allowedAudience = ['all', userRole, userRole + 's'];
      if (!allowedAudience.includes(announcement.audience)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this announcement'
        });
      }
    }
    
    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 CREATE ANNOUNCEMENT (Admin/Teacher)
// ============================================
router.post('/', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const {
      title,
      content,
      audience,
      targetClassId,
      priority,
      expiresAt,
      status,
    } = req.body;
    
    // ✅ Validate audience requires classId
    if (audience === 'class' && !targetClassId) {
      return res.status(400).json({
        success: false,
        error: 'targetClassId is required when audience is "class"'
      });
    }
    
    const announcement = new Announcement({
      title,
      content,
      audience: audience || 'all',
      targetClassId: audience === 'class' ? targetClassId : undefined,
      priority: priority || 'medium',
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: status || 'published',
      createdBy: req.user.id,
    });
    
    await announcement.save();
    
    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email role')
      .populate('targetClassId', 'name');
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully!',
      data: populated,
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, errors });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 UPDATE ANNOUNCEMENT (Admin/Teacher)
// ============================================
router.put('/:id', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const {
      title,
      content,
      audience,
      targetClassId,
      priority,
      expiresAt,
      status,
    } = req.body;
    
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    
    // ✅ Check if user owns this announcement (or is admin)
    if (req.user.role !== 'admin' && announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own announcements'
      });
    }
    
    // Update fields
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (audience) {
      announcement.audience = audience;
      if (audience === 'class' && targetClassId) {
        announcement.targetClassId = targetClassId;
      } else {
        announcement.targetClassId = undefined;
      }
    }
    if (priority) announcement.priority = priority;
    if (expiresAt) announcement.expiresAt = expiresAt;
    if (status) announcement.status = status;
    announcement.updatedAt = new Date();
    
    await announcement.save();
    
    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email role')
      .populate('targetClassId', 'name');
    
    res.json({
      success: true,
      message: 'Announcement updated successfully!',
      data: populated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 DELETE ANNOUNCEMENT (Admin/Teacher)
// ============================================
router.delete('/:id', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    
    // ✅ Check if user owns this announcement (or is admin)
    if (req.user.role !== 'admin' && announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own announcements'
      });
    }
    
    await announcement.deleteOne();
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET ANNOUNCEMENTS BY AUDIENCE (Admin only)
// ============================================
router.get('/audience/:audience', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { audience } = req.params;
    const validAudience = ['all', 'students', 'teachers', 'parents', 'admin'];
    
    if (!validAudience.includes(audience)) {
      return res.status(400).json({
        success: false,
        error: `Invalid audience. Must be one of: ${validAudience.join(', ')}`
      });
    }
    
    const announcements = await Announcement.find({ audience })
      .populate('createdBy', 'name email role')
      .populate('targetClassId', 'name')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 BULK DELETE (Admin only)
// ============================================
router.post('/bulk-delete', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { announcementIds } = req.body;
    
    if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of announcement IDs'
      });
    }
    
    const result = await Announcement.deleteMany({
      _id: { $in: announcementIds }
    });
    
    res.json({
      success: true,
      message: `${result.deletedCount} announcements deleted successfully!`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;