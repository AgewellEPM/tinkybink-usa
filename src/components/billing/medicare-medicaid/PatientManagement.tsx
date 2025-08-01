import React, { useState, useEffect } from 'react';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  medicareId?: string;
  medicaidId?: string;
  insuranceType: 'medicare' | 'medicaid' | 'both';
  primaryDiagnosis: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  created: string;
}

interface PatientManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({ isOpen, onClose }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    name: '',
    dateOfBirth: '',
    insuranceType: 'medicare',
    primaryDiagnosis: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: ''
  });

  useEffect(() => {
    // Load patients from localStorage
    const savedPatients = localStorage.getItem('billingPatients');
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    }
  }, []);

  const savePatients = (updatedPatients: Patient[]) => {
    setPatients(updatedPatients);
    localStorage.setItem('billingPatients', JSON.stringify(updatedPatients));
  };

  const addPatient = () => {
    if (!newPatient.name || !newPatient.dateOfBirth) {
      alert('Please fill in required fields: Name and Date of Birth');
      return;
    }

    const patient: Patient = {
      id: `PAT${Date.now()}`,
      name: newPatient.name!,
      dateOfBirth: newPatient.dateOfBirth!,
      insuranceType: newPatient.insuranceType as 'medicare' | 'medicaid' | 'both',
      primaryDiagnosis: newPatient.primaryDiagnosis || 'F80.9',
      phone: newPatient.phone || '',
      email: newPatient.email || '',
      address: newPatient.address || '',
      emergencyContact: newPatient.emergencyContact || '',
      created: new Date().toISOString()
    };

    if (patient.insuranceType === 'medicare' || patient.insuranceType === 'both') {
      patient.medicareId = `MED${Date.now()}`;
    }
    if (patient.insuranceType === 'medicaid' || patient.insuranceType === 'both') {
      patient.medicaidId = `AID${Date.now()}`;
    }

    const updatedPatients = [...patients, patient];
    savePatients(updatedPatients);
    
    setNewPatient({
      name: '',
      dateOfBirth: '',
      insuranceType: 'medicare',
      primaryDiagnosis: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: ''
    });
    setShowAddForm(false);
    
    alert(`Patient ${patient.name} added successfully!`);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicareId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicaidId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }}>
        <div className="modal-header">
          <h2>🏥 Patient Management</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="patient-search">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients by name or ID..."
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '15px',
                border: '1px solid var(--primary-color)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '5px'
              }}
            />
            <div className="action-buttons">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #00C851, #007E33)' }}
              >
                👤 Add New Patient
              </button>
            </div>
          </div>

          {showAddForm && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid var(--primary-color)'
            }}>
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Add New Patient</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newPatient.name || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--primary-color)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="date"
                  placeholder="Date of Birth *"
                  value={newPatient.dateOfBirth || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--primary-color)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                />
                <select
                  value={newPatient.insuranceType || 'medicare'}
                  onChange={(e) => setNewPatient({ ...newPatient, insuranceType: e.target.value as any })}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--primary-color)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                >
                  <option value="medicare">Medicare</option>
                  <option value="medicaid">Medicaid</option>
                  <option value="both">Both Medicare & Medicaid</option>
                </select>
                <input
                  type="text"
                  placeholder="Primary Diagnosis (ICD-10)"
                  value={newPatient.primaryDiagnosis || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, primaryDiagnosis: e.target.value })}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--primary-color)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newPatient.phone || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--primary-color)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newPatient.email || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--primary-color)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Address"
                value={newPatient.address || ''}
                onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '10px 0',
                  border: '1px solid var(--primary-color)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  borderRadius: '4px'
                }}
              />
              <input
                type="text"
                placeholder="Emergency Contact"
                value={newPatient.emergencyContact || ''}
                onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '10px 0',
                  border: '1px solid var(--primary-color)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  borderRadius: '4px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={addPatient}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--success-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Add Patient
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--danger-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          <div className="patient-list" style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '5px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            {filteredPatients.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="patient-item"
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onClick={() => setSelectedPatient(selectedPatient?.id === patient.id ? null : patient)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(123, 63, 242, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-color)' }}>
                        {patient.name}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#ccc' }}>
                        {patient.insuranceType === 'medicare' && `Medicare: ${patient.medicareId}`}
                        {patient.insuranceType === 'medicaid' && `Medicaid: ${patient.medicaidId}`}
                        {patient.insuranceType === 'both' && `Medicare: ${patient.medicareId} | Medicaid: ${patient.medicaidId}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
                      <div>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</div>
                      <div>ID: {patient.id}</div>
                    </div>
                  </div>
                  
                  {selectedPatient?.id === patient.id && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                      border: '1px solid var(--primary-color)'
                    }}>
                      <h5 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>Patient Details</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                        <div><strong>Primary Diagnosis:</strong> {patient.primaryDiagnosis}</div>
                        <div><strong>Phone:</strong> {patient.phone || 'Not provided'}</div>
                        <div><strong>Email:</strong> {patient.email || 'Not provided'}</div>
                        <div><strong>Emergency Contact:</strong> {patient.emergencyContact || 'Not provided'}</div>
                      </div>
                      {patient.address && (
                        <div style={{ marginTop: '10px', fontSize: '14px' }}>
                          <strong>Address:</strong> {patient.address}
                        </div>
                      )}
                      <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                        <strong>Added:</strong> {new Date(patient.created).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#999' }}>
            Total Patients: {patients.length} | 
            Medicare: {patients.filter(p => p.insuranceType === 'medicare' || p.insuranceType === 'both').length} | 
            Medicaid: {patients.filter(p => p.insuranceType === 'medicaid' || p.insuranceType === 'both').length}
          </div>
        </div>
      </div>
    </div>
  );
};