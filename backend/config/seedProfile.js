require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const AcademicProfile = require('../models/AcademicProfile');

const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, U: 0, RA: 0 };

const calcSGPA = (subjects) => {
  const valid = subjects.filter(s => s.gradePoint > 0);
  if (!valid.length) return 0;
  const tw = valid.reduce((sum, s) => sum + s.gradePoint * s.credits, 0);
  const tc = valid.reduce((sum, s) => sum + s.credits, 0);
  return Math.round((tw / tc) * 100) / 100;
};

const seedProfile = async () => {
  await connectDB();
  try {
    const student = await User.findOne({ role: 'student', email: 'student@college.edu' });
    if (!student) { console.log('❌ Run npm run seed first'); process.exit(1); }

    await AcademicProfile.deleteOne({ studentId: student._id });

    const semesters = [
      {
        semesterNumber: 1, academicYear: '2023-2024', isResultPublished: true,
        subjects: [
          { code: 'MA8151', name: 'Engineering Mathematics I', credits: 4, grade: 'A+' },
          { code: 'PH8151', name: 'Engineering Physics', credits: 3, grade: 'A' },
          { code: 'CY8151', name: 'Engineering Chemistry', credits: 3, grade: 'B+' },
          { code: 'GE8151', name: 'Problem Solving & Python', credits: 4, grade: 'O' },
          { code: 'GE8152', name: 'Engineering Graphics', credits: 4, grade: 'A' },
          { code: 'GE8161', name: 'Computer Practices Lab', credits: 2, grade: 'O' },
        ],
      },
      {
        semesterNumber: 2, academicYear: '2023-2024', isResultPublished: true,
        subjects: [
          { code: 'MA8251', name: 'Engineering Mathematics II', credits: 4, grade: 'A' },
          { code: 'PH8254', name: 'Physics for IT', credits: 3, grade: 'B+' },
          { code: 'CS8251', name: 'Programming in C', credits: 3, grade: 'O' },
          { code: 'CS8291', name: 'Digital Principles', credits: 3, grade: 'A+' },
          { code: 'GE8291', name: 'Environmental Science', credits: 2, grade: 'A' },
          { code: 'CS8261', name: 'C Programming Lab', credits: 2, grade: 'O' },
        ],
      },
      {
        semesterNumber: 3, academicYear: '2024-2025', isResultPublished: true,
        subjects: [
          { code: 'MA8351', name: 'Discrete Mathematics', credits: 4, grade: 'B+' },
          { code: 'AD8301', name: 'Data Structures', credits: 3, grade: 'A+' },
          { code: 'AD8302', name: 'Object Oriented Programming', credits: 3, grade: 'A' },
          { code: 'AD8303', name: 'Statistics & Numerical Methods', credits: 3, grade: 'A' },
          { code: 'EC8395', name: 'Communication Engineering', credits: 3, grade: 'B' },
          { code: 'AD8381', name: 'Data Structures Lab', credits: 2, grade: 'O' },
        ],
      },
      {
        semesterNumber: 4, academicYear: '2024-2025', isResultPublished: true,
        subjects: [
          { code: 'MA8402', name: 'Probability & Queuing Theory', credits: 4, grade: 'A' },
          { code: 'AD8401', name: 'Machine Learning', credits: 3, grade: 'A+' },
          { code: 'AD8402', name: 'Database Management Systems', credits: 3, grade: 'A+' },
          { code: 'AD8403', name: 'Design & Analysis of Algorithms', credits: 3, grade: 'A+' },
          { code: 'AD8404', name: 'Operating Systems', credits: 3, grade: 'A' },
          { code: 'AD8481', name: 'ML Lab', credits: 2, grade: 'O' },
        ],
      },
      {
        semesterNumber: 5, academicYear: '2025-2026', isResultPublished: true,
        subjects: [
          { code: 'AD8501', name: 'Deep Learning', credits: 3, grade: 'A+' },
          { code: 'AD8502', name: 'Natural Language Processing', credits: 3, grade: 'A' },
          { code: 'AD8503', name: 'Computer Vision', credits: 3, grade: 'A+' },
          { code: 'AD8504', name: 'Big Data Analytics', credits: 3, grade: 'A' },
          { code: 'AD8581', name: 'Deep Learning Lab', credits: 2, grade: 'O' },
          { code: 'AD8582', name: 'NLP Lab', credits: 2, grade: 'A+' },
        ],
      },
      {
        semesterNumber: 6, academicYear: '2025-2026', isResultPublished: false,
        subjects: [
          { code: 'AD8601', name: 'Reinforcement Learning', credits: 3, grade: '--' },
          { code: 'AD8602', name: 'AI Ethics & Governance', credits: 3, grade: '--' },
          { code: 'AD8603', name: 'Cloud Computing', credits: 3, grade: '--' },
          { code: 'AD8604', name: 'Internet of Things', credits: 3, grade: '--' },
          { code: 'AD8681', name: 'Cloud Lab', credits: 2, grade: '--' },
          { code: 'AD8682', name: 'IoT Lab', credits: 2, grade: '--' },
        ],
      },
    ];

    // Enrich subjects with grade points
    const enrichedSemesters = semesters.map(sem => {
      const subjects = sem.subjects.map(s => ({
        ...s,
        type: 'theory',
        gradePoint: GRADE_POINTS[s.grade] ?? 0,
        isArrear: s.grade === 'U' || s.grade === 'RA',
      }));
      const sgpa = calcSGPA(subjects);
      const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
      const earnedCredits = subjects.filter(s => s.gradePoint >= 5).reduce((sum, s) => sum + s.credits, 0);
      return { ...sem, subjects, sgpa, totalCredits, earnedCredits };
    });

    const fees = [
      { semesterNumber: 1, academicYear: '2023-2024', tuitionFee: 45000, otherFee: 3000, totalAmount: 48000, paidAmount: 48000, dueAmount: 0, status: 'paid', receiptNumber: 'REC2023001', paidDate: new Date('2023-07-15') },
      { semesterNumber: 2, academicYear: '2023-2024', tuitionFee: 45000, otherFee: 3000, totalAmount: 48000, paidAmount: 48000, dueAmount: 0, status: 'paid', receiptNumber: 'REC2024001', paidDate: new Date('2024-01-10') },
      { semesterNumber: 3, academicYear: '2024-2025', tuitionFee: 45000, otherFee: 3500, totalAmount: 48500, paidAmount: 48500, dueAmount: 0, status: 'paid', receiptNumber: 'REC2024002', paidDate: new Date('2024-07-20') },
      { semesterNumber: 4, academicYear: '2024-2025', tuitionFee: 45000, otherFee: 3500, totalAmount: 48500, paidAmount: 48500, dueAmount: 0, status: 'paid', receiptNumber: 'REC2025001', paidDate: new Date('2025-01-12') },
      { semesterNumber: 5, academicYear: '2025-2026', tuitionFee: 47000, otherFee: 4000, totalAmount: 51000, paidAmount: 51000, dueAmount: 0, status: 'paid', receiptNumber: 'REC2025002', paidDate: new Date('2025-07-18') },
      { semesterNumber: 6, academicYear: '2025-2026', tuitionFee: 47000, otherFee: 4000, totalAmount: 51000, paidAmount: 25000, dueAmount: 26000, status: 'partial', dueDate: new Date('2026-03-31') },
    ];

    const achievements = [
      { title: 'First Prize — Code Sprint Hackathon', category: 'technical', description: 'Won first place in 24-hour hackathon organized by IEEE Student Branch', date: new Date('2024-03-15'), issuedBy: 'IEEE Student Branch', level: 'college' },
      { title: 'Merit Scholarship 2024-25', category: 'academic', description: 'Awarded merit scholarship for achieving SGPA above 8.5 in Semester 3', date: new Date('2025-01-20'), issuedBy: 'College Administration', level: 'college' },
      { title: 'Best Paper Award — National Conference', category: 'academic', description: 'Best paper award for research on Deep Learning applications in healthcare', date: new Date('2025-02-10'), issuedBy: 'National Conference on AI & DS', level: 'national' },
      { title: 'State Level Chess Championship', category: 'sports', description: '3rd place in State Level Inter-Collegiate Chess Tournament', date: new Date('2024-11-05'), issuedBy: 'Tamil Nadu Sports Council', level: 'state' },
    ];

    const examTimetable = [
      { subjectCode: 'AD8601', subjectName: 'Reinforcement Learning', examDate: new Date('2026-04-08'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Block A - Hall 1', semesterNumber: 6 },
      { subjectCode: 'AD8602', subjectName: 'AI Ethics & Governance', examDate: new Date('2026-04-11'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Block A - Hall 2', semesterNumber: 6 },
      { subjectCode: 'AD8603', subjectName: 'Cloud Computing', examDate: new Date('2026-04-15'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Block B - Hall 1', semesterNumber: 6 },
      { subjectCode: 'AD8604', subjectName: 'Internet of Things', examDate: new Date('2026-04-18'), session: 'AN', startTime: '02:00 PM', endTime: '05:00 PM', venue: 'Block B - Hall 3', semesterNumber: 6 },
      { subjectCode: 'AD8681', subjectName: 'Cloud Lab', examDate: new Date('2026-04-22'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Cloud Lab - 301', semesterNumber: 6 },
    ];

    const profile = await AcademicProfile.create({
      studentId: student._id,
      semesters: enrichedSemesters,
      fees,
      achievements,
      examTimetable,
      scholarship: {
        status: 'approved',
        scholarshipType: 'Merit Scholarship',
        amount: 15000,
        academicYear: '2024-2025',
      },
    });

    console.log(`✅ Academic profile created for ${student.name}`);
    console.log(`   CGPA: ${profile.cgpa}`);
    console.log(`   Semesters: ${profile.semesters.length} (5 published, 1 in progress)`);
    console.log(`   Credits Earned: ${profile.totalCreditsEarned}`);
    console.log(`   Achievements: ${profile.achievements.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seedProfile();