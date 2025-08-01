import React from 'react';

export const OverviewTab: React.FC = () => {
  const generateMonthlyReport = () => {
    console.log('Generating monthly report...');
    alert('Monthly report generation started. You will receive an email when complete.');
  };

  const exportPatientData = () => {
    console.log('Exporting patient data...');
    
    // Create sample export data
    const exportData = {
      generatedAt: new Date().toISOString(),
      totalPatients: 247,
      activePatients: 198,
      sessionsThisMonth: 1247,
      summary: 'Healthcare AAC platform data export'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `patient-data-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runSystemDiagnostics = () => {
    console.log('Running system diagnostics...');
    alert('System diagnostics started. This may take a few minutes...');
    
    // Simulate diagnostics
    setTimeout(() => {
      alert('System diagnostics complete. All systems operational.');
    }, 2000);
  };

  return (
    <div id="overview-tab" className="tab-content active">
      <h3>System Overview</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: 'rgba(46, 204, 113, 0.1)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h4>Active Patients</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>247</div>
          <div style={{ color: '#2ecc71' }}>↑ 12% this month</div>
        </div>
        <div style={{ 
          background: 'rgba(52, 152, 219, 0.1)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h4>Sessions Today</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>34</div>
          <div style={{ color: '#3498db' }}>8 upcoming</div>
        </div>
        <div style={{ 
          background: 'rgba(155, 89, 182, 0.1)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h4>Revenue MTD</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>$42,850</div>
          <div style={{ color: '#9b59b6' }}>↑ 18% vs last month</div>
        </div>
        <div style={{ 
          background: 'rgba(241, 196, 15, 0.1)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h4>Claims Status</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>94%</div>
          <div style={{ color: '#f1c40f' }}>Approval rate</div>
        </div>
      </div>
      
      <h3>Quick Actions</h3>
      <div className="action-buttons">
        <button className="action-btn" onClick={generateMonthlyReport}>
          📊 Generate Monthly Report
        </button>
        <button className="action-btn" onClick={exportPatientData}>
          📥 Export Patient Data
        </button>
        <button className="action-btn" onClick={runSystemDiagnostics}>
          🔧 System Diagnostics
        </button>
      </div>
    </div>
  );
};