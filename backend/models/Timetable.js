const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  hour: { type: Number, required: true, min: 1, max: 8 },
  subject: { type: String, required: true },
  subjectCode: { type: String },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffName: { type: String },
  room: { type: String },
  type: { type: String, enum: ['theory', 'lab', 'tutorial'], default: 'theory' },
});

const timetableSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    academicYear: { type: String, default: '2024-2025' },
    schedule: [scheduleEntrySchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique timetable per class
timetableSchema.index({ department: 1, semester: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);