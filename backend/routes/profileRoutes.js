const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  getStudentProfile,
  upsertSemesterResult,
  addFeeRecord,
  addAchievement,
  deleteAchievement,
  setExamTimetable,
  getAllStudents,
} = require('../controllers/profileController');

// Student — /me and /my both work
router.get('/me', protect, authorize('student'), getMyProfile);
router.get('/my', protect, authorize('student'), getMyProfile);

router.post('/achievement', protect, authorize('student', 'management'), addAchievement);
router.delete('/achievement/:achievementId', protect, authorize('student', 'management'), deleteAchievement);

// Staff + Management — view student profile
router.get('/students', protect, authorize('staff', 'management'), getAllStudents);
router.get('/student/:studentId', protect, authorize('staff', 'management', 'student'), getStudentProfile);

// Management only
router.post('/semester-result', protect, authorize('management'), upsertSemesterResult);
router.post('/fee', protect, authorize('management'), addFeeRecord);
router.post('/exam-timetable', protect, authorize('management'), setExamTimetable);

module.exports = router;
