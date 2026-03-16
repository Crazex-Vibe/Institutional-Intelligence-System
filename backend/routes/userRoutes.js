const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAllUsers, addStudent, addStaff, editUser, toggleStatus, getUser } = require('../controllers/userController');

// Management only
router.get('/', protect, authorize('management'), getAllUsers);
router.post('/add-student', protect, authorize('management'), addStudent);
router.post('/add-staff', protect, authorize('management'), addStaff);
router.put('/:id', protect, authorize('management'), editUser);
router.put('/:id/toggle-status', protect, authorize('management'), toggleStatus);

// Staff can view students and staff (read only)
router.get('/:id', protect, authorize('management', 'staff'), getUser);

module.exports = router;
