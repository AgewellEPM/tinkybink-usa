import React, { useState, useEffect } from 'react';

interface CPTCode {
  code: string;
  description: string;
  category: 'SLP' | 'OT' | 'Therapy' | 'AAC' | 'DME';
  medicareRate: number;
  medicaidRate: number;
  duration: number;
  modifiers: string[];
}

interface HCPCSCode {
  code: string;
  description: string;
  category: 'DME';
  medicareRate: number;
  medicaidRate: number;
  rental: boolean;
}

interface CPTCodeDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CPTCodeDisplay: React.FC<CPTCodeDisplayProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const cptCodes: CPTCode[] = [
    {
      code: '92507',
      description: 'Individual SLP Treatment',
      category: 'SLP',
      medicareRate: 85.50,
      medicaidRate: 78.25,
      duration: 15,
      modifiers: ['59', 'GP', 'GN']
    },
    {
      code: '92508',
      description: 'Group SLP Treatment',
      category: 'SLP',
      medicareRate: 42.75,
      medicaidRate: 39.10,
      duration: 15,
      modifiers: ['59', 'GP', 'GN']
    },
    {
      code: '92609',
      description: 'AAC Device Training',
      category: 'AAC',
      medicareRate: 95.75,
      medicaidRate: 87.65,
      duration: 15,
      modifiers: ['GP', 'GN']
    },
    {
      code: '97530',
      description: 'Therapeutic Activities',
      category: 'Therapy',
      medicareRate: 68.25,
      medicaidRate: 62.45,
      duration: 15,
      modifiers: ['GP', 'GN', 'GO']
    },
    {
      code: '97165',
      description: 'OT Evaluation, Low Complexity',
      category: 'OT',
      medicareRate: 92.33,
      medicaidRate: 84.50,
      duration: 30,
      modifiers: ['GP', 'GO']
    },
    {
      code: '97166',
      description: 'OT Evaluation, Moderate Complexity',
      category: 'OT',
      medicareRate: 137.84,
      medicaidRate: 126.15,
      duration: 45,
      modifiers: ['GP', 'GO']
    },
    {
      code: '97167',
      description: 'OT Evaluation, High Complexity',
      category: 'OT',
      medicareRate: 184.45,
      medicaidRate: 168.80,
      duration: 60,
      modifiers: ['GP', 'GO']
    }
  ];

  const hcpcsCodes: HCPCSCode[] = [
    {
      code: 'E2500',
      description: 'Speech generating device, digitized speech, using pre-recorded messages',
      category: 'DME',
      medicareRate: 1250.00,
      medicaidRate: 1150.00,
      rental: false
    },
    {
      code: 'E2502',
      description: 'Speech generating device, digitized speech, using synthesized speech',
      category: 'DME',
      medicareRate: 1450.00,
      medicaidRate: 1325.00,
      rental: false
    },
    {
      code: 'E2504',
      description: 'Speech generating device, digitized speech, multiple methods of message formulation',
      category: 'DME',
      medicareRate: 1850.00,
      medicaidRate: 1695.00,
      rental: false
    }
  ];

  const allCodes = [...cptCodes, ...hcpcsCodes];

  const filteredCodes = allCodes.filter(code => {
    const matchesCategory = selectedCategory === 'all' || code.category === selectedCategory;
    const matchesSearch = 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const exportCodes = () => {
    const exportData = {
      generated: new Date().toISOString(),
      cptCodes,
      hcpcsCodes,
      summary: {
        totalCPTCodes: cptCodes.length,
        totalHCPCSCodes: hcpcsCodes.length,
        categories: ['SLP', 'OT', 'Therapy', 'AAC', 'DME']
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cpt-hcpcs-codes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }}>
        <div className="modal-header">
          <h2>💳 CPT Codes & Rates</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search codes or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid var(--primary-color)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '5px'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid var(--primary-color)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '5px'
              }}
            >
              <option value="all">All Categories</option>
              <option value="SLP">Speech-Language Pathology</option>
              <option value="OT">Occupational Therapy</option>
              <option value="Therapy">Therapeutic Activities</option>
              <option value="AAC">AAC Device Training</option>
              <option value="DME">Durable Medical Equipment</option>
            </select>
            <button
              onClick={exportCodes}
              className="action-btn"
              style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
            >
              📄 Export Codes
            </button>
          </div>

          <div className="cpt-codes-display" style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '10px'
          }}>
            {filteredCodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                No codes found matching your criteria.
              </div>
            ) : (
              filteredCodes.map((code) => (
                <div
                  key={code.code}
                  className="cpt-item"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '15px',
                    margin: '10px 0',
                    borderRadius: '8px',
                    border: '1px solid var(--primary-color)',
                    borderLeft: '4px solid var(--primary-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div className="cpt-code" style={{
                        fontWeight: 'bold',
                        color: 'var(--primary-color)',
                        fontSize: '18px',
                        marginBottom: '5px'
                      }}>
                        {code.code}
                        <span style={{
                          marginLeft: '10px',
                          fontSize: '12px',
                          padding: '2px 8px',
                          background: 'rgba(123, 63, 242, 0.3)',
                          borderRadius: '12px',
                          color: 'white'
                        }}>
                          {code.category}
                        </span>
                      </div>
                      <div className="cpt-desc" style={{
                        color: '#ccc',
                        marginBottom: '8px',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {code.description}
                      </div>
                      <div className="cpt-rates" style={{
                        color: '#4CAF50',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        Medicare: ${code.medicareRate.toFixed(2)} | Medicaid: ${code.medicaidRate.toFixed(2)}
                      </div>
                      {'duration' in code && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                          Duration: {code.duration} minutes
                        </div>
                      )}
                      {'rental' in code && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                          {code.rental ? 'Rental Equipment' : 'Purchase Equipment'}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                      {'modifiers' in code && code.modifiers.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                            Modifiers:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
                            {code.modifiers.map((modifier) => (
                              <span
                                key={modifier}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '4px',
                                  color: '#ccc'
                                }}
                              >
                                {modifier}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button
                          onClick={() => {
                            const rateInfo = `${code.code}: Medicare $${code.medicareRate.toFixed(2)}, Medicaid $${code.medicaidRate.toFixed(2)}`;
                            navigator.clipboard.writeText(rateInfo);
                            alert('Rate information copied to clipboard!');
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          📋 Copy Rates
                        </button>
                        <button
                          onClick={() => {
                            const fullInfo = `${code.code} - ${code.description}\nMedicare: $${code.medicareRate.toFixed(2)}\nMedicaid: $${code.medicaidRate.toFixed(2)}`;
                            alert(fullInfo);
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          ℹ️ Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>Code Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#999' }}>Total CPT Codes</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {cptCodes.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#999' }}>Total HCPCS Codes</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {hcpcsCodes.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#999' }}>Filtered Results</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                  {filteredCodes.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#999' }}>Average Medicare Rate</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CAF50' }}>
                  ${(filteredCodes.reduce((sum, code) => sum + code.medicareRate, 0) / filteredCodes.length || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '15px',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center'
          }}>
            💡 Tip: Use modifiers GP (Physical Therapy), GN (Speech-Language Pathology), GO (Occupational Therapy) as required by Medicare/Medicaid
          </div>
        </div>
      </div>
    </div>
  );
};