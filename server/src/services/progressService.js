import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import Assignment from '../models/Assignment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';

/**
 * Format a Date object to YYYY-MM-DD
 */
const formatDateStr = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Subtract days from a date
 */
const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

/**
 * Progress Analytics Service for StudyGenie
 */
export const progressService = {
  /**
   * Calculate current and longest consecutive study streaks (in days)
   * A day counts as active if student completed a study session, task, quiz attempt, or assignment.
   */
  calculateStudyStreak: async (studentId) => {
    const sId = new mongoose.Types.ObjectId(studentId);

    // 1. Gather all active dates
    const [completedSessions, completedTasks, quizAttempts, submittedAssignments] = await Promise.all([
      StudySession.find({ user: sId, status: 'completed' }).select('completedAt startTime').lean(),
      Task.find({ user: sId, isCompleted: true }).select('completedAt updatedAt').lean(),
      QuizAttempt.find({ user: sId }).select('createdAt').lean(),
      Assignment.find({ 'submissions.student': sId }).select('submissions').lean(),
    ]);

    const activeDateSet = new Set();

    completedSessions.forEach((s) => {
      const d = s.completedAt || s.startTime;
      if (d) activeDateSet.add(formatDateStr(d));
    });

    completedTasks.forEach((t) => {
      const d = t.completedAt || t.updatedAt;
      if (d) activeDateSet.add(formatDateStr(d));
    });

    quizAttempts.forEach((q) => {
      if (q.createdAt) activeDateSet.add(formatDateStr(q.createdAt));
    });

    submittedAssignments.forEach((a) => {
      if (a.submissions) {
        a.submissions.forEach((sub) => {
          if (
            sub.student &&
            sub.student.toString() === studentId.toString() &&
            sub.submittedAt &&
            ['submitted', 'completed', 'graded'].includes(sub.status)
          ) {
            activeDateSet.add(formatDateStr(sub.submittedAt));
          }
        });
      }
    });

    const sortedDates = Array.from(activeDateSet).sort();

    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeDaysTotal: 0 };
    }

    // Calculate current streak
    const todayStr = formatDateStr(new Date());
    const yesterdayStr = formatDateStr(subtractDays(new Date(), 1));

    let currentStreak = 0;
    const hasToday = activeDateSet.has(todayStr);
    const hasYesterday = activeDateSet.has(yesterdayStr);

    if (hasToday || hasYesterday) {
      let checkDate = hasToday ? new Date() : subtractDays(new Date(), 1);
      while (true) {
        const cStr = formatDateStr(checkDate);
        if (activeDateSet.has(cStr)) {
          currentStreak += 1;
          checkDate = subtractDays(checkDate, 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let runningStreak = 0;
    let prevDate = null;

    for (const dStr of sortedDates) {
      const currentDate = new Date(dStr);
      if (!prevDate) {
        runningStreak = 1;
      } else {
        const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          runningStreak += 1;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
      prevDate = currentDate;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      activeDaysTotal: sortedDates.length,
    };
  },

  /**
   * Aggregate time-series analytics (daily, weekly, monthly) for interactive charts
   */
  getPeriodicStudyAnalytics: async (studentId, period = 'daily', subjectId = null) => {
    const sId = new mongoose.Types.ObjectId(studentId);

    const sessionMatch = { user: sId, status: 'completed' };
    const taskMatch = { user: sId, isCompleted: true };
    const quizMatch = { user: sId };

    if (subjectId) {
      const subjObjId = new mongoose.Types.ObjectId(subjectId);
      sessionMatch.subject = subjObjId;
      taskMatch.subject = subjObjId;
      quizMatch.subject = subjObjId;
    }

    const [sessions, tasks, quizzes] = await Promise.all([
      StudySession.find(sessionMatch).select('duration startTime completedAt subject').lean(),
      Task.find(taskMatch).select('completedAt updatedAt estimatedDuration').lean(),
      QuizAttempt.find(quizMatch).select('createdAt score passed').lean(),
    ]);

    const now = new Date();

    if (period === 'weekly') {
      // Last 8 weeks
      const points = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        weekEnd.setHours(23, 59, 59, 999);

        let weekMinutes = 0;
        let sessionsCount = 0;
        let tasksCount = 0;
        let quizzesCount = 0;
        let scoreSum = 0;

        sessions.forEach((s) => {
          const d = new Date(s.completedAt || s.startTime);
          if (d >= weekStart && d <= weekEnd) {
            weekMinutes += s.duration || 60;
            sessionsCount += 1;
          }
        });

        tasks.forEach((t) => {
          const d = new Date(t.completedAt || t.updatedAt);
          if (d >= weekStart && d <= weekEnd) {
            tasksCount += 1;
          }
        });

        quizzes.forEach((q) => {
          const d = new Date(q.createdAt);
          if (d >= weekStart && d <= weekEnd) {
            quizzesCount += 1;
            scoreSum += q.score || 0;
          }
        });

        const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        points.push({
          label,
          shortLabel: `W${8 - i}`,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          studyHours: parseFloat((weekMinutes / 60).toFixed(1)),
          sessionsCompleted: sessionsCount,
          tasksCompleted: tasksCount,
          quizzesTaken: quizzesCount,
          averageScore: quizzesCount > 0 ? Math.round(scoreSum / quizzesCount) : 0,
        });
      }
      return points;
    }

    if (period === 'monthly') {
      // Last 6 months
      const points = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

        let monthMinutes = 0;
        let sessionsCount = 0;
        let tasksCount = 0;
        let quizzesCount = 0;
        let scoreSum = 0;

        sessions.forEach((s) => {
          const d = new Date(s.completedAt || s.startTime);
          if (d >= monthStart && d <= monthEnd) {
            monthMinutes += s.duration || 60;
            sessionsCount += 1;
          }
        });

        tasks.forEach((t) => {
          const d = new Date(t.completedAt || t.updatedAt);
          if (d >= monthStart && d <= monthEnd) {
            tasksCount += 1;
          }
        });

        quizzes.forEach((q) => {
          const d = new Date(q.createdAt);
          if (d >= monthStart && d <= monthEnd) {
            quizzesCount += 1;
            scoreSum += q.score || 0;
          }
        });

        const label = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        points.push({
          label,
          shortLabel: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
          studyHours: parseFloat((monthMinutes / 60).toFixed(1)),
          sessionsCompleted: sessionsCount,
          tasksCompleted: tasksCount,
          quizzesTaken: quizzesCount,
          averageScore: quizzesCount > 0 ? Math.round(scoreSum / quizzesCount) : 0,
        });
      }
      return points;
    }

    // Default: 'daily' (Last 14 days)
    const points = [];
    for (let i = 13; i >= 0; i--) {
      const d = subtractDays(now, i);
      const dateStr = formatDateStr(d);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      let dayMinutes = 0;
      let sessionsCount = 0;
      let tasksCount = 0;
      let quizzesCount = 0;
      let scoreSum = 0;

      sessions.forEach((s) => {
        const sDate = new Date(s.completedAt || s.startTime);
        if (sDate >= dayStart && sDate <= dayEnd) {
          dayMinutes += s.duration || 60;
          sessionsCount += 1;
        }
      });

      tasks.forEach((t) => {
        const tDate = new Date(t.completedAt || t.updatedAt);
        if (tDate >= dayStart && tDate <= dayEnd) {
          tasksCount += 1;
        }
      });

      quizzes.forEach((q) => {
        const qDate = new Date(q.createdAt);
        if (qDate >= dayStart && qDate <= dayEnd) {
          quizzesCount += 1;
          scoreSum += q.score || 0;
        }
      });

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayMonth = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      points.push({
        date: dateStr,
        label: dayMonth,
        shortLabel: dayName,
        studyHours: parseFloat((dayMinutes / 60).toFixed(1)),
        sessionsCompleted: sessionsCount,
        tasksCompleted: tasksCount,
        quizzesTaken: quizzesCount,
        averageScore: quizzesCount > 0 ? Math.round(scoreSum / quizzesCount) : 0,
      });
    }

    return points;
  },

  /**
   * Calculate subject-by-subject progress for all enrolled subjects
   */
  getSubjectWiseProgress: async (studentId) => {
    const sId = new mongoose.Types.ObjectId(studentId);

    // 1. Fetch student's enrolled subjects
    const enrolledSubjects = await Subject.find({
      enrolledStudents: sId,
      status: 'active',
    })
      .populate('teacher', 'name email institution')
      .lean();

    if (enrolledSubjects.length === 0) {
      return [];
    }

    const subjectIds = enrolledSubjects.map((s) => s._id);

    // 2. Fetch topics, study sessions, tasks, and quiz attempts in parallel
    const [allTopics, allSessions, allTasks, allAttempts] = await Promise.all([
      Topic.find({ subject: { $in: subjectIds } }).lean(),
      StudySession.find({ user: sId, subject: { $in: subjectIds }, status: 'completed' })
        .select('duration subject completedAt')
        .lean(),
      Task.find({ user: sId, subject: { $in: subjectIds } })
        .select('isCompleted subject')
        .lean(),
      QuizAttempt.find({ user: sId, subject: { $in: subjectIds } })
        .select('score passed subject topic')
        .lean(),
    ]);

    // 3. Map metrics by subject
    const subjectProgressList = enrolledSubjects.map((subject) => {
      const subjIdStr = subject._id.toString();

      // Topics
      const subjTopics = allTopics.filter((t) => t.subject.toString() === subjIdStr);
      const totalTopics = subjTopics.length;
      const completedTopics = subjTopics.filter(
        (t) => t.completedBy && t.completedBy.some((id) => id.toString() === studentId.toString())
      ).length;
      const topicCompletionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Sessions & Study Hours
      const subjSessions = allSessions.filter((s) => s.subject.toString() === subjIdStr);
      const studyMinutes = subjSessions.reduce((acc, s) => acc + (s.duration || 60), 0);
      const studyHours = parseFloat((studyMinutes / 60).toFixed(1));

      // Tasks
      const subjTasks = allTasks.filter((t) => t.subject && t.subject.toString() === subjIdStr);
      const totalTasks = subjTasks.length;
      const completedTasks = subjTasks.filter((t) => t.isCompleted).length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Quizzes
      const subjAttempts = allAttempts.filter((a) => a.subject && a.subject.toString() === subjIdStr);
      const quizAttemptsCount = subjAttempts.length;
      const avgQuizScore =
        quizAttemptsCount > 0
          ? Math.round(subjAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / quizAttemptsCount)
          : null;
      const passedQuizCount = subjAttempts.filter((a) => a.passed).length;
      const quizPassRate =
        quizAttemptsCount > 0 ? Math.round((passedQuizCount / quizAttemptsCount) * 100) : null;

      // Overall Subject Mastery Score (Weighted: 40% topics, 40% quiz score or topic fallback, 20% tasks)
      const effectiveQuizScore = avgQuizScore !== null ? avgQuizScore : topicCompletionRate;
      const masteryScore = Math.round(
        topicCompletionRate * 0.45 + effectiveQuizScore * 0.35 + (totalTasks > 0 ? taskCompletionRate * 0.2 : topicCompletionRate * 0.2)
      );

      return {
        subjectId: subject._id,
        title: subject.title,
        code: subject.code,
        category: subject.category,
        color: subject.color || '#BBD0FF',
        teacher: subject.teacher ? { name: subject.teacher.name, institution: subject.teacher.institution } : null,
        totalTopics,
        completedTopics,
        topicCompletionRate,
        studyHours,
        sessionsCount: subjSessions.length,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        quizAttemptsCount,
        averageQuizScore: avgQuizScore,
        quizPassRate,
        masteryScore: Math.min(masteryScore, 100),
      };
    });

    return subjectProgressList;
  },

  /**
   * Granular topic-by-topic deep dive for a single subject
   */
  getSubjectDeepDiveProgress: async (studentId, subjectId) => {
    const sId = new mongoose.Types.ObjectId(studentId);
    const subjObjId = new mongoose.Types.ObjectId(subjectId);

    const [subject, topics, sessions, tasks, attempts] = await Promise.all([
      Subject.findById(subjObjId).populate('teacher', 'name email institution').lean(),
      Topic.find({ subject: subjObjId }).sort({ order: 1 }).lean(),
      StudySession.find({ user: sId, subject: subjObjId, status: 'completed' }).lean(),
      Task.find({ user: sId, subject: subjObjId }).sort({ dueDate: 1 }).lean(),
      QuizAttempt.find({ user: sId, subject: subjObjId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!subject) {
      return null;
    }

    // Build topic analysis
    const topicDetails = topics.map((topic) => {
      const tIdStr = topic._id.toString();
      const isCompleted = topic.completedBy && topic.completedBy.some((id) => id.toString() === studentId.toString());

      // Topic sessions
      const topicSessions = sessions.filter((s) => s.topic && s.topic.toString() === tIdStr);
      const studyMinutes = topicSessions.reduce((acc, s) => acc + (s.duration || 60), 0);

      // Topic quiz attempts
      const topicAttempts = attempts.filter((a) => a.topic && a.topic.toString() === tIdStr);
      const attemptsCount = topicAttempts.length;
      const avgScore =
        attemptsCount > 0
          ? Math.round(topicAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / attemptsCount)
          : null;
      const latestAttempt = topicAttempts[0] || null;

      // Status flag for Phase 10 AI recommendation preparation
      let status = 'not_started';
      if (isCompleted && (avgScore === null || avgScore >= 70)) {
        status = 'mastered';
      } else if (avgScore !== null && avgScore < 70) {
        status = 'needs_revision';
      } else if (isCompleted || topicSessions.length > 0) {
        status = 'in_progress';
      }

      return {
        _id: topic._id,
        title: topic.title,
        description: topic.description,
        order: topic.order,
        difficulty: topic.difficulty,
        estimatedHours: topic.estimatedHours,
        isCompleted,
        studyHours: parseFloat((studyMinutes / 60).toFixed(1)),
        sessionsCount: topicSessions.length,
        quizAttemptsCount: attemptsCount,
        averageQuizScore: avgScore,
        latestScore: latestAttempt ? latestAttempt.score : null,
        status,
      };
    });

    const totalTopics = topics.length;
    const completedTopicsCount = topicDetails.filter((t) => t.isCompleted).length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 60), 0);

    return {
      subject: {
        _id: subject._id,
        title: subject.title,
        code: subject.code,
        category: subject.category,
        color: subject.color || '#BBD0FF',
        teacher: subject.teacher,
      },
      summary: {
        totalTopics,
        completedTopics: completedTopicsCount,
        completionRate: totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0,
        totalStudyHours: parseFloat((totalMinutes / 60).toFixed(1)),
        totalSessions: sessions.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.isCompleted).length,
        totalQuizAttempts: attempts.length,
        averageQuizScore:
          attempts.length > 0
            ? Math.round(attempts.reduce((acc, a) => acc + (a.score || 0), 0) / attempts.length)
            : null,
      },
      topics: topicDetails,
      tasks: tasks.map((t) => ({
        _id: t._id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        isCompleted: t.isCompleted,
      })),
    };
  },

  /**
   * Identify weak topics and conceptual gaps for immediate focus and Phase 10 AI recommendation contract
   */
  identifyWeakTopics: async (studentId) => {
    const sId = new mongoose.Types.ObjectId(studentId);

    // 1. Fetch attempts with topic and subject
    const attempts = await QuizAttempt.find({ user: sId })
      .populate('topic', 'title difficulty estimatedHours completedBy')
      .populate('subject', 'title code color')
      .lean();

    const topicMap = new Map();

    attempts.forEach((a) => {
      if (!a.topic || !a.topic._id) return;
      const tId = a.topic._id.toString();

      if (!topicMap.has(tId)) {
        topicMap.set(tId, {
          topicId: a.topic._id,
          topicTitle: a.topic.title,
          difficulty: a.topic.difficulty,
          subjectId: a.subject ? a.subject._id : null,
          subjectTitle: a.subject ? a.subject.title : 'General',
          subjectCode: a.subject ? a.subject.code : '',
          subjectColor: a.subject ? a.subject.color : '#BBD0FF',
          scores: [],
          isCompleted: a.topic.completedBy && a.topic.completedBy.some((id) => id.toString() === studentId.toString()),
        });
      }

      topicMap.get(tId).scores.push(a.score || 0);
    });

    const weakTopics = [];

    topicMap.forEach((entry) => {
      const avgScore = Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length);
      // Weak if avg score < 70%
      if (avgScore < 70) {
        weakTopics.push({
          topicId: entry.topicId,
          topicTitle: entry.topicTitle,
          difficulty: entry.difficulty,
          subjectId: entry.subjectId,
          subjectTitle: entry.subjectTitle,
          subjectCode: entry.subjectCode,
          subjectColor: entry.subjectColor,
          averageScore: avgScore,
          attemptsCount: entry.scores.length,
          isCompleted: entry.isCompleted,
          status: 'needs_revision',
          urgency: avgScore < 50 ? 'high' : 'medium',
        });
      }
    });

    // Sort by lowest score first
    return weakTopics.sort((a, b) => a.averageScore - b.averageScore);
  },

  /**
   * Recent chronological activity feed (sessions, tasks, quizzes, assignments)
   */
  getRecentActivityFeed: async (studentId, limit = 8) => {
    const sId = new mongoose.Types.ObjectId(studentId);

    const [recentSessions, recentTasks, recentQuizzes] = await Promise.all([
      StudySession.find({ user: sId, status: 'completed' })
        .populate('subject', 'title color code')
        .populate('topic', 'title')
        .sort({ completedAt: -1, updatedAt: -1 })
        .limit(limit)
        .lean(),
      Task.find({ user: sId, isCompleted: true })
        .populate('subject', 'title color code')
        .sort({ completedAt: -1, updatedAt: -1 })
        .limit(limit)
        .lean(),
      QuizAttempt.find({ user: sId })
        .populate('subject', 'title color code')
        .populate('topic', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const feed = [];

    recentSessions.forEach((s) => {
      feed.push({
        id: s._id,
        type: 'session',
        title: s.title,
        subject: s.subject ? { title: s.subject.title, code: s.subject.code, color: s.subject.color } : null,
        topic: s.topic ? s.topic.title : null,
        durationMinutes: s.duration || 60,
        timestamp: s.completedAt || s.startTime || s.updatedAt,
      });
    });

    recentTasks.forEach((t) => {
      feed.push({
        id: t._id,
        type: 'task',
        title: t.title,
        subject: t.subject ? { title: t.subject.title, code: t.subject.code, color: t.subject.color } : null,
        priority: t.priority,
        timestamp: t.completedAt || t.updatedAt,
      });
    });

    recentQuizzes.forEach((q) => {
      feed.push({
        id: q._id,
        type: 'quiz',
        title: `Completed practice quiz`,
        subject: q.subject ? { title: q.subject.title, code: q.subject.code, color: q.subject.color } : null,
        topic: q.topic ? q.topic.title : null,
        score: q.score,
        passed: q.passed,
        timestamp: q.createdAt,
      });
    });

    // Sort combined feed by timestamp descending
    return feed
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  },

  /**
   * Main student progress dashboard aggregator
   */
  getStudentDashboardProgress: async (studentId, options = {}) => {
    const sId = new mongoose.Types.ObjectId(studentId);

    // Parallel execution of top-level analytics
    const [
      streakInfo,
      chartPoints,
      subjectWiseProgress,
      weakTopics,
      recentFeed,
      studySessionsSummary,
      tasksSummary,
      assignmentsSummary,
      quizSummary,
      upcomingTasks,
      upcomingAssignments,
      upcomingSessions,
    ] = await Promise.all([
      progressService.calculateStudyStreak(studentId),
      progressService.getPeriodicStudyAnalytics(studentId, options.period || 'daily'),
      progressService.getSubjectWiseProgress(studentId),
      progressService.identifyWeakTopics(studentId),
      progressService.getRecentActivityFeed(studentId, 8),

      // 1. Study Sessions Summary
      StudySession.aggregate([
        { $match: { user: sId } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            completedSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            completedMinutes: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$duration', 60] }, 0] },
            },
          },
        },
      ]),

      // 2. Tasks Summary
      Task.aggregate([
        { $match: { user: sId } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] },
            },
          },
        },
      ]),

      // 3. Enrolled Subjects & Assignments Summary
      (async () => {
        const enrolled = await Subject.find({ enrolledStudents: sId, status: 'active' }).select('_id').lean();
        const enrolledIds = enrolled.map((s) => s._id);
        const assignments = await Assignment.find({ subject: { $in: enrolledIds }, status: 'published' }).lean();

        let submittedCount = 0;
        let gradedSum = 0;
        let gradedCount = 0;

        assignments.forEach((a) => {
          if (a.submissions) {
            const sub = a.submissions.find(
              (s) => s.student && s.student.toString() === studentId.toString()
            );
            if (sub && ['submitted', 'completed', 'graded'].includes(sub.status)) {
              submittedCount += 1;
              if (sub.grade !== null && sub.grade !== undefined) {
                gradedSum += sub.grade;
                gradedCount += 1;
              }
            }
          }
        });

        return {
          totalAssignments: assignments.length,
          submittedAssignments: submittedCount,
          averageGrade: gradedCount > 0 ? Math.round(gradedSum / gradedCount) : null,
        };
      })(),

      // 4. Quiz Attempts Summary
      QuizAttempt.aggregate([
        { $match: { user: sId } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            passedCount: {
              $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] },
            },
            totalScore: { $sum: '$score' },
            highestScore: { $max: '$score' },
          },
        },
      ]),

      // 5. Upcoming Academic Workload (for Phase 10 integration)
      Task.find({ user: sId, isCompleted: false, dueDate: { $gte: new Date() } })
        .sort({ dueDate: 1 })
        .limit(5)
        .select('title dueDate priority subject')
        .populate('subject', 'title code')
        .lean(),

      Assignment.find({
        status: 'published',
        dueDate: { $gte: new Date() },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('subject', 'title code')
        .lean(),

      StudySession.find({
        user: sId,
        status: 'scheduled',
        startTime: { $gte: new Date() },
      })
        .sort({ startTime: 1 })
        .limit(5)
        .populate('subject', 'title code')
        .lean(),
    ]);

    // Format Sessions Summary
    const sessResult = studySessionsSummary[0] || { totalSessions: 0, completedSessions: 0, completedMinutes: 0 };
    const totalStudyHours = parseFloat((sessResult.completedMinutes / 60).toFixed(1));
    const sessionCompletionRate =
      sessResult.totalSessions > 0 ? Math.round((sessResult.completedSessions / sessResult.totalSessions) * 100) : 0;

    // Format Tasks Summary
    const taskResult = tasksSummary[0] || { totalTasks: 0, completedTasks: 0 };
    const taskCompletionRate =
      taskResult.totalTasks > 0 ? Math.round((taskResult.completedTasks / taskResult.totalTasks) * 100) : 0;

    // Format Quiz Summary
    const quizResult = quizSummary[0] || { totalAttempts: 0, passedCount: 0, totalScore: 0, highestScore: 0 };
    const quizAverageScore =
      quizResult.totalAttempts > 0 ? Math.round(quizResult.totalScore / quizResult.totalAttempts) : 0;
    const quizPassRate =
      quizResult.totalAttempts > 0 ? Math.round((quizResult.passedCount / quizResult.totalAttempts) * 100) : 0;

    // Format Assignment Submissions
    const assignCompletionRate =
      assignmentsSummary.totalAssignments > 0
        ? Math.round((assignmentsSummary.submittedAssignments / assignmentsSummary.totalAssignments) * 100)
        : 0;

    // Filter upcoming assignments where student hasn't submitted yet
    const unsubmittedUpcomingAssignments = upcomingAssignments
      .filter((a) => {
        const sub = a.submissions?.find((s) => s.student?.toString() === studentId.toString());
        return !sub || !['submitted', 'completed', 'graded'].includes(sub.status);
      })
      .slice(0, 5);

    return {
      overview: {
        streak: streakInfo,
        studyHours: {
          totalHours: totalStudyHours,
          totalMinutes: sessResult.completedMinutes,
          completedSessions: sessResult.completedSessions,
          totalSessions: sessResult.totalSessions,
          completionRate: sessionCompletionRate,
        },
        tasks: {
          totalTasks: taskResult.totalTasks,
          completedTasks: taskResult.completedTasks,
          pendingTasks: taskResult.totalTasks - taskResult.completedTasks,
          completionRate: taskCompletionRate,
        },
        assignments: {
          totalAssignments: assignmentsSummary.totalAssignments,
          submittedAssignments: assignmentsSummary.submittedAssignments,
          pendingAssignments: assignmentsSummary.totalAssignments - assignmentsSummary.submittedAssignments,
          completionRate: assignCompletionRate,
          averageGrade: assignmentsSummary.averageGrade,
        },
        quizzes: {
          totalAttempts: quizResult.totalAttempts,
          passedCount: quizResult.passedCount,
          averageScore: quizAverageScore,
          passRate: quizPassRate,
          highestScore: quizResult.highestScore,
        },
      },
      chartData: chartPoints,
      subjectProgress: subjectWiseProgress,
      recentActivity: recentFeed,

      // Structured data contract explicitly prepared for Phase 10 AI Recommendations:
      recommendationDataContract: {
        weakTopics,
        quizPerformance: {
          averageScore: quizAverageScore,
          passRate: quizPassRate,
          totalAttempts: quizResult.totalAttempts,
          subjectBreakdown: subjectWiseProgress.map((s) => ({
            subjectId: s.subjectId,
            title: s.title,
            averageQuizScore: s.averageQuizScore,
            attemptsCount: s.quizAttemptsCount,
          })),
        },
        studyHistory: {
          totalHours: totalStudyHours,
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          sessionCompletionRate,
          taskCompletionRate,
        },
        academicWorkload: {
          upcomingTasks,
          upcomingAssignments: unsubmittedUpcomingAssignments,
          upcomingSessions,
        },
      },
    };
  },

  /**
   * Teacher cohort progress view: aggregates data only for students enrolled in teacher's assigned subjects
   */
  getTeacherCohortProgress: async (teacherId, filterSubjectId = null) => {
    const tId = new mongoose.Types.ObjectId(teacherId);

    // 1. Fetch teacher's assigned subjects
    const subjectQuery = { teacher: tId, status: 'active' };
    if (filterSubjectId) {
      subjectQuery._id = new mongoose.Types.ObjectId(filterSubjectId);
    }

    const assignedSubjects = await Subject.find(subjectQuery).populate('enrolledStudents', 'name email avatar').lean();

    if (assignedSubjects.length === 0) {
      return {
        cohortSummary: {
          totalStudents: 0,
          totalAssignedSubjects: 0,
          averageTopicCompletion: 0,
          averageQuizScore: 0,
          totalStudyHoursLogged: 0,
        },
        assignedSubjects: [],
        students: [],
      };
    }

    const assignedSubjectIds = assignedSubjects.map((s) => s._id);

    // Gather distinct students
    const studentMap = new Map();
    assignedSubjects.forEach((s) => {
      if (s.enrolledStudents) {
        s.enrolledStudents.forEach((student) => {
          const sIdStr = student._id.toString();
          if (!studentMap.has(sIdStr)) {
            studentMap.set(sIdStr, {
              _id: student._id,
              name: student.name,
              email: student.email,
              avatar: student.avatar,
              enrolledSubjectIds: [],
            });
          }
          studentMap.get(sIdStr).enrolledSubjectIds.push(s._id);
        });
      }
    });

    const studentList = Array.from(studentMap.values());
    const studentIds = studentList.map((s) => s._id);

    // 2. Fetch topics, study sessions, and quiz attempts in bulk for teacher's subjects
    const [allTopics, allSessions, allAttempts, allAssignments] = await Promise.all([
      Topic.find({ subject: { $in: assignedSubjectIds } }).lean(),
      StudySession.find({
        user: { $in: studentIds },
        subject: { $in: assignedSubjectIds },
        status: 'completed',
      })
        .select('user subject duration completedAt')
        .lean(),
      QuizAttempt.find({
        user: { $in: studentIds },
        subject: { $in: assignedSubjectIds },
      })
        .select('user subject score passed createdAt')
        .lean(),
      Assignment.find({
        subject: { $in: assignedSubjectIds },
        status: 'published',
      }).lean(),
    ]);

    // Total topics per subject
    const subjectTopicsMap = new Map();
    assignedSubjectIds.forEach((id) => {
      const idStr = id.toString();
      const sTopics = allTopics.filter((t) => t.subject.toString() === idStr);
      subjectTopicsMap.set(idStr, sTopics);
    });

    // 3. Compute student progress rows
    let cohortTopicRateSum = 0;
    let cohortQuizScoreSum = 0;
    let studentsWithQuizzes = 0;
    let cohortStudyMinutes = 0;

    const studentProgressRows = studentList.map((student) => {
      const sIdStr = student._id.toString();

      // Relevant topics across student's enrolled subjects for this teacher
      let totalAssignedTopics = 0;
      let completedTopicsCount = 0;

      student.enrolledSubjectIds.forEach((subjId) => {
        const sTopics = subjectTopicsMap.get(subjId.toString()) || [];
        totalAssignedTopics += sTopics.length;
        completedTopicsCount += sTopics.filter(
          (t) => t.completedBy && t.completedBy.some((id) => id.toString() === sIdStr)
        ).length;
      });

      const topicCompletionRate =
        totalAssignedTopics > 0 ? Math.round((completedTopicsCount / totalAssignedTopics) * 100) : 0;
      cohortTopicRateSum += topicCompletionRate;

      // Relevant study sessions
      const studentSessions = allSessions.filter((s) => s.user.toString() === sIdStr);
      const minutes = studentSessions.reduce((acc, s) => acc + (s.duration || 60), 0);
      cohortStudyMinutes += minutes;

      // Relevant quiz attempts
      const studentAttempts = allAttempts.filter((a) => a.user.toString() === sIdStr);
      const attemptsCount = studentAttempts.length;
      const avgScore =
        attemptsCount > 0
          ? Math.round(studentAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / attemptsCount)
          : null;

      if (avgScore !== null) {
        cohortQuizScoreSum += avgScore;
        studentsWithQuizzes += 1;
      }

      // Relevant assignments
      let assignedAssignmentsCount = 0;
      let submittedAssignmentsCount = 0;
      allAssignments.forEach((a) => {
        if (student.enrolledSubjectIds.some((sId) => sId.toString() === a.subject.toString())) {
          assignedAssignmentsCount += 1;
          const sub = a.submissions?.find((s) => s.student?.toString() === sIdStr);
          if (sub && ['submitted', 'completed', 'graded'].includes(sub.status)) {
            submittedAssignmentsCount += 1;
          }
        }
      });

      // Status classification
      let statusBadge = 'in_progress';
      const effectiveBenchmark = avgScore !== null ? avgScore : topicCompletionRate;
      if (effectiveBenchmark >= 75) {
        statusBadge = 'on_track';
      } else if (effectiveBenchmark < 50) {
        statusBadge = 'needs_support';
      }

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        enrolledSubjectsCount: student.enrolledSubjectIds.length,
        topicCompletionRate,
        completedTopics: completedTopicsCount,
        totalTopics: totalAssignedTopics,
        studyHours: parseFloat((minutes / 60).toFixed(1)),
        sessionsCount: studentSessions.length,
        quizAttemptsCount: attemptsCount,
        averageQuizScore: avgScore,
        assignmentsSubmitted: submittedAssignmentsCount,
        totalAssignments: assignedAssignmentsCount,
        status: statusBadge, // 'on_track' | 'in_progress' | 'needs_support'
      };
    });

    const totalStudents = studentList.length;

    return {
      cohortSummary: {
        totalStudents,
        totalAssignedSubjects: assignedSubjects.length,
        averageTopicCompletion: totalStudents > 0 ? Math.round(cohortTopicRateSum / totalStudents) : 0,
        averageQuizScore: studentsWithQuizzes > 0 ? Math.round(cohortQuizScoreSum / studentsWithQuizzes) : 0,
        totalStudyHoursLogged: parseFloat((cohortStudyMinutes / 60).toFixed(1)),
      },
      assignedSubjects: assignedSubjects.map((s) => ({
        _id: s._id,
        title: s.title,
        code: s.code,
        color: s.color,
        enrolledCount: s.enrolledStudents ? s.enrolledStudents.length : 0,
      })),
      students: studentProgressRows.sort((a, b) => b.studyHours - a.studyHours),
    };
  },

  /**
   * Admin Platform-Wide Learning Overview
   */
  getAdminPlatformProgress: async () => {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalSubjects,
      sessionStats,
      taskStats,
      quizStats,
      subjectEngagement,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Subject.countDocuments({ status: 'active' }),

      StudySession.aggregate([
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            completedSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            totalMinutes: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$duration', 60] }, 0] },
            },
          },
        },
      ]),

      Task.aggregate([
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] },
            },
          },
        },
      ]),

      QuizAttempt.aggregate([
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            passedAttempts: {
              $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] },
            },
            averageScore: { $avg: '$score' },
          },
        },
      ]),

      // Most engaged subjects by study session count
      StudySession.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$subject',
            sessionsCount: { $sum: 1 },
            totalMinutes: { $sum: { $ifNull: ['$duration', 60] } },
          },
        },
        { $sort: { sessionsCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'subjects',
            localField: '_id',
            foreignField: '_id',
            as: 'subjectInfo',
          },
        },
        { $unwind: '$subjectInfo' },
        {
          $project: {
            subjectId: '$_id',
            title: '$subjectInfo.title',
            code: '$subjectInfo.code',
            color: '$subjectInfo.color',
            sessionsCount: 1,
            studyHours: { $round: [{ $divide: ['$totalMinutes', 60] }, 1] },
          },
        },
      ]),
    ]);

    const sess = sessionStats[0] || { totalSessions: 0, completedSessions: 0, totalMinutes: 0 };
    const tasks = taskStats[0] || { totalTasks: 0, completedTasks: 0 };
    const quiz = quizStats[0] || { totalAttempts: 0, passedAttempts: 0, averageScore: 0 };

    return {
      platformCounts: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalSubjects,
      },
      learningMetrics: {
        totalStudyHours: parseFloat((sess.totalMinutes / 60).toFixed(1)),
        totalSessionsCompleted: sess.completedSessions,
        totalTasksCompleted: tasks.completedTasks,
        totalQuizAttempts: quiz.totalAttempts,
        platformAverageQuizScore: Math.round(quiz.averageScore || 0),
        quizPassRate: quiz.totalAttempts > 0 ? Math.round((quiz.passedAttempts / quiz.totalAttempts) * 100) : 0,
      },
      topSubjects: subjectEngagement,
    };
  },

  /**
   * Comprehensive detailed student performance in teacher's subjects
   * Strictly verifies teacher-student enrollment ownership
   */
  getTeacherStudentDetailedPerformance: async (teacherId, studentId, options = {}, role = 'teacher') => {
    const sId = new mongoose.Types.ObjectId(studentId);
    const tId = new mongoose.Types.ObjectId(teacherId);

    // 1. Ownership & Enrollment Check
    const subjectFilter = { status: 'active', enrolledStudents: sId };
    if (role !== 'admin') {
      subjectFilter.teacher = tId;
    }

    const assignedSubjects = await Subject.find(subjectFilter)
      .select('_id title code color category teacher')
      .lean();

    if (assignedSubjects.length === 0 && role !== 'admin') {
      const err = new Error('Access denied: This student is not enrolled in any of your active courses.');
      err.statusCode = 403;
      throw err;
    }

    const student = await User.findById(sId)
      .select('name email avatar institution role createdAt')
      .lean();

    if (!student) {
      const err = new Error('Student account not found.');
      err.statusCode = 404;
      throw err;
    }

    const assignedSubjectIds = assignedSubjects.map((s) => s._id);

    // 2. Fetch parallel academic records in teacher's subjects
    const [allTopics, allSessions, allAttempts, allAssignments, allTasks, streakInfo] = await Promise.all([
      Topic.find({ subject: { $in: assignedSubjectIds } })
        .sort({ order: 1 })
        .lean(),

      StudySession.find({
        user: sId,
        subject: { $in: assignedSubjectIds },
        status: 'completed',
      })
        .select('title subject topic duration completedAt startTime')
        .sort({ completedAt: -1 })
        .lean(),

      QuizAttempt.find({
        user: sId,
        subject: { $in: assignedSubjectIds },
      })
        .populate('quiz', 'title totalQuestions difficulty questionType')
        .populate('topic', 'title')
        .populate('subject', 'title code color')
        .sort({ createdAt: -1 })
        .lean(),

      Assignment.find({
        subject: { $in: assignedSubjectIds },
        status: 'published',
      })
        .populate('subject', 'title code color')
        .sort({ dueDate: 1 })
        .lean(),

      Task.find({
        user: sId,
        subject: { $in: assignedSubjectIds },
      })
        .select('title subject priority isCompleted dueDate')
        .lean(),

      progressService.calculateStudyStreak(studentId),
    ]);

    // 3. Compute Study Hours in teacher's subjects
    const totalMinutes = allSessions.reduce((acc, s) => acc + (s.duration || 60), 0);
    const studyHours = parseFloat((totalMinutes / 60).toFixed(1));

    // 4. Compute Topic Mastery & Progress
    const totalTopicsCount = allTopics.length;
    const completedTopics = allTopics.filter(
      (t) => t.completedBy && t.completedBy.some((id) => id.toString() === studentId.toString())
    );
    const completedTopicsCount = completedTopics.length;
    const topicCompletionRate =
      totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

    // 5. Compute Assignment Submissions Breakdown
    let submittedAssignmentsCount = 0;
    let gradedCount = 0;
    let gradeSum = 0;
    const now = new Date();

    const formattedAssignments = allAssignments.map((a) => {
      const sub = a.submissions?.find((s) => s.student && s.student.toString() === studentId.toString());
      const isSubmitted = sub && ['submitted', 'completed', 'graded'].includes(sub.status);
      if (isSubmitted) {
        submittedAssignmentsCount += 1;
        if (sub.grade !== null && sub.grade !== undefined) {
          gradedCount += 1;
          gradeSum += sub.grade;
        }
      }

      const isOverdue = !isSubmitted && a.dueDate && new Date(a.dueDate) < now;

      return {
        _id: a._id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        points: a.points || 100,
        status: isSubmitted ? sub.status : isOverdue ? 'overdue' : 'pending',
        submittedAt: sub ? sub.submittedAt : null,
        grade: sub ? sub.grade : null,
        feedback: sub ? sub.feedback : '',
        submissionText: sub ? sub.submissionText : '',
      };
    });

    const averageGrade = gradedCount > 0 ? Math.round(gradeSum / gradedCount) : null;
    const assignmentCompletionRate =
      allAssignments.length > 0 ? Math.round((submittedAssignmentsCount / allAssignments.length) * 100) : 0;

    // 6. Compute Quiz Scores & Breakdown
    const attemptsCount = allAttempts.length;
    const passedAttempts = allAttempts.filter((a) => a.passed).length;
    const avgQuizScore =
      attemptsCount > 0 ? Math.round(allAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / attemptsCount) : null;
    const quizPassRate = attemptsCount > 0 ? Math.round((passedAttempts / attemptsCount) * 100) : 0;

    // 7. Subject-Wise Breakdown
    const subjectBreakdown = assignedSubjects.map((subj) => {
      const sIdStr = subj._id.toString();
      const sTopics = allTopics.filter((t) => t.subject.toString() === sIdStr);
      const sCompletedTopics = sTopics.filter(
        (t) => t.completedBy && t.completedBy.some((id) => id.toString() === studentId.toString())
      );
      const sSessions = allSessions.filter((s) => s.subject.toString() === sIdStr);
      const sMinutes = sSessions.reduce((acc, s) => acc + (s.duration || 60), 0);
      const sAttempts = allAttempts.filter((a) => a.subject?._id?.toString() === sIdStr);
      const sAvgQuiz =
        sAttempts.length > 0
          ? Math.round(sAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / sAttempts.length)
          : null;

      const sAssignments = formattedAssignments.filter((a) => a.subject?._id?.toString() === sIdStr);
      const sSubmittedAssignments = sAssignments.filter((a) => ['submitted', 'completed', 'graded'].includes(a.status));

      return {
        subjectId: subj._id,
        title: subj.title,
        code: subj.code,
        color: subj.color,
        category: subj.category,
        totalTopics: sTopics.length,
        completedTopics: sCompletedTopics.length,
        completionRate: sTopics.length > 0 ? Math.round((sCompletedTopics.length / sTopics.length) * 100) : 0,
        studyHours: parseFloat((sMinutes / 60).toFixed(1)),
        sessionsCount: sSessions.length,
        quizAttemptsCount: sAttempts.length,
        averageQuizScore: sAvgQuiz,
        totalAssignments: sAssignments.length,
        submittedAssignments: sSubmittedAssignments.length,
        topics: sTopics.map((t) => ({
          _id: t._id,
          title: t.title,
          difficulty: t.difficulty,
          estimatedHours: t.estimatedHours,
          order: t.order,
          isCompleted: t.completedBy && t.completedBy.some((id) => id.toString() === studentId.toString()),
        })),
      };
    });

    // 8. Weak Topics Diagnosis (average score < 70% or uncompleted topics)
    const topicScoreMap = new Map();
    allAttempts.forEach((a) => {
      if (a.topic && a.topic._id) {
        const tIdStr = a.topic._id.toString();
        if (!topicScoreMap.has(tIdStr)) {
          topicScoreMap.set(tIdStr, {
            topicId: a.topic._id,
            topicTitle: a.topic.title,
            subjectTitle: a.subject?.title || 'Course',
            scores: [],
          });
        }
        topicScoreMap.get(tIdStr).scores.push(a.score || 0);
      }
    });

    const weakTopics = [];
    topicScoreMap.forEach((entry) => {
      const avg = Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length);
      if (avg < 70) {
        weakTopics.push({
          topicId: entry.topicId,
          topicTitle: entry.topicTitle,
          subjectTitle: entry.subjectTitle,
          averageScore: avg,
          attemptsCount: entry.scores.length,
          urgency: avg < 50 ? 'high' : 'medium',
          status: 'needs_revision',
        });
      }
    });

    // 9. Trend points for visual timeline (last 14 days)
    const trendPoints = [];
    for (let i = 13; i >= 0; i--) {
      const d = subtractDays(now, i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      let dayMinutes = 0;
      let dayQuizzes = 0;
      let dayScoreSum = 0;

      allSessions.forEach((s) => {
        const sDate = new Date(s.completedAt || s.startTime);
        if (sDate >= dayStart && sDate <= dayEnd) {
          dayMinutes += s.duration || 60;
        }
      });

      allAttempts.forEach((q) => {
        const qDate = new Date(q.createdAt);
        if (qDate >= dayStart && qDate <= dayEnd) {
          dayQuizzes += 1;
          dayScoreSum += q.score || 0;
        }
      });

      trendPoints.push({
        date: formatDateStr(d),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        studyHours: parseFloat((dayMinutes / 60).toFixed(1)),
        quizzesTaken: dayQuizzes,
        averageScore: dayQuizzes > 0 ? Math.round(dayScoreSum / dayQuizzes) : null,
      });
    }

    // 10. Status classification
    const benchmark = avgQuizScore !== null ? avgQuizScore : topicCompletionRate;
    let status = 'in_progress';
    if (benchmark >= 75) status = 'on_track';
    else if (benchmark < 50) status = 'needs_support';

    return {
      student,
      enrolledSubjects: assignedSubjects,
      status,
      overview: {
        totalStudyHours: studyHours,
        totalSessions: allSessions.length,
        totalTopics: totalTopicsCount,
        completedTopics: completedTopicsCount,
        topicCompletionRate,
        totalAssignments: allAssignments.length,
        submittedAssignments: submittedAssignmentsCount,
        assignmentCompletionRate,
        averageGrade,
        totalQuizAttempts: attemptsCount,
        averageQuizScore: avgQuizScore,
        quizPassRate,
        streak: streakInfo,
        tasksCompleted: allTasks.filter((t) => t.isCompleted).length,
        totalTasks: allTasks.length,
      },
      subjectBreakdown,
      weakTopics: weakTopics.sort((a, b) => a.averageScore - b.averageScore),
      assignments: formattedAssignments,
      quizHistory: allAttempts.slice(0, 15),
      trendPoints,
    };
  },

  /**
   * Dedicated class roster and subject-specific monitoring
   */
  getSubjectStudentsRoster: async (teacherId, subjectId, options = {}, role = 'teacher') => {
    const sId = new mongoose.Types.ObjectId(subjectId);
    const tId = new mongoose.Types.ObjectId(teacherId);

    // Verify subject ownership
    const query = { _id: sId, status: 'active' };
    if (role !== 'admin') {
      query.teacher = tId;
    }

    const subject = await Subject.findOne(query)
      .populate('enrolledStudents', 'name email avatar institution createdAt')
      .populate('teacher', 'name email institution')
      .lean();

    if (!subject) {
      const err = new Error('Course not found or you do not have permission to view its roster.');
      err.statusCode = 403;
      throw err;
    }

    const enrolledStudents = subject.enrolledStudents || [];
    const studentIds = enrolledStudents.map((s) => s._id);

    // Fetch topics, assignments, sessions, and attempts for this specific subject
    const [topics, assignments, sessions, attempts] = await Promise.all([
      Topic.find({ subject: sId }).sort({ order: 1 }).lean(),
      Assignment.find({ subject: sId, status: 'published' }).lean(),
      StudySession.find({
        subject: sId,
        user: { $in: studentIds },
        status: 'completed',
      }).lean(),
      QuizAttempt.find({
        subject: sId,
        user: { $in: studentIds },
      }).lean(),
    ]);

    const totalTopicsCount = topics.length;
    const totalAssignmentsCount = assignments.length;

    let classStudyMinutes = 0;
    let classTopicRateSum = 0;
    let classQuizScoreSum = 0;
    let studentsWithQuiz = 0;

    const studentRows = enrolledStudents.map((st) => {
      const sIdStr = st._id.toString();

      // Topic completion in this subject
      const completedCount = topics.filter(
        (t) => t.completedBy && t.completedBy.some((id) => id.toString() === sIdStr)
      ).length;
      const topicRate = totalTopicsCount > 0 ? Math.round((completedCount / totalTopicsCount) * 100) : 0;
      classTopicRateSum += topicRate;

      // Study hours in this subject
      const stSessions = sessions.filter((s) => s.user.toString() === sIdStr);
      const minutes = stSessions.reduce((acc, s) => acc + (s.duration || 60), 0);
      classStudyMinutes += minutes;

      // Quiz attempts in this subject
      const stAttempts = attempts.filter((a) => a.user.toString() === sIdStr);
      const attemptsCount = stAttempts.length;
      const avgScore =
        attemptsCount > 0
          ? Math.round(stAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / attemptsCount)
          : null;

      if (avgScore !== null) {
        classQuizScoreSum += avgScore;
        studentsWithQuiz += 1;
      }

      // Assignment submissions in this subject
      let submittedCount = 0;
      let gradeSum = 0;
      let gradedCount = 0;

      assignments.forEach((a) => {
        const sub = a.submissions?.find((s) => s.student?.toString() === sIdStr);
        if (sub && ['submitted', 'completed', 'graded'].includes(sub.status)) {
          submittedCount += 1;
          if (sub.grade !== null && sub.grade !== undefined) {
            gradeSum += sub.grade;
            gradedCount += 1;
          }
        }
      });

      const avgGrade = gradedCount > 0 ? Math.round(gradeSum / gradedCount) : null;

      let status = 'in_progress';
      const benchmark = avgScore !== null ? avgScore : topicRate;
      if (benchmark >= 75) status = 'on_track';
      else if (benchmark < 50) status = 'needs_support';

      return {
        _id: st._id,
        name: st.name,
        email: st.email,
        avatar: st.avatar,
        institution: st.institution,
        completedTopics: completedCount,
        totalTopics: totalTopicsCount,
        topicCompletionRate: topicRate,
        studyHours: parseFloat((minutes / 60).toFixed(1)),
        sessionsCount: stSessions.length,
        quizAttemptsCount: attemptsCount,
        averageQuizScore: avgScore,
        assignmentsSubmitted: submittedCount,
        totalAssignments: totalAssignmentsCount,
        averageGrade: avgGrade,
        status,
      };
    });

    const totalStudents = enrolledStudents.length;

    return {
      subject: {
        _id: subject._id,
        title: subject.title,
        code: subject.code,
        color: subject.color,
        category: subject.category,
        teacher: subject.teacher,
        totalTopics: totalTopicsCount,
        totalAssignments: totalAssignmentsCount,
      },
      classSummary: {
        totalStudents,
        averageTopicCompletion: totalStudents > 0 ? Math.round(classTopicRateSum / totalStudents) : 0,
        averageQuizScore: studentsWithQuiz > 0 ? Math.round(classQuizScoreSum / studentsWithQuiz) : 0,
        totalStudyHoursLogged: parseFloat((classStudyMinutes / 60).toFixed(1)),
        assignmentSubmissionRate:
          totalStudents > 0 && totalAssignmentsCount > 0
            ? Math.round(
                (studentRows.reduce((acc, r) => acc + r.assignmentsSubmitted, 0) /
                  (totalStudents * totalAssignmentsCount)) *
                  100
              )
            : 0,
      },
      students: studentRows.sort((a, b) => b.studyHours - a.studyHours),
    };
  },

  /**
   * High-level summary metrics for teacher dashboard
   */
  getTeacherDashboardSummary: async (teacherId, role = 'teacher') => {
    const tId = new mongoose.Types.ObjectId(teacherId);

    const subjectQuery = { status: 'active' };
    if (role !== 'admin') {
      subjectQuery.teacher = tId;
    }

    const assignedSubjects = await Subject.find(subjectQuery)
      .populate('enrolledStudents', 'name email avatar institution')
      .lean();

    if (assignedSubjects.length === 0) {
      return {
        kpis: {
          totalAssignedSubjects: 0,
          totalUniqueStudents: 0,
          studentsOnTrack: 0,
          studentsNeedingSupport: 0,
          averageTopicCompletion: 0,
          averageQuizScore: 0,
          totalStudyHours: 0,
        },
        assignedSubjects: [],
        studentsNeedingSupport: [],
        recentSubmissions: [],
        recentQuizAttempts: [],
      };
    }

    // Reuse cohort progress aggregator
    const cohort = await progressService.getTeacherCohortProgress(teacherId);

    const students = cohort.students || [];
    const studentsNeedingSupport = students.filter((s) => s.status === 'needs_support');
    const studentsOnTrack = students.filter((s) => s.status === 'on_track');

    const assignedSubjectIds = assignedSubjects.map((s) => s._id);

    // Fetch recent assignment submissions
    const recentAssignments = await Assignment.find({
      subject: { $in: assignedSubjectIds },
      status: 'published',
      'submissions.status': { $in: ['submitted', 'completed', 'graded'] },
    })
      .populate('subject', 'title code color')
      .populate('submissions.student', 'name email avatar')
      .lean();

    const flatSubmissions = [];
    recentAssignments.forEach((a) => {
      a.submissions?.forEach((sub) => {
        if (sub.student && ['submitted', 'completed', 'graded'].includes(sub.status)) {
          flatSubmissions.push({
            assignmentId: a._id,
            assignmentTitle: a.title,
            subject: a.subject,
            student: sub.student,
            status: sub.status,
            grade: sub.grade,
            submittedAt: sub.submittedAt || sub.updatedAt,
          });
        }
      });
    });

    // Fetch recent quiz attempts
    const recentQuizAttempts = await QuizAttempt.find({
      subject: { $in: assignedSubjectIds },
    })
      .populate('user', 'name email avatar')
      .populate('subject', 'title code color')
      .populate('quiz', 'title')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return {
      kpis: {
        totalAssignedSubjects: assignedSubjects.length,
        totalUniqueStudents: students.length,
        studentsOnTrack: studentsOnTrack.length,
        studentsNeedingSupport: studentsNeedingSupport.length,
        averageTopicCompletion: cohort.cohortSummary?.averageTopicCompletion || 0,
        averageQuizScore: cohort.cohortSummary?.averageQuizScore || 0,
        totalStudyHours: cohort.cohortSummary?.totalStudyHoursLogged || 0,
      },
      assignedSubjects: assignedSubjects.map((s) => ({
        _id: s._id,
        title: s.title,
        code: s.code,
        color: s.color,
        category: s.category,
        enrolledCount: s.enrolledStudents ? s.enrolledStudents.length : 0,
      })),
      studentsNeedingSupport,
      recentSubmissions: flatSubmissions
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 8),
      recentQuizAttempts: recentQuizAttempts.map((q) => ({
        _id: q._id,
        student: q.user,
        quizTitle: q.quiz?.title || 'Practice Quiz',
        subject: q.subject,
        score: q.score,
        passed: q.passed,
        createdAt: q.createdAt,
      })),
    };
  },
};

export default progressService;
