import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';

/**
 * Helper to verify if user can manage topics for a given subject
 */
const canManageSubjectTopics = (user, subject) => {
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && subject.teacher && subject.teacher.toString() === user.id.toString()) {
    return true;
  }
  return false;
};

/**
 * @desc    Get all topics for a subject
 * @route   GET /api/subjects/:subjectId/topics
 * @access  Private
 */
export const getTopicsBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topics = await Topic.find({ subject: subjectId }).sort('order');

    const topicsWithCompletion = topics.map((topic) => {
      const isCompleted = topic.completedBy.some(
        (userId) => userId.toString() === req.user.id.toString()
      );
      return {
        id: topic._id,
        title: topic.title,
        description: topic.description,
        order: topic.order,
        difficulty: topic.difficulty,
        estimatedHours: topic.estimatedHours,
        isCompleted,
        completedCount: topic.completedBy.length,
        createdAt: topic.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: topicsWithCompletion.length,
      topics: topicsWithCompletion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new topic in a subject
 * @route   POST /api/subjects/:subjectId/topics
 * @access  Private (Admin or assigned Teacher)
 */
export const createTopic = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { title, description, difficulty, estimatedHours, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a topic title' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (!canManageSubjectTopics(req.user, subject)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to add topics to this subject',
      });
    }

    // Auto calculate order if not provided
    let topicOrder = order;
    if (topicOrder === undefined) {
      const lastTopic = await Topic.findOne({ subject: subjectId }).sort('-order');
      topicOrder = lastTopic ? lastTopic.order + 1 : 1;
    }

    const topic = await Topic.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      subject: subjectId,
      difficulty: difficulty || 'intermediate',
      estimatedHours: estimatedHours ? Number(estimatedHours) : 2,
      order: topicOrder,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic: {
        id: topic._id,
        title: topic.title,
        description: topic.description,
        order: topic.order,
        difficulty: topic.difficulty,
        estimatedHours: topic.estimatedHours,
        isCompleted: false,
        createdAt: topic.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a topic
 * @route   PUT /api/topics/:id
 * @access  Private (Admin or assigned Teacher)
 */
export const updateTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const subject = await Subject.findById(topic.subject);
    if (!subject || !canManageSubjectTopics(req.user, subject)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this topic',
      });
    }

    const { title, description, difficulty, estimatedHours, order } = req.body;

    if (title) topic.title = title.trim();
    if (description !== undefined) topic.description = description.trim();
    if (difficulty) topic.difficulty = difficulty;
    if (estimatedHours !== undefined) topic.estimatedHours = Number(estimatedHours);
    if (order !== undefined) topic.order = Number(order);

    await topic.save();

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully',
      topic: {
        id: topic._id,
        title: topic.title,
        description: topic.description,
        order: topic.order,
        difficulty: topic.difficulty,
        estimatedHours: topic.estimatedHours,
        isCompleted: topic.completedBy.includes(req.user.id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a topic
 * @route   DELETE /api/topics/:id
 * @access  Private (Admin or assigned Teacher)
 */
export const deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const subject = await Subject.findById(topic.subject);
    if (!subject || !canManageSubjectTopics(req.user, subject)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this topic',
      });
    }

    await topic.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student toggles topic completion for self progress
 * @route   POST /api/topics/:id/toggle-completion
 * @access  Private (Student)
 */
export const toggleTopicCompletion = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const studentId = req.user.id;
    const isCompleted = topic.completedBy.some((id) => id.toString() === studentId.toString());

    if (isCompleted) {
      topic.completedBy = topic.completedBy.filter((id) => id.toString() !== studentId.toString());
    } else {
      topic.completedBy.push(studentId);
    }

    await topic.save();

    // Calculate updated progress for the parent subject
    const allSubjectTopics = await Topic.find({ subject: topic.subject });
    const completedSubjectTopics = allSubjectTopics.filter((t) =>
      t.completedBy.some((id) => id.toString() === studentId.toString())
    );

    const progressPercentage =
      allSubjectTopics.length > 0
        ? Math.round((completedSubjectTopics.length / allSubjectTopics.length) * 100)
        : 0;

    res.status(200).json({
      success: true,
      message: !isCompleted ? 'Topic marked as completed! 🎯' : 'Topic marked as in-progress',
      isCompleted: !isCompleted,
      progress: progressPercentage,
      totalCompleted: completedSubjectTopics.length,
      totalTopics: allSubjectTopics.length,
    });
  } catch (error) {
    next(error);
  }
};
