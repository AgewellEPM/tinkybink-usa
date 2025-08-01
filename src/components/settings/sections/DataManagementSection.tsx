'use client';

import { useState } from 'react';
import { getImportExportService, getBoardManager, getBackupService } from '@/modules/module-system';
import { useAppStore } from '@/store/app-store';

export function DataManagementSection() {
  const [status, setStatus] = useState('');
  const { boards, createBoard } = useAppStore();

  // EXACT COPY FROM HTML VERSION
  const handleExportBoards = async () => {
    setStatus('Exporting data...');
    try {
      // Get data from localStorage (exact same as HTML version)
      const userData = JSON.parse(localStorage.getItem('tinkyBinkUserData') || '{}');
      const settingsData = JSON.parse(localStorage.getItem('tinkyBinkSettings') || '{}');
      
      // Create export data (exact same structure as HTML)
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        stats: userData.stats || {},
        history: userData.history || [],
        settings: settingsData
      };
      
      // Create download (exact same as HTML)
      const blob = new Blob([JSON.stringify(exportData, null, 2)], 
        {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tinkybink-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setStatus('Data exported successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Export failed. Please try again.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleImportBoards = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setStatus('Importing boards...');
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const importExportService = getImportExportService();
        const result = await importExportService.importData(data);
        
        if (result.success) {
          setStatus(`Imported ${result.imported.boards || 0} boards successfully!`);
          // Refresh the app to show imported boards
          window.location.reload();
        } else {
          setStatus('Import failed. Please check the file format.');
        }
      } catch (error) {
        setStatus('Import failed. Invalid file format.');
      }
    };
    
    input.click();
  };

  const handleCreateBoard = () => {
    const name = prompt('Enter board name:');
    if (!name) return;
    
    const description = prompt('Enter board description (optional):');
    
    createBoard({
      id: `board_${Date.now()}`,
      name,
      description: description || '',
      tiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'default',
      isShared: false,
      settings: {
        columns: 3,
        tileSize: 'medium',
        backgroundColor: '#1a1a1a'
      }
    });
    
    setStatus(`Created board: ${name}`);
  };

  // EXACT COPY FROM HTML VERSION - with improved error handling
  const handleResetSettings = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        // Clear all localStorage data
        localStorage.removeItem('tinkyBinkUserData');
        localStorage.removeItem('tinkyBinkSettings');
        localStorage.removeItem('tinkybink-storage');
        
        // Clear any other related storage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('tinkybink') || key.includes('tinkyBink')) {
            localStorage.removeItem(key);
          }
        });
        
        setStatus('All data cleared. Reloading...');
        
        // Add a small delay before reload to show the status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        setStatus('Reset failed. Please try again.');
        console.error('Reset error:', error);
      }
    }
  };

  const handleBackupNow = async () => {
    const backupService = getBackupService();
    setStatus('Creating backup...');
    
    try {
      const backupId = await backupService.createBackup(
        `Manual Backup ${new Date().toLocaleString()}`,
        'User-initiated backup from settings'
      );
      
      if (backupId) {
        setStatus('Backup created successfully!');
      } else {
        setStatus('Backup failed. Please try again.');
      }
    } catch (error) {
      setStatus('Backup error occurred.');
    }
  };

  return (
    <div className="settings-section">
      <h3>📁 Data Management</h3>
      
      <div className="action-buttons">
        <button className="action-btn secondary" onClick={handleExportBoards}>
          📥 Export Boards
        </button>
        <button className="action-btn secondary" onClick={handleImportBoards}>
          📤 Import Boards
        </button>
        <button className="action-btn secondary" onClick={handleCreateBoard}>
          ➕ Create New Board
        </button>
        <button className="action-btn secondary" onClick={handleBackupNow}>
          💾 Backup Now
        </button>
        <button 
          className="action-btn secondary" 
          onClick={handleResetSettings}
          style={{ background: 'rgba(231, 76, 60, 0.2)', borderColor: '#e74c3c' }}
        >
          🔄 Reset Settings
        </button>
      </div>
      
      {status && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
          {status}
        </div>
      )}
    </div>
  );
}