'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth-service';
import { stripeSubscriptionService, SUBSCRIPTION_PLANS } from '@/services/stripe-subscription-service';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();

  const handleSelectPlan = async (planId: string) => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Students get free access
    if (planId === 'student_free') {
      router.push('/');
      return;
    }

    setIsLoading(true);
    try {
      const checkoutUrl = await stripeSubscriptionService.createCheckoutSession(
        user.uid,
        planId,
        `${window.location.origin}/dashboard?subscription=success`,
        `${window.location.origin}/pricing?subscription=canceled`
      );
      
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      category: 'Students',
      plans: [SUBSCRIPTION_PLANS.student_free]
    },
    {
      category: 'Parents & Caregivers',
      plans: [SUBSCRIPTION_PLANS.parent_basic, SUBSCRIPTION_PLANS.parent_premium]
    },
    {
      category: 'Educators',
      plans: [SUBSCRIPTION_PLANS.teacher_classroom, SUBSCRIPTION_PLANS.teacher_school]
    },
    {
      category: 'Healthcare Professionals',
      plans: [SUBSCRIPTION_PLANS.therapist_solo, SUBSCRIPTION_PLANS.therapist_clinic]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your TinkyBink Plan
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Professional AAC platform with ML-powered communication
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-green-400 text-sm">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        {plans.map((category, idx) => (
          <div key={idx} className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">{category.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-purple-500 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold text-green-400">Free</div>
                    ) : plan.price ? (
                      <>
                        <div className="text-4xl font-bold text-white">
                          ${billingCycle === 'yearly' 
                            ? (plan.price * 10).toFixed(0) // 2 months free
                            : plan.price.toFixed(0)
                          }
                        </div>
                        <div className="text-gray-400">
                          {billingCycle === 'yearly' ? 'per year' : 'per month'}
                        </div>
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-white">Custom Pricing</div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.price === 0
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : plan.price
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Loading...' : 
                     plan.price === 0 ? 'Start Free' :
                     plan.price ? 'Start 14-Day Trial' : 'Contact Sales'}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Enterprise Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need a Custom Solution?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Get a tailored plan for your organization with dedicated support and custom features
          </p>
          <button
            onClick={() => window.location.href = 'mailto:sales@tinkybink.com'}
            className="px-8 py-4 bg-white text-purple-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contact Enterprise Sales
          </button>
        </div>

        {/* ML Training Notice */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>🧠 All platform usage data is collected to continuously improve our ML models</p>
          <p>💳 Secure payment processing by Stripe • 🔒 HIPAA Compliant • 📊 Real-time Analytics</p>
        </div>
      </div>
    </div>
  );
}