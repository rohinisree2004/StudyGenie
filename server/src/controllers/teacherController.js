import progressService from '../services/progressService.js';

/**
 * @desc    Get teacher dashboard high-level metrics & alerts
 * @route   GET /api/teacher/dashboard-stats
 * @access  Private (Teacher, Admin)
 */
export const getTeacherDashboardStats = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const role = req.user.role;

    const data = await progressService.getTeacherDashboardSummary(teacherId, role);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get students enrolled in teacher's assigned subjects with search, filter, and sort
 * @route   GET /api/teacher/students
 * @access  Private (Teacher, Admin)
 */
export const getTeacherStudentsList = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { subjectId, search = '', status = 'all', sort = 'studyHours_desc' } = req.query;

    const cohortData = await progressService.getTeacherCohortProgress(teacherId, subjectId);

    let filteredStudents = [...(cohortData.students || [])];

    // Search filter by name or email
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filteredStudents = filteredStudents.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status && status !== 'all') {
      filteredStudents = filteredStudents.filter((s) => s.status === status);
    }

    // Sorting
    switch (sort) {
      case 'name_asc':
        filteredStudents.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        filteredStudents.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'mastery_asc':
        filteredStudents.sort((a, b) => (a.topicCompletionRate || 0) - (b.topicCompletionRate || 0));
        break;
      case 'mastery_desc':
        filteredStudents.sort((a, b) => (b.topicCompletionRate || 0) - (a.topicCompletionRate || 0));
        break;
      case 'quizScore_desc':
        filteredStudents.sort((a, b) => (b.averageQuizScore || 0) - (a.averageQuizScore || 0));
        break;
      case 'quizScore_asc':
        filteredStudents.sort((a, b) => (a.averageQuizScore || 0) - (b.averageQuizScore || 0));
        break;
      case 'studyHours_asc':
        filteredStudents.sort((a, b) => (a.studyHours || 0) - (b.studyHours || 0));
        break;
      case 'studyHours_desc':
      default:
        filteredStudents.sort((a, b) => (b.studyHours || 0) - (a.studyHours || 0));
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        cohortSummary: cohortData.cohortSummary,
        assignedSubjects: cohortData.assignedSubjects,
        totalFiltered: filteredStudents.length,
        students: filteredStudents,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed student performance deep-dive in teacher's subjects
 * @route   GET /api/teacher/students/:studentId
 * @access  Private (Teacher, Admin)
 */
export const getTeacherStudentDetail = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user._id;
    const role = req.user.role;

    const data = await progressService.getTeacherStudentDetailedPerformance(
      teacherId,
      studentId,
      req.query,
      role
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get class roster & student performance for a specific subject
 * @route   GET /api/teacher/subjects/:subjectId/students
 * @access  Private (Teacher, Admin)
 */
export const getSubjectStudents = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user._id;
    const role = req.user.role;

    const data = await progressService.getSubjectStudentsRoster(
      teacherId,
      subjectId,
      req.query,
      role
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
