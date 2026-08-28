import fs from 'fs';
import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * @desc    Get current user profile & preferences
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        gradeLevel: user.gradeLevel,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        accountStatus: user.accountStatus,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile information
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, bio, institution, gradeLevel, phone, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (institution !== undefined) user.institution = institution.trim();
    if (gradeLevel !== undefined) user.gradeLevel = gradeLevel.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        gradeLevel: user.gradeLevel,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        accountStatus: user.accountStatus,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update learning & study preferences
 * @route   PUT /api/users/preferences
 * @access  Private
 */
export const updateUserPreferences = async (req, res, next) => {
  try {
    const {
      dailyStudyGoalHours,
      learningStyle,
      preferredStudyTime,
      reminderFrequency,
      emailNotifications,
      aiAssistanceLevel,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    if (dailyStudyGoalHours !== undefined) {
      user.preferences.dailyStudyGoalHours = Number(dailyStudyGoalHours);
    }
    if (learningStyle) user.preferences.learningStyle = learningStyle;
    if (preferredStudyTime) user.preferences.preferredStudyTime = preferredStudyTime;
    if (reminderFrequency) user.preferences.reminderFrequency = reminderFrequency;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = Boolean(emailNotifications);
    if (aiAssistanceLevel) user.preferences.aiAssistanceLevel = aiAssistanceLevel;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Study preferences saved successfully',
      preferences: user.preferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of active teachers (for Admin subject assignment)
 * @route   GET /api/users/teachers
 * @access  Private
 */
export const getTeachersList = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher', accountStatus: 'active' })
      .select('name email institution avatar')
      .sort('name');

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload profile picture / avatar to Cloudinary
 * @route   PUT /api/users/avatar
 * @access  Private
 */
export const uploadUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload.',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user already had a Cloudinary avatar, delete previous asset
    if (user.cloudinaryAvatarId) {
      await deleteFromCloudinary(user.cloudinaryAvatarId, 'image');
    }

    // Upload to Cloudinary with face detection & square crop
    const uploadResult = await uploadToCloudinary(req.file.path, {
      folder: 'studygenie/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Remove local temp upload
    if (fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Could not remove temp file after Cloudinary upload:', err.message);
      }
    }

    user.avatar = uploadResult.url;
    user.cloudinaryAvatarId = uploadResult.publicId;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully!',
      avatar: user.avatar,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        institution: user.institution,
        gradeLevel: user.gradeLevel,
        phone: user.phone,
        bio: user.bio,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    next(error);
  }
};

/**
 * @desc    Remove user profile picture / avatar
 * @route   DELETE /api/users/avatar
 * @access  Private
 */
export const removeUserAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.cloudinaryAvatarId) {
      await deleteFromCloudinary(user.cloudinaryAvatarId, 'image');
    }

    user.avatar = '';
    user.cloudinaryAvatarId = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo removed.',
      avatar: '',
    });
  } catch (error) {
    next(error);
  }
};
