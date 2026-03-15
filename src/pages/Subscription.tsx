import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as paymentService from '../services/paymentService';
import type { SubscriptionData, Payment } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Check,
  Crown,
  Sparkles,
  Loader2,
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 5 assignments',
      'Basic deadline reminders',
      'Weekly study planner',
      'Email support',
    ],
    notIncluded: [
      'Unlimited assignments',
      'Smart reminders',
      'Advanced analytics',
      'Study streak tracking',
    ],
    plan: 'free',
  },
  {
    name: 'Pro Monthly',
    price: '₹99',
    period: 'per month',
    description: 'Best for serious students',
    features: [
      'Unlimited assignments',
      'Smart reminders',
      'Advanced analytics',
      'Study streak tracking',
      'Priority support',
    ],
    notIncluded: [],
    plan: 'monthly',
    highlighted: true,
  },
  {
    name: 'Pro Yearly',
    price: '₹999',
    period: 'per year',
    description: 'Save 17% with annual billing',
    features: [
      'Everything in Pro Monthly',
      'Export data',
      'Custom categories',
      'API access',
      '24/7 support',
    ],
    notIncluded: [],
    plan: 'yearly',
    badge: 'SAVE 17%',
  },
];

export default function Subscription() {
  const { user, updateUser } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subRes, paymentsRes] = await Promise.all([
        paymentService.getSubscription(),
        paymentService.getPaymentHistory(),
      ]);
      
      if (subRes.success) {
        setSubscription(subRes.data);
      }
      if (paymentsRes.success) {
        setPayments(paymentsRes.data.payments);
      }
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setIsProcessing(true);
    
    try {
      // Get order details
      const orderRes = await paymentService.createOrder(plan);
      if (!orderRes.success) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency, name, description, prefill } = orderRes.data;

      // Get Razorpay key
      const keyRes = await paymentService.getRazorpayKey();
      const keyId = keyRes.data.keyId;

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount,
        currency,
        name,
        description,
        order_id: orderId,
        prefill,
        theme: {
          color: '#7c3aed',
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyRes = await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast.success('Payment successful! Welcome to Pro!');
              
              // Update user in context
              if (user) {
                updateUser({
                  ...user,
                  subscriptionPlan: plan,
                  subscriptionStatus: 'active',
                });
              }
              
              fetchSubscriptionData();
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      const res = await paymentService.cancelSubscription();
      if (res.success) {
        toast.success('Subscription cancelled successfully');
        
        if (user) {
          updateUser({
            ...user,
            subscriptionStatus: 'cancelled',
          });
        }
        
        fetchSubscriptionData();
        setShowCancelDialog(false);
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Subscription</h1>
        <p className="text-[#94a3b8] mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card className={`border-purple-500/30 ${
        subscription?.plan !== 'free' 
          ? 'bg-gradient-to-r from-[#7c3aed]/20 to-[#ec4899]/20' 
          : 'bg-[#1e293b]'
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                subscription?.plan !== 'free'
                  ? 'bg-gradient-to-br from-[#7c3aed] to-[#ec4899]'
                  : 'bg-[#94a3b8]/20'
              }`}>
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {subscription?.plan === 'free' ? 'Free Plan' : 
                     subscription?.plan === 'monthly' ? 'Pro Monthly' : 'Pro Yearly'}
                  </h2>
                  <Badge className={subscription?.isActive ? 'bg-[#10b981]' : 'bg-[#94a3b8]'}>
                    {subscription?.status === 'active' ? 'Active' : 
                     subscription?.status === 'cancelled' ? 'Cancelled' : 'Inactive'}
                  </Badge>
                </div>
                {subscription?.isActive && subscription.endDate && (
                  <p className="text-[#94a3b8]">
                    Renews on {new Date(subscription.endDate).toLocaleDateString()}
                    {subscription.daysRemaining > 0 && ` (${subscription.daysRemaining} days remaining)`}
                  </p>
                )}
              </div>
            </div>
            
            {subscription?.isActive && subscription.plan !== 'free' && (
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.plan}
            className={`bg-[#1e293b] border-purple-500/20 ${
              plan.highlighted ? 'ring-2 ring-[#7c3aed] scale-105' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{plan.name}</CardTitle>
                {plan.badge && (
                  <Badge className="bg-[#f59e0b] text-white">{plan.badge}</Badge>
                )}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-[#94a3b8]">/{plan.period}</span>
              </div>
              <p className="text-[#94a3b8]">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {plan.notIncluded?.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-[#64748b]">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm line-through">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.plan === 'free' ? (
                <Button 
                  variant="outline" 
                  className="w-full border-purple-500/30"
                  disabled={subscription?.plan === 'free'}
                >
                  {subscription?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
                  onClick={() => handleSubscribe(plan.plan as 'monthly' | 'yearly')}
                  disabled={isProcessing || (subscription?.plan === plan.plan && subscription?.isActive)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : subscription?.plan === plan.plan && subscription?.isActive ? (
                    'Current Plan'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {subscription?.plan === 'free' ? 'Upgrade' : 'Switch'}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#7c3aed]" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#7c3aed]" />
                    </div>
                    <div>
                      <p className="font-medium text-white capitalize">{payment.plan} Plan</p>
                      <p className="text-sm text-[#94a3b8]">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">₹{payment.amount}</p>
                    <Badge className={
                      payment.status === 'completed' ? 'bg-[#10b981]' :
                      payment.status === 'pending' ? 'bg-[#f59e0b]' :
                      'bg-[#ef4444]'
                    }>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#1e293b] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Cancel Subscription?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#94a3b8]">
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your billing period.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-purple-500/30"
                onClick={() => setShowCancelDialog(false)}
              >
                Keep Subscription
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleCancel}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
