// routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getSchools, 
  getSchool, 
  createSchool, 
  updateSchool, 
  deleteSchool, 
  toggleSchoolStatus 
} = require('../controllers/schoolController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, schoolSchema } = require('../validators');

router.route('/')
  .get(protect, getSchools)
  .post(protect, authorize('super_admin'), validate(schoolSchema), createSchool);

router.route('/:id')
  .get(protect, getSchool)
  .put(protect, authorize('super_admin'), validate(schoolSchema), updateSchool)
  .delete(protect, authorize('super_admin'), deleteSchool);

router.patch('/:id/toggle-status', protect, authorize('super_admin'), toggleSchoolStatus);

module.exports = router;
