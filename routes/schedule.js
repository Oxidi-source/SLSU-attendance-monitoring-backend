const express = require("express");
const router = express.Router();
const schdeuleController = require("../controllers/schedule");
const API_ENDPOINTS = require("../config/endpointconfig");

router.post(API_ENDPOINTS.SCHEDULE.CREATE, schdeuleController.setSchedule);

router.get(API_ENDPOINTS.SCHEDULE.GET, schdeuleController.getSchedules);
router.put(API_ENDPOINTS.SCHEDULE.UPDATE, schdeuleController.updateSchedule);
router.delete(API_ENDPOINTS.SCHEDULE.DELETE, schdeuleController.deleteSchedule);

module.exports = router;
