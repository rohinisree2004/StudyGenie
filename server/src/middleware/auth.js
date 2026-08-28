import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect middleware: Ensures the request contains a valid Bearer JWT
 * and attaches the authenticated user object to `req.user`.
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'studygenie_super_secret_jwt_key_2026_default'
    );

    // Find user by ID and ensure user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}. Please contact support.`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid, malformed, or expired token.',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Grants access only if `req.user.role` is included in `...roles`
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in first.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`,
      });
    }

    next();
  };
};
