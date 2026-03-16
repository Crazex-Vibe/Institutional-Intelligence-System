const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  sendCIAReport, sendCIAReportToClass,
  sendAttendanceAlerts, sendSemesterReport, getAnalytics,
} = require('../controllers/reportsController');

// All management only
router.post('/send-cia', protect, authorize('management'), sendCIAReport);
router.post('/send-cia-class', protect, authorize('management'), sendCIAReportToClass);
router.post('/send-attendance-alerts', protect, authorize('management'), sendAttendanceAlerts);
router.post('/send-semester-report', protect, authorize('management'), sendSemesterReport);
router.get('/analytics', protect, authorize('management'), getAnalytics);

module.exports = router;
