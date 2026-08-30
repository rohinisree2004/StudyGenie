import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a material title'],
      trim: true,
      maxlength: [150, 'Material title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'pptx', 'txt', 'image', 'other'],
      default: 'pdf',
    },
    fileSize: {
      type: Number,
      default: 0, // In bytes
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Material must be assigned to a subject'],
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    // Future AI feature integration attributes
    aiExtractedText: {
      type: String,
      default: '',
    },
    aiProcessed: {
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

// Indexes for high performance search and filtering
materialSchema.index({ subject: 1, topic: 1 });
materialSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Material = mongoose.model('Material', materialSchema);

export default Material;
