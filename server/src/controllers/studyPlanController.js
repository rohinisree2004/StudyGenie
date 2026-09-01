import StudyPlan from '../models/StudyPlan.js';
import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Assignment from '../models/Assignment.js';
import { generateAIStudyPlan } from '../services/geminiService.js';
import notificationService from '../services/notificationService.js';

/**
 * @desc    Generate personalized AI study plan using Gemini
 * @route   POST /api/study-plans/generate
 * @access  Private (Student)
 */
export const generatePlan = async (req, res, next) => {
  try {
    const {
      goal,
      subjects: subjectIds,
      topics: topicIds,
      examDate,
      startDate,
      endDate,
      dailyStudyHours = 3,
      preferredStudyTime = 'evening',
      intensity = 'balanced',
    } = req.body;

    if (!goal || !goal.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a primary study goal or exam target',
      });
    }

    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one subject for your study plan',
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : examDate
      ? new Date(examDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Retrieve full subject documents
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the selected subjects were found',
      });
    }

    // Retrieve topic documents
    const topics = topicIds && topicIds.length > 0
      ? await Topic.find({ _id: { $in: topicIds } })
      : await Topic.find({ subject: { $in: subjectIds } });

    // Retrieve any upcoming assignments for these subjects in this window
    const upcomingAssignments = await Assignment.find({
      subject: { $in: subjectIds },
      dueDate: { $gte: start, $lte: end },
      status: 'published',
    });

    // Call Gemini AI Engine
    const generated = await generateAIStudyPlan({
      goal: goal.trim(),
      subjects,
      topics,
      examDate: examDate ? new Date(examDate) : null,
      startDate: start,
      endDate: end,
      dailyStudyHours: Number(dailyStudyHours) || 3,
      preferredStudyTime,
      intensity,
      upcomingAssignments,
    });

    // Create StudyPlan record in database
    const studyPlan = new StudyPlan({
      user: req.user._id,
      title: generated.title,
      goal: goal.trim(),
      subjects: subjectIds,
      topics: topics.map((t) => t._id),
      examDate: examDate ? new Date(examDate) : null,
      startDate: start,
      endDate: end,
      dailyStudyHours: Number(dailyStudyHours) || 3,
      preferredStudyTime,
      intensity,
      status: 'active',
      sessions: generated.sessions,
      appliedToCalendar: false,
      aiModel: generated.aiModel,
      aiPromptContext: {
        goal: goal.trim(),
        dailyStudyHours,
        preferredStudyTime,
        intensity,
      },
    });

    studyPlan.recalculateSummary();
    await studyPlan.save();

    const populated = await StudyPlan.findById(studyPlan._id)
      .populate('subjects', 'title code color')
      .populate('topics', 'title')
      .populate('sessions.subject', 'title code color')
      .populate('sessions.topic', 'title');

    return res.status(201).json({
      success: true,
      message: 'AI Study Plan generated successfully with Gemini!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all study plans for current authenticated student
 * @route   GET /api/study-plans
 * @access  Private (Student)
 */
export const getStudyPlans = async (req, res, next) => {
  try {
    const plans = await StudyPlan.find({ user: req.user._id })
      .populate('subjects', 'title code color')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single study plan by ID
 * @route   GET /api/study-plans/:id
 * @access  Private (Student)
 */
export const getStudyPlanById = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findById(req.params.id)
      .populate('subjects', 'title code color')
      .populate('topics', 'title')
      .populate('sessions.subject', 'title code color')
      .populate('sessions.topic', 'title');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    if (plan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this study plan',
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update study plan metadata or sessions
 * @route   PUT /api/study-plans/:id
 * @access  Private (Student)
 */
export const updateStudyPlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    if (plan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this study plan',
      });
    }

    const { title, goal, status, sessions } = req.body;

    if (title !== undefined) plan.title = title.trim();
    if (goal !== undefined) plan.goal = goal.trim();
    if (status !== undefined) plan.status = status;
    if (sessions !== undefined && Array.isArray(sessions)) plan.sessions = sessions;

    plan.recalculateSummary();
    await plan.save();

    const populated = await StudyPlan.findById(plan._id)
      .populate('subjects', 'title code color')
      .populate('topics', 'title')
      .populate('sessions.subject', 'title code color')
      .populate('sessions.topic', 'title');

    return res.status(200).json({
      success: true,
      message: 'Study plan updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Apply approved study plan sessions to the interactive Calendar
 *          Converts plan sessions into real MongoDB StudySession records!
 * @route   POST /api/study-plans/:id/apply-to-calendar
 * @access  Private (Student)
 */
export const applyPlanToCalendar = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    if (plan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan',
      });
    }

    let createdCount = 0;

    for (const session of plan.sessions) {
      // If not already synced to a StudySession
      if (!session.studySessionId) {
        const studySession = await StudySession.create({
          user: plan.user,
          subject: session.subject || plan.subjects[0],
          topic: session.topic || null,
          title: session.title,
          description: session.description || '',
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration || 60,
          color: session.color || '#FFD6FF',
          notes: session.recommendations || '',
          status: session.isCompleted ? 'completed' : 'scheduled',
          completedAt: session.isCompleted ? session.completedAt || new Date() : null,
          aiGenerated: true,
          aiPlanId: plan._id.toString(),
          aiMetadata: {
            recommendedInterval: session.recommendations || '',
            focusTopic: session.focusAreas ? session.focusAreas.join(', ') : '',
          },
        });

        session.studySessionId = studySession._id;
        createdCount++;
      }
    }

    plan.appliedToCalendar = true;
    await plan.save();

    const populated = await StudyPlan.findById(plan._id)
      .populate('subjects', 'title code color')
      .populate('topics', 'title')
      .populate('sessions.subject', 'title code color')
      .populate('sessions.topic', 'title');

    // Trigger notification confirming calendar schedule
    if (createdCount > 0) {
      try {
        await notificationService.createNotification({
          recipient: plan.user,
          type: 'study_session_scheduled',
          title: `Study Plan Synced (${createdCount} sessions)`,
          message: `"${plan.title}" added ${createdCount} study sessions to your calendar. Check your agenda to start revising!`,
          category: 'reminder',
          priority: 'normal',
          link: `/calendar`,
          relatedEntity: {
            entityId: plan._id,
            entityType: 'StudyPlan',
          },
          metadata: {
            planId: plan._id,
            sessionsCount: createdCount,
          },
        });
      } catch (notifErr) {
        console.error('Notification error on calendar apply:', notifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${createdCount} study sessions to your Calendar! 📅✨`,
      data: populated,
      sessionsCreated: createdCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle completion of an individual session in study plan
 * @route   PATCH /api/study-plans/:id/sessions/:sessionId/toggle
 * @access  Private (Student)
 */
export const togglePlanSessionComplete = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    if (plan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan',
      });
    }

    const session = plan.sessions.id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found in this study plan',
      });
    }

    session.isCompleted = !session.isCompleted;
    session.completedAt = session.isCompleted ? new Date() : null;

    // If synced to Calendar StudySession, update that record as well!
    if (session.studySessionId) {
      await StudySession.findByIdAndUpdate(session.studySessionId, {
        status: session.isCompleted ? 'completed' : 'scheduled',
        completedAt: session.isCompleted ? new Date() : null,
      });
    }

    plan.recalculateSummary();
    await plan.save();

    const populated = await StudyPlan.findById(plan._id)
      .populate('subjects', 'title code color')
      .populate('topics', 'title')
      .populate('sessions.subject', 'title code color')
      .populate('sessions.topic', 'title');

    return res.status(200).json({
      success: true,
      message: session.isCompleted ? 'Session marked completed! 🎉' : 'Session marked active',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate plan with updated constraints
 * @route   POST /api/study-plans/:id/regenerate
 * @access  Private (Student)
 */
export const regeneratePlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    if (plan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this study plan',
      });
    }

    const {
      goal = plan.goal,
      dailyStudyHours = plan.dailyStudyHours,
      preferredStudyTime = plan.preferredStudyTime,
      intensity = plan.intensity,
    } = req.body;

    const subjects = await Subject.find({ _id: { $in: plan.subjects } });
    const topics = await Topic.find({ _id: { $in: plan.topics } });

    const upcomingAssignments = await Assignment.find({
      subject: { $in: plan.subjects },
      dueDate: { $gte: plan.startDate, $lte: plan.endDate },
      status: 'published',
    });

    const regenerated = await generateAIStudyPlan({
      goal,
      subjects,
      topics,
      examDate: plan.examDate,
      startDate: plan.startDate,
      endDate: plan.endDate,
      dailyStudyHours: Number(dailyStudyHours) || 3,
      preferredStudyTime,
      intensity,
      upcomingAssignments,
    });

    // Update plan with new sessions
    plan.title = regenerated.title;
    plan.goal = goal;
    plan.dailyStudyHours = Number(dailyStudyHours) || 3;
    plan.preferredStudyTime = preferredStudyTime;
    plan.intensity = intensity;
    plan.sessions = regenerated.sessions;
    plan.appliedToCalendar = false; // reset calendar application flag
    plan.recalculateSummary();

    await plan.save();

    const populated = await StudyPlan.findById(plan._id)
      .populate('subjects', 'title code color')
      .populate('topics', 'title')
      .populate('sessions.subject', 'title code color')
      .populate('sessions.topic', 'title');

    return res.status(200).json({
      success: true,
      message: 'Study plan regenerated successfully with Gemini AI!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete study plan (and optionally clean up synced calendar sessions)
 * @route   DELETE /api/study-plans/:id
 * @access  Private (Student)
 */
export const deleteStudyPlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    if (plan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this study plan',
      });
    }

    // Clean up created calendar sessions if present
    const sessionIds = plan.sessions
      .map((s) => s.studySessionId)
      .filter(Boolean);

    if (sessionIds.length > 0) {
      await StudySession.deleteMany({ _id: { $in: sessionIds } });
    }

    await plan.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Study plan and associated calendar sessions deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
