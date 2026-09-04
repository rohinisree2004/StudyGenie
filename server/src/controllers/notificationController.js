import notificationService from '../services/notificationService.js';

/**
 * @desc    Get user notifications with pagination & filtering
 * @route   GET /api/notifications
 * @access  Private (All authenticated users)
 */
export const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user._id, req.query);
    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get rapid unread notifications count for badge
 * @route   GET /api/notifications/unread-count
 * @access  Private (All authenticated users)
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user._id);
    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (All authenticated users)
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all unread notifications as read
 * @route   PATCH /api/notifications/mark-all-read
 * @access  Private (All authenticated users)
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const modifiedCount = await notificationService.markAllAsRead(req.user._id);
    res.status(200).json({
      success: true,
      message: `Marked ${modifiedCount} notification(s) as read`,
      data: { modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (All authenticated users)
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await notificationService.deleteNotification(req.params.id, req.user._id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all read notifications for current user
 * @route   DELETE /api/notifications/clear-read
 * @access  Private (All authenticated users)
 */
export const clearReadNotifications = async (req, res, next) => {
  try {
    const deletedCount = await notificationService.clearReadNotifications(req.user._id);
    res.status(200).json({
      success: true,
      message: `Cleared ${deletedCount} read notification(s)`,
      data: { deletedCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger auto-scan of upcoming deadlines & scheduled sessions
 * @route   POST /api/notifications/check-reminders
 * @access  Private (All authenticated users)
 */
export const checkUpcomingReminders = async (req, res, next) => {
  try {
    const result = await notificationService.checkUpcomingDeadlines(req.user._id);
    res.status(200).json({
      success: true,
      message: `Check completed. ${result.remindersGenerated} new reminder(s) generated.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
