import Task from '../models/Task.js';
import Assignment from '../models/Assignment.js';
import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';

/**
 * @desc    Get aggregated calendar events (tasks, assignments, study sessions)
 * @route   GET /api/calendar/events
 * @access  Private
 */
export const getCalendarEvents = async (req, res, next) => {
  try {
    const { startDate, endDate, subject, types } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);

    const allowedTypes = types ? types.split(',').map((t) => t.trim()) : ['tasks', 'assignments', 'study_sessions'];

    const events = [];

    // 1. Fetch User Tasks
    if (allowedTypes.includes('tasks')) {
      const taskQuery = {
        user: req.user._id,
        dueDate: { $gte: start, $lte: end },
      };
      if (subject && subject !== 'all') taskQuery.subject = subject;

      const tasks = await Task.find(taskQuery)
        .populate('subject', 'title code color')
        .populate('topic', 'title');

      tasks.forEach((task) => {
        const due = new Date(task.dueDate);
        const durationMins = task.estimatedDuration || 30;
        const endTime = new Date(due.getTime() + durationMins * 60000);

        events.push({
          id: `task-${task._id}`,
          originalId: task._id,
          title: task.title,
          description: task.description,
          start: due,
          end: endTime,
          allDay: false,
          type: 'task',
          priority: task.priority,
          status: task.status,
          isCompleted: task.isCompleted,
          color: task.color || '#B8C0FF',
          subject: task.subject,
          topic: task.topic,
          estimatedDuration: task.estimatedDuration,
        });
      });
    }

    // 2. Fetch Assignments
    if (allowedTypes.includes('assignments')) {
      let assignmentQuery = {
        dueDate: { $gte: start, $lte: end },
      };

      if (req.user.role === 'student') {
        const enrolledSubjects = await Subject.find({ enrolledStudents: req.user._id }).select('_id');
        const subjectIds = enrolledSubjects.map((s) => s._id);
        assignmentQuery.subject = { $in: subjectIds };
        assignmentQuery.status = 'published';
      } else if (req.user.role === 'teacher') {
        const teacherSubjects = await Subject.find({ teacher: req.user._id }).select('_id');
        const subjectIds = teacherSubjects.map((s) => s._id);
        assignmentQuery.$or = [{ teacher: req.user._id }, { subject: { $in: subjectIds } }];
      }

      if (subject && subject !== 'all') assignmentQuery.subject = subject;

      const assignments = await Assignment.find(assignmentQuery)
        .populate('subject', 'title code color')
        .populate('topic', 'title');

      assignments.forEach((assignment) => {
        const due = new Date(assignment.dueDate);
        const mySub = assignment.submissions?.find(
          (s) => s.student.toString() === req.user._id.toString()
        );

        events.push({
          id: `assignment-${assignment._id}`,
          originalId: assignment._id,
          title: `Assignment: ${assignment.title}`,
          description: assignment.description,
          start: due,
          end: due,
          allDay: false,
          type: 'assignment',
          priority: 'high',
          status: mySub ? mySub.status : 'pending',
          isCompleted: Boolean(mySub),
          color: '#E7C6FF', // Soft Pastel Mauve for assignments
          subject: assignment.subject,
          topic: assignment.topic,
          totalPoints: assignment.totalPoints,
        });
      });
    }

    // 3. Fetch Study Sessions
    if (allowedTypes.includes('study_sessions')) {
      const sessionQuery = {
        user: req.user._id,
        startTime: { $gte: start, $lte: end },
      };
      if (subject && subject !== 'all') sessionQuery.subject = subject;

      const sessions = await StudySession.find(sessionQuery)
        .populate('subject', 'title code color')
        .populate('topic', 'title')
        .populate('task', 'title priority');

      sessions.forEach((session) => {
        events.push({
          id: `session-${session._id}`,
          originalId: session._id,
          title: `Study: ${session.title}`,
          description: session.description,
          start: new Date(session.startTime),
          end: new Date(session.endTime),
          allDay: false,
          type: 'study_session',
          priority: 'medium',
          status: session.status,
          isCompleted: session.status === 'completed',
          color: session.color || '#FFD6FF', // Soft Pastel Pink
          subject: session.subject,
          topic: session.topic,
          duration: session.duration,
          notes: session.notes,
        });
      });
    }

    // Sort chronologically by start date
    events.sort((a, b) => new Date(a.start) - new Date(b.start));

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};
