
const mongoose = require('mongoose');

// ✅ Helper function to determine class level from grade
const getClassLevel = (grade) => {
  const gradeNum = parseInt(grade);
  if (gradeNum >= 1 && gradeNum <= 4) return 'primary';
  if (gradeNum >= 5 && gradeNum <= 8) return 'middle';
  if (gradeNum >= 9 && gradeNum <= 12) return 'secondary';
  return 'secondary'; // fallback
};

// ✅ Valid grade values
const VALID_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    unique: true,
    trim: true,
    set: function(value) {
      // Auto-generate name from grade + section if not provided
      if (!value && this.grade && this.section) {
        return `Grade ${this.grade}${this.section}`;
      }
      return value;
    }
  },
  
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return VALID_GRADES.includes(v);
      },
      message: props => `Grade must be between 1 and 12. Received: ${props.value}`
    }
  },
  
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-H]$/.test(v);
      },
      message: props => `Section must be a single letter A-H. Received: ${props.value}`
    }
  },
  
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{4}\/\d{2}$/.test(v);
      },
      message: props => `Academic year must be in format YYYY/YY (e.g., 2024/25). Received: ${props.value}`
    }
  },
  
  teacherIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  subjects: [{
    type: String,
    trim: true,
  }],
  
  classLevel: {
    type: String,
    enum: ['primary', 'middle', 'secondary'],
    required: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('Class', ClassSchema);