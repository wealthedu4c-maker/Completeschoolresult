// controllers/assignmentController.js
const TeacherAssignment = require('../models/TeacherAssignment');

exports.getAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, academicYear, teacher, class: classId } = req.query;
    const query = {};

    if (req.user.role !== 'super_admin') {
      query.school = req.user.school;
    } else if (req.query.school) {
      query.school = req.query.school;
    }

    if (academicYear) query.academicYear = academicYear;
    if (teacher) query.teacher = teacher;
    if (classId) query.class = classId;

    const assignments = await TeacherAssignment.find(query)
      .populate('school', 'name code')
      .populate('teacher', 'firstName lastName email')
      .populate('subject', 'name code')
      .populate('class', 'name level grade arm')
      .populate('assignedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await TeacherAssignment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assignments,
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

exports.getTeacherAssignments = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const query = { teacher: req.params.teacherId };

    if (req.user.role !== 'super_admin') {
      query.school = req.user.school;
    }

    if (academicYear) query.academicYear = academicYear;

    const assignments = await TeacherAssignment.find(query)
      .populate('subject', 'name code')
      .populate('class', 'name level grade arm')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    req.body.assignedBy = req.user._id;
    
    if (req.user.role !== 'super_admin') {
      req.body.school = req.user.school;
    }

    const assignment = await TeacherAssignment.create(req.body);

    const populatedAssignment = await TeacherAssignment.findById(assignment._id)
      .populate('teacher', 'firstName lastName email')
      .populate('subject', 'name code')
      .populate('class', 'name level grade arm');

    res.status(201).json({
      success: true,
      message: 'Teacher assigned successfully',
      data: populatedAssignment
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment removed successfully'
    });
  } catch (error) {
    next(error);
  }
};