'use client';

import React, { useState, useEffect } from 'react';
import { subscriptionTiersService } from '../services/subscription-tiers-service';
import type { SubscriptionPlan, SubscriptionTier } from '../services/subscription-tiers-service';

export default function PricingTiers() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load pricing plans
    const pricingPlans = subscriptionTiersService.getPricingPlans(billingCycle);
    setPlans(pricingPlans);

    // Get current user subscription (mock user ID for demo)
    const subscription = subscriptionTiersService.getUserSubscription('current_user');
    setCurrentTier(subscription.currentTier);
  }, [billingCycle]);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const processUpgrade = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    // Mock payment method
    const paymentMethod = {
      type: 'card' as const,
      last4: '4242',
      brand: 'Visa',
      isDefault: true
    };

    const result = await subscriptionTiersService.upgradeSubscription(
      'current_user',
      selectedPlan.tier,
      paymentMethod
    );

    if (result.success) {
      setCurrentTier(selectedPlan.tier);
      setShowUpgradeModal(false);
      alert(`Successfully upgraded to ${selectedPlan.name}!`);
    } else {
      alert(`Upgrade failed: ${result.error}`);
    }
    
    setIsProcessing(false);
  };

  const startTrial = async (tier: 'professional' | 'enterprise') => {
    const subscription = await subscriptionTiersService.startFreeTrial('current_user', tier);
    setCurrentTier(tier);
    alert(`Started 14-day free trial of ${tier === 'professional' ? 'Professional' : 'Enterprise AI'} plan!`);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    if (billingCycle === 'yearly') {
      const monthly = price / 12;
      return `$${monthly.toFixed(0)}/mo`;
    }
    return `$${price}/mo`;
  };

  const getTotalPrice = (price: number) => {
    if (price === 0) return '';
    if (billingCycle === 'yearly') {
      return `$${price.toFixed(0)}/year`;
    }
    return '';
  };

  return (
    <div className="pricing-container p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your TinkyBink Plan</h1>
        <p className="text-xl text-gray-600 mb-8">
          Start free, upgrade when you need billing or AI features
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white shadow-sm font-semibold'
                : 'text-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white shadow-sm font-semibold'
                : 'text-gray-600'
            }`}
          >
            Yearly
            <span className="ml-2 text-green-600 text-sm">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {plans.filter(p => p.billingCycle === billingCycle).map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-8 ${
              plan.tier === 'professional'
                ? 'border-2 border-blue-500 shadow-xl scale-105'
                : 'border border-gray-200 shadow-lg'
            }`}
          >
            {/* Popular Badge */}
            {plan.popularBadge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MOST POPULAR
                </span>
              </div>
            )}

            {/* Current Plan Badge */}
            {currentTier === plan.tier && (
              <div className="absolute -top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  Current Plan
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                {plan.price > 0 && billingCycle === 'yearly' && (
                  <span className="ml-2 text-gray-500 text-sm">
                    {getTotalPrice(plan.price)}
                  </span>
                )}
              </div>
              {plan.savings && (
                <p className="text-green-600 text-sm mt-1">{plan.savings}</p>
              )}
            </div>

            {/* CTA Button */}
            <div className="mb-6">
              {currentTier === plan.tier ? (
                <button className="w-full py-3 px-6 bg-gray-100 text-gray-600 rounded-lg font-semibold" disabled>
                  Current Plan
                </button>
              ) : plan.price === 0 ? (
                <button className="w-full py-3 px-6 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition">
                  Start Free
                </button>
              ) : currentTier === 'free' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => startTrial(plan.tier as 'professional' | 'enterprise')}
                    className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Start 14-Day Free Trial
                  </button>
                  <button
                    onClick={() => handleUpgrade(plan)}
                    className="w-full py-2 px-4 text-blue-600 font-semibold hover:text-blue-700 transition"
                  >
                    Or Subscribe Now
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan)}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Upgrade Now
                </button>
              )}
            </div>

            {/* Features List */}
            <div className="space-y-3">
              {plan.tier === 'free' && (
                <>
                  <FeatureItem text="All core AAC features" included={true} />
                  <FeatureItem text="10 patient profiles" included={true} />
                  <FeatureItem text="Family sharing" included={true} />
                  <FeatureItem text="Basic reporting" included={true} />
                  <FeatureItem text="5 GB storage" included={true} />
                  <FeatureItem text="Billing features" included={false} />
                  <FeatureItem text="AI report writing" included={false} />
                </>
              )}
              
              {plan.tier === 'professional' && (
                <>
                  <FeatureItem text="Everything in Free" included={true} highlight />
                  <FeatureItem text="Medicare/Medicaid billing" included={true} highlight />
                  <FeatureItem text="Auto CPT code generation" included={true} highlight />
                  <FeatureItem text="Electronic claims submission" included={true} highlight />
                  <FeatureItem text="100 patient profiles" included={true} />
                  <FeatureItem text="25 GB storage" included={true} />
                  <FeatureItem text="5 team members" included={true} />
                  <FeatureItem text="AI report writing" included={false} />
                </>
              )}
              
              {plan.tier === 'enterprise' && (
                <>
                  <FeatureItem text="Everything in Professional" included={true} highlight />
                  <FeatureItem text="AI progress notes (saves 2hr/day)" included={true} highlight />
                  <FeatureItem text="AI IEP goals generator" included={true} highlight />
                  <FeatureItem text="AI treatment plans" included={true} highlight />
                  <FeatureItem text="AI research reports" included={true} highlight />
                  <FeatureItem text="Unlimited everything" included={true} />
                  <FeatureItem text="Priority support" included={true} />
                  <FeatureItem text="Custom integrations" included={true} />
                </>
              )}
            </div>

            {/* Usage Limits */}
            {plan.limits && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {plan.tier === 'enterprise' 
                    ? '✨ No limits on anything'
                    : `Up to ${plan.limits.maxPatients} patients • ${plan.limits.maxSessions} sessions/mo`
                  }
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">Detailed Feature Comparison</h2>
        <FeatureComparisonTable />
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Upgrade to {selectedPlan.name}</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">You're upgrading to:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-lg">{selectedPlan.name}</p>
                <p className="text-2xl font-bold mt-2">
                  {formatPrice(selectedPlan.price)}
                  {billingCycle === 'yearly' && ' billed annually'}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <div className="border rounded-lg p-3 flex items-center">
                <span className="text-gray-600">💳</span>
                <span className="ml-2">Visa ending in 4242</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={processUpgrade}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Feature Item Component
function FeatureItem({ 
  text, 
  included, 
  highlight = false 
}: { 
  text: string; 
  included: boolean; 
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start">
      <span className={`mr-3 mt-0.5 ${included ? 'text-green-500' : 'text-gray-300'}`}>
        {included ? '✓' : '✗'}
      </span>
      <span className={`text-sm ${highlight ? 'font-semibold' : ''} ${included ? '' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  );
}

// Feature Comparison Table
function FeatureComparisonTable() {
  const comparison = subscriptionTiersService.getFeatureComparison();
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left p-4">Features</th>
            <th className="text-center p-4">Free</th>
            <th className="text-center p-4 bg-blue-50">Professional<br/>$15/mo</th>
            <th className="text-center p-4">Enterprise AI<br/>$30/mo</th>
          </tr>
        </thead>
        <tbody>
          {comparison.categories.map((category: any, idx: number) => (
            <React.Fragment key={idx}>
              <tr className="bg-gray-50">
                <td colSpan={4} className="p-3 font-semibold">{category.name}</td>
              </tr>
              {category.features.map((feature: any, fidx: number) => (
                <tr key={fidx} className="border-b border-gray-100">
                  <td className="p-3">{feature.name}</td>
                  <td className="text-center p-3">
                    {typeof feature.free === 'boolean' ? (
                      <span className={feature.free ? 'text-green-500' : 'text-gray-300'}>
                        {feature.free ? '✓' : '—'}
                      </span>
                    ) : (
                      <span className="text-sm">{feature.free}</span>
                    )}
                  </td>
                  <td className="text-center p-3 bg-blue-50">
                    {typeof feature.professional === 'boolean' ? (
                      <span className={feature.professional ? 'text-green-500' : 'text-gray-300'}>
                        {feature.professional ? '✓' : '—'}
                      </span>
                    ) : (
                      <span className="text-sm">{feature.professional}</span>
                    )}
                  </td>
                  <td className="text-center p-3">
                    {typeof feature.enterprise === 'boolean' ? (
                      <span className={feature.enterprise ? 'text-green-500' : 'text-gray-300'}>
                        {feature.enterprise ? '✓' : '—'}
                      </span>
                    ) : (
                      <span className="text-sm">{feature.enterprise}</span>
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}