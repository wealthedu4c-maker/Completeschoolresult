// ============================================
// controllers/studentController.js (KEY METHODS)
// ============================================
const { Student, School } = require('../models');
const { Op } = require('sequelize');

const generateAdmissionNumber = async (schoolId) => {
  try {
    const school = await School.findByPk(schoolId);
    
    if (!school) {
      throw new Error('School not found');
    }

    const year = new Date().getFullYear();
    
    const lastStudent = await Student.findOne({
      where: {
        schoolId,
        admissionNumber: {
          [Op.like]: `${school.code}${year}%`
        }
      },
      order: [['admissionNumber', 'DESC']]
    });

    let sequence = 1;
    
    if (lastStudent) {
      const lastSequence = parseInt(lastStudent.admissionNumber.slice(-3));
      sequence = lastSequence + 1;
    }

    return `${school.code}${year}${String(sequence).padStart(3, '0')}`;
  } catch (error) {
    throw error;
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, school, class: className } = req.query;
    const where = {};

    if (req.user.role !== 'super_admin') {
      where.schoolId = req.user.schoolId;
    } else if (school) {
      where.schoolId = school;
    }

    if (className) where.class = className;

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { admissionNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const students = await Student.findAll({
      where,
      include: [{
        model: School,
        as: 'school',
        attributes: ['name', 'code']
      }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const count = await Student.count({ where });

    res.status(200).json({
      success: true,
      data: students,
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

exports.createStudent = async (req, res, next) => {
  try {
    req.body.createdById = req.user.id;

    if (req.user.role !== 'super_admin') {
      req.body.schoolId = req.user.schoolId;
    }

    if (!req.body.admissionNumber || req.body.autoGenerate) {
      req.body.admissionNumber = await generateAdmissionNumber(req.body.schoolId);
    }

    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};
