'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  CheckCircleIcon as CheckCircleIconSolid 
} from '@heroicons/react/24/solid';
import { tinkyBinkConnectProSuite, TherapistTier } from '@/services/tinkyBink-connect-pro-suite';

export default function ConnectProPage() {
  const [selectedTier, setSelectedTier] = useState<string>('pro');
  const [isAnnual, setIsAnnual] = useState(false);
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);
  const [showLeadExample, setShowLeadExample] = useState(false);

  useEffect(() => {
    // Load revenue metrics
    setRevenueMetrics(tinkyBinkConnectProSuite.getRevenueMetrics());
  }, []);

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      color: 'from-gray-400 to-gray-600',
      popular: false,
      features: [
        'Basic directory listing',
        'Profile creation', 
        'Basic analytics (limited)',
        '10 patient max',
        'Community access'
      ],
      limits: 'Basic features only'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 30,
      color: 'from-blue-500 to-purple-600',
      popular: true,
      features: [
        'Featured directory profile',
        'Lead marketplace access',
        'Smart scheduling & calendar sync',
        'HIPAA-compliant messaging',
        '50 patients',
        'Priority support'
      ],
      limits: '10 leads/month'
    },
    {
      id: 'practice_plus',
      name: 'Practice+',
      price: 99,
      color: 'from-purple-600 to-pink-600',
      popular: false,
      features: [
        'Everything in Pro',
        'Complete billing toolkit',
        'Auto SOAP note generation',
        'Analytics dashboard',
        'Insurance integration',
        '200 patients',
        'CPT code templates'
      ],
      limits: '25 leads/month'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      color: 'from-emerald-500 to-teal-600',
      popular: false,
      features: [
        'Everything in Practice+',
        'Multi-therapist clinic management',
        'Admin dashboard',
        'AI-generated reports',
        'White-label options',
        'Unlimited patients',
        'Custom integrations',
        'Dedicated success manager'
      ],
      limits: 'Unlimited everything'
    }
  ];

  const revenueStreams = [
    {
      icon: UserGroupIcon,
      name: 'Directory Listings',
      description: 'Monthly subscriptions for therapist profiles',
      range: '$15–30/mo',
      color: 'text-blue-500'
    },
    {
      icon: LightBulbIcon,
      name: 'Lead Marketplace',
      description: 'Parents find therapists, therapists buy qualified leads',
      range: '$25–75/lead',
      color: 'text-purple-500'
    },
    {
      icon: DocumentTextIcon,
      name: 'Billing Toolkit',
      description: 'CPT templates, SOAP notes, session tracking',
      range: '$49–99/mo',
      color: 'text-green-500'
    },
    {
      icon: BuildingOffice2Icon,
      name: 'Enterprise SaaS',
      description: 'Multi-therapist clinic management',
      range: '$199+/mo',
      color: 'text-emerald-500'
    }
  ];

  const strategicAdvantages = [
    {
      title: 'Own the Ecosystem',
      description: 'Free AAC app captures families → directory shows therapists → lead gen → billing platform',
      impact: 'Control entire patient journey'
    },
    {
      title: 'Network Effects',
      description: 'More families using free app = more leads = more therapists join = better matches',
      impact: 'Compound growth advantage'
    },
    {
      title: 'Data Moat', 
      description: 'Session data from AAC app auto-populates therapist dashboards and billing',
      impact: 'Unprecedented clinical insights'
    },
    {
      title: 'Switching Costs',
      description: 'Therapists build their practice on our platform with integrated tools',
      impact: 'High customer retention'
    }
  ];

  const getAnnualPrice = (monthlyPrice: number) => {
    return isAnnual ? Math.round(monthlyPrice * 10) : monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
              <StarIconSolid className="h-4 w-4 mr-2" />
              TinkyBink Connect Pro Suite
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              The Complete
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {' '}Therapy Platform
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Tobii + SimplePractice + Zocdoc + Gusto in one platform. 
              We give away the AAC app for free and own the entire backend ecosystem.
            </p>

            {/* Key Stats */}
            {revenueMetrics && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">
                    ${revenueMetrics.projectedARR.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Projected ARR</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    ${revenueMetrics.totalMRR.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Monthly Recurring</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    ${revenueMetrics.leadSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Lead Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">4</div>
                  <div className="text-sm text-gray-400">Revenue Streams</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            From individual therapists to enterprise clinics, we have the right solution for every practice size.
          </p>
          
          {/* Annual Toggle */}
          <div className="flex items-center justify-center mt-8">
            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="mx-3 relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Annual <span className="text-green-400">(2 months free)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                tier.popular 
                  ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-2 border-purple-500' 
                  : 'bg-gray-800/50 border border-gray-700'
              } hover:scale-105 transition-all duration-300`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    ${getAnnualPrice(tier.price)}
                  </span>
                  <span className="text-gray-400">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">{tier.limits}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircleIconSolid className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setSelectedTier(tier.id)}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                  tier.popular
                    ? `bg-gradient-to-r ${tier.color} text-white hover:shadow-lg hover:shadow-purple-500/25`
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {tier.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Revenue Streams */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Multiple Revenue Streams</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Diversified monetization strategy captures value at every point in the therapy ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {revenueStreams.map((stream, index) => (
            <motion.div
              key={stream.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gray-700 ${stream.color} mb-4`}>
                <stream.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{stream.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{stream.description}</p>
              <div className="text-2xl font-bold text-emerald-400">{stream.range}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Strategic Advantages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Unfair Strategic Advantages</h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            While competitors focus on single solutions, we own the entire ecosystem. 
            Nobody can replicate this because we're the only ones giving away AAC for free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {strategicAdvantages.map((advantage, index) => (
            <motion.div
              key={advantage.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">{advantage.title}</h3>
              <p className="text-gray-400 mb-4">{advantage.description}</p>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400 mr-2" />
                <span className="text-emerald-400 text-sm font-medium">{advantage.impact}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lead Generation Demo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-8 border border-purple-500/30">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">The Strategic Flywheel</h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              When a parent uses our free TinkyBink app and clicks "Help Me Find a Therapist"...
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Free AAC Captures Users</h3>
              <p className="text-gray-400 text-sm">
                Parents download our free communication app for their child
              </p>
            </motion.div>

            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lead Generation Engine</h3>
              <p className="text-gray-400 text-sm">
                We collect parent info and match with local therapists
              </p>
            </motion.div>

            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Own Both Sides</h3>
              <p className="text-gray-400 text-sm">
                Therapists use our platform, sessions auto-sync to our billing system
              </p>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setShowLeadExample(!showLeadExample)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              See Lead Generation Demo
            </button>
          </div>

          <AnimatePresence>
            {showLeadExample && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-bold mb-3">Parent Profile Generated</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Child Age:</span>
                        <span className="text-white">4 years old</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Diagnosis:</span>
                        <span className="text-white">Autism Spectrum</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white">Austin, TX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Urgency:</span>
                        <span className="text-yellow-400">Within 1 week</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lead Score:</span>
                        <span className="text-green-400">85/100</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-3">Revenue Generated</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Base Lead Price:</span>
                        <span className="text-white">$45</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Matched Therapists:</span>
                        <span className="text-white">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Potential Revenue:</span>
                        <span className="text-green-400">$135</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total Value:</span>
                        <span className="text-emerald-400">$135</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl p-8 border border-purple-500/30"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the only platform that gives you everything: patient acquisition, 
            practice management, billing automation, and clinical insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg">
              Start 14-Day Free Trial
            </button>
            <button className="border border-gray-400 text-gray-300 px-8 py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors">
              Schedule Demo
            </button>
          </div>
          
          <p className="text-gray-400 text-sm mt-4">
            No credit card required • Cancel anytime • Setup in under 10 minutes
          </p>
        </motion.div>
      </div>
    </div>
  );
}