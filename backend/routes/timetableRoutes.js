// routes/timetableRoutes.js - Complete Timetable Management
const express = require('express');
const router = express.Router();
const TimeSlot = require('../models/TimeSlot');
const TimetableTemplate = require('../models/TimetableTemplate');
const User = require('../models/User');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ============================================
// 📌 ADMIN ROUTES - Time Slot Management
// ============================================

// ✅ CREATE TIME SLOT (Admin only)
router.post('/slots', auth, roleCheck('admin'), async (req, res) => {
  try {
    const {
      day,
      startTime,
      endTime,
      periodNumber,
      subject,
      teacherId,
      classId,
      room,
      isBreak,
      breakDuration,
      semester,
      academicYear,
    } = req.body;

    // Validate teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found or not a teacher',
      });
    }

    // Validate class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
      });
    }

    // ✅ Check for teacher conflict (same teacher at same time)
    const teacherConflict = await TimeSlot.findOne({
      teacherId,
      day,
      startTime,
      semester,
      academicYear,
    });

    if (teacherConflict) {
      return res.status(400).json({
        success: false,
        error: 'Teacher already has a class at this time',
      });
    }

    // ✅ Check for room conflict
    const roomConflict = await TimeSlot.findOne({
      room,
      day,
      startTime,
      semester,
      academicYear,
    });

    if (roomConflict) {
      return res.status(400).json({
        success: false,
        error: 'Room is already occupied at this time',
      });
    }

    const timeSlot = new TimeSlot({
      day,
      startTime,
      endTime,
      periodNumber,
      subject,
      teacherId,
      classId,
      room,
      isBreak: isBreak || false,
      breakDuration: isBreak ? breakDuration : 0,
      semester,
      academicYear,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await timeSlot.save();

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully!',
      data: timeSlot,
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

// ✅ GET ALL TIME SLOTS (Admin only)
router.get('/slots', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { classId, day, semester, academicYear } = req.query;

    const filter = {};
    if (classId) filter.classId = classId;
    if (day) filter.day = day;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const timeSlots = await TimeSlot.find(filter)
      .populate('teacherId', 'name email subject')
      .populate('classId', 'name')
      .sort({ day: 1, periodNumber: 1 });

    res.json({
      success: true,
      count: timeSlots.length,
      data: timeSlots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ UPDATE TIME SLOT (Admin only)
router.put('/slots/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If teacher or time is changing, check for conflicts
    if (updates.teacherId || updates.day || updates.startTime || updates.semester || updates.academicYear) {
      const existingSlot = await TimeSlot.findById(id);
      if (!existingSlot) {
        return res.status(404).json({ success: false, error: 'Time slot not found' });
      }

      const teacherId = updates.teacherId || existingSlot.teacherId;
      const day = updates.day || existingSlot.day;
      const startTime = updates.startTime || existingSlot.startTime;
      const semester = updates.semester || existingSlot.semester;
      const academicYear = updates.academicYear || existingSlot.academicYear;

      // Check for teacher conflict (excluding this slot)
      const teacherConflict = await TimeSlot.findOne({
        teacherId,
        day,
        startTime,
        semester,
        academicYear,
        _id: { $ne: id },
      });

      if (teacherConflict) {
        return res.status(400).json({
          success: false,
          error: 'Teacher already has a class at this time',
        });
      }

      // Check for room conflict
      const room = updates.room || existingSlot.room;
      const roomConflict = await TimeSlot.findOne({
        room,
        day,
        startTime,
        semester,
        academicYear,
        _id: { $ne: id },
      });

      if (roomConflict) {
        return res.status(400).json({
          success: false,
          error: 'Room is already occupied at this time',
        });
      }
    }

    // Add manual updatedAt
    updates.updatedAt = new Date();

    const timeSlot = await TimeSlot.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!timeSlot) {
      return res.status(404).json({ success: false, error: 'Time slot not found' });
    }

    res.json({
      success: true,
      message: 'Time slot updated successfully!',
      data: timeSlot,
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

// ✅ DELETE TIME SLOT (Admin only)
router.delete('/slots/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const timeSlot = await TimeSlot.findByIdAndDelete(id);

    if (!timeSlot) {
      return res.status(404).json({ success: false, error: 'Time slot not found' });
    }

    res.json({
      success: true,
      message: 'Time slot deleted successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 ADMIN ROUTES - Timetable Template Management
// ============================================

// ✅ CREATE TIMETABLE TEMPLATE (Admin only)
router.post('/templates', auth, roleCheck('admin'), async (req, res) => {
  try {
    const {
      classId,
      name,
      semester,
      academicYear,
      timeSlotIds,
    } = req.body;

    // Validate class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
      });
    }

    // Check if timetable already exists for this class
    const existingTemplate = await TimetableTemplate.findOne({
      classId,
      semester,
      academicYear,
      isActive: true,
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        error: 'A timetable already exists for this class and semester',
      });
    }

    // Verify all time slots exist and belong to the same class
    if (timeSlotIds && timeSlotIds.length > 0) {
      const slots = await TimeSlot.find({ _id: { $in: timeSlotIds } });
      if (slots.length !== timeSlotIds.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more time slots not found',
        });
      }

      for (const slot of slots) {
        if (slot.classId.toString() !== classId) {
          return res.status(400).json({
            success: false,
            error: `Time slot "${slot.subject}" does not belong to this class`,
          });
        }
      }
    }

    const template = new TimetableTemplate({
      classId,
      name,
      semester,
      academicYear,
      timeSlots: timeSlotIds || [],
      createdBy: req.user.id,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: 'Timetable template created successfully!',
      data: template,
    });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A timetable already exists for this class and semester',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, errors });
    }

    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET ALL TIMETABLE TEMPLATES (Admin only)
router.get('/templates', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { classId, semester, academicYear, isPublished } = req.query;

    const filter = {};
    if (classId) filter.classId = classId;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    const templates = await TimetableTemplate.find(filter)
      .populate('classId', 'name')
      .populate('timeSlots')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ GET SINGLE TIMETABLE TEMPLATE
router.get('/templates/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await TimetableTemplate.findById(id)
      .populate('classId', 'name')
      .populate({
        path: 'timeSlots',
        populate: {
          path: 'teacherId',
          select: 'name email subject',
        },
      })
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ PUBLISH TIMETABLE (Admin only)
router.put('/templates/:id/publish', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const template = await TimetableTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }

    // Check if there are time slots
    if (template.timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot publish an empty timetable',
      });
    }

    template.isPublished = true;
    template.updatedAt = new Date();
    await template.save();

    res.json({
      success: true,
      message: 'Timetable published successfully!',
      data: template,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ ADD TIME SLOTS TO TEMPLATE (Admin only)
router.put('/templates/:id/slots', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { timeSlotIds } = req.body;

    const template = await TimetableTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }

    // Verify all time slots exist and belong to the same class
    const slots = await TimeSlot.find({ _id: { $in: timeSlotIds } });
    if (slots.length !== timeSlotIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more time slots not found',
      });
    }

    for (const slot of slots) {
      if (slot.classId.toString() !== template.classId.toString()) {
        return res.status(400).json({
          success: false,
          error: `Time slot "${slot.subject}" does not belong to this class`,
        });
      }
    }

    // Add new slots (avoid duplicates)
    const existingIds = template.timeSlots.map(id => id.toString());
    const newSlots = timeSlotIds.filter(id => !existingIds.includes(id));
    template.timeSlots = [...template.timeSlots, ...newSlots];
    template.updatedAt = new Date();
    await template.save();

    res.json({
      success: true,
      message: `Added ${newSlots.length} time slot(s) to timetable`,
      data: template,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ✅ DELETE TIMETABLE TEMPLATE (Admin only)
router.delete('/templates/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const template = await TimetableTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }

    res.json({
      success: true,
      message: 'Timetable deleted successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 TEACHER ROUTES
// ============================================

// ✅ GET TEACHER'S SCHEDULE
router.get('/my-schedule', auth, roleCheck('teacher'), async (req, res) => {
  try {
    const { day, semester, academicYear } = req.query;

    const filter = {
      teacherId: req.user.id,
      isBreak: false,
    };
    if (day) filter.day = day;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const slots = await TimeSlot.find(filter)
      .populate('classId', 'name')
      .populate('teacherId', 'name email subject')
      .sort({ day: 1, periodNumber: 1 });

    // Group by day
    const grouped = {};
    slots.forEach(slot => {
      if (!grouped[slot.day]) {
        grouped[slot.day] = [];
      }
      grouped[slot.day].push(slot);
    });

    res.json({
      success: true,
      count: slots.length,
      data: grouped,
      raw: slots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 STUDENT ROUTES
// ============================================

// ✅ GET STUDENT'S TIMETABLE
router.get('/my-timetable', auth, roleCheck('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || !student.class) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or not assigned to a class',
      });
    }

    const { day, semester, academicYear } = req.query;

    // Find the class that matches the student's class name
    const classData = await Class.findOne({ name: student.class });
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found for this student',
      });
    }

    const filter = {
      classId: classData._id,
    };
    if (day) filter.day = day;
    if (semester) filter.semester = semester || 'Semester 1';
    if (academicYear) filter.academicYear = academicYear || '2024/25';

    const slots = await TimeSlot.find(filter)
      .populate('teacherId', 'name email subject')
      .populate('classId', 'name')
      .sort({ day: 1, periodNumber: 1 });

    // Group by day
    const grouped = {};
    slots.forEach(slot => {
      if (!grouped[slot.day]) {
        grouped[slot.day] = [];
      }
      grouped[slot.day].push(slot);
    });

    res.json({
      success: true,
      student: {
        name: student.name,
        class: student.class,
      },
      count: slots.length,
      data: grouped,
      raw: slots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ============================================
// 📌 PARENT ROUTES
// ============================================

// ✅ GET CHILD'S TIMETABLE (Parent)
router.get('/child/:childId/timetable', auth, roleCheck('parent'), async (req, res) => {
  try {
    const { childId } = req.params;
    const { day, semester, academicYear } = req.query;

    // Verify this child belongs to this parent
    const parent = await User.findById(req.user.id);
    if (!parent.children.includes(childId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this student\'s timetable',
      });
    }

    // Get student
    const student = await User.findById(childId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    // Find the class that matches the student's class name
    const classData = await Class.findOne({ name: student.class });
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found for this student',
      });
    }

    const filter = {
      classId: classData._id,
    };
    if (day) filter.day = day;
    if (semester) filter.semester = semester || 'Semester 1';
    if (academicYear) filter.academicYear = academicYear || '2024/25';

    const slots = await TimeSlot.find(filter)
      .populate('teacherId', 'name email subject')
      .populate('classId', 'name')
      .sort({ day: 1, periodNumber: 1 });

    // Group by day
    const grouped = {};
    slots.forEach(slot => {
      if (!grouped[slot.day]) {
        grouped[slot.day] = [];
      }
      grouped[slot.day].push(slot);
    });

    res.json({
      success: true,
      student: {
        name: student.name,
        class: student.class,
      },
      count: slots.length,
      data: grouped,
      raw: slots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;