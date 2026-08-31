import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

/**
 * @desc    Get all tasks for current authenticated user with search and filters
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, subject, topic, isCompleted, search, startDate, endDate, sort = 'dueDate' } = req.query;

    // Strict user privacy scoping
    const query = { user: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (topic && topic !== 'all') {
      query.topic = topic;
    }

    if (isCompleted !== undefined && isCompleted !== 'all') {
      query.isCompleted = isCompleted === 'true';
    }

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    let sortOptions = {};
    if (sort === 'dueDate') {
      sortOptions = { isCompleted: 1, dueDate: 1, createdAt: -1 };
    } else if (sort === 'priority') {
      sortOptions = { isCompleted: 1, priority: -1, dueDate: 1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else {
      sortOptions = { isCompleted: 1, dueDate: 1 };
    }

    const tasks = await Task.find(query)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('assignment', 'title dueDate totalPoints')
      .sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('assignment', 'title dueDate totalPoints');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Verify task ownership
    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task',
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      topic,
      assignment,
      priority,
      status,
      dueDate,
      estimatedDuration,
      color,
      tags,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a task title',
      });
    }

    // Validate subject if provided
    if (subject) {
      const subjectExists = await Subject.findById(subject);
      if (!subjectExists) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
      }
    }

    // Validate topic if provided
    if (topic) {
      const topicExists = await Topic.findById(topic);
      if (!topicExists) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found',
        });
      }
    }

    const isDone = status === 'completed';

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      user: req.user._id,
      subject: subject || null,
      topic: topic || null,
      assignment: assignment || null,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : 30,
      isCompleted: isDone,
      completedAt: isDone ? new Date() : null,
      color: color || '#B8C0FF',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' && tags ? tags.split(',').map((t) => t.trim()) : [],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('assignment', 'title dueDate totalPoints');

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Verify ownership
    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
      });
    }

    const {
      title,
      description,
      subject,
      topic,
      assignment,
      priority,
      status,
      dueDate,
      estimatedDuration,
      isCompleted,
      color,
      tags,
    } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (subject !== undefined) task.subject = subject || null;
    if (topic !== undefined) task.topic = topic || null;
    if (assignment !== undefined) task.assignment = assignment || null;
    if (priority !== undefined) task.priority = priority;
    if (color !== undefined) task.color = color;
    if (estimatedDuration !== undefined) task.estimatedDuration = Number(estimatedDuration);

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (tags !== undefined) {
      task.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim())
        : [];
    }

    // Handle status / completion sync
    if (isCompleted !== undefined) {
      task.isCompleted = Boolean(isCompleted);
      if (task.isCompleted) {
        task.status = 'completed';
        task.completedAt = task.completedAt || new Date();
      } else {
        task.status = status && status !== 'completed' ? status : 'todo';
        task.completedAt = null;
      }
    } else if (status !== undefined) {
      task.status = status;
      if (status === 'completed') {
        task.isCompleted = true;
        task.completedAt = task.completedAt || new Date();
      } else {
        task.isCompleted = false;
        task.completedAt = null;
      }
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('assignment', 'title dueDate totalPoints');

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle task completion status
 * @route   PATCH /api/tasks/:id/toggle
 * @access  Private
 */
export const toggleTaskComplete = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
      });
    }

    task.isCompleted = !task.isCompleted;
    if (task.isCompleted) {
      task.status = 'completed';
      task.completedAt = new Date();
    } else {
      task.status = 'todo';
      task.completedAt = null;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('assignment', 'title dueDate totalPoints');

    return res.status(200).json({
      success: true,
      message: task.isCompleted ? 'Task marked as completed' : 'Task marked as active',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task',
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
