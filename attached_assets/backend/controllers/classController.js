// controllers/classController.js
const Class = require('../models/Class');

exports.getClasses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, academicYear, level } = req.query;
    const query = {};

    if (req.user.role !== 'super_admin') {
      query.school = req.user.school;
    } else if (req.query.school) {
      query.school = req.query.school;
    }

    if (academicYear) query.academicYear = academicYear;
    if (level) query.level = level;

    const classes = await Class.find(query)
      .populate('school', 'name code')
      .populate('createdBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ level: 1, grade: 1, arm: 1 });

    const count = await Class.countDocuments(query);

    res.status(200).json({
      success: true,
      data: classes,
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

exports.getClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('school', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    next(error);
  }
};

exports.createClass = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    
    if (req.user.role !== 'super_admin') {
      req.body.school = req.user.school;
    }

    const classData = await Class.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classData
    });
  } catch (error) {
    next(error);
  }
};

exports.updateClass = async (req, res, next) => {
  try {
    const classData = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: classData
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    await classData.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};