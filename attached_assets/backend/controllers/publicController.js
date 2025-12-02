// ============================================
// controllers/publicController.js (UPDATED WITH REGISTRATION)
// ============================================
const { School, Student, Result, PIN, User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// @desc    Register a new school (PUBLIC ENDPOINT)
// @route   POST /api/public/register-school
// @access  Public
exports.registerSchool = async (req, res, next) => {
  try {
    const {
      // School details
      schoolName,
      schoolCode,
      address,
      city,
      state,
      country,
      phone,
      schoolEmail,
      logo,
      motto,
      
      // Admin user details
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      adminPhone
    } = req.body;

    // Validate required fields
    if (!schoolName || !schoolCode || !address || !city || !state || !phone || !schoolEmail ||
        !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if school code already exists
    const existingSchool = await School.findOne({ 
      where: { code: schoolCode.toUpperCase() } 
    });

    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School with this code already exists. Please use a different code.'
      });
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ 
      where: { email: adminEmail.toLowerCase() } 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // First create super admin reference (to satisfy foreign key)
    // Find or create a system user for createdBy
    let systemUser = await User.findOne({ where: { role: 'super_admin' } });
    
    if (!systemUser) {
      // This shouldn't happen but just in case
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);
      systemUser = await User.create({
        email: 'superadmin@smartresult.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true
      });
    }

    // Create school
    const school = await School.create({
      name: schoolName,
      code: schoolCode.toUpperCase(),
      address,
      city,
      state,
      country: country || 'Nigeria',
      phone,
      email: schoolEmail.toLowerCase(),
      logo: logo || null,
      motto: motto || null,
      isActive: true,
      createdById: systemUser.id
    });

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create school admin user
    const schoolAdmin = await User.create({
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      phoneNumber: adminPhone || null,
      role: 'school_admin',
      schoolId: school.id,
      isActive: true,
      createdById: systemUser.id
    });

    // Return success response (don't send password)
    const adminResponse = schoolAdmin.toJSON();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: 'School registered successfully! You can now login with your credentials.',
      data: {
        school: {
          id: school.id,
          name: school.name,
          code: school.code,
          email: school.email
        },
        admin: adminResponse
      }
    });

  } catch (error) {
    console.error('School registration error:', error);
    next(error);
  }
};

// @desc    Check result with PIN (EXISTING - UPDATED FOR SEQUELIZE)
// @route   POST /api/public/check-result
// @access  Public
exports.checkResult = async (req, res, next) => {
  try {
    const { schoolCode, admissionNumber, session, term, pin } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find school
    const school = await School.findOne({ 
      where: { 
        code: schoolCode.toUpperCase(),
        isActive: true 
      } 
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found or inactive'
      });
    }

    // Find student
    const student = await Student.findOne({
      where: {
        schoolId: school.id,
        admissionNumber: admissionNumber.toUpperCase(),
        isActive: true
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find and validate PIN
    const pinDoc = await PIN.findOne({ 
      where: {
        pin: pin.toUpperCase(),
        schoolId: school.id,
        session,
        term
      }
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
    const attempts = pinDoc.attempts || [];
    if (attempts.length >= pinDoc.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded for this PIN'
      });
    }

    // Find result
    const result = await Result.findOne({
      where: {
        schoolId: school.id,
        studentId: student.id,
        session,
        term,
        status: 'approved'
      },
      include: [
        { model: School, as: 'school' },
        { model: Student, as: 'student' }
      ]
    });

    if (!result) {
      // Log failed attempt
      const newAttempts = [
        ...attempts,
        {
          admissionNumber,
          attemptedAt: new Date(),
          ipAddress,
          success: false
        }
      ];
      await pinDoc.update({ attempts: newAttempts });

      return res.status(404).json({
        success: false,
        message: 'Result not found or not yet approved'
      });
    }

    // Mark PIN as used
    const newAttempts = [
      ...attempts,
      {
        admissionNumber,
        attemptedAt: new Date(),
        ipAddress,
        success: true
      }
    ];

    await pinDoc.update({
      isUsed: true,
      usedBy: {
        admissionNumber: student.admissionNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        usedAt: new Date(),
        ipAddress
      },
      attempts: newAttempts
    });

    res.status(200).json({
      success: true,
      message: 'Result retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Check result error:', error);
    next(error);
  }
};

// @desc    Download result PDF (EXISTING - NO CHANGES NEEDED)
// @route   GET /api/public/result-pdf/:resultId
// @access  Public
exports.downloadResultPDF = async (req, res, next) => {
  try {
    const result = await Result.findByPk(req.params.resultId, {
      include: [
        { model: School, as: 'school' },
        { model: Student, as: 'student' }
      ]
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // PDF generation code (puppeteer/handlebars)
    // Note: You'll need to install puppeteer and handlebars if not already
    // For now, return JSON - implement PDF later
    res.status(200).json({
      success: true,
      message: 'PDF generation not yet implemented. Here is the result data.',
      data: result
    });

  } catch (error) {
    console.error('Download PDF error:', error);
    next(error);
  }
};
