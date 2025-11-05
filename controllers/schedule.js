const Schedule = require("../models/schedule");

// Create or update schedule
exports.setSchedule = async (req, res) => {
  try {
    const { course, yearLevel, startTime, endTime } = req.body;

    const schedule = await Schedule.findOneAndUpdate(
      { course, yearLevel },
      { startTime, endTime },
      { upsert: true, new: true } // create if not exist
    );

    res.json({ message: "Schedule saved", schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ course: 1, yearLevel: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const updated = await Schedule.findByIdAndUpdate(
      req.params.id,
      { startTime, endTime },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update schedule" });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    res.json({ message: "Schedule deleted successfully", deleted });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};
