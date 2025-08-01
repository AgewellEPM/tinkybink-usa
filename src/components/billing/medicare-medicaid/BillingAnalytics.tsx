import React, { useState, useEffect } from 'react';

interface BillingSession {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  cptCode: string;
  duration: number;
  insuranceType: 'medicare' | 'medicaid';
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'denied';
}

interface BillingMetrics {
  totalSessions: number;
  monthlyRevenue: number;
  medicareClaimsCount: number;
  medicaidClaimsCount: number;
  pendingClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  averageSessionValue: number;
}

interface BillingAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillingAnalytics: React.FC<BillingAnalyticsProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<BillingSession[]>([]);
  const [metrics, setMetrics] = useState<BillingMetrics>({
    totalSessions: 0,
    monthlyRevenue: 0,
    medicareClaimsCount: 0,
    medicaidClaimsCount: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    deniedClaims: 0,
    averageSessionValue: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBillingData();
    }
  }, [isOpen, selectedMonth]);

  const loadBillingData = () => {
    setLoading(true);
    
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem('billingSessions');
    let allSessions: BillingSession[] = [];
    
    if (savedSessions) {
      allSessions = JSON.parse(savedSessions);
    } else {
      // Generate sample data if none exists
      allSessions = generateSampleData();
      localStorage.setItem('billingSessions', JSON.stringify(allSessions));
    }

    // Filter sessions by selected month
    const monthSessions = allSessions.filter(session => 
      session.date.startsWith(selectedMonth)
    );

    setSessions(monthSessions);
    calculateMetrics(monthSessions);
    setLoading(false);
  };

  const generateSampleData = (): BillingSession[] => {
    const sampleSessions: BillingSession[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const sessionDate = new Date(currentDate);
      sessionDate.setDate(sessionDate.getDate() - i);
      
      const cptCodes = ['92507', '92508', '92609', '97530'];
      const cptCode = cptCodes[Math.floor(Math.random() * cptCodes.length)];
      const insuranceType: 'medicare' | 'medicaid' = Math.random() > 0.5 ? 'medicare' : 'medicaid';
      const statuses: ('pending' | 'submitted' | 'approved' | 'denied')[] = ['pending', 'submitted', 'approved', 'denied'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Calculate amount based on CPT code and insurance
      let amount = 0;
      switch (cptCode) {
        case '92507':
          amount = insuranceType === 'medicare' ? 85.50 : 78.25;
          break;
        case '92508':
          amount = insuranceType === 'medicare' ? 42.75 : 39.10;
          break;
        case '92609':
          amount = insuranceType === 'medicare' ? 95.75 : 87.65;
          break;
        case '97530':
          amount = insuranceType === 'medicare' ? 68.25 : 62.45;
          break;
      }

      sampleSessions.push({
        id: `SES${Date.now()}${i}`,
        patientId: `PAT${Math.floor(Math.random() * 100)}`,
        patientName: `Patient ${i + 1}`,
        date: sessionDate.toISOString().split('T')[0],
        cptCode,
        duration: 60,
        insuranceType,
        amount,
        status
      });
    }
    
    return sampleSessions;
  };

  const calculateMetrics = (sessionData: BillingSession[]) => {
    const totalSessions = sessionData.length;
    const monthlyRevenue = sessionData
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0);
    
    const medicareClaimsCount = sessionData.filter(s => s.insuranceType === 'medicare').length;
    const medicaidClaimsCount = sessionData.filter(s => s.insuranceType === 'medicaid').length;
    
    const pendingClaims = sessionData.filter(s => s.status === 'pending').length;
    const approvedClaims = sessionData.filter(s => s.status === 'approved').length;
    const deniedClaims = sessionData.filter(s => s.status === 'denied').length;
    
    const averageSessionValue = totalSessions > 0 
      ? sessionData.reduce((sum, s) => sum + s.amount, 0) / totalSessions 
      : 0;

    setMetrics({
      totalSessions,
      monthlyRevenue,
      medicareClaimsCount,
      medicaidClaimsCount,
      pendingClaims,
      approvedClaims,
      deniedClaims,
      averageSessionValue
    });
  };

  const generateBillingReport = () => {
    const report = {
      generated: new Date().toISOString(),
      period: selectedMonth,
      summary: metrics,
      sessions: sessions,
      breakdown: {
        byCPTCode: sessions.reduce((acc: any, session) => {
          acc[session.cptCode] = (acc[session.cptCode] || 0) + 1;
          return acc;
        }, {}),
        byInsuranceType: {
          medicare: sessions.filter(s => s.insuranceType === 'medicare').length,
          medicaid: sessions.filter(s => s.insuranceType === 'medicaid').length
        },
        byStatus: {
          pending: metrics.pendingClaims,
          approved: metrics.approvedClaims,
          denied: metrics.deniedClaims
        }
      }
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `billing-report-${selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportClaims = () => {
    // Create CSV format for claims
    const csvHeader = 'Date,Patient,CPT Code,Insurance,Amount,Status\n';
    const csvRows = sessions.map(session => 
      `${session.date},${session.patientName},${session.cptCode},${session.insuranceType},${session.amount.toFixed(2)},${session.status}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `claims-export-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }}>
        <div className="modal-header">
          <h2>📊 Billing Analytics</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <label style={{ marginRight: '10px', color: '#ccc' }}>Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid var(--primary-color)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={generateBillingReport}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
              >
                📄 Generate Report
              </button>
              <button
                onClick={exportClaims}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #fdcb6e, #e17055)' }}
              >
                💰 Export Claims
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              Loading billing analytics...
            </div>
          ) : (
            <>
              <div className="billing-metrics" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid var(--primary-color)'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    This Month Sessions
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: 'var(--primary-color)' 
                  }}>
                    {metrics.totalSessions}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #4CAF50'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Monthly Revenue
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#4CAF50' 
                  }}>
                    ${metrics.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #2196F3'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Medicare Claims
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#2196F3' 
                  }}>
                    {metrics.medicareClaimsCount}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #FF9800'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Medicaid Claims
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#FF9800' 
                  }}>
                    {metrics.medicaidClaimsCount}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #FFC107'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Pending Claims
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#FFC107' 
                  }}>
                    {metrics.pendingClaims}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #4CAF50'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Approved Claims
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#4CAF50' 
                  }}>
                    {metrics.approvedClaims}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #f44336'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Denied Claims
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#f44336' 
                  }}>
                    {metrics.deniedClaims}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid var(--primary-color)'
                }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    Avg Session Value
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: 'var(--primary-color)' 
                  }}>
                    ${metrics.averageSessionValue.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>
                  Recent Sessions ({selectedMonth})
                </h4>
                
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px'
                }}>
                  {sessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      No sessions found for the selected month.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Date</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Patient</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>CPT Code</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Insurance</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Amount</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.slice(0, 20).map((session) => (
                          <tr key={session.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '8px', fontSize: '13px' }}>
                              {new Date(session.date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '8px', fontSize: '13px' }}>
                              {session.patientName}
                            </td>
                            <td style={{ padding: '8px', fontSize: '13px', color: 'var(--primary-color)' }}>
                              {session.cptCode}
                            </td>
                            <td style={{ padding: '8px', fontSize: '13px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                background: session.insuranceType === 'medicare' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                                color: session.insuranceType === 'medicare' ? '#2196F3' : '#FF9800'
                              }}>
                                {session.insuranceType.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '8px', fontSize: '13px', textAlign: 'right', color: '#4CAF50' }}>
                              ${session.amount.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', fontSize: '13px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                background: 
                                  session.status === 'approved' ? 'rgba(76, 175, 80, 0.2)' :
                                  session.status === 'denied' ? 'rgba(244, 67, 54, 0.2)' :
                                  session.status === 'pending' ? 'rgba(255, 193, 7, 0.2)' :
                                  'rgba(156, 39, 176, 0.2)',
                                color: 
                                  session.status === 'approved' ? '#4CAF50' :
                                  session.status === 'denied' ? '#f44336' :
                                  session.status === 'pending' ? '#FFC107' :
                                  '#9C27B0'
                              }}>
                                {session.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};