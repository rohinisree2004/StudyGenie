import crypto from 'crypto';
import User from '../models/User.js';

/**
 * Helper to generate response with JWT token and sanitized user object
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      avatar: user.avatar,
      bio: user.bio,
      institution: user.institution,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
};

/**
 * @desc    Register a new user (Student or Teacher)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, institution, bio } = req.body;

    // Validate presence
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    // Role Security: Only student and teacher can be registered via public endpoint
    const requestedRole = (role || 'student').toLowerCase();
    if (requestedRole === 'admin') {
      return res.status(403).json({
        success: false,
        message:
          'Admin accounts cannot be registered publicly. System administrator privileges must be provisioned internally.',
      });
    }

    if (!['student', 'teacher'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected. Allowed roles for registration are Student or Teacher.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: requestedRole,
      institution: institution || '',
      bio: bio || '',
      lastLogin: new Date(),
    });

    sendTokenResponse(user, 201, res, 'Registration successful! Welcome to StudyGenie.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user & include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.accountStatus}. Please contact support for assistance.`,
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        avatar: user.avatar,
        bio: user.bio,
        institution: user.institution,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password - generates reset token
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // For security, do not leak whether an email exists or not, but provide dev-friendly flow
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.',
      });
    }

    // Generate reset token and save hashed version to DB
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construct reset URL for frontend
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log(`\n======================================================`);
    console.log(`[StudyGenie Password Reset Link Generated]`);
    console.log(`User: ${user.email} (${user.name})`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Expires in: 15 minutes`);
    console.log(`======================================================\n`);

    res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully.',
      // Providing resetToken in payload to facilitate seamless local testing and UI demo
      devResetToken: resetToken,
      resetUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password using token
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { resettoken } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid new password with at least 6 characters.',
      });
    }

    // Hash token to compare with DB hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.lastLogin = new Date();

    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful! You are now logged in.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (Client-side clears token; endpoint confirms clearance)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully. Token cleared.',
  });
};
