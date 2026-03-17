const Timetable = require('../models/Timetable');

const getTimetable = async (req, res) => {
  try {
    const { department, semester, section, staffId } = req.query;
    let query = staffId
      ? { 'schedule.staffId': staffId }
      : { department, semester: Number(semester), section };

    const timetable = await Timetable.findOne(query).populate('schedule.staffId', 'name');
    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTimetable };