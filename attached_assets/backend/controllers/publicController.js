// controllers/publicController.js
const School = require('../models/School');
const Student = require('../models/Student');
const Result = require('../models/Result');
const PIN = require('../models/PIN');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

exports.checkResult = async (req, res, next) => {
  try {
    const { schoolCode, admissionNumber, session, term, pin } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find school
    const school = await School.findOne({ code: schoolCode, isActive: true });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found or inactive'
      });
    }

    // Find student
    const student = await Student.findOne({
      school: school._id,
      admissionNumber: admissionNumber,
      isActive: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find and validate PIN
    const pinDoc = await PIN.findOne({ 
      pin: pin, 
      school: school._id,
      session,
      term
    });

    if (!pinDoc) {
      return res.status(404).json({
        success: false,
        message: 'Invalid PIN or PIN not found for this session/term'
      });
    }

    // Check if PIN is expired
    if (new Date() > pinDoc.expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'PIN has expired'
      });
    }

    // Check if PIN is already used
    if (pinDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'PIN has already been used',
        usedBy: pinDoc.usedBy
      });
    }

    // Check max attempts
    if (pinDoc.attempts.length >= pinDoc.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded for this PIN'
      });
    }

    // Find result
    const result = await Result.findOne({
      school: school._id,
      student: student._id,
      session,
      term,
      status: 'approved'
    }).populate('school').populate('student');

    if (!result) {
      // Log failed attempt
      pinDoc.attempts.push({
        admissionNumber,
        attemptedAt: Date.now(),
        ipAddress,
        success: false
      });
      await pinDoc.save();

      return res.status(404).json({
        success: false,
        message: 'Result not found or not yet approved'
      });
    }

    // Mark PIN as used
    pinDoc.isUsed = true;
    pinDoc.usedBy = {
      admissionNumber: student.admissionNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      usedAt: Date.now(),
      ipAddress
    };
    pinDoc.attempts.push({
      admissionNumber,
      attemptedAt: Date.now(),
      ipAddress,
      success: true
    });
    await pinDoc.save();

    res.status(200).json({
      success: true,
      message: 'Result retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadResultPDF = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.resultId)
      .populate('school')
      .populate('student');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Read HTML template
    const templatePath = path.join(__dirname, '../templates/result.html');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);

    // Prepare data
    const htmlContent = template({
      school: result.school,
      student: result.student,
      result: result,
      generatedDate: new Date().toLocaleDateString()
    });

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=result-${result.student.admissionNumber}-${result.session}-${result.term}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};