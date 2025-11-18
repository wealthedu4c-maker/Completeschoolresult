// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect, authorize, checkSchoolAccess } = require('../middlewares/auth');

router.route('/')
  .get(protect, getTeachers)
  .post(protect, authorize('super_admin', 'school_admin'), createTeacher);

router.route('/:id')
  .get(protect, getTeacher)
  .put(protect, authorize('super_admin', 'school_admin'), updateTeacher)
  .delete(protect, authorize('super_admin', 'school_admin'), deleteTeacher);

module.exports = router;