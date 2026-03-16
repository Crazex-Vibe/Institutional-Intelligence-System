const AcademicProfile = require('../models/AcademicProfile');
const User = require('../models/User');

const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, U: 0, RA: 0, W: 0, I: 0, '--': 0 };

// Calculate SGPA from subjects
const calcSGPA = (subjects) => {
  const valid = subjects.filter(s => s.gradePoint > 0 && s.credits > 0);
  if (!valid.length) return 0;
  const totalWeighted = valid.reduce((sum, s) => sum + s.gradePoint * s.credits, 0);
  const totalCredits = valid.reduce((sum, s) => sum + s.credits, 0);
  return totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : 0;
};

// ── GET own profile (student) ─────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    let profile = await AcademicProfile.findOne({ studentId: req.user._id })
      .populate('studentId', 'name email studentProfile');

    if (!profile) {
      // Create empty profile
      profile = await AcademicProfile.create({ studentId: req.user._id });
    }

    res.json({ success: true, profile, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET student profile by ID (staff gets overview only, management gets full) ─
const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const requesterRole = req.user.role;

    const student = await User.findById(studentId).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let profile = await AcademicProfile.findOne({ studentId });
    if (!profile) profile = await AcademicProfile.create({ studentId });

    // Staff gets limited overview
    if (requesterRole === 'staff') {
      return res.json({
        success: true,
        isOverview: true,
        student: {
          name: student.name,
          rollNumber: student.studentProfile?.rollNumber,
          department: student.studentProfile?.department,
          semester: student.studentProfile?.semester,
          section: student.studentProfile?.section,
          cgpa: profile.cgpa,
          totalCreditsEarned: profile.totalCreditsEarned,
          totalArrears: profile.totalArrears,
          feeStatus: student.studentProfile?.feeStatus,
          scholarshipStatus: student.studentProfile?.scholarshipStatus,
        },
      });
    }

    // Management / student gets full profile
    res.json({ success: true, isOverview: false, profile, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD / UPDATE semester result (management) ─────────────────────────────────
const upsertSemesterResult = async (req, res) => {
  try {
    const { studentId, semesterNumber, academicYear, subjects, isResultPublished } = req.body;

    let profile = await AcademicProfile.findOne({ studentId });
    if (!profile) profile = new AcademicProfile({ studentId });

    // Build subjects with grade points
    const enrichedSubjects = subjects.map(s => ({
      ...s,
      gradePoint: GRADE_POINTS[s.grade] ?? 0,
      isArrear: s.grade === 'U' || s.grade === 'RA',
    }));

    const sgpa = calcSGPA(enrichedSubjects);
    const totalCredits = enrichedSubjects.reduce((sum, s) => sum + s.credits, 0);
    const earnedCredits = enrichedSubjects.filter(s => s.gradePoint >= 5).reduce((sum, s) => sum + s.credits, 0);

    const semIndex = profile.semesters.findIndex(s => s.semesterNumber === semesterNumber);
    const semData = { semesterNumber, academicYear, subjects: enrichedSubjects, sgpa, totalCredits, earnedCredits, isResultPublished: isResultPublished ?? true };

    if (semIndex >= 0) {
      profile.semesters[semIndex] = semData;
    } else {
      profile.semesters.push(semData);
    }

    // Recalculate arrears
    profile.totalArrears = profile.semesters.reduce((sum, sem) =>
      sum + sem.subjects.filter(s => s.isArrear).length, 0);

    await profile.save();

    // Update CGPA on user profile too
    await User.findByIdAndUpdate(studentId, { 'studentProfile.cgpa': profile.cgpa });

    res.json({ success: true, message: 'Semester result saved', cgpa: profile.cgpa, sgpa });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD fee record (management) ───────────────────────────────────────────────
const addFeeRecord = async (req, res) => {
  try {
    const { studentId, semesterNumber, academicYear, tuitionFee, hostelFee, otherFee, paidAmount, receiptNumber, paidDate } = req.body;

    let profile = await AcademicProfile.findOne({ studentId });
    if (!profile) profile = new AcademicProfile({ studentId });

    const totalAmount = (tuitionFee || 0) + (hostelFee || 0) + (otherFee || 0);
    const dueAmount = totalAmount - (paidAmount || 0);
    const status = dueAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

    const feeIdx = profile.fees.findIndex(f => f.semesterNumber === semesterNumber);
    const feeData = { semesterNumber, academicYear, tuitionFee, hostelFee, otherFee, totalAmount, paidAmount, dueAmount, status, receiptNumber, paidDate };

    if (feeIdx >= 0) profile.fees[feeIdx] = feeData;
    else profile.fees.push(feeData);

    await profile.save();
    await User.findByIdAndUpdate(studentId, { 'studentProfile.feeStatus': status });

    res.json({ success: true, message: 'Fee record updated', status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD achievement (student or management) ───────────────────────────────────
const addAchievement = async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id : req.body.studentId;

    let profile = await AcademicProfile.findOne({ studentId });
    if (!profile) profile = new AcademicProfile({ studentId });

    profile.achievements.push(req.body);
    await profile.save();

    res.json({ success: true, message: 'Achievement added', achievements: profile.achievements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE achievement ────────────────────────────────────────────────────────
const deleteAchievement = async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id : req.params.studentId;
    const profile = await AcademicProfile.findOne({ studentId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    profile.achievements = profile.achievements.filter(a => a._id.toString() !== req.params.achievementId);
    await profile.save();

    res.json({ success: true, message: 'Achievement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD / UPDATE exam timetable (management) ──────────────────────────────────
const setExamTimetable = async (req, res) => {
  try {
    const { studentId, semesterNumber, exams } = req.body;

    let profile = await AcademicProfile.findOne({ studentId });
    if (!profile) profile = new AcademicProfile({ studentId });

    // Remove existing for this semester and replace
    profile.examTimetable = [
      ...profile.examTimetable.filter(e => e.semesterNumber !== semesterNumber),
      ...exams.map(e => ({ ...e, semesterNumber })),
    ];

    await profile.save();
    res.json({ success: true, message: 'Exam timetable updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET all students list (management / staff) ────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const { department, semester, section } = req.query;
    const query = { role: 'student', isActive: true };
    if (department) query['studentProfile.department'] = department;
    if (semester) query['studentProfile.semester'] = Number(semester);
    if (section) query['studentProfile.section'] = section;

    const students = await User.find(query).select('name email studentProfile');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyProfile,
  getStudentProfile,
  upsertSemesterResult,
  addFeeRecord,
  addAchievement,
  deleteAchievement,
  setExamTimetable,
  getAllStudents,
};
