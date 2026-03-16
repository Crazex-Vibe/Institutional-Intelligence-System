const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
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
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'staff', 'management'],
      required: [true, 'Role is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Student-specific fields
    studentProfile: {
      rollNumber: String,
      umisId: String,
      emisId: String,
      department: String,
      semester: Number,
      section: String,
      batch: String,
      parentEmail: String,
      parentPhone: String,
      cgpa: { type: Number, default: 0 },
      feeStatus: {
        type: String,
        enum: ['paid', 'pending', 'partial'],
        default: 'pending',
      },
      scholarshipStatus: {
        type: String,
        enum: ['none', 'applied', 'approved'],
        default: 'none',
      },
    },

    // Staff-specific fields
    staffProfile: {
      staffId: String,
      department: String,
      designation: String,
      subjects: [String],
    },

    // Management-specific fields
    managementProfile: {
      employeeId: String,
      designation: String,
      department: String,
    },

    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
