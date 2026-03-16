const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCIAEntry, saveCIAMarks, publishCIA,
  getStaffCIARecords, getMyCIAMarks, getClassCIASummary,
  submitAssignment, createAssignment,
  getMyAssignments, getStaffAssignments,
} = require('../controllers/ciaController');

// Staff
router.get('/entry', protect, authorize('staff'), getCIAEntry);
router.post('/save', protect, authorize('staff'), saveCIAMarks);
router.put('/:id/publish', protect, authorize('staff'), publishCIA);
router.get('/staff/records', protect, authorize('staff'), getStaffCIARecords);
router.post('/assignment/create', protect, authorize('staff'), createAssignment);
router.get('/staff/assignments', protect, authorize('staff'), getStaffAssignments);

// Student
router.get('/my-marks', protect, authorize('student'), getMyCIAMarks);
router.get('/assignments/my', protect, authorize('student'), getMyAssignments);
router.post('/assignment/submit', protect, authorize('student'), submitAssignment);

// Management
router.get('/summary', protect, authorize('management'), getClassCIASummary);

module.exports = router;
