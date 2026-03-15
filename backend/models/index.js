const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('free', 'monthly', 'yearly'),
    defaultValue: 'free'
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'past_due'),
    defaultValue: 'inactive'
  },
  subscriptionStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  razorpayCustomerId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  razorpaySubscriptionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  studyStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastStudyDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalStudyMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reminderTime: {
    type: DataTypes.INTEGER,
    defaultValue: 24 // hours before deadline
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['subscriptionPlan'] },
    { fields: ['subscriptionStatus'] }
  ]
});

// Assignment Model
const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'overdue'),
    defaultValue: 'pending'
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true
  },
  actualHours: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 0
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminderSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'assignments',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['dueDate'] },
    { fields: ['status'] },
    { fields: ['priority'] }
  ]
});

// Study Session Model
const StudySession = sequelize.define('StudySession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'assignments',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  productivityRating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    },
    allowNull: true
  },
  breakCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pomodoroSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'study_sessions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['startTime'] },
    { fields: ['status'] }
  ]
});

// Payment Model
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  razorpayOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  razorpaySignature: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  plan: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  invoiceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['razorpayOrderId'] },
    { fields: ['status'] }
  ]
});

// Reminder Model
const Reminder = sequelize.define('Reminder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'assignments',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('deadline', 'study_session', 'streak', 'custom'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sentVia: {
    type: DataTypes.ENUM('email', 'push', 'in_app'),
    defaultValue: 'in_app'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reminders',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['scheduledAt'] },
    { fields: ['isRead'] }
  ]
});

// Subject Model (for custom subjects)
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#7c3aed'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'subjects',
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
});

// Define Associations
User.hasMany(Assignment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Assignment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(StudySession, { foreignKey: 'userId', onDelete: 'CASCADE' });
StudySession.belongsTo(User, { foreignKey: 'userId' });

Assignment.hasMany(StudySession, { foreignKey: 'assignmentId', onDelete: 'SET NULL' });
StudySession.belongsTo(Assignment, { foreignKey: 'assignmentId' });

User.hasMany(Payment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Payment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Reminder, { foreignKey: 'userId', onDelete: 'CASCADE' });
Reminder.belongsTo(User, { foreignKey: 'userId' });

Assignment.hasMany(Reminder, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
Reminder.belongsTo(Assignment, { foreignKey: 'assignmentId' });

User.hasMany(Subject, { foreignKey: 'userId', onDelete: 'CASCADE' });
Subject.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Assignment,
  StudySession,
  Payment,
  Reminder,
  Subject
};
