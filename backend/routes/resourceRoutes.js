// routes/resourceRoutes.js - COMPLETE WITH TEACHER CLASS FILTERING

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { uploadResource, getFileType } = require('../services/fileUpload');
const path = require('path');
const fs = require('fs');

// ============================================
// 📌 TEACHER: UPLOAD RESOURCE
// ============================================

router.post(
  '/upload',
  auth,
  roleCheck('admin', 'teacher'),
  uploadResource.single('file'),
  async (req, res) => {
    try {
      const {
        title,
        description,
        subject,
        topic,
        classLevel,
        grade,
        sections,
        assignedClasses,
        semester,
        academicYear,
      } = req.body;

      console.log('📥 Uploading resource:', req.body);
      console.log('📎 File:', req.file);

      // ✅ Validate required fields
      if (!title || !subject || !classLevel || !semester || !academicYear) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Title, subject, class level, semester, and academic year are required',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File is required',
        });
      }

      // ✅ Parse assigned classes
      let classIds = [];
      if (assignedClasses) {
        try {
          classIds = JSON.parse(assignedClasses);
        } catch {
          classIds = assignedClasses.split(',').filter(Boolean);
        }
      }

      // ✅ Validate that assigned classes exist and teacher is assigned to them
      if (classIds.length > 0) {
        const validClasses = await Class.find({ 
          _id: { $in: classIds },
          teacherIds: req.user.id // ✅ Only classes where this teacher is assigned
        });
        
        if (validClasses.length !== classIds.length) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) console.error('Error deleting file:', err);
            });
          }
          return res.status(403).json({
            success: false,
            error: 'You are not assigned to one or more of these classes',
          });
        }
      }

      // ✅ Parse sections
      let sectionsArray = [];
      if (sections) {
        try {
          sectionsArray = JSON.parse(sections);
        } catch {
          sectionsArray = sections.split(',').filter(Boolean);
        }
      }

      // ✅ Create resource
      const resource = new Resource({
        title,
        description: description || '',
        fileUrl: `/uploads/resources/${path.relative(
          path.join(__dirname, '../uploads/resources'),
          req.file.path
        ).replace(/\\/g, '/')}`,
        fileName: req.file.originalname,
        fileType: getFileType(req.file.mimetype),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        subject,
        topic: topic || '',
        classLevel,
        grade: grade || '',
        sections: sectionsArray,
        assignedClasses: classIds,
        semester,
        academicYear,
        uploadedBy: req.user.id,
        isActive: true,
      });

      await resource.save();
      console.log('✅ Resource uploaded:', resource._id);

      res.status(201).json({
        success: true,
        message: 'Resource uploaded successfully!',
        data: resource,
      });
    } catch (error) {
      console.error('❌ Error uploading resource:', error);
      
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
// 📌 GET RESOURCES (Role-based filtering)
// ============================================

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { classLevel, subject, semester, academicYear, search } = req.query;
    
    const filter = { isActive: true };

    console.log('👤 User role:', user.role);

    // ✅ Role-based filtering
    if (user.role === 'teacher') {
      // ✅ Teacher sees ONLY their own uploads
      filter.uploadedBy = req.user.id;
      console.log('📚 Teacher filter: uploadedBy', req.user.id);
    } 
    else if (user.role === 'student') {
      // ✅ Student sees resources assigned to their specific class
      const student = await User.findById(req.user.id).populate('class');
      console.log('🎓 Student class:', student.class);
      
      if (student.class && student.class._id) {
        filter.assignedClasses = student.class._id;
      } else if (student.classLevel) {
        filter.classLevel = student.classLevel;
      } else {
        return res.json({
          success: true,
          count: 0,
          data: [],
        });
      }
    } 
    else if (user.role === 'parent') {
      // ✅ Parent sees resources for their children's classes
      const children = await User.find({ _id: { $in: user.children } }).populate('class');
      const childClassIds = children
        .map(c => c.class?._id)
        .filter(Boolean)
        .map(id => id.toString());
      
      console.log('👨‍👧 Parent children classes:', childClassIds);
      
      if (childClassIds.length > 0) {
        filter.assignedClasses = { $in: childClassIds };
      } else {
        const childClassLevels = children.map(c => c.classLevel).filter(Boolean);
        if (childClassLevels.length > 0) {
          filter.classLevel = { $in: childClassLevels };
        } else {
          return res.json({
            success: true,
            count: 0,
            data: [],
          });
        }
      }
    }
    else if (user.role === 'admin') {
      // ✅ Admin sees all resources
      console.log('👑 Admin viewing all resources');
    }

    // ✅ Additional filters
    if (classLevel) filter.classLevel = classLevel;
    if (subject) filter.subject = subject;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    console.log('🔍 Final filter:', JSON.stringify(filter, null, 2));

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name email')
      .populate('assignedClasses', 'name grade section')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${resources.length} resources`);

    // ✅ Increment view count (async)
    if (resources.length > 0) {
      Resource.updateMany(
        { _id: { $in: resources.map(r => r._id) } },
        { $inc: { viewCount: 1 } }
      ).catch(err => console.error('Error updating view count:', err));
    }

    res.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    console.error('❌ Error fetching resources:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 GET TEACHER'S ASSIGNED CLASSES
// ============================================

router.get('/teacher/classes', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // ✅ Find all classes where this teacher is assigned
    const classes = await Class.find({
      teacherIds: teacherId
    }).populate('teacherIds', 'name email');
    
    console.log(`📚 Found ${classes.length} classes for teacher ${teacherId}`);
    
    res.json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error('❌ Error fetching teacher classes:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 GET SINGLE RESOURCE
// ============================================

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource ID',
      });
    }

    const resource = await Resource.findById(id)
      .populate('uploadedBy', 'name email')
      .populate('assignedClasses', 'name grade section');

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    // ✅ Check if user has access
    const user = await User.findById(req.user.id);
    const hasAccess = await checkResourceAccess(user, resource);
    if (!hasAccess && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this resource',
      });
    }

    // ✅ Increment view count
    resource.viewCount += 1;
    await resource.save();

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('❌ Error fetching resource:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 DOWNLOAD RESOURCE
// ============================================

router.get('/:id/download', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource ID',
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    // ✅ Check if user has access
    const user = await User.findById(req.user.id);
    const hasAccess = await checkResourceAccess(user, resource);
    if (!hasAccess && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this resource',
      });
    }

    // ✅ Increment download count
    resource.downloadCount += 1;
    await resource.save();

    // ✅ Get file path
    const filePath = path.join(__dirname, '..', resource.fileUrl);
    
    // ✅ Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server',
      });
    }

    // ✅ Download file
    res.download(filePath, resource.fileName);
  } catch (error) {
    console.error('❌ Error downloading resource:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 UPDATE RESOURCE
// ============================================

router.put('/:id', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource ID',
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    // ✅ Check authorization
    if (resource.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to update this resource',
      });
    }

    // ✅ Parse assigned classes if provided
    if (updates.assignedClasses) {
      try {
        updates.assignedClasses = JSON.parse(updates.assignedClasses);
      } catch {
        updates.assignedClasses = updates.assignedClasses.split(',').filter(Boolean);
      }
    }

    // ✅ Update fields
    const allowedUpdates = ['title', 'description', 'subject', 'topic', 'classLevel', 'grade', 'sections', 'assignedClasses', 'semester', 'academicYear', 'isActive'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        resource[field] = updates[field];
      }
    });
    resource.updatedAt = new Date();

    await resource.save();

    res.json({
      success: true,
      message: 'Resource updated successfully!',
      data: resource,
    });
  } catch (error) {
    console.error('❌ Error updating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 DELETE RESOURCE
// ============================================

router.delete('/:id', auth, roleCheck('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource ID',
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    // ✅ Check authorization
    if (resource.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this resource',
      });
    }

    // ✅ Delete file from server
    const filePath = path.join(__dirname, '..', resource.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    await resource.deleteOne();

    res.json({
      success: true,
      message: 'Resource deleted successfully!',
    });
  } catch (error) {
    console.error('❌ Error deleting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 GET RECENT RESOURCES (Dashboard)
// ============================================

router.get('/recent', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { limit = 5 } = req.query;

    const filter = { isActive: true };

    // ✅ Role-based filtering for recent resources
    if (user.role === 'teacher') {
      filter.uploadedBy = req.user.id;
    } else if (user.role === 'student') {
      const student = await User.findById(req.user.id).populate('class');
      if (student.class && student.class._id) {
        filter.assignedClasses = student.class._id;
      } else if (student.classLevel) {
        filter.classLevel = student.classLevel;
      } else {
        return res.json({
          success: true,
          data: [],
        });
      }
    } else if (user.role === 'parent') {
      const children = await User.find({ _id: { $in: user.children } }).populate('class');
      const childClassIds = children
        .map(c => c.class?._id)
        .filter(Boolean)
        .map(id => id.toString());
      
      if (childClassIds.length > 0) {
        filter.assignedClasses = { $in: childClassIds };
      } else {
        const childClassLevels = children.map(c => c.classLevel).filter(Boolean);
        if (childClassLevels.length > 0) {
          filter.classLevel = { $in: childClassLevels };
        } else {
          return res.json({
            success: true,
            data: [],
          });
        }
      }
    }

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    console.error('❌ Error fetching recent resources:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message,
    });
  }
});

// ============================================
// 📌 HELPER: Check Resource Access
// ============================================

async function checkResourceAccess(user, resource) {
  // Admin always has access
  if (user.role === 'admin') return true;

  // Teacher who uploaded has access
  if (user.role === 'teacher' && resource.uploadedBy.toString() === user._id.toString()) {
    return true;
  }

  // Student: check if their class is in assignedClasses
  if (user.role === 'student') {
    const student = await User.findById(user._id).populate('class');
    if (student.class && student.class._id) {
      const classId = student.class._id.toString();
      const assignedIds = resource.assignedClasses.map(id => id.toString());
      if (assignedIds.includes(classId)) {
        return true;
      }
    }
    // If assignedClasses is empty, check classLevel
    if (resource.assignedClasses.length === 0) {
      return resource.classLevel === student.classLevel;
    }
  }

  // Parent: check if any child's class is in assignedClasses
  if (user.role === 'parent') {
    const children = await User.find({ _id: { $in: user.children } }).populate('class');
    const childClassIds = children
      .map(c => c.class?._id)
      .filter(Boolean)
      .map(id => id.toString());
    
    const assignedIds = resource.assignedClasses.map(id => id.toString());
    if (childClassIds.some(id => assignedIds.includes(id))) {
      return true;
    }
    
    // Check classLevel fallback
    const childClassLevels = children.map(c => c.classLevel).filter(Boolean);
    if (childClassLevels.includes(resource.classLevel)) {
      return true;
    }
  }

  return false;
}

module.exports = router;