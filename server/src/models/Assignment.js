import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'completed', 'graded'],
      default: 'pending',
    },
    submissionText: {
      type: String,
      trim: true,
      maxlength: [2000, 'Submission text cannot exceed 2000 characters'],
      default: '',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    grade: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true, timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an assignment title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [3000, 'Instructions cannot exceed 3000 characters'],
      default: '',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Assignment must be linked to a subject'],
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      default: null,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required for assignments'],
      index: true,
    },
    totalPoints: {
      type: Number,
      default: 100,
      min: [1, 'Total points must be at least 1'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    submissions: [submissionSchema],
    // Future AI feature attributes
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiMetadata: {
      learningObjectives: [{ type: String }],
      estimatedDifficulty: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
assignmentSchema.index({ subject: 1, dueDate: 1, status: 1 });
assignmentSchema.index({ teacher: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
