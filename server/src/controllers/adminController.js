import mongoose from 'mongoose';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudySession from '../models/StudySession.js';
import Notification from '../models/Notification.js';

/**
 * @desc    Get aggregated platform statistics & metrics
 * @route   GET /api/admin/dashboard-stats
 * @access  Private (Admin only)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      studentsCount,
      teachersCount,
      adminsCount,
      activeUsersCount,
      suspendedUsersCount,
      totalSubjects,
      activeSubjects,
      archivedSubjects,
      totalTopics,
      totalMaterials,
      totalQuizzes,
      totalQuizAttempts,
      totalStudySessions,
      storageAggregate,
      hoursAggregate,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ accountStatus: 'active' }),
      User.countDocuments({ accountStatus: 'suspended' }),
      Subject.countDocuments(),
      Subject.countDocuments({ status: 'active' }),
      Subject.countDocuments({ status: 'archived' }),
      Topic.countDocuments(),
      Material.countDocuments(),
      Quiz.countDocuments(),
      QuizAttempt.countDocuments(),
      StudySession.countDocuments(),
      Material.aggregate([
        { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } },
      ]),
      StudySession.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
      ]),
      User.find()
        .select('name email role accountStatus institution createdAt avatar')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    const totalStorageBytes = storageAggregate[0]?.totalBytes || 0;
    const totalStudyHours = Math.round(((hoursAggregate[0]?.totalMinutes || 0) / 60) * 10) / 10;

    const memoryUsage = process.memoryUsage();
    const systemHealth = {
      status: 'operational',
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      dbHost: mongoose.connection.host || 'MongoDB Atlas',
      memoryHeapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 10) / 10,
      memoryRssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 10) / 10,
    };

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: studentsCount,
          teachers: teachersCount,
          admins: adminsCount,
          active: activeUsersCount,
          suspended: suspendedUsersCount,
        },
        curriculum: {
          totalSubjects,
          activeSubjects,
          archivedSubjects,
          totalTopics,
        },
        resources: {
          totalMaterials,
          totalStorageBytes,
          storageMB: Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10,
          totalQuizzes,
          totalQuizAttempts,
        },
        activity: {
          totalStudySessions,
          totalStudyHours,
        },
        systemHealth,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated, filterable, searchable list of users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.accountStatus = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { institution: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email role accountStatus institution gradeLevel phone bio avatar createdAt lastLogin')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user with academic context (enrolled or taught subjects)
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name email role accountStatus institution gradeLevel phone bio avatar preferences createdAt lastLogin'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let subjects = [];
    if (user.role === 'student') {
      subjects = await Subject.find({ enrolledStudents: user._id })
        .select('title code color category teacher')
        .populate('teacher', 'name email');
    } else if (user.role === 'teacher') {
      subjects = await Subject.find({ teacher: user._id })
        .select('title code color category enrolledStudents status')
        .lean();
      subjects = subjects.map((s) => ({
        ...s,
        studentCount: s.enrolledStudents ? s.enrolledStudents.length : 0,
      }));
    }

    res.status(200).json({
      success: true,
      user,
      subjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin provisions a new user account
 * @route   POST /api/admin/users
 * @access  Private (Admin only)
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', institution, gradeLevel, phone, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    const allowedRoles = ['student', 'teacher', 'admin'];
    const assignedRole = allowedRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      institution: institution ? institution.trim() : '',
      gradeLevel: gradeLevel ? gradeLevel.trim() : '',
      phone: phone ? phone.trim() : '',
      bio: bio ? bio.trim() : '',
      accountStatus: 'active',
    });

    const safeUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: `User account created successfully as ${assignedRole}.`,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin updates a user account profile
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, role, institution, gradeLevel, phone, bio, password } = req.body;

    // Guard: Prevent admin from demoting themselves to a non-admin role
    if (req.user._id.toString() === user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot revoke your own Administrator role.',
      });
    }

    // Check unique email if email is being updated
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailConflict = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailConflict) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account.',
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (role && ['student', 'teacher', 'admin'].includes(role)) user.role = role;
    if (institution !== undefined) user.institution = institution.trim();
    if (gradeLevel !== undefined) user.gradeLevel = gradeLevel.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();

    if (password && password.trim().length >= 6) {
      user.password = password.trim();
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'User account updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin toggles user account status (active vs suspended)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { accountStatus } = req.body;

    if (!accountStatus || !['active', 'suspended', 'pending'].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: active, suspended, pending.',
      });
    }

    // Guard: Prevent admin from suspending their own account
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot suspend your own active Administrator account.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.accountStatus = accountStatus;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account status changed to ${accountStatus}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin safely deletes a user account with cascade safeguards
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    // Guard: Prevent admin self-deletion
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot delete your own Administrator account.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cascade safeguards:
    // 1. If teacher, unassign from subjects rather than deleting the curriculum
    if (user.role === 'teacher') {
      await Subject.updateMany({ teacher: user._id }, { $set: { teacher: null } });
    }

    // 2. If student, pull from enrolled subjects
    if (user.role === 'student') {
      await Subject.updateMany(
        { enrolledStudents: user._id },
        { $pull: { enrolledStudents: user._id } }
      );
    }

    // 3. Remove user notifications
    await Notification.deleteMany({ recipient: user._id });

    // 4. Delete user record
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.email}) deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students with enrollment and study statistics
 * @route   GET /api/admin/students
 * @access  Private (Admin only)
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = { role: 'student' };

    if (status && status !== 'all') {
      query.accountStatus = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { institution: searchRegex }];
    }

    const students = await User.find(query)
      .select('name email accountStatus institution gradeLevel preferences createdAt avatar lastLogin')
      .sort({ createdAt: -1 });

    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const enrolledCount = await Subject.countDocuments({ enrolledStudents: student._id });
        return {
          id: student._id,
          name: student.name,
          email: student.email,
          accountStatus: student.accountStatus,
          institution: student.institution,
          gradeLevel: student.gradeLevel,
          avatar: student.avatar,
          dailyStudyGoalHours: student.preferences?.dailyStudyGoalHours || 4,
          enrolledCount,
          createdAt: student.createdAt,
          lastLogin: student.lastLogin,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithStats.length,
      students: studentsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all teachers with their assigned subjects
 * @route   GET /api/admin/teachers
 * @access  Private (Admin only)
 */
export const getAllTeachers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = { role: 'teacher' };

    if (status && status !== 'all') {
      query.accountStatus = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { institution: searchRegex }];
    }

    const teachers = await User.find(query)
      .select('name email accountStatus institution bio avatar createdAt lastLogin')
      .sort({ createdAt: -1 });

    const teachersWithSubjects = await Promise.all(
      teachers.map(async (teacher) => {
        const assignedSubjects = await Subject.find({ teacher: teacher._id })
          .select('title code color status enrolledStudents')
          .lean();

        const subjectsWithCounts = assignedSubjects.map((s) => ({
          id: s._id,
          title: s.title,
          code: s.code,
          color: s.color,
          status: s.status,
          studentCount: s.enrolledStudents ? s.enrolledStudents.length : 0,
        }));

        return {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          accountStatus: teacher.accountStatus,
          institution: teacher.institution,
          bio: teacher.bio,
          avatar: teacher.avatar,
          assignedSubjects: subjectsWithCounts,
          totalAssigned: subjectsWithCounts.length,
          createdAt: teacher.createdAt,
          lastLogin: teacher.lastLogin,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: teachersWithSubjects.length,
      teachers: teachersWithSubjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign or unassign teacher to subject
 * @route   PATCH /api/admin/subjects/:id/assign-teacher
 * @access  Private (Admin only)
 */
export const assignTeacherToSubject = async (req, res, next) => {
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
          message: 'Specified user is not a registered educator.',
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
      message: teacherId ? 'Teacher assigned successfully.' : 'Teacher unassigned from subject.',
      subject: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all materials across all subjects with filtering
 * @route   GET /api/admin/materials
 * @access  Private (Admin only)
 */
export const getAllMaterials = async (req, res, next) => {
  try {
    const { search, subjectId, fileType, isPublic } = req.query;
    const query = {};

    if (subjectId) {
      query.subject = subjectId;
    }

    if (fileType && fileType !== 'all') {
      query.fileType = fileType;
    }

    if (isPublic !== undefined && isPublic !== 'all') {
      query.isPublic = isPublic === 'true';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { fileName: searchRegex }, { description: searchRegex }];
    }

    const materials = await Material.find(query)
      .populate('subject', 'title code color')
      .populate('topic', 'title')
      .populate('uploadedBy', 'name email role avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle material visibility (public / hidden)
 * @route   PATCH /api/admin/materials/:id/visibility
 * @access  Private (Admin only)
 */
export const updateMaterialVisibility = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    material.isPublic = req.body.isPublic !== undefined ? Boolean(req.body.isPublic) : !material.isPublic;
    await material.save();

    res.status(200).json({
      success: true,
      message: `Material visibility set to ${material.isPublic ? 'Public' : 'Hidden'}.`,
      material,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin deletes a study material
 * @route   DELETE /api/admin/materials/:id
 * @access  Private (Admin only)
 */
export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    await material.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Material removed from platform successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all quizzes across all subjects with filtering
 * @route   GET /api/admin/quizzes
 * @access  Private (Admin only)
 */
export const getAllQuizzes = async (req, res, next) => {
  try {
    const { search, subjectId, difficulty, isPublished } = req.query;
    const query = {};

    if (subjectId) {
      query.subject = subjectId;
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (isPublished !== undefined && isPublished !== 'all') {
      query.isPublished = isPublished === 'true';
    }

    if (search && search.trim()) {
      query.title = new RegExp(search.trim(), 'i');
    }

    const quizzes = await Quiz.find(query)
      .populate('subject', 'title code color')
      .populate('creator', 'name email role')
      .sort({ createdAt: -1 });

    const quizzesWithMeta = quizzes.map((q) => ({
      id: q._id,
      title: q.title,
      description: q.description,
      subject: q.subject,
      creator: q.creator,
      creatorRole: q.creatorRole,
      difficulty: q.difficulty,
      questionCount: q.questions ? q.questions.length : 0,
      passingScore: q.passingScore,
      timeLimit: q.timeLimit,
      attemptsCount: q.attemptsCount || 0,
      averageScore: q.averageScore || 0,
      isPublished: q.isPublished,
      questions: q.questions,
      createdAt: q.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: quizzesWithMeta.length,
      quizzes: quizzesWithMeta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin deletes a quiz
 * @route   DELETE /api/admin/quizzes/:id
 * @access  Private (Admin only)
 */
export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Remove associated attempts
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quiz and associated attempts removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed system health & platform runtime info
 * @route   GET /api/admin/system-health
 * @access  Private (Admin only)
 */
export const getSystemHealth = async (req, res, next) => {
  try {
    const memory = process.memoryUsage();
    const dbStateNames = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

    res.status(200).json({
      success: true,
      system: {
        serverTime: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        uptimeFormatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        database: {
          status: dbStateNames[mongoose.connection.readyState] || 'Unknown',
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host || 'MongoDB Atlas',
          name: mongoose.connection.name || 'studygenie',
        },
        memory: {
          heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
          rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Broadcast platform-wide system notification to users
 * @route   POST /api/admin/broadcast
 * @access  Private (Admin only)
 */
export const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, targetRole = 'all', priority = 'normal', category = 'system' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and broadcast message.',
      });
    }

    const query = { accountStatus: 'active' };
    if (targetRole && targetRole !== 'all') {
      query.role = targetRole;
    }

    const recipients = await User.find(query).select('_id');
    if (!recipients.length) {
      return res.status(200).json({
        success: true,
        message: 'No active users found matching the target audience.',
        sentCount: 0,
      });
    }

    const notifications = recipients.map((r) => ({
      recipient: r._id,
      sender: req.user._id,
      type: 'system',
      title: title.trim(),
      message: message.trim(),
      category: ['system', 'announcement'].includes(category) ? category : 'system',
      priority: ['low', 'normal', 'high', 'urgent'].includes(priority) ? priority : 'normal',
      isRead: false,
      relatedEntity: {
        entityType: 'SystemBroadcast',
        entityId: req.user._id,
      },
      metadata: {
        broadcastBy: req.user.name,
        targetRole,
        sentAt: new Date(),
      },
    }));

    await Notification.insertMany(notifications, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Broadcast successfully dispatched to ${recipients.length} user(s).`,
      sentCount: recipients.length,
      targetRole,
    });
  } catch (error) {
    next(error);
  }
};
