// routes/subjectRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getSubjects, 
  getSubject, 
  createSubject, 
  updateSubject, 
  deleteSubject 
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(protect, getSubjects)
  .post(protect, authorize('school_admin'), createSubject);

router.route('/:id')
  .get(protect, getSubject)
  .put(protect, authorize('school_admin'), updateSubject)
  .delete(protect, authorize('school_admin'), deleteSubject);

module.exports = router;