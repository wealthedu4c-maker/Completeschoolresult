// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, registerSchema, loginSchema } = require('../validators');

router.post('/register', protect, authorize('super_admin', 'school_admin'), validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/profile', protect, updateProfile); // ✅ NEW

module.exports = router;