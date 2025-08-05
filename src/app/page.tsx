'use client';

import { StarBackground } from '@/components/effects/StarBackground';
import { Header } from '@/components/layouts/Header';
import { SentenceBar } from '@/components/layouts/SentenceBar';
import { CategoryBoard } from '@/components/modules/CategoryBoard';
import { BoardView } from '@/components/modules/BoardView';
import { BottomNav } from '@/components/layouts/BottomNav';
import { SettingsPanel } from '@/components/layouts/SettingsPanel';
import { DevTools } from '@/components/DevTools';
import { ElizaChat } from '@/components/modules/ElizaChat';
import { HealthcareDashboard } from '@/components/healthcare/HealthcareDashboard';
import { BillingDashboard } from '@/components/healthcare/BillingDashboard';
import { GameModal } from '@/components/modals/GameModal';
import { RevolutionaryFeatures } from '@/components/RevolutionaryFeatures';
import { useAppStore } from '@/store/app-store';
import { useEffect } from 'react';

export default function HomePage() {
  const { currentBoard, currentView, currentGame, setCurrentView, setCurrentGame } = useAppStore();
  
  useEffect(() => {
    // Initialize all modules on page load
    const initializeModules = async () => {
      // This will be where we initialize all 64 modules
      console.log('Initializing TinkyBink with 64 modules...');
    };
    
    initializeModules();
  }, []);

  // When Eliza is open, show only Eliza with its own header
  if (currentView === 'eliza') {
    return (
      <>
        <StarBackground />
        <div className="min-h-screen relative">
          <ElizaChat onClose={() => setCurrentView('tiles')} />
        </div>
      </>
    );
  }

  // When Healthcare is open, show only Healthcare with its own header
  if (currentView === 'healthcare') {
    return (
      <>
        <StarBackground />
        <div className="min-h-screen relative">
          <HealthcareDashboard onClose={() => setCurrentView('tiles')} />
        </div>
      </>
    );
  }

  // When Billing is open, show only Billing with its own header
  if (currentView === 'billing') {
    return (
      <>
        <StarBackground />
        <div className="min-h-screen relative">
          <div className="header-alt">
            <button 
              onClick={() => setCurrentView('tiles')}
              className="back-btn"
            >
              ← Back to TinkyBink
            </button>
            <h1>Billing Dashboard</h1>
          </div>
          <BillingDashboard />
        </div>
      </>
    );
  }

  // Normal AAC interface
  return (
    <>
      {/* Star Background Animation */}
      <StarBackground />
      
      {/* Main App Container */}
      <div className="min-h-screen relative">
        {/* Header with all controls */}
        <Header />
        
        {/* Revolutionary AI Features Integration */}
        <RevolutionaryFeatures />
        
        {/* Sentence Bar */}
        <SentenceBar />
        
        {/* Main Content Area */}
        <main className="main-content">
          <div className="tiles-container">
            {!currentBoard ? (
              // Show category tiles on home
              <CategoryBoard />
            ) : (
              // Show specific board tiles
              <BoardView />
            )}
          </div>
        </main>
        
        {/* Bottom Navigation */}
        <BottomNav />
        
        {/* Settings Panel (slides from right) */}
        <SettingsPanel />
        
        {/* Game Modal */}
        <GameModal gameType={currentGame} onClose={() => setCurrentGame(null)} />
        
        {/* Dev Tools */}
        <DevTools />
        
        {/* Modals will be rendered here */}
        <div id="modals-root" />
      </div>
    </>
  );
}