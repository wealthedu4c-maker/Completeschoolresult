// controllers/studentController.js
const Student = require('../models/Student');

// Helper function to generate admission number
const generateAdmissionNumber = async (schoolId) => {
  try {
    // Get school code
    const School = require('../models/School');
    const school = await School.findById(schoolId);
    
    if (!school) {
      throw new Error('School not found');
    }

    // Get current year
    const year = new Date().getFullYear();
    
    // Find the last student for this school in current year
    const lastStudent = await Student.findOne({ 
      school: schoolId,
      admissionNumber: new RegExp(`^${school.code}${year}`)
    }).sort({ admissionNumber: -1 });

    let sequence = 1;
    
    if (lastStudent) {
      // Extract sequence number from last admission number
      // Example: GVHS2024005 -> extract 005 -> increment to 006
      const lastSequence = parseInt(lastStudent.admissionNumber.slice(-3));
      sequence = lastSequence + 1;
    }

    // Format: SCHOOLCODE + YEAR + SEQUENCE (3 digits)
    const admissionNumber = `${school.code}${year}${String(sequence).padStart(3, '0')}`;
    
    return admissionNumber;
  } catch (error) {
    throw error;
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, school, class: className } = req.query;
    const query = {};

    if (req.user.role !== 'super_admin') {
      query.school = req.user.school;
    } else if (school) {
      query.school = school;
    }

    if (className) {
      query.class = className;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('school', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Student.countDocuments(query);

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

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('school', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    if (req.user.role !== 'super_admin') {
      req.body.school = req.user.school;
    }

    // Auto-generate admission number if not provided or autoGenerate flag is true
    if (!req.body.admissionNumber || req.body.autoGenerate) {
      req.body.admissionNumber = await generateAdmissionNumber(req.body.school);
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

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkUploadStudents = async (req, res, next) => {
  try {
    const { students, autoGenerate } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid students data'
      });
    }

    const studentsWithMeta = [];

    for (let student of students) {
      const studentData = {
        ...student,
        school: req.user.school,
        createdBy: req.user._id
      };

      // Auto-generate admission number if not provided or autoGenerate is true
      if (!studentData.admissionNumber || autoGenerate) {
        studentData.admissionNumber = await generateAdmissionNumber(req.user.school);
      }

      studentsWithMeta.push(studentData);
    }

    const createdStudents = await Student.insertMany(studentsWithMeta, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${createdStudents.length} students uploaded successfully`,
      data: createdStudents
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const successCount = error.result?.nInserted || 0;
      return res.status(207).json({
        success: true,
        message: `${successCount} students uploaded successfully. Some duplicates were skipped.`,
        data: error.insertedDocs || []
      });
    }
    next(error);
  }
};