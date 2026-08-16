// routes/reportCardRoutes.js - Grade Report Routes

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ReportCard = require('../models/ReportCard');
const User = require('../models/User');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { uploadReportCard } = require('../services/fileUpload');
const path = require('path');
const fs = require('fs');

// ============================================
// 📌 TEACHER: UPLOAD REPORT CARD
// ============================================

router.post(
  '/upload',
  auth,
  roleCheck('admin', 'teacher'),
  uploadReportCard.single('file'),
  async (req, res) => {
    try {
      const {
        studentId,
        classId,
        term,
        academicYear,
        subjects,
        totalMarks,
        totalObtained,
        percentage,
        gpa,
        overallGrade,
        teacherRemarks,
        status,
        isVisibleToStudent,
        isVisibleToParent,
      } = req.body;

      console.log('📥 Uploading report card:', req.body);
      console.log('📎 File:', req.file);

      // ✅ Validate required fields
      if (!studentId || !classId || !term || !academicYear) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Student, class, term, and academic year are required',
        });
      }

      // ✅ Check if student exists
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      // ✅ Check if class exists
      const classData = await Class.findById(classId);
      if (!classData) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(404).json({
          success: false,
          error: 'Class not found',
        });
      }

      // ✅ Check if report card already exists for this student, term, and year
      const existingReport = await ReportCard.findOne({
        studentId,
        term,
        academicYear,
      });

      if (existingReport) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Report card already exists for this student, term, and academic year',
        });
      }

      // ✅ Parse subjects
      let subjectsArray = [];
      if (subjects) {
        try {
          subjectsArray = JSON.parse(subjects);
        } catch {
          subjectsArray = [];
        }
      }

      // ✅ Create report card
      const reportCard = new ReportCard({
        studentId,
        classId,
        term,
        academicYear,
        subjects: subjectsArray,
        totalMarks: parseFloat(totalMarks) || 0,
        totalObtained: parseFloat(totalObtained) || 0,
        percentage: parseFloat(percentage) || 0,
        gpa: parseFloat(gpa) || 0,
        overallGrade: overallGrade || '',
        teacherRemarks: teacherRemarks || '',
        fileUrl: req.file ? `/uploads/report-cards/${path.relative(
          path.join(__dirname, '../uploads/report-cards'),
          req.file.path
        ).replace(/\\/g, '/')}` : '',
        fileName: req.file ? req.file.originalname : '',
        uploadedBy: req.user.id,
        status: status || 'published',
        isVisibleToStudent: isVisibleToStudent !== undefined ? isVisibleToStudent : true,
        isVisibleToParent: isVisibleToParent !== undefined ? isVisibleToParent : true,
      });

      await reportCard.save();
      console.log('✅ Report card uploaded:', reportCard._id);

      res.status(201).json({
        success: true,
        message: 'Report card uploaded successfully!',
        data: reportCard,
      });
    } catch (error) {
      console.error('❌ Error uploading report card:', error);
      
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({ success: false, errors });
      }

      res.status(500).json({
        success: false,
        error: 'Server Error: ' + error.message,
      });
    }
  }
);

// ============================================
// 📌 GET REPORT CARDS (Role-based)
// ============================================

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { studentId, term, academicYear, status } = req.query;
    
    const filter = {};

    console.log('👤 User role:', user.role);

    // ✅ Role-based filtering
    if (user.role === 'teacher') {
      // Teacher sees report cards they uploaded
      filter.uploadedBy = req.user.id;
    } else if (user.role === 'student') {
      // Student sees their own report cards
      filter.studentId = req.user.id;
      filter.isVisibleToStudent = true;
    } else if (user.role === 'parent') {
      // Parent sees their children's report cards
      const children = await User.find({ _id: { $in: user.children } });
      const childIds = children.map(c => c._id);
      filter.studentId = { $in: childIds };
      filter.isVisibleToParent = true;
    } else if (user.role === 'admin') {
      // Admin sees all report cards
      // No filter needed
    }

    // ✅ Additional filters
    if (studentId) filter.studentId = studentId;
    if (term) filter.term = term;
    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;

    console.log('🔍 Final filter:', JSON.stringify(filter, null, 2));

    const reportCards = await ReportCard.find(filter)
      .populate('studentId', 'name email class')
      .populate('classId', 'name grade section')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${reportCards.length} report cards`);

    res.json({
      success: true,
      count: reportCards.length,
      data: reportCards,
    });
  } catch (error) {
    console.error('❌ Error fetching report cards:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 GET SINGLE REPORT CARD
// ============================================

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report card ID',
      });
    }

    const reportCard = await ReportCard.findById(id)
      .populate('studentId', 'name email class')
      .populate('classId', 'name grade section')
      .populate('uploadedBy', 'name email');

    if (!reportCard) {
      return res.status(404).json({
        success: false,
        error: 'Report card not found',
      });
    }

    res.json({
      success: true,
      data: reportCard,
    });
  } catch (error) {
    console.error('❌ Error fetching report card:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 DOWNLOAD REPORT CARD
// ============================================

router.get('/:id/download', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report card ID',
      });
    }

    const reportCard = await ReportCard.findById(id);
    if (!reportCard) {
      return res.status(404).json({
        success: false,
        error: 'Report card not found',
      });
    }

    // ✅ Check if user has access
    const user = await User.findById(req.user.id);
    const hasAccess = await checkReportCardAccess(user, reportCard);
    if (!hasAccess && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this report card',
      });
    }

    // ✅ Get file path
    const filePath = path.join(__dirname, '..', reportCard.fileUrl);
    
    // ✅ Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server',
      });
    }

    // ✅ Download file
    res.download(filePath, `report-card-${reportCard.studentId}-${reportCard.term}-${reportCard.academicYear}.pdf`);
  } catch (error) {
    console.error('❌ Error downloading report card:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 UPDATE REPORT CARD
// ============================================

router.put('/:id', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report card ID',
      });
    }

    const reportCard = await ReportCard.findById(id);
    if (!reportCard) {
      return res.status(404).json({
        success: false,
        error: 'Report card not found',
      });
    }

    // ✅ Check authorization
    if (reportCard.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to update this report card',
      });
    }

    // ✅ Update fields
    const allowedUpdates = [
      'subjects', 'totalMarks', 'totalObtained', 'percentage', 'gpa',
      'overallGrade', 'teacherRemarks', 'status',
      'isVisibleToStudent', 'isVisibleToParent'
    ];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        reportCard[field] = updates[field];
      }
    });
    reportCard.updatedAt = new Date();

    await reportCard.save();

    res.json({
      success: true,
      message: 'Report card updated successfully!',
      data: reportCard,
    });
  } catch (error) {
    console.error('❌ Error updating report card:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 DELETE REPORT CARD
// ============================================

router.delete('/:id', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report card ID',
      });
    }

    const reportCard = await ReportCard.findById(id);
    if (!reportCard) {
      return res.status(404).json({
        success: false,
        error: 'Report card not found',
      });
    }

    // ✅ Check authorization
    if (reportCard.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this report card',
      });
    }

    // ✅ Delete file from server
    if (reportCard.fileUrl) {
      const filePath = path.join(__dirname, '..', reportCard.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
    }

    await reportCard.deleteOne();

    res.json({
      success: true,
      message: 'Report card deleted successfully!',
    });
  } catch (error) {
    console.error('❌ Error deleting report card:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 HELPER: Check Report Card Access
// ============================================

async function checkReportCardAccess(user, reportCard) {
  // Admin has access
  if (user.role === 'admin') return true;

  // Teacher who uploaded has access
  if (user.role === 'teacher' && reportCard.uploadedBy.toString() === user._id.toString()) {
    return true;
  }

  // Student: only their own report cards
  if (user.role === 'student' && reportCard.studentId.toString() === user._id.toString()) {
    return reportCard.isVisibleToStudent;
  }

  // Parent: their children's report cards
  if (user.role === 'parent') {
    const children = await User.find({ _id: { $in: user.children } });
    const childIds = children.map(c => c._id.toString());
    if (childIds.includes(reportCard.studentId.toString())) {
      return reportCard.isVisibleToParent;
    }
  }

  return false;
}

module.exports = router;