const express = require('express');
const { body, query, validationResult } = require('express-validator');  // ← added validationResul
const { StudySession, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op, Sequelize: sequelize } = require('sequelize');               // ← added sequelize

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get all study sessions
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const where = { userId: req.userId };
    
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.startTime = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: sessions } = await StudySession.findAndCountAll({
      where,
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get study sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study sessions'
    });
  }
});

// Get single study session
router.get('/:id', authenticate, async (req, res) => {
  try {
    const session = await StudySession.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Get study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study session'
    });
  }
});

// Create study session
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').optional().isISO8601(),
    body('subject').optional().trim(),
    body('assignmentId').optional().isUUID(),
    validate
  ],
  async (req, res) => {
    try {
      const {
        title,
        startTime,
        endTime,
        subject,
        assignmentId,
        notes
      } = req.body;

      // Calculate duration if endTime provided
      let duration = null;
      if (endTime) {
        duration = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
      }

      const session = await StudySession.create({
        userId: req.userId,
        title,
        startTime,
        endTime,
        duration,
        subject,
        assignmentId,
        notes,
        status: endTime ? 'completed' : 'scheduled'
      });

      // Update user streak if session is completed
      if (session.status === 'completed') {
        await updateStudyStreak(req.userId, duration);
      }

      res.status(201).json({
        success: true,
        message: 'Study session created successfully',
        data: { session }
      });
    } catch (error) {
      console.error('Create study session error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating study session'
      });
    }
  }
);

// Update study session
router.put('/:id', authenticate, async (req, res) => {
  try {
    const session = await StudySession.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    const updates = {};
    const allowedFields = ['title', 'startTime', 'endTime', 'subject', 'notes', 'status', 'productivityRating', 'breakCount', 'pomodoroSessions'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Recalculate duration if endTime changed
    if (updates.endTime || (updates.startTime && session.endTime)) {
      const start = updates.startTime ? new Date(updates.startTime) : session.startTime;
      const end = updates.endTime ? new Date(updates.endTime) : session.endTime;
      if (end) {
        updates.duration = Math.round((end - start) / (1000 * 60));
      }
    }

    await StudySession.update(updates, { where: { id: req.params.id } });

    const updatedSession = await StudySession.findByPk(req.params.id);

    // Update streak if session completed
    if (updates.status === 'completed' && session.status !== 'completed') {
      await updateStudyStreak(req.userId, updatedSession.duration);
    }

    res.json({
      success: true,
      message: 'Study session updated successfully',
      data: { session: updatedSession }
    });
  } catch (error) {
    console.error('Update study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating study session'
    });
  }
});

// Delete study session
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const session = await StudySession.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    await StudySession.destroy({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Study session deleted successfully'
    });
  } catch (error) {
    console.error('Delete study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting study session'
    });
  }
});

// Start study session (change status to in_progress)
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const session = await StudySession.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot start session with status: ${session.status}`
      });
    }

    await StudySession.update(
      { status: 'in_progress' },
      { where: { id: req.params.id } }
    );

    const updatedSession = await StudySession.findByPk(req.params.id);

    res.json({
      success: true,
      message: 'Study session started',
      data: { session: updatedSession }
    });
  } catch (error) {
    console.error('Start study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting study session'
    });
  }
});

// Complete study session
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const session = await StudySession.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Session already completed'
      });
    }

    const endTime = new Date();
    const duration = Math.round((endTime - session.startTime) / (1000 * 60));

    await StudySession.update(
      { 
        status: 'completed',
        endTime,
        duration
      },
      { where: { id: req.params.id } }
    );

    // Update user streak
    await updateStudyStreak(req.userId, duration);

    const updatedSession = await StudySession.findByPk(req.params.id);

    res.json({
      success: true,
      message: 'Study session completed',
      data: { session: updatedSession }
    });
  } catch (error) {
    console.error('Complete study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing study session'
    });
  }
});

// Get study stats
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total study time
    const totalSessions = await StudySession.count({
      where: { 
        userId: req.userId,
        status: 'completed'
      }
    });

    const totalMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed'
      }
    }) || 0;

    // This week's study time
    const weeklyMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed',
        startTime: {
          [Op.gte]: startOfWeek
        }
      }
    }) || 0;

    // This month's study time
    const monthlyMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed',
        startTime: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // Today's study time
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayMinutes = await StudySession.sum('duration', {
      where: { 
        userId: req.userId,
        status: 'completed',
        startTime: {
          [Op.gte]: todayStart,
          [Op.lte]: todayEnd
        }
      }
    }) || 0;

    // Study sessions by subject
    const subjectStats = await StudySession.findAll({
      where: { 
        userId: req.userId,
        status: 'completed'
      },
      attributes: [
        'subject',
        [sequelize.fn('SUM', sequelize.col('duration')), 'totalMinutes'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sessionCount']
      ],
      group: ['subject']
    });

    // Weekly study data for chart
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const minutes = await StudySession.sum('duration', {
        where: {
          userId: req.userId,
          status: 'completed',
          startTime: {
            [Op.gte]: dayStart,
            [Op.lte]: dayEnd
          }
        }
      }) || 0;
      
      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes
      });
    }

    // Get user streak
    const user = await User.findByPk(req.userId, {
      attributes: ['studyStreak', 'lastStudyDate', 'totalStudyMinutes']
    });

    res.json({
      success: true,
      data: {
        totalSessions,
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        weeklyMinutes,
        monthlyMinutes,
        todayMinutes,
        studyStreak: user.studyStreak,
        lastStudyDate: user.lastStudyDate,
        subjectStats: subjectStats.map(s => ({
          subject: s.subject || 'General',
          totalMinutes: parseInt(s.get('totalMinutes')) || 0,
          sessionCount: parseInt(s.get('sessionCount'))
        })),
        weeklyData
      }
    });
  } catch (error) {
    console.error('Get study stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study stats'
    });
  }
});

// Helper function to update study streak
async function updateStudyStreak(userId, duration) {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
    
    let newStreak = user.studyStreak || 0;
    
    if (lastStudy) {
      lastStudy.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Already studied today, don't increment
        return;
      } else if (diffDays === 1) {
        // Studied yesterday, increment streak
        newStreak += 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    } else {
      // First study session
      newStreak = 1;
    }

    await User.update(
      {
        studyStreak: newStreak,
        lastStudyDate: new Date(),
        totalStudyMinutes: (user.totalStudyMinutes || 0) + (duration || 0)
      },
      { where: { id: userId } }
    );
  } catch (error) {
    console.error('Update streak error:', error);
  }
}

module.exports = router;
