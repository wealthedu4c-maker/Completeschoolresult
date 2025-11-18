// controllers/pinRequestController.js
const PINRequest = require('../models/PINRequest');
const PIN = require('../models/PIN');
const { v4: uuidv4 } = require('uuid');

const generateUniquePIN = () => {
  return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
};

// @desc    Get all PIN requests (Super Admin)
// @route   GET /api/pin-requests
// @access  Private (Super Admin)
exports.getPINRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, school } = req.query;
    const query = {};

    if (status) query.status = status;
    if (school) query.school = school;

    const requests = await PINRequest.find(query)
      .populate('school', 'name code')
      .populate('requestedBy', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await PINRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
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

// @desc    Get my PIN requests (School Admin)
// @route   GET /api/pin-requests/my-requests
// @access  Private (School Admin)
exports.getMyPINRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { school: req.user.school };

    if (status) query.status = status;

    const requests = await PINRequest.find(query)
      .populate('requestedBy', 'firstName lastName')
      .populate('processedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await PINRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
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

// @desc    Create PIN request
// @route   POST /api/pin-requests
// @access  Private (School Admin)
exports.createPINRequest = async (req, res, next) => {
  try {
    const { session, term, quantity } = req.body; // ✅ REMOVED: reason

    // Check if there's already a pending request for same session/term
    const existingRequest = await PINRequest.findOne({
      school: req.user.school,
      session,
      term,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this session and term'
      });
    }

    const request = await PINRequest.create({
      school: req.user.school,
      requestedBy: req.user._id,
      session,
      term,
      quantity
      // ✅ REMOVED: reason
    });

    const populatedRequest = await PINRequest.findById(request._id)
      .populate('school', 'name code')
      .populate('requestedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'PIN request submitted successfully',
      data: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve PIN request
// @route   PATCH /api/pin-requests/:id/approve
// @access  Private (Super Admin)
exports.approvePINRequest = async (req, res, next) => {
  try {
    const request = await PINRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'PIN request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be approved'
      });
    }

    // Generate PINs
    const { expiryDays = 90 } = req.body;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const pins = [];
    const pinIds = [];

    for (let i = 0; i < request.quantity; i++) {
      const pinDoc = await PIN.create({
        school: request.school,
        pin: generateUniquePIN(),
        session: request.session,
        term: request.term,
        expiryDate,
        generatedBy: req.user._id
      });
      pins.push(pinDoc);
      pinIds.push(pinDoc._id);
    }

    // Update request
    request.status = 'approved';
    request.processedBy = req.user._id;
    request.processedAt = Date.now();
    request.generatedPINs = pinIds;
    await request.save();

    const populatedRequest = await PINRequest.findById(request._id)
      .populate('school', 'name code')
      .populate('requestedBy', 'firstName lastName')
      .populate('processedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `PIN request approved. ${request.quantity} PINs generated successfully`,
      data: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject PIN request
// @route   PATCH /api/pin-requests/:id/reject
// @access  Private (Super Admin)
exports.rejectPINRequest = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const request = await PINRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'PIN request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be rejected'
      });
    }

    request.status = 'rejected';
    request.processedBy = req.user._id;
    request.processedAt = Date.now();
    request.rejectionReason = rejectionReason;
    await request.save();

    const populatedRequest = await PINRequest.findById(request._id)
      .populate('school', 'name code')
      .populate('requestedBy', 'firstName lastName')
      .populate('processedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'PIN request rejected',
      data: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};