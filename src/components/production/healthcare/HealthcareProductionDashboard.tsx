import React, { useState, useEffect } from 'react';
import { OverviewTab } from './OverviewTab';
import { APIIntegrationTab } from './APIIntegrationTab';
import { BillingInsuranceTab } from './BillingInsuranceTab';
import { WhiteLabelTab } from './WhiteLabelTab';
import { SubscriptionsTab } from './SubscriptionsTab';
import { MonitoringTab } from './MonitoringTab';
import { EnhancedOverviewTab } from './EnhancedOverviewTab';
import { EnhancedMonitoringTab } from './EnhancedMonitoringTab';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { logger } from '@/services/logger';

interface HealthcareProductionDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthcareProductionDashboard: React.FC<HealthcareProductionDashboardProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [useEnhanced, setUseEnhanced] = useState(true); // Toggle for demo

  useEffect(() => {
    if (isOpen) {
      logger.info('Healthcare Production Dashboard opened');
      // Speak when opening (from original HTML)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Opening production dashboard');
        speechSynthesis.speak(utterance);
      }
    }
  }, [isOpen]);

  const showProductionTab = (tabName: string) => {
    setActiveTab(tabName);
    
    // Update tab button states
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AuthGuard requiredRole="admin" requiredPermissions={['view_production', 'manage_production']}>
      <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
        <div 
          className="modal-content" 
          style={{ 
            maxWidth: '900px', 
            height: '90vh', 
            overflowY: 'auto',
            width: '95%'
          }}
        >
          <div className="modal-header">
            <h2>🏢 Healthcare Production Management</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="checkbox" 
                  checked={useEnhanced}
                  onChange={(e) => setUseEnhanced(e.target.checked)}
                />
                Enhanced Mode
              </label>
              <button className="close-btn" onClick={onClose}>✖</button>
            </div>
          </div>
        
        <div className="modal-body">
          {/* Navigation Tabs - Exact from HTML */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px', 
            flexWrap: 'wrap' 
          }}>
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => showProductionTab('overview')}
              data-tab="overview"
            >
              📊 Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => showProductionTab('api')}
              data-tab="api"
            >
              🔌 API Integration
            </button>
            <button 
              className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => showProductionTab('billing')}
              data-tab="billing"
            >
              💳 Billing & Insurance
            </button>
            <button 
              className={`tab-btn ${activeTab === 'whitelabel' ? 'active' : ''}`}
              onClick={() => showProductionTab('whitelabel')}
              data-tab="whitelabel"
            >
              🎨 White Label
            </button>
            <button 
              className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
              onClick={() => showProductionTab('subscriptions')}
              data-tab="subscriptions"
            >
              💰 Subscriptions
            </button>
            <button 
              className={`tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
              onClick={() => showProductionTab('monitoring')}
              data-tab="monitoring"
            >
              📈 Monitoring
            </button>
          </div>
          
          {/* Tab Content */}
          <div id="production-tab-content">
            {activeTab === 'overview' && (useEnhanced ? <EnhancedOverviewTab /> : <OverviewTab />)}
            {activeTab === 'api' && <APIIntegrationTab />}
            {activeTab === 'billing' && <BillingInsuranceTab />}
            {activeTab === 'whitelabel' && <WhiteLabelTab />}
            {activeTab === 'subscriptions' && <SubscriptionsTab />}
            {activeTab === 'monitoring' && (useEnhanced ? <EnhancedMonitoringTab /> : <MonitoringTab />)}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
};