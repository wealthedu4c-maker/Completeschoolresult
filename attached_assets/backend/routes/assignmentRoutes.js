// routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAssignments, 
  createAssignment, 
  deleteAssignment,
  getTeacherAssignments 
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(protect, getAssignments)
  .post(protect, authorize('school_admin'), createAssignment);

router.route('/:id')
  .delete(protect, authorize('school_admin'), deleteAssignment);

router.get('/teacher/:teacherId', protect, getTeacherAssignments);

module.exports = router;