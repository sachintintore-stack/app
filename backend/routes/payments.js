const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { body } = require('express-validator');
const { Payment, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_here',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret_here'
});

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

// Get Razorpay key
router.get('/key', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_here'
    }
  });
});

// Create subscription order
router.post(
  '/create-order',
  authenticate,
  [
    body('plan').isIn(['monthly', 'yearly']).withMessage('Valid plan is required'),
    validate
  ],
  async (req, res) => {
    try {
      const { plan } = req.body;
      const userId = req.userId;

      // Get user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Plan pricing
      const planDetails = {
        monthly: {
          amount: 9900, // ₹99 in paise
          currency: 'INR',
          name: 'StudyFlow Pro Monthly',
          description: 'Monthly subscription to StudyFlow Pro'
        },
        yearly: {
          amount: 99900, // ₹999 in paise
          currency: 'INR',
          name: 'StudyFlow Pro Yearly',
          description: 'Yearly subscription to StudyFlow Pro (Save 17%)'
        }
      };

      const selectedPlan = planDetails[plan];

      // Create Razorpay order
      const orderOptions = {
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
        receipt: `receipt_${Date.now()}_${userId.slice(0, 8)}`,
        notes: {
          userId: userId,
          plan: plan,
          email: user.email
        }
      };

      const order = await razorpay.orders.create(orderOptions);

      // Create payment record
      const payment = await Payment.create({
        userId,
        razorpayOrderId: order.id,
        amount: selectedPlan.amount / 100, // Convert to rupees
        currency: selectedPlan.currency,
        plan,
        status: 'pending'
      });

      res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: selectedPlan.amount,
          currency: selectedPlan.currency,
          name: selectedPlan.name,
          description: selectedPlan.description,
          prefill: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
          },
          paymentId: payment.id
        }
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating payment order'
      });
    }
  }
);

// Verify payment
router.post(
  '/verify',
  authenticate,
  [
    body('razorpayOrderId').notEmpty(),
    body('razorpayPaymentId').notEmpty(),
    body('razorpaySignature').notEmpty(),
    validate
  ],
  async (req, res) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const userId = req.userId;

      // Verify signature
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_secret_here')
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpaySignature;

      if (!isAuthentic) {
        // Update payment as failed
        await Payment.update(
          { status: 'failed' },
          { where: { razorpayOrderId } }
        );

        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Get payment details from Razorpay
      const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

      // Update payment record
      const payment = await Payment.findOne({ where: { razorpayOrderId } });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }

      await Payment.update(
        {
          razorpayPaymentId,
          razorpaySignature,
          status: 'completed',
          paymentMethod: paymentDetails.method,
          paidAt: new Date()
        },
        { where: { razorpayOrderId } }
      );

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      
      if (payment.plan === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (payment.plan === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Update user subscription
      await User.update(
        {
          subscriptionPlan: payment.plan,
          subscriptionStatus: 'active',
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          razorpayCustomerId: paymentDetails.customer_id || null
        },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          plan: payment.plan,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate
        }
      });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying payment'
      });
    }
  }
);

// Get payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history'
    });
  }
});

// Get subscription status
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: [
        'subscriptionPlan',
        'subscriptionStatus',
        'subscriptionStartDate',
        'subscriptionEndDate'
      ]
    });

    // Check if subscription has expired
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
      if (user.subscriptionStatus === 'active') {
        await User.update(
          { subscriptionStatus: 'inactive', subscriptionPlan: 'free' },
          { where: { id: req.userId } }
        );
        user.subscriptionStatus = 'inactive';
        user.subscriptionPlan = 'free';
      }
    }

    const isActive = user.subscriptionStatus === 'active' && 
      user.subscriptionEndDate && 
      new Date(user.subscriptionEndDate) > new Date();

    res.json({
      success: true,
      data: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        isActive,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        daysRemaining: isActive 
          ? Math.ceil((new Date(user.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24))
          : 0
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status'
    });
  }
});

// Cancel subscription
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (user.subscriptionPlan === 'free' || user.subscriptionStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    // Update user (subscription remains active until end date)
    await User.update(
      { subscriptionStatus: 'cancelled' },
      { where: { id: req.userId } }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You will have access until the end of your billing period.',
      data: {
        accessUntil: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
});

// Webhook for Razorpay events
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false });
    }

    const event = req.body;

    // Handle different events
    switch (event.event) {
      case 'payment.captured':
        // Payment successful
        console.log('Payment captured:', event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        // Payment failed
        console.log('Payment failed:', event.payload.payment.entity);
        break;
      
      case 'subscription.cancelled':
        // Subscription cancelled
        console.log('Subscription cancelled:', event.payload.subscription.entity);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
