'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FireIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  StarIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import { leadMarketplaceService, ParentLead } from '@/services/lead-marketplace-service';

export default function LeadMarketplacePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    maxPrice: 100,
    childAge: { min: 0, max: 18 },
    urgency: [] as string[],
    diagnosis: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [purchaseModal, setPurchaseModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplaceData();
  }, [filters]);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      // Mock therapist ID - in production this would come from auth
      const therapistId = 'therapist_001';
      
      const leadsData = await leadMarketplaceService.getAvailableLeads(therapistId, {
        maxPrice: filters.maxPrice,
        childAge: filters.childAge,
        urgency: filters.urgency.length > 0 ? filters.urgency : undefined,
        diagnosis: filters.diagnosis.length > 0 ? filters.diagnosis : undefined
      });
      
      setLeads(leadsData.leads);
      setAnalytics(leadMarketplaceService.getMarketplaceAnalytics());
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    }
    setLoading(false);
  };

  const handlePurchaseLead = async (leadId: string) => {
    const therapistId = 'therapist_001';
    
    const result = await leadMarketplaceService.purchaseLead(
      therapistId, 
      leadId, 
      'credit_card'
    );
    
    if (result.success) {
      setPurchaseModal(null);
      // Show success notification
      alert(`Successfully purchased lead! Contact info: ${result.contactInfo?.email}`);
      loadMarketplaceData();
    } else {
      alert(`Purchase failed: ${result.error}`);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'text-red-400 bg-red-900/20';
      case 'within_week': return 'text-orange-400 bg-orange-900/20';
      case 'within_month': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi > 300) return 'text-emerald-400';
    if (roi > 200) return 'text-green-400';
    if (roi > 100) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Lead Marketplace
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-purple-600 text-white text-sm font-medium">
                  <FireIconSolid className="h-4 w-4 mr-1" />
                  Hot Leads
                </span>
              </h1>
              <p className="text-gray-400">
                Qualified families from our free AAC app looking for therapists
              </p>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Quick Stats */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">{analytics.overview.totalLeads}</div>
                <div className="text-sm text-gray-400">Total Leads</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">${analytics.overview.avgLeadPrice}</div>
                <div className="text-sm text-gray-400">Avg Price</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{analytics.overview.conversionRate}%</div>
                <div className="text-sm text-gray-400">Conversion Rate</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-400">${analytics.overview.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Revenue</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 border-b border-gray-700"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
                  <input
                    type="range"
                    min="25"
                    max="100"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-400">${filters.maxPrice}</div>
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Child Age</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={filters.childAge.min}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        childAge: { ...filters.childAge, min: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={filters.childAge.max}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        childAge: { ...filters.childAge, max: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Urgency</label>
                  <div className="space-y-2">
                    {['immediate', 'within_week', 'within_month'].map((urgency) => (
                      <label key={urgency} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.urgency.includes(urgency)}
                          onChange={(e) => {
                            const newUrgency = e.target.checked
                              ? [...filters.urgency, urgency]
                              : filters.urgency.filter(u => u !== urgency);
                            setFilters({ ...filters, urgency: newUrgency });
                          }}
                          className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-300 capitalize">
                          {urgency.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Diagnosis</label>
                  <div className="space-y-2">
                    {['autism', 'apraxia', 'language_delay', 'other'].map((diagnosis) => (
                      <label key={diagnosis} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.diagnosis.includes(diagnosis)}
                          onChange={(e) => {
                            const newDiagnosis = e.target.checked
                              ? [...filters.diagnosis, diagnosis]
                              : filters.diagnosis.filter(d => d !== diagnosis);
                            setFilters({ ...filters, diagnosis: newDiagnosis });
                          }}
                          className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-300 capitalize">
                          {diagnosis.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leads Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading fresh leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <FireIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No leads match your criteria</h3>
            <p className="text-gray-500">Try adjusting your filters to see more leads</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {leads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
              >
                {/* Lead Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-white">
                        {lead.preview.childAge} years old
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(lead.preview.urgency)}`}>
                        {lead.preview.urgency.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-300 font-medium capitalize mb-1">
                      {lead.preview.diagnosis.replace('_', ' ')}
                    </p>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {lead.preview.location}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      ${lead.preview.price}
                    </div>
                    <div className="text-xs text-gray-400">per lead</div>
                  </div>
                </div>

                {/* Lead Quality Indicators */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <StarIconSolid className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">
                      {lead.preview.leadScore}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrophyIcon className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-300">
                      {lead.matchScore}% match
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChartBarIcon className="h-4 w-4 text-emerald-400" />
                    <span className={`text-sm font-medium ${getROIColor(lead.estimatedROI)}`}>
                      {lead.estimatedROI}% ROI
                    </span>
                  </div>
                </div>

                {/* Special Requests */}
                {lead.preview.specialRequests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Special Requests:</h4>
                    <div className="flex flex-wrap gap-1">
                      {lead.preview.specialRequests.map((request: string, idx: number) => (
                        <span key={idx} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full">
                          {request}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => setPurchaseModal(lead.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                >
                  Purchase Lead
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {purchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700"
            >
              {(() => {
                const lead = leads.find(l => l.id === purchaseModal);
                if (!lead) return null;

                return (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">Purchase Lead</h3>
                      <p className="text-gray-400">
                        Get contact information for this qualified family
                      </p>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-300">Child Age:</span>
                        <span className="text-white font-medium">{lead.preview.childAge} years</span>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-300">Diagnosis:</span>
                        <span className="text-white font-medium capitalize">{lead.preview.diagnosis.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-300">Urgency:</span>
                        <span className="text-white font-medium capitalize">{lead.preview.urgency.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-300">Location:</span>
                        <span className="text-white font-medium">{lead.preview.location}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-300">Lead Score:</span>
                        <span className="text-yellow-400 font-medium">{lead.preview.leadScore}/100</span>
                      </div>
                    </div>

                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                      <h4 className="text-green-400 font-medium mb-2">What You'll Get:</h4>
                      <ul className="space-y-1 text-sm text-green-300">
                        <li className="flex items-center gap-2">
                          <CheckCircleIconSolid className="h-4 w-4" />
                          Parent contact information
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIconSolid className="h-4 w-4" />
                          Child's detailed profile
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIconSolid className="h-4 w-4" />
                          Family preferences & needs
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIconSolid className="h-4 w-4" />
                          Best time to contact
                        </li>
                      </ul>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        ${lead.preview.price}
                      </div>
                      <div className="text-sm text-gray-400">
                        Estimated ROI: <span className={`font-medium ${getROIColor(lead.estimatedROI)}`}>
                          {lead.estimatedROI}%
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPurchaseModal(null)}
                        className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePurchaseLead(purchaseModal)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                      >
                        Purchase Now
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <div className="fixed bottom-4 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hidden"
          id="success-message"
        >
          Lead purchased successfully! Check your email for contact details.
        </motion.div>
      </div>
    </div>
  );
}