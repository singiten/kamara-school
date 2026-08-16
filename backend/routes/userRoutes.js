// routes/userRoutes.js 
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// PUBLIC ROUTES (No authentication needed)


// GET /api/users - Get all users (with optional filters)

router.get('/', async (req, res) => {
  try {
    const { role, class: className } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (className) filter.class = className;
    
    const users = await User.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// GET /api/users/role/:role - Get users by role

router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }
    
    const users = await User.find({ role }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// GET /api/users/class/:className - Get students by class

router.get('/class/:className', async (req, res) => {
  try {
    const { className } = req.params;
    
    const students = await User.find({
      role: 'student',
      class: className,
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// GET /api/users/:id - Get single user by ID

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// POST /api/users - Create new user

router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      class: className, 
      age, 
      gender,
      parentName, 
      parentPhone, 
      subject, 
      hireDate 
    } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
    };
    
    // Add role-specific fields
    if (role === 'student') {
      userData.class = className;
      if (age) userData.age = age;
      if (parentName) userData.parentName = parentName;
      if (parentPhone) userData.parentPhone = parentPhone;
    } else if (role === 'teacher') {
      userData.subject = subject;
      if (hireDate) userData.hireDate = hireDate;
    }
    
    const user = new User(userData);
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully!',
      data: user,
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists. Please use a different email.',
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: errors,
      });
    }
    
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// PROTECTED ROUTES (Authentication required)


// GET /api/users/me - Get current user's profile
//  Requires: Authentication (any role)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});


//  ADMIN-ONLY ROUTES


// PUT /api/users/:id - Update user
//  Requires: Authentication + Admin role
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully!',
      data: user,
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists. Please use a different email.',
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: errors,
      });
    }
    
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// DELETE /api/users/:id - Delete user
// Requires: Authentication + Admin role
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully!',
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

//  ADMIN & TEACHER ROUTES
// GET /api/users/stats/roles - Get user statistics
//  Requires: Authentication + Admin OR Teacher
router.get('/stats/roles', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const parents = await User.countDocuments({ role: 'parent' });
    const admins = await User.countDocuments({ role: 'admin' });
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      data: {
        students,
        teachers,
        parents,
        admins,
        total,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;