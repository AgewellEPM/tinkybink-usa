import { useState, useEffect, useCallback } from 'react';
import { getGameTrackingService } from '@/services/game-tracking';

interface GameTrackingState {
  sessionId: string | null;
  currentScore: number;
  currentRound: number;
  totalRounds: number;
  accuracy: number;
  isSessionActive: boolean;
}

interface TrackActivityParams {
  gameName: string;
  round: number;
  selected: string;
  correct: string;
  isCorrect: boolean;
  score: number;
  totalRounds: number;
  category: string;
  duration: number;
}

export function useGameTracking(gameName: string) {
  const [state, setState] = useState<GameTrackingState>({
    sessionId: null,
    currentScore: 0,
    currentRound: 0,
    totalRounds: 0,
    accuracy: 0,
    isSessionActive: false
  });

  const trackingService = getGameTrackingService();

  /**
   * Start a new game session
   */
  const startSession = useCallback(() => {
    const sessionId = trackingService.startGameSession(gameName);
    setState(prev => ({
      ...prev,
      sessionId,
      currentScore: 0,
      currentRound: 0,
      totalRounds: 0,
      accuracy: 0,
      isSessionActive: true
    }));
    return sessionId;
  }, [gameName, trackingService]);

  /**
   * Track a game activity
   */
  const trackActivity = useCallback((params: Omit<TrackActivityParams, 'gameName'>) => {
    const activityData = {
      ...params,
      gameName,
      cptCode: '92507' // Default CPT code, will be auto-assigned by service
    };

    trackingService.trackActivity(activityData);
    
    // Update local state
    setState(prev => ({
      ...prev,
      currentScore: params.score,
      currentRound: params.round,
      totalRounds: params.totalRounds,
      accuracy: params.totalRounds > 0 ? (params.score / params.totalRounds) * 100 : 0
    }));
  }, [gameName, trackingService]);

  /**
   * End the current session
   */
  const endSession = useCallback(() => {
    const completedSession = trackingService.endGameSession();
    setState(prev => ({
      ...prev,
      isSessionActive: false
    }));
    return completedSession;
  }, [trackingService]);

  /**
   * Get current session data
   */
  const getCurrentSession = useCallback(() => {
    return trackingService.getCurrentSession();
  }, [trackingService]);

  /**
   * Get game statistics
   */
  const getGameStats = useCallback(() => {
    return trackingService.getGameStats(gameName);
  }, [gameName, trackingService]);

  /**
   * Get session analytics
   */
  const getSessionAnalytics = useCallback((sessionId: string) => {
    return trackingService.getSessionAnalytics(sessionId);
  }, [trackingService]);

  // Initialize tracking service
  useEffect(() => {
    trackingService.initialize();
  }, [trackingService]);

  return {
    // State
    sessionId: state.sessionId,
    currentScore: state.currentScore,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    accuracy: state.accuracy,
    isSessionActive: state.isSessionActive,
    
    // Actions
    startSession,
    trackActivity,
    endSession,
    getCurrentSession,
    getGameStats,
    getSessionAnalytics
  };
}