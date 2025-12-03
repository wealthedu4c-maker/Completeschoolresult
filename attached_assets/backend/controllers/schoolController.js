const School = require('../models/School');
const User = require('../models/User');

// @desc    Get all schools
// @route   GET /api/schools
// @access  Private
exports.getSchools = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const schools = await School.find(query)
      .populate('createdBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await School.countDocuments(query);

    res.status(200).json({
      success: true,
      data: schools,
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

// @desc    Get single school
// @route   GET /api/schools/:id
// @access  Private
exports.getSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create school
// @route   POST /api/schools
// @access  Private (Super Admin)
exports.createSchool = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    const school = await School.create(req.body);

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private (Super Admin)
exports.updateSchool = async (req, res, next) => {
  try {
    let school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private (Super Admin)
exports.deleteSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check if school has users
    const usersCount = await User.countDocuments({ school: req.params.id });

    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete school with existing users. Deactivate instead.'
      });
    }

    await school.deleteOne();

    res.status(200).json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle school status
// @route   PATCH /api/schools/:id/toggle-status
// @access  Private (Super Admin)
exports.toggleSchoolStatus = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    school.isActive = !school.isActive;
    await school.save();

    res.status(200).json({
      success: true,
      message: `School ${school.isActive ? 'activated' : 'deactivated'} successfully`,
      data: school
    });
  } catch (error) {
    next(error);
  }
};