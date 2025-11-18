// routes/pinRoutes.js
const express = require('express');
const router = express.Router();
const { getPINs, generatePINs, deletePIN } = require('../controllers/pinController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, pinGenerationSchema } = require('../validators');

router.route('/')
  .get(protect, authorize('super_admin', 'school_admin'), getPINs)
  .post(protect, authorize('super_admin', 'school_admin'), validate(pinGenerationSchema), generatePINs);

router.delete('/:id', protect, authorize('super_admin', 'school_admin'), deletePIN);

module.exports = router;