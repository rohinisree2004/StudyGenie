import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'teacher', 'admin'],
        message: '{VALUE} is not a valid role. Allowed roles: student, teacher, admin',
      },
      default: 'student',
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
    avatar: {
      type: String,
      default: '',
    },
    cloudinaryAvatarId: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
      default: '',
    },
    institution: {
      type: String,
      default: '',
    },
    gradeLevel: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    preferences: {
      dailyStudyGoalHours: {
        type: Number,
        default: 4,
        min: 1,
        max: 16,
      },
      learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'reading/writing', 'kinesthetic', 'balanced'],
        default: 'balanced',
      },
      preferredStudyTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night'],
        default: 'morning',
      },
      reminderFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'none'],
        default: 'daily',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      aiAssistanceLevel: {
        type: String,
        enum: ['guided', 'standard', 'advanced'],
        default: 'standard',
      },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and sign JWT Token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      name: this.name,
      email: this.email,
    },
    process.env.JWT_SECRET || 'studygenie_super_secret_jwt_key_2026_default',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

// Generate and hash password reset token (SHA-256)
userSchema.methods.getResetPasswordToken = function () {
  // Generate random 20 byte hex token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field on user model
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expiration (15 minutes from creation)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
