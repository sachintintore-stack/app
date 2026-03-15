const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Verify JWT Token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional Authentication (for public routes that can be enhanced for logged-in users)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    req.user = user || null;
    req.userId = user ? user.id : null;
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Check Subscription Middleware
const requireSubscription = (plans = ['monthly', 'yearly']) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userPlan = req.user.subscriptionPlan;
      const subscriptionStatus = req.user.subscriptionStatus;

      // Check if user has required plan and it's active
      const hasValidPlan = plans.includes(userPlan) && subscriptionStatus === 'active';
      
      // Free plan users can have up to 5 assignments
      if (userPlan === 'free' && !plans.includes('free')) {
        return res.status(403).json({
          success: false,
          message: 'Premium subscription required for this feature',
          upgradeRequired: true,
          currentPlan: userPlan
        });
      }

      if (!hasValidPlan && userPlan !== 'free') {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          upgradeRequired: true,
          currentPlan: userPlan
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription'
      });
    }
  };
};

// Admin Only Middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  requireSubscription,
  requireAdmin,
  JWT_SECRET
};
