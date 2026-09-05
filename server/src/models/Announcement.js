import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an announcement title'],
      trim: true,
      maxlength: [150, 'Announcement title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide announcement content'],
      trim: true,
      maxlength: [4000, 'Content cannot exceed 4000 characters'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Announcement must be associated with a course/subject'],
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher author is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ['enrolled_students', 'all'],
      default: 'enrolled_students',
    },
    readBy: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        title: { type: String, trim: true, default: '' },
        fileUrl: { type: String, trim: true, default: '' },
        fileType: { type: String, default: 'document' },
      },
    ],
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

// Indexes for fast querying
announcementSchema.index({ subject: 1, status: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ teacher: 1, status: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
