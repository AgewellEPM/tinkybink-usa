'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  DocumentCheckIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon as PlayIconSolid,
  StopIcon as StopIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import { billingToolkitService, CPTTemplate, SOAPNoteTemplate } from '@/services/billing-toolkit-service';

export default function BillingToolkitPage() {
  const [activeTab, setActiveTab] = useState<'timer' | 'soap' | 'cpt' | 'reports'>('timer');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [sessionData, setSessionData] = useState({
    patientId: '',
    activities: [] as string[],
    notes: '',
    cptCode: '92507'
  });
  const [cptTemplates, setCptTemplates] = useState<any[]>([]);
  const [soapNotes, setSoapNotes] = useState<any[]>([]);
  const [billingValidation, setBillingValidation] = useState<any>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const loadBillingData = () => {
    // Load CPT templates
    const cptRecommendations = billingToolkitService.getRecommendedCPTCodes({
      activityTypes: ['AAC training', 'Communication therapy'],
      duration: 45,
      patientAge: 8,
      groupSize: 1,
      serviceType: 'treatment'
    });
    setCptTemplates(cptRecommendations);
  };

  const startSession = async () => {
    if (!sessionData.patientId) {
      alert('Please select a patient first');
      return;
    }

    setSessionActive(true);
    setSessionTimer(0);
    
    // Start session in backend
    await billingToolkitService.startSession(
      sessionData.patientId,
      'therapist_001',
      sessionData.activities
    );
  };

  const endSession = async () => {
    setSessionActive(false);
    
    // End session and get billing info
    const result = await billingToolkitService.endSession('current_session');
    
    // Show billing summary
    alert(`Session completed!\nDuration: ${Math.floor(sessionTimer / 60)}:${(sessionTimer % 60).toString().padStart(2, '0')}\nCPT Code: ${result.billing.cptCode}\nEstimated Reimbursement: $${result.billing.estimatedReimbursement}`);
    
    setSessionTimer(0);
    loadBillingData();
  };

  const validateBilling = () => {
    const validation = billingToolkitService.validateBilling({
      cptCode: sessionData.cptCode,
      duration: Math.floor(sessionTimer / 60),
      activities: sessionData.activities,
      icd10: ['F80.9'],
      modifiers: []
    });
    
    setBillingValidation(validation);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'timer', title: 'Session Timer', icon: ClockIcon },
    { id: 'soap', title: 'SOAP Notes', icon: DocumentTextIcon },
    { id: 'cpt', title: 'CPT Codes', icon: CalculatorIcon },
    { id: 'reports', title: 'Reports', icon: ChartBarIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Billing Toolkit
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white text-sm font-medium">
                  <CheckCircleIconSolid className="h-4 w-4 mr-1" />
                  Pro Feature
                </span>
              </h1>
              <p className="text-gray-400">
                Auto-generate SOAP notes, track billable time, optimize CPT codes
              </p>
            </div>
            
            {sessionActive && (
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">{formatTime(sessionTimer)}</div>
                <div className="text-sm text-gray-400">Session Active</div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-800 p-1 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Session Timer Tab */}
          {activeTab === 'timer' && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Timer Controls */}
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-white mb-2">
                    {formatTime(sessionTimer)}
                  </div>
                  <div className="text-gray-400">
                    {sessionActive ? 'Session in Progress' : 'Ready to Start'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Patient Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Patient</label>
                    <select
                      value={sessionData.patientId}
                      onChange={(e) => setSessionData({ ...sessionData, patientId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500"
                      disabled={sessionActive}
                    >
                      <option value="">Select Patient</option>
                      <option value="patient_001">Emma Thompson (Age 8)</option>
                      <option value="patient_002">Alex Chen (Age 5)</option>
                      <option value="patient_003">Sarah Johnson (Age 12)</option>
                    </select>
                  </div>

                  {/* CPT Code Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CPT Code</label>
                    <select
                      value={sessionData.cptCode}
                      onChange={(e) => setSessionData({ ...sessionData, cptCode: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500"
                      disabled={sessionActive}
                    >
                      <option value="92507">92507 - Individual Therapy</option>
                      <option value="92508">92508 - Group Therapy</option>
                      <option value="92521">92521 - Evaluation</option>
                    </select>
                  </div>
                </div>

                {/* Session Controls */}
                <div className="flex justify-center gap-4">
                  {!sessionActive ? (
                    <button
                      onClick={startSession}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                    >
                      <PlayIconSolid className="h-5 w-5" />
                      Start Session
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {/* Pause logic */}}
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        <PauseIcon className="h-5 w-5" />
                        Pause
                      </button>
                      <button
                        onClick={endSession}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                      >
                        <StopIconSolid className="h-5 w-5" />
                        End Session
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Real-time Activities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">Current Activities</h3>
                  <div className="space-y-3">
                    {sessionData.activities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-gray-300">{activity}</span>
                      </div>
                    ))}
                    {sessionData.activities.length === 0 && (
                      <div className="text-gray-500 text-center py-4">
                        Activities will appear when session starts
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">Auto-Documentation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                      <DocumentCheckIcon className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="text-blue-300 font-medium">AAC Interactions</div>
                        <div className="text-blue-400 text-sm">15 communication attempts logged</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-green-300 font-medium">Goal Progress</div>
                        <div className="text-green-400 text-sm">Auto-tracking enabled</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SOAP Notes Tab */}
          {activeTab === 'soap' && (
            <motion.div
              key="soap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Auto-Generated SOAP Notes</h2>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                    Generate New Note
                  </button>
                </div>

                {/* SOAP Note Example */}
                <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Subjective</h3>
                      <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm">
                        Patient appeared motivated and engaged during session. Parent reports continued progress with communication at home using AAC device. No concerns noted.
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Objective</h3>
                      <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm">
                        Session duration: 45 minutes. Activities included AAC device training, vocabulary expansion, and social communication practice. 15 successful communication attempts recorded.
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Assessment</h3>
                      <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm">
                        Making steady progress toward communication goals. Increased use of multi-symbol messages. Ready for next complexity level in AAC programming.
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Plan</h3>
                      <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm">
                        Continue current intervention approach. Add complex sentence structures next session. Home program updated with new vocabulary targets.
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Auto-generated • Ready for signature
                      </div>
                      <div className="flex gap-3">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                          Edit Note
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Sign & Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CPT Codes Tab */}
          {activeTab === 'cpt' && (
            <motion.div
              key="cpt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6">CPT Code Recommendations</h2>
                
                <div className="grid gap-6">
                  {cptTemplates.map((cpt, index) => (
                    <div key={cpt.code} className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white font-mono">{cpt.code}</h3>
                          <p className="text-gray-300 mt-1">Individual Speech Therapy Session</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            ${cpt.estimatedReimbursement}
                          </div>
                          <div className="text-sm text-gray-400">Est. Reimbursement</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-300">
                            {Math.round(cpt.confidence * 100)}% Confidence
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {cpt.rationale}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={validateBilling}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Validate Billing
                        </button>
                        <button className="border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Billing Validation Results */}
                {billingValidation && (
                  <div className="mt-6 bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                    <h3 className="text-lg font-bold text-white mb-4">Billing Validation</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className={`p-4 rounded-lg ${billingValidation.valid ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {billingValidation.valid ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-400" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          )}
                          <span className={`font-medium ${billingValidation.valid ? 'text-green-300' : 'text-red-300'}`}>
                            {billingValidation.valid ? 'Valid' : 'Issues Found'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                        <div className="text-blue-300 font-medium">Denial Risk</div>
                        <div className="text-blue-400 text-lg font-bold">
                          {Math.round(billingValidation.estimatedDenialRisk * 100)}%
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                        <div className="text-purple-300 font-medium">Warnings</div>
                        <div className="text-purple-400 text-lg font-bold">
                          {billingValidation.warnings.length}
                        </div>
                      </div>
                    </div>

                    {billingValidation.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Optimization Suggestions:</h4>
                        <ul className="space-y-1">
                          {billingValidation.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-yellow-300 text-sm flex items-start gap-2">
                              <span className="text-yellow-400 mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6">Billing Reports & Analytics</h2>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
                    <div className="text-green-400 text-sm font-medium">Monthly Revenue</div>
                    <div className="text-3xl font-bold text-white mt-2">$12,450</div>
                    <div className="text-green-300 text-sm mt-1">↑ 8.2% from last month</div>
                  </div>
                  
                  <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
                    <div className="text-blue-400 text-sm font-medium">Approval Rate</div>
                    <div className="text-3xl font-bold text-white mt-2">94.8%</div>
                    <div className="text-blue-300 text-sm mt-1">Above industry average</div>
                  </div>
                  
                  <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-500/30">
                    <div className="text-purple-400 text-sm font-medium">Avg Days to Payment</div>
                    <div className="text-3xl font-bold text-white mt-2">18</div>
                    <div className="text-purple-300 text-sm mt-1">2 days faster than average</div>
                  </div>
                  
                  <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-500/30">
                    <div className="text-yellow-400 text-sm font-medium">Sessions This Month</div>
                    <div className="text-3xl font-bold text-white mt-2">156</div>
                    <div className="text-yellow-300 text-sm mt-1">89% billable time</div>
                  </div>
                </div>

                {/* CPT Code Performance */}
                <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4">CPT Code Performance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-mono text-white font-bold">92507</div>
                        <div className="text-gray-400 text-sm">Individual Therapy</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">78 sessions</div>
                        <div className="text-green-400 text-sm">96% approval</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">$9,360</div>
                        <div className="text-gray-400 text-sm">Revenue</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-mono text-white font-bold">92521</div>
                        <div className="text-gray-400 text-sm">Evaluation</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">12 sessions</div>
                        <div className="text-green-400 text-sm">100% approval</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">$2,760</div>
                        <div className="text-gray-400 text-sm">Revenue</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                    Download Report
                  </button>
                  <button className="border border-gray-600 text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors">
                    Schedule Export
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}