const mongoose = require('mongoose');

const studentMarkSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  marksObtained: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 50 },
  isAbsent: { type: Boolean, default: false },
  remarks: { type: String, default: '' },
});

const ciaSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    assessmentType: {
      type: String,
      enum: ['CIA-1', 'CIA-2', 'MODEL'],
      required: true,
    },
    maxMarks: { type: Number, default: 50 },
    academicYear: { type: String, default: '2024-2025' },
    conductedDate: { type: Date },
    isPublished: { type: Boolean, default: false },
    studentMarks: [studentMarkSchema],
    classAverage: { type: Number, default: 0 },
    highestMark: { type: Number, default: 0 },
    lowestMark: { type: Number, default: 0 },
    passCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Unique: one CIA type per subject per class
ciaSchema.index(
  { subject: 1, department: 1, semester: 1, section: 1, assessmentType: 1 },
  { unique: true }
);

// Auto-calculate stats before save
ciaSchema.pre('save', function (next) {
  const marks = this.studentMarks.filter(m => !m.isAbsent).map(m => m.marksObtained);
  if (marks.length > 0) {
    this.classAverage = Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10;
    this.highestMark = Math.max(...marks);
    this.lowestMark = Math.min(...marks);
    this.passCount = marks.filter(m => m >= this.maxMarks * 0.4).length;
  }
  next();
});

module.exports = mongoose.model('CIA', ciaSchema);
