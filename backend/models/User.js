// models/User.js - COMPLETE UPDATE with classLevel

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // CORE FIELDS
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['admin', 'registrar', 'finance_officer', 'teacher', 'student', 'parent'],
    required: true,
    default: 'student',
  },
  // models/User.js - Phone field with Ethiopian number validation

phone: {
    type: String,
    trim: true,
    validate: {
        validator: function(v) {
            return /^(09|07)\d{8}$/.test(v);
        },
        message: props => `${props.value} is not a valid Ethiopian phone number. Must start with 09 or 07 and be 10 digits total.`
    },
    required: function() {
      
        return false;
    }
},
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },

  // STUDENT-SPECIFIC FIELDS
  class: {
    type: String,
    required: function () {
      return this.role === 'student';
    },
    trim: true,
  },
  
  
  classLevel: {
    type: String,
    enum: ['primary', 'middle', 'secondary'],
    required: function () {
      return this.role === 'student';
    },
  },
  
  age: {
    type: Number,
    min: 0,
    max: 120,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(value) {
        if (!value) return true;
        const parent = await mongoose.model('User').findById(value);
        return parent && parent.role === 'parent';
      },
      message: 'Parent must exist and have role "parent"',
    },
  },

  // TEACHER-SPECIFIC FIELDS
  subject: {
    type: String,
    required: function () {
      return this.role === 'teacher';
    },
    trim: true,
  },
  hireDate: {
    type: Date,
    default: function () {
      return this.role === 'teacher' ? Date.now() : null;
    },
  },
  assignedClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    }],
  // PARENT-SPECIFIC FIELDS
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  resetRequestedAt: {
    type: Date,
    default: null
  },
  resetRequestedBy: {
    type: String,
    default: null
  },
  // models/User.js - Add this field if not already present

mustChangePassword: {
    type: Boolean,
    default: false,
},
  // COMMON FIELDS
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Remove role-specific fields before sending response
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;

  switch (user.role) {
    case 'student':
      delete user.children;
      delete user.hireDate;
      delete user.subject;
      delete user.phone;
      break;
    case 'teacher':
      delete user.children;
      delete user.class;
      delete user.age;
      delete user.parentId;
      break;
    case 'parent':
      delete user.class;
      delete user.age;
      delete user.parentId;
      delete user.subject;
      delete user.hireDate;
      break;
    case 'finance_officer':
      delete user.class;
      delete user.age;
      delete user.parentId;
      delete user.subject;
      delete user.hireDate;
      delete user.children;
      break;
    case 'registrar':
      delete user.class;
      delete user.age;
      delete user.parentId;
      delete user.subject;
      delete user.hireDate;
      delete user.children;
      break;
    case 'admin':
      delete user.class;
      delete user.age;
      delete user.parentId;
      delete user.subject;
      delete user.hireDate;
      delete user.children;
      break;
    default:
      break;
  }

  return user;
};

module.exports = mongoose.model('User', UserSchema);