// controllers/pinController.js
const PIN = require('../models/PIN');
const { v4: uuidv4 } = require('uuid');

const generateUniquePIN = () => {
  return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
};

exports.getPINs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, school, session, term, isUsed } = req.query;
    const query = {};

    if (req.user.role !== 'super_admin') {
      query.school = req.user.school;
    } else if (school) {
      query.school = school;
    }

    if (session) query.session = session;
    if (term) query.term = term;
    if (isUsed !== undefined) query.isUsed = isUsed === 'true';

    const pins = await PIN.find(query)
      .populate('school', 'name code')
      .populate('generatedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await PIN.countDocuments(query);

    res.status(200).json({
      success: true,
      data: pins,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.generatePINs = async (req, res, next) => {
  try {
    const { school, session, term, quantity, expiryDays } = req.body;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const pins = [];
    
    for (let i = 0; i < quantity; i++) {
      pins.push({
        school,
        pin: generateUniquePIN(),
        session,
        term,
        expiryDate,
        generatedBy: req.user._id
      });
    }

    const createdPINs = await PIN.insertMany(pins);

    res.status(201).json({
      success: true,
      message: `${quantity} PINs generated successfully`,
      data: createdPINs
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePIN = async (req, res, next) => {
  try {
    const pin = await PIN.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'PIN not found'
      });
    }

    if (pin.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete used PIN'
      });
    }

    await pin.deleteOne();

    res.status(200).json({
      success: true,
      message: 'PIN deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};