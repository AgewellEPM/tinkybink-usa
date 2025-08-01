'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Shield,
  FileText,
  Activity,
  Target,
  Calendar
} from 'lucide-react';
import { PatientService, PatientData, Patient } from '@/modules/healthcare/patient-service';
import { HIPAAService } from '@/modules/healthcare/hipaa-service';

export function PatientManager() {
  const [hipaaService] = useState(() => new HIPAAService());
  const [patientService] = useState(() => new PatientService(hipaaService));
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  
  // Form fields
  const [formData, setFormData] = useState<PatientData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'other',
    guardianName: '',
    guardianRelation: '',
    phone: '',
    email: '',
    insuranceType: 'medicaid',
    insuranceId: '',
    primaryDiagnosis: '',
    communicationProfile: {
      primaryMethod: 'aac',
      aacDevice: 'TinkyBink',
      vocabularyLevel: 'basic',
      preferredSymbols: 'pcs',
      accessMethod: 'direct'
    }
  });

  useEffect(() => {
    loadPatients();
    checkCompliance();
  }, []);

  const loadPatients = () => {
    const allPatients = patientService.getAllPatients();
    setPatients(allPatients);
  };

  const checkCompliance = () => {
    const status = hipaaService.performComplianceCheck();
    setComplianceStatus(status);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = patientService.searchPatients(query);
      setPatients(results);
    } else {
      loadPatients();
    }
  };

  const createPatient = () => {
    try {
      const patientId = patientService.createPatient(formData);
      setShowNewPatient(false);
      resetForm();
      loadPatients();
      alert(`Patient created successfully! ID: ${patientId}`);
    } catch (error) {
      alert('Error creating patient: ' + (error as Error).message);
    }
  };

  const deletePatient = (patientId: string) => {
    if (confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
      try {
        patientService.deletePatient(patientId);
        loadPatients();
        setSelectedPatient(null);
      } catch (error) {
        alert('Error deleting patient: ' + (error as Error).message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'other',
      guardianName: '',
      guardianRelation: '',
      phone: '',
      email: '',
      insuranceType: 'medicaid',
      insuranceId: '',
      primaryDiagnosis: '',
      communicationProfile: {
        primaryMethod: 'aac',
        aacDevice: 'TinkyBink',
        vocabularyLevel: 'basic',
        preferredSymbols: 'pcs',
        accessMethod: 'direct'
      }
    });
  };

  const exportPatientData = (patientId: string) => {
    try {
      const data = patientService.exportPatientData(patientId);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient_${patientId}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting patient data: ' + (error as Error).message);
    }
  };

  return (
    <div className="patient-manager">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Patient Management</h2>
          <div className="compliance-badge">
            <Shield size={16} />
            <span>HIPAA Compliance: {complianceStatus?.percentage || 0}%</span>
          </div>
        </div>
        <button
          onClick={() => setShowNewPatient(true)}
          className="action-btn flex items-center gap-2"
        >
          <Plus size={20} />
          New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search patients by name or ID..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Patients Grid */}
      <div className="patients-grid">
        {patients.map((patient, index) => (
          <motion.div
            key={patient.patientId}
            className="patient-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedPatient(patient)}
          >
            <div className="patient-header">
              <div className="patient-avatar">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div className="patient-info">
                <h3>{patient.firstName} {patient.lastName}</h3>
                <p className="patient-id">{patient.patientId}</p>
              </div>
            </div>
            
            <div className="patient-details">
              <div className="detail-item">
                <span className="label">DOB:</span>
                <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Insurance:</span>
                <span className="insurance-badge">{patient.insuranceType}</span>
              </div>
              <div className="detail-item">
                <span className="label">Communication:</span>
                <span>{patient.communicationProfile?.primaryMethod || 'Not specified'}</span>
              </div>
            </div>

            <div className="patient-actions">
              <button className="icon-btn" onClick={(e) => {
                e.stopPropagation();
                exportPatientData(patient.patientId);
              }}>
                <FileText size={16} />
              </button>
              <button className="icon-btn danger" onClick={(e) => {
                e.stopPropagation();
                deletePatient(patient.patientId);
              }}>
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Patient Modal */}
      {showNewPatient && (
        <div className="modal" onClick={() => setShowNewPatient(false)}>
          <motion.div 
            className="modal-content large"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Patient Record</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewPatient(false)}
              >
                ✖
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input 
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input 
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input 
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                      className="form-control"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other/Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Guardian Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Guardian Name</label>
                    <input 
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({...formData, guardianName: e.target.value})}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Relation</label>
                    <input 
                      type="text"
                      value={formData.guardianRelation}
                      onChange={(e) => setFormData({...formData, guardianRelation: e.target.value})}
                      className="form-control"
                      placeholder="e.g., Parent, Guardian"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Insurance Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Insurance Type *</label>
                    <select 
                      value={formData.insuranceType}
                      onChange={(e) => setFormData({...formData, insuranceType: e.target.value as any})}
                      className="form-control"
                      required
                    >
                      <option value="medicare">Medicare</option>
                      <option value="medicaid">Medicaid</option>
                      <option value="private">Private Insurance</option>
                      <option value="self-pay">Self Pay</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Insurance ID</label>
                    <input 
                      type="text"
                      value={formData.insuranceId}
                      onChange={(e) => setFormData({...formData, insuranceId: e.target.value})}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Communication Profile</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Primary Communication Method</label>
                    <select 
                      value={formData.communicationProfile?.primaryMethod}
                      onChange={(e) => setFormData({
                        ...formData, 
                        communicationProfile: {
                          ...formData.communicationProfile!,
                          primaryMethod: e.target.value as any
                        }
                      })}
                      className="form-control"
                    >
                      <option value="verbal">Verbal</option>
                      <option value="aac">AAC Device</option>
                      <option value="sign">Sign Language</option>
                      <option value="mixed">Mixed Methods</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vocabulary Level</label>
                    <select 
                      value={formData.communicationProfile?.vocabularyLevel}
                      onChange={(e) => setFormData({
                        ...formData, 
                        communicationProfile: {
                          ...formData.communicationProfile!,
                          vocabularyLevel: e.target.value as any
                        }
                      })}
                      className="form-control"
                    >
                      <option value="emerging">Emerging</option>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  onClick={createPatient}
                  className="action-btn"
                >
                  Create Patient
                </button>
                <button 
                  onClick={() => {
                    setShowNewPatient(false);
                    resetForm();
                  }}
                  className="action-btn secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="modal" onClick={() => setSelectedPatient(null)}>
          <motion.div 
            className="modal-content large"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedPatient.firstName} {selectedPatient.lastName}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedPatient(null)}
              >
                ✖
              </button>
            </div>
            
            <div className="modal-body">
              <div className="patient-summary">
                <div className="summary-section">
                  <h3>Patient Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Patient ID:</span>
                      <span>{selectedPatient.patientId}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Date of Birth:</span>
                      <span>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Insurance:</span>
                      <span>{selectedPatient.insuranceType} - {selectedPatient.insuranceId}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Primary Diagnosis:</span>
                      <span>{selectedPatient.primaryDiagnosis || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-section">
                  <h3>Communication Profile</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Method:</span>
                      <span>{selectedPatient.communicationProfile?.primaryMethod}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Device:</span>
                      <span>{selectedPatient.communicationProfile?.aacDevice}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Level:</span>
                      <span>{selectedPatient.communicationProfile?.vocabularyLevel}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Access:</span>
                      <span>{selectedPatient.communicationProfile?.accessMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-section">
                  <h3>Recent Progress</h3>
                  <div className="progress-list">
                    {selectedPatient.progress.slice(-3).map((note, index) => (
                      <div key={note.id} className="progress-item">
                        <div className="progress-date">
                          {new Date(note.date).toLocaleDateString()}
                        </div>
                        <div className="progress-content">
                          <p>{note.notes}</p>
                          <div className="progress-metrics">
                            <span>Duration: {note.duration} min</span>
                            <span>Independence: {note.performance.independenceLevel}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  onClick={() => exportPatientData(selectedPatient.patientId)}
                  className="action-btn secondary"
                >
                  <FileText size={16} />
                  Export Data
                </button>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="action-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .patient-manager {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .compliance-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          border-radius: 20px;
          font-size: 14px;
          margin-top: 8px;
        }

        .search-container {
          position: relative;
          margin-bottom: 32px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 48px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-size: 16px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: #7b3ff2;
          background: rgba(255, 255, 255, 0.08);
        }

        .patients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .patient-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .patient-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .patient-header {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 16px;
        }

        .patient-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #7b3ff2, #ff006e);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
          color: white;
        }

        .patient-info h3 {
          margin: 0 0 4px 0;
          color: white;
          font-size: 18px;
        }

        .patient-id {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .patient-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .detail-item .label {
          color: #888;
        }

        .insurance-badge {
          padding: 2px 8px;
          background: rgba(33, 150, 243, 0.2);
          color: #2196F3;
          border-radius: 12px;
          font-size: 12px;
          text-transform: uppercase;
        }

        .patient-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .icon-btn.danger:hover {
          background: rgba(244, 67, 54, 0.2);
          color: #F44336;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-section h3 {
          margin: 0 0 16px 0;
          color: #7b3ff2;
          font-size: 18px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #ddd;
          font-weight: 500;
        }

        .form-control {
          width: 100%;
          padding: 10px;
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

        .modal-content.large {
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .patient-summary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .summary-section {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 12px;
        }

        .summary-section h3 {
          margin: 0 0 16px 0;
          color: #7b3ff2;
          font-size: 18px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item .label {
          color: #888;
          font-size: 14px;
        }

        .progress-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .progress-item {
          display: flex;
          gap: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .progress-date {
          color: #7b3ff2;
          font-weight: 500;
          min-width: 100px;
        }

        .progress-content {
          flex: 1;
        }

        .progress-content p {
          margin: 0 0 8px 0;
          color: #ddd;
        }

        .progress-metrics {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #888;
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