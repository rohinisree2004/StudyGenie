import Notification from '../models/Notification.js';
import Subject from '../models/Subject.js';
import Assignment from '../models/Assignment.js';
import Task from '../models/Task.js';
import StudySession from '../models/StudySession.js';

class NotificationService {
  /**
   * Create a single notification with intelligent de-duplication
   */
  async createNotification({
    recipient,
    sender = null,
    type,
    title,
    message,
    category = 'academic',
    priority = 'normal',
    link = '',
    relatedEntity = {},
    metadata = {},
    expiresAt = null,
  }) {
    try {
      if (!recipient || !type || !title || !message) {
        throw new Error('Missing required notification parameters');
      }

      // Check for recent duplicate (last 24 hours) for the same entity and recipient
      if (relatedEntity && relatedEntity.entityId) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingRecent = await Notification.findOne({
          recipient,
          type,
          'relatedEntity.entityId': relatedEntity.entityId,
          createdAt: { $gte: oneDayAgo },
        });

        if (existingRecent) {
          // If already unread, update timestamp and message rather than creating a duplicate
          if (!existingRecent.isRead) {
            existingRecent.title = title;
            existingRecent.message = message;
            existingRecent.priority = priority;
            existingRecent.metadata = { ...existingRecent.metadata, ...metadata };
            await existingRecent.save();
            return existingRecent;
          }
          // If already read, skip duplicate notification
          return existingRecent;
        }
      }

      const notification = await Notification.create({
        recipient,
        sender,
        type,
        title: title.trim(),
        message: message.trim(),
        category,
        priority,
        link: link ? link.trim() : '',
        relatedEntity: {
          entityId: relatedEntity?.entityId || null,
          entityType: relatedEntity?.entityType || 'System',
        },
        metadata,
        expiresAt,
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error.message);
      return null;
    }
  }

  /**
   * Broadcast notification to all enrolled students in a course
   */
  async notifyEnrolledStudents(subjectId, notificationTemplate) {
    try {
      const subject = await Subject.findById(subjectId).select('title code color enrolledStudents');
      if (!subject || !subject.enrolledStudents || subject.enrolledStudents.length === 0) {
        return 0;
      }

      const createdNotifications = [];
      for (const studentId of subject.enrolledStudents) {
        const notif = await this.createNotification({
          ...notificationTemplate,
          recipient: studentId,
          metadata: {
            ...notificationTemplate.metadata,
            subjectTitle: subject.title,
            subjectCode: subject.code,
            subjectColor: subject.color,
          },
        });
        if (notif) createdNotifications.push(notif);
      }

      return createdNotifications.length;
    } catch (error) {
      console.error('Error notifying enrolled students:', error.message);
      return 0;
    }
  }

  /**
   * Auto-scan upcoming deadlines & scheduled sessions for a student
   * Generates reminders if within 48 hours and not already notified
   */
  async checkUpcomingDeadlines(studentId) {
    try {
      let remindersGenerated = 0;
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // 1. Scan assignments for enrolled subjects
      const enrolledSubjects = await Subject.find({ enrolledStudents: studentId, status: 'active' }).select('_id title code color');
      const subjectIds = enrolledSubjects.map((s) => s._id);
      const subjectMap = new Map(enrolledSubjects.map((s) => [s._id.toString(), s]));

      if (subjectIds.length > 0) {
        const upcomingAssignments = await Assignment.find({
          subject: { $in: subjectIds },
          status: 'published',
          dueDate: { $gte: now, $lte: in48Hours },
        });

        for (const assignment of upcomingAssignments) {
          // Check if student has submitted
          const submission = assignment.submissions?.find(
            (s) => s.student.toString() === studentId.toString()
          );

          if (!submission || (submission.status !== 'completed' && submission.status !== 'graded')) {
            const hoursLeft = Math.max(1, Math.round((new Date(assignment.dueDate) - now) / (1000 * 60 * 60)));
            const subject = subjectMap.get(assignment.subject.toString());
            const priority = hoursLeft <= 24 ? 'urgent' : 'high';

            const notif = await this.createNotification({
              recipient: studentId,
              type: 'deadline_reminder',
              title: `Upcoming Assignment Deadline (${hoursLeft}h left)`,
              message: `"${assignment.title}" for ${subject?.title || 'your course'} is due soon on ${new Date(assignment.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
              category: 'reminder',
              priority,
              link: `/assignments/${assignment._id}`,
              relatedEntity: {
                entityId: assignment._id,
                entityType: 'Assignment',
              },
              metadata: {
                dueDate: assignment.dueDate,
                hoursRemaining: hoursLeft,
                subjectTitle: subject?.title,
                subjectCode: subject?.code,
                subjectColor: subject?.color,
              },
            });

            if (notif) remindersGenerated++;
          }
        }
      }

      // 2. Scan pending student tasks
      const upcomingTasks = await Task.find({
        user: studentId,
        isCompleted: false,
        status: { $ne: 'completed' },
        dueDate: { $gte: now, $lte: in48Hours },
      }).populate('subject', 'title code color');

      for (const task of upcomingTasks) {
        const hoursLeft = Math.max(1, Math.round((new Date(task.dueDate) - now) / (1000 * 60 * 60)));
        const priority = hoursLeft <= 24 ? 'urgent' : 'high';

        const notif = await this.createNotification({
          recipient: studentId,
          type: 'deadline_reminder',
          title: `Task Due Soon: ${task.title}`,
          message: `Your study task "${task.title}" is due in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}. Don't forget to complete it!`,
          category: 'reminder',
          priority,
          link: `/tasks/${task._id}`,
          relatedEntity: {
            entityId: task._id,
            entityType: 'Task',
          },
          metadata: {
            dueDate: task.dueDate,
            hoursRemaining: hoursLeft,
            subjectTitle: task.subject?.title,
          },
        });

        if (notif) remindersGenerated++;
      }

      // 3. Scan today's scheduled study sessions
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const todaySessions = await StudySession.find({
        user: studentId,
        status: 'scheduled',
        startTime: { $gte: now, $lte: endOfDay },
      }).populate('subject', 'title code color').populate('topic', 'title');

      for (const session of todaySessions) {
        const timeDiffMinutes = Math.round((new Date(session.startTime) - now) / (1000 * 60));
        const formattedTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const notif = await this.createNotification({
          recipient: studentId,
          type: 'study_session_scheduled',
          title: `Study Session: ${session.title}`,
          message: `Scheduled today at ${formattedTime} (${session.duration} min) for ${session.subject?.title || 'Subject'}. Get ready!`,
          category: 'reminder',
          priority: timeDiffMinutes <= 60 ? 'high' : 'normal',
          link: `/calendar`,
          relatedEntity: {
            entityId: session._id,
            entityType: 'StudySession',
          },
          metadata: {
            startTime: session.startTime,
            subjectTitle: session.subject?.title,
            topicTitle: session.topic?.title,
          },
        });

        if (notif) remindersGenerated++;
      }

      return { remindersGenerated };
    } catch (error) {
      console.error('Error checking upcoming deadlines:', error.message);
      return { remindersGenerated: 0 };
    }
  }

  /**
   * Get user notifications with filtering and pagination
   */
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      isRead,
      category,
      type,
      search,
    } = options;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { recipient: userId };

    if (isRead !== undefined && isRead !== null && isRead !== 'all') {
      query.isRead = isRead === 'true' || isRead === true;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { message: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name email avatar role')
        .sort({ isRead: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        unreadCount,
      },
    };
  }

  /**
   * Fast unread count for navbar badges
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  /**
   * Delete single notification
   */
  async deleteNotification(notificationId, userId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
    return result;
  }

  /**
   * Clear all read notifications
   */
  async clearReadNotifications(userId) {
    const result = await Notification.deleteMany({
      recipient: userId,
      isRead: true,
    });
    return result.deletedCount;
  }
}

export default new NotificationService();
