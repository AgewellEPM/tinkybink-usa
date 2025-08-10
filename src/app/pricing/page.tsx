'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true);
    // Simulate processing
    setTimeout(() => {
      alert(`Selected plan: ${planId}`);
      setIsLoading(false);
    }, 1000);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Forever',
      description: 'Perfect for families and personal use',
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      features: [
        'Unlimited AAC communication',
        '3 user profiles',
        'Basic symbols & boards',
        'Family sharing',
        'Community support',
        'Basic progress tracking'
      ],
      notIncluded: [
        'Healthcare billing',
        'AI features',
        'Advanced analytics'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For therapists and educators',
      monthlyPrice: 29,
      yearlyPrice: 290, // ~20% discount
      popular: true,
      features: [
        'Everything in Free',
        'Unlimited patient profiles',
        'Medicare/Medicaid billing',
        'Auto CPT code generation', 
        'Electronic claims submission',
        'Advanced progress tracking',
        'Custom boards & symbols',
        'Priority email support',
        'HIPAA compliant'
      ],
      notIncluded: [
        'AI report writing',
        'AI IEP goals'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise AI',
      description: 'Revolutionary AI-powered features',
      monthlyPrice: 99,
      yearlyPrice: 990, // ~20% discount
      popular: false,
      features: [
        'Everything in Professional',
        '🤖 AI Progress Notes (saves 2hr/day)',
        '🤖 AI IEP Goals Generator',
        '🤖 AI Treatment Plans',
        '🤖 AI Research Reports',
        '🤖 Predictive breakthrough alerts',
        'Unlimited everything',
        'White glove support',
        'Custom integrations',
        'Training & onboarding'
      ],
      notIncluded: []
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    if (price === 0) return 'Free';
    if (billingCycle === 'yearly') {
      return `$${(price / 12).toFixed(0)}/mo`;
    }
    return `$${price}/mo`;
  };

  const getBilledAmount = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return '';
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    if (billingCycle === 'yearly') {
      return `$${price} billed annually`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free, upgrade when you need professional features
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-white rounded-full shadow-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-green-400 text-sm font-bold">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                plan.popular ? 'ring-4 ring-purple-500 ring-opacity-50' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-1 rounded-bl-xl text-sm font-bold">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">{getPrice(plan)}</span>
                  </div>
                  {getBilledAmount(plan) && (
                    <p className="text-sm text-gray-500 mt-2">{getBilledAmount(plan)}</p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl'
                      : plan.monthlyPrice === 0
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processing...' : 
                   plan.monthlyPrice === 0 ? 'Start Free' :
                   'Start 14-Day Trial'}
                </button>

                {/* Features */}
                <div className="mt-8 space-y-4">
                  <div className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Included:
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.notIncluded.length > 0 && (
                    <>
                      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-6">
                        Not Included:
                      </div>
                      {plan.notIncluded.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 opacity-50">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-gray-500">{feature}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Detailed Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900 bg-purple-50">Professional</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise AI</th>
                </tr>
              </thead>
              <tbody>
                {/* Core Features */}
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-semibold text-gray-900" colSpan={4}>
                    Core AAC Features
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Communication boards</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4 bg-purple-50">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">User profiles</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4 bg-purple-50">Unlimited</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Custom boards</td>
                  <td className="text-center py-3 px-4">5</td>
                  <td className="text-center py-3 px-4 bg-purple-50">Unlimited</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                
                {/* Healthcare Features */}
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-semibold text-gray-900" colSpan={4}>
                    Healthcare & Billing
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Medicare/Medicaid billing</td>
                  <td className="text-center py-3 px-4 text-gray-300">—</td>
                  <td className="text-center py-3 px-4 bg-purple-50">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">CPT code generation</td>
                  <td className="text-center py-3 px-4 text-gray-300">—</td>
                  <td className="text-center py-3 px-4 bg-purple-50">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Electronic claims</td>
                  <td className="text-center py-3 px-4 text-gray-300">—</td>
                  <td className="text-center py-3 px-4 bg-purple-50">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                
                {/* AI Features */}
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-semibold text-gray-900" colSpan={4}>
                    Revolutionary AI Features
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">AI Progress Notes</td>
                  <td className="text-center py-3 px-4 text-gray-300">—</td>
                  <td className="text-center py-3 px-4 bg-purple-50 text-gray-300">—</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">AI IEP Goals</td>
                  <td className="text-center py-3 px-4 text-gray-300">—</td>
                  <td className="text-center py-3 px-4 bg-purple-50 text-gray-300">—</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">AI Treatment Plans</td>
                  <td className="text-center py-3 px-4 text-gray-300">—</td>
                  <td className="text-center py-3 px-4 bg-purple-50 text-gray-300">—</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Predictive Analytics</td>
                  <td className="text-center py-3 px-4 text-gray-300">—</td>
                  <td className="text-center py-3 px-4 bg-purple-50 text-gray-300">—</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                
                {/* Support */}
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-semibold text-gray-900" colSpan={4}>
                    Support & Training
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Support</td>
                  <td className="text-center py-3 px-4">Community</td>
                  <td className="text-center py-3 px-4 bg-purple-50">Priority Email</td>
                  <td className="text-center py-3 px-4">White Glove</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Training</td>
                  <td className="text-center py-3 px-4">Self-service</td>
                  <td className="text-center py-3 px-4 bg-purple-50">Video tutorials</td>
                  <td className="text-center py-3 px-4">1-on-1 onboarding</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is this HIPAA compliant?
              </h3>
              <p className="text-gray-600">
                Absolutely! Professional and Enterprise plans include full HIPAA compliance and BAA agreements.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I get a refund?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee on all paid plans. No questions asked.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-xl mb-8 opacity-90">
            For organizations with 50+ users or special requirements
          </p>
          <button
            onClick={() => window.location.href = 'mailto:sales@tinkybink.com'}
            className="px-8 py-4 bg-white text-purple-900 font-semibold rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Contact Enterprise Sales
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by over 10,000+ therapists, educators, and families</p>
          <div className="flex justify-center items-center gap-8 text-gray-400">
            <span>🔒 HIPAA Compliant</span>
            <span>💳 Secure Payments</span>
            <span>🛡️ SOC2 Certified</span>
            <span>♿ WCAG 2.1 AA</span>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to App
          </button>
        </div>
      </div>
    </div>
  );
}