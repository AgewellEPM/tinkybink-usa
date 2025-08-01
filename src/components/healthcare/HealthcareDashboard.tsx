'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Users, Shield, Activity } from 'lucide-react';
import { BillingDashboard } from './BillingDashboard';
import { PatientManager } from './PatientManager';

export function HealthcareDashboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'billing'>('overview');

  return (
    <div className="healthcare-full-screen">
      {/* Healthcare Header */}
      <div className="healthcare-header">
        <div className="healthcare-brand">
          <div className="healthcare-icon">
            <Activity size={32} />
          </div>
          <h1>TinkyBink Healthcare</h1>
        </div>
        <div className="healthcare-controls">
          <button className="healthcare-btn back" onClick={onClose}>
            <X size={20} />
            <span>Back to AAC</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="healthcare-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Shield size={18} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          <Users size={18} />
          Patients
        </button>
        <button 
          className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          <DollarSign size={18} />
          Billing
        </button>
      </div>

      {/* Content Area */}
      <div className="healthcare-content">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overview-container"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Healthcare Management Overview</h2>
            
            <div className="feature-grid">
              <motion.div 
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="feature-icon">
                  <Shield size={32} />
                </div>
                <h3>HIPAA Compliant</h3>
                <p>End-to-end encryption for all patient data with comprehensive audit logging</p>
              </motion.div>

              <motion.div 
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="feature-icon">
                  <Users size={32} />
                </div>
                <h3>Patient Management</h3>
                <p>Complete patient profiles with communication assessments and progress tracking</p>
              </motion.div>

              <motion.div 
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="feature-icon">
                  <DollarSign size={32} />
                </div>
                <h3>Medicare/Medicaid Billing</h3>
                <p>Automated billing with CPT codes for SLP and OT services</p>
              </motion.div>

              <motion.div 
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="feature-icon">
                  <Activity size={32} />
                </div>
                <h3>Progress Tracking</h3>
                <p>Monitor AAC usage, communication acts, and therapy outcomes</p>
              </motion.div>
            </div>

            <div className="quick-stats">
              <h3 className="text-xl font-semibold mb-4">System Status</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Active Patients</span>
                  <span className="stat-value">0</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Sessions This Month</span>
                  <span className="stat-value">0</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pending Claims</span>
                  <span className="stat-value">0</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">HIPAA Compliance</span>
                  <span className="stat-value success">100%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'patients' && <PatientManager />}
        {activeTab === 'billing' && <BillingDashboard />}
      </div>

      <style jsx>{`
        .healthcare-full-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--background);
          z-index: 9999;
          display: flex;
          flex-direction: column;
        }

        .healthcare-header {
          background: rgba(26, 26, 26, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .healthcare-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .healthcare-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #4CAF50, #2196F3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .healthcare-brand h1 {
          font-size: 24px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .healthcare-controls {
          display: flex;
          gap: 12px;
        }

        .healthcare-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          color: white;
        }

        .healthcare-btn.back {
          background: #7b3ff2;
        }

        .healthcare-btn.back:hover {
          background: #6a2dd1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(123, 63, 242, 0.3);
        }

        .healthcare-tabs {
          background: rgba(26, 26, 26, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 24px;
          display: flex;
          gap: 24px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: #888;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #ddd;
        }

        .tab-btn.active {
          color: white;
          border-bottom-color: #4CAF50;
        }

        .healthcare-content {
          flex: 1;
          overflow-y: auto;
          background: transparent;
        }

        .overview-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #4CAF50, #2196F3);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 16px;
        }

        .feature-card h3 {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin: 0 0 12px 0;
        }

        .feature-card p {
          color: #888;
          line-height: 1.6;
          margin: 0;
        }

        .quick-stats {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }

        .quick-stats h3 {
          color: white;
          margin-bottom: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-label {
          color: #888;
          font-size: 14px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: white;
        }

        .stat-value.success {
          color: #4CAF50;
        }
      `}</style>
    </div>
  );
}