import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Quiz must belong to a creator'],
      index: true,
    },
    creatorRole: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
      default: 'student',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Quiz must be assigned to a subject'],
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['subject_topic', 'note', 'material', 'summary', 'custom'],
      default: 'subject_topic',
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'adaptive'],
      default: 'medium',
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'mixed'],
      default: 'multiple_choice',
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 25,
      default: 5,
    },
    timeLimit: {
      type: Number,
      default: 0, // Minutes (0 = untimed)
    },
    passingScore: {
      type: Number,
      default: 70, // Percentage
    },
    questions: [questionSchema],
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    aiModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for high performance querying
quizSchema.index({ subject: 1, isPublished: 1, createdAt: -1 });
quizSchema.index({ creator: 1, createdAt: -1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
