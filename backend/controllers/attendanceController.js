const Attendance = require('../models/Attendance');
const SubjectAttendance = require('../models/SubjectAttendance');
const User = require('../models/User');

const ACADEMIC_YEAR = '2024-25';
const MIN_ATTENDANCE = 75;

// ─── STAFF: Get students for a class ───────────────────────────────────────
const getClassStudents = async (req, res) => {
  try {
    const { department, semester, section } = req.query;
 
    if (!department || !semester || !section) {
      return res.status(400).json({ success: false, message: 'Department, semester and section are required' });
    }
 
    const students = await User.find({
      role: 'student',
      'studentProfile.department': { $regex: new RegExp(`^${department}$`, 'i') }, // case-insensitive match
      'studentProfile.semester': Number(semester), // always cast to number
      'studentProfile.section': { $regex: new RegExp(`^${section}$`, 'i') }, // case-insensitive match
      isActive: true,
    }).select('name studentProfile');
 
    res.json({ success: true, students, count: students.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── STAFF: Mark hour-wise attendance ──────────────────────────────────────
const markAttendance = async (req, res) => {
  try {
    const { date, department, semester, section, hour, subject, records } = req.body;
    // records = [{ studentId, status }]

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];

    for (const record of records) {
      // Find or create day attendance doc for this student
      let dayDoc = await Attendance.findOne({
        student: record.studentId,
        date: attendanceDate,
      });

      if (!dayDoc) {
        dayDoc = new Attendance({
          student: record.studentId,
          date: attendanceDate,
          department,
          semester: Number(semester),
          section,
          hours: [],
        });
      }

      // Update or add this hour
      const existingHourIdx = dayDoc.hours.findIndex(h => h.hour === hour);
      if (existingHourIdx >= 0) {
        dayDoc.hours[existingHourIdx].status = record.status;
        dayDoc.hours[existingHourIdx].subject = subject;
        dayDoc.hours[existingHourIdx].staffId = req.user._id;
      } else {
        dayDoc.hours.push({
          hour,
          subject,
          staffId: req.user._id,
          status: record.status,
        });
      }

      // Sort hours
      dayDoc.hours.sort((a, b) => a.hour - b.hour);
      await dayDoc.save(); // triggers pre-save auto-calculation

      // Update subject attendance summary
      await updateSubjectAttendance(record.studentId, subject, department, semester, section, record.status);

      results.push({ studentId: record.studentId, status: 'saved' });
    }

    res.json({ success: true, message: `Attendance marked for Hour ${hour} — ${subject}`, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Helper: Update subject-wise attendance summary ────────────────────────
const updateSubjectAttendance = async (studentId, subject, department, semester, section, status) => {
  let subDoc = await SubjectAttendance.findOne({
    student: studentId,
    subject,
    academicYear: ACADEMIC_YEAR,
  });

  if (!subDoc) {
    subDoc = new SubjectAttendance({
      student: studentId,
      subject,
      department,
      semester: Number(semester),
      section,
      academicYear: ACADEMIC_YEAR,
    });
  }

  subDoc.totalClasses += 1;
  if (status === 'present' || status === 'od') {
    subDoc.attendedClasses += 1;
    if (status === 'od') subDoc.odClasses += 1;
  } else {
    subDoc.absentClasses += 1;
  }

  await subDoc.save(); // triggers percentage calculation
};

// ─── STAFF: Get already-marked attendance for a session ────────────────────
const getSessionAttendance = async (req, res) => {
  try {
    const { date, department, semester, section, hour } = req.query;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      date: attendanceDate,
      department,
      semester: Number(semester),
      section,
    }).populate('student', 'name studentProfile.rollNumber');

    const sessionData = records.map(r => ({
      studentId: r.student._id,
      studentName: r.student.name,
      rollNumber: r.student.studentProfile?.rollNumber,
      status: r.hours.find(h => h.hour === Number(hour))?.status || 'not_marked',
    }));

    res.json({ success: true, sessionData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── STUDENT: Get own attendance summary ───────────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Subject-wise summary
    const subjectStats = await SubjectAttendance.find({
      student: studentId,
      academicYear: ACADEMIC_YEAR,
    }).sort({ subject: 1 });

    // Overall day-wise stats
    const dayRecords = await Attendance.find({ student: studentId })
      .sort({ date: -1 })
      .limit(60);

    const totalDays = dayRecords.length;
    const presentDays = dayRecords.filter(d => d.dayStatus === 'present').length;
    const absentDays = dayRecords.filter(d => d.dayStatus === 'absent').length;
    const partialDays = dayRecords.filter(d => d.dayStatus === 'partial').length;
    const overallPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Low attendance subjects
    const lowAttendanceSubjects = subjectStats.filter(s => s.isLowAttendance);

    res.json({
      success: true,
      overall: { totalDays, presentDays, absentDays, partialDays, overallPercentage },
      subjectStats,
      lowAttendanceSubjects,
      recentDays: dayRecords.slice(0, 30),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MANAGEMENT: Get class-wise attendance overview ────────────────────────
const getClassAttendanceOverview = async (req, res) => {
  try {
    const { department, semester, section, date } = req.query;
    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      date: attendanceDate,
      ...(department && { department }),
      ...(semester && { semester: Number(semester) }),
      ...(section && { section }),
    }).populate('student', 'name studentProfile.rollNumber studentProfile.section');

    const totalStudents = records.length;
    const presentCount = records.filter(r => r.dayStatus === 'present').length;
    const absentCount = records.filter(r => r.dayStatus === 'absent').length;
    const partialCount = records.filter(r => r.dayStatus === 'partial').length;

    res.json({
      success: true,
      date: attendanceDate,
      summary: { totalStudents, presentCount, absentCount, partialCount },
      records,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MANAGEMENT: Students with low attendance ──────────────────────────────
const getLowAttendanceStudents = async (req, res) => {
  try {
    const lowStudents = await SubjectAttendance.find({
      isLowAttendance: true,
      academicYear: ACADEMIC_YEAR,
    })
      .populate('student', 'name studentProfile.rollNumber studentProfile.department studentProfile.semester studentProfile.section studentProfile.parentEmail')
      .sort({ attendancePercentage: 1 });

    res.json({ success: true, count: lowStudents.length, students: lowStudents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getClassStudents,
  markAttendance,
  getSessionAttendance,
  getMyAttendance,
  getClassAttendanceOverview,
  getLowAttendanceStudents,
};
