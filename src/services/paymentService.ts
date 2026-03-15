import api from './api';
import type { Payment, ApiResponse, SubscriptionData } from '../types';

interface OrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
  };
  paymentId: string;
}

export const getRazorpayKey = async (): Promise<ApiResponse<{ keyId: string }>> => {
  const response = await api.get('/payments/key');
  return response.data;
};

export const createOrder = async (plan: 'monthly' | 'yearly'): Promise<ApiResponse<OrderResponse>> => {
  const response = await api.post('/payments/create-order', { plan });
  return response.data;
};

export const verifyPayment = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<ApiResponse<{
  plan: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}>> => {
  const response = await api.post('/payments/verify', data);
  return response.data;
};

export const getPaymentHistory = async (): Promise<ApiResponse<{ payments: Payment[] }>> => {
  const response = await api.get('/payments/history');
  return response.data;
};

export const getSubscription = async (): Promise<ApiResponse<SubscriptionData>> => {
  const response = await api.get('/payments/subscription');
  return response.data;
};

export const cancelSubscription = async (): Promise<ApiResponse<{ accessUntil: string }>> => {
  const response = await api.post('/payments/cancel');
  return response.data;
};
