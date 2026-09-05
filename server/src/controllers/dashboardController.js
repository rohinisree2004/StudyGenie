import mongoose from 'mongoose';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Recommendation from '../models/Recommendation.js';
import Material from '../models/Material.js';
import Note from '../models/Note.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import Conversation from '../models/Conversation.js';
import StudyPlan from '../models/StudyPlan.js';
import Summary from '../models/Summary.js';
import { progressService } from '../services/progressService.js';

/**
 * @desc    Get consolidated Student Dashboard & Learning Analytics
 * @route   GET /api/dashboard/student
 * @access  Private (Student)
 */
export const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Date boundaries for today (local time)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch Enrolled Subjects
    const enrolledSubjects = await Subject.find({ enrolledStudents: studentId })
      .select('title code color category teacher status')
      .populate('teacher', 'name email avatar')
      .lean();

    const enrolledSubjectIds = enrolledSubjects.map((s) => s._id);

    // 2. Parallel Data Queries
    const [
      todaySessions,
      upcomingSessions,
      pendingTasks,
      pendingAssignments,
      quizAttempts,
      streakData,
      hoursAggregate,
      activeRecommendation,
      recentMaterials,
      recentNotes,
      unreadCount,
      recentNotifications,
      topicsStats,
    ] = await Promise.all([
      // Today's scheduled sessions
      StudySession.find({
        user: studentId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate('subject', 'title code color')
        .populate('topic', 'title')
        .sort('startTime')
        .lean(),

      // Next upcoming sessions (if today has few)
      StudySession.find({
        user: studentId,
        startTime: { $gt: endOfDay },
      })
        .populate('subject', 'title code color')
        .populate('topic', 'title')
        .sort('startTime')
        .limit(3)
        .lean(),

      // Pending tasks
      Task.find({
        user: studentId,
        isCompleted: false,
        status: { $ne: 'completed' },
      })
        .populate('subject', 'title code color')
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),

      // Pending course assignments (not yet submitted by student)
      Assignment.find({
        subject: { $in: enrolledSubjectIds },
        status: 'published',
        'submissions.student': { $ne: studentId },
      })
        .populate('subject', 'title code color')
        .sort({ dueDate: 1 })
        .limit(4)
        .lean(),

      // Quiz attempts
      QuizAttempt.find({ user: studentId })
        .populate('quiz', 'title difficulty passingScore totalQuestions')
        .populate('subject', 'title code color')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Consecutive streak calculation
      progressService.calculateStudyStreak(studentId),

      // Total study hours aggregate
      StudySession.aggregate([
        { $match: { user: studentId, status: 'completed' } },
        { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' }, totalSessions: { $sum: 1 } } },
      ]),

      // Latest active AI recommendation
      Recommendation.findOne({ student: studentId, status: 'active' })
        .sort({ createdAt: -1 })
        .lean(),

      // Recent materials in enrolled subjects
      Material.find({ subject: { $in: enrolledSubjectIds }, isPublic: true })
        .populate('subject', 'title code color')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      // Recent student notes
      Note.find({ user: studentId })
        .populate('subject', 'title code color')
        .sort({ updatedAt: -1 })
        .limit(3)
        .lean(),

      // Unread notifications count
      Notification.countDocuments({ recipient: studentId, isRead: false }),

      // Recent notifications
      Notification.find({ recipient: studentId })
        .sort({ isRead: 1, createdAt: -1 })
        .limit(4)
        .lean(),

      // Topic completion across enrolled subjects
      Promise.all(
        enrolledSubjects.map(async (subj) => {
          const totalTopics = await Topic.countDocuments({ subject: subj._id });
          const completedTopics = await Topic.countDocuments({
            subject: subj._id,
            completedBy: studentId,
          });
          const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
          return {
            id: subj._id,
            title: subj.title,
            code: subj.code,
            color: subj.color,
            category: subj.category,
            teacher: subj.teacher,
            totalTopics,
            completedTopics,
            progress: percentage,
          };
        })
      ),
    ]);

    // Format quiz performance
    const totalQuizAttempts = quizAttempts.length;
    let quizAvgScore = 0;
    let passingAttemptsCount = 0;

    if (totalQuizAttempts > 0) {
      const sum = quizAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
      quizAvgScore = Math.round(sum / totalQuizAttempts);
      passingAttemptsCount = quizAttempts.filter((a) => a.isPassed).length;
    }
    const passingRate = totalQuizAttempts > 0 ? Math.round((passingAttemptsCount / totalQuizAttempts) * 100) : 0;

    const totalMinutes = hoursAggregate[0]?.totalMinutes || 0;
    const completedSessionsCount = hoursAggregate[0]?.totalSessions || 0;
    const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

    res.status(200).json({
      success: true,
      data: {
        todaySessions,
        upcomingSessions,
        pendingTasks,
        pendingAssignments,
        subjectProgress: topicsStats,
        quizPerformance: {
          totalAttempts: totalQuizAttempts,
          averageScore: quizAvgScore,
          passingRate,
          recentAttempts: quizAttempts.slice(0, 4),
        },
        studyStats: {
          currentStreak: streakData.currentStreak || 0,
          longestStreak: streakData.longestStreak || 0,
          totalStudyHours,
          completedSessionsCount,
          dailyGoalHours: req.user.preferences?.dailyStudyGoalHours || 4,
        },
        activeRecommendation,
        recentMaterials,
        recentNotes,
        unreadNotificationsCount: unreadCount,
        recentNotifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get consolidated Teacher Dashboard & Faculty Analytics
 * @route   GET /api/dashboard/teacher
 * @access  Private (Teacher, Admin)
 */
export const getTeacherDashboard = async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    // 1. Fetch Assigned Subjects
    const assignedSubjects = await Subject.find({ teacher: teacherId })
      .select('title code color category status enrolledStudents')
      .lean();

    const assignedSubjectIds = assignedSubjects.map((s) => s._id);

    // Deduplicate all unique students across assigned subjects
    const uniqueStudentIdSet = new Set();
    assignedSubjects.forEach((subj) => {
      if (subj.enrolledStudents) {
        subj.enrolledStudents.forEach((id) => uniqueStudentIdSet.add(id.toString()));
      }
    });
    const uniqueStudentIds = Array.from(uniqueStudentIdSet).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // 2. Parallel Metrics Calculation
    const [
      assignments,
      quizAttempts,
      studySessionsAggregate,
      recentMaterials,
      recentAnnouncements,
      subjectsWithDetails,
    ] = await Promise.all([
      // Assignments in teacher's courses
      Assignment.find({ subject: { $in: assignedSubjectIds } })
        .populate('subject', 'title code color')
        .sort({ createdAt: -1 })
        .lean(),

      // Quiz attempts in teacher's courses
      QuizAttempt.find({ subject: { $in: assignedSubjectIds } })
        .populate('quiz', 'title difficulty')
        .populate('subject', 'title code color')
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .lean(),

      // Aggregate student study hours in teacher's courses
      StudySession.aggregate([
        { $match: { subject: { $in: assignedSubjectIds }, status: 'completed' } },
        { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' }, totalSessions: { $sum: 1 } } },
      ]),

      // Recent materials uploaded by teacher
      Material.find({ uploadedBy: teacherId })
        .populate('subject', 'title code color')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),

      // Recent course announcements
      Announcement.find({ teacher: teacherId })
        .populate('subject', 'title code color')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),

      // Deep dive into each subject
      Promise.all(
        assignedSubjects.map(async (subj) => {
          const [topicCount, materialCount, assignmentCount, quizCount] = await Promise.all([
            Topic.countDocuments({ subject: subj._id }),
            Material.countDocuments({ subject: subj._id }),
            Assignment.countDocuments({ subject: subj._id }),
            Quiz.countDocuments({ subject: subj._id }),
          ]);

          let avgProgress = 0;
          if (subj.enrolledStudents && subj.enrolledStudents.length > 0 && topicCount > 0) {
            const completedCount = await Topic.countDocuments({
              subject: subj._id,
              completedBy: { $in: subj.enrolledStudents },
            });
            avgProgress = Math.round(
              (completedCount / (topicCount * subj.enrolledStudents.length)) * 100
            );
          }

          return {
            id: subj._id,
            title: subj.title,
            code: subj.code,
            color: subj.color,
            category: subj.category,
            status: subj.status,
            studentCount: subj.enrolledStudents ? subj.enrolledStudents.length : 0,
            topicCount,
            materialCount,
            assignmentCount,
            quizCount,
            averageProgress: avgProgress,
          };
        })
      ),
    ]);

    // Compute Assignment Completion Stats
    let totalExpectedSubmissions = 0;
    let totalActualSubmissions = 0;
    let totalGradedSubmissions = 0;
    let totalPendingReview = 0;

    const assignmentList = assignments.slice(0, 5).map((a) => {
      const subject = assignedSubjects.find((s) => s._id.toString() === a.subject?._id?.toString());
      const expected = subject?.enrolledStudents?.length || 0;
      const actual = a.submissions ? a.submissions.length : 0;
      const graded = a.submissions ? a.submissions.filter((sub) => sub.status === 'graded').length : 0;
      const pending = a.submissions ? a.submissions.filter((sub) => sub.status === 'submitted').length : 0;

      totalExpectedSubmissions += expected;
      totalActualSubmissions += actual;
      totalGradedSubmissions += graded;
      totalPendingReview += pending;

      return {
        id: a._id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
        expectedSubmissions: expected,
        submissionsCount: actual,
        gradedCount: graded,
        pendingReview: pending,
        completionRate: expected > 0 ? Math.round((actual / expected) * 100) : 0,
      };
    });

    // Quiz Statistics
    const totalQuizAttempts = quizAttempts.length;
    let avgQuizScore = 0;
    if (totalQuizAttempts > 0) {
      const sum = quizAttempts.reduce((acc, q) => acc + (q.score || 0), 0);
      avgQuizScore = Math.round(sum / totalQuizAttempts);
    }

    // Student Performance (On track vs needing support)
    let studentsOnTrack = 0;
    let studentsNeedingSupport = 0;

    uniqueStudentIds.forEach((studentId) => {
      const studentAttempts = quizAttempts.filter(
        (a) => a.user?._id?.toString() === studentId.toString()
      );
      if (studentAttempts.length > 0) {
        const studentAvg =
          studentAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / studentAttempts.length;
        if (studentAvg >= 70) studentsOnTrack++;
        else studentsNeedingSupport++;
      } else {
        studentsOnTrack++; // Default on track until assessed
      }
    });

    // Weak Areas Identification
    // Group quiz attempts by topic if available or extract lower scoring quizzes
    const quizScoreMap = {};
    quizAttempts.forEach((att) => {
      const title = att.quiz?.title || 'General Evaluation';
      if (!quizScoreMap[title]) quizScoreMap[title] = { total: 0, count: 0 };
      quizScoreMap[title].total += att.score || 0;
      quizScoreMap[title].count += 1;
    });

    const weakAreas = Object.entries(quizScoreMap)
      .map(([title, val]) => ({
        topicOrQuiz: title,
        averageScore: Math.round(val.total / val.count),
        attemptCount: val.count,
      }))
      .filter((w) => w.averageScore < 75)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 4);

    const totalMinutes = studySessionsAggregate[0]?.totalMinutes || 0;
    const totalStudentStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalAssignedSubjects: assignedSubjects.length,
          totalUniqueStudents: uniqueStudentIds.length,
          studentsOnTrack,
          studentsNeedingSupport,
          averageQuizScore: avgQuizScore,
          totalStudentStudyHours,
          totalPendingReview,
        },
        assignedSubjects: subjectsWithDetails,
        recentAssignments: assignmentList,
        assignmentOverview: {
          totalExpectedSubmissions,
          totalActualSubmissions,
          totalGradedSubmissions,
          totalPendingReview,
          overallCompletionRate:
            totalExpectedSubmissions > 0
              ? Math.round((totalActualSubmissions / totalExpectedSubmissions) * 100)
              : 0,
        },
        quizStatistics: {
          totalAttempts: totalQuizAttempts,
          averageScore: avgQuizScore,
        },
        weakAreas,
        recentMaterials,
        recentAnnouncements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get consolidated Admin Dashboard & Platform-wide Analytics
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin only)
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;

    // Compute date cutoff based on range
    const now = new Date();
    let cutoffDate = new Date(0); // All time default
    if (range === '7d') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const [
      totalUsers,
      studentsCount,
      teachersCount,
      adminsCount,
      activeUsersCount,
      suspendedUsersCount,
      totalSubjects,
      activeSubjects,
      totalTopics,
      totalMaterials,
      storageAggregate,
      totalQuizzes,
      totalQuizAttempts,
      quizScoreStats,
      studySessionsAggregate,
      studyActivityTrend,
      aiRecommendationsCount,
      aiStudyPlansCount,
      aiConversationsCount,
      aiSummariesCount,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ accountStatus: 'active' }),
      User.countDocuments({ accountStatus: 'suspended' }),

      Subject.countDocuments(),
      Subject.countDocuments({ status: 'active' }),
      Topic.countDocuments(),

      Material.countDocuments(),
      Material.aggregate([{ $group: { _id: null, totalBytes: { $sum: '$fileSize' } } }]),

      Quiz.countDocuments(),
      QuizAttempt.countDocuments(),

      // Quiz score bracket distribution
      QuizAttempt.aggregate([
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$score' },
            passingCount: { $sum: { $cond: [{ $eq: ['$isPassed', true] }, 1, 0] } },
            bracketExcellent: { $sum: { $cond: [{ $gte: ['$score', 90] }, 1, 0] } },
            bracketGood: { $sum: { $cond: [{ $and: [{ $gte: ['$score', 75] }, { $lt: ['$score', 90] }] }, 1, 0] } },
            bracketAverage: { $sum: { $cond: [{ $and: [{ $gte: ['$score', 50] }, { $lt: ['$score', 75] }] }, 1, 0] } },
            bracketLow: { $sum: { $cond: [{ $lt: ['$score', 50] }, 1, 0] } },
          },
        },
      ]),

      // Total study sessions and hours
      StudySession.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' }, totalCompleted: { $sum: 1 } } },
      ]),

      // Study activity volume trend over the selected period
      StudySession.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: cutoffDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            hours: { $sum: { $divide: ['$durationMinutes', 60] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 14 },
      ]),

      // AI platform utilization counts
      Recommendation.countDocuments(),
      StudyPlan.countDocuments(),
      Conversation.countDocuments(),
      Summary.countDocuments(),

      // Recent registered users
      User.find()
        .select('name email role accountStatus institution createdAt avatar')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const totalStorageBytes = storageAggregate[0]?.totalBytes || 0;
    const totalStorageMB = Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10;
    const totalStudyHours = Math.round(((studySessionsAggregate[0]?.totalMinutes || 0) / 60) * 10) / 10;

    const quizAnalytics = quizScoreStats[0] || {
      averageScore: 0,
      passingCount: 0,
      bracketExcellent: 0,
      bracketGood: 0,
      bracketAverage: 0,
      bracketLow: 0,
    };

    const passingRate =
      totalQuizAttempts > 0
        ? Math.round((quizAnalytics.passingCount / totalQuizAttempts) * 100)
        : 0;

    const memoryUsage = process.memoryUsage();
    const systemHealth = {
      dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      dbHost: mongoose.connection.host || 'MongoDB Atlas',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryHeapMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 10) / 10,
    };

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          users: {
            total: totalUsers,
            students: studentsCount,
            teachers: teachersCount,
            admins: adminsCount,
            active: activeUsersCount,
            suspended: suspendedUsersCount,
          },
          curriculum: {
            totalSubjects,
            activeSubjects,
            totalTopics,
          },
          resources: {
            totalMaterials,
            totalStorageMB,
            totalQuizzes,
            totalQuizAttempts,
          },
          activity: {
            totalStudyHours,
            completedSessions: studySessionsAggregate[0]?.totalCompleted || 0,
          },
        },
        studyActivityTrend: studyActivityTrend.map((p) => ({
          date: p._id,
          hours: Math.round(p.hours * 10) / 10,
          sessionsCount: p.count,
        })),
        quizPerformanceAnalytics: {
          averageScore: Math.round(quizAnalytics.averageScore || 0),
          passingRate,
          totalAttempts: totalQuizAttempts,
          brackets: {
            excellent: quizAnalytics.bracketExcellent,
            good: quizAnalytics.bracketGood,
            average: quizAnalytics.bracketAverage,
            needsImprovement: quizAnalytics.bracketLow,
          },
        },
        aiUsageStats: {
          recommendationsGenerated: aiRecommendationsCount,
          studyPlansCreated: aiStudyPlansCount,
          conversationsStarted: aiConversationsCount,
          summariesCreated: aiSummariesCount,
        },
        systemHealth,
        recentUsers,
        range,
      },
    });
  } catch (error) {
    next(error);
  }
};
