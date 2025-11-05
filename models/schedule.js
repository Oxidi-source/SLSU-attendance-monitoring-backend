const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: true,
    },
    yearLevel: {
      type: String,
      required: true,
    },
    startTime: {
      type: String, // e.g. "07:30"
      required: true,
    },
    endTime: {
      type: String, // e.g. "17:00"
      required: true,
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ course: 1, yearLevel: 1 }, { unique: true });
// prevent duplicate schedule for same course + year

module.exports = mongoose.model("Schedule", scheduleSchema);
