const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTimetable } = require('../controllers/timetableController');

router.get('/', protect, getTimetable);

module.exports = router;