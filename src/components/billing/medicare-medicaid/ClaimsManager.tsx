import React, { useState, useEffect } from 'react';

interface Claim {
  id: string;
  patientId: string;
  patientName: string;
  dateOfService: string;
  cptCode: string;
  description: string;
  units: number;
  rate: number;
  totalCharge: number;
  insuranceType: 'medicare' | 'medicaid';
  status: 'draft' | 'submitted' | 'approved' | 'denied' | 'pending';
  submittedDate?: string;
  processedDate?: string;
  paidAmount?: number;
  denialReason?: string;
  claimNumber?: string;
  modifiers: string[];
  diagnosisCodes: string[];
  created: string;
}

interface ClaimsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimsManager: React.FC<ClaimsManagerProps> = ({ isOpen, onClose }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [insuranceFilter, setInsuranceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showCreateClaim, setShowCreateClaim] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClaims();
    }
  }, [isOpen]);

  useEffect(() => {
    filterClaims();
  }, [claims, statusFilter, insuranceFilter, dateRange, searchTerm]);

  const loadClaims = () => {
    const savedClaims = localStorage.getItem('medicareClaimsData');
    if (savedClaims) {
      setClaims(JSON.parse(savedClaims));
    } else {
      // Generate sample claims if none exist
      const sampleClaims = generateSampleClaims();
      setClaims(sampleClaims);
      localStorage.setItem('medicareClaimsData', JSON.stringify(sampleClaims));
    }
  };

  const generateSampleClaims = (): Claim[] => {
    const sampleClaims: Claim[] = [];
    const currentDate = new Date();
    
    const statuses: Claim['status'][] = ['submitted', 'approved', 'denied', 'pending', 'draft'];
    const cptCodes = [
      { code: '92507', desc: 'Individual SLP Treatment', medicareRate: 85.50, medicaidRate: 78.25 },
      { code: '92508', desc: 'Group SLP Treatment', medicareRate: 42.75, medicaidRate: 39.10 },
      { code: '92609', desc: 'AAC Device Training', medicareRate: 95.75, medicaidRate: 87.65 },
      { code: '97530', desc: 'Therapeutic Activities', medicareRate: 68.25, medicaidRate: 62.45 }
    ];

    for (let i = 0; i < 25; i++) {
      const serviceDate = new Date(currentDate);
      serviceDate.setDate(serviceDate.getDate() - Math.floor(Math.random() * 60));
      
      const cpt = cptCodes[Math.floor(Math.random() * cptCodes.length)];
      const insuranceType: 'medicare' | 'medicaid' = Math.random() > 0.5 ? 'medicare' : 'medicaid';
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const units = Math.floor(Math.random() * 4) + 1;
      const rate = insuranceType === 'medicare' ? cpt.medicareRate : cpt.medicaidRate;
      const totalCharge = rate * units;

      const claim: Claim = {
        id: `CLM${Date.now()}${i}`,
        patientId: `PAT${Math.floor(Math.random() * 100)}`,
        patientName: `Patient ${i + 1}`,
        dateOfService: serviceDate.toISOString().split('T')[0],
        cptCode: cpt.code,
        description: cpt.desc,
        units,
        rate,
        totalCharge,
        insuranceType,
        status,
        modifiers: ['GP', 'GN'],
        diagnosisCodes: ['F80.9'],
        created: new Date().toISOString()
      };

      if (status !== 'draft') {
        claim.submittedDate = new Date(serviceDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        claim.claimNumber = `CLM${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }

      if (status === 'approved') {
        claim.processedDate = new Date(serviceDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        claim.paidAmount = totalCharge * (0.8 + Math.random() * 0.2); // 80-100% payment
      } else if (status === 'denied') {
        claim.processedDate = new Date(serviceDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        claim.denialReason = ['Insufficient documentation', 'Service not covered', 'Duplicate claim', 'Missing modifier'][Math.floor(Math.random() * 4)];
      }

      sampleClaims.push(claim);
    }

    return sampleClaims;
  };

  const filterClaims = () => {
    let filtered = [...claims];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter);
    }

    // Insurance filter
    if (insuranceFilter !== 'all') {
      filtered = filtered.filter(claim => claim.insuranceType === insuranceFilter);
    }

    // Date range filter
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));
    filtered = filtered.filter(claim => new Date(claim.dateOfService) >= cutoffDate);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim =>
        claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.cptCode.includes(searchTerm) ||
        claim.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClaims(filtered);
  };

  const updateClaimStatus = (claimId: string, newStatus: Claim['status']) => {
    const updatedClaims = claims.map(claim => {
      if (claim.id === claimId) {
        const updated = { ...claim, status: newStatus };
        
        if (newStatus === 'submitted' && !claim.submittedDate) {
          updated.submittedDate = new Date().toISOString().split('T')[0];
          updated.claimNumber = `CLM${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
        
        if (newStatus === 'approved' || newStatus === 'denied') {
          updated.processedDate = new Date().toISOString().split('T')[0];
          if (newStatus === 'approved') {
            updated.paidAmount = claim.totalCharge * (0.8 + Math.random() * 0.2);
          }
        }
        
        return updated;
      }
      return claim;
    });

    setClaims(updatedClaims);
    localStorage.setItem('medicareClaimsData', JSON.stringify(updatedClaims));
  };

  const exportClaims = () => {
    const exportData = {
      generated: new Date().toISOString(),
      totalClaims: filteredClaims.length,
      summary: {
        pending: filteredClaims.filter(c => c.status === 'pending').length,
        approved: filteredClaims.filter(c => c.status === 'approved').length,
        denied: filteredClaims.filter(c => c.status === 'denied').length,
        totalValue: filteredClaims.reduce((sum, c) => sum + c.totalCharge, 0),
        totalPaid: filteredClaims.filter(c => c.paidAmount).reduce((sum, c) => sum + (c.paidAmount || 0), 0)
      },
      claims: filteredClaims
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `claims-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'denied': return '#f44336';
      case 'pending': return '#FFC107';
      case 'submitted': return '#2196F3';
      case 'draft': return '#9E9E9E';
      default: return '#999';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '1200px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>📄 Claims Manager</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px',
                border: '1px solid var(--primary-color)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '4px'
              }}
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--primary-color)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '4px'
              }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>

            <select
              value={insuranceFilter}
              onChange={(e) => setInsuranceFilter(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--primary-color)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '4px'
              }}
            >
              <option value="all">All Insurance</option>
              <option value="medicare">Medicare</option>
              <option value="medicaid">Medicaid</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--primary-color)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '4px'
              }}
            >
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>

            <button
              onClick={exportClaims}
              className="action-btn"
              style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
            >
              📤 Export
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
            marginBottom: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {filteredClaims.length}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>Total Claims</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                {filteredClaims.filter(c => c.status === 'approved').length}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>Approved</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFC107' }}>
                {filteredClaims.filter(c => c.status === 'pending').length}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                {filteredClaims.filter(c => c.status === 'denied').length}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>Denied</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                ${filteredClaims.reduce((sum, c) => sum + c.totalCharge, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>Total Value</div>
            </div>
          </div>

          <div style={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {filteredClaims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No claims found matching your criteria.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.1)' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Patient</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Service Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>CPT Code</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Insurance</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#999', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => (
                      <tr 
                        key={claim.id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedClaim(selectedClaim?.id === claim.id ? null : claim)}
                      >
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <div>{claim.patientName}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>ID: {claim.patientId}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          {new Date(claim.dateOfService).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--primary-color)' }}>
                          {claim.cptCode}
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {claim.units} unit{claim.units > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: claim.insuranceType === 'medicare' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                            color: claim.insuranceType === 'medicare' ? '#2196F3' : '#FF9800'
                          }}>
                            {claim.insuranceType.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#4CAF50' }}>
                          ${claim.totalCharge.toFixed(2)}
                          {claim.paidAmount && (
                            <div style={{ fontSize: '11px', color: '#999' }}>
                              Paid: ${claim.paidAmount.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: `${getStatusColor(claim.status)}20`,
                            color: getStatusColor(claim.status),
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                          }}>
                            {claim.status}
                          </span>
                          {claim.claimNumber && (
                            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                              {claim.claimNumber}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center' }}>
                          <select
                            value={claim.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateClaimStatus(claim.id, e.target.value as Claim['status']);
                            }}
                            style={{
                              padding: '2px 4px',
                              fontSize: '11px',
                              border: '1px solid rgba(255,255,255,0.3)',
                              background: 'rgba(255,255,255,0.1)',
                              color: 'white',
                              borderRadius: '3px'
                            }}
                          >
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {selectedClaim && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              border: '1px solid var(--primary-color)'
            }}>
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>
                Claim Details - {selectedClaim.claimNumber || selectedClaim.id}
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <strong>Patient:</strong> {selectedClaim.patientName}<br/>
                  <strong>Service Date:</strong> {new Date(selectedClaim.dateOfService).toLocaleDateString()}<br/>
                  <strong>CPT Code:</strong> {selectedClaim.cptCode}<br/>
                  <strong>Description:</strong> {selectedClaim.description}
                </div>
                
                <div>
                  <strong>Units:</strong> {selectedClaim.units}<br/>
                  <strong>Rate:</strong> ${selectedClaim.rate.toFixed(2)}<br/>
                  <strong>Total Charge:</strong> ${selectedClaim.totalCharge.toFixed(2)}<br/>
                  <strong>Insurance:</strong> {selectedClaim.insuranceType.toUpperCase()}
                </div>
                
                <div>
                  <strong>Status:</strong> <span style={{ color: getStatusColor(selectedClaim.status) }}>
                    {selectedClaim.status.toUpperCase()}
                  </span><br/>
                  {selectedClaim.submittedDate && (
                    <>
                      <strong>Submitted:</strong> {new Date(selectedClaim.submittedDate).toLocaleDateString()}<br/>
                    </>
                  )}
                  {selectedClaim.processedDate && (
                    <>
                      <strong>Processed:</strong> {new Date(selectedClaim.processedDate).toLocaleDateString()}<br/>
                    </>
                  )}
                  {selectedClaim.paidAmount && (
                    <>
                      <strong>Paid Amount:</strong> ${selectedClaim.paidAmount.toFixed(2)}<br/>
                    </>
                  )}
                </div>
              </div>
              
              {selectedClaim.modifiers.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Modifiers:</strong> {selectedClaim.modifiers.join(', ')}
                </div>
              )}
              
              {selectedClaim.diagnosisCodes.length > 0 && (
                <div style={{ marginTop: '5px' }}>
                  <strong>Diagnosis Codes:</strong> {selectedClaim.diagnosisCodes.join(', ')}
                </div>
              )}
              
              {selectedClaim.denialReason && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px' }}>
                  <strong style={{ color: '#f44336' }}>Denial Reason:</strong> {selectedClaim.denialReason}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};