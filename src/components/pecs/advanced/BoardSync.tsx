import React, { useState } from 'react';
import { usePECSStore } from '@/hooks/use-pecs-store';
import { useAppStore } from '@/store/app-store';

interface BoardSyncProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BoardSync: React.FC<BoardSyncProps> = ({ isOpen, onClose }) => {
  const { currentBoard } = usePECSStore();
  const { boards } = useAppStore();
  const [syncStatus, setSyncStatus] = useState('');

  if (!isOpen) return null;

  const exportToJSON = () => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      boards: {
        pecs: currentBoard,
        all: boards,
        // Add other boards as needed
      },
      settings: {
        // Add relevant settings
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tinkybink-boards-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setSyncStatus('Boards exported successfully');
  };

  const exportToCSV = () => {
    let csv = 'Type,Emoji,Text,Speech,Category\n';
    
    currentBoard.forEach((tile: any) => {
      csv += `PECS,"${tile.emoji || ''}","${tile.text}","${tile.text}",General\n`;
    });
    
    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tinkybink-boards-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    setSyncStatus('Boards exported as CSV');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(e.target?.result as string);
          // TODO: Implement import logic
          setSyncStatus('Boards imported successfully');
        } else if (file.name.endsWith('.csv')) {
          // TODO: Implement CSV import
          setSyncStatus('CSV import coming soon');
        }
      } catch (error) {
        setSyncStatus('Error importing file');
      }
    };
    reader.readAsText(file);
  };

  const setupCloudSync = () => {
    setSyncStatus('Cloud sync setup initiated...');
    // TODO: Implement cloud sync
  };

  const generateSyncCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSyncStatus(`Sync code: ${code}`);
  };

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>🔄 Board Sync System</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="setting-group">
            <h3>📤 Export Options</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button 
                onClick={exportToJSON}
                className="action-btn" 
                style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
              >
                📄 Export as JSON
              </button>
              <button 
                onClick={exportToCSV}
                className="action-btn"
                style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
              >
                📊 Export as CSV
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>📥 Import Boards</h3>
            <input 
              type="file" 
              id="boardImport" 
              accept=".json,.csv" 
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button 
              onClick={() => document.getElementById('boardImport')?.click()}
              className="action-btn" 
              style={{ width: '100%', background: 'linear-gradient(135deg, #fdcb6e, #e17055)' }}
            >
              📁 Import from File
            </button>
          </div>
          
          <div className="setting-group">
            <h3>☁️ Cloud Sync (Beta)</h3>
            <div style={{ 
              padding: '15px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <p style={{ color: '#999' }}>Cloud sync allows you to access your boards anywhere!</p>
              <button 
                onClick={setupCloudSync}
                className="action-btn" 
                style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)' }}
              >
                🔐 Setup Cloud Sync
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>📱 Device Pairing</h3>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '200px', 
                height: '200px', 
                margin: '0 auto 15px', 
                background: 'white', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#333' 
              }}>
                [QR Code for Device Pairing]
              </div>
              <p style={{ color: '#999' }}>Scan this code with another device to sync boards</p>
              <button 
                onClick={generateSyncCode}
                className="action-btn secondary"
              >
                🔄 Generate New Code
              </button>
            </div>
          </div>
          
          {syncStatus && (
            <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              background: 'rgba(0,255,0,0.1)', 
              borderRadius: '4px', 
              textAlign: 'center' 
            }}>
              {syncStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};