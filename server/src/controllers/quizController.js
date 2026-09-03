import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Material from '../models/Material.js';
import Summary from '../models/Summary.js';
import { generateQuizQuestions } from '../services/geminiService.js';
import notificationService from '../services/notificationService.js';

/**
 * @desc    Generate a new AI Quiz using Gemini
 * @route   POST /api/quizzes/generate
 * @access  Private (Student, Teacher, Admin)
 */
export const generateQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      subjectId,
      topicId,
      sourceType = 'subject_topic',
      sourceId,
      customText,
      totalQuestions = 5,
      difficulty = 'medium',
      questionType = 'multiple_choice',
      timeLimit = 0,
      isPublished,
    } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a subject for the quiz',
      });
    }

    // 1. Fetch Subject and Topic
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    let topic = null;
    if (topicId) {
      topic = await Topic.findById(topicId);
    }

    // 2. Resolve content from chosen source
    let resolvedContent = customText || '';
    let quizTitle = title ? title.trim() : '';

    if (sourceType === 'note') {
      if (!sourceId) {
        return res.status(400).json({ success: false, message: 'Please provide sourceId for note' });
      }
      const note = await Note.findOne({ _id: sourceId, user: req.user._id });
      if (!note) {
        return res.status(404).json({ success: false, message: 'Note not found or access denied' });
      }
      resolvedContent = `${note.title}\n\n${note.content}`;
      if (!quizTitle) quizTitle = `Quiz: ${note.title}`;
    } else if (sourceType === 'material') {
      if (!sourceId) {
        return res.status(400).json({ success: false, message: 'Please provide sourceId for material' });
      }
      const material = await Material.findById(sourceId);
      if (!material) {
        return res.status(404).json({ success: false, message: 'Study material not found' });
      }
      resolvedContent = material.aiExtractedText && material.aiExtractedText.trim()
        ? material.aiExtractedText
        : `${material.title}\n\n${material.description || 'Course material'}`;
      if (!quizTitle) quizTitle = `Quiz: ${material.title}`;
    } else if (sourceType === 'summary') {
      if (!sourceId) {
        return res.status(400).json({ success: false, message: 'Please provide sourceId for summary' });
      }
      const summary = await Summary.findOne({ _id: sourceId, user: req.user._id });
      if (!summary) {
        return res.status(404).json({ success: false, message: 'Summary not found or access denied' });
      }
      resolvedContent = `${summary.title}\n\nExecutive Summary: ${summary.shortSummary}\n\nDetailed Synthesis: ${summary.detailedSummary}\n\nKey Points: ${summary.keyPoints?.join('\n')}`;
      if (!quizTitle) quizTitle = `Quiz: ${summary.title}`;
    }

    if (!quizTitle) {
      quizTitle = topic
        ? `${topic.title} Practice Quiz`
        : `${subject.title} Practice Quiz`;
    }

    // 3. Generate Questions with Gemini AI Engine
    const { questions, aiModel } = await generateQuizQuestions({
      title: quizTitle,
      content: resolvedContent,
      subject,
      topic,
      totalQuestions,
      difficulty,
      questionType,
    });

    if (!questions || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'AI failed to generate valid quiz questions. Please try again.',
      });
    }

    // Teachers default to published for class, students default to true (practice)
    const publishState = isPublished !== undefined
      ? Boolean(isPublished)
      : true;

    // 4. Save Quiz in MongoDB
    const newQuiz = new Quiz({
      title: quizTitle,
      description: description || `AI-generated ${difficulty} quiz on ${topic ? topic.title : subject.title}.`,
      creator: req.user._id,
      creatorRole: req.user.role,
      subject: subject._id,
      topic: topic ? topic._id : null,
      sourceType,
      sourceId: sourceId || null,
      difficulty,
      questionType,
      totalQuestions: questions.length,
      timeLimit: parseInt(timeLimit, 10) || 0,
      passingScore: 70,
      questions,
      isPublished: publishState,
      aiModel,
    });

    await newQuiz.save();

    await newQuiz.populate([
      { path: 'subject', select: 'title code' },
      { path: 'topic', select: 'title' },
      { path: 'creator', select: 'name role' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully! 🎯',
      data: newQuiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all quizzes accessible to current user
 * @route   GET /api/quizzes
 * @access  Private
 */
export const getQuizzes = async (req, res, next) => {
  try {
    const { subjectId, difficulty, creatorRole, search, tab } = req.query;

    const query = {};

    // Filter by subject if specified
    if (subjectId) {
      query.subject = subjectId;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (creatorRole) {
      query.creatorRole = creatorRole;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Role-based visibility logic
    if (req.user.role === 'student') {
      if (tab === 'practice') {
        // Only student's personal generated quizzes
        query.creator = req.user._id;
      } else if (tab === 'class') {
        // Teacher published quizzes for enrolled subjects
        query.creatorRole = { $in: ['teacher', 'admin'] };
        query.isPublished = true;
        if (req.user.enrolledSubjects && req.user.enrolledSubjects.length > 0) {
          query.subject = { $in: req.user.enrolledSubjects };
        }
      } else {
        // Default: Show student's own quizzes OR published class quizzes
        query.$or = [
          { creator: req.user._id },
          {
            creatorRole: { $in: ['teacher', 'admin'] },
            isPublished: true,
            subject: { $in: req.user.enrolledSubjects || [] },
          },
        ];
      }
    } else if (req.user.role === 'teacher') {
      if (tab === 'my_quizzes') {
        query.creator = req.user._id;
      } else {
        query.$or = [
          { creator: req.user._id },
          { subject: { $in: req.user.assignedSubjects || [] } },
        ];
      }
    }

    const quizzes = await Quiz.find(query)
      .select('-questions.correctAnswerIndex -questions.explanation') // Do not leak answers in list view
      .populate('subject', 'title code')
      .populate('topic', 'title')
      .populate('creator', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single quiz by ID (sanitizes answers in 'take' mode)
 * @route   GET /api/quizzes/:id
 * @access  Private
 */
export const getQuizById = async (req, res, next) => {
  try {
    const { mode } = req.query; // 'take' | 'review'

    const quiz = await Quiz.findById(req.params.id)
      .populate('subject', 'title code category')
      .populate('topic', 'title description')
      .populate('creator', 'name role');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // In examination 'take' mode, strip answers and explanations from response
    if (mode === 'take') {
      const sanitizedQuiz = quiz.toObject();
      sanitizedQuiz.questions = sanitizedQuiz.questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        difficulty: q.difficulty,
      }));

      return res.status(200).json({
        success: true,
        data: sanitizedQuiz,
      });
    }

    // Review / Teacher edit mode: include full questions with explanations
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a quiz attempt and automatically calculate score
 * @route   POST /api/quizzes/:id/attempt
 * @access  Private (Student, Teacher, Admin)
 */
export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { answers = [], timeTakenSeconds = 0, startedAt } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Build question answer map
    const questionMap = new Map();
    quiz.questions.forEach((q) => {
      questionMap.set(q._id.toString(), q);
    });

    let correctCount = 0;
    const evaluatedAnswers = [];

    quiz.questions.forEach((question) => {
      const qIdStr = question._id.toString();
      const submitted = answers.find(
        (a) => (a.questionId || a._id || '').toString() === qIdStr
      );

      const selectedIdx = submitted && submitted.selectedOptionIndex !== undefined
        ? parseInt(submitted.selectedOptionIndex, 10)
        : null;

      const isCorrect = selectedIdx !== null && selectedIdx === question.correctAnswerIndex;

      if (isCorrect) correctCount += 1;

      evaluatedAnswers.push({
        questionId: question._id,
        selectedOptionIndex: selectedIdx,
        isCorrect,
        timeSpentSeconds: submitted ? submitted.timeSpentSeconds || 0 : 0,
      });
    });

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= (quiz.passingScore || 70);

    // Pedagogical qualitative feedback
    let feedback = '';
    if (score >= 90) {
      feedback = 'Outstanding mastery! You demonstrated thorough understanding of core theorems and principles.';
    } else if (score >= 70) {
      feedback = 'Great job! You passed with solid comprehension. Review the missed questions to achieve perfection.';
    } else if (score >= 50) {
      feedback = 'Good foundation, but several key concepts need review. Take time to study the explanations below.';
    } else {
      feedback = 'Revision recommended. Work through this topic with the AI Learning Assistant to reinforce fundamentals.';
    }

    const attempt = new QuizAttempt({
      user: req.user._id,
      quiz: quiz._id,
      subject: quiz.subject,
      topic: quiz.topic,
      answers: evaluatedAnswers,
      score,
      correctCount,
      totalQuestions,
      passed,
      startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - (timeTakenSeconds || 60) * 1000),
      completedAt: new Date(),
      timeTakenSeconds: Math.max(timeTakenSeconds || 0, 1),
      feedback,
    });

    await attempt.save();

    // Update Quiz statistics
    const currentAttempts = quiz.attemptsCount || 0;
    const currentAvg = quiz.averageScore || 0;
    const newAttempts = currentAttempts + 1;
    const newAvg = Math.round((currentAvg * currentAttempts + score) / newAttempts);

    quiz.attemptsCount = newAttempts;
    quiz.averageScore = newAvg;
    await quiz.save();

    // Trigger quiz_result notification for student
    try {
      await notificationService.createNotification({
        recipient: req.user._id,
        type: 'quiz_result',
        title: `Quiz Completed: ${quiz.title} (${score}%)`,
        message: `You scored ${score}% (${correctCount}/${totalQuestions} correct). ${passed ? '🎉 Congratulations on passing!' : 'Keep practicing to master this concept.'}`,
        category: 'achievement',
        priority: 'normal',
        link: `/quizzes/${quiz._id}/results/${attempt._id}`,
        relatedEntity: {
          entityId: attempt._id,
          entityType: 'QuizAttempt',
        },
        metadata: {
          quizId: quiz._id,
          quizTitle: quiz.title,
          score,
          passed,
          correctCount,
          totalQuestions,
        },
      });
    } catch (notifErr) {
      console.error('Notification error on quiz submission:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Quiz submitted and evaluated! 🏆',
      data: {
        attemptId: attempt._id,
        score,
        correctCount,
        totalQuestions,
        passed,
        passingScore: quiz.passingScore,
        timeTakenSeconds: attempt.timeTakenSeconds,
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed attempt review by attempt ID
 * @route   GET /api/quizzes/attempts/:id
 * @access  Private
 */
export const getAttemptById = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('subject', 'title code')
      .populate('topic', 'title')
      .populate('user', 'name email');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found',
      });
    }

    // Ensure only the student or teacher/admin can view attempt details
    if (
      attempt.user._id.toString() !== req.user._id.toString() &&
      req.user.role === 'student'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this attempt',
      });
    }

    // Retrieve original quiz with full explanations
    const quiz = await Quiz.findById(attempt.quiz)
      .populate('subject', 'title code')
      .populate('topic', 'title');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Referenced quiz no longer exists',
      });
    }

    // Combine attempt answers with questions and explanations
    const reviewQuestions = quiz.questions.map((q) => {
      const qAnswer = attempt.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      return {
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        selectedOptionIndex: qAnswer ? qAnswer.selectedOptionIndex : null,
        isCorrect: qAnswer ? qAnswer.isCorrect : false,
        explanation: q.explanation,
        difficulty: q.difficulty,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        difficulty: quiz.difficulty,
        subject: quiz.subject,
        topic: quiz.topic,
        score: attempt.score,
        correctCount: attempt.correctCount,
        totalQuestions: attempt.totalQuestions,
        passed: attempt.passed,
        passingScore: quiz.passingScore,
        timeTakenSeconds: attempt.timeTakenSeconds,
        feedback: attempt.feedback,
        completedAt: attempt.completedAt,
        questions: reviewQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's past quiz attempts
 * @route   GET /api/quizzes/attempts
 * @access  Private
 */
export const getUserAttempts = async (req, res, next) => {
  try {
    const { quizId, subjectId } = req.query;

    const query = { user: req.user._id };

    if (quizId) query.quiz = quizId;
    if (subjectId) query.subject = subjectId;

    const attempts = await QuizAttempt.find(query)
      .populate('quiz', 'title difficulty totalQuestions timeLimit')
      .populate('subject', 'title code')
      .populate('topic', 'title')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quiz details / publish toggle (Teacher, Creator, Admin)
 * @route   PATCH /api/quizzes/:id
 * @access  Private
 */
export const updateQuiz = async (req, res, next) => {
  try {
    const { title, description, timeLimit, isPublished } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this quiz' });
    }

    if (title !== undefined) quiz.title = title.trim();
    if (description !== undefined) quiz.description = description.trim();
    if (timeLimit !== undefined) quiz.timeLimit = parseInt(timeLimit, 10) || 0;
    if (isPublished !== undefined) quiz.isPublished = Boolean(isPublished);

    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a quiz (Creator, Teacher, Admin)
 * @route   DELETE /api/quizzes/:id
 * @access  Private
 */
export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this quiz' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    await QuizAttempt.deleteMany({ quiz: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Quiz and associated attempts deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
