'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth-service';
import { 
  pecosEducationService, 
  PECOSEnrollmentStep, 
  BillingGuide, 
  CPTCodeInfo 
} from '@/services/pecos-education-service';

export default function BillingEducationPage() {
  const [activeTab, setActiveTab] = useState<'pecos' | 'billing' | 'codes' | 'compliance'>('pecos');
  const [enrollmentSteps, setEnrollmentSteps] = useState<PECOSEnrollmentStep[]>([]);
  const [billingGuides, setBillingGuides] = useState<BillingGuide[]>([]);
  const [cptCodes, setCptCodes] = useState<CPTCodeInfo[]>([]);
  const [complianceChecklist, setComplianceChecklist] = useState<Array<{
    category: string;
    items: Array<{
      task: string;
      required: boolean;
      completed: boolean;
    }>;
  }>>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !authService.hasAnyRole(['therapist', 'admin'])) {
      router.push('/login');
      return;
    }

    // Load education content
    setEnrollmentSteps(pecosEducationService.getPECOSEnrollmentSteps());
    setBillingGuides(pecosEducationService.getBillingGuides());
    setCptCodes(pecosEducationService.getAACCPTCodes());
    setComplianceChecklist(pecosEducationService.generateComplianceChecklist());
  }, [router]);

  const tabs = [
    { id: 'pecos', title: 'PECOS Enrollment', icon: '📋' },
    { id: 'billing', title: 'Billing Guides', icon: '💰' },
    { id: 'codes', title: 'CPT Codes', icon: '🏥' },
    { id: 'compliance', title: 'Compliance', icon: '✅' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Medicare Billing Education</h1>
          <p className="text-gray-400">Complete guide to PECOS enrollment and AAC therapy billing</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
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
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.title}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          {/* PECOS Enrollment Tab */}
          {activeTab === 'pecos' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">PECOS Enrollment Process</h2>
              <p className="text-gray-400 mb-8">
                Provider Enrollment, Chain and Ownership System (PECOS) is required to bill Medicare for speech therapy services.
              </p>

              <div className="space-y-6">
                {enrollmentSteps.map((step, index) => (
                  <div key={step.id} className="border border-gray-700 rounded-lg">
                    <button
                      onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                          <p className="text-gray-400 text-sm">{step.timeline}</p>
                        </div>
                      </div>
                      <span className={`text-gray-400 transform transition-transform ${
                        selectedStep === step.id ? 'rotate-180' : ''
                      }`}>
                        ▼
                      </span>
                    </button>

                    {selectedStep === step.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        className="border-t border-gray-700 p-6"
                      >
                        <p className="text-gray-300 mb-4">{step.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-semibold mb-2">Requirements:</h4>
                            <ul className="space-y-1">
                              {step.requirements.map((req, idx) => (
                                <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                                  <span className="text-green-400 mt-1">•</span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-white font-semibold mb-2">Documents Needed:</h4>
                            <ul className="space-y-1">
                              {step.documents.map((doc, idx) => (
                                <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                                  <span className="text-blue-400 mt-1">📄</span>
                                  {doc}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-white font-semibold mb-2">Tips:</h4>
                          <ul className="space-y-1">
                            {step.tips.map((tip, idx) => (
                              <li key={idx} className="text-yellow-300 text-sm flex items-start gap-2">
                                <span className="text-yellow-400 mt-1">💡</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg">
                <h3 className="text-blue-400 font-semibold mb-2">Need Help with Enrollment?</h3>
                <p className="text-blue-300 text-sm mb-4">
                  PECOS enrollment can be complex. Consider working with a credentialing specialist if you need assistance.
                </p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                  Find Credentialing Services
                </button>
              </div>
            </div>
          )}

          {/* Billing Guides Tab */}
          {activeTab === 'billing' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Billing Guidelines</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Guide List */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-white mb-4">Available Guides</h3>
                  <div className="space-y-2">
                    {billingGuides.map(guide => (
                      <button
                        key={guide.id}
                        onClick={() => setSelectedGuide(guide.id)}
                        className={`w-full text-left p-4 rounded-lg transition-colors ${
                          selectedGuide === guide.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium">{guide.title}</div>
                        <div className="text-sm opacity-75 capitalize">{guide.category.replace('_', ' ')}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guide Content */}
                <div className="lg:col-span-2">
                  {selectedGuide ? (
                    <motion.div
                      key={selectedGuide}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {(() => {
                        const guide = billingGuides.find(g => g.id === selectedGuide);
                        if (!guide) return null;

                        return (
                          <div>
                            <h3 className="text-xl font-bold text-white mb-4">{guide.title}</h3>
                            
                            <div className="prose prose-invert max-w-none">
                              <div className="text-gray-300 mb-6 whitespace-pre-line">{guide.content}</div>
                            </div>

                            <div className="mb-6">
                              <h4 className="text-white font-semibold mb-3">Key Points:</h4>
                              <ul className="space-y-2">
                                {guide.keyPoints.map((point, idx) => (
                                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-white font-semibold mb-3">Resources:</h4>
                              <div className="space-y-2">
                                {guide.resources.map((resource, idx) => (
                                  <a
                                    key={idx}
                                    href={resource.url}
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    <span>{resource.type === 'pdf' ? '📄' : resource.type === 'video' ? '🎥' : '🌐'}</span>
                                    {resource.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                      <div className="text-center">
                        <span className="text-4xl mb-4 block">📚</span>
                        <p>Select a guide to view detailed information</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CPT Codes Tab */}
          {activeTab === 'codes' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">AAC Therapy CPT Codes</h2>
              <p className="text-gray-400 mb-6">
                Common CPT codes for Augmentative and Alternative Communication therapy services.
              </p>

              <div className="space-y-4">
                {cptCodes.map(code => (
                  <div key={code.code} className="bg-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white font-mono">{code.code}</h3>
                        <p className="text-gray-300 mt-1">{code.description}</p>
                        <span className="inline-block px-2 py-1 bg-purple-600 text-white text-xs rounded mt-2">
                          {code.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          ${code.reimbursementRate.medicare}
                        </div>
                        <div className="text-sm text-gray-400">Medicare Rate</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Reimbursement Rates:</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Medicare:</span>
                            <span className="text-green-400">${code.reimbursementRate.medicare}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Medicaid:</span>
                            <span className="text-yellow-400">${code.reimbursementRate.medicaid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Commercial:</span>
                            <span className="text-blue-400">${code.reimbursementRate.commercial}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-2">Requirements:</h4>
                        <ul className="space-y-1">
                          {code.requirements.slice(0, 3).map((req, idx) => (
                            <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                              <span className="text-green-400 mt-1">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-2">Documentation:</h4>
                        <ul className="space-y-1">
                          {code.documentation.slice(0, 3).map((doc, idx) => (
                            <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                              <span className="text-blue-400 mt-1">📝</span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {code.modifiers && code.modifiers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <h4 className="text-white font-semibold mb-2">Common Modifiers:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {code.modifiers.map((modifier, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="text-yellow-400 font-mono">{modifier.code}</span>
                              <span className="text-gray-300 ml-2">{modifier.description}</span>
                              <p className="text-gray-400 text-xs mt-1">{modifier.when}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Compliance Checklist</h2>
              <p className="text-gray-400 mb-6">
                Ensure you meet all requirements for Medicare billing and stay compliant with regulations.
              </p>

              <div className="space-y-6">
                {complianceChecklist.map((category, categoryIdx) => (
                  <div key={categoryIdx} className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">{category.category}</h3>
                    
                    <div className="space-y-3">
                      {category.items.map((item: any, itemIdx: number) => (
                        <label key={itemIdx} className="flex items-center gap-3 cursor-pointer hover:bg-gray-600 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => {
                              const newChecklist = [...complianceChecklist];
                              newChecklist[categoryIdx].items[itemIdx].completed = e.target.checked;
                              setComplianceChecklist(newChecklist);
                            }}
                            className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                          />
                          <span className={`flex-1 ${
                            item.completed ? 'text-green-400 line-through' : 'text-gray-300'
                          }`}>
                            {item.task}
                          </span>
                          {item.required && (
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Progress:</span>
                        <span className="text-white">
                          {category.items.filter((item: any) => item.completed).length} / {category.items.length} completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(category.items.filter((item: any) => item.completed).length / category.items.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-green-900 bg-opacity-20 border border-green-500 rounded-lg">
                <h3 className="text-green-400 font-semibold mb-2">Compliance Support</h3>
                <p className="text-green-300 text-sm">
                  TinkyBink AAC automatically helps with compliance by generating proper documentation, 
                  tracking therapy progress, and maintaining HIPAA-compliant records.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.push('/therapist-onboarding')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Start Onboarding Process
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Download Billing Guide PDF
          </button>
        </div>
      </div>
    </div>
  );
}