const { Reminder, Assignment, User } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Check and send reminders
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Find pending reminders that are due
    const pendingReminders = await Reminder.findAll({
      where: {
        scheduledAt: {
          [Op.lte]: fifteenMinutesFromNow
        },
        sentAt: null
      },
      include: [
        { model: User, attributes: ['email', 'firstName', 'emailNotifications'] },
        { model: Assignment }
      ]
    });

    console.log(`Found ${pendingReminders.length} pending reminders`);

    for (const reminder of pendingReminders) {
      try {
        // Send in-app notification (already exists as reminder record)
        
        // Send email if user has enabled notifications
        if (reminder.User.emailNotifications && process.env.SMTP_USER) {
          await sendEmailReminder(reminder);
        }

        // Mark as sent
        await Reminder.update(
          { sentAt: new Date() },
          { where: { id: reminder.id } }
        );

        console.log(`Sent reminder ${reminder.id} to user ${reminder.userId}`);
      } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error);
      }
    }

    return pendingReminders.length;
  } catch (error) {
    console.error('Check reminders error:', error);
    throw error;
  }
};

// Send email reminder
const sendEmailReminder = async (reminder) => {
  const { User, Assignment } = reminder;
  
  const mailOptions = {
    from: `"StudyFlow Pro" <${process.env.SMTP_USER}>`,
    to: User.email,
    subject: `Reminder: ${reminder.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0;">StudyFlow Pro</h1>
          <p style="margin: 10px 0 0 0;">Stay on track with your assignments</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${User.firstName},</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin-top: 0;">${reminder.title}</h3>
            <p style="color: #64748b; line-height: 1.6;">${reminder.message}</p>
            
            ${Assignment ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 5px 0;"><strong>Assignment:</strong> ${Assignment.title}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(Assignment.dueDate).toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> ${Assignment.priority}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: linear-gradient(135deg, #7c3aed, #ec4899); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p>You're receiving this because you have email notifications enabled.</p>
          <p>© 2024 StudyFlow Pro. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Create deadline reminders for an assignment
const createDeadlineReminders = async (assignment, userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const dueDate = new Date(assignment.dueDate);
    const reminderTime = user.reminderTime || 24; // hours before deadline

    // Create reminder based on user preference
    const reminderDate = new Date(dueDate.getTime() - reminderTime * 60 * 60 * 1000);

    // Only create if reminder time is in the future
    if (reminderDate > new Date()) {
      await Reminder.create({
        userId,
        assignmentId: assignment.id,
        type: 'deadline',
        title: `Assignment Due Soon: ${assignment.title}`,
        message: `Your assignment "${assignment.title}" is due in ${reminderTime} hours. Don't forget to submit it on time!`,
        scheduledAt: reminderDate
      });
    }

    // Also create a 1-hour reminder for urgent assignments
    if (assignment.priority === 'urgent' || assignment.priority === 'high') {
      const oneHourReminder = new Date(dueDate.getTime() - 60 * 60 * 1000);
      if (oneHourReminder > new Date()) {
        await Reminder.create({
          userId,
          assignmentId: assignment.id,
          type: 'deadline',
          title: `URGENT: ${assignment.title} Due in 1 Hour`,
          message: `Your high-priority assignment "${assignment.title}" is due in 1 hour!`,
          scheduledAt: oneHourReminder
        });
      }
    }
  } catch (error) {
    console.error('Create deadline reminders error:', error);
  }
};

// Create study session reminder
const createStudySessionReminder = async (session, userId) => {
  try {
    const reminderDate = new Date(session.startTime.getTime() - 15 * 60 * 1000); // 15 minutes before

    if (reminderDate > new Date()) {
      await Reminder.create({
        userId,
        type: 'study_session',
        title: `Study Session Starting Soon: ${session.title}`,
        message: `Your study session "${session.title}" starts in 15 minutes. Get ready to focus!`,
        scheduledAt: reminderDate
      });
    }
  } catch (error) {
    console.error('Create study session reminder error:', error);
  }
};

// Check and reset streaks
const checkAndResetStreaks = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.findAll({
      where: {
        lastStudyDate: {
          [Op.lt]: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        studyStreak: {
          [Op.gt]: 0
        }
      }
    });

    for (const user of users) {
      // Reset streak
      await User.update(
        { studyStreak: 0 },
        { where: { id: user.id } }
      );

      console.log(`Reset streak for user ${user.id}`);
    }

    return users.length;
  } catch (error) {
    console.error('Check streaks error:', error);
    throw error;
  }
};

// Send streak reminder
const sendStreakReminder = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || user.studyStreak === 0) return;

    // Check if user studied today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
    if (lastStudy) {
      lastStudy.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
      
      // If hasn't studied today and streak is at risk
      if (diffDays === 1) {
        await Reminder.create({
          userId,
          type: 'streak',
          title: 'Keep Your Streak Alive! 🔥',
          message: `You have a ${user.studyStreak}-day study streak! Complete a study session today to keep it going.`,
          scheduledAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Send streak reminder error:', error);
  }
};

module.exports = {
  checkAndSendReminders,
  createDeadlineReminders,
  createStudySessionReminder,
  checkAndResetStreaks,
  sendStreakReminder,
  sendEmailReminder
};
