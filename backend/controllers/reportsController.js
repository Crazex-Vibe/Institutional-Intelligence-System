const User = require('../models/User');
const AcademicProfile = require('../models/AcademicProfile');
const Attendance = require('../models/Attendance');
const SubjectAttendance = require('../models/SubjectAttendance');
const CIA = require('../models/CIA');
const {
  sendCIASummaryEmail,
  sendAttendanceAlertEmail,
  sendSemesterReportEmail,
} = require('../services/emailService');

const MIN_ATTENDANCE = 75;

// ── Send CIA summary to a student (and parent) ────────────────────────────────
// POST /api/reports/send-cia
const sendCIAReport = async (req, res) => {
  try {
    const { studentId, subject, assessmentType } = req.body;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const { department, semester, section } = student.studentProfile;

    // Get CIA record
    const cia = await CIA.findOne({ subject, department, semester, section, assessmentType, isPublished: true })
      .populate('staffId', 'name');

    if (!cia) return res.status(404).json({ success: false, message: 'No published CIA record found' });

    const studentMark = cia.studentMarks.find(m => m.studentId.toString() === studentId);
    if (!studentMark) return res.status(404).json({ success: false, message: 'No mark found for this student' });

    const percentage = Math.round((studentMark.marksObtained / cia.maxMarks) * 100);

    const emailData = {
      studentName: student.name,
      parentName: null,
      subject, assessmentType,
      marksObtained: studentMark.marksObtained,
      maxMarks: cia.maxMarks,
      percentage,
      classAverage: cia.classAverage,
      department, semester,
      staffName: cia.staffId?.name || 'N/A',
      date: cia.conductedDate,
    };

    const recipients = [student.email];
    if (student.studentProfile?.parentEmail) recipients.push(student.studentProfile.parentEmail);

    let sent = 0, failed = 0;
    for (const email of recipients) {
      try {
        await sendCIASummaryEmail({ to: email, ...emailData, parentName: email === student.studentProfile?.parentEmail ? 'Parent/Guardian' : null });
        sent++;
      } catch { failed++; }
    }

    res.json({ success: true, message: `Email sent to ${sent} recipient(s)${failed > 0 ? `, ${failed} failed` : ''}`, sent, failed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Send CIA to entire class ──────────────────────────────────────────────────
// POST /api/reports/send-cia-class
const sendCIAReportToClass = async (req, res) => {
  try {
    const { department, semester, section, subject, assessmentType } = req.body;

    const cia = await CIA.findOne({ subject, department, semester: Number(semester), section, assessmentType, isPublished: true })
      .populate('staffId', 'name');

    if (!cia) return res.status(404).json({ success: false, message: 'No published CIA found for this class' });

    const students = await User.find({
      role: 'student',
      'studentProfile.department': department,
      'studentProfile.semester': Number(semester),
      'studentProfile.section': section,
    });

    let sent = 0, failed = 0, skipped = 0;

    for (const student of students) {
      const mark = cia.studentMarks.find(m => m.studentId.toString() === student._id.toString());
      if (!mark || mark.isAbsent) { skipped++; continue; }

      const percentage = Math.round((mark.marksObtained / cia.maxMarks) * 100);
      const emailData = {
        studentName: student.name, subject, assessmentType,
        marksObtained: mark.marksObtained, maxMarks: cia.maxMarks,
        percentage, classAverage: cia.classAverage,
        department, semester, staffName: cia.staffId?.name || 'N/A', date: cia.conductedDate,
      };

      const recipients = [student.email];
      if (student.studentProfile?.parentEmail) recipients.push(student.studentProfile.parentEmail);

      for (const email of recipients) {
        try {
          await sendCIASummaryEmail({ to: email, ...emailData, parentName: email !== student.email ? 'Parent/Guardian' : null });
          sent++;
        } catch { failed++; }
      }
    }

    res.json({ success: true, message: `Done! Sent: ${sent}, Failed: ${failed}, Skipped (absent): ${skipped}`, sent, failed, skipped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Send attendance alert to low-attendance students ─────────────────────────
// POST /api/reports/send-attendance-alerts
const sendAttendanceAlerts = async (req, res) => {
  try {
    const { department, semester, section } = req.body;

    const students = await User.find({
      role: 'student',
      'studentProfile.department': department,
      'studentProfile.semester': Number(semester),
      'studentProfile.section': section,
    });

    const allRecords = await Attendance.find({ department, semester: Number(semester), section });

    let sent = 0, failed = 0, skipped = 0;

    for (const student of students) {
      // Calculate attendance per subject
      const subjectMap = {};
      for (const record of allRecords) {
        const subj = record.subject;
        if (!subjectMap[subj]) subjectMap[subj] = { totalHours: 0, attendedHours: 0 };
        subjectMap[subj].totalHours++;
        const sr = record.records.find(r => r.studentId.toString() === student._id.toString());
        if (sr && (sr.status === 'present' || sr.status === 'od' || sr.status === 'late')) {
          subjectMap[subj].attendedHours++;
        }
      }

      const subjects = Object.entries(subjectMap).map(([subject, data]) => {
        const percentage = data.totalHours > 0 ? Math.round((data.attendedHours / data.totalHours) * 100) : 0;
        let hoursNeeded = 0;
        if (percentage < MIN_ATTENDANCE) {
          let x = 0;
          while (x < 200) {
            if (((data.attendedHours + x) / (data.totalHours + x)) * 100 >= MIN_ATTENDANCE) break;
            x++;
          }
          hoursNeeded = x;
        }
        return { subject, percentage, hoursNeeded, isLow: percentage < MIN_ATTENDANCE };
      });

      const lowSubjects = subjects.filter(s => s.isLow);
      if (lowSubjects.length === 0) { skipped++; continue; }

      // Overall %
      const totalHours = Object.values(subjectMap).reduce((s, d) => s + d.totalHours, 0);
      const attendedHours = Object.values(subjectMap).reduce((s, d) => s + d.attendedHours, 0);
      const overallPercentage = totalHours > 0 ? Math.round((attendedHours / totalHours) * 100) : 0;

      const emailData = {
        studentName: student.name,
        overallPercentage,
        lowSubjects,
        department,
        semester,
      };

      const recipients = [student.email];
      if (student.studentProfile?.parentEmail) recipients.push(student.studentProfile.parentEmail);

      for (const email of recipients) {
        try {
          await sendAttendanceAlertEmail({ to: email, ...emailData, parentName: email !== student.email ? 'Parent/Guardian' : null });
          sent++;
        } catch { failed++; }
      }
    }

    res.json({ success: true, message: `Alerts sent! Sent: ${sent}, Failed: ${failed}, No alert needed: ${skipped}`, sent, failed, skipped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Send semester report ──────────────────────────────────────────────────────
// POST /api/reports/send-semester-report
const sendSemesterReport = async (req, res) => {
  try {
    const { studentId, semesterNumber } = req.body;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const profile = await AcademicProfile.findOne({ studentId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const sem = profile.semesters.find(s => s.semesterNumber === semesterNumber && s.isResultPublished);
    if (!sem) return res.status(404).json({ success: false, message: 'Semester result not published' });

    const emailData = {
      studentName: student.name,
      semester: semesterNumber,
      academicYear: sem.academicYear,
      cgpa: profile.cgpa,
      sgpa: sem.sgpa,
      subjects: sem.subjects,
      department: student.studentProfile?.department,
      totalCredits: sem.totalCredits,
      earnedCredits: sem.earnedCredits,
    };

    const recipients = [student.email];
    if (student.studentProfile?.parentEmail) recipients.push(student.studentProfile.parentEmail);

    let sent = 0, failed = 0;
    for (const email of recipients) {
      try {
        await sendSemesterReportEmail({ to: email, ...emailData, parentName: email !== student.email ? 'Parent/Guardian' : null });
        sent++;
      } catch { failed++; }
    }

    res.json({ success: true, message: `Report sent to ${sent} recipient(s)`, sent, failed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Analytics: attendance overview for management ─────────────────────────────
// GET /api/reports/analytics?department=CS&semester=5&section=A
const getAnalytics = async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    // Get all students in this class
    const students = await User.find({
      role: 'student',
      'studentProfile.department': { $regex: new RegExp(`^${department}$`, 'i') },
      'studentProfile.semester': Number(semester),
      'studentProfile.section': { $regex: new RegExp(`^${section}$`, 'i') },
    });

    if (students.length === 0) {
      return res.json({
        success: true,
        summary: { totalStudents: 0, lowAttendanceCount: 0, classAvgAttendance: 0, totalClassesConducted: 0 },
        studentStats: [],
        subjectStats: [],
        attendanceTrend: [],
      });
    }

    const studentIds = students.map(s => s._id);

    // Use SubjectAttendance — this is what attendanceController populates
    const subjectAttendanceRecords = await SubjectAttendance.find({
      student: { $in: studentIds },
    });

    // Per-student summary using SubjectAttendance
    const studentStats = students.map(student => {
      const myRecords = subjectAttendanceRecords.filter(
        r => r.student.toString() === student._id.toString()
      );
      const totalHours = myRecords.reduce((s, r) => s + (r.totalClasses || 0), 0);
      const attendedHours = myRecords.reduce((s, r) => s + (r.attendedClasses || 0), 0);
      const percentage = totalHours > 0 ? Math.round((attendedHours / totalHours) * 100) : 0;
      return {
        name: student.name,
        rollNumber: student.studentProfile?.rollNumber,
        percentage,
        totalHours,
        attendedHours,
        isLow: percentage < MIN_ATTENDANCE,
      };
    });

    // Subject-wise average using SubjectAttendance
    const subjectMap = {};
    for (const r of subjectAttendanceRecords) {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { totalClasses: 0, attendedClasses: 0, studentCount: 0 };
      subjectMap[r.subject].totalClasses += r.totalClasses || 0;
      subjectMap[r.subject].attendedClasses += r.attendedClasses || 0;
      subjectMap[r.subject].studentCount++;
    }
    const subjectStats = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      avgAttendance: data.totalClasses > 0
        ? Math.round((data.attendedClasses / data.totalClasses) * 100)
        : 0,
      totalClasses: data.studentCount > 0
        ? Math.round(data.totalClasses / data.studentCount)
        : 0,
    })).sort((a, b) => b.avgAttendance - a.avgAttendance);

    // Daily attendance trend using Attendance model (day records)
    const allDayRecords = await Attendance.find({
      department: { $regex: new RegExp(`^${department}$`, 'i') },
      semester: Number(semester),
      section: { $regex: new RegExp(`^${section}$`, 'i') },
    }).sort({ date: -1 }).limit(300);

    const last30Days = [];
    const seenDates = new Set();
    for (const record of allDayRecords) {
      const dateStr = record.date.toDateString();
      if (!seenDates.has(dateStr)) {
        seenDates.add(dateStr);
        // count present hours across all students for this day
        const presentCount = record.hours?.filter(
          h => h.status === 'present' || h.status === 'od'
        ).length || 0;
        const totalCount = record.hours?.length || 0;
        last30Days.push({
          date: record.date.toISOString().split('T')[0],
          percentage: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
          totalClasses: totalCount,
        });
      }
      if (seenDates.size >= 30) break;
    }
    last30Days.reverse();

    const summary = {
      totalStudents: students.length,
      lowAttendanceCount: studentStats.filter(s => s.isLow).length,
      classAvgAttendance: studentStats.length > 0
        ? Math.round(studentStats.reduce((s, st) => s + st.percentage, 0) / studentStats.length)
        : 0,
      totalClassesConducted: seenDates.size,
    };

    res.json({ success: true, summary, studentStats, subjectStats, attendanceTrend: last30Days });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  sendCIAReport, sendCIAReportToClass,
  sendAttendanceAlerts, sendSemesterReport, getAnalytics,
};