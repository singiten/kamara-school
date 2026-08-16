// routes/parentRoutes.js - COMPLETE WITH DEBUG LOGS

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 GET PARENT'S CHILDREN
// ============================================

router.get('/:parentId/children', auth, async (req, res) => {
  try {
    const { parentId } = req.params;
    
    console.log('🔍 Fetching children for parent:', parentId);
    console.log('👤 Requesting user:', req.user.id);
    
    // ✅ Check if user is authorized
    if (req.user.id !== parentId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own children'
      });
    }
    
    const parent = await User.findById(parentId).populate('children', 'name email class classLevel _id');
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }
    
    if (parent.role !== 'parent') {
      return res.status(400).json({
        success: false,
        error: 'User is not a parent'
      });
    }
    
    console.log('👨‍👧 Found children:', parent.children);
    console.log(`📊 Total children: ${parent.children.length}`);
    
    res.json({
      success: true,
      count: parent.children.length,
      data: parent.children,
    });
  } catch (error) {
    console.error('❌ Error fetching children:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// ============================================
// 📌 LINK PARENT TO STUDENT (Admin only)
// ============================================

router.put('/:studentId/link-parent/:parentId', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { studentId, parentId } = req.params;
    
    console.log(`🔗 Linking student ${studentId} to parent ${parentId}`);
    
    // Find student and parent
    const student = await User.findById(studentId);
    const parent = await User.findById(parentId);
    
    if (!student || !parent) {
      return res.status(404).json({
        success: false,
        error: 'Student or Parent not found'
      });
    }
    
    // Validate roles
    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        error: 'Target user must be a student'
      });
    }
    if (parent.role !== 'parent') {
      return res.status(400).json({
        success: false,
        error: 'Target user must be a parent'
      });
    }
    
    // ✅ Link student to parent
    student.parentId = parent._id;
    await student.save();
    
    // ✅ Add student to parent's children array (if not already added)
    if (!parent.children.includes(student._id)) {
      parent.children.push(student._id);
      await parent.save();
      console.log(`✅ Added ${student.name} to ${parent.name}'s children`);
    } else {
      console.log(`⏭️ ${student.name} already in ${parent.name}'s children`);
    }
    
    // Populate the data before sending response
    const updatedStudent = await User.findById(studentId).populate('parentId', 'name email phone');
    const updatedParent = await User.findById(parentId).populate('children', 'name email class');
    
    res.json({
      success: true,
      message: 'Parent linked to student successfully!',
      data: {
        student: updatedStudent,
        parent: updatedParent,
      },
    });
  } catch (error) {
    console.error('❌ Error linking parent:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// ============================================
// 📌 GET STUDENT'S PARENT
// ============================================

router.get('/:studentId/parent', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId).populate('parentId', 'name email phone children');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        error: 'User is not a student'
      });
    }
    
    if (!student.parentId) {
      return res.status(404).json({
        success: false,
        error: 'No parent linked to this student'
      });
    }
    
    res.json({
      success: true,
      data: student.parentId
    });
  } catch (error) {
    console.error('❌ Error fetching parent:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// ============================================
// 📌 UNLINK PARENT FROM STUDENT (Admin only)
// ============================================

router.delete('/:studentId/unlink-parent', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        error: 'User is not a student'
      });
    }
    
    if (!student.parentId) {
      return res.status(404).json({
        success: false,
        error: 'Student has no parent linked'
      });
    }
    
    // Remove student from parent's children array
    const parentId = student.parentId;
    await User.findByIdAndUpdate(parentId, {
      $pull: { children: student._id }
    });
    
    // Remove parentId from student
    student.parentId = null;
    await student.save();
    
    console.log(`✅ Unlinked student ${student.name} from parent`);
    
    res.json({
      success: true,
      message: 'Parent unlinked from student successfully!',
    });
  } catch (error) {
    console.error('❌ Error unlinking parent:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

module.exports = router;