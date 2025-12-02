// ============================================
// controllers/schoolController.js (COMPLETE UPDATED VERSION)
// ============================================
const { School, User } = require('../models');
const { Op } = require('sequelize');

exports.getSchools = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const schools = await School.findAll({
      where,
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['firstName', 'lastName', 'email']
      }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const count = await School.count({ where });

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

exports.getSchool = async (req, res, next) => {
  try {
    const school = await School.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

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

exports.createSchool = async (req, res, next) => {
  try {
    req.body.createdById = req.user.id;

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

exports.updateSchool = async (req, res, next) => {
  try {
    const school = await School.findByPk(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    await school.update(req.body);

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSchool = async (req, res, next) => {
  try {
    const school = await School.findByPk(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const usersCount = await User.count({ where: { schoolId: req.params.id } });

    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete school with existing users. Deactivate instead.'
      });
    }

    await school.destroy();

    res.status(200).json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleSchoolStatus = async (req, res, next) => {
  try {
    const school = await School.findByPk(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    await school.update({ isActive: !school.isActive });

    res.status(200).json({
      success: true,
      message: `School ${school.isActive ? 'activated' : 'deactivated'} successfully`,
      data: school
    });
  } catch (error) {
    next(error);
  }
};
