// routes/resultRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getResults, 
  getResult, 
  createResult, 
  updateResult, 
  deleteResult,
  submitResult,
  approveResult,
  rejectResult,
  getMyStudents // ✅ NEW
} = require('../controllers/resultController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, resultSchema } = require('../validators');

router.route('/')
  .get(protect, getResults)
  .post(protect, authorize('teacher', 'school_admin'), validate(resultSchema), createResult);

router.get('/my-students', protect, authorize('teacher'), getMyStudents); // ✅ NEW

router.route('/:id')
  .get(protect, getResult)
  .put(protect, authorize('teacher', 'school_admin'), validate(resultSchema), updateResult)
  .delete(protect, authorize('school_admin'), deleteResult);

router.patch('/:id/submit', protect, authorize('teacher'), submitResult);
router.patch('/:id/approve', protect, authorize('school_admin'), approveResult);
router.patch('/:id/reject', protect, authorize('school_admin'), rejectResult);

module.exports = router;