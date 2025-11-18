// controllers/teacherController.js
const User = require('../models/User');

exports.getTeachers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, school } = req.query;
    const query = { role: 'teacher' };

    if (req.user.role === 'school_admin') {
      query.school = req.user.school;
    } else if (school) {
      query.school = school;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await User.find(query)
      .populate('school', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: teachers,
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

exports.getTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findById(req.params.id).populate('school', 'name code');

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    next(error);
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    req.body.role = 'teacher';
    req.body.createdBy = req.user._id;

    if (req.user.role === 'school_admin') {
      req.body.school = req.user.school;
    }

    const hashedPassword = await require('bcryptjs').hash(req.body.password, 10);
    req.body.password = hashedPassword;

    const teacher = await User.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: teacher
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (req.body.password) {
      req.body.password = await require('bcryptjs').hash(req.body.password, 10);
    }

    const updatedTeacher = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    await teacher.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};