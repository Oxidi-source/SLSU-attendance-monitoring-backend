const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const API_ENDPOINTS = require("../config/endpointconfig");

//it becomes "/user/register" and in index.js it has /api so the sample route will be localhost://5001/api/user/register in front end
//it becomes "/user/login"

//user routes
router.post(API_ENDPOINTS.USER.REGISTER, authController.registerStudent);
router.post(API_ENDPOINTS.USER.LOGIN, authController.loginUser);
router.put(API_ENDPOINTS.USER.UPDATE, authController.updateStudent);
router.get(API_ENDPOINTS.USER.ALL, authController.getAllUsers);
router.get(API_ENDPOINTS.USER.USER, authController.getCurrentUser);
router.get(API_ENDPOINTS.USER.SINGLE, authController.getStudent);

//admin
router.post(API_ENDPOINTS.ADMIN.REGISTER, authController.registerAdmin);
router.post(API_ENDPOINTS.ADMIN.LOGIN, authController.loginAdmin);
router.get(API_ENDPOINTS.ADMIN.ADMIN, authController.getCurrentAdmin);

//professor routes
router.post(API_ENDPOINTS.PROFESSOR.LOGIN, authController.loginProfessor);
router.post(API_ENDPOINTS.PROFESSOR.REGISTER, authController.registerProfessor);
router.get(API_ENDPOINTS.PROFESSOR.ALL, authController.getAllProf);
router.put(API_ENDPOINTS.PROFESSOR.UPDATE, authController.updateProfessor);
router.get(API_ENDPOINTS.PROFESSOR.SINGLE, authController.getProf);

//staff routes
router.post(API_ENDPOINTS.STAFF.LOGIN, authController.loginProfessor);
router.post(API_ENDPOINTS.STAFF.REGISTER, authController.registerStaff);
router.get(API_ENDPOINTS.STAFF.ALL, authController.getAllStaff);
router.get(API_ENDPOINTS.STAFF.SINGLE, authController.getStaff);
router.put(API_ENDPOINTS.STAFF.UPDATE, authController.updateStaff);

module.exports = router;
