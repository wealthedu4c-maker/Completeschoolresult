// routes/pinRequestRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getPINRequests, 
  createPINRequest, 
  approvePINRequest, 
  rejectPINRequest,
  getMyPINRequests
} = require('../controllers/pinRequestController');
const { protect, authorize } = require('../middlewares/auth');

// School Admin routes
router.post('/', protect, authorize('school_admin'), createPINRequest);
router.get('/my-requests', protect, authorize('school_admin'), getMyPINRequests);

// Super Admin routes
router.get('/', protect, authorize('super_admin'), getPINRequests);
router.patch('/:id/approve', protect, authorize('super_admin'), approvePINRequest);
router.patch('/:id/reject', protect, authorize('super_admin'), rejectPINRequest);

module.exports = router;