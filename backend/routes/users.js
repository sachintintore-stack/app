const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Assignment, StudySession } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op, Sequelize: sequelize } = require('sequelize');

const router = express.Router();

// Validation middleware (was missing from this file)
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { 
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] 
      }
    });

    // Get quick stats
    const totalAssignments = await Assignment.count({
      where: { userId: req.userId }
    });

    const completedAssignments = await Assignment.count({
      where: { 
        userId: req.userId,
        status: 'completed'
      }
    });

    const totalStudySessions = await StudySession.count({
      where: { 
        userId: req.userId,
        status: 'completed'
      }
    });

    const totalStudyMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed'
      }
    }) || 0;

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalAssignments,
          completedAssignments,
          completionRate: totalAssignments > 0 
            ? Math.round((completedAssignments / totalAssignments) * 100) 
            : 0,
          totalStudySessions,
          totalStudyHours: Math.round(totalStudyMinutes / 60 * 10) / 10
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Update profile
router.put(
  '/profile',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('emailNotifications').optional().isBoolean(),
    body('reminderTime').optional().isInt({ min: 1, max: 168 }),
    validate
  ],
  async (req, res) => {
    try {
      const updates = {};
      const allowedFields = [
        'firstName', 
        'lastName', 
        'avatar', 
        'emailNotifications', 
        'reminderTime'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      await User.update(updates, { where: { id: req.userId } });

      const updatedUser = await User.findByPk(req.userId, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  }
);

// Get user stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Assignment stats
    const assignmentStats = await Assignment.findAll({
      where: { userId: req.userId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    // Priority distribution
    const priorityStats = await Assignment.findAll({
      where: { userId: req.userId },
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('priority')), 'count']
      ],
      group: ['priority']
    });

    // Subject distribution
    const subjectStats = await Assignment.findAll({
      where: { userId: req.userId },
      attributes: [
        'subject',
        [sequelize.fn('COUNT', sequelize.col('subject')), 'count']
      ],
      group: ['subject']
    });

    // Study stats
    const totalStudyMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed'
      }
    }) || 0;

    const weeklyStudyMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed',
        startTime: {
          [Op.gte]: startOfWeek
        }
      }
    }) || 0;

    const monthlyStudyMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed',
        startTime: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // Get user streak info
    const user = await User.findByPk(req.userId, {
      attributes: ['studyStreak', 'lastStudyDate', 'totalStudyMinutes']
    });

    res.json({
      success: true,
      data: {
        assignments: {
          byStatus: assignmentStats.reduce((acc, s) => {
            acc[s.status] = parseInt(s.get('count'));
            return acc;
          }, {}),
          byPriority: priorityStats.reduce((acc, s) => {
            acc[s.priority] = parseInt(s.get('count'));
            return acc;
          }, {}),
          bySubject: subjectStats.map(s => ({
            subject: s.subject,
            count: parseInt(s.get('count'))
          }))
        },
        study: {
          totalMinutes: totalStudyMinutes,
          totalHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
          weeklyMinutes: weeklyStudyMinutes,
          monthlyMinutes: monthlyStudyMinutes,
          streak: user.studyStreak,
          lastStudyDate: user.lastStudyDate
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats'
    });
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { Reminder } = require('../models');
    
    const { count, rows: notifications } = await Reminder.findAndCountAll({
      where: { userId: req.userId },
      order: [['scheduledAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Count unread
    const unreadCount = await Reminder.count({
      where: { 
        userId: req.userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { Reminder } = require('../models');
    
    const notification = await Reminder.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Reminder.update(
      { isRead: true, readAt: new Date() },
      { where: { id: req.params.id } }
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    const { Reminder } = require('../models');
    
    await Reminder.update(
      { isRead: true, readAt: new Date() },
      { 
        where: { 
          userId: req.userId,
          isRead: false
        } 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read'
    });
  }
});

// Delete account
router.delete('/account', authenticate, async (req, res) => {
  try {
    // Delete all user data
    await User.destroy({ where: { id: req.userId } });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

module.exports = router;