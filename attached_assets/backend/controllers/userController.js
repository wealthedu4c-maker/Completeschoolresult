// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Super Admin, School Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, school, isActive } = req.query;

    const query = {};

    // School Admin can only see users from their school
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

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
      .populate('school', 'name code')
      .populate('createdBy', 'firstName lastName')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('school', 'name code')
      .populate('createdBy', 'firstName lastName')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // School Admin can only view users from their school
    if (req.user.role === 'school_admin' && user.school._id.toString() !== req.user.school.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Super Admin, School Admin)
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, school } = req.body;

    // School Admin can only create users for their school
    if (req.user.role === 'school_admin') {
      req.body.school = req.user.school;
      
      // School Admin cannot create super_admin or school_admin for other schools
      if (role === 'super_admin' || role === 'school_admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create admin users'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      school: role === 'super_admin' ? null : school || req.body.school,
      createdBy: req.user._id,
      isActive: true
    });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Super Admin, School Admin)
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // School Admin can only update users from their school
    if (req.user.role === 'school_admin') {
      if (user.school.toString() !== req.user.school.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }

      // School Admin cannot change role to admin
      if (req.body.role && (req.body.role === 'super_admin' || req.body.role === 'school_admin')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change user role to admin'
        });
      }
    }

    // Don't allow password update through this endpoint
    delete req.body.password;

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password').populate('school', 'name code');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete super admin
    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin user'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Super Admin, School Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // School Admin can only toggle users from their school
    if (req.user.role === 'school_admin' && user.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this user'
      });
    }

    // Cannot deactivate super admin
    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate super admin user'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Private (Super Admin, School Admin)
exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // School Admin can only reset passwords for users from their school
    if (req.user.role === 'school_admin' && user.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset password for this user'
      });
    }

    // Generate default password or use provided one
    const defaultPassword = req.body.password || 'Password@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        temporaryPassword: defaultPassword
      }
    });
  } catch (error) {
    next(error);
  }
};