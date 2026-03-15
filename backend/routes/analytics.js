const express = require('express');
const { Assignment, StudySession } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get productivity analytics
router.get('/productivity', authenticate, async (req, res) => {
  try {
    const { range = '30' } = req.query; // days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));

    // Study sessions over time
    const studySessions = await StudySession.findAll({
      where: {
        userId: req.userId,
        status: 'completed',
        startTime: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      order: [['startTime', 'ASC']]
    });

    // Group by date
    const dailyData = {};
    studySessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { minutes: 0, sessions: 0 };
      }
      dailyData[date].minutes += session.duration || 0;
      dailyData[date].sessions += 1;
    });

    // Fill in missing dates
    const filledData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      filledData.push({
        date: dateStr,
        minutes: dailyData[dateStr]?.minutes || 0,
        sessions: dailyData[dateStr]?.sessions || 0
      });
    }

    // Best study day
    const bestDay = filledData.reduce((best, current) => 
      current.minutes > best.minutes ? current : best
    , { minutes: 0 });

    // Average daily study time
    const totalMinutes = filledData.reduce((sum, d) => sum + d.minutes, 0);
    const avgDailyMinutes = Math.round(totalMinutes / filledData.length);

    // Productivity by day of week
    const dayOfWeekData = {};
    studySessions.forEach(session => {
      const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayOfWeekData[day]) {
        dayOfWeekData[day] = { minutes: 0, sessions: 0 };
      }
      dayOfWeekData[day].minutes += session.duration || 0;
      dayOfWeekData[day].sessions += 1;
    });

    // Productivity by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { minutes: 0, sessions: 0 };
    }
    studySessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourlyData[hour].minutes += session.duration || 0;
      hourlyData[hour].sessions += 1;
    });

    // Best productivity hour
    const bestHour = Object.entries(hourlyData).reduce((best, [hour, data]) => 
      data.minutes > best.minutes ? { hour: parseInt(hour), ...data } : best
    , { minutes: 0 });

    res.json({
      success: true,
      data: {
        dailyData: filledData,
        summary: {
          totalMinutes,
          totalHours: Math.round(totalMinutes / 60 * 10) / 10,
          avgDailyMinutes,
          bestDay: bestDay.date ? {
            date: bestDay.date,
            minutes: bestDay.minutes
          } : null,
          bestHour: bestHour.hour !== undefined ? {
            hour: bestHour.hour,
            minutes: bestHour.minutes
          } : null
        },
        dayOfWeekData: Object.entries(dayOfWeekData).map(([day, data]) => ({
          day,
          ...data
        })),
        hourlyData: Object.entries(hourlyData).map(([hour, data]) => ({
          hour: parseInt(hour),
          ...data
        }))
      }
    });
  } catch (error) {
    console.error('Get productivity analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching productivity analytics'
    });
  }
});

// Get assignment analytics
router.get('/assignments', authenticate, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));

    // All assignments in range
    const assignments = await Assignment.findAll({
      where: {
        userId: req.userId,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      }
    });

    // Completion rate
    const totalCreated = assignments.length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const completionRate = totalCreated > 0 ? Math.round((completed / totalCreated) * 100) : 0;

    // Average completion time
    const completedAssignments = assignments.filter(a => a.status === 'completed' && a.completedAt);
    const avgCompletionTime = completedAssignments.length > 0
      ? completedAssignments.reduce((sum, a) => {
          return sum + (new Date(a.completedAt) - new Date(a.createdAt));
        }, 0) / completedAssignments.length / (1000 * 60 * 60) // in hours
      : 0;

    // On-time completion rate
    const onTimeCompletions = completedAssignments.filter(a => 
      new Date(a.completedAt) <= new Date(a.dueDate)
    ).length;
    const onTimeRate = completed > 0 ? Math.round((onTimeCompletions / completed) * 100) : 0;

    // Priority analysis
    const priorityAnalysis = {};
    assignments.forEach(a => {
      if (!priorityAnalysis[a.priority]) {
        priorityAnalysis[a.priority] = { total: 0, completed: 0 };
      }
      priorityAnalysis[a.priority].total += 1;
      if (a.status === 'completed') {
        priorityAnalysis[a.priority].completed += 1;
      }
    });

    // Weekly trend
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekAssignments = assignments.filter(a => 
        new Date(a.createdAt) >= weekStart && new Date(a.createdAt) < weekEnd
      );

      weeklyData.push({
        week: `Week ${4 - i}`,
        created: weekAssignments.length,
        completed: weekAssignments.filter(a => a.status === 'completed').length
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalCreated,
          completed,
          completionRate,
          avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
          onTimeRate
        },
        priorityAnalysis: Object.entries(priorityAnalysis).map(([priority, data]) => ({
          priority,
          total: data.total,
          completed: data.completed,
          rate: Math.round((data.completed / data.total) * 100)
        })),
        weeklyTrend: weeklyData
      }
    });
  } catch (error) {
    console.error('Get assignment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment analytics'
    });
  }
});

// Get dashboard overview
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Quick stats
    const [
      totalAssignments,
      pendingAssignments,
      completedAssignments,
      dueToday,
      dueThisWeek,
      overdue
    ] = await Promise.all([
      Assignment.count({ where: { userId: req.userId } }),
      Assignment.count({ 
        where: { 
          userId: req.userId,
          status: { [Op.not]: 'completed' }
        } 
      }),
      Assignment.count({ 
        where: { 
          userId: req.userId,
          status: 'completed'
        } 
      }),
      Assignment.count({
        where: {
          userId: req.userId,
          dueDate: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          },
          status: { [Op.not]: 'completed' }
        }
      }),
      Assignment.count({
        where: {
          userId: req.userId,
          dueDate: {
            [Op.gte]: today,
            [Op.lte]: nextWeek
          },
          status: { [Op.not]: 'completed' }
        }
      }),
      Assignment.count({
        where: {
          userId: req.userId,
          dueDate: { [Op.lt]: today },
          status: { [Op.not]: 'completed' }
        }
      })
    ]);

    // Study stats
    const [
      totalStudySessions,
      totalStudyMinutes,
      thisWeekStudyMinutes
    ] = await Promise.all([
      StudySession.count({ 
        where: { 
          userId: req.userId,
          status: 'completed'
        } 
      }),
      StudySession.sum('duration', {
        where: { 
          userId: req.userId,
          status: 'completed'
        }
      }) || 0,
      StudySession.sum('duration', {
        where: { 
          userId: req.userId,
          status: 'completed',
          startTime: {
            [Op.gte]: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }) || 0
    ]);

    // Recent activity
    const recentAssignments = await Assignment.findAll({
      where: { userId: req.userId },
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    const upcomingDeadlines = await Assignment.findAll({
      where: {
        userId: req.userId,
        dueDate: { [Op.gte]: today },
        status: { [Op.not]: 'completed' }
      },
      order: [['dueDate', 'ASC']],
      limit: 5
    });

    // Weekly study chart data
    const weeklyStudyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const minutes = await StudySession.sum('duration', {
        where: {
          userId: req.userId,
          status: 'completed',
          startTime: { [Op.gte]: dayStart, [Op.lte]: dayEnd }
        }
      }) || 0;
      
      weeklyStudyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes
      });
    }

    res.json({
      success: true,
      data: {
        assignments: {
          total: totalAssignments,
          pending: pendingAssignments,
          completed: completedAssignments,
          dueToday,
          dueThisWeek,
          overdue,
          completionRate: totalAssignments > 0 
            ? Math.round((completedAssignments / totalAssignments) * 100) 
            : 0
        },
        study: {
          totalSessions: totalStudySessions,
          totalMinutes: totalStudyMinutes,
          totalHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
          thisWeekMinutes: thisWeekStudyMinutes,
          weeklyChart: weeklyStudyData
        },
        recentActivity: recentAssignments,
        upcomingDeadlines
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics'
    });
  }
});

module.exports = router;
