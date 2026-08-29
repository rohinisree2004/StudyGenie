import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a topic title'],
      trim: true,
      maxlength: [120, 'Topic title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Topic description cannot exceed 1000 characters'],
      default: '',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Topic must belong to a subject'],
      index: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    estimatedHours: {
      type: Number,
      default: 2,
      min: [0.5, 'Estimated study time must be at least 0.5 hours'],
      max: [50, 'Estimated study time cannot exceed 50 hours'],
    },
    completedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly sort topics by order within a subject
topicSchema.index({ subject: 1, order: 1 });

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
