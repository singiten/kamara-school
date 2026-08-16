// routes/classRoutes.js - FIXED VERSION!
const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 CREATE CLASS (Admin only) - WITH MULTIPLE TEACHERS
// ============================================
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { 
      name, 
      grade, 
      section, 
      academicYear, 
      teacherIds,  // 👈 Now an ARRAY of teacher IDs
      subjects 
    } = req.body;
    
    // Validate teacher IDs if provided
    if (teacherIds && teacherIds.length > 0) {
      for (const teacherId of teacherIds) {
        const teacher = await User.findById(teacherId);
        if (!teacher) {
          return res.status(404).json({ 
            success: false, 
            error: `Teacher with ID ${teacherId} not found` 
          });
        }
        if (teacher.role !== 'teacher') {
          return res.status(400).json({ 
            success: false, 
            error: `User ${teacher.name} is not a teacher` 
          });
        }
      }
    }
    
    // Check if class already exists
    const existingClass = await Class.findOne({ name, academicYear });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        error: 'Class already exists for this academic year',
      });
    }
    
    const newClass = new Class({
      name,
      grade,
      section,
      academicYear,
      teacherIds: teacherIds || [],
      subjects: subjects || [],
    });
    
    await newClass.save();
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully!',
      data: newClass,
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
// 📌 UPDATE CLASS - WITH MULTIPLE TEACHERS
// ============================================
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { teacherIds, subjects, name, grade, section, academicYear } = req.body;
    
    // Validate teacher IDs if provided
    if (teacherIds && teacherIds.length > 0) {
      for (const teacherId of teacherIds) {
        const teacher = await User.findById(teacherId);
        if (!teacher) {
          return res.status(404).json({ 
            success: false, 
            error: `Teacher with ID ${teacherId} not found` 
          });
        }
        if (teacher.role !== 'teacher') {
          return res.status(400).json({ 
            success: false, 
            error: `User ${teacher.name} is not a teacher` 
          });
        }
      }
    }
    
    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      { name, grade, section, academicYear, teacherIds, subjects },
      { new: true, runValidators: true }
    );
    
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    res.json({
      success: true,
      message: 'Class updated successfully!',
      data: classData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 ADD MULTIPLE STUDENTS TO CLASS (Admin/Teacher)
// ============================================
router.post('/:classId/students', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;  // 👈 Now an ARRAY!
    
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide at least one student ID' 
      });
    }
    
    // Find class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    // Track which students were added successfully
    const addedStudents = [];
    const failedStudents = [];
    
    for (const studentId of studentIds) {
      // Check if student exists and is a student
      const student = await User.findById(studentId);
      if (!student) {
        failedStudents.push({ id: studentId, reason: 'Student not found' });
        continue;
      }
      if (student.role !== 'student') {
        failedStudents.push({ id: studentId, reason: 'User is not a student' });
        continue;
      }
      
      // Check if student is already in the class
      if (classData.students.includes(studentId)) {
        failedStudents.push({ id: studentId, reason: 'Already enrolled' });
        continue;
      }
      
      // Add student to class
      classData.students.push(studentId);
      addedStudents.push(studentId);
      
      // Update student's class field
      student.class = classData.name;
      await student.save();
    }
    
    await classData.save();
    
    // Populate the students data
    const populatedClass = await Class.findById(classId)
      .populate('teacherIds', 'name email subject')
      .populate('students', 'name email age');
    
    res.json({
      success: true,
      message: `Added ${addedStudents.length} student(s) to class`,
      data: {
        class: populatedClass,
        addedStudents: addedStudents,
        failedStudents: failedStudents,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 REMOVE MULTIPLE STUDENTS FROM CLASS
// ============================================
router.delete('/:classId/students', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;  // 👈 Array of student IDs
    
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide at least one student ID' 
      });
    }
    
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    // Remove each student
    const removedStudents = [];
    const notFoundStudents = [];
    
    for (const studentId of studentIds) {
      if (classData.students.includes(studentId)) {
        classData.students = classData.students.filter(
          id => id.toString() !== studentId
        );
        removedStudents.push(studentId);
        
        // Reset student's class field
        await User.findByIdAndUpdate(studentId, { class: null });
      } else {
        notFoundStudents.push(studentId);
      }
    }
    
    await classData.save();
    
    res.json({
      success: true,
      message: `Removed ${removedStudents.length} student(s) from class`,
      data: {
        removedStudents: removedStudents,
        notFoundStudents: notFoundStudents,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET ALL CLASSES (With teachers populated)
// ============================================
router.get('/', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    let filter = {};
    
    // If teacher, only show their classes
    if (req.user.role === 'teacher') {
      filter.teacherIds = req.user.id;
    }
    
    const classes = await Class.find(filter)
      .populate('teacherIds', 'name email subject')
      .populate('students', 'name email')
      .sort({ grade: 1, section: 1 });
    
    res.json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET SINGLE CLASS BY ID
// ============================================
router.get('/:id', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacherIds', 'name email subject')
      .populate('students', 'name email class age');
    
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    res.json({ success: true, data: classData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 DELETE CLASS (Admin only)
// ============================================
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    res.json({
      success: true,
      message: 'Class deleted successfully!',
      data: classData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;