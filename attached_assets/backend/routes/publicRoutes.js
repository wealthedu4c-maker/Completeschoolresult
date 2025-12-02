// routes/publicRoutes.js (UPDATED WITH REGISTRATION)
const express = require('express');
const router = express.Router();
const { 
  registerSchool,
  checkResult, 
  downloadResultPDF 
} = require('../controllers/publicController');
const { validate, checkResultSchema } = require('../validators');

// Public school registration endpoint
router.post('/register-school', registerSchool);

// Existing endpoints
router.post('/check-result', validate(checkResultSchema), checkResult);
router.get('/result-pdf/:resultId', downloadResultPDF);

module.exports = router;
