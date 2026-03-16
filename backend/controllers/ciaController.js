const CIA = require('../models/CIA');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

// ── STAFF: Get or init CIA record for a class ─────────────────────────────────
// GET /api/cia/entry?department=CS&semester=5&section=A&subject=DS&type=CIA-1
const getCIAEntry = async (req, res) => {
  try {
    const { department, semester, section, subject, type } = req.query;

    // Get all students in this class
    const students = await User.find({
      role: 'student',
      'studentProfile.department': department,
      'studentProfile.semester': Number(semester),
      'studentProfile.section': section,
      isActive: true,
    }).select('name studentProfile.rollNumber');

    // Find existing CIA record
    let cia = await CIA.findOne({
      subject, department,
      semester: Number(semester),
      section, assessmentType: type,
    });

    if (!cia) {
      // Return empty template
      return res.json({
        success: true,
        cia: null,
        students: students.map(s => ({
          studentId: s._id,
          name: s.name,
          rollNumber: s.studentProfile?.rollNumber,
          marksObtained: 0,
          maxMarks: 50,
          isAbsent: false,
          remarks: '',
        })),
      });
    }

    // Merge existing marks with student list
    const mergedStudents = students.map(s => {
      const existing = cia.studentMarks.find(m => m.studentId.toString() === s._id.toString());
      return {
        studentId: s._id,
        name: s.name,
        rollNumber: s.studentProfile?.rollNumber,
        marksObtained: existing?.marksObtained ?? 0,
        maxMarks: cia.maxMarks,
        isAbsent: existing?.isAbsent ?? false,
        remarks: existing?.remarks ?? '',
      };
    });

    res.json({ success: true, cia, students: mergedStudents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STAFF: Save / update CIA marks ────────────────────────────────────────────
// POST /api/cia/save
const saveCIAMarks = async (req, res) => {
  try {
    const { subject, subjectCode, department, semester, section, assessmentType, maxMarks, conductedDate, academicYear, studentMarks } = req.body;
    const staffId = req.user._id;

    let cia = await CIA.findOne({
      subject, department,
      semester: Number(semester),
      section, assessmentType,
    });

    if (cia) {
      // Update existing
      cia.studentMarks = studentMarks;
      cia.maxMarks = maxMarks || 50;
      cia.conductedDate = conductedDate;
      cia.subjectCode = subjectCode;
      cia.academicYear = academicYear || '2024-2025';
    } else {
      // Create new
      cia = new CIA({
        subject, subjectCode, staffId, department,
        semester: Number(semester),
        section, assessmentType,
        maxMarks: maxMarks || 50,
        conductedDate, academicYear,
        studentMarks,
      });
    }

    await cia.save();

    res.json({
      success: true,
      message: `${assessmentType} marks saved for ${subject}`,
      stats: {
        classAverage: cia.classAverage,
        highestMark: cia.highestMark,
        lowestMark: cia.lowestMark,
        passCount: cia.passCount,
        totalStudents: studentMarks.length,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'CIA record already exists. Use update instead.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STAFF: Publish CIA marks (make visible to students) ───────────────────────
// PUT /api/cia/:id/publish
const publishCIA = async (req, res) => {
  try {
    const cia = await CIA.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    if (!cia) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: `${cia.assessmentType} marks published for ${cia.subject}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STAFF: Get all CIA records entered by this staff ──────────────────────────
// GET /api/cia/staff/records
const getStaffCIARecords = async (req, res) => {
  try {
    const records = await CIA.find({ staffId: req.user._id })
      .select('subject assessmentType department semester section classAverage highestMark passCount isPublished conductedDate maxMarks')
      .sort({ createdAt: -1 });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STUDENT: Get own CIA marks ─────────────────────────────────────────────────
// GET /api/cia/my-marks
const getMyCIAMarks = async (req, res) => {
  try {
    const student = req.user;
    const { department, semester, section } = student.studentProfile;

    const records = await CIA.find({
      department, semester, section,
      isPublished: true,
    }).populate('staffId', 'name');

    const myMarks = records.map(cia => {
      const myRecord = cia.studentMarks.find(
        m => m.studentId.toString() === student._id.toString()
      );
      return {
        subject: cia.subject,
        subjectCode: cia.subjectCode,
        assessmentType: cia.assessmentType,
        maxMarks: cia.maxMarks,
        marksObtained: myRecord?.marksObtained ?? null,
        isAbsent: myRecord?.isAbsent ?? false,
        remarks: myRecord?.remarks ?? '',
        percentage: myRecord && !myRecord.isAbsent
          ? Math.round((myRecord.marksObtained / cia.maxMarks) * 100)
          : null,
        classAverage: cia.classAverage,
        staffName: cia.staffId?.name,
        conductedDate: cia.conductedDate,
      };
    });

    // Group by subject
    const bySubject = {};
    for (const m of myMarks) {
      if (!bySubject[m.subject]) bySubject[m.subject] = [];
      bySubject[m.subject].push(m);
    }

    res.json({ success: true, marks: myMarks, bySubject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MANAGEMENT: Class-wise CIA summary ────────────────────────────────────────
// GET /api/cia/summary?department=CS&semester=5&section=A
const getClassCIASummary = async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    const records = await CIA.find({
      department,
      semester: Number(semester),
      section,
    }).populate('staffId', 'name').sort({ subject: 1, assessmentType: 1 });

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STUDENT: Submit assignment ─────────────────────────────────────────────────
// POST /api/cia/assignment/submit
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, fileUrl, fileName, fileType } = req.body;
    const studentId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const existing = assignment.submissions.findIndex(
      s => s.studentId.toString() === studentId.toString()
    );

    const now = new Date();
    const isLate = assignment.dueDate && now > new Date(assignment.dueDate);
    const submissionData = {
      studentId, fileUrl, fileName, fileType,
      submittedAt: now,
      status: isLate ? 'late' : 'submitted',
    };

    if (existing >= 0) {
      assignment.submissions[existing] = { ...assignment.submissions[existing], ...submissionData };
    } else {
      assignment.submissions.push(submissionData);
    }

    await assignment.save();
    res.json({ success: true, message: isLate ? 'Submitted (late)' : 'Assignment submitted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STAFF: Create assignment ───────────────────────────────────────────────────
// POST /api/cia/assignment/create
const createAssignment = async (req, res) => {
  try {
    const { title, subject, subjectCode, department, semester, section, dueDate, maxMarks, description, academicYear } = req.body;

    const assignment = await Assignment.create({
      title, subject, subjectCode,
      staffId: req.user._id,
      department, semester: Number(semester),
      section, dueDate, maxMarks, description, academicYear,
    });

    res.status(201).json({ success: true, message: 'Assignment created', assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STUDENT: Get assignments for my class ─────────────────────────────────────
// GET /api/cia/assignments/my
const getMyAssignments = async (req, res) => {
  try {
    const { department, semester, section } = req.user.studentProfile;
    const assignments = await Assignment.find({ department, semester, section })
      .populate('staffId', 'name')
      .sort({ dueDate: 1 });

    const withStatus = assignments.map(a => {
      const mySub = a.submissions.find(s => s.studentId.toString() === req.user._id.toString());
      return {
        _id: a._id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        description: a.description,
        staffName: a.staffId?.name,
        submission: mySub || null,
        isOverdue: a.dueDate && new Date() > new Date(a.dueDate) && !mySub,
      };
    });

    res.json({ success: true, assignments: withStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STAFF: Get assignments created by this staff ───────────────────────────────
const getStaffAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ staffId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCIAEntry, saveCIAMarks, publishCIA,
  getStaffCIARecords, getMyCIAMarks, getClassCIASummary,
  submitAssignment, createAssignment,
  getMyAssignments, getStaffAssignments,
};
