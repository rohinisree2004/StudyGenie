import Announcement from '../models/Announcement.js';
import Subject from '../models/Subject.js';
import notificationService from '../services/notificationService.js';

/**
 * @desc    Get announcements based on role & enrollment
 * @route   GET /api/announcements
 * @access  Private (All authenticated users)
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const { subjectId, priority, status, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (req.user.role === 'student') {
      // Students only see published announcements for enrolled subjects
      const enrolledSubjects = await Subject.find({
        enrolledStudents: req.user._id,
        status: 'active',
      }).select('_id');
      const enrolledIds = enrolledSubjects.map((s) => s._id);

      query.subject = { $in: enrolledIds };
      query.status = 'published';
    } else if (req.user.role === 'teacher') {
      // Teachers see announcements for subjects they teach or created
      const taughtSubjects = await Subject.find({
        $or: [{ teacher: req.user._id }, { createdBy: req.user._id }],
      }).select('_id');
      const taughtIds = taughtSubjects.map((s) => s._id);

      query.$or = [{ teacher: req.user._id }, { subject: { $in: taughtIds } }];

      if (status && status !== 'all') {
        query.status = status;
      }
    } else if (req.user.role === 'admin') {
      if (status && status !== 'all') {
        query.status = status;
      }
    }

    if (subjectId && subjectId !== 'all') {
      query.subject = subjectId;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('teacher', 'name email avatar role')
        .populate('subject', 'title code category color enrolledStudents')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Announcement.countDocuments(query),
    ]);

    // Compute student read status
    const formatted = announcements.map((item) => {
      const obj = item.toObject();
      const readRecord = item.readBy?.find(
        (r) => r.student?.toString() === req.user._id.toString()
      );
      obj.isReadByMe = Boolean(readRecord);
      obj.readAt = readRecord ? readRecord.readAt : null;
      obj.totalEnrolled = item.subject?.enrolledStudents?.length || 0;
      obj.readCount = item.readBy?.length || 0;
      return obj;
    });

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single announcement details & mark read for student
 * @route   GET /api/announcements/:id
 * @access  Private (All authenticated users)
 */
export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('teacher', 'name email avatar role')
      .populate('subject', 'title code category color enrolledStudents');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Role check: If student, ensure enrollment
    if (req.user.role === 'student') {
      const isEnrolled = announcement.subject?.enrolledStudents?.some(
        (id) => id.toString() === req.user._id.toString()
      );
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not enrolled in the subject for this announcement.',
        });
      }

      // Mark student read if not already marked
      const alreadyRead = announcement.readBy.some(
        (r) => r.student?.toString() === req.user._id.toString()
      );
      if (!alreadyRead) {
        announcement.readBy.push({
          student: req.user._id,
          readAt: new Date(),
        });
        await announcement.save();
      }
    }

    const obj = announcement.toObject();
    const readRecord = announcement.readBy?.find(
      (r) => r.student?.toString() === req.user._id.toString()
    );
    obj.isReadByMe = Boolean(readRecord);
    obj.totalEnrolled = announcement.subject?.enrolledStudents?.length || 0;
    obj.readCount = announcement.readBy?.length || 0;

    res.status(200).json({
      success: true,
      data: obj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new announcement (Teacher, Admin)
 * @route   POST /api/announcements
 * @access  Private (Teacher, Admin)
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, subject, priority = 'normal', isPinned = false, status = 'published', attachments = [] } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an announcement title',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide announcement content',
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Please select a subject for this announcement',
      });
    }

    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Teacher ownership check
    if (req.user.role === 'teacher') {
      const isTeacher = subjectDoc.teacher?.toString() === req.user._id.toString();
      const isCreator = subjectDoc.createdBy?.toString() === req.user._id.toString();
      if (!isTeacher && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to teach this course.',
        });
      }
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      subject,
      teacher: req.user._id,
      priority,
      isPinned: Boolean(isPinned),
      status,
      attachments,
      readBy: [],
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('teacher', 'name email avatar role')
      .populate('subject', 'title code category color enrolledStudents');

    // Automatically trigger notification to all enrolled students if published
    if (status === 'published') {
      const priorityLevel = priority === 'urgent' ? 'urgent' : (priority === 'important' ? 'high' : 'normal');
      const snippet = content.trim().length > 100 ? `${content.trim().substring(0, 97)}...` : content.trim();

      await notificationService.notifyEnrolledStudents(subject, {
        sender: req.user._id,
        type: 'announcement_posted',
        title: `📢 Announcement: ${title.trim()}`,
        message: `${req.user.name} posted in ${subjectDoc.title}: "${snippet}"`,
        category: 'announcement',
        priority: priorityLevel,
        link: `/subjects/${subject}`,
        relatedEntity: {
          entityId: announcement._id,
          entityType: 'Announcement',
        },
        metadata: {
          announcementId: announcement._id,
          subjectTitle: subjectDoc.title,
          subjectCode: subjectDoc.code,
          priority,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update announcement (Teacher who created it, Admin)
 * @route   PUT /api/announcements/:id
 * @access  Private (Teacher, Admin)
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Ownership check
    if (announcement.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit announcements you authored.',
      });
    }

    const { title, content, priority, isPinned, status, attachments } = req.body;

    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content.trim();
    if (priority !== undefined) announcement.priority = priority;
    if (isPinned !== undefined) announcement.isPinned = Boolean(isPinned);
    if (status !== undefined) announcement.status = status;
    if (attachments !== undefined) announcement.attachments = attachments;

    await announcement.save();

    const updated = await Announcement.findById(announcement._id)
      .populate('teacher', 'name email avatar role')
      .populate('subject', 'title code category color enrolledStudents');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete announcement (Teacher who created it, Admin)
 * @route   DELETE /api/announcements/:id
 * @access  Private (Teacher, Admin)
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Ownership check
    if (announcement.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete announcements you authored.',
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle pinned state for announcement
 * @route   PATCH /api/announcements/:id/pin
 * @access  Private (Teacher, Admin)
 */
export const togglePinAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    if (announcement.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only pin announcements you authored.',
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    res.status(200).json({
      success: true,
      message: announcement.isPinned ? 'Announcement pinned to top' : 'Announcement unpinned',
      data: {
        id: announcement._id,
        isPinned: announcement.isPinned,
      },
    });
  } catch (error) {
    next(error);
  }
};
