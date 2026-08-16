// routes/messageRoutes.js - COMPLETE FIXED

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ✅ ADD THIS for ObjectId validation
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ============================================
// 📌 SPECIFIC ROUTES FIRST (BEFORE :userId)
// ============================================

// ✅ GET AVAILABLE USERS (Role-based)
router.get('/users/available', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let targetUsers = [];

    switch (user.role) {
      case 'admin':
        targetUsers = await User.find({
          _id: { $ne: req.user.id }
        }).select('name email role');
        break;

      case 'teacher':
        targetUsers = await User.find({
          _id: { $ne: req.user.id },
          role: { $in: ['parent', 'admin', 'student'] }
        }).select('name email role');
        break;

      case 'parent':
        targetUsers = await User.find({
          _id: { $ne: req.user.id },
          role: { $in: ['teacher', 'admin'] }
        }).select('name email role');
        break;

      case 'student':
        targetUsers = await User.find({
          _id: { $ne: req.user.id },
          role: { $in: ['teacher', 'admin'] }
        }).select('name email role');
        break;

      default:
        targetUsers = [];
    }

    res.json({
      success: true,
      data: targetUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET UNREAD COUNT
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      data: { unread: count },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET UNREAD PER USER
router.get('/unread/per-user', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadAggregation = await Message.aggregate([
      {
        $match: {
          receiverId: userId,
          isRead: false,
        },
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadCounts = {};
    unreadAggregation.forEach((item) => {
      unreadCounts[item._id.toString()] = item.count;
    });

    res.json({
      success: true,
      data: { unreadCounts },
    });
  } catch (error) {
    console.error('Error fetching per-user unread counts:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET RECENT MESSAGES - MOVED ABOVE /:userId
router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const messages = await Message.find({
      receiverId: req.user.id,
    })
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ MARK ALL AS READ
router.put('/read-all', auth, async (req, res) => {
  try {
    const result = await Message.updateMany(
      {
        receiverId: req.user.id,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 PARAMETER ROUTE - MUST BE LAST
// ============================================

// ✅ GET MESSAGES BETWEEN TWO USERS
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // ✅ Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: 1 });

    // ✅ Mark messages as read when fetched
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;