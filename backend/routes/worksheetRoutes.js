// routes/worksheetRoutes.js - FIXED ROUTE ORDER
const express = require('express');
const router = express.Router();
const Worksheet = require('../models/Worksheet');
const WorksheetAttempt = require('../models/WorksheetAttempt');
const User = require('../models/User');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 STUDENT ROUTES (SPECIFIC FIRST)
// ============================================

// ✅ Get Available Worksheets (Student)
router.get('/available', auth, roleCheck('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || !student.class) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or no class assigned',
      });
    }

    const classData = await Class.findOne({ name: student.class });
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
      });
    }

    const now = new Date();
    const worksheets = await Worksheet.find({
      classId: classData._id,
      status: 'published',
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('teacherId', 'name email')
      .sort({ endDate: 1 });

    // Check if student has already attempted
    const attempts = await WorksheetAttempt.find({
      studentId: req.user.id,
      worksheetId: { $in: worksheets.map(w => w._id) },
    });

    const worksheetsWithStatus = worksheets.map(w => {
      const attempt = attempts.find(a => a.worksheetId.toString() === w._id.toString());
      return {
        ...w.toObject(),
        attempted: !!attempt,
        attemptStatus: attempt ? attempt.status : 'not_started',
        score: attempt ? attempt.score : null,
        percentage: attempt ? attempt.percentage : null,
      };
    });

    res.json({
      success: true,
      count: worksheetsWithStatus.length,
      data: worksheetsWithStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Get Student's Worksheet History
router.get('/my-history', auth, roleCheck('student'), async (req, res) => {
  try {
    const attempts = await WorksheetAttempt.find({ studentId: req.user.id })
      .populate('worksheetId', 'title subject classId totalMarks totalQuestions')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Get Worksheet Results (Teacher/Admin)
router.get('/:id/results', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && worksheet.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const attempts = await WorksheetAttempt.find({ worksheetId: worksheet._id })
      .populate('studentId', 'name email class')
      .sort({ percentage: -1 });

    const totalStudents = attempts.length;
    const averageScore = totalStudents > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalStudents)
      : 0;
    const highestScore = totalStudents > 0
      ? Math.max(...attempts.map(a => a.percentage))
      : 0;
    const passedStudents = attempts.filter(a => a.percentage >= 50).length;

    res.json({
      success: true,
      data: {
        worksheet: {
          title: worksheet.title,
          subject: worksheet.subject,
          totalMarks: worksheet.totalMarks,
          totalQuestions: worksheet.totalQuestions,
        },
        summary: {
          totalStudents,
          averageScore,
          highestScore,
          passedStudents,
          passRate: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0,
        },
        attempts,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 TEACHER ROUTES
// ============================================

// ✅ Get All Worksheets (Teacher/Admin)
router.get('/', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { classId, subject, status } = req.query;
    const filter = {};

    if (req.user.role === 'teacher') {
      filter.teacherId = req.user.id;
    }
    if (classId) filter.classId = classId;
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const worksheets = await Worksheet.find(filter)
      .populate('classId', 'name')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: worksheets.length,
      data: worksheets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Create Worksheet
router.post('/', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, classId, subject, questions, startDate, endDate, duration } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    if (req.user.role === 'teacher') {
      const teacherIds = classData.teacherIds.map(id => id.toString());
      if (!teacherIds.includes(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'You are not assigned to this class',
        });
      }
    }

    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const worksheet = new Worksheet({
      title,
      description,
      classId,
      subject,
      teacherId: req.user.id,
      questions,
      startDate,
      endDate,
      duration: duration || 30,
      totalQuestions,
      totalMarks,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await worksheet.save();

    res.status(201).json({
      success: true,
      message: 'Worksheet created successfully!',
      data: worksheet,
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

// ✅ Update Worksheet
router.put('/:id', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions, startDate, endDate, duration } = req.body;

    const worksheet = await Worksheet.findById(id);
    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    if (req.user.role !== 'admin' && worksheet.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    let totalQuestions = worksheet.totalQuestions;
    let totalMarks = worksheet.totalMarks;
    if (questions) {
      totalQuestions = questions.length;
      totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    const updateData = {
      title: title || worksheet.title,
      description: description !== undefined ? description : worksheet.description,
      questions: questions || worksheet.questions,
      startDate: startDate || worksheet.startDate,
      endDate: endDate || worksheet.endDate,
      duration: duration || worksheet.duration,
      totalQuestions,
      totalMarks,
      updatedAt: new Date(),
    };

    const updatedWorksheet = await Worksheet.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Worksheet updated successfully!',
      data: updatedWorksheet,
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

// ✅ Publish Worksheet
router.put('/:id/publish', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    if (req.user.role !== 'admin' && worksheet.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (worksheet.questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot publish empty worksheet' });
    }

    if (new Date(worksheet.startDate) < new Date()) {
      return res.status(400).json({ success: false, error: 'Start date must be in the future' });
    }

    worksheet.status = 'published';
    worksheet.updatedAt = new Date();
    await worksheet.save();

    res.json({
      success: true,
      message: 'Worksheet published successfully!',
      data: worksheet,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Close Worksheet
router.put('/:id/close', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    if (req.user.role !== 'admin' && worksheet.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    worksheet.status = 'closed';
    worksheet.updatedAt = new Date();
    await worksheet.save();

    res.json({
      success: true,
      message: 'Worksheet closed successfully!',
      data: worksheet,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Delete Worksheet
router.delete('/:id', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    if (req.user.role !== 'admin' && worksheet.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const attempts = await WorksheetAttempt.countDocuments({ worksheetId: worksheet._id });
    if (attempts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete worksheet with existing attempts',
      });
    }

    await worksheet.deleteOne();

    res.json({
      success: true,
      message: 'Worksheet deleted successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 STUDENT ROUTES (WORKSHEET ATTEMPT)
// ============================================

// ✅ Start Worksheet
router.post('/:id/start', auth, roleCheck('student'), async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    const now = new Date();
    if (worksheet.status !== 'published') {
      return res.status(400).json({ success: false, error: 'Worksheet is not published' });
    }
    if (new Date(worksheet.startDate) > now) {
      return res.status(400).json({ success: false, error: 'Worksheet has not started yet' });
    }
    if (new Date(worksheet.endDate) < now) {
      return res.status(400).json({ success: false, error: 'Worksheet has expired' });
    }

    const existingAttempt = await WorksheetAttempt.findOne({
      worksheetId: worksheet._id,
      studentId: req.user.id,
    });

    if (existingAttempt) {
      if (existingAttempt.status === 'submitted') {
        return res.status(400).json({
          success: false,
          error: 'You have already submitted this worksheet',
        });
      }
      return res.json({
        success: true,
        message: 'Worksheet already in progress',
        data: {
          attempt: existingAttempt,
          questions: worksheet.questions.map(q => ({
            question: q.question,
            options: q.options,
            marks: q.marks,
          })),
          totalMarks: worksheet.totalMarks,
          totalQuestions: worksheet.totalQuestions,
          duration: worksheet.duration,
        },
      });
    }

    const attempt = new WorksheetAttempt({
      worksheetId: worksheet._id,
      studentId: req.user.id,
      startedAt: new Date(),
      status: 'in_progress',
      totalMarks: worksheet.totalMarks,
      answers: worksheet.questions.map((q, index) => ({
        questionIndex: index,
        selectedOption: null,
        isCorrect: false,
        marksObtained: 0,
      })),
    });

    await attempt.save();

    res.status(201).json({
      success: true,
      message: 'Worksheet started!',
      data: {
        attempt,
        questions: worksheet.questions.map(q => ({
          question: q.question,
          options: q.options,
          marks: q.marks,
        })),
        totalMarks: worksheet.totalMarks,
        totalQuestions: worksheet.totalQuestions,
        duration: worksheet.duration,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Submit Worksheet
router.post('/:id/submit', auth, roleCheck('student'), async (req, res) => {
  try {
    const { answers } = req.body;
    const worksheetId = req.params.id;

    const attempt = await WorksheetAttempt.findOne({
      worksheetId,
      studentId: req.user.id,
    });

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ success: false, error: 'Already submitted' });
    }

    const worksheet = await Worksheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    let totalScore = 0;
    const updatedAnswers = worksheet.questions.map((q, index) => {
      const studentAnswer = answers.find(a => a.questionIndex === index);
      const selectedOption = studentAnswer ? studentAnswer.selectedOption : -1;
      const isCorrect = selectedOption === q.correctAnswer;
      const marksObtained = isCorrect ? q.marks : 0;
      if (isCorrect) totalScore += marksObtained;
      return {
        questionIndex: index,
        selectedOption,
        isCorrect,
        marksObtained,
      };
    });

    const percentage = worksheet.totalMarks > 0
      ? Math.round((totalScore / worksheet.totalMarks) * 100)
      : 0;

    attempt.answers = updatedAnswers;
    attempt.score = totalScore;
    attempt.percentage = percentage;
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';
    attempt.timeTaken = Math.round((new Date() - attempt.startedAt) / 1000);

    await attempt.save();

    res.json({
      success: true,
      message: 'Worksheet submitted successfully!',
      data: {
        score: attempt.score,
        totalMarks: worksheet.totalMarks,
        percentage: attempt.percentage,
        timeTaken: attempt.timeTaken,
        answers: attempt.answers,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ Get Single Attempt (Student)
router.get('/attempt/:attemptId', auth, roleCheck('student'), async (req, res) => {
  try {
    const attempt = await WorksheetAttempt.findById(req.params.attemptId)
      .populate('worksheetId', 'title subject totalMarks totalQuestions');

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    if (attempt.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this attempt',
      });
    }

    res.json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 GET SINGLE WORKSHEET (MUST BE LAST!)
// ============================================

// ✅ Get Single Worksheet (ANY authenticated user)
router.get('/:id', auth, async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id)
      .populate('classId', 'name')
      .populate('teacherId', 'name email');

    if (!worksheet) {
      return res.status(404).json({ success: false, error: 'Worksheet not found' });
    }

    res.json({ success: true, data: worksheet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;