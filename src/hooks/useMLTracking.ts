/**
 * Hook for ML Data Collection
 * Tracks all user interactions for training
 */

import { useEffect, useCallback } from 'react';
import { mlDataCollection } from '@/services/ml-data-collection';
import { authService } from '@/services/auth-service';

export function useMLTracking() {
  // Track tile clicks
  const trackTileClick = useCallback((
    tileId: string,
    text: string,
    category: string,
    position: { row: number; col: number },
    responseTime: number
  ) => {
    const user = authService.getCurrentUser();
    if (!user) return;

    mlDataCollection.trackTileInteraction(
      tileId,
      text,
      category,
      position,
      responseTime,
      {
        currentBoard: window.location.pathname,
        timestamp: Date.now()
      }
    );
  }, []);

  // Track sentence building
  const trackSentence = useCallback((
    sentence: string,
    words: string[],
    method: 'tile' | 'keyboard' | 'voice' | 'prediction',
    timeToComplete: number,
    corrections: number = 0
  ) => {
    const user = authService.getCurrentUser();
    if (!user) return;

    mlDataCollection.trackSentenceBuilding(
      sentence,
      words,
      method,
      timeToComplete,
      corrections
    );
  }, []);

  // Track speech
  const trackSpeech = useCallback((
    text: string,
    voice: string,
    settings: { rate: number; pitch: number; volume: number },
    duration: number,
    interrupted: boolean = false
  ) => {
    const user = authService.getCurrentUser();
    if (!user) return;

    mlDataCollection.trackSpeech(
      text,
      voice,
      settings,
      duration,
      interrupted
    );
  }, []);

  // Track game performance
  const trackGame = useCallback((gameData: {
    gameType: string;
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    hints: number;
    timePerQuestion: number[];
    difficulty: string;
  }) => {
    const user = authService.getCurrentUser();
    if (!user) return;

    mlDataCollection.trackGamePerformance(gameData);
  }, []);

  // Track navigation
  const trackNavigation = useCallback((from: string, to: string, method: string = 'button') => {
    const user = authService.getCurrentUser();
    if (!user) return;

    mlDataCollection.trackNavigation(from, to, method);
  }, []);

  // Track errors
  const trackError = useCallback((error: Error, context: any) => {
    const user = authService.getCurrentUser();
    if (!user) return;

    mlDataCollection.trackError(error, context);
  }, []);

  // Set up global error tracking
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [trackError]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away - track engagement drop
        trackNavigation(window.location.pathname, 'hidden', 'visibility');
      } else {
        // User came back
        trackNavigation('hidden', window.location.pathname, 'visibility');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [trackNavigation]);

  return {
    trackTileClick,
    trackSentence,
    trackSpeech,
    trackGame,
    trackNavigation,
    trackError
  };
}

// Export for direct use in services
export const mlTracking = {
  trackTileClick: (tileId: string, text: string, category: string, position: { row: number; col: number }, responseTime: number) => {
    mlDataCollection.trackTileInteraction(tileId, text, category, position, responseTime);
  },
  trackSentence: (sentence: string, words: string[], method: 'tile' | 'keyboard' | 'voice' | 'prediction', timeToComplete: number, corrections: number = 0) => {
    mlDataCollection.trackSentenceBuilding(sentence, words, method, timeToComplete, corrections);
  },
  trackSpeech: (text: string, voice: string, settings: { rate: number; pitch: number; volume: number }, duration: number, interrupted: boolean = false) => {
    mlDataCollection.trackSpeech(text, voice, settings, duration, interrupted);
  },
  trackGame: (gameData: any) => {
    mlDataCollection.trackGamePerformance(gameData);
  },
  trackNavigation: (from: string, to: string, method: string = 'button') => {
    mlDataCollection.trackNavigation(from, to, method);
  },
  trackError: (error: Error, context: any) => {
    mlDataCollection.trackError(error, context);
  }
};