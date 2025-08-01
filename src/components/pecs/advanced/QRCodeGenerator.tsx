import React, { useState } from 'react';
import { usePECSStore } from '@/hooks/use-pecs-store';

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ isOpen, onClose }) => {
  const { currentBoard } = usePECSStore();
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [qrSize, setQrSize] = useState('medium');
  const [qrAction, setQrAction] = useState('speak');
  const [customUrl, setCustomUrl] = useState('');
  const [includeText, setIncludeText] = useState(true);
  const [includeSpeech, setIncludeSpeech] = useState(true);

  if (!isOpen) return null;

  const handleTileToggle = (index: number) => {
    setSelectedTiles(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const generateQRCodes = () => {
    const selected = currentBoard.filter((_: any, index: number) => selectedTiles.includes(index));
    
    if (selected.length === 0) {
      alert('Please select at least one tile to generate QR codes!');
      return;
    }

    // Open print window with QR codes
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sizeMap = {
      small: { size: '1in', perRow: 6 },
      medium: { size: '1.5in', perRow: 4 },
      large: { size: '2in', perRow: 3 }
    };

    const config = sizeMap[qrSize as keyof typeof sizeMap];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code PECS Cards</title>
        <style>
          @page { size: letter; margin: 0.5in; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .qr-grid { 
            display: grid; 
            grid-template-columns: repeat(${config.perRow}, 1fr);
            gap: 20px;
          }
          .qr-card {
            border: 2px dashed #999;
            padding: 15px;
            text-align: center;
            page-break-inside: avoid;
          }
          .qr-code {
            width: ${config.size};
            height: ${config.size};
            margin: 0 auto 10px;
            border: 1px solid #333;
          }
          .qr-label { font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>QR Code PECS Cards</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="qr-grid">
          ${selected.map((tile: any) => {
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(tile.text)}`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ttsUrl)}`;
            return `
              <div class="qr-card">
                ${tile.emoji ? `<div style="font-size: 32px;">${tile.emoji}</div>` : ''}
                <img src="${qrApiUrl}" alt="QR Code" class="qr-code">
                ${includeText ? `<div class="qr-label">${tile.text}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }}>
        <div className="modal-header">
          <h2>📱 QR Code PECS Generator</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="setting-group">
            <label>Select Tiles for QR Codes:</label>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              border: '2px solid var(--primary-color)', 
              borderRadius: '8px', 
              padding: '10px' 
            }}>
              {currentBoard.length > 0 ? (
                currentBoard.map((tile: any, index: number) => (
                  <label 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px', 
                      borderBottom: '1px solid rgba(255,255,255,0.1)', 
                      cursor: 'pointer' 
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedTiles.includes(index)}
                      onChange={() => handleTileToggle(index)}
                      style={{ marginRight: '10px' }}
                    />
                    <span style={{ fontSize: '24px', marginRight: '10px' }}>
                      {tile.image ? '🖼️' : tile.emoji}
                    </span>
                    <span style={{ flex: 1 }}>{tile.text}</span>
                  </label>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#999' }}>
                  No tiles in current PECS board. Add tiles first!
                </p>
              )}
            </div>
          </div>
          
          <div className="setting-group">
            <label>QR Code Options:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '14px' }}>QR Size:</label>
                <select 
                  value={qrSize}
                  onChange={(e) => setQrSize(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: 'rgba(255,255,255,0.1)', 
                    color: 'white', 
                    border: '1px solid var(--primary-color)', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="small">Small (1 inch)</option>
                  <option value="medium">Medium (1.5 inch)</option>
                  <option value="large">Large (2 inch)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '14px' }}>Include:</label>
                <label style={{ display: 'block', marginTop: '5px' }}>
                  <input 
                    type="checkbox" 
                    checked={includeText}
                    onChange={(e) => setIncludeText(e.target.checked)}
                  /> Text Label
                </label>
                <label style={{ display: 'block', marginTop: '5px' }}>
                  <input 
                    type="checkbox" 
                    checked={includeSpeech}
                    onChange={(e) => setIncludeSpeech(e.target.checked)}
                  /> Speech Text
                </label>
              </div>
            </div>
          </div>
          
          <div className="setting-group">
            <label>QR Code Action:</label>
            <select 
              value={qrAction}
              onChange={(e) => setQrAction(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '1px solid var(--primary-color)', 
                borderRadius: '4px' 
              }}
            >
              <option value="speak">Speak Text (Audio)</option>
              <option value="link">Link to Digital Board</option>
              <option value="video">Play Video Tutorial</option>
              <option value="custom">Custom URL</option>
            </select>
          </div>
          
          {qrAction === 'custom' && (
            <div className="setting-group">
              <label>Custom URL:</label>
              <input 
                type="text" 
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/speech/{text}" 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: 'rgba(255,255,255,0.1)', 
                  color: 'white', 
                  border: '1px solid var(--primary-color)', 
                  borderRadius: '4px' 
                }}
              />
              <small style={{ color: '#999' }}>Use {'{text}'} for tile text, {'{emoji}'} for emoji</small>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={generateQRCodes}
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
              🎯 Generate QR Codes
            </button>
            <button 
              onClick={onClose}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: 'var(--danger-color)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                cursor: 'pointer' 
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};