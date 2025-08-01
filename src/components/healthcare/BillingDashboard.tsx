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
import { BillingService } from '@/modules/healthcare/billing-service';
import { PatientService } from '@/modules/healthcare/patient-service';
import { HIPAAService } from '@/modules/healthcare/hipaa-service';

export function BillingDashboard() {
  const [billingService] = useState(() => new BillingService());
  const [hipaaService] = useState(() => new HIPAAService());
  const [patientService] = useState(() => new PatientService(hipaaService));
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalRevenue: 0,
    pendingClaims: 0,
    approvedClaims: 0
  });
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load sessions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const report = billingService.getBillingReport(startOfMonth, endOfMonth);
    setSessions(report.sessions.slice(-10).reverse());
    
    // Load patients
    const allPatients = patientService.getActivePatients();
    setPatients(allPatients);
    
    // Calculate metrics
    setMetrics({
      totalSessions: report.totalSessions,
      totalRevenue: report.medicareTotal + report.medicaidTotal,
      pendingClaims: report.byStatus['pending'] || 0,
      approvedClaims: report.byStatus['paid'] || 0
    });
  };

  const createBillingSession = () => {
    if (!selectedPatient || !serviceType || !duration) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const sessionId = billingService.createSession(
        selectedPatient,
        'provider_001', // In real app, get from auth
        serviceType,
        duration,
        notes
      );
      
      // Add progress note
      const patient = patientService.getPatient(selectedPatient);
      if (patient) {
        patientService.addProgressNote(selectedPatient, {
          date: new Date().toISOString(),
          sessionType: serviceType,
          duration,
          activities: ['AAC therapy session'],
          performance: {
            tilesUsed: 0,
            sentencesCreated: 0,
            communicationActs: 0,
            independenceLevel: 'supervised'
          },
          notes,
          providerId: 'provider_001'
        });
      }
      
      setShowNewSession(false);
      loadDashboardData();
      alert('Session created successfully!');
    } catch (error) {
      alert('Error creating session: ' + (error as Error).message);
    }
  };

  const exportReport = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const report = billingService.getBillingReport(startOfMonth, endOfMonth);
    const csv = billingService.exportToCSV(report.sessions);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_report_${now.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="billing-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="text-2xl font-bold text-white mb-6">Healthcare Billing Dashboard</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowNewSession(true)}
            className="action-btn flex items-center gap-2"
          >
            <Plus size={20} />
            New Session
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
            <h3>Total Sessions</h3>
            <p className="metric-value">{metrics.totalSessions}</p>
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
            <h3>Total Revenue</h3>
            <p className="metric-value">${metrics.totalRevenue.toFixed(2)}</p>
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
            <h3>Approved Claims</h3>
            <p className="metric-value">{metrics.approvedClaims}</p>
            <span className="metric-label">This Month</span>
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
        <h3 className="text-xl font-semibold mb-4">Recent Sessions</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient ID</th>
                <th>Service</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.sessionId}>
                  <td>{new Date(session.date).toLocaleDateString()}</td>
                  <td>{session.patientId}</td>
                  <td>{session.cptCode}</td>
                  <td>{session.duration} min</td>
                  <td>${session.medicareAmount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${session.status}`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Session Modal */}
      {showNewSession && (
        <div className="modal" onClick={() => setShowNewSession(false)}>
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Billing Session</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewSession(false)}
              >
                ✖
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Patient</label>
                <select 
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.patientId} value={patient.patientId}>
                      {patient.firstName} {patient.lastName} - {patient.patientId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Service Type</label>
                <select 
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select Service</option>
                  {billingService.getCPTCodes().map(code => (
                    <option key={code.code} value={code.code}>
                      {code.code} - {code.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input 
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min="15"
                  step="15"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Session Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="form-control"
                  placeholder="Document session activities and patient progress..."
                />
              </div>

              <div className="modal-actions">
                <button 
                  onClick={createBillingSession}
                  className="action-btn"
                >
                  Create Session
                </button>
                <button 
                  onClick={() => setShowNewSession(false)}
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