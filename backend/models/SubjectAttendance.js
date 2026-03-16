const mongoose = require('mongoose');

const subjectAttendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    academicYear: { type: String, required: true }, // e.g. "2024-25"

    totalClasses: { type: Number, default: 0 },
    attendedClasses: { type: Number, default: 0 },
    absentClasses: { type: Number, default: 0 },
    odClasses: { type: Number, default: 0 },

    // Auto-calculated
    attendancePercentage: { type: Number, default: 0 },
    isLowAttendance: { type: Boolean, default: false }, // below 75%

    // How many more classes needed to reach 75%
    classesNeededFor75: { type: Number, default: 0 },
    // How many classes can still be missed
    permissibleLeaves: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate percentage before saving
subjectAttendanceSchema.pre('save', function (next) {
  if (this.totalClasses > 0) {
    this.attendancePercentage = Math.round((this.attendedClasses / this.totalClasses) * 100);
    this.isLowAttendance = this.attendancePercentage < 75;

    // Classes needed to reach 75%: solve (attended + x) / (total + x) >= 0.75
    if (this.attendancePercentage < 75) {
      const x = Math.ceil((0.75 * this.totalClasses - this.attendedClasses) / 0.25);
      this.classesNeededFor75 = Math.max(0, x);
    } else {
      this.classesNeededFor75 = 0;
    }

    // Permissible leaves: solve (attended) / (total + x) >= 0.75
    if (this.attendancePercentage >= 75) {
      const x = Math.floor((this.attendedClasses - 0.75 * this.totalClasses) / 0.75);
      this.permissibleLeaves = Math.max(0, x);
    } else {
      this.permissibleLeaves = 0;
    }
  }
  next();
});

subjectAttendanceSchema.index({ student: 1, subject: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('SubjectAttendance', subjectAttendanceSchema);
