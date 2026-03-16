const mongoose = require('mongoose');

// Subject result per semester
const subjectResultSchema = new mongoose.Schema({
  code: String,
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  grade: { type: String, enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'RA', 'W', 'I', '--'], default: '--' },
  gradePoint: { type: Number, default: 0 }, // 0-10
  type: { type: String, enum: ['theory', 'practical', 'project'], default: 'theory' },
  isArrear: { type: Boolean, default: false },
});

// Anna University grade to grade point map
// O=10, A+=9, A=8, B+=7, B=6, C=5, U=0(fail), RA=0(reappear)
const semesterSchema = new mongoose.Schema({
  semesterNumber: { type: Number, required: true },
  academicYear: String, // e.g. "2022-2023"
  subjects: [subjectResultSchema],
  sgpa: { type: Number, default: 0 },
  totalCredits: { type: Number, default: 0 },
  earnedCredits: { type: Number, default: 0 },
  isResultPublished: { type: Boolean, default: false },
});

// Fee record per semester
const feeSchema = new mongoose.Schema({
  semesterNumber: Number,
  academicYear: String,
  tuitionFee: { type: Number, default: 0 },
  hostelFee: { type: Number, default: 0 },
  otherFee: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['paid', 'pending', 'partial', 'waived'], default: 'pending' },
  paidDate: Date,
  receiptNumber: String,
});

// Achievement / Certificate
const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['academic', 'sports', 'cultural', 'technical', 'placement', 'other'],
    default: 'other',
  },
  description: String,
  date: Date,
  issuedBy: String,
  certificateUrl: String,
  level: { type: String, enum: ['college', 'university', 'state', 'national', 'international'], default: 'college' },
});

// Exam timetable entry
const examSchema = new mongoose.Schema({
  subjectCode: String,
  subjectName: { type: String, required: true },
  examDate: Date,
  session: { type: String, enum: ['FN', 'AN'], default: 'FN' }, // Forenoon / Afternoon
  startTime: String,
  endTime: String,
  venue: String,
  semesterNumber: Number,
});

const academicProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    semesters: [semesterSchema],
    fees: [feeSchema],
    achievements: [achievementSchema],
    examTimetable: [examSchema],
    cgpa: { type: Number, default: 0 },
    totalCreditsEarned: { type: Number, default: 0 },
    totalArrears: { type: Number, default: 0 },
    scholarship: {
      status: { type: String, enum: ['none', 'applied', 'approved', 'rejected'], default: 'none' },
      scholarshipType: { type: String },
      amount: { type: Number },
      academicYear: { type: String },
    },
  },
  { timestamps: true }
);

// Auto-calculate CGPA before save
academicProfileSchema.pre('save', function (next) {
  const publishedSems = this.semesters.filter(s => s.isResultPublished && s.sgpa > 0);
  if (publishedSems.length > 0) {
    const totalWeighted = publishedSems.reduce((sum, s) => sum + s.sgpa * s.totalCredits, 0);
    const totalCredits = publishedSems.reduce((sum, s) => sum + s.totalCredits, 0);
    this.cgpa = totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : 0;
    this.totalCreditsEarned = publishedSems.reduce((sum, s) => sum + s.earnedCredits, 0);
  }
  next();
});

module.exports = mongoose.model('AcademicProfile', academicProfileSchema);
