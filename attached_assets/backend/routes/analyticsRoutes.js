// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/auth');

router.get('/dashboard', protect, getDashboardStats);

module.exports = router;
