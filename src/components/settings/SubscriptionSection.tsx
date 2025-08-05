'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth-service';
import { stripeSubscriptionService, SubscriptionData, SUBSCRIPTION_PLANS } from '@/services/stripe-subscription-service';
import { motion } from 'framer-motion';

export function SubscriptionSection() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const sub = await stripeSubscriptionService.getSubscription(user.uid);
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const portalUrl = await stripeSubscriptionService.createBillingPortalSession(
        user.uid,
        window.location.href
      );
      
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing management. Please try again.');
    } finally {
      setIsManaging(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="settings-section">
        <h3>💳 Subscription & Billing</h3>
        <div className="text-center py-8 text-gray-400">
          Loading subscription details...
        </div>
      </div>
    );
  }

  const plan = subscription 
    ? SUBSCRIPTION_PLANS[subscription.planId as keyof typeof SUBSCRIPTION_PLANS]
    : null;

  return (
    <div className="settings-section">
      <h3>💳 Subscription & Billing</h3>
      
      {subscription && plan ? (
        <div className="space-y-4">
          {/* Current Plan */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                <p className="text-sm text-gray-400">{plan.description}</p>
              </div>
              <div className="text-right">
                {plan.price === 0 ? (
                  <span className="text-green-400 font-semibold">Free</span>
                ) : (
                  <span className="text-white font-semibold">
                    ${plan.price}/mo
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-400">Status:</span>
              <span className={`text-sm font-medium ${
                subscription.status === 'active' ? 'text-green-400' :
                subscription.status === 'trialing' ? 'text-blue-400' :
                'text-red-400'
              }`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>

            {/* Next billing date */}
            {subscription.status === 'active' && plan.price !== 0 && (
              <div className="text-sm text-gray-400">
                Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                {subscription.cancelAtPeriodEnd && (
                  <span className="text-yellow-400 ml-2">(Canceling at period end)</span>
                )}
              </div>
            )}
          </div>

          {/* Usage Stats */}
          {subscription.usage && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Usage This Month</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Students Monitored</span>
                  <span className="text-white">
                    {subscription.usage.studentsMonitored} / {subscription.usage.studentsLimit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API Calls</span>
                  <span className="text-white">{subscription.usage.apiCallsThisMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Storage Used</span>
                  <span className="text-white">{subscription.usage.storageUsedGB} GB</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {plan.price !== 0 && (
              <button
                onClick={handleManageSubscription}
                disabled={isManaging}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isManaging ? 'Opening...' : 'Manage Billing'}
              </button>
            )}
            <button
              onClick={handleUpgrade}
              className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {plan.price === 0 ? 'Upgrade Plan' : 'Change Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No active subscription found</p>
          <button
            onClick={handleUpgrade}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            View Plans
          </button>
        </div>
      )}

      {/* ML Data Notice */}
      <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg">
        <p className="text-xs text-blue-300">
          💡 Your subscription helps us collect more data to improve our ML models for better AAC predictions
        </p>
      </div>
    </div>
  );
}