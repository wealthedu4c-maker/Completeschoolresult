
// ============================================
// controllers/userController.js (KEY METHODS UPDATED)
// ============================================
const { User, School } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, school, isActive } = req.query;

    const where = {};

    if (req.user.role === 'school_admin') {
      where.schoolId = req.user.schoolId;
    } else if (school) {
      where.schoolId = school;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await User.findAll({
      where,
      include: [
        {
          model: School,
          as: 'school',
          attributes: ['name', 'code']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['firstName', 'lastName']
        }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const count = await User.count({ where });

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

exports.createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, school } = req.body;

    if (req.user.role === 'school_admin') {
      req.body.schoolId = req.user.schoolId;
      
      if (role === 'super_admin' || role === 'school_admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create admin users'
        });
      }
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      schoolId: role === 'super_admin' ? null : (school || req.body.schoolId),
      createdById: req.user.id,
      isActive: true
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};
