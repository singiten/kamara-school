// routes/passwordResetRoutes.js - COMPLETE PASSWORD RESET SYSTEM

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const bcrypt = require('bcryptjs');

// ============================================
// 📌 USER REQUESTS PASSWORD RESET
// ============================================

router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // ✅ Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email'
      });
    }

    // ✅ Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      email: email.toLowerCase(),
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'A reset request is already pending for this email. Please wait for the registrar to process it.'
      });
    }

    // ✅ Create new reset request
    const resetRequest = new PasswordResetRequest({
      userId: user._id,
      email: email.toLowerCase(),
      status: 'pending',
      requestedAt: new Date(),
    });

    await resetRequest.save();

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully! Please wait for the registrar to process it.',
      data: {
        requestId: resetRequest._id,
        email: resetRequest.email,
        status: resetRequest.status,
        requestedAt: resetRequest.requestedAt,
      }
    });

  } catch (error) {
    console.error('❌ Error creating reset request:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// ============================================
// 📌 REGISTRAR - GET ALL PENDING REQUESTS
// ============================================

router.get('/pending', auth, roleCheck('admin', 'registrar'), async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({ status: 'pending' })
      .populate('userId', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// ============================================
// 📌 REGISTRAR - GET ALL REQUESTS (History)
// ============================================

router.get('/all', auth, roleCheck('admin', 'registrar'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await PasswordResetRequest.find(filter)
      .populate('userId', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// ============================================
// 📌 REGISTRAR - RESET PASSWORD (Manually)
// ✅ Sets mustChangePassword = true
// ============================================

router.post('/:requestId/reset', auth, roleCheck('admin', 'registrar'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { newPassword, notes } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // ✅ Find the request
    const resetRequest = await PasswordResetRequest.findById(requestId);
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        error: 'Reset request not found'
      });
    }

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `This request is already ${resetRequest.status}`
      });
    }

    // ✅ Find the user
    const user = await User.findById(resetRequest.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // ✅ Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // ✅ Update user password AND force password change
    user.password = hashedPassword;
    user.mustChangePassword = true; // ✅ FORCE PASSWORD CHANGE ON NEXT LOGIN
    await user.save();

    // ✅ Update request status
    resetRequest.status = 'resolved';
    resetRequest.resolvedAt = new Date();
    resetRequest.resolvedBy = req.user.id;
    if (notes) resetRequest.notes = notes;
    await resetRequest.save();

    res.json({
      success: true,
      message: 'Password reset successfully! The user must change their password on next login.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: true,
        },
        resetRequest,
      }
    });

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// ============================================
// 📌 REGISTRAR - CANCEL REQUEST
// ============================================

router.put('/:requestId/cancel', auth, roleCheck('admin', 'registrar'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const resetRequest = await PasswordResetRequest.findById(requestId);
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        error: 'Reset request not found'
      });
    }

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `This request is already ${resetRequest.status}`
      });
    }

    resetRequest.status = 'cancelled';
    resetRequest.notes = reason || 'Cancelled by registrar';
    resetRequest.resolvedAt = new Date();
    resetRequest.resolvedBy = req.user.id;
    await resetRequest.save();

    res.json({
      success: true,
      message: 'Reset request cancelled successfully',
      data: resetRequest,
    });

  } catch (error) {
    console.error('❌ Error cancelling request:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// ============================================
// 📌 USER - CHECK REQUEST STATUS
// ============================================

router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const request = await PasswordResetRequest.findOne({
      email: email.toLowerCase(),
      status: 'pending'
    });

    res.json({
      success: true,
      hasPendingRequest: !!request,
      data: request || null,
    });

  } catch (error) {
    console.error('❌ Error checking request status:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// ============================================
// 📌 USER - CHANGE PASSWORD (After Reset)
// ✅ Clears mustChangePassword flag
// ============================================

router.post('/change-password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // ✅ Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.mustChangePassword = false; // ✅ CLEAR THE FORCE CHANGE FLAG
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully!',
      data: {
        mustChangePassword: false,
      },
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

module.exports = router;