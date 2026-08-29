import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';

/**
 * @desc    Get subjects (Role-aware filtering & catalog browse)
 * @route   GET /api/subjects
 * @access  Private
 */
export const getSubjects = async (req, res, next) => {
  try {
    const { browse, category } = req.query;
    let query = { status: 'active' };

    if (category) {
      query.category = category;
    }

    // Role-specific filtering
    if (req.user.role === 'student' && browse !== 'true') {
      // Student default view: subjects they are enrolled in
      query.enrolledStudents = req.user.id;
    } else if (req.user.role === 'teacher' && browse !== 'true') {
      // Teacher default view: subjects they are assigned to
      query.teacher = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin sees all subjects (or by status filter)
      if (req.query.status) query.status = req.query.status;
      else delete query.status; // admin can see all statuses
    }

    const subjects = await Subject.find(query)
      .populate('teacher', 'name email institution avatar')
      .sort({ createdAt: -1 });

    // Attach topic count, student count, and enrollment flag for the requesting user
    const subjectsWithMeta = await Promise.all(
      subjects.map(async (subj) => {
        const topicCount = await Topic.countDocuments({ subject: subj._id });
        const isEnrolled = subj.enrolledStudents.some(
          (studentId) => studentId.toString() === req.user.id.toString()
        );

        let studentProgress = 0;
        if (isEnrolled && topicCount > 0) {
          const completedCount = await Topic.countDocuments({
            subject: subj._id,
            completedBy: req.user.id,
          });
          studentProgress = Math.round((completedCount / topicCount) * 100);
        }

        return {
          id: subj._id,
          title: subj.title,
          code: subj.code,
          description: subj.description,
          category: subj.category,
          color: subj.color,
          status: subj.status,
          teacher: subj.teacher,
          studentCount: subj.enrolledStudents.length,
          topicCount,
          isEnrolled,
          progress: studentProgress,
          createdAt: subj.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: subjectsWithMeta.length,
      subjects: subjectsWithMeta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single subject with details, topics, and completion status
 * @route   GET /api/subjects/:id
 * @access  Private
 */
export const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('teacher', 'name email institution bio avatar')
      .populate('enrolledStudents', 'name email institution avatar');

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Fetch topics belonging to this subject
    const topics = await Topic.find({ subject: subject._id }).sort('order');

    const isEnrolled = subject.enrolledStudents.some(
      (s) => s._id.toString() === req.user.id.toString()
    );

    // Compute topics with user-specific completed flag
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

    const completedTopicsCount = topicsWithCompletion.filter((t) => t.isCompleted).length;
    const progressPercentage =
      topics.length > 0 ? Math.round((completedTopicsCount / topics.length) * 100) : 0;

    res.status(200).json({
      success: true,
      subject: {
        id: subject._id,
        title: subject.title,
        code: subject.code,
        description: subject.description,
        category: subject.category,
        color: subject.color,
        status: subject.status,
        teacher: subject.teacher,
        enrolledStudents:
          req.user.role === 'student'
            ? [] // Privacy: students don't need full student records
            : subject.enrolledStudents,
        studentCount: subject.enrolledStudents.length,
        isEnrolled,
        progress: progressPercentage,
        topicsCount: topics.length,
        completedTopicsCount,
        topics: topicsWithCompletion,
        createdAt: subject.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new subject
 * @route   POST /api/subjects
 * @access  Private (Admin or Teacher)
 */
export const createSubject = async (req, res, next) => {
  try {
    const { title, code, description, category, color, teacherId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a subject title' });
    }

    // Role check: If teacher creates it, assign self
    let assignedTeacher = null;
    if (req.user.role === 'teacher') {
      assignedTeacher = req.user.id;
    } else if (req.user.role === 'admin' && teacherId) {
      assignedTeacher = teacherId;
    }

    const subject = await Subject.create({
      title: title.trim(),
      code: code ? code.trim().toUpperCase() : '',
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'General',
      color: color || '#BBD0FF',
      teacher: assignedTeacher,
      createdBy: req.user.id,
    });

    const populatedSubject = await Subject.findById(subject._id).populate(
      'teacher',
      'name email institution avatar'
    );

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: populatedSubject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a subject
 * @route   PUT /api/subjects/:id
 * @access  Private (Admin or Assigned Teacher)
 */
export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Authorization: Admin or the teacher assigned to this subject
    if (
      req.user.role !== 'admin' &&
      (!subject.teacher || subject.teacher.toString() !== req.user.id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this subject',
      });
    }

    const { title, code, description, category, color, status, teacherId } = req.body;

    if (title) subject.title = title.trim();
    if (code !== undefined) subject.code = code.trim().toUpperCase();
    if (description !== undefined) subject.description = description.trim();
    if (category !== undefined) subject.category = category.trim();
    if (color !== undefined) subject.color = color;
    if (status !== undefined) subject.status = status;

    // Only Admin can reassign teachers
    if (req.user.role === 'admin' && teacherId !== undefined) {
      subject.teacher = teacherId || null;
    }

    await subject.save();

    const updated = await Subject.findById(subject._id).populate(
      'teacher',
      'name email institution avatar'
    );

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      subject: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a subject and its associated topics
 * @route   DELETE /api/subjects/:id
 * @access  Private (Admin only)
 */
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Cascade delete all topics belonging to this subject
    await Topic.deleteMany({ subject: subject._id });
    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject and its associated topics deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student enrolls in a subject
 * @route   POST /api/subjects/:id/enroll
 * @access  Private (Student)
 */
export const enrollSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Check if already enrolled
    const alreadyEnrolled = subject.enrolledStudents.some(
      (id) => id.toString() === req.user.id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this subject',
      });
    }

    subject.enrolledStudents.push(req.user.id);
    await subject.save();

    res.status(200).json({
      success: true,
      message: `Enrolled successfully in ${subject.title}`,
      subjectId: subject._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student unenrolls from a subject
 * @route   POST /api/subjects/:id/unenroll
 * @access  Private (Student)
 */
export const unenrollSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    subject.enrolledStudents = subject.enrolledStudents.filter(
      (id) => id.toString() !== req.user.id.toString()
    );

    await subject.save();

    res.status(200).json({
      success: true,
      message: `Unenrolled from ${subject.title}`,
      subjectId: subject._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign a teacher to a subject
 * @route   PUT /api/subjects/:id/assign-teacher
 * @access  Private (Admin only)
 */
export const assignTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (teacherId) {
      const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: 'Specified teacher account not found or is not a registered educator',
        });
      }
      subject.teacher = teacher._id;
    } else {
      subject.teacher = null;
    }

    await subject.save();

    const updated = await Subject.findById(subject._id).populate(
      'teacher',
      'name email institution avatar'
    );

    res.status(200).json({
      success: true,
      message: 'Teacher assigned successfully',
      subject: updated,
    });
  } catch (error) {
    next(error);
  }
};
