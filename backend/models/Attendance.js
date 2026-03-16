const mongoose = require('mongoose');

// Individual hour attendance record
const hourAttendanceSchema = new mongoose.Schema({
  hour: { type: Number, required: true, min: 1, max: 8 }, // 1–8 periods
  subject: { type: String, required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'od', 'leave'], default: 'absent' },
});

// Day attendance record for a student
const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    hours: [hourAttendanceSchema],

    // Auto-calculated fields
    totalHours: { type: Number, default: 0 },
    presentHours: { type: Number, default: 0 },
    absentHours: { type: Number, default: 0 },
    odHours: { type: Number, default: 0 },

    // Day status: present if >= 50% hours attended
    dayStatus: {
      type: String,
      enum: ['present', 'absent', 'partial', 'holiday'],
      default: 'absent',
    },
  },
  { timestamps: true }
);

// Auto-calculate day stats before saving
attendanceSchema.pre('save', function (next) {
  if (this.hours && this.hours.length > 0) {
    this.totalHours = this.hours.length;
    this.presentHours = this.hours.filter(h => h.status === 'present' || h.status === 'od').length;
    this.absentHours = this.hours.filter(h => h.status === 'absent').length;
    this.odHours = this.hours.filter(h => h.status === 'od').length;

    // Day present if attended >= 50% of scheduled hours
    const attendanceRatio = this.presentHours / this.totalHours;
    if (attendanceRatio >= 0.5) {
      this.dayStatus = 'present';
    } else if (attendanceRatio > 0) {
      this.dayStatus = 'partial';
    } else {
      this.dayStatus = 'absent';
    }
  }
  next();
});

// Compound index: one record per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
