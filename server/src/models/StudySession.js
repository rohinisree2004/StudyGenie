import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a study session title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Study session must belong to a user'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Study session must be associated with a subject'],
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      default: null,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    duration: {
      type: Number, // In minutes
      default: 60,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    color: {
      type: String,
      default: '#FFD6FF', // Soft Pastel Pink
      enum: ['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Future AI Study Planner attributes
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiPlanId: {
      type: String,
      default: '',
    },
    aiMetadata: {
      recommendedInterval: { type: String, default: '' },
      focusTopic: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Performance index for querying sessions by student within calendar date ranges
studySessionSchema.index({ user: 1, startTime: 1, endTime: 1 });
studySessionSchema.index({ user: 1, subject: 1 });

const StudySession = mongoose.model('StudySession', studySessionSchema);

export default StudySession;
