const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendancecontroller");
const API_ENDPOINTS = require("../config/endpointconfig");

router.post(
  API_ENDPOINTS.ATTENDANCE.ATTENDANCE,
  attendanceController.recordAttendance
);

router.get(
  API_ENDPOINTS.ATTENDANCE.GET,
  attendanceController.getAttendanceSummary
);
router.get(
  API_ENDPOINTS.ATTENDANCE.GETSUMMARYEVERYDAY,
  attendanceController.getDailyAttendanceSummary
);
router.get(
  API_ENDPOINTS.ATTENDANCE.GETTODAY,
  attendanceController.getTodayPresent
);

router.get(
  API_ENDPOINTS.ATTENDANCE.GETUSERATTENDANCE,
  attendanceController.getUserAttendance
);
router.get(
  API_ENDPOINTS.ATTENDANCE.GETPRESENTBYDATE,
  attendanceController.getAttendanceByDate
);
module.exports = router;
