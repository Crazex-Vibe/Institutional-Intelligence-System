const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    subjectCode: { type: String },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    dueDate: { type: Date },
    maxMarks: { type: Number, default: 10 },
    academicYear: { type: String, default: '2024-2025' },
    description: { type: String },

    // Submissions
    submissions: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        submittedAt: { type: Date, default: Date.now },
        fileUrl: { type: String }, // base64 or file path
        fileName: { type: String },
        fileType: { type: String }, // image/pdf
        marksAwarded: { type: Number, default: null },
        feedback: { type: String },
        status: {
          type: String,
          enum: ['submitted', 'graded', 'late'],
          default: 'submitted',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
