import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

/**
 * @desc    Get all study sessions for authenticated student with date range filters
 * @route   GET /api/study-sessions
 * @access  Private
 */
export const getStudySessions = async (req, res, next) => {
  try {
    const { startDate, endDate, subject, status } = req.query;

    const query = { user: req.user._id };

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await StudySession.find(query)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('task', 'title priority isCompleted')
      .populate('material', 'title fileType fileUrl')
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single study session by ID
 * @route   GET /api/study-sessions/:id
 * @access  Private
 */
export const getStudySessionById = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('task', 'title priority isCompleted')
      .populate('material', 'title fileType fileUrl');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found',
      });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this study session',
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new study session
 * @route   POST /api/study-sessions
 * @access  Private
 */
export const createStudySession = async (req, res, next) => {
  try {
    const { title, description, subject, topic, task, material, startTime, endTime, color, notes, status, completedAt } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a study session title',
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Study session must be associated with a subject',
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both start and end time',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time format',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    const durationMinutes = Math.max(5, Math.round((end - start) / (1000 * 60)));
    const sessionStatus = status || 'scheduled';

    const session = await StudySession.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      user: req.user._id,
      subject,
      topic: topic || null,
      task: task || null,
      material: material || null,
      startTime: start,
      endTime: end,
      duration: durationMinutes,
      status: sessionStatus,
      completedAt: sessionStatus === 'completed' ? (completedAt ? new Date(completedAt) : new Date()) : null,
      color: color || '#FFD6FF',
      notes: notes ? notes.trim() : '',
    });

    const populated = await StudySession.findById(session._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('task', 'title priority isCompleted')
      .populate('material', 'title fileType fileUrl');

    return res.status(201).json({
      success: true,
      message: 'Study session scheduled successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update study session
 * @route   PUT /api/study-sessions/:id
 * @access  Private
 */
export const updateStudySession = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found',
      });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session',
      });
    }

    const { title, description, subject, topic, task, material, startTime, endTime, status, color, notes } = req.body;

    if (title !== undefined) session.title = title.trim();
    if (description !== undefined) session.description = description.trim();
    if (subject !== undefined) session.subject = subject;
    if (topic !== undefined) session.topic = topic || null;
    if (task !== undefined) session.task = task || null;
    if (material !== undefined) session.material = material || null;
    if (color !== undefined) session.color = color;
    if (notes !== undefined) session.notes = notes.trim();

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time',
        });
      }
      session.startTime = start;
      session.endTime = end;
      session.duration = Math.max(5, Math.round((end - start) / (1000 * 60)));
    } else if (startTime) {
      session.startTime = new Date(startTime);
    } else if (endTime) {
      session.endTime = new Date(endTime);
    }

    if (status !== undefined) {
      session.status = status;
      if (status === 'completed') {
        session.completedAt = session.completedAt || new Date();
      } else {
        session.completedAt = null;
      }
    }

    await session.save();

    const updated = await StudySession.findById(session._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('task', 'title priority isCompleted')
      .populate('material', 'title fileType fileUrl');

    return res.status(200).json({
      success: true,
      message: 'Study session updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark study session as complete / toggle complete
 * @route   PATCH /api/study-sessions/:id/complete
 * @access  Private
 */
export const completeStudySession = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found',
      });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session',
      });
    }

    if (session.status === 'completed') {
      session.status = 'scheduled';
      session.completedAt = null;
    } else {
      session.status = 'completed';
      session.completedAt = new Date();
    }

    await session.save();

    const populated = await StudySession.findById(session._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order');

    return res.status(200).json({
      success: true,
      message: session.status === 'completed' ? 'Study session completed! Great job 🎉' : 'Study session marked as scheduled',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete study session
 * @route   DELETE /api/study-sessions/:id
 * @access  Private
 */
export const deleteStudySession = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found',
      });
    }

    if (session.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this session',
      });
    }

    await session.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Study session deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
