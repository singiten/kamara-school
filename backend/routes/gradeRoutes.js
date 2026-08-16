// routes/gradeRoutes.js - COMPLETE FIXED

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Class = require('../models/Class'); // ✅ ADDED - FIXES MissingSchemaError
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 HELPER: Calculate Weighted Grade
// ============================================

const calculateWeightedGrade = (assessments) => {
  const weights = {
    quiz: 15,
    homework: 10,
    classTest: 20,
    finalTest: 35,
    groupWork: 20,
  };

  let total = 0;
  let totalWeight = 0;

  for (const [key, value] of Object.entries(assessments)) {
    if (value && value.score !== undefined && value.maxScore) {
      const percentage = (value.score / value.maxScore) * 100;
      total += (percentage * (weights[key] || 0)) / 100;
      totalWeight += weights[key] || 0;
    }
  }

  const finalScore = totalWeight > 0 ? (total / totalWeight) * 100 : 0;

  let grade = 'F';
  let points = 0;

  if (finalScore >= 90) { grade = 'A'; points = 4.0; }
  else if (finalScore >= 80) { grade = 'B'; points = 3.0; }
  else if (finalScore >= 70) { grade = 'C'; points = 2.0; }
  else if (finalScore >= 60) { grade = 'D'; points = 1.0; }
  else { grade = 'F'; points = 0.0; }

  return { total: Math.round(finalScore), grade, points };
};

// ============================================
// 📌 TEACHER ROUTES - CREATE GRADE (SINGLE)
// ============================================

router.post('/', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const {
      studentId,
      subject,
      classId,
      semester,
      academicYear,
      feedback,
      assessments,
    } = req.body;

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Validate class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    // Check if teacher is assigned to this class
    if (req.user.role === 'teacher') {
      const teacherIds = classData.teacherIds.map(id => id.toString());
      if (!teacherIds.includes(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'You are not assigned to this class',
        });
      }
    }

    // Check if grade already exists
    const existingGrade = await Grade.findOne({
      studentId,
      subject,
      semester,
      academicYear,
    });

    if (existingGrade) {
      return res.status(400).json({
        success: false,
        error: 'Grade already exists. Use PUT to update.',
      });
    }

    // Prepare assessment data
    const assessmentData = {
      quiz: assessments?.quiz || { score: 0, maxScore: 20, weight: 15 },
      homework: assessments?.homework || { score: 0, maxScore: 15, weight: 10 },
      classTest: assessments?.classTest || { score: 0, maxScore: 20, weight: 20 },
      finalTest: assessments?.finalTest || { score: 0, maxScore: 50, weight: 35 },
      groupWork: assessments?.groupWork || { score: 0, maxScore: 20, weight: 20 },
    };

    const result = calculateWeightedGrade(assessmentData);

    const grade = new Grade({
      studentId,
      subject,
      classId,
      teacherId: req.user.id,
      semester,
      academicYear,
      feedback,
      assessments: assessmentData,
      totalScore: result.total,
      letterGrade: result.grade,
      gradePoints: result.points,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await grade.save();

    const populatedGrade = await Grade.findById(grade._id)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('classId', 'name');

    const isComplete = Object.values(assessmentData).every(a => a.score > 0);

    res.status(201).json({
      success: true,
      message: isComplete ? 'Grade created successfully!' : 'Grade saved as incomplete.',
      data: populatedGrade,
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
// 📌 GET GRADES BY CLASS
// ============================================

router.get('/class/:classId', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { subject, semester, academicYear } = req.query;

    const filter = { classId };
    if (subject) filter.subject = subject;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const grades = await Grade.find(filter)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: grades.length,
      data: grades,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 UPDATE GRADE
// ============================================

router.put('/:id', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { assessments, feedback, subject, semester, academicYear } = req.body;

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({ success: false, error: 'Grade not found' });
    }

    if (req.user.role === 'teacher' && grade.teacherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update grades you created',
      });
    }

    if (assessments) {
      if (assessments.quiz) grade.assessments.quiz = { ...grade.assessments.quiz, ...assessments.quiz };
      if (assessments.homework) grade.assessments.homework = { ...grade.assessments.homework, ...assessments.homework };
      if (assessments.classTest) grade.assessments.classTest = { ...grade.assessments.classTest, ...assessments.classTest };
      if (assessments.finalTest) grade.assessments.finalTest = { ...grade.assessments.finalTest, ...assessments.finalTest };
      if (assessments.groupWork) grade.assessments.groupWork = { ...grade.assessments.groupWork, ...assessments.groupWork };

      const result = calculateWeightedGrade(grade.assessments);
      grade.totalScore = result.total;
      grade.letterGrade = result.grade;
      grade.gradePoints = result.points;
    }

    if (feedback) grade.feedback = feedback;
    if (subject) grade.subject = subject;
    if (semester) grade.semester = semester;
    if (academicYear) grade.academicYear = academicYear;

    grade.updatedAt = new Date();
    await grade.save();

    const populatedGrade = await Grade.findById(grade._id)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('classId', 'name');

    res.json({
      success: true,
      message: 'Grade updated successfully!',
      data: populatedGrade,
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
// 📌 GET MY GRADES (STUDENT)
// ============================================

router.get('/my-grades', auth, roleCheck('student'), async (req, res) => {
  try {
    const { semester, academicYear, subject } = req.query;

    const filter = { studentId: req.user.id };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (subject) filter.subject = subject;

    const grades = await Grade.find(filter)
      .populate('teacherId', 'name email')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    // Calculate GPA
    let gpa = 0;
    let totalPoints = 0;
    const gradeCount = grades.length;

    if (gradeCount > 0) {
      const gradeMap = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D': 1.0, 'F': 0.0,
      };

      for (const grade of grades) {
        const points = gradeMap[grade.letterGrade || grade.grade] || 0;
        totalPoints += points;
      }
      gpa = parseFloat((totalPoints / gradeCount).toFixed(2));
    }

    res.json({
      success: true,
      gpa: gpa,
      count: grades.length,
      data: grades,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET CHILD'S GRADES (PARENT)
// ============================================

router.get('/child/:childId/grades', auth, roleCheck('parent'), async (req, res) => {
  try {
    const { childId } = req.params;
    const { semester, academicYear } = req.query;

    // Verify this child belongs to this parent
    const parent = await User.findById(req.user.id);
    if (!parent.children.includes(childId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this student\'s grades',
      });
    }

    const filter = { studentId: childId };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const grades = await Grade.find(filter)
      .populate('teacherId', 'name email')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    // Calculate GPA
    let gpa = 0;
    let totalPoints = 0;
    const gradeCount = grades.length;

    if (gradeCount > 0) {
      const gradeMap = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D': 1.0, 'F': 0.0,
      };

      for (const grade of grades) {
        const points = gradeMap[grade.letterGrade || grade.grade] || 0;
        totalPoints += points;
      }
      gpa = parseFloat((totalPoints / gradeCount).toFixed(2));
    }

    res.json({
      success: true,
      gpa: gpa,
      count: grades.length,
      data: grades,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 ADMIN ROUTES
// ============================================

// ✅ Get All Grades (Admin)
router.get('/all', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { classId, subject, semester, academicYear } = req.query;

    const filter = {};
    if (classId) filter.classId = classId;
    if (subject) filter.subject = subject;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const grades = await Grade.find(filter)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: grades.length,
      data: grades,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Get Grade Statistics
router.get('/stats', auth, roleCheck('admin'), async (req, res) => {
  try {
    const totalGrades = await Grade.countDocuments();
    const averageScore = await Grade.aggregate([
      { $group: { _id: null, avg: { $avg: '$totalScore' } } }
    ]);

    const gradeDistribution = await Grade.aggregate([
      { $group: { _id: '$letterGrade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalGrades,
        averageScore: averageScore[0]?.avg || 0,
        gradeDistribution,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;