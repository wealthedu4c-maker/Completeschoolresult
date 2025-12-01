// controllers/analyticsController.js
const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const Result = require('../models/Result');
const PIN = require('../models/PIN');

exports.getDashboardStats = async (req, res, next) => {
  try {
    let stats = {};

    if (req.user.role === 'super_admin') {
      stats = {
        schools: await School.countDocuments({ isActive: true }),
        totalSchools: await School.countDocuments(),
        schoolAdmins: await User.countDocuments({ role: 'school_admin', isActive: true }),
        teachers: await User.countDocuments({ role: 'teacher', isActive: true }),
        students: await Student.countDocuments({ isActive: true }),
        results: await Result.countDocuments(),
        approvedResults: await Result.countDocuments({ status: 'approved' }),
        pendingResults: await Result.countDocuments({ status: 'submitted' }),
        totalPINs: await PIN.countDocuments(),
        usedPINs: await PIN.countDocuments({ isUsed: true })
      };
    } else if (req.user.role === 'school_admin') {
      stats = {
        teachers: await User.countDocuments({ 
          role: 'teacher', 
          school: req.user.school, 
          isActive: true 
        }),
        students: await Student.countDocuments({ 
          school: req.user.school, 
          isActive: true 
        }),
        results: await Result.countDocuments({ school: req.user.school }),
        approvedResults: await Result.countDocuments({ 
          school: req.user.school, 
          status: 'approved' 
        }),
        pendingResults: await Result.countDocuments({ 
          school: req.user.school, 
          status: 'submitted' 
        }),
        draftResults: await Result.countDocuments({ 
          school: req.user.school, 
          status: 'draft' 
        }),
        totalPINs: await PIN.countDocuments({ school: req.user.school }),
        usedPINs: await PIN.countDocuments({ 
          school: req.user.school, 
          isUsed: true 
        }),
        unusedPINs: await PIN.countDocuments({ 
          school: req.user.school, 
          isUsed: false 
        })
      };
    } else if (req.user.role === 'teacher') {
      stats = {
        students: await Student.countDocuments({ 
          school: req.user.school, 
          isActive: true 
        }),
        myResults: await Result.countDocuments({ 
          uploadedBy: req.user._id 
        }),
        approvedResults: await Result.countDocuments({ 
          uploadedBy: req.user._id, 
          status: 'approved' 
        }),
        pendingResults: await Result.countDocuments({ 
          uploadedBy: req.user._id, 
          status: 'submitted' 
        }),
        draftResults: await Result.countDocuments({ 
          uploadedBy: req.user._id, 
          status: 'draft' 
        }),
        rejectedResults: await Result.countDocuments({ 
          uploadedBy: req.user._id, 
          status: 'rejected' 
        })
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};                  