import mongoose from 'mongoose';
import Recommendation from '../models/Recommendation.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Quiz from '../models/Quiz.js';
import Material from '../models/Material.js';
import progressService from './progressService.js';
import { generateStudyRecommendations } from './geminiService.js';

/**
 * AI Study Recommendations Service
 */
export const recommendationService = {
  /**
   * Retrieves active study recommendations for a student.
   * If cached valid recommendations exist (< 24h old) and force is false, returns cached.
   * Otherwise aggregates fresh empirical learning metrics and prompts Gemini.
   */
  getStudentRecommendations: async (studentId, force = false) => {
    const sId = new mongoose.Types.ObjectId(studentId);

    // 1. Check for cached unexpired recommendations if force refresh is false
    if (!force) {
      const cached = await Recommendation.findOne({
        user: sId,
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (cached) {
        return {
          recommendation: cached,
          cached: true,
          expiresAt: cached.expiresAt,
        };
      }
    }

    // 2. Fetch student profile and empirical learning context
    const student = await User.findById(sId).select('name email role').lean();
    if (!student) {
      throw new Error('Student account not found');
    }

    const dashboardData = await progressService.getStudentDashboardProgress(studentId);

    // 3. Fetch student's enrolled subjects, practice quizzes, and materials
    const enrolledSubjects = await Subject.find({
      enrolledStudents: sId,
      status: 'active',
    })
      .select('_id title')
      .lean();

    const subjectIds = enrolledSubjects.map((s) => s._id);

    const [availableQuizzes, availableMaterials] = await Promise.all([
      Quiz.find({
        subject: { $in: subjectIds },
        isPublished: true,
      })
        .select('_id title subject difficulty totalQuestions')
        .populate('subject', 'title')
        .limit(6)
        .lean(),

      Material.find({
        subject: { $in: subjectIds },
      })
        .select('_id title subject fileType')
        .populate('subject', 'title')
        .limit(6)
        .lean(),
    ]);

    // 4. Build prompt context payload
    const context = {
      studentName: student.name || 'Student',
      overview: dashboardData.overview || {},
      weakTopics: dashboardData.weakTopics || [],
      subjectProgress: dashboardData.subjectProgress || [],
      academicWorkload: dashboardData.recommendationDataContract?.academicWorkload || {},
      availableQuizzes,
      availableMaterials,
    };

    // 5. Generate recommendations with Gemini (or resilient algorithmic fallback)
    const generated = await generateStudyRecommendations(context);

    // 6. Map and sanitize nested items to ensure valid ObjectIds if available
    const weakTopicRecommendations = (generated.weakTopicRecommendations || []).map((wt) => ({
      topicId: wt.topicId && mongoose.isValidObjectId(wt.topicId) ? wt.topicId : null,
      topicTitle: wt.topicTitle || 'Core Topic Review',
      subjectId: wt.subjectId && mongoose.isValidObjectId(wt.subjectId) ? wt.subjectId : null,
      subjectTitle: wt.subjectTitle || 'General',
      urgency: ['high', 'medium', 'low'].includes(wt.urgency) ? wt.urgency : 'medium',
      currentMastery: typeof wt.currentMastery === 'number' ? Math.min(100, Math.max(0, wt.currentMastery)) : 50,
      diagnosticReason: wt.diagnosticReason || 'Recommended based on academic progress metrics.',
      recommendedAction: wt.recommendedAction || 'Review core notes and attempt a practice quiz.',
      actionUrl: wt.actionUrl || '/quizzes',
      actionType: ['quiz', 'material', 'assistant', 'plan'].includes(wt.actionType) ? wt.actionType : 'quiz',
    }));

    const subjectAttention = (generated.subjectAttention || []).map((sa) => ({
      subjectId: sa.subjectId && mongoose.isValidObjectId(sa.subjectId) ? sa.subjectId : null,
      subjectTitle: sa.subjectTitle || 'General Subject',
      subjectCode: sa.subjectCode || '',
      color: sa.color || '#BBD0FF',
      priorityLevel: ['high', 'medium', 'low'].includes(sa.priorityLevel) ? sa.priorityLevel : 'medium',
      hoursLogged: typeof sa.hoursLogged === 'number' ? sa.hoursLogged : 0,
      suggestedWeeklyHours: typeof sa.suggestedWeeklyHours === 'number' ? sa.suggestedWeeklyHours : 4,
      statusNote: sa.statusNote || 'Keep up steady revision.',
      actionUrl: sa.actionUrl || '/calendar',
    }));

    const studyScheduleAdvice = {
      recommendedDailyMinutes: generated.studyScheduleAdvice?.recommendedDailyMinutes || 90,
      recommendedWeeklyHours: generated.studyScheduleAdvice?.recommendedWeeklyHours || 12,
      optimalStudyTime: generated.studyScheduleAdvice?.optimalStudyTime || 'evening',
      streakAdvice: generated.studyScheduleAdvice?.streakAdvice || 'Maintain daily study momentum.',
      workloadPacing: generated.studyScheduleAdvice?.workloadPacing || 'Pace tasks across 2-day intervals.',
    };

    const prioritizedDeadlines = (generated.prioritizedDeadlines || []).map((pd) => ({
      itemId: pd.itemId && mongoose.isValidObjectId(pd.itemId) ? pd.itemId : null,
      itemType: ['task', 'assignment'].includes(pd.itemType) ? pd.itemType : 'task',
      title: pd.title || 'Upcoming Deadline',
      subjectTitle: pd.subjectTitle || 'General',
      dueDate: pd.dueDate ? new Date(pd.dueDate) : null,
      priority: ['high', 'medium', 'low'].includes(pd.priority) ? pd.priority : 'medium',
      daysRemaining: typeof pd.daysRemaining === 'number' ? pd.daysRemaining : 0,
      aiTactic: pd.aiTactic || 'Break this into focused 25-minute study sprints.',
      actionUrl: pd.actionUrl || (pd.itemType === 'assignment' ? '/assignments' : '/tasks'),
    }));

    const revisionStrategies = (generated.revisionStrategies || []).map((rs) => ({
      strategyName: rs.strategyName || 'Active Recall',
      technique: rs.technique || 'Deliberate Practice',
      description: rs.description || 'Test yourself without looking at answers.',
      applicableTopic: rs.applicableTopic || 'General Revision',
      actionUrl: rs.actionUrl || '/assistant',
    }));

    const recommendedResources = (generated.recommendedResources || []).map((rr) => ({
      resourceType: ['quiz', 'material', 'note'].includes(rr.resourceType) ? rr.resourceType : 'quiz',
      title: rr.title || 'Practice Resource',
      subjectTitle: rr.subjectTitle || '',
      reason: rr.reason || 'Recommended to reinforce comprehension.',
      actionUrl: rr.actionUrl || '/quizzes',
    }));

    // 7. Save fresh recommendation record in MongoDB
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour cache

    const newRec = await Recommendation.create({
      user: sId,
      summaryQuote: generated.summaryQuote || 'Consistent daily deliberate practice yields compound learning gains.',
      overview: {
        keyFocusArea: generated.overview?.keyFocusArea || 'Core Revision & Problem Solving',
        overallAssessment: generated.overview?.overallAssessment || 'Consistent academic engagement.',
        performanceTier: generated.overview?.performanceTier || 'Consistent Scholar',
        recommendedFocusSubject: generated.overview?.recommendedFocusSubject || 'General',
      },
      weakTopicRecommendations,
      subjectAttention,
      studyScheduleAdvice,
      prioritizedDeadlines,
      revisionStrategies,
      recommendedResources,
      generatedAt: new Date(),
      expiresAt,
      aiModel: generated.aiModel || 'gemini-1.5-flash',
    });

    // 8. Clean up outdated recommendations older than 48 hours for this student
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await Recommendation.deleteMany({
      user: sId,
      expiresAt: { $lt: cutoff },
    }).catch((cleanErr) => console.warn('[Recommendation Service] Cache cleanup error:', cleanErr.message));

    return {
      recommendation: newRec.toObject(),
      cached: false,
      expiresAt: newRec.expiresAt,
    };
  },

  /**
   * Get recommendation by ID with user ownership check
   */
  getRecommendationById: async (recommendationId, studentId, role = 'student') => {
    if (!mongoose.isValidObjectId(recommendationId)) {
      throw new Error('Invalid recommendation ID');
    }

    const rec = await Recommendation.findById(recommendationId)
      .populate('user', 'name email role')
      .lean();

    if (!rec) {
      throw new Error('Recommendation not found');
    }

    if (role === 'student' && rec.user?._id?.toString() !== studentId.toString()) {
      throw new Error('Access denied: You do not have permission to view these recommendations');
    }

    return rec;
  },
};

export default recommendationService;
