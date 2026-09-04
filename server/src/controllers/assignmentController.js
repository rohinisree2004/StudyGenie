import Assignment from '../models/Assignment.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import notificationService from '../services/notificationService.js';

/**
 * @desc    Get assignments based on user role
 *          - Teachers/Admins: assignments created by them or in their assigned subjects
 *          - Students: published assignments for enrolled subjects, including personal completion status
 * @route   GET /api/assignments
 * @access  Private
 */
export const getAssignments = async (req, res, next) => {
  try {
    const { subject, topic, status, search, sort = 'dueDate' } = req.query;
    let query = {};

    if (req.user.role === 'teacher') {
      // Find subjects assigned to this teacher
      const teacherSubjects = await Subject.find({ teacher: req.user._id }).select('_id');
      const subjectIds = teacherSubjects.map((s) => s._id);

      query.$or = [{ teacher: req.user._id }, { subject: { $in: subjectIds } }];
    } else if (req.user.role === 'student') {
      // Find subjects enrolled by this student
      const enrolledSubjects = await Subject.find({ enrolledStudents: req.user._id }).select('_id');
      const subjectIds = enrolledSubjects.map((s) => s._id);

      query.subject = { $in: subjectIds };
      query.status = 'published'; // Students only see published assignments
    }

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (topic && topic !== 'all') {
      query.topic = topic;
    }

    if (status && status !== 'all' && req.user.role !== 'student') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    let sortOptions = { dueDate: 1 };
    if (sort === 'newest') sortOptions = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };

    const rawAssignments = await Assignment.find(query)
      .populate('subject', 'title code category color enrolledStudents')
      .populate('topic', 'title order')
      .populate('teacher', 'name email avatar')
      .populate('material', 'title fileType fileUrl')
      .sort(sortOptions);

    // Format response based on role
    const assignments = rawAssignments.map((assignment) => {
      const doc = assignment.toObject();
      const totalEnrolled = doc.subject?.enrolledStudents?.length || 0;
      const completedSubmissions = doc.submissions?.filter(
        (s) => s.status === 'completed' || s.status === 'submitted' || s.status === 'graded'
      ) || [];

      if (req.user.role === 'student') {
        // Attach student's personal submission
        const mySubmission = doc.submissions?.find(
          (s) => s.student.toString() === req.user._id.toString()
        );
        return {
          ...doc,
          submissions: undefined, // Hide other students' submissions
          mySubmission: mySubmission || null,
          isCompleted: Boolean(mySubmission),
          completionRate: {
            totalEnrolled,
            completedCount: completedSubmissions.length,
          },
        };
      }

      // Teacher / Admin gets completion statistics
      return {
        ...doc,
        stats: {
          totalEnrolled,
          submittedCount: completedSubmissions.length,
          completionPercentage: totalEnrolled > 0 ? Math.round((completedSubmissions.length / totalEnrolled) * 100) : 0,
        },
      };
    });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single assignment by ID with role-aware submission data
 * @route   GET /api/assignments/:id
 * @access  Private
 */
export const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('subject', 'title code category color enrolledStudents')
      .populate('topic', 'title order')
      .populate('teacher', 'name email avatar')
      .populate('material', 'title fileType fileUrl')
      .populate('submissions.student', 'name email avatar');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Check student authorization: must be enrolled in subject
    if (req.user.role === 'student') {
      const isEnrolled = assignment.subject?.enrolledStudents?.some(
        (id) => id.toString() === req.user._id.toString()
      );

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in the subject for this assignment',
        });
      }

      const doc = assignment.toObject();
      const mySubmission = doc.submissions?.find(
        (s) => s.student?._id?.toString() === req.user._id.toString() || s.student?.toString() === req.user._id.toString()
      );

      return res.status(200).json({
        success: true,
        data: {
          ...doc,
          submissions: undefined,
          mySubmission: mySubmission || null,
          isCompleted: Boolean(mySubmission),
        },
      });
    }

    // For Teacher/Admin: retrieve full roster with enrolled students
    // We populate enrolled students so teacher sees everyone who hasn't submitted yet
    const populatedSubject = await Subject.findById(assignment.subject._id)
      .populate('enrolledStudents', 'name email avatar');

    const enrolledList = populatedSubject?.enrolledStudents || [];
    const submissionMap = new Map();
    assignment.submissions.forEach((sub) => {
      const studentId = sub.student?._id?.toString() || sub.student?.toString();
      if (studentId) submissionMap.set(studentId, sub);
    });

    const roster = enrolledList.map((student) => {
      const studentId = student._id.toString();
      const sub = submissionMap.get(studentId);
      return {
        student,
        status: sub ? sub.status : 'pending',
        submissionText: sub ? sub.submissionText : '',
        submittedAt: sub ? sub.submittedAt : null,
        grade: sub ? sub.grade : null,
        feedback: sub ? sub.feedback : '',
        submissionId: sub ? sub._id : null,
      };
    });

    const doc = assignment.toObject();
    return res.status(200).json({
      success: true,
      data: {
        ...doc,
        roster,
        stats: {
          totalEnrolled: enrolledList.length,
          submittedCount: assignment.submissions.length,
          completionPercentage: enrolledList.length > 0 ? Math.round((assignment.submissions.length / enrolledList.length) * 100) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new assignment (Educator/Admin)
 * @route   POST /api/assignments
 * @access  Private (Teacher, Admin)
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, instructions, subject, topic, material, dueDate, totalPoints, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an assignment title',
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Assignment must be linked to a subject',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a due date and time',
      });
    }

    // Verify subject existence and teacher assignment
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    if (
      req.user.role === 'teacher' &&
      subjectDoc.teacher?.toString() !== req.user._id.toString() &&
      subjectDoc.createdBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to teach this subject',
      });
    }

    if (topic) {
      const topicDoc = await Topic.findById(topic);
      if (!topicDoc) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found',
        });
      }
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      instructions: instructions ? instructions.trim() : '',
      teacher: req.user._id,
      subject,
      topic: topic || null,
      material: material || null,
      dueDate: new Date(dueDate),
      totalPoints: totalPoints ? Number(totalPoints) : 100,
      status: status || 'published',
      submissions: [],
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('subject', 'title code category color enrolledStudents')
      .populate('topic', 'title order')
      .populate('teacher', 'name email avatar')
      .populate('material', 'title fileType fileUrl');

    // Automatically trigger notification to all enrolled students if published
    if (populated.status === 'published') {
      try {
        await notificationService.notifyEnrolledStudents(assignment.subject, {
          sender: req.user._id,
          type: 'assignment_created',
          title: `New Assignment: ${assignment.title}`,
          message: `A new assignment "${assignment.title}" has been posted with due date ${new Date(assignment.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
          category: 'academic',
          priority: 'normal',
          link: `/assignments/${assignment._id}`,
          relatedEntity: {
            entityId: assignment._id,
            entityType: 'Assignment',
          },
          metadata: {
            dueDate: assignment.dueDate,
            totalPoints: assignment.totalPoints,
            subjectTitle: populated.subject?.title,
            subjectCode: populated.subject?.code,
          },
        });
      } catch (notifErr) {
        console.error('Notification error on assignment creation:', notifErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update assignment (Educator/Admin)
 * @route   PUT /api/assignments/:id
 * @access  Private (Teacher, Admin)
 */
export const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Check ownership
    if (assignment.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this assignment',
      });
    }

    const { title, description, instructions, subject, topic, material, dueDate, totalPoints, status } = req.body;

    if (title !== undefined) assignment.title = title.trim();
    if (description !== undefined) assignment.description = description.trim();
    if (instructions !== undefined) assignment.instructions = instructions.trim();
    if (subject !== undefined) assignment.subject = subject;
    if (topic !== undefined) assignment.topic = topic || null;
    if (material !== undefined) assignment.material = material || null;
    if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
    if (totalPoints !== undefined) assignment.totalPoints = Number(totalPoints);
    if (status !== undefined) assignment.status = status;

    await assignment.save();

    const updated = await Assignment.findById(assignment._id)
      .populate('subject', 'title code category color enrolledStudents')
      .populate('topic', 'title order')
      .populate('teacher', 'name email avatar')
      .populate('material', 'title fileType fileUrl');

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete assignment (Educator/Admin)
 * @route   DELETE /api/assignments/:id
 * @access  Private (Teacher, Admin)
 */
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    if (assignment.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment',
      });
    }

    await assignment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit / mark complete assignment (Student)
 * @route   POST /api/assignments/:id/submit
 * @access  Private (Student)
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Verify enrollment
    const subject = await Subject.findById(assignment.subject);
    const isEnrolled = subject?.enrolledStudents?.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in the subject for this assignment',
      });
    }

    const { submissionText } = req.body;

    const existingSubIndex = assignment.submissions.findIndex(
      (s) => s.student.toString() === req.user._id.toString()
    );

    if (existingSubIndex > -1) {
      // Update submission
      assignment.submissions[existingSubIndex].submissionText = submissionText !== undefined ? submissionText.trim() : assignment.submissions[existingSubIndex].submissionText;
      assignment.submissions[existingSubIndex].status = 'completed';
      assignment.submissions[existingSubIndex].submittedAt = new Date();
    } else {
      // Add new submission
      assignment.submissions.push({
        student: req.user._id,
        status: 'completed',
        submissionText: submissionText ? submissionText.trim() : '',
        submittedAt: new Date(),
      });
    }

    await assignment.save();

    const mySubmission = assignment.submissions.find(
      (s) => s.student.toString() === req.user._id.toString()
    );

    return res.status(200).json({
      success: true,
      message: 'Assignment submitted and marked as completed!',
      data: {
        assignmentId: assignment._id,
        mySubmission,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Grade / feedback on student assignment submission (Teacher, Admin)
 * @route   PATCH /api/assignments/:id/grade
 * @access  Private (Teacher, Admin)
 */
export const gradeAssignmentSubmission = async (req, res, next) => {
  try {
    const { studentId, grade, feedback } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    if (assignment.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this assignment',
      });
    }

    const sub = assignment.submissions.find(
      (s) => s.student.toString() === studentId.toString()
    );

    if (!sub) {
      // Create graded submission entry if student marked offline
      assignment.submissions.push({
        student: studentId,
        status: 'graded',
        submittedAt: new Date(),
        grade: grade !== undefined ? Number(grade) : null,
        feedback: feedback ? feedback.trim() : '',
      });
    } else {
      if (grade !== undefined) sub.grade = Number(grade);
      if (feedback !== undefined) sub.feedback = feedback.trim();
      sub.status = 'graded';
    }

    await assignment.save();

    // Notify the student about graded submission
    try {
      const subjectDoc = await Subject.findById(assignment.subject).select('title code');
      await notificationService.createNotification({
        recipient: studentId,
        sender: req.user._id,
        type: 'assignment_graded',
        title: `Assignment Graded: ${assignment.title}`,
        message: `Your submission for "${assignment.title}" has been graded${grade !== undefined ? `: ${grade}/${assignment.totalPoints} pts` : '.'} View feedback.`,
        category: 'academic',
        priority: 'normal',
        link: `/assignments/${assignment._id}`,
        relatedEntity: {
          entityId: assignment._id,
          entityType: 'Assignment',
        },
        metadata: {
          grade: grade !== undefined ? Number(grade) : null,
          totalPoints: assignment.totalPoints,
          feedback: feedback ? feedback.trim() : '',
          subjectTitle: subjectDoc?.title,
        },
      });
    } catch (notifErr) {
      console.error('Notification error on assignment grading:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Student submission graded successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};
