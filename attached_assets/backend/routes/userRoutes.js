// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus,
  resetPassword 
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, userSchema } = require('../validators');

router.route('/')
  .get(protect, authorize('super_admin', 'school_admin'), getUsers)
  .post(protect, authorize('super_admin', 'school_admin'), validate(userSchema), createUser);

router.route('/:id')
  .get(protect, authorize('super_admin', 'school_admin'), getUser)
  .put(protect, authorize('super_admin', 'school_admin'), validate(userSchema), updateUser)
  .delete(protect, authorize('super_admin'), deleteUser);

router.patch('/:id/toggle-status', protect, authorize('super_admin', 'school_admin'), toggleUserStatus);
router.post('/:id/reset-password', protect, authorize('super_admin', 'school_admin'), resetPassword);

module.exports = router;