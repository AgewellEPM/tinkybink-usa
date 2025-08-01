'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { 
  ChevronLeft, 
  Target, 
  Edit3, 
  Brain, 
  Users, 
  Home, 
  Activity, 
  Building2,
  Settings,
  ChevronDown
} from 'lucide-react';

export function Header() {
  const { isEditMode, toggleEditMode, setCurrentBoard, navigateBack, currentBoard, boardHistory, setCurrentView } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);

  const goHome = () => {
    setCurrentBoard(null);
    setCurrentView('tiles');
  };

  const goBack = () => {
    navigateBack();
  };

  const toggleSettings = () => {
    window.dispatchEvent(new Event('toggleSettings'));
  };

  const openElizaChat = () => {
    console.log('Eliza button clicked!');
    setCurrentView('eliza');
  };

  const toggleCollaboration = () => {
    setIsCollaborating(!isCollaborating);
    // Will integrate with collaboration module
  };

  const openActionBoards = () => {
    setCurrentBoard('actions');
  };

  const openProductionDashboard = () => {
    window.dispatchEvent(new Event('openProductionDashboard'));
  };

  const openHealthcareDashboard = () => {
    setCurrentView('healthcare');
  };

  return (
    <div className="header">
      <h1>TinkyBink - Free AAC</h1>
      
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={goHome}>
          Home
        </span>
        {currentBoard && (
          <>
            <span className="breadcrumb-separator"> › </span>
            <span className="breadcrumb-item active">
              {currentBoard.charAt(0).toUpperCase() + currentBoard.slice(1)}
            </span>
          </>
        )}
      </div>

      <div className="header-buttons">
        <button className="header-btn" onClick={goBack} title="Back (B)">
          ◀
        </button>
        
        <button className="header-btn" title="Toggle Action Boards (A)">
          🎯
        </button>
        
        <button 
          className={`header-btn ${isEditMode ? 'active' : ''}`}
          onClick={toggleEditMode} 
          title="Edit Mode (E)"
        >
          ✏️
        </button>
        
        <button 
          className="header-btn" 
          onClick={openElizaChat} 
          title="Eliza Chat"
          style={{ 
            background: 'linear-gradient(135deg, #7b3ff2, #ff006e)',
            position: 'relative',
            zIndex: 10
          }}
        >
          🧠
        </button>
        
        <button 
          className="header-btn" 
          onClick={toggleCollaboration} 
          title="Collaboration"
        >
          <span>👥</span>
          {isCollaborating && (
            <span 
              style={{
                display: 'block',
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                background: '#00ff00',
                borderRadius: '50%'
              }}
            />
          )}
        </button>

        <div className="user-menu">
          <button 
            className="user-menu-btn" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span className="user-icon">👤</span>
            <span className="user-name">User</span>
            <ChevronDown size={16} />
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown show">
              <div className="user-info">
                <strong>User Name</strong>
                <span className="user-role">Therapist</span>
              </div>
              <div className="dropdown-divider" />
              <button>My Profile</button>
              <button>My Clinic</button>
              <div className="dropdown-divider" />
              <button className="logout-btn">Logout</button>
            </div>
          )}
        </div>

        <button className="header-btn" onClick={goHome} title="Home (H)">
          🏠
        </button>
        
        <button className="header-btn" onClick={openActionBoards} title="Action Boards">
          🏃
        </button>
        
        <button 
          className="header-btn production-btn" 
          onClick={openProductionDashboard} 
          title="Production Management"
          style={{ background: 'linear-gradient(135deg, #7b3ff2, #ff006e)' }}
        >
          🏢
        </button>
        
        <button 
          className="header-btn healthcare-btn" 
          onClick={openHealthcareDashboard} 
          title="Healthcare & Billing"
          style={{ background: 'linear-gradient(135deg, #4CAF50, #2196F3)' }}
        >
          💊
        </button>
        
        <button className="header-btn settings-btn" onClick={toggleSettings} title="Settings (S)">
          ⚙️
        </button>
      </div>
    </div>
  );
}