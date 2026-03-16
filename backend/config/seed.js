require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('./db');

const seedUsers = [
  {
    name: 'Admin Management',
    email: 'management@college.edu',
    password: 'admin123',
    role: 'management',
    managementProfile: {
      employeeId: 'MGT001',
      designation: 'Principal',
      department: 'Administration',
    },
  },
  {
    name: 'Mr.V.Ashwin',
    email: 'staff@college.edu',
    password: 'staff123',
    role: 'staff',
    staffProfile: {
      staffId: 'STF001',
      department: 'Aritifial Intelligence and Data Science',
      designation: 'Associate Professor',
      subjects: ['Data Structures', 'Algorithms', 'DBMS'],
    },
  },
  {
    name: 'Anand Balaji F.S',
    email: 'student@college.edu',
    password: 'student123',
    role: 'student',
    studentProfile: {
      rollNumber: '812023243008',
      umisId: 'UMIS2021001',
      emisId: 'EMIS2021001',
      department: 'Artificial Intelligence and Data Science',
      semester: 6,
      section: 'A',
      batch: '2023-2027',
      parentEmail: 'parent@gmail.com',
      parentPhone: '999999999',
      cgpa: 8.27,
      feeStatus: 'paid',
      scholarshipStatus: 'approved',
    },
  },
];

const seed = async () => {
  await connectDB();
  try {
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    for (const userData of seedUsers) {
      await User.create(userData);
      console.log(`✅ Created ${userData.role}: ${userData.email} / ${userData.password}`);
    }

    console.log('\n🎉 Seed complete! Demo credentials:');
    console.log('   Management : management@college.edu / admin123');
    console.log('   Staff      : staff@college.edu / staff123');
    console.log('   Student    : student@college.edu / student123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
