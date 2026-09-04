import progressService from '../services/progressService.js';
import Subject from '../models/Subject.js';

/**
 * @desc    Get student overall progress dashboard data
 * @route   GET /api/progress/dashboard
 * @access  Private (Student: own data; Teacher/Admin: can query by studentId)
 */
export const getStudentProgress = async (req, res, next) => {
  try {
    const { period = 'daily', studentId } = req.query;

    let targetStudentId = req.user._id;

    // If teacher or admin requests another student's progress
    if (studentId && ['teacher', 'admin'].includes(req.user.role)) {
      targetStudentId = studentId;
    }

    const data = await progressService.getStudentDashboardProgress(targetStudentId, { period });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed subject progress breakdown for student
 * @route   GET /api/progress/subjects/:subjectId
 * @access  Private
 */
export const getSubjectProgress = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { studentId } = req.query;

    let targetStudentId = req.user._id;
    if (studentId && ['teacher', 'admin'].includes(req.user.role)) {
      targetStudentId = studentId;
    }

    const data = await progressService.getSubjectDeepDiveProgress(targetStudentId, subjectId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found or no progress recorded.',
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get periodic time-series analytics (daily, weekly, monthly)
 * @route   GET /api/progress/analytics
 * @access  Private
 */
export const getPeriodicAnalytics = async (req, res, next) => {
  try {
    const { period = 'daily', subjectId, studentId } = req.query;

    let targetStudentId = req.user._id;
    if (studentId && ['teacher', 'admin'].includes(req.user.role)) {
      targetStudentId = studentId;
    }

    const data = await progressService.getPeriodicStudyAnalytics(targetStudentId, period, subjectId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get cohort progress for teacher's enrolled students
 * @route   GET /api/progress/teacher/students
 * @access  Private (Teacher, Admin)
 */
export const getTeacherStudentsProgress = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const teacherId = req.user._id;

    const data = await progressService.getTeacherCohortProgress(teacherId, subjectId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed progress of a specific student in teacher's assigned subjects
 * @route   GET /api/progress/teacher/students/:studentId
 * @access  Private (Teacher, Admin)
 */
export const getTeacherSingleStudentProgress = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user._id;

    // Check if student is enrolled in at least one course taught by this teacher (unless admin)
    if (req.user.role === 'teacher') {
      const isEnrolled = await Subject.exists({
        teacher: teacherId,
        enrolledStudents: studentId,
        status: 'active',
      });

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This student is not enrolled in any of your courses.',
        });
      }
    }

    const data = await progressService.getStudentDashboardProgress(studentId, { period: 'daily' });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform-wide learning statistics
 * @route   GET /api/progress/admin/overview
 * @access  Private (Admin)
 */
export const getAdminOverview = async (req, res, next) => {
  try {
    const data = await progressService.getAdminPlatformProgress();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
