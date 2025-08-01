import React, { useState, useEffect } from 'react';

interface Patient {
  id: string;
  name: string;
  insuranceType: 'medicare' | 'medicaid' | 'both';
}

interface SessionNote {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  cptCode: string;
  sessionType: string;
  goals: string[];
  interventions: string[];
  progress: string;
  homeProgram: string;
  nextSteps: string;
  providerName: string;
  providerCredentials: string;
  created: string;
}

interface SessionDocumentationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionDocumentation: React.FC<SessionDocumentationProps> = ({ isOpen, onClose }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [currentSession, setCurrentSession] = useState<Partial<SessionNote>>({
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().slice(0, 5),
    sessionType: 'individual',
    cptCode: '92507',
    goals: [''],
    interventions: [''],
    progress: '',
    homeProgram: '',
    nextSteps: '',
    providerName: '',
    providerCredentials: 'MS, CCC-SLP'
  });
  const [showSessionList, setShowSessionList] = useState(false);

  const cptCodeOptions = [
    { code: '92507', description: 'Individual SLP Treatment', duration: 60 },
    { code: '92508', description: 'Group SLP Treatment', duration: 60 },
    { code: '92609', description: 'AAC Device Training', duration: 60 },
    { code: '97530', description: 'Therapeutic Activities', duration: 60 },
    { code: '97165', description: 'OT Evaluation, Low Complexity', duration: 30 },
    { code: '97166', description: 'OT Evaluation, Moderate Complexity', duration: 45 },
    { code: '97167', description: 'OT Evaluation, High Complexity', duration: 60 }
  ];

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      loadSessions();
    }
  }, [isOpen]);

  const loadPatients = () => {
    const savedPatients = localStorage.getItem('billingPatients');
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    }
  };

  const loadSessions = () => {
    const savedSessions = localStorage.getItem('sessionNotes');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  };

  const saveSessions = (updatedSessions: SessionNote[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('sessionNotes', JSON.stringify(updatedSessions));
  };

  const addGoal = () => {
    setCurrentSession({
      ...currentSession,
      goals: [...(currentSession.goals || []), '']
    });
  };

  const updateGoal = (index: number, value: string) => {
    const updatedGoals = [...(currentSession.goals || [])];
    updatedGoals[index] = value;
    setCurrentSession({
      ...currentSession,
      goals: updatedGoals
    });
  };

  const removeGoal = (index: number) => {
    const updatedGoals = (currentSession.goals || []).filter((_, i) => i !== index);
    setCurrentSession({
      ...currentSession,
      goals: updatedGoals
    });
  };

  const addIntervention = () => {
    setCurrentSession({
      ...currentSession,
      interventions: [...(currentSession.interventions || []), '']
    });
  };

  const updateIntervention = (index: number, value: string) => {
    const updatedInterventions = [...(currentSession.interventions || [])];
    updatedInterventions[index] = value;
    setCurrentSession({
      ...currentSession,
      interventions: updatedInterventions
    });
  };

  const removeIntervention = (index: number) => {
    const updatedInterventions = (currentSession.interventions || []).filter((_, i) => i !== index);
    setCurrentSession({
      ...currentSession,
      interventions: updatedInterventions
    });
  };

  const calculateDuration = () => {
    if (currentSession.startTime && currentSession.endTime) {
      const start = new Date(`2000-01-01T${currentSession.startTime}`);
      const end = new Date(`2000-01-01T${currentSession.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      setCurrentSession({
        ...currentSession,
        duration: diffMins > 0 ? diffMins : 0
      });
    }
  };

  const saveSession = () => {
    if (!currentSession.patientId || !currentSession.date || !currentSession.startTime) {
      alert('Please fill in required fields: Patient, Date, and Start Time');
      return;
    }

    const selectedPatient = patients.find(p => p.id === currentSession.patientId);
    if (!selectedPatient) {
      alert('Selected patient not found');
      return;
    }

    const sessionNote: SessionNote = {
      id: `NOTE${Date.now()}`,
      patientId: currentSession.patientId!,
      patientName: selectedPatient.name,
      date: currentSession.date!,
      startTime: currentSession.startTime!,
      endTime: currentSession.endTime || currentSession.startTime!,
      duration: currentSession.duration || 60,
      cptCode: currentSession.cptCode || '92507',
      sessionType: currentSession.sessionType || 'individual',
      goals: (currentSession.goals || []).filter(g => g.trim() !== ''),
      interventions: (currentSession.interventions || []).filter(i => i.trim() !== ''),
      progress: currentSession.progress || '',
      homeProgram: currentSession.homeProgram || '',
      nextSteps: currentSession.nextSteps || '',
      providerName: currentSession.providerName || '',
      providerCredentials: currentSession.providerCredentials || 'MS, CCC-SLP',
      created: new Date().toISOString()
    };

    const updatedSessions = [...sessions, sessionNote];
    saveSessions(updatedSessions);

    // Reset form
    setCurrentSession({
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
      sessionType: 'individual',
      cptCode: '92507',
      goals: [''],
      interventions: [''],
      progress: '',
      homeProgram: '',
      nextSteps: '',
      providerName: currentSession.providerName,
      providerCredentials: currentSession.providerCredentials
    });

    alert('Session documented successfully!');
  };

  const exportSession = (session: SessionNote) => {
    const exportData = {
      ...session,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-note-${session.date}-${session.patientName.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>📝 Session Documentation</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setShowSessionList(false)}
              className={`action-btn ${!showSessionList ? 'primary' : 'secondary'}`}
              style={{ 
                background: !showSessionList 
                  ? 'linear-gradient(135deg, #00C851, #007E33)' 
                  : 'rgba(255,255,255,0.1)' 
              }}
            >
              📝 New Session
            </button>
            <button
              onClick={() => setShowSessionList(true)}
              className={`action-btn ${showSessionList ? 'primary' : 'secondary'}`}
              style={{ 
                background: showSessionList 
                  ? 'linear-gradient(135deg, #00b894, #00cec9)' 
                  : 'rgba(255,255,255,0.1)' 
              }}
            >
              📋 View Sessions ({sessions.length})
            </button>
          </div>

          {!showSessionList ? (
            <div>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>
                Document New Session
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Patient *
                  </label>
                  <select
                    value={currentSession.patientId || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, patientId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.insuranceType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={currentSession.date || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={currentSession.startTime || ''}
                    onChange={(e) => {
                      setCurrentSession({ ...currentSession, startTime: e.target.value });
                      setTimeout(calculateDuration, 100);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={currentSession.endTime || ''}
                    onChange={(e) => {
                      setCurrentSession({ ...currentSession, endTime: e.target.value });
                      setTimeout(calculateDuration, 100);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    CPT Code
                  </label>
                  <select
                    value={currentSession.cptCode || '92507'}
                    onChange={(e) => setCurrentSession({ ...currentSession, cptCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  >
                    {cptCodeOptions.map(option => (
                      <option key={option.code} value={option.code}>
                        {option.code} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={currentSession.duration || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, duration: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#ccc' }}>
                  Session Goals
                </label>
                {(currentSession.goals || ['']).map((goal, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      placeholder={`Goal ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid var(--primary-color)',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      onClick={() => removeGoal(index)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--danger-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addGoal}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Add Goal
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#ccc' }}>
                  Interventions/Techniques Used
                </label>
                {(currentSession.interventions || ['']).map((intervention, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={intervention}
                      onChange={(e) => updateIntervention(index, e.target.value)}
                      placeholder={`Intervention ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid var(--primary-color)',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      onClick={() => removeIntervention(index)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--danger-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addIntervention}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Add Intervention
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Progress Notes
                  </label>
                  <textarea
                    value={currentSession.progress || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, progress: e.target.value })}
                    placeholder="Document patient's progress, responses, challenges, etc."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Home Program/Recommendations
                  </label>
                  <textarea
                    value={currentSession.homeProgram || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, homeProgram: e.target.value })}
                    placeholder="Home exercises, practice activities, recommendations for family/caregivers"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Next Steps/Plan
                  </label>
                  <textarea
                    value={currentSession.nextSteps || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, nextSteps: e.target.value })}
                    placeholder="Plans for next session, adjustments to treatment plan, referrals needed"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Provider Name
                  </label>
                  <input
                    type="text"
                    value={currentSession.providerName || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, providerName: e.target.value })}
                    placeholder="Your full name"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>
                    Credentials
                  </label>
                  <input
                    type="text"
                    value={currentSession.providerCredentials || ''}
                    onChange={(e) => setCurrentSession({ ...currentSession, providerCredentials: e.target.value })}
                    placeholder="MS, CCC-SLP"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--primary-color)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={saveSession}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--success-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Session Note
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>
                Session History ({sessions.length} sessions)
              </h3>
              
              <div style={{
                maxHeight: '500px',
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                {sessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    No sessions documented yet.
                  </div>
                ) : (
                  sessions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((session) => (
                      <div
                        key={session.id}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-color)' }}>
                              {session.patientName}
                            </h4>
                            <div style={{ fontSize: '14px', color: '#ccc' }}>
                              {new Date(session.date).toLocaleDateString()} • {session.startTime} - {session.endTime} ({session.duration} min)
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                              CPT: {session.cptCode} • Provider: {session.providerName} {session.providerCredentials}
                            </div>
                          </div>
                          <button
                            onClick={() => exportSession(session)}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--primary-color)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            📄 Export
                          </button>
                        </div>
                        
                        {session.goals.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ fontSize: '12px', color: '#ccc' }}>Goals:</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '13px' }}>
                              {session.goals.map((goal, index) => (
                                <li key={index}>{goal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {session.progress && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ fontSize: '12px', color: '#ccc' }}>Progress:</strong>
                            <p style={{ margin: '5px 0', fontSize: '13px', lineHeight: '1.4' }}>
                              {session.progress}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};