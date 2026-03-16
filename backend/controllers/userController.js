const User = require('../models/User');

// ── Helper: generate college email ────────────────────────────────────────────
const generateEmail = (name) => {
  const clean = name.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${clean}@college.edu`;
};

// ── Helper: ensure email is unique ────────────────────────────────────────────
const uniqueEmail = async (baseEmail) => {
  let email = baseEmail;
  let count = 1;
  while (await User.findOne({ email })) {
    const [name, domain] = baseEmail.split('@');
    email = `${name}${count}@${domain}`;
    count++;
  }
  return email;
};

// ── GET all users (students + staff) ─────────────────────────────────────────
// GET /api/users?role=student&department=CS&semester=5&section=A&search=john
const getAllUsers = async (req, res) => {
  try {
    const { role, department, semester, section, search, isActive } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (department) query['studentProfile.department'] = department;
    if (semester) query['studentProfile.semester'] = Number(semester);
    if (section) query['studentProfile.section'] = section;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentProfile.rollNumber': { $regex: search, $options: 'i' } },
        { 'staffProfile.employeeId': { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, users, count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD student ───────────────────────────────────────────────────────────────
// POST /api/users/add-student
const addStudent = async (req, res) => {
  try {
    const {
      name, department, semester, section, batch,
      rollNumber, parentEmail, phone,
    } = req.body;

    if (!name || !department || !semester || !section || !rollNumber) {
      return res.status(400).json({ success: false, message: 'Name, department, semester, section and roll number are required' });
    }

    // Check roll number unique
    const rollExists = await User.findOne({ 'studentProfile.rollNumber': rollNumber });
    if (rollExists) return res.status(400).json({ success: false, message: `Roll number ${rollNumber} already exists` });

    // Generate email
    const baseEmail = generateEmail(name);
    const email = await uniqueEmail(baseEmail);

    // Let the User model's pre-save hook handle hashing
    const tempPassword = rollNumber;

    const student = await User.create({
      name,
      email,
      password: tempPassword,
      role: 'student',
      isActive: true,
      studentProfile: {
        rollNumber, department,
        semester: Number(semester),
        section, batch,
        parentEmail: parentEmail || '',
        cgpa: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: `Student added successfully!`,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        tempPassword,
        rollNumber,
        department, semester, section,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD staff ─────────────────────────────────────────────────────────────────
// POST /api/users/add-staff
const addStaff = async (req, res) => {
  try {
    const { name, department, designation, employeeId, phone, subjects } = req.body;

    if (!name || !department || !employeeId) {
      return res.status(400).json({ success: false, message: 'Name, department and employee ID are required' });
    }

    const empExists = await User.findOne({ 'staffProfile.staffId': employeeId });
    if (empExists) return res.status(400).json({ success: false, message: `Employee ID ${employeeId} already exists` });

    const baseEmail = generateEmail(name);
    const email = await uniqueEmail(baseEmail);

    // Let the User model's pre-save hook handle hashing
    const tempPassword = employeeId;

    const staff = await User.create({
      name, email,
      password: tempPassword,
      role: 'staff',
      isActive: true,
      staffProfile: {
        staffId: employeeId,
        department,
        designation: designation || 'Assistant Professor',
        subjects: subjects ? subjects.split(',').map(s => s.trim()) : [],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Staff added successfully!',
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        tempPassword,
        employeeId,
        department, designation,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── EDIT user ─────────────────────────────────────────────────────────────────
// PUT /api/users/:id
const editUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, phone, parentEmail, department, semester, section, batch, designation, subjects, resetPassword } = req.body;

    if (name) user.name = name;

    if (user.role === 'student') {
      if (phone) user.studentProfile.phone = phone;
      if (parentEmail !== undefined) user.studentProfile.parentEmail = parentEmail;
      if (department) user.studentProfile.department = department;
      if (semester) user.studentProfile.semester = Number(semester);
      if (section) user.studentProfile.section = section;
      if (batch) user.studentProfile.batch = batch;
    }

    if (user.role === 'staff') {
      if (phone) user.staffProfile.phone = phone;
      if (department) user.staffProfile.department = department;
      if (designation) user.staffProfile.designation = designation;
      if (subjects) user.staffProfile.subjects = subjects.split(',').map(s => s.trim());
    }

    // Reset password — plain text, pre-save hook will hash it
    if (resetPassword) {
      const newPass = user.role === 'student'
        ? user.studentProfile.rollNumber
        : user.staffProfile.staffId;
      user.password = newPass;
    }

    await user.save();
    res.json({ success: true, message: 'User updated successfully', user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TOGGLE active status ──────────────────────────────────────────────────────
// PUT /api/users/:id/toggle-status
const toggleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'management') return res.status(400).json({ success: false, message: 'Cannot deactivate management accounts' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `${user.name} has been ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single user ────────────────────────────────────────────────────────────
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllUsers, addStudent, addStaff, editUser, toggleStatus, getUser };