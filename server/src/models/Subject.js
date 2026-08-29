import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a subject title'],
      trim: true,
      maxlength: [100, 'Subject title cannot exceed 100 characters'],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    color: {
      type: String,
      default: '#BBD0FF', // Soft Pastel Sky default
      enum: ['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    enrolledStudents: [
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
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for topics belonging to this subject
subjectSchema.virtual('topics', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'subject',
  justOne: false,
});

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
