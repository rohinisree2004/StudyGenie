import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [150, 'Task title cannot exceed 150 characters'],
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
      required: [true, 'Task must belong to a user'],
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
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
      default: 'todo',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedDuration: {
      type: Number, // In minutes (e.g. 30, 45, 60)
      default: 30,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 8 hours'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    color: {
      type: String,
      default: '#B8C0FF', // Soft Pastel Periwinkle default
      enum: ['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // Future AI feature integration attributes
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiMetadata: {
      difficulty: { type: String, default: '' },
      suggestedOrder: { type: Number, default: 0 },
      source: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Performance indexes for querying user tasks by date and status
taskSchema.index({ user: 1, isCompleted: 1, dueDate: 1 });
taskSchema.index({ user: 1, subject: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
