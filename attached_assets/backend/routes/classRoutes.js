// routes/classRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getClasses, 
  getClass, 
  createClass, 
  updateClass, 
  deleteClass 
} = require('../controllers/classController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(protect, getClasses)
  .post(protect, authorize('school_admin'), createClass);

router.route('/:id')
  .get(protect, getClass)
  .put(protect, authorize('school_admin'), updateClass)
  .delete(protect, authorize('school_admin'), deleteClass);

module.exports = router;