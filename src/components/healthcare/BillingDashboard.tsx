'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  FileText, 
  Users, 
  Calendar,
  Download,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getBillingIntegrationService } from '@/modules/professional/billing-integration-service';
import type { Claim, BillingProfile, CPTCode, BillingReport } from '@/modules/professional/billing-integration-service';

export function BillingDashboard() {
  const [billingService, setBillingService] = useState<ReturnType<typeof getBillingIntegrationService> | null>(null);
  
  const [claims, setClaims] = useState<Claim[]>([]);
  const [billingProfiles, setBillingProfiles] = useState<BillingProfile[]>([]);
  const [cptCodes, setCptCodes] = useState<CPTCode[]>([]);
  const [billingReport, setBillingReport] = useState<BillingReport | null>(null);
  const [metrics, setMetrics] = useState({
    totalClaims: 0,
    totalBilled: 0,
    totalCollected: 0,
    pendingClaims: 0,
    approvedClaims: 0
  });
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [profileData, setProfileData] = useState({
    patientId: '',
    insuranceProvider: '',
    policyNumber: '',
    subscriberId: '',
    subscriberName: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const service = getBillingIntegrationService();
      setBillingService(service);
      loadDashboardData(service);
    }
  }, []);

  const loadDashboardData = (service?: ReturnType<typeof getBillingIntegrationService>) => {
    const billing = service || billingService;
    if (!billing) return;

    // Generate billing report for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const report = billing.generateBillingReport(startOfMonth, endOfMonth);
    setBillingReport(report);
    
    // Get recent claims (last 10)
    const allClaims = Array.from((billing as any).claims.values()) as Claim[];
    const recentClaims = allClaims
      .sort((a, b) => b.dateOfService.getTime() - a.dateOfService.getTime())
      .slice(0, 10);
    setClaims(recentClaims);
    
    // Get billing profiles
    const profiles = Array.from((billing as any).billingProfiles.values()) as BillingProfile[];
    setBillingProfiles(profiles);
    
    // Get CPT codes
    const codes = Array.from((billing as any).cptCodes.values()) as CPTCode[];
    setCptCodes(codes);
    
    // Calculate metrics
    setMetrics({
      totalClaims: report.summary.totalClaims,
      totalBilled: report.summary.totalBilled,
      totalCollected: report.summary.totalCollected,
      pendingClaims: report.summary.totalPending,
      approvedClaims: report.summary.totalCollected
    });
  };

  const createBillingClaim = () => {
    if (!selectedPatient || !sessionIds.length) {
      alert('Please select a patient and add session IDs');
      return;
    }
    
    if (!billingService) return;
    
    try {
      const claim = billingService.createClaim(
        selectedPatient,
        sessionIds,
        { submitImmediately: false }
      );
      
      if (claim) {
        setShowNewClaim(false);
        setSelectedPatient('');
        setSessionIds([]);
        loadDashboardData();
        alert(`Claim created successfully! Claim ID: ${claim.id}`);
      } else {
        alert('Failed to create claim. Please check patient billing profile and authorization.');
      }
    } catch (error) {
      alert('Error creating claim: ' + (error as Error).message);
    }
  };

  const createBillingProfile = () => {
    if (!profileData.patientId || !profileData.insuranceProvider || !profileData.policyNumber) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!billingService) return;
    
    try {
      const profile: BillingProfile = {
        patientId: profileData.patientId,
        insuranceInfo: {
          provider: profileData.insuranceProvider,
          policyNumber: profileData.policyNumber,
          subscriberId: profileData.subscriberId,
          subscriberName: profileData.subscriberName,
          relationship: 'self',
          coverageType: 'private',
          effectiveDate: new Date()
        },
        billingAddress: {
          street1: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US'
        },
        authorizations: [],
        balance: 0,
        creditLimit: 1000
      };
      
      billingService.upsertBillingProfile(profile);
      
      setShowNewProfile(false);
      setProfileData({
        patientId: '',
        insuranceProvider: '',
        policyNumber: '',
        subscriberId: '',
        subscriberName: ''
      });
      loadDashboardData();
      alert('Billing profile created successfully!');
    } catch (error) {
      alert('Error creating profile: ' + (error as Error).message);
    }
  };

  const exportReport = () => {
    if (!billingService) return;
    
    try {
      const exportData = billingService.exportBillingData('csv');
      const blob = new Blob([exportData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      a.download = `billing_report_${now.toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting report: ' + (error as Error).message);
    }
  };

  return (
    <div className="billing-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="text-2xl font-bold text-white mb-6">Healthcare Billing Dashboard</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowNewClaim(true)}
            className="action-btn flex items-center gap-2"
          >
            <Plus size={20} />
            New Claim
          </button>
          <button
            onClick={() => setShowNewProfile(true)}
            className="action-btn flex items-center gap-2"
          >
            <Users size={20} />
            New Profile
          </button>
          <button
            onClick={exportReport}
            className="action-btn secondary flex items-center gap-2"
          >
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <motion.div 
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="metric-icon">
            <Calendar size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Claims</h3>
            <p className="metric-value">{metrics.totalClaims}</p>
            <span className="metric-label">This Month</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="metric-icon success">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Billed</h3>
            <p className="metric-value">${metrics.totalBilled.toFixed(2)}</p>
            <span className="metric-label">Billed Amount</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="metric-icon warning">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <h3>Pending Claims</h3>
            <p className="metric-value">{metrics.pendingClaims}</p>
            <span className="metric-label">Awaiting Processing</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="metric-icon info">
            <CheckCircle size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Collected</h3>
            <p className="metric-value">${metrics.totalCollected.toFixed(2)}</p>
            <span className="metric-label">Collected Amount</span>
          </div>
        </motion.div>
      </div>

      {/* Recent Sessions Table */}
      <motion.div 
        className="sessions-table"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Recent Claims</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Patient ID</th>
                <th>Date of Service</th>
                <th>Sessions</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id}>
                  <td>{claim.id.slice(-8)}</td>
                  <td>{claim.patientId}</td>
                  <td>{claim.dateOfService.toLocaleDateString()}</td>
                  <td>{claim.sessions.length}</td>
                  <td>${claim.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${claim.status}`}>
                      {claim.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Claim Modal */}
      {showNewClaim && (
        <div className="modal" onClick={() => setShowNewClaim(false)}>
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Billing Claim</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewClaim(false)}
              >
                ✖
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Patient ID</label>
                <select 
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select Patient</option>
                  {billingProfiles.map(profile => (
                    <option key={profile.patientId} value={profile.patientId}>
                      {profile.patientId} - {profile.insuranceInfo.provider}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Session IDs (comma-separated)</label>
                <input 
                  type="text"
                  value={sessionIds.join(', ')}
                  onChange={(e) => setSessionIds(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  className="form-control"
                  placeholder="session_001, session_002, session_003"
                />
              </div>

              <div className="modal-actions">
                <button 
                  onClick={createBillingClaim}
                  className="action-btn"
                >
                  Create Claim
                </button>
                <button 
                  onClick={() => setShowNewClaim(false)}
                  className="action-btn secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Profile Modal */}
      {showNewProfile && (
        <div className="modal" onClick={() => setShowNewProfile(false)}>
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Billing Profile</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewProfile(false)}
              >
                ✖
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Patient ID *</label>
                <input 
                  type="text"
                  value={profileData.patientId}
                  onChange={(e) => setProfileData({...profileData, patientId: e.target.value})}
                  className="form-control"
                  placeholder="Enter patient ID"
                />
              </div>

              <div className="form-group">
                <label>Insurance Provider *</label>
                <input 
                  type="text"
                  value={profileData.insuranceProvider}
                  onChange={(e) => setProfileData({...profileData, insuranceProvider: e.target.value})}
                  className="form-control"
                  placeholder="e.g., Aetna, Blue Cross, Medicare"
                />
              </div>

              <div className="form-group">
                <label>Policy Number *</label>
                <input 
                  type="text"
                  value={profileData.policyNumber}
                  onChange={(e) => setProfileData({...profileData, policyNumber: e.target.value})}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Subscriber ID</label>
                <input 
                  type="text"
                  value={profileData.subscriberId}
                  onChange={(e) => setProfileData({...profileData, subscriberId: e.target.value})}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Subscriber Name</label>
                <input 
                  type="text"
                  value={profileData.subscriberName}
                  onChange={(e) => setProfileData({...profileData, subscriberName: e.target.value})}
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button 
                  onClick={createBillingProfile}
                  className="action-btn"
                >
                  Create Profile
                </button>
                <button 
                  onClick={() => setShowNewProfile(false)}
                  className="action-btn secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .billing-dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          background: rgba(123, 63, 242, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7b3ff2;
        }

        .metric-icon.success {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .metric-icon.warning {
          background: rgba(255, 152, 0, 0.2);
          color: #FF9800;
        }

        .metric-icon.info {
          background: rgba(33, 150, 243, 0.2);
          color: #2196F3;
        }

        .metric-content h3 {
          font-size: 14px;
          color: #888;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .metric-label {
          font-size: 12px;
          color: #666;
        }

        .sessions-table {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 12px;
          color: #888;
          font-weight: 500;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        td {
          padding: 12px;
          color: #ddd;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.pending {
          background: rgba(255, 152, 0, 0.2);
          color: #FF9800;
        }

        .status-badge.claimed {
          background: rgba(33, 150, 243, 0.2);
          color: #2196F3;
        }

        .status-badge.paid {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #ddd;
          font-weight: 500;
        }

        .form-control {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 16px;
          outline: none;
          transition: all 0.2s;
        }

        .form-control:focus {
          border-color: #7b3ff2;
          background: rgba(255, 255, 255, 0.15);
        }

        select.form-control {
          cursor: pointer;
        }

        textarea.form-control {
          resize: vertical;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #7b3ff2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #6a2dd1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(123, 63, 242, 0.3);
        }

        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
        }

        .action-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}