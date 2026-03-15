const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Assignment, User } = require('../models');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// Get all assignments for user
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('subject').optional().trim(),
    query('search').optional().trim(),
    query('sortBy').optional().isIn(['dueDate', 'priority', 'createdAt', 'title']),
    query('order').optional().isIn(['asc', 'desc']),
    validate
  ],
  async (req, res) => {
    try {
      const { 
        status, 
        priority, 
        subject, 
        search, 
        sortBy = 'dueDate', 
        order = 'asc',
        page = 1,
        limit = 20
      } = req.query;

      // Build where clause
      const where = { userId: req.userId };
      
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (subject) where.subject = subject;
      
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get assignments
      const { count, rows: assignments } = await Assignment.findAndCountAll({
        where,
        order: [[sortBy, order.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      // Calculate stats
      const stats = await Assignment.findAll({
        where: { userId: req.userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('status')), 'count']
        ],
        group: ['status']
      });

      res.json({
        success: true,
        data: {
          assignments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit))
          },
          stats: stats.reduce((acc, s) => {
            acc[s.status] = parseInt(s.get('count'));
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching assignments'
      });
    }
  }
);

// Get single assignment
router.get('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: { assignment }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment'
    });
  }
});

// Create assignment
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('description').optional().trim(),
    body('estimatedHours').optional().isDecimal(),
    validate
  ],
  async (req, res) => {
    try {
      // Check assignment limit for free users
      if (req.user.subscriptionPlan === 'free') {
        const assignmentCount = await Assignment.count({
          where: { userId: req.userId }
        });

        if (assignmentCount >= 5) {
          return res.status(403).json({
            success: false,
            message: 'Free plan limited to 5 assignments. Upgrade to Pro for unlimited!',
            upgradeRequired: true
          });
        }
      }

      const {
        title,
        subject,
        dueDate,
        priority = 'medium',
        description,
        estimatedHours,
        tags
      } = req.body;

      // Check if assignment is overdue
      let status = 'pending';
      if (new Date(dueDate) < new Date()) {
        status = 'overdue';
      }

      const assignment = await Assignment.create({
        userId: req.userId,
        title,
        subject,
        dueDate,
        priority,
        description,
        estimatedHours,
        tags: tags || [],
        status
      });

      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: { assignment }
      });
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating assignment'
      });
    }
  }
);

// Update assignment
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().notEmpty(),
    body('subject').optional().trim().notEmpty(),
    body('dueDate').optional().isISO8601(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue']),
    validate
  ],
  async (req, res) => {
    try {
      const assignment = await Assignment.findOne({
        where: { id: req.params.id, userId: req.userId }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      const updates = {};
      const allowedFields = ['title', 'subject', 'dueDate', 'priority', 'status', 'description', 'estimatedHours', 'actualHours', 'tags', 'attachments'];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // If marking as completed, set completedAt
      if (updates.status === 'completed' && assignment.status !== 'completed') {
        updates.completedAt = new Date();
      }

      // If due date changed, check if overdue
      if (updates.dueDate) {
        if (new Date(updates.dueDate) < new Date() && updates.status !== 'completed') {
          updates.status = 'overdue';
        }
      }

      await Assignment.update(updates, { where: { id: req.params.id } });

      const updatedAssignment = await Assignment.findByPk(req.params.id);

      res.json({
        success: true,
        message: 'Assignment updated successfully',
        data: { assignment: updatedAssignment }
      });
    } catch (error) {
      console.error('Update assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating assignment'
      });
    }
  }
);

// Delete assignment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await Assignment.destroy({ where: { id: req.params.id } });

      res.json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting assignment'
      });
    }
  }
);

// Get upcoming deadlines
router.get('/stats/upcoming', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = await Assignment.findAll({
      where: {
        userId: req.userId,
        dueDate: {
          [Op.gte]: today,
          [Op.lte]: nextWeek
        },
        status: {
          [Op.not]: 'completed'
        }
      },
      order: [['dueDate', 'ASC']],
      limit: 10
    });

    // Group by day
    const grouped = upcoming.reduce((acc, assignment) => {
      const date = new Date(assignment.dueDate).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(assignment);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        upcoming,
        grouped,
        total: upcoming.length
      }
    });
  } catch (error) {
    console.error('Get upcoming error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming deadlines'
    });
  }
});

// Get dashboard stats
router.get('/stats/dashboard', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Total assignments
    const totalAssignments = await Assignment.count({
      where: { userId: req.userId }
    });

    // Pending assignments
    const pendingAssignments = await Assignment.count({
      where: { 
        userId: req.userId,
        status: {
          [Op.not]: 'completed'
        }
      }
    });

    // Completed assignments
    const completedAssignments = await Assignment.count({
      where: { 
        userId: req.userId,
        status: 'completed'
      }
    });

    // Due today
    const dueToday = await Assignment.count({
      where: {
        userId: req.userId,
        dueDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: {
          [Op.not]: 'completed'
        }
      }
    });

    // Overdue assignments
    const overdueAssignments = await Assignment.count({
      where: {
        userId: req.userId,
        dueDate: {
          [Op.lt]: today
        },
        status: {
          [Op.not]: 'completed'
        }
      }
    });

    // High priority pending
    const highPriorityPending = await Assignment.count({
      where: {
        userId: req.userId,
        priority: 'high',
        status: {
          [Op.not]: 'completed'
        }
      }
    });

    // Recent assignments
    const recentAssignments = await Assignment.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Priority distribution
    const priorityStats = await Assignment.findAll({
      where: { userId: req.userId },
      attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('priority')), 'count']],
      group: ['priority']
    });

    res.json({
      success: true,
      data: {
        totalAssignments,
        pendingAssignments,
        completedAssignments,
        dueToday,
        overdueAssignments,
        highPriorityPending,
        recentAssignments,
        priorityDistribution: priorityStats.reduce((acc, s) => {
          acc[s.priority] = parseInt(s.get('count'));
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});

module.exports = router;
