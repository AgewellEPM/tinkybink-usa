'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth-service';
import { npiVerificationService, NPIProvider } from '@/services/npi-verification-service';
import { pecosEducationService } from '@/services/pecos-education-service';

interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

export default function TherapistOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [npiInput, setNpiInput] = useState('');
  const [npiProvider, setNpiProvider] = useState<NPIProvider | null>(null);
  const [npiLoading, setNpiLoading] = useState(false);
  const [npiError, setNpiError] = useState('');
  const [pecosStatus, setPecosStatus] = useState<{
    enrolled: boolean;
    status: 'active' | 'pending' | 'rejected' | 'not_found';
    effectiveDate?: string;
    expirationDate?: string;
    specialties: string[];
  } | null>(null);
  const [practiceInfo, setPracticeInfo] = useState({
    practiceName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    taxId: '',
    medicareNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const steps: OnboardingStep[] = [
    { id: 'npi', title: 'NPI Verification', completed: false, current: currentStep === 1 },
    { id: 'pecos', title: 'PECOS Status', completed: false, current: currentStep === 2 },
    { id: 'practice', title: 'Practice Information', completed: false, current: currentStep === 3 },
    { id: 'billing', title: 'Billing Setup', completed: false, current: currentStep === 4 },
    { id: 'complete', title: 'Complete Setup', completed: false, current: currentStep === 5 }
  ];

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !authService.hasRole('therapist')) {
      router.push('/login');
    }
  }, [router]);

  const handleNPIVerification = async () => {
    if (!npiInput || npiInput.length !== 10) {
      setNpiError('Please enter a valid 10-digit NPI number');
      return;
    }

    setNpiLoading(true);
    setNpiError('');

    try {
      const result = await npiVerificationService.verifyNPI(npiInput);
      
      if (result.success && result.provider) {
        setNpiProvider(result.provider);
        
        if (!npiVerificationService.isSpeechTherapist(result.provider)) {
          setNpiError('Warning: This NPI is not registered as a Speech-Language Pathologist');
        }

        if (result.provider.status !== 'Active') {
          setNpiError('Warning: This NPI status is not active');
        }

        // Auto-populate practice info from NPI
        setPracticeInfo(prev => ({
          ...prev,
          address: result.provider!.primaryPracticeAddress.address1,
          city: result.provider!.primaryPracticeAddress.city,
          state: result.provider!.primaryPracticeAddress.state,
          zipCode: result.provider!.primaryPracticeAddress.postalCode,
          phone: result.provider!.primaryPracticeAddress.phone || ''
        }));

      } else {
        setNpiError(result.error || 'NPI verification failed');
        setNpiProvider(null);
      }
    } catch {
      setNpiError('Technical error during verification. Please try again.');
    } finally {
      setNpiLoading(false);
    }
  };

  const checkPECOSStatus = async () => {
    if (!npiProvider) return;

    setLoading(true);
    try {
      const status = await pecosEducationService.checkEnrollmentStatus(npiProvider.npi);
      setPecosStatus(status);
    } catch {
      console.error('PECOS status check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Save all onboarding data
      const onboardingData = {
        npi: npiProvider?.npi,
        providerInfo: npiProvider,
        practiceInfo,
        pecosStatus,
        completedAt: new Date()
      };

      // In production, this would save to Firebase
      console.log('Completing onboarding:', onboardingData);

      // Update user profile
      const user = authService.getCurrentUser();
      if (user) {
        await authService.updateUserProfile({
          ...user,
          metadata: {
            ...user.metadata,
            onboardingComplete: true,
            npi: npiProvider?.npi,
            practiceInfo
          }
        });
      }

      router.push('/dashboard?welcome=true');
    } catch {
      console.error('Onboarding completion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Professional Therapist Onboarding</h1>
          <p className="text-xl text-gray-300 mb-2">Complete Medicare/Medicaid billing setup for your AAC practice</p>
          <p className="text-gray-400">Streamlined enrollment process with real-time NPI verification and PECOS guidance</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : step.current 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                }`}>
                  {step.completed ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  step.current ? 'text-white font-semibold' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-16 h-px bg-gray-700 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          {/* Step 1: NPI Verification */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">NPI Verification</h2>
              <p className="text-gray-400 mb-6">
                Enter your National Provider Identifier (NPI) to verify your credentials and populate practice information.
              </p>

              <div className="space-y-6">
                <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-blue-400 font-semibold">About NPI Verification</h3>
                  </div>
                  <p className="text-blue-300 text-sm">
                    We&apos;ll verify your National Provider Identifier against the official CMS registry and 
                    automatically populate your practice information for faster setup.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      National Provider Identifier (NPI)
                    </span>
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={npiInput}
                        onChange={(e) => setNpiInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit NPI (e.g. 1234567890)"
                        className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition-all font-mono text-lg"
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {npiInput.length}/10 digits entered
                      </p>
                    </div>
                    <button
                      onClick={handleNPIVerification}
                      disabled={npiLoading || npiInput.length !== 10}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                    >
                      {npiLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verify NPI
                        </div>
                      )}
                    </button>
                  </div>
                  {npiError && (
                    <div className="mt-3 p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-400 text-sm font-medium">{npiError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {npiProvider && (
                  <div className="mt-6 bg-gradient-to-r from-green-900 to-blue-900 bg-opacity-20 border border-green-500 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Provider Verified Successfully</h3>
                        <p className="text-green-300 text-sm">NPI {npiProvider.npi} confirmed in CMS registry</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg">
                          <span className="text-gray-300">Provider Name</span>
                          <span className="text-white font-semibold">{npiProvider.name}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg">
                          <span className="text-gray-300">NPI Status</span>
                          <span className={`font-semibold flex items-center gap-2 ${
                            npiProvider.status === 'Active' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              npiProvider.status === 'Active' ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {npiProvider.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg">
                          <span className="text-gray-300">Practice Location</span>
                          <span className="text-white font-semibold text-right">
                            {npiProvider.primaryPracticeAddress.city}, {npiProvider.primaryPracticeAddress.state}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg">
                          <span className="text-gray-300">Specialty</span>
                          <span className={`font-semibold flex items-center gap-2 ${
                            npiVerificationService.isSpeechTherapist(npiProvider) ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            <svg className={`w-4 h-4 ${
                              npiVerificationService.isSpeechTherapist(npiProvider) ? 'text-green-400' : 'text-yellow-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {npiVerificationService.isSpeechTherapist(npiProvider) ? 'Speech-Language Pathologist' : 'Other Healthcare Provider'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {npiProvider.credentials && npiProvider.credentials.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 rounded-lg">
                        <span className="text-blue-300 text-sm font-medium">Credentials: </span>
                        <span className="text-blue-100 text-sm">{npiProvider.credentials.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: PECOS Status */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">PECOS Enrollment Status</h2>
              <p className="text-gray-400 mb-6">
                Check your Medicare enrollment status and learn about PECOS requirements.
              </p>

              <div className="space-y-6">
                <button
                  onClick={checkPECOSStatus}
                  disabled={loading || !npiProvider}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Checking Status...' : 'Check PECOS Status'}
                </button>

                {pecosStatus && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Medicare Enrollment Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Enrollment Status:</span>
                        <span className={`${pecosStatus.enrolled ? 'text-green-400' : 'text-red-400'}`}>
                          {pecosStatus.enrolled ? 'Enrolled' : 'Not Enrolled'}
                        </span>
                      </div>
                      {pecosStatus.enrolled && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Effective Date:</span>
                            <span className="text-white">{pecosStatus.effectiveDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Specialties:</span>
                            <span className="text-white">{pecosStatus.specialties.join(', ')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {!pecosStatus?.enrolled && (
                  <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
                    <h3 className="text-yellow-400 font-semibold mb-2">PECOS Enrollment Required</h3>
                    <p className="text-yellow-300 text-sm mb-4">
                      You need to enroll in PECOS to bill Medicare for speech therapy services.
                    </p>
                    <button
                      onClick={() => router.push('/billing-education')}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Learn About PECOS Enrollment
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Practice Information */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Practice Information</h2>
              <p className="text-gray-400 mb-6">
                Complete your practice details for billing and documentation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Practice Name
                  </label>
                  <input
                    type="text"
                    value={practiceInfo.practiceName}
                    onChange={(e) => setPracticeInfo({...practiceInfo, practiceName: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={practiceInfo.email}
                    onChange={(e) => setPracticeInfo({...practiceInfo, email: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={practiceInfo.address}
                    onChange={(e) => setPracticeInfo({...practiceInfo, address: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={practiceInfo.city}
                    onChange={(e) => setPracticeInfo({...practiceInfo, city: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={practiceInfo.state}
                    onChange={(e) => setPracticeInfo({...practiceInfo, state: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={practiceInfo.zipCode}
                    onChange={(e) => setPracticeInfo({...practiceInfo, zipCode: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={practiceInfo.phone}
                    onChange={(e) => setPracticeInfo({...practiceInfo, phone: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tax ID (EIN)
                  </label>
                  <input
                    type="text"
                    value={practiceInfo.taxId}
                    onChange={(e) => setPracticeInfo({...practiceInfo, taxId: e.target.value})}
                    placeholder="XX-XXXXXXX"
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Medicare Provider Number (if enrolled)
                  </label>
                  <input
                    type="text"
                    value={practiceInfo.medicareNumber}
                    onChange={(e) => setPracticeInfo({...practiceInfo, medicareNumber: e.target.value})}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Billing Setup */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Billing Setup</h2>
              <p className="text-gray-400 mb-6">
                Configure your billing preferences and review CPT codes for AAC services.
              </p>

              <div className="space-y-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Common AAC CPT Codes</h3>
                  <div className="space-y-3">
                    {pecosEducationService.getAACCPTCodes().slice(0, 3).map(code => (
                      <div key={code.code} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0">
                        <div>
                          <span className="text-white font-mono">{code.code}</span>
                          <p className="text-sm text-gray-400">{code.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400">${code.reimbursementRate.medicare}</div>
                          <div className="text-xs text-gray-400">Medicare Rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                  <h3 className="text-blue-400 font-semibold mb-2">Billing Integration Ready</h3>
                  <p className="text-blue-300 text-sm">
                    Your TinkyBink AAC platform will automatically track therapy sessions and generate billing documentation 
                    with appropriate CPT codes based on services provided.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Setup Complete!</h2>
              <p className="text-gray-400 mb-8">
                You&apos;re all set to start using TinkyBink AAC for therapy sessions and billing.
              </p>

              <div className="bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-6 mb-8">
                <h3 className="text-green-400 font-semibold mb-4">What&apos;s Next?</h3>
                <ul className="text-left text-green-300 space-y-2">
                  <li>• Access your therapist dashboard</li>
                  <li>• Set up patient accounts</li>
                  <li>• Begin AAC therapy sessions</li>
                  <li>• Generate progress reports</li>
                  <li>• Submit insurance claims</li>
                </ul>
              </div>

              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-2xl"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Completing Professional Setup...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Launch My AAC Practice Dashboard
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10 pt-8 border-t border-gray-700">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous Step
            </button>

            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Step {currentStep} of {steps.length}</div>
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {currentStep < 5 && (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !npiProvider}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}