import recommendationService from '../services/recommendationService.js';
import notificationService from '../services/notificationService.js';

/**
 * @desc    Get AI study recommendations for student (returns cached if < 24h old unless force=true)
 * @route   GET /api/recommendations
 * @access  Private (Students: own data; Teachers/Admin: can query studentId)
 */
export const getStudentRecommendations = async (req, res, next) => {
  try {
    const { force = 'false', studentId } = req.query;

    let targetStudentId = req.user._id;
    if (studentId && ['teacher', 'admin'].includes(req.user.role)) {
      targetStudentId = studentId;
    }

    const forceRefresh = force === 'true';
    const result = await recommendationService.getStudentRecommendations(targetStudentId, forceRefresh);

    res.status(200).json({
      success: true,
      data: result.recommendation,
      cached: result.cached,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate fresh AI recommendations (explicitly bypasses cache)
 * @route   POST /api/recommendations/generate
 * @access  Private (Students: own data; Teachers/Admin: can query studentId)
 */
export const regenerateRecommendations = async (req, res, next) => {
  try {
    const { studentId } = req.body;

    let targetStudentId = req.user._id;
    if (studentId && ['teacher', 'admin'].includes(req.user.role)) {
      targetStudentId = studentId;
    }

    const result = await recommendationService.getStudentRecommendations(targetStudentId, true);

    // Trigger notification if recommendations contain weak concepts needing attention
    if (result.recommendation?.weakTopics?.length > 0) {
      try {
        const topWeak = result.recommendation.weakTopics[0];
        await notificationService.createNotification({
          recipient: targetStudentId,
          type: 'recommendation_ready',
          title: `AI Study Insight: Focus on ${topWeak.topicTitle}`,
          message: `Gemini AI diagnosed "${topWeak.topicTitle}" (${topWeak.subjectTitle}) with ${topWeak.currentMastery}% mastery. Revision is recommended.`,
          category: 'academic',
          priority: topWeak.urgency === 'high' ? 'high' : 'normal',
          link: `/recommendations`,
          relatedEntity: {
            entityId: result.recommendation._id,
            entityType: 'Recommendation',
          },
          metadata: {
            topicTitle: topWeak.topicTitle,
            subjectTitle: topWeak.subjectTitle,
            currentMastery: topWeak.currentMastery,
          },
        });
      } catch (notifErr) {
        console.error('Notification error on recommendations generation:', notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Fresh study recommendations generated successfully',
      data: result.recommendation,
      cached: false,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recommendation record by ID
 * @route   GET /api/recommendations/:id
 * @access  Private
 */
export const getRecommendationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recommendation = await recommendationService.getRecommendationById(
      id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};
