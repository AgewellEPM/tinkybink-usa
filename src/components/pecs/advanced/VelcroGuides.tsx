import React from 'react';

interface VelcroGuidesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  rows: number;
  cols: number;
  size: string;
}

const TEMPLATES: Record<string, Template> = {
  communication: { rows: 6, cols: 8, size: '2in' },
  choice: { rows: 2, cols: 2, size: '3in' },
  schedule: { rows: 1, cols: 8, size: '2.5in' },
  portable: { rows: 3, cols: 4, size: '2in' }
};

export const VelcroGuides: React.FC<VelcroGuidesProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const generateVelcroTemplate = (type: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[type];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Velcro Template - ${type}</title>
        <style>
          @page { size: letter landscape; margin: 0.5in; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .template-grid {
            display: grid;
            grid-template-columns: repeat(${template.cols}, ${template.size});
            grid-template-rows: repeat(${template.rows}, ${template.size});
            gap: 5px;
            justify-content: center;
            margin: 0 auto;
          }
          .velcro-spot {
            border: 2px dashed #666;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 12px;
          }
          .instructions {
            margin-top: 30px;
            padding: 20px;
            background: #f0f0f0;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Board Template</h1>
          <p>Velcro Placement Guide - ${template.rows}×${template.cols} Grid</p>
        </div>
        
        <div class="template-grid">
          ${Array(template.rows * template.cols).fill(0).map(() => `
            <div class="velcro-spot">
              VELCRO<br>HERE
            </div>
          `).join('')}
        </div>
        
        <div class="instructions">
          <h3>Instructions:</h3>
          <ol>
            <li>Print this template on cardstock or heavy paper</li>
            <li>Laminate the entire sheet</li>
            <li>Cut ${template.size} × ${template.size} squares of loop (soft) velcro</li>
            <li>Place velcro squares in the center of each dashed box</li>
            <li>Press firmly and allow adhesive to set for 24 hours</li>
          </ol>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const printAllGuides = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complete PECS Assembly Guide</title>
        <style>
          @page { size: letter; margin: 0.5in; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          h1, h2, h3 { color: #333; }
          .page-break { page-break-after: always; }
          .tip-box {
            background: #f0f9ff;
            border-left: 4px solid #0284c7;
            padding: 15px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <h1>Complete PECS Assembly Guide</h1>
        
        <h2>Materials Needed</h2>
        <ul>
          <li>Cardstock or heavy paper (65lb minimum)</li>
          <li>Laminating pouches (5mil or thicker)</li>
          <li>Hook and loop velcro (3/4" or 1" squares)</li>
          <li>Corner rounder punch</li>
          <li>Paper cutter or scissors</li>
        </ul>
        
        <div class="page-break"></div>
        
        <h2>Assembly Instructions</h2>
        <ol>
          <li><strong>Print:</strong> Print PECS tiles on cardstock</li>
          <li><strong>Cut:</strong> Cut tiles leaving 1/4" border</li>
          <li><strong>Laminate:</strong> Use 5mil pouches for durability</li>
          <li><strong>Trim:</strong> Leave 1/8" sealed edge</li>
          <li><strong>Round corners:</strong> For safety</li>
          <li><strong>Apply velcro:</strong> Hook side on tiles, loop on board</li>
        </ol>
        
        <div class="tip-box">
          <h3>Pro Tips</h3>
          <ul>
            <li>Apply velcro while laminate is still warm for better adhesion</li>
            <li>Store unused tiles in a binder with velcro strips</li>
            <li>Make duplicates of frequently used tiles</li>
          </ul>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>✂️ Velcro Placement Guides</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="setting-group">
            <h3>📏 Board Templates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <button 
                onClick={() => generateVelcroTemplate('communication')}
                className="action-btn" 
                style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
              >
                💬 Communication Board (8x6)
              </button>
              <button 
                onClick={() => generateVelcroTemplate('choice')}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
              >
                🎯 Choice Board (2x2)
              </button>
              <button 
                onClick={() => generateVelcroTemplate('schedule')}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #fdcb6e, #e17055)' }}
              >
                📅 Daily Schedule Strip
              </button>
              <button 
                onClick={() => generateVelcroTemplate('portable')}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}
              >
                🎒 Portable Board (4x3)
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>🛠️ Lamination Tips</h3>
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              borderRadius: '8px' 
            }}>
              <ul style={{ lineHeight: '1.8', color: '#ccc' }}>
                <li>Use 5mil or thicker laminating pouches for durability</li>
                <li>Leave 1/4 inch border around tiles when cutting</li>
                <li>Round corners with corner punch for safety</li>
                <li>Use loop (soft) velcro on boards, hook (rough) on tiles</li>
                <li>Apply velcro while warm from laminator for better adhesion</li>
              </ul>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>📐 Velcro Placement Guide</h3>
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              borderRadius: '8px' 
            }}>
              <p style={{ color: '#ccc', marginBottom: '15px' }}>
                Optimal velcro placement for different tile sizes:
              </p>
              <table style={{ width: '100%', color: '#ccc' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Tile Size</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Velcro Size</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Placement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px' }}>2" × 2"</td>
                    <td style={{ padding: '8px' }}>1" × 1" square</td>
                    <td style={{ padding: '8px' }}>Centered</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px' }}>2.5" × 2.5"</td>
                    <td style={{ padding: '8px' }}>1.5" × 1.5" square</td>
                    <td style={{ padding: '8px' }}>Centered</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px' }}>3" × 3"</td>
                    <td style={{ padding: '8px' }}>2" × 2" square</td>
                    <td style={{ padding: '8px' }}>Centered</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>🎯 Board Organization Tips</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div style={{ 
                background: 'rgba(123, 63, 242, 0.1)', 
                padding: '15px', 
                borderRadius: '8px' 
              }}>
                <h4 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>Core Board</h4>
                <p style={{ color: '#ccc', fontSize: '14px' }}>
                  Place high-frequency words in consistent locations. Keep pronouns, verbs, and descriptors always available.
                </p>
              </div>
              <div style={{ 
                background: 'rgba(0, 200, 81, 0.1)', 
                padding: '15px', 
                borderRadius: '8px' 
              }}>
                <h4 style={{ color: 'var(--success-color)', marginBottom: '10px' }}>Activity Boards</h4>
                <p style={{ color: '#ccc', fontSize: '14px' }}>
                  Group related vocabulary together. Use color coding for different categories.
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={printAllGuides}
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
              🖨️ Print All Guides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};