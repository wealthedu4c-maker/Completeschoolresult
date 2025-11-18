const Joi = require('joi');

// Auth validation
exports.registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('school_admin', 'teacher').required(),
  school: Joi.string().when('role', {
    is: Joi.valid('school_admin', 'teacher'),
    then: Joi.required()
  })
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// School validation
exports.schoolSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required().uppercase(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().default('Nigeria'),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  logo: Joi.string().uri().optional(),
  motto: Joi.string().optional()
});

// Student validation (UPDATED - removed parent fields, made admissionNumber optional)
exports.studentSchema = Joi.object({
  school: Joi.string().optional(),
  admissionNumber: Joi.string().uppercase().optional(),
  autoGenerate: Joi.boolean().optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  otherNames: Joi.string().optional(),
  gender: Joi.string().valid('Male', 'Female').required(),
  class: Joi.string().required(),
  classArm: Joi.string().optional(),
  address: Joi.string().optional()
});

// Result validation
exports.resultSchema = Joi.object({
  school: Joi.string().required(),
  student: Joi.string().required(),
  session: Joi.string().required(),
  term: Joi.string().valid('First', 'Second', 'Third').required(),
  class: Joi.string().required(),
  subjects: Joi.array().items(
    Joi.object({
      subject: Joi.string().required(),
      ca1: Joi.number().min(0).max(10).default(0),
      ca2: Joi.number().min(0).max(10).default(0),
      exam: Joi.number().min(0).max(80).default(0)
    })
  ).min(1).required(),
  teacherComment: Joi.string().optional(),
  principalComment: Joi.string().optional(),
  attendance: Joi.object({
    present: Joi.number().min(0).default(0),
    absent: Joi.number().min(0).default(0),
    total: Joi.number().min(0).default(0)
  }).optional()
});

// PIN validation
exports.pinGenerationSchema = Joi.object({
  school: Joi.string().required(),
  session: Joi.string().required(),
  term: Joi.string().valid('First', 'Second', 'Third').required(),
  quantity: Joi.number().min(1).max(1000).required(),
  expiryDays: Joi.number().min(1).max(365).default(90)
});

// ✅ UPDATED: PIN Request validation (removed reason)
exports.pinRequestSchema = Joi.object({
  session: Joi.string().required(),
  term: Joi.string().valid('First', 'Second', 'Third').required(),
  quantity: Joi.number().min(1).max(1000).required()
  // ✅ REMOVED: reason field
});

exports.checkResultSchema = Joi.object({
  schoolCode: Joi.string().required().uppercase(),
  admissionNumber: Joi.string().required().uppercase(),
  session: Joi.string().required(),
  term: Joi.string().valid('First', 'Second', 'Third').required(),
  pin: Joi.string().required().uppercase()
});

// Class validation (UPDATED - Primary added)
exports.classSchema = Joi.object({
  school: Joi.string().optional(),
  name: Joi.string().required(),
  level: Joi.string().valid('Primary', 'JSS', 'SS').required(), // ✅ UPDATED
  grade: Joi.number().min(1).max(6).required(), // ✅ UPDATED: max changed from 3 to 6
  arm: Joi.string().optional(),
  academicYear: Joi.string().required(),
  capacity: Joi.number().min(0).optional()
});

// Subject validation
exports.subjectSchema = Joi.object({
  school: Joi.string().optional(),
  name: Joi.string().required(),
  code: Joi.string().required().uppercase(),
  category: Joi.string().valid('Core', 'Elective', 'Vocational').default('Core'),
  description: Joi.string().optional()
});

// Teacher Assignment validation
exports.assignmentSchema = Joi.object({
  school: Joi.string().optional(),
  teacher: Joi.string().required(),
  subject: Joi.string().required(),
  class: Joi.string().required(),
  academicYear: Joi.string().required()
});

// User validation
exports.userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('super_admin', 'school_admin', 'teacher').required(),
  school: Joi.string().when('role', {
    is: Joi.valid('school_admin', 'teacher'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Validation middleware
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    next();
  };
};