const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getClassStudents,
  markAttendance,
  getSessionAttendance,
  getMyAttendance,
  getClassAttendanceOverview,
  getLowAttendanceStudents,
} = require('../controllers/attendanceController');

// Staff routes
router.get('/class-students', protect, authorize('staff', 'management'), getClassStudents);
router.post('/mark', protect, authorize('staff'), markAttendance);
router.get('/session', protect, authorize('staff', 'management'), getSessionAttendance);

// Student routes
router.get('/my', protect, authorize('student'), getMyAttendance);

// Management routes
router.get('/overview', protect, authorize('management'), getClassAttendanceOverview);
router.get('/low-attendance', protect, authorize('management', 'staff'), getLowAttendanceStudents);

module.exports = router;
