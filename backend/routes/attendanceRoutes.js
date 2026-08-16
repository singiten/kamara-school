// routes/attendanceRoutes.js - Complete Attendance Routes
const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const AttendanceSummary = require('../models/AttendanceSummary');
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 TEACHER ROUTES
// ============================================

// ✅ MARK ATTENDANCE (Teacher/Admin)
router.post('/', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { classId, date, records, semester, academicYear } = req.body;

    // Validate class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    // Verify teacher is assigned to this class
    if (req.user.role === 'teacher') {
      const teacherIds = classData.teacherIds.map(id => id.toString());
      if (!teacherIds.includes(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'You are not assigned to this class',
        });
      }
    }

    // Validate all students exist
    for (const record of records) {
      const student = await User.findById(record.studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({
          success: false,
          error: `Student ${record.studentId} not found`,
        });
      }
    }

    const attendanceDate = new Date(date || Date.now());
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    let existingAttendance = await Attendance.findOne({
      classId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      // Merge records instead of replacing
      const existingRecordIds = existingAttendance.records.map(r => r.studentId.toString());
      
      for (const record of records) {
        const studentIdStr = record.studentId.toString();
        if (!existingRecordIds.includes(studentIdStr)) {
          existingAttendance.records.push({
            studentId: record.studentId,
            status: record.status,
            markedAt: new Date(),
            remarks: record.remarks || '',
          });
        } else {
          const index = existingAttendance.records.findIndex(
            r => r.studentId.toString() === studentIdStr
          );
          if (index !== -1) {
            existingAttendance.records[index].status = record.status;
            existingAttendance.records[index].markedAt = new Date();
            if (record.remarks) {
              existingAttendance.records[index].remarks = record.remarks;
            }
          }
        }
      }
      
      existingAttendance.updatedAt = new Date();
      await existingAttendance.save();

      return res.json({
        success: true,
        message: 'Attendance updated successfully!',
        data: existingAttendance,
      });
    }

    // Create new attendance
    const attendance = new Attendance({
      classId,
      date: attendanceDate,
      semester,
      academicYear,
      records: records.map(r => ({
        studentId: r.studentId,
        status: r.status,
        markedAt: new Date(),
        remarks: r.remarks || '',
      })),
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully!',
      data: attendance,
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

// ✅ GET ATTENDANCE FOR A CLASS (Teacher/Admin)
router.get('/class/:classId', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, semester, academicYear } = req.query;

    const filter = { classId };
    if (date) filter.date = new Date(date);
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const attendance = await Attendance.find(filter)
      .populate('records.studentId', 'name email class')
      .populate('classId', 'name')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET TODAY'S ATTENDANCE FOR A CLASS (Teacher)
router.get('/class/:classId/today', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { classId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      classId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).populate('records.studentId', 'name email');

    const classData = await Class.findById(classId).populate('students', 'name email');

    if (!attendance) {
      return res.json({
        success: true,
        message: 'No attendance marked for today',
        data: {
          class: classData,
          students: classData.students,
          attendance: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        class: classData,
        attendance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET STUDENT'S ATTENDANCE (Student)
router.get('/my-attendance', auth, roleCheck('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { semester, academicYear } = req.query;

    const filter = {
      'records.studentId': studentId,
    };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const attendance = await Attendance.find(filter)
      .populate('classId', 'name')
      .sort({ date: -1 });

    const formattedAttendance = attendance.map(record => {
      const studentRecord = record.records.find(
        r => r.studentId.toString() === studentId
      );
      return {
        date: record.date,
        class: record.classId,
        status: studentRecord ? studentRecord.status : 'Not marked',
        remarks: studentRecord ? studentRecord.remarks : '',
        markedAt: studentRecord ? studentRecord.markedAt : null,
      };
    });

    const total = formattedAttendance.length;
    const present = formattedAttendance.filter(r => r.status === 'present').length;
    const absent = formattedAttendance.filter(r => r.status === 'absent').length;
    const late = formattedAttendance.filter(r => r.status === 'late').length;
    const excused = formattedAttendance.filter(r => r.status === 'excused').length;

    res.json({
      success: true,
      data: {
        summary: {
          total,
          present,
          absent,
          late,
          excused,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
        },
        records: formattedAttendance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET CHILD'S ATTENDANCE (Parent)
router.get('/child/:childId/attendance', auth, roleCheck('parent'), async (req, res) => {
  try {
    const { childId } = req.params;
    const { semester, academicYear } = req.query;

    const parent = await User.findById(req.user.id);
    if (!parent.children.includes(childId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this student\'s attendance',
      });
    }

    const filter = {
      'records.studentId': childId,
    };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const attendance = await Attendance.find(filter)
      .populate('classId', 'name')
      .sort({ date: -1 });

    const formattedAttendance = attendance.map(record => {
      const studentRecord = record.records.find(
        r => r.studentId.toString() === childId
      );
      return {
        date: record.date,
        class: record.classId,
        status: studentRecord ? studentRecord.status : 'Not marked',
        remarks: studentRecord ? studentRecord.remarks : '',
        markedAt: studentRecord ? studentRecord.markedAt : null,
      };
    });

    const total = formattedAttendance.length;
    const present = formattedAttendance.filter(r => r.status === 'present').length;
    const absent = formattedAttendance.filter(r => r.status === 'absent').length;
    const late = formattedAttendance.filter(r => r.status === 'late').length;
    const excused = formattedAttendance.filter(r => r.status === 'excused').length;

    const child = await User.findById(childId);

    res.json({
      success: true,
      data: {
        student: {
          name: child.name,
          class: child.class,
        },
        summary: {
          total,
          present,
          absent,
          late,
          excused,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
        },
        records: formattedAttendance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 ADMIN ROUTES
// ============================================

// ✅ GET ATTENDANCE REPORTS (Admin)
router.get('/reports', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { classId, semester, academicYear, startDate, endDate } = req.query;

    const filter = {};
    if (classId) filter.classId = classId;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('classId', 'name')
      .populate('records.studentId', 'name email class')
      .sort({ date: -1 });

    const stats = {
      totalClasses: attendance.length,
      totalStudents: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    attendance.forEach(record => {
      record.records.forEach(r => {
        stats.totalStudents++;
        if (r.status === 'present') stats.present++;
        else if (r.status === 'absent') stats.absent++;
        else if (r.status === 'late') stats.late++;
        else if (r.status === 'excused') stats.excused++;
      });
    });

    res.json({
      success: true,
      data: {
        summary: stats,
        records: attendance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 ATTENDANCE SUMMARY ROUTES
// ============================================

// ✅ GET STUDENT'S ATTENDANCE SUMMARY (Student)
router.get('/my-summary', auth, roleCheck('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { period, academicYear } = req.query;

    const filter = { studentId };
    if (period) filter.period = period;
    if (academicYear) filter.academicYear = academicYear;

    const summaries = await AttendanceSummary.find(filter)
      .sort({ periodStart: -1 });

    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0, totalDays = 0;
    summaries.forEach(s => {
      totalPresent += s.summary.present;
      totalAbsent += s.summary.absent;
      totalLate += s.summary.late;
      totalExcused += s.summary.excused;
      totalDays += s.summary.total;
    });

    const overallRate = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        overall: {
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate,
          excused: totalExcused,
          totalDays,
          attendanceRate: overallRate,
        },
        breakdown: summaries,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET CHILD'S ATTENDANCE SUMMARY (Parent)
router.get('/child/:childId/summary', auth, roleCheck('parent'), async (req, res) => {
  try {
    const { childId } = req.params;
    const { period, academicYear } = req.query;

    const parent = await User.findById(req.user.id);
    if (!parent.children.includes(childId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this student\'s attendance',
      });
    }

    const filter = { studentId: childId };
    if (period) filter.period = period;
    if (academicYear) filter.academicYear = academicYear;

    const summaries = await AttendanceSummary.find(filter)
      .sort({ periodStart: -1 });

    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0, totalDays = 0;
    summaries.forEach(s => {
      totalPresent += s.summary.present;
      totalAbsent += s.summary.absent;
      totalLate += s.summary.late;
      totalExcused += s.summary.excused;
      totalDays += s.summary.total;
    });

    const overallRate = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

    const child = await User.findById(childId);

    res.json({
      success: true,
      data: {
        student: {
          name: child.name,
          class: child.class,
        },
        overall: {
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate,
          excused: totalExcused,
          totalDays,
          attendanceRate: overallRate,
        },
        breakdown: summaries,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET CLASS ATTENDANCE SUMMARY (Teacher/Admin)
router.get('/class/:classId/summary', auth, roleCheck('teacher', 'admin'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { period, academicYear } = req.query;

    const filter = { classId };
    if (period) filter.period = period;
    if (academicYear) filter.academicYear = academicYear;

    const summaries = await AttendanceSummary.find(filter)
      .populate('studentId', 'name email')
      .sort({ periodStart: -1 });

    // Group by student - using plain JavaScript object (NO TypeScript)
    const studentSummaries = {};
    summaries.forEach(s => {
      const key = s.studentId._id.toString();
      if (!studentSummaries[key]) {
        studentSummaries[key] = {
          student: s.studentId,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        };
      }
      studentSummaries[key].present += s.summary.present;
      studentSummaries[key].absent += s.summary.absent;
      studentSummaries[key].late += s.summary.late;
      studentSummaries[key].excused += s.summary.excused;
      studentSummaries[key].total += s.summary.total;
    });

    // Calculate attendance rate for each student
    const result = Object.values(studentSummaries).map(s => ({
      ...s,
      attendanceRate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ TRIGGER WEEKLY SUMMARY GENERATION (Admin only)
// ✅ TRIGGER WEEKLY SUMMARY GENERATION (Admin only - Manual)
router.post('/generate-summaries', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide startDate and endDate',
      });
    }

    const { generateWeeklySummaries } = require('../services/attendanceSummaryService');
    const summaries = await generateWeeklySummaries(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      message: `Generated ${summaries?.length || 0} weekly summaries`,
      data: summaries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;