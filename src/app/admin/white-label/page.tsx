'use client';

import { useState, useEffect } from 'react';
import { whiteLabelService, WhiteLabelConfig } from '@/services/white-label-service';

export default function WhiteLabelAdmin() {
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([]);
  const [, setSelectedConfig] = useState<WhiteLabelConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    organizationName: '',
    subdomain: '',
    primaryColor: '#FF6B6B',
    secondaryColor: '#845EC2',
    logoUrl: '',
    // Features
    enableAI: true,
    enableEyeTracking: true,
    enableClinical: true,
    enableEmergency: true,
    // Billing
    billingModel: 'subscription' as const,
    monthlyPrice: 199,
    // Access
    selfRegistration: true,
    requireApproval: false
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    // In production, load from API
    const mockConfigs: WhiteLabelConfig[] = [];
    setConfigs(mockConfigs);
  };

  const handleCreate = async () => {
    try {
      const config: Partial<WhiteLabelConfig> = {
        organizationName: formData.organizationName,
        subdomain: formData.subdomain,
        branding: {
          logo: {
            light: formData.logoUrl || '/logo-light.png',
            dark: formData.logoUrl || '/logo-dark.png',
            favicon: '/favicon.ico'
          },
          colors: {
            primary: formData.primaryColor,
            secondary: formData.secondaryColor,
            accent: '#4ECDC4',
            background: '#1a1a2e',
            text: '#FFFFFF',
            success: '#4ECDC4',
            warning: '#FFE66D',
            error: '#FF6B6B',
            info: '#4E8BFF'
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter',
            mono: 'JetBrains Mono'
          },
          theme: {
            borderRadius: '12px',
            shadowStyle: 'medium',
            animationSpeed: 'normal'
          }
        },
        features: {
          aac: {
            enabled: true,
            customVocabulary: true,
            importedTileSets: []
          },
          ai: {
            predictiveCommunication: formData.enableAI,
            emotionDetection: formData.enableAI,
            contextAwareness: formData.enableAI
          },
          accessibility: {
            eyeTracking: formData.enableEyeTracking,
            switchScanning: true,
            headTracking: true,
            customAccessMethods: []
          },
          clinical: {
            patientManagement: formData.enableClinical,
            therapyPlanning: formData.enableClinical,
            progressTracking: formData.enableClinical,
            clinicalReports: formData.enableClinical,
            customAssessments: []
          },
          communication: {
            voiceSynthesis: true,
            customVoices: [],
            videoChat: true,
            messaging: true,
            emergencyProtocols: formData.enableEmergency
          },
          integrations: {
            ehr: true,
            billing: true,
            telehealth: true,
            customWebhooks: true
          }
        },
        billing: {
          model: formData.billingModel,
          customPricing: {
            monthly: formData.monthlyPrice,
            annual: formData.monthlyPrice * 10,
            perUser: 0,
            features: {}
          },
          paymentMethods: ['stripe', 'invoice'],
          billingContact: 'admin@example.com'
        },
        access: {
          selfRegistration: formData.selfRegistration,
          requireApproval: formData.requireApproval,
          allowedDomains: [],
          ssoEnabled: false,
          roleMapping: {
            admin: ['admin'],
            therapist: ['therapist'],
            family: ['family']
          }
        }
      };

      const organizationId = await whiteLabelService.createWhiteLabelConfig(config);
      console.log('Created white label config:', organizationId);
      
      // Reset form
      setIsCreating(false);
      loadConfigurations();
      
      alert(`White label instance created! Access at: ${formData.subdomain}.tinkybink.com`);
      
    } catch (error) {
      console.error('Failed to create white label config:', error);
      alert('Failed to create configuration');
    }
  };

  const generatePreviewUrl = (subdomain: string) => {
    const baseUrl = window.location.hostname.includes('localhost') 
      ? 'http://localhost:3000'
      : 'https://tinkybink.com';
    return `${baseUrl}?preview=${subdomain}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">White Label Administration</h1>
        
        {/* Create New Button */}
        <button
          onClick={() => setIsCreating(true)}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          + Create New White Label Instance
        </button>

        {/* Creation Form */}
        {isCreating && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">New White Label Configuration</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <label className="block text-white mb-2">Organization Name</label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50"
                  placeholder="Children's Hospital Boston"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Subdomain</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="flex-1 px-4 py-2 rounded-l-lg bg-white/20 text-white placeholder-white/50"
                    placeholder="childrens-hospital"
                  />
                  <span className="px-4 py-2 bg-white/10 rounded-r-lg text-white">.tinkybink.com</span>
                </div>
              </div>

              {/* Branding */}
              <div>
                <label className="block text-white mb-2">Primary Color</label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Logo URL</label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              {/* Features */}
              <div className="col-span-2">
                <label className="block text-white mb-4">Features</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={formData.enableAI}
                      onChange={(e) => setFormData({...formData, enableAI: e.target.checked})}
                      className="mr-2"
                    />
                    AI-Powered Predictions
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={formData.enableEyeTracking}
                      onChange={(e) => setFormData({...formData, enableEyeTracking: e.target.checked})}
                      className="mr-2"
                    />
                    Eye Tracking
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={formData.enableClinical}
                      onChange={(e) => setFormData({...formData, enableClinical: e.target.checked})}
                      className="mr-2"
                    />
                    Clinical Features
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={formData.enableEmergency}
                      onChange={(e) => setFormData({...formData, enableEmergency: e.target.checked})}
                      className="mr-2"
                    />
                    Emergency Protocols
                  </label>
                </div>
              </div>

              {/* Billing */}
              <div>
                <label className="block text-white mb-2">Monthly Price</label>
                <input
                  type="number"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({...formData, monthlyPrice: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 text-white"
                />
              </div>

              {/* Access Control */}
              <div>
                <label className="block text-white mb-2">Access Control</label>
                <label className="flex items-center text-white mb-2">
                  <input
                    type="checkbox"
                    checked={formData.selfRegistration}
                    onChange={(e) => setFormData({...formData, selfRegistration: e.target.checked})}
                    className="mr-2"
                  />
                  Allow Self Registration
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={formData.requireApproval}
                    onChange={(e) => setFormData({...formData, requireApproval: e.target.checked})}
                    className="mr-2"
                  />
                  Require Admin Approval
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Create Instance
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Configurations */}
        <div className="grid gap-6">
          <h2 className="text-2xl font-bold text-white">Existing White Label Instances</h2>
          
          {configs.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <p className="text-white/70">No white label instances created yet.</p>
            </div>
          ) : (
            configs.map((config) => (
              <div key={config.organizationId} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">{config.organizationName}</h3>
                    <p className="text-white/70">{config.subdomain}.tinkybink.com</p>
                    <div className="mt-2 flex gap-2">
                      {config.features.ai.predictiveCommunication && (
                        <span className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded text-sm">AI Enabled</span>
                      )}
                      {config.features.accessibility.eyeTracking && (
                        <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-sm">Eye Tracking</span>
                      )}
                      {config.features.clinical.patientManagement && (
                        <span className="px-2 py-1 bg-green-500/30 text-green-200 rounded text-sm">Clinical</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={generatePreviewUrl(config.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                    >
                      Preview
                    </a>
                    <button
                      onClick={() => setSelectedConfig(config)}
                      className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Example Configurations */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Example Use Cases</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Children&apos;s Hospital</h3>
              <p className="text-white/70 text-sm mb-4">Pediatric-focused AAC with fun themes and gamification</p>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• Colorful kid-friendly branding</li>
                <li>• Game-based therapy modules</li>
                <li>• Parent engagement portal</li>
                <li>• Insurance billing integration</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Stroke Recovery Center</h3>
              <p className="text-white/70 text-sm mb-4">Adult-focused with clinical features</p>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• Professional medical branding</li>
                <li>• Advanced eye tracking</li>
                <li>• Progress analytics</li>
                <li>• Medicare integration</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">School District</h3>
              <p className="text-white/70 text-sm mb-4">Educational AAC for special needs</p>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• School branding</li>
                <li>• Curriculum integration</li>
                <li>• Teacher collaboration</li>
                <li>• IEP tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}