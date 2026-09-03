import mongoose from 'mongoose';

const importantTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const revisionNoteSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    tip: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Summary must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Summary title is required'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters'],
    },
    sourceType: {
      type: String,
      enum: ['note', 'material', 'custom'],
      required: true,
      default: 'custom',
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      default: null,
      index: true,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      default: null,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    originalContentSnippet: {
      type: String,
      default: '',
      trim: true,
      maxlength: 600,
    },
    shortSummary: {
      type: String,
      required: [true, 'Short summary is required'],
      trim: true,
    },
    detailedSummary: {
      type: String,
      required: [true, 'Detailed summary is required'],
      trim: true,
    },
    keyPoints: [
      {
        type: String,
        trim: true,
      },
    ],
    importantTerms: [importantTermSchema],
    revisionNotes: [revisionNoteSchema],
    focusMode: {
      type: String,
      enum: ['balanced', 'exam', 'deep_dive'],
      default: 'balanced',
    },
    isSaved: {
      type: Boolean,
      default: true,
      index: true,
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

// Indexes for fast retrieval and user library queries
summarySchema.index({ user: 1, isSaved: 1, updatedAt: -1 });
summarySchema.index({ user: 1, subject: 1 });

const Summary = mongoose.model('Summary', summarySchema);

export default Summary;
