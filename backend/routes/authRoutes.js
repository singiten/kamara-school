// routes/authRoutes.js - COMPLETE FIXED VERSION

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 MOCK EMAIL SERVICE (No real email)
// ============================================

const sendPasswordResetEmail = async (to, name, resetToken, frontendUrl) => {
  console.log('📧 MOCK EMAIL (Reset):');
  console.log(`  To: ${to}`);
  console.log(`  Name: ${name}`);
  console.log(`  Token: ${resetToken}`);
  console.log(`  Link: ${frontendUrl}/reset-password/${resetToken}`);
  console.log('  (No actual email sent - testing mode)');
  return { success: true };
};

const sendPasswordChangedEmail = async (to, name) => {
  console.log('📧 MOCK EMAIL (Changed):');
  console.log(`  To: ${to}`);
  console.log(`  Name: ${name}`);
  console.log('  (No actual email sent - testing mode)');
  return { success: true };
};

// ============================================
// 📌 REGISTER
// ============================================

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, class: className, age, parentName, parentPhone, subject, hireDate } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'student',
    };

    if (userData.role === 'student') {
      userData.class = className;
      if (age) userData.age = age;
      if (parentName) userData.parentName = parentName;
      if (parentPhone) userData.parentPhone = parentPhone;
    } else if (userData.role === 'teacher') {
      userData.subject = subject;
      if (hireDate) userData.hireDate = hireDate;
    }

    const user = new User(userData);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: userResponse,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists.',
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, errors });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 LOGIN - WITH mustChangePassword CHECK
// ✅ No password required when mustChangePassword is true
// ============================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📥 Login attempt for email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('👤 User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email.',
      });
    }

    // ✅ Check if user must change password
    const mustChangePassword = user.mustChangePassword || false;

    // ✅ If user must change password, skip password verification
    if (mustChangePassword) {
      console.log('🔑 User must change password - skipping password check');
      
      const payload = {
        user: {
          id: user._id,
          role: user.role,
          email: user.email,
        },
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        message: 'Please change your password to continue.',
        token,
        mustChangePassword: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          class: user.class,
          age: user.age,
          subject: user.subject,
          children: user.children,
        },
      });
    }

    // ✅ Normal login flow - require password
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password match:', isMatch ? 'Yes' : 'No');

    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      mustChangePassword: false,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        class: user.class,
        age: user.age,
        subject: user.subject,
        children: user.children,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 GET CURRENT USER - WITH POPULATED assignedClasses
// ============================================

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('assignedClasses', 'name grade section classLevel');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 FORGOT PASSWORD
// ============================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    user.resetPasswordRequestedAt = new Date();
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendPasswordResetEmail(user.email, user.name, resetToken, frontendUrl);

    res.json({
      success: true,
      message: 'Password reset link sent to your email.',
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.',
    });
  }
});

// ============================================
// 📌 RESET PASSWORD (With Token)
// ============================================

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await sendPasswordChangedEmail(user.email, user.name);

    res.json({
      success: true,
      message: 'Password reset successfully!',
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.',
    });
  }
});

// ============================================
// 📌 CHANGE PASSWORD (Logged-in user)
// ✅ No current password required - for forced change
// ============================================

router.post('/change-password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
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

// ============================================
// 📌 VALIDATE RESET TOKEN
// ============================================

router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      email: user.email,
    });
  } catch (error) {
    console.error('❌ Validate token error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// ============================================
// 📌 ADMIN & REGISTRAR RESET PASSWORD
// ============================================

router.put('/admin/reset-password/:userId', auth, roleCheck('admin', 'registrar'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.mustChangePassword = true; // ✅ FORCE CHANGE ON NEXT LOGIN
    await user.save();

    console.log(`🔑 ${req.user.role} ${req.user.id} reset password for ${user.email}`);

    res.json({
      success: true,
      message: `Password reset successfully for ${user.name}! They must change their password on next login.`,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.',
    });
  }
});

// ============================================
// 📌 LOGOUT
// ============================================

router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;