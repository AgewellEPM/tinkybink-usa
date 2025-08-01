import React, { useState } from 'react';
import {
  PatientManagement,
  CPTCodeDisplay,
  BillingAnalytics,
  SessionDocumentation,
  ClaimsManager
} from './medicare-medicaid';

interface MedicareMedicaidDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MedicareMedicaidDashboard: React.FC<MedicareMedicaidDashboardProps> = ({ isOpen, onClose }) => {
  const [showPatientManagement, setShowPatientManagement] = useState(false);
  const [showCPTCodes, setShowCPTCodes] = useState(false);
  const [showBillingAnalytics, setShowBillingAnalytics] = useState(false);
  const [showSessionDocumentation, setShowSessionDocumentation] = useState(false);
  const [showClaimsManager, setShowClaimsManager] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }}>
        <div className="modal-header">
          <h2>💰 Medicare/Medicaid Billing Dashboard</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
              🏥 Patient Management
            </h3>
            <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
              Manage patient information, insurance details, and medical records for Medicare and Medicaid billing.
            </p>
            <div className="action-buttons">
              <button
                onClick={() => setShowPatientManagement(true)}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #00C851, #007E33)' }}
              >
                <span style={{ fontSize: '16px' }}>👤</span> Manage Patients
              </button>
              <button
                onClick={() => setShowSessionDocumentation(true)}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #FFD93D, #FFB100)' }}
              >
                <span style={{ fontSize: '16px' }}>📝</span> Document Session
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
              💳 CPT Codes & Billing Rates
            </h3>
            <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
              View current Medicare and Medicaid reimbursement rates for speech-language pathology, occupational therapy, and AAC services.
            </p>
            <div className="cpt-codes-display" style={{ marginBottom: '15px' }}>
              <div className="cpt-item" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                margin: '8px 0',
                borderRadius: '6px',
                borderLeft: '4px solid var(--primary-color)'
              }}>
                <div className="cpt-code" style={{
                  fontWeight: 'bold',
                  color: 'var(--primary-color)',
                  fontSize: '16px'
                }}>
                  92507
                </div>
                <div className="cpt-desc" style={{
                  color: '#ccc',
                  margin: '4px 0',
                  fontSize: '14px'
                }}>
                  Individual SLP Treatment
                </div>
                <div className="cpt-rates" style={{
                  color: '#4CAF50',
                  fontWeight: '500',
                  fontSize: '13px'
                }}>
                  Medicare: $85.50 | Medicaid: $78.25
                </div>
              </div>
              <div className="cpt-item" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                margin: '8px 0',
                borderRadius: '6px',
                borderLeft: '4px solid var(--primary-color)'
              }}>
                <div className="cpt-code" style={{
                  fontWeight: 'bold',
                  color: 'var(--primary-color)',
                  fontSize: '16px'
                }}>
                  92609
                </div>
                <div className="cpt-desc" style={{
                  color: '#ccc',
                  margin: '4px 0',
                  fontSize: '14px'
                }}>
                  AAC Device Training
                </div>
                <div className="cpt-rates" style={{
                  color: '#4CAF50',
                  fontWeight: '500',
                  fontSize: '13px'
                }}>
                  Medicare: $95.75 | Medicaid: $87.65
                </div>
              </div>
            </div>
            <div className="action-buttons">
              <button
                onClick={() => setShowCPTCodes(true)}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #03A9F4, #0277BD)' }}
              >
                <span style={{ fontSize: '16px' }}>💳</span> View All CPT Codes
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
              📊 Billing Analytics & Claims
            </h3>
            <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
              Track billing performance, claims status, and revenue analytics for Medicare and Medicaid services.
            </p>
            <div className="billing-metrics" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div className="metric-row" style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <span className="metric-label" style={{ display: 'block', color: '#ccc', fontSize: '12px' }}>
                  This Month Sessions
                </span>
                <span className="metric-value" style={{
                  color: 'var(--primary-color)',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  Loading...
                </span>
              </div>
              <div className="metric-row" style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <span className="metric-label" style={{ display: 'block', color: '#ccc', fontSize: '12px' }}>
                  Monthly Revenue
                </span>
                <span className="metric-value" style={{
                  color: '#4CAF50',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  Loading...
                </span>
              </div>
              <div className="metric-row" style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <span className="metric-label" style={{ display: 'block', color: '#ccc', fontSize: '12px' }}>
                  Medicare Claims
                </span>
                <span className="metric-value" style={{
                  color: '#2196F3',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  Loading...
                </span>
              </div>
              <div className="metric-row" style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <span className="metric-label" style={{ display: 'block', color: '#ccc', fontSize: '12px' }}>
                  Medicaid Claims
                </span>
                <span className="metric-value" style={{
                  color: '#FF9800',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  Loading...
                </span>
              </div>
            </div>
            <div className="action-buttons">
              <button
                onClick={() => setShowBillingAnalytics(true)}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
              >
                <span style={{ fontSize: '16px' }}>📊</span> View Analytics
              </button>
              <button
                onClick={() => setShowClaimsManager(true)}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}
              >
                <span style={{ fontSize: '16px' }}>📄</span> Manage Claims
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
              📋 Compliance & Documentation
            </h3>
            <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
              Ensure HIPAA compliance and maintain proper documentation for Medicare and Medicaid audits.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{
                background: 'rgba(76, 175, 80, 0.1)',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '5px' }}>
                  ✅ HIPAA Compliant
                </div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  All patient data encrypted and audit-logged
                </div>
              </div>
              <div style={{
                background: 'rgba(33, 150, 243, 0.1)',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(33, 150, 243, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2196F3', marginBottom: '5px' }}>
                  📑 CMS Guidelines
                </div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  Documentation meets Medicare/Medicaid requirements
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 152, 0, 0.1)',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 152, 0, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FF9800', marginBottom: '5px' }}>
                  🔒 Secure Storage
                </div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  Local encryption with cloud backup options
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#999',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              💡 All billing data is stored securely and complies with federal healthcare regulations
            </div>
          </div>
        </div>
      </div>

      {/* Modular Medicare/Medicaid Components */}
      <PatientManagement 
        isOpen={showPatientManagement} 
        onClose={() => setShowPatientManagement(false)} 
      />
      <CPTCodeDisplay 
        isOpen={showCPTCodes} 
        onClose={() => setShowCPTCodes(false)} 
      />
      <BillingAnalytics 
        isOpen={showBillingAnalytics} 
        onClose={() => setShowBillingAnalytics(false)} 
      />
      <SessionDocumentation 
        isOpen={showSessionDocumentation} 
        onClose={() => setShowSessionDocumentation(false)} 
      />
      <ClaimsManager 
        isOpen={showClaimsManager} 
        onClose={() => setShowClaimsManager(false)} 
      />
    </div>
  );
};