import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'assignment_created',
        'assignment_graded',
        'deadline_reminder',
        'material_uploaded',
        'announcement_posted',
        'quiz_result',
        'study_session_scheduled',
        'recommendation_ready',
        'system',
      ],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: ['academic', 'announcement', 'reminder', 'achievement', 'system'],
      default: 'academic',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    relatedEntity: {
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      entityType: {
        type: String,
        enum: [
          'Assignment',
          'Material',
          'Announcement',
          'QuizAttempt',
          'Quiz',
          'StudySession',
          'StudyPlan',
          'Recommendation',
          'Subject',
          'Task',
          'User',
          'SystemBroadcast',
          'System',
        ],
        default: 'System',
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for high-throughput queries and de-duplication checks
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, 'relatedEntity.entityId': 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
