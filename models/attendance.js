// models/attendance.js
const mongoose = require("mongoose");
const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "role", // dynamically refer to the model based on `role`
  },
  role: {
    type: String,
    enum: ["student", "professor", "staff"],
    required: true,
  },
  date: { type: String, required: true },
  timeIn: { type: String },
  timeOut: { type: String },
  status: { type: String, default: "On Time" },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
