// controllers/resultController.js
const Result = require('../models/Result');
const Student = require('../models/Student');

exports.getResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, school, session, term, status } = req.query;
    const query = {};

    if (req.user.role !== 'super_admin') {
      query.school = req.user.school;
    } else if (school) {
      query.school = school;
    }

    if (session) query.session = session;
    if (term) query.term = term;
    if (status) query.status = status;

    if (search) {
      const students = await Student.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { admissionNumber: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.student = { $in: students.map(s => s._id) };
    }

    const results = await Result.find(query)
      .populate('school', 'name code')
      .populate('student', 'firstName lastName admissionNumber')
      .populate('uploadedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Result.countDocuments(query);

    res.status(200).json({
      success: true,
      data: results,
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

exports.getResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('school')
      .populate('student')
      .populate('uploadedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.createResult = async (req, res, next) => {
  try {
    req.body.uploadedBy = req.user._id;

    if (req.user.role !== 'super_admin') {
      req.body.school = req.user.school;
    }

    // Check if result already exists
    const existingResult = await Result.findOne({
      school: req.body.school,
      student: req.body.student,
      session: req.body.session,
      term: req.body.term
    });

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student in this session and term'
      });
    }

    const result = await Result.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.updateResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    if (result.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved result'
      });
    }

    const updatedResult = await Result.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Result updated successfully',
      data: updatedResult
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    if (result.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved result'
      });
    }

    await result.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.submitResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    if (result.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft results can be submitted'
      });
    }

    result.status = 'submitted';
    await result.save();

    res.status(200).json({
      success: true,
      message: 'Result submitted for approval',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.approveResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    if (result.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted results can be approved'
      });
    }

    result.status = 'approved';
    result.approvedBy = req.user._id;
    result.approvedAt = Date.now();
    await result.save();

    res.status(200).json({
      success: true,
      message: 'Result approved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectResult = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    if (result.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted results can be rejected'
      });
    }

    result.status = 'rejected';
    result.rejectionReason = reason;
    await result.save();

    res.status(200).json({
      success: true,
      message: 'Result rejected',
      data: result
    });
  } catch (error) {
    next(error);
  }

  // ✅ NEW: Get teacher's assigned students
// @desc    Get students for teacher's assigned classes
// @route   GET /api/results/my-students
// @access  Private (Teacher)
exports.getMyStudents = async (req, res, next) => {
  try {
    const TeacherAssignment = require('../models/TeacherAssignment');
    const Student = require('../models/Student');

    // Get teacher's assigned classes
    const assignments = await TeacherAssignment.find({
      teacher: req.user._id,
      school: req.user.school
    }).populate('class', '_id name');

    if (!assignments || assignments.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No classes assigned yet'
      });
    }

    // Get unique class IDs
    const classIds = [...new Set(assignments.map(a => a.class._id.toString()))];
    const classNames = assignments.map(a => a.class.name);

    // Get students from these classes
    const students = await Student.find({
      school: req.user.school,
      class: { $in: classNames },
      isActive: true
    }).populate('school', 'name code').sort({ class: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      data: students,
      assignedClasses: classNames
    });
  } catch (error) {
    next(error);
  }
};
};