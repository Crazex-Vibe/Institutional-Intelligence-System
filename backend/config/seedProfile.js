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
        semesterNumber: 1, academicYear: '2021-2022', isResultPublished: true,
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
        semesterNumber: 2, academicYear: '2021-2022', isResultPublished: true,
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
        semesterNumber: 3, academicYear: '2022-2023', isResultPublished: true,
        subjects: [
          { code: 'MA8351', name: 'Discrete Mathematics', credits: 4, grade: 'B+' },
          { code: 'CS8351', name: 'Data Structures', credits: 3, grade: 'A+' },
          { code: 'CS8392', name: 'Object Oriented Programming', credits: 3, grade: 'A' },
          { code: 'CS8391', name: 'Data Structures', credits: 3, grade: 'A' },
          { code: 'EC8395', name: 'Communication Engineering', credits: 3, grade: 'B' },
          { code: 'CS8381', name: 'Data Structures Lab', credits: 2, grade: 'O' },
        ],
      },
      {
        semesterNumber: 4, academicYear: '2022-2023', isResultPublished: true,
        subjects: [
          { code: 'MA8402', name: 'Probability & Queuing Theory', credits: 4, grade: 'A' },
          { code: 'CS8491', name: 'Computer Architecture', credits: 3, grade: 'B+' },
          { code: 'CS8492', name: 'Database Management Systems', credits: 3, grade: 'A+' },
          { code: 'CS8451', name: 'Design & Analysis of Algorithms', credits: 3, grade: 'A+' },
          { code: 'CS8493', name: 'Operating Systems', credits: 3, grade: 'A' },
          { code: 'CS8481', name: 'DBMS Lab', credits: 2, grade: 'O' },
        ],
      },
      {
        semesterNumber: 5, academicYear: '2023-2024', isResultPublished: false,
        subjects: [
          { code: 'CS8591', name: 'Computer Networks', credits: 3, grade: '--' },
          { code: 'CS8501', name: 'Theory of Computation', credits: 3, grade: '--' },
          { code: 'CS8502', name: 'Software Engineering', credits: 3, grade: '--' },
          { code: 'CS8092', name: 'Web Technology', credits: 3, grade: '--' },
          { code: 'CS8581', name: 'Networks Lab', credits: 2, grade: '--' },
          { code: 'CS8582', name: 'Software Engineering Lab', credits: 2, grade: '--' },
        ],
      },
    ];

    // Enrich subjects
    const enrichedSemesters = semesters.map(sem => {
      const subjects = sem.subjects.map(s => ({
        ...s, type: 'theory',
        gradePoint: GRADE_POINTS[s.grade] ?? 0,
        isArrear: s.grade === 'U' || s.grade === 'RA',
      }));
      const sgpa = calcSGPA(subjects);
      const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
      const earnedCredits = subjects.filter(s => s.gradePoint >= 5).reduce((sum, s) => sum + s.credits, 0);
      return { ...sem, subjects, sgpa, totalCredits, earnedCredits };
    });

    const fees = [
      { semesterNumber: 1, academicYear: '2021-2022', tuitionFee: 45000, hostelFee: 0, otherFee: 3000, totalAmount: 48000, paidAmount: 48000, dueAmount: 0, status: 'paid', receiptNumber: 'REC2021001', paidDate: new Date('2021-07-15') },
      { semesterNumber: 2, academicYear: '2021-2022', tuitionFee: 45000, hostelFee: 0, otherFee: 3000, totalAmount: 48000, paidAmount: 48000, dueAmount: 0, status: 'paid', receiptNumber: 'REC2022001', paidDate: new Date('2022-01-10') },
      { semesterNumber: 3, academicYear: '2022-2023', tuitionFee: 45000, hostelFee: 0, otherFee: 3500, totalAmount: 48500, paidAmount: 48500, dueAmount: 0, status: 'paid', receiptNumber: 'REC2022002', paidDate: new Date('2022-07-20') },
      { semesterNumber: 4, academicYear: '2022-2023', tuitionFee: 45000, hostelFee: 0, otherFee: 3500, totalAmount: 48500, paidAmount: 48500, dueAmount: 0, status: 'paid', receiptNumber: 'REC2023001', paidDate: new Date('2023-01-12') },
      { semesterNumber: 5, academicYear: '2023-2024', tuitionFee: 47000, hostelFee: 0, otherFee: 4000, totalAmount: 51000, paidAmount: 51000, dueAmount: 0, status: 'paid', receiptNumber: 'REC2023002', paidDate: new Date('2023-07-18') },
    ];

    const achievements = [
      { title: 'First Prize — Code Sprint Hackathon', category: 'technical', description: 'Won first place in 24-hour hackathon organized by IEEE Student Branch', date: new Date('2023-03-15'), issuedBy: 'IEEE Student Branch', level: 'college' },
      { title: 'Merit Scholarship 2022-23', category: 'academic', description: 'Awarded merit scholarship for achieving SGPA above 8.5 in Semester 3', date: new Date('2023-01-20'), issuedBy: 'College Administration', level: 'college' },
      { title: 'Best Outgoing Student — Dept Level', category: 'academic', description: 'Recognized for academic excellence and active participation', date: new Date('2023-04-10'), issuedBy: 'Department of Computer Science', level: 'college' },
      { title: 'State Level Chess Championship', category: 'sports', description: '3rd place in State Level Inter-Collegiate Chess Tournament', date: new Date('2022-11-05'), issuedBy: 'Tamil Nadu Sports Council', level: 'state' },
    ];

    const examTimetable = [
      { subjectCode: 'CS8591', subjectName: 'Computer Networks', examDate: new Date('2024-04-08'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Block A - Hall 1', semesterNumber: 5 },
      { subjectCode: 'CS8501', subjectName: 'Theory of Computation', examDate: new Date('2024-04-11'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Block A - Hall 2', semesterNumber: 5 },
      { subjectCode: 'CS8502', subjectName: 'Software Engineering', examDate: new Date('2024-04-15'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Block B - Hall 1', semesterNumber: 5 },
      { subjectCode: 'CS8092', subjectName: 'Web Technology', examDate: new Date('2024-04-18'), session: 'AN', startTime: '02:00 PM', endTime: '05:00 PM', venue: 'Block B - Hall 3', semesterNumber: 5 },
      { subjectCode: 'CS8581', subjectName: 'Networks Lab', examDate: new Date('2024-04-22'), session: 'FN', startTime: '10:00 AM', endTime: '01:00 PM', venue: 'Network Lab - 301', semesterNumber: 5 },
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
        academicYear: '2022-2023'
      },
    });

    console.log(`✅ Academic profile created for ${student.name}`);
    console.log(`   CGPA: ${profile.cgpa}`);
    console.log(`   Semesters: ${profile.semesters.length}`);
    console.log(`   Achievements: ${profile.achievements.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seedProfile();
