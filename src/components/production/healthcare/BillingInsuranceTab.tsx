import React, { useState, useEffect } from 'react';

export const BillingInsuranceTab: React.FC = () => {
  const [pendingClaims, setPendingClaims] = useState({ count: 0, amount: 0 });
  const [approvedClaims, setApprovedClaims] = useState({ count: 0, amount: 0 });
  const [deniedClaims, setDeniedClaims] = useState({ count: 0, amount: 0 });
  const [activeClearinghouse, setActiveClearinghouse] = useState('Office Ally');
  const [autoSubmit, setAutoSubmit] = useState('Yes - Daily at 6 PM');

  useEffect(() => {
    // Load claims data from localStorage or generate sample data
    const savedClaimsData = localStorage.getItem('medicareClaimsData');
    if (savedClaimsData) {
      const claimsData = JSON.parse(savedClaimsData);
      
      const pending = claimsData.filter((c: any) => c.status === 'pending');
      const approved = claimsData.filter((c: any) => c.status === 'approved');
      const denied = claimsData.filter((c: any) => c.status === 'denied');
      
      setPendingClaims({
        count: pending.length,
        amount: pending.reduce((sum: number, c: any) => sum + c.totalCharge, 0)
      });
      
      setApprovedClaims({
        count: approved.length,
        amount: approved.reduce((sum: number, c: any) => sum + (c.paidAmount || 0), 0)
      });
      
      setDeniedClaims({
        count: denied.length,
        amount: denied.reduce((sum: number, c: any) => sum + c.totalCharge, 0)
      });
    } else {
      // Sample data
      setPendingClaims({ count: 15, amount: 3247.00 });
      setApprovedClaims({ count: 142, amount: 42850.00 });
      setDeniedClaims({ count: 8, amount: 487.50 });
    }
  }, []);

  const viewAllClaims = () => {
    alert('Opening Claims Manager...');
    // In real implementation, this would open the claims manager modal
  };

  const managePayerContracts = () => {
    alert('Opening Payer Contract Management...');
    // In real implementation, this would open payer management interface
  };

  const testClearinghouseConnection = () => {
    alert('Testing clearinghouse connection...');
    
    // Simulate connection test
    setTimeout(() => {
      alert('✅ Connection successful! All systems operational.');
    }, 2000);
  };

  return (
    <div id="billing-tab" className="tab-content">
      <h3>Billing & Insurance Management</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h4>Claims Overview</h4>
          <div style={{ margin: '15px 0' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Pending Claims:</span>
              <strong>
                {pendingClaims.count} (${pendingClaims.amount.toFixed(2)})
              </strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Approved (MTD):</span>
              <strong>
                {approvedClaims.count} (${approvedClaims.amount.toFixed(2)})
              </strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Denied:</span>
              <strong style={{ color: '#e74c3c' }}>
                {deniedClaims.count} (${deniedClaims.amount.toFixed(2)})
              </strong>
            </div>
          </div>
          <button 
            className="action-btn" 
            onClick={viewAllClaims} 
            style={{ width: '100%' }}
          >
            View All Claims
          </button>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h4>Top Insurance Payers</h4>
          <div style={{ margin: '15px 0' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Blue Cross Blue Shield:</span>
              <strong>$45,230</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>United Healthcare:</span>
              <strong>$32,120</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Aetna:</span>
              <strong>$18,950</strong>
            </div>
          </div>
          <button 
            className="action-btn" 
            onClick={managePayerContracts} 
            style={{ width: '100%' }}
          >
            Manage Contracts
          </button>
        </div>
      </div>
      
      <h4>Clearinghouse Configuration</h4>
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '20px', 
        borderRadius: '8px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '15px' 
        }}>
          <div>
            <label>Active Clearinghouse:</label>
            <select 
              value={activeClearinghouse}
              onChange={(e) => setActiveClearinghouse(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#333', 
                border: '1px solid #555', 
                borderRadius: '4px', 
                color: 'white' 
              }}
            >
              <option>Office Ally</option>
              <option>Availity</option>
              <option>Change Healthcare</option>
            </select>
          </div>
          <div>
            <label>Auto-Submit Claims:</label>
            <select 
              value={autoSubmit}
              onChange={(e) => setAutoSubmit(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#333', 
                border: '1px solid #555', 
                borderRadius: '4px', 
                color: 'white' 
              }}
            >
              <option>Yes - Daily at 6 PM</option>
              <option>No - Manual Only</option>
            </select>
          </div>
        </div>
        <button 
          className="action-btn" 
          onClick={testClearinghouseConnection} 
          style={{ marginTop: '15px' }}
        >
          Test Connection
        </button>
      </div>
    </div>
  );
};