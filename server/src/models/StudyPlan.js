import mongoose from 'mongoose';

const planSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    color: {
      type: String,
      default: '#FFD6FF',
      enum: ['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'],
    },
    studySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudySession',
      default: null,
    },
    focusAreas: [
      {
        type: String,
        trim: true,
      },
    ],
    recommendations: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const studyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Study plan must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a study plan title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    goal: {
      type: String,
      required: [true, 'Please provide a study goal'],
      trim: true,
      maxlength: [500, 'Goal cannot exceed 500 characters'],
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    examDate: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    dailyStudyHours: {
      type: Number,
      default: 3,
      min: [1, 'Daily study hours must be at least 1'],
      max: [12, 'Daily study hours cannot exceed 12'],
    },
    preferredStudyTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
      default: 'evening',
    },
    intensity: {
      type: String,
      enum: ['relaxed', 'balanced', 'intensive'],
      default: 'balanced',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    sessions: [planSessionSchema],
    appliedToCalendar: {
      type: Boolean,
      default: false,
      index: true,
    },
    aiModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    aiPromptContext: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    summary: {
      totalSessions: { type: Number, default: 0 },
      totalHours: { type: Number, default: 0 },
      completedSessions: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast retrieval by user and status
studyPlanSchema.index({ user: 1, status: 1, createdAt: -1 });

// Helper method to recalculate summary statistics
studyPlanSchema.methods.recalculateSummary = function () {
  const total = this.sessions.length;
  const completed = this.sessions.filter((s) => s.isCompleted).length;
  const totalMinutes = this.sessions.reduce((acc, s) => acc + (s.duration || 60), 0);

  this.summary = {
    totalSessions: total,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    completedSessions: completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };

  if (total > 0 && completed === total) {
    this.status = 'completed';
  } else if (this.status === 'completed' && completed < total) {
    this.status = 'active';
  }
};

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

export default StudyPlan;
