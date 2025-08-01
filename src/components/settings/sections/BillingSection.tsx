'use client';

import React, { useState } from 'react';
import { MedicareMedicaidDashboard } from '@/components/billing/MedicareMedicaidDashboard';

export function BillingSection() {
  const [showMedicareMedicaidDashboard, setShowMedicareMedicaidDashboard] = useState(false);

  return (
    <>
      <div className="settings-section">
        <h3>💰 Medicare/Medicaid Billing</h3>
        <div className="action-buttons">
          <button 
            className="action-btn" 
            onClick={() => setShowMedicareMedicaidDashboard(true)}
            style={{ background: 'linear-gradient(135deg, #00C851, #007E33)' }}
          >
            <span style={{ fontSize: '16px' }}>📊</span> Medicare/Medicaid Dashboard
          </button>
        </div>
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#888',
          textAlign: 'center'
        }}>
          Complete billing solution with patient management, CPT codes, analytics, session documentation, and claims management
        </div>
      </div>

      {/* Modular Medicare/Medicaid Dashboard */}
      <MedicareMedicaidDashboard 
        isOpen={showMedicareMedicaidDashboard} 
        onClose={() => setShowMedicareMedicaidDashboard(false)} 
      />
    </>
  );
}