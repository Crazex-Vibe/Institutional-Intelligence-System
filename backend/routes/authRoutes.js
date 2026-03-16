const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Test role-protected routes
router.get('/student-only', protect, authorize('student'), (req, res) => {
  res.json({ success: true, message: 'Student area accessed', user: req.user.name });
});
router.get('/staff-only', protect, authorize('staff'), (req, res) => {
  res.json({ success: true, message: 'Staff area accessed', user: req.user.name });
});
router.get('/management-only', protect, authorize('management'), (req, res) => {
  res.json({ success: true, message: 'Management area accessed', user: req.user.name });
});

module.exports = router;
