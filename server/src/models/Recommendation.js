import mongoose from 'mongoose';

const weakTopicRecommendationSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    topicTitle: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    subjectTitle: {
      type: String,
      default: 'General',
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    currentMastery: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    diagnosticReason: {
      type: String,
      required: true,
      trim: true,
    },
    recommendedAction: {
      type: String,
      required: true,
      trim: true,
    },
    actionUrl: {
      type: String,
      default: '',
    },
    actionType: {
      type: String,
      enum: ['quiz', 'material', 'assistant', 'plan'],
      default: 'quiz',
    },
  },
  { _id: true }
);

const subjectAttentionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    subjectTitle: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      default: '#BBD0FF',
    },
    priorityLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    hoursLogged: {
      type: Number,
      default: 0,
    },
    suggestedWeeklyHours: {
      type: Number,
      default: 4,
    },
    statusNote: {
      type: String,
      default: '',
      trim: true,
    },
    actionUrl: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const studyScheduleAdviceSchema = new mongoose.Schema(
  {
    recommendedDailyMinutes: {
      type: Number,
      default: 120,
    },
    recommendedWeeklyHours: {
      type: Number,
      default: 14,
    },
    optimalStudyTime: {
      type: String,
      default: 'evening',
    },
    streakAdvice: {
      type: String,
      default: '',
    },
    workloadPacing: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const prioritizedDeadlineSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    itemType: {
      type: String,
      enum: ['task', 'assignment'],
      default: 'task',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectTitle: {
      type: String,
      default: 'General',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      default: 'high',
    },
    daysRemaining: {
      type: Number,
      default: 0,
    },
    aiTactic: {
      type: String,
      default: '',
      trim: true,
    },
    actionUrl: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const revisionStrategySchema = new mongoose.Schema(
  {
    strategyName: {
      type: String,
      required: true,
      trim: true,
    },
    technique: {
      type: String,
      default: 'Active Recall',
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    applicableTopic: {
      type: String,
      default: '',
      trim: true,
    },
    actionUrl: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const recommendedResourceSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ['quiz', 'material', 'note'],
      default: 'quiz',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectTitle: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    actionUrl: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const recommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recommendation must belong to a student'],
      index: true,
    },
    summaryQuote: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Summary quote cannot exceed 300 characters'],
    },
    overview: {
      keyFocusArea: { type: String, default: '' },
      overallAssessment: { type: String, default: '' },
      performanceTier: { type: String, default: 'Building Foundations' },
      recommendedFocusSubject: { type: String, default: '' },
    },
    weakTopicRecommendations: [weakTopicRecommendationSchema],
    subjectAttention: [subjectAttentionSchema],
    studyScheduleAdvice: studyScheduleAdviceSchema,
    prioritizedDeadlines: [prioritizedDeadlineSchema],
    revisionStrategies: [revisionStrategySchema],
    recommendedResources: [recommendedResourceSchema],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Cached for 24 hours
      index: true,
    },
    aiModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    isApplied: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

recommendationSchema.index({ user: 1, expiresAt: -1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
