// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  bulkUploadStudents 
} = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, studentSchema } = require('../validators');

router.route('/')
  .get(protect, getStudents)
  .post(protect, authorize('school_admin', 'teacher'), validate(studentSchema), createStudent);

router.post('/bulk-upload', protect, authorize('school_admin'), bulkUploadStudents);

router.route('/:id')
  .get(protect, getStudent)
  .put(protect, authorize('school_admin', 'teacher'), validate(studentSchema), updateStudent)
  .delete(protect, authorize('school_admin'), deleteStudent);

module.exports = router;