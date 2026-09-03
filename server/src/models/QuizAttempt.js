import mongoose from 'mongoose';

const answerRecordSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attempt must belong to a student'],
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Attempt must reference a quiz'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Attempt must reference a subject'],
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    answers: [answerRecordSchema],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    correctCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for fast historical analytics and student performance queries
quizAttemptSchema.index({ user: 1, quiz: 1, createdAt: -1 });
quizAttemptSchema.index({ user: 1, subject: 1, createdAt: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
