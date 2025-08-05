/**
 * ML Data Collection Service
 * Collects comprehensive data from all user sessions for training our language model
 */

import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase-config';
import { getAnalyticsService } from '@/modules/core/analytics-service';

export interface UserProfile {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'therapist' | 'admin';
  displayName: string;
  createdAt: Date;
  lastActive: Date;
  settings: {
    language: string;
    voiceSettings: any;
    gridLayout: any;
    preferences: any;
  };
  metadata: {
    age?: number;
    grade?: string;
    diagnosis?: string[];
    therapyGoals?: string[];
    parentIds?: string[];
    teacherIds?: string[];
    clinicId?: string;
  };
}

export interface SessionData {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  deviceInfo: {
    platform: string;
    userAgent: string;
    screenSize: string;
    orientation: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    context?: string; // home, school, clinic, etc.
  };
}

export interface InteractionData {
  sessionId: string;
  userId: string;
  timestamp: Date;
  type: 'tile_click' | 'sentence_build' | 'speech' | 'game' | 'navigation' | 'settings' | 'error';
  
  // Core interaction data
  tileData?: {
    tileId: string;
    text: string;
    emoji?: string;
    category?: string;
    position: { row: number; col: number };
    responseTime: number; // milliseconds to click
  };
  
  // Sentence building data
  sentenceData?: {
    fullSentence: string;
    words: string[];
    method: 'tile' | 'keyboard' | 'voice' | 'prediction';
    corrections: number;
    timeToComplete: number;
    predictionsUsed?: string[];
    predictionsRejected?: string[];
  };
  
  // Speech synthesis data
  speechData?: {
    text: string;
    voice: string;
    rate: number;
    pitch: number;
    volume: number;
    duration: number;
    interrupted: boolean;
  };
  
  // Game performance data
  gameData?: {
    gameType: string;
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    hints: number;
    timePerQuestion: number[];
    difficulty: string;
  };
  
  // Navigation patterns
  navigationData?: {
    from: string;
    to: string;
    method: 'button' | 'keyboard' | 'gesture' | 'voice';
    backtrackCount: number;
  };
  
  // Error tracking
  errorData?: {
    errorType: string;
    errorMessage: string;
    context: any;
    recovery: string;
  };
  
  // Context data for ML
  contextData?: {
    previousTiles: string[];
    currentBoard: string;
    timeOfDay: string;
    sessionProgress: number; // 0-1
    emotionalState?: string;
    engagementLevel?: number; // 0-1
  };
}

export interface LearningProgress {
  userId: string;
  date: Date;
  metrics: {
    vocabularySize: number;
    newWordsLearned: string[];
    sentenceComplexity: number;
    communicationSpeed: number;
    accuracyRate: number;
    independenceLevel: number;
    categoriesUsed: Map<string, number>;
    commonPhrases: string[];
    errorPatterns: string[];
  };
  predictions: {
    nextLikelyWords: string[];
    suggestedActivities: string[];
    difficultyAdjustment: number;
  };
}

class MLDataCollectionService {
  private static instance: MLDataCollectionService;
  private currentSession: SessionData | null = null;
  private batchedInteractions: InteractionData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private analyticsService = getAnalyticsService();

  private constructor() {
    // Start batch processing
    this.startBatchProcessing();
  }

  static getInstance(): MLDataCollectionService {
    if (!MLDataCollectionService.instance) {
      MLDataCollectionService.instance = new MLDataCollectionService();
    }
    return MLDataCollectionService.instance;
  }

  // Initialize user profile with role
  async initializeUser(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.userId), {
        ...profile,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      }, { merge: true });

      console.log('User profile initialized for ML training:', profile.userId);
    } catch (error) {
      console.error('Failed to initialize user profile:', error);
    }
  }

  // Start a new session
  async startSession(userId: string): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      sessionId,
      userId,
      startTime: new Date(),
      deviceInfo: {
        platform: navigator.platform || 'unknown',
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        orientation: window.screen.orientation?.type || 'unknown'
      }
    };

    // Get location if permitted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (this.currentSession) {
            this.currentSession.location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
          }
        },
        (error) => console.log('Location access denied:', error)
      );
    }

    // Save session start
    await setDoc(doc(db, 'sessions', sessionId), {
      ...this.currentSession,
      startTime: serverTimestamp()
    });

    return sessionId;
  }

  // Track tile interaction
  async trackTileInteraction(
    tileId: string,
    text: string,
    category: string,
    position: { row: number; col: number },
    responseTime: number,
    context?: any
  ): Promise<void> {
    if (!this.currentSession) return;

    const interaction: InteractionData = {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      timestamp: new Date(),
      type: 'tile_click',
      tileData: {
        tileId,
        text,
        category,
        position,
        responseTime
      },
      contextData: {
        previousTiles: this.getPreviousTiles(),
        currentBoard: context?.currentBoard || 'unknown',
        timeOfDay: this.getTimeOfDay(),
        sessionProgress: this.calculateSessionProgress(),
        engagementLevel: this.calculateEngagement()
      }
    };

    this.addInteraction(interaction);
  }

  // Track sentence building
  async trackSentenceBuilding(
    sentence: string,
    words: string[],
    method: 'tile' | 'keyboard' | 'voice' | 'prediction',
    timeToComplete: number,
    corrections: number = 0
  ): Promise<void> {
    if (!this.currentSession) return;

    const interaction: InteractionData = {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      timestamp: new Date(),
      type: 'sentence_build',
      sentenceData: {
        fullSentence: sentence,
        words,
        method,
        corrections,
        timeToComplete
      },
      contextData: {
        previousTiles: this.getPreviousTiles(),
        currentBoard: 'sentence_bar',
        timeOfDay: this.getTimeOfDay(),
        sessionProgress: this.calculateSessionProgress()
      }
    };

    this.addInteraction(interaction);

    // Track sentence complexity for learning progress
    this.updateLearningMetrics(sentence, words);
  }

  // Track speech synthesis
  async trackSpeech(
    text: string,
    voice: string,
    settings: { rate: number; pitch: number; volume: number },
    duration: number,
    interrupted: boolean = false
  ): Promise<void> {
    if (!this.currentSession) return;

    const interaction: InteractionData = {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      timestamp: new Date(),
      type: 'speech',
      speechData: {
        text,
        voice,
        ...settings,
        duration,
        interrupted
      }
    };

    this.addInteraction(interaction);
  }

  // Track game performance
  async trackGamePerformance(gameData: InteractionData['gameData']): Promise<void> {
    if (!this.currentSession || !gameData) return;

    const interaction: InteractionData = {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      timestamp: new Date(),
      type: 'game',
      gameData
    };

    this.addInteraction(interaction);
  }

  // Track navigation patterns
  async trackNavigation(from: string, to: string, method: string): Promise<void> {
    if (!this.currentSession) return;

    const interaction: InteractionData = {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      timestamp: new Date(),
      type: 'navigation',
      navigationData: {
        from,
        to,
        method: method as any,
        backtrackCount: this.countBacktracks()
      }
    };

    this.addInteraction(interaction);
  }

  // Track errors for improving system
  async trackError(error: Error, context: any): Promise<void> {
    if (!this.currentSession) return;

    const interaction: InteractionData = {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      timestamp: new Date(),
      type: 'error',
      errorData: {
        errorType: error.name,
        errorMessage: error.message,
        context,
        recovery: 'attempted'
      }
    };

    this.addInteraction(interaction);
  }

  // End session and calculate final metrics
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    const endTime = new Date();
    const duration = endTime.getTime() - this.currentSession.startTime.getTime();

    // Flush any remaining batched interactions
    await this.flushBatch();

    // Update session with end time and duration
    await setDoc(doc(db, 'sessions', this.currentSession.sessionId), {
      endTime: serverTimestamp(),
      duration,
      totalInteractions: this.batchedInteractions.length
    }, { merge: true });

    // Calculate and save learning progress
    await this.calculateAndSaveLearningProgress();

    this.currentSession = null;
  }

  // Get comprehensive analytics for ML training
  async getMLTrainingData(userId?: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    // This would query Firestore for all relevant data
    // Used by ML training pipeline
    const data = {
      interactions: [],
      sessions: [],
      learningProgress: [],
      patterns: this.identifyPatterns()
    };

    return data;
  }

  // Private helper methods
  private addInteraction(interaction: InteractionData): void {
    this.batchedInteractions.push(interaction);
    
    // Batch writes every 10 interactions or 5 seconds
    if (this.batchedInteractions.length >= 10) {
      this.flushBatch();
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchedInteractions.length === 0) return;

    const batch = writeBatch(db);
    const interactions = [...this.batchedInteractions];
    this.batchedInteractions = [];

    try {
      for (const interaction of interactions) {
        const docRef = doc(collection(db, 'interactions'));
        batch.set(docRef, {
          ...interaction,
          timestamp: serverTimestamp()
        });
      }

      await batch.commit();
      console.log(`Flushed ${interactions.length} interactions to Firestore`);
    } catch (error) {
      console.error('Failed to flush interaction batch:', error);
      // Re-add failed interactions
      this.batchedInteractions.unshift(...interactions);
    }
  }

  private startBatchProcessing(): void {
    // Flush batch every 5 seconds
    this.batchTimer = setInterval(() => {
      this.flushBatch();
    }, 5000);
  }

  private getPreviousTiles(): string[] {
    // Get last 5 tile interactions
    return this.batchedInteractions
      .filter(i => i.type === 'tile_click')
      .slice(-5)
      .map(i => i.tileData?.text || '')
      .filter(Boolean);
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private calculateSessionProgress(): number {
    if (!this.currentSession) return 0;
    const elapsed = Date.now() - this.currentSession.startTime.getTime();
    const typicalSession = 30 * 60 * 1000; // 30 minutes
    return Math.min(elapsed / typicalSession, 1);
  }

  private calculateEngagement(): number {
    // Calculate based on interaction frequency
    const recentInteractions = this.batchedInteractions.filter(
      i => Date.now() - i.timestamp.getTime() < 60000 // Last minute
    );
    return Math.min(recentInteractions.length / 10, 1);
  }

  private countBacktracks(): number {
    const navInteractions = this.batchedInteractions
      .filter(i => i.type === 'navigation')
      .slice(-10);
    
    return navInteractions.filter(i => i.navigationData?.to === 'back').length;
  }

  private async updateLearningMetrics(sentence: string, words: string[]): Promise<void> {
    // This would update real-time learning metrics
    // Used for adaptive learning algorithms
  }

  private async calculateAndSaveLearningProgress(): Promise<void> {
    if (!this.currentSession) return;

    // Calculate comprehensive learning metrics
    const progress: LearningProgress = {
      userId: this.currentSession.userId,
      date: new Date(),
      metrics: {
        vocabularySize: this.calculateVocabularySize(),
        newWordsLearned: this.identifyNewWords(),
        sentenceComplexity: this.calculateComplexity(),
        communicationSpeed: this.calculateSpeed(),
        accuracyRate: this.calculateAccuracy(),
        independenceLevel: this.calculateIndependence(),
        categoriesUsed: this.getCategoryUsage(),
        commonPhrases: this.identifyCommonPhrases(),
        errorPatterns: this.identifyErrorPatterns()
      },
      predictions: {
        nextLikelyWords: this.predictNextWords(),
        suggestedActivities: this.suggestActivities(),
        difficultyAdjustment: this.calculateDifficultyAdjustment()
      }
    };

    await setDoc(doc(db, 'learningProgress', `${this.currentSession.userId}_${Date.now()}`), progress);
  }

  private identifyPatterns(): any {
    // ML pattern identification
    return {
      communicationPatterns: [],
      learningTrajectory: [],
      preferredModalities: []
    };
  }

  // Placeholder implementations for metrics
  private calculateVocabularySize(): number {
    return this.batchedInteractions
      .filter(i => i.type === 'tile_click')
      .map(i => i.tileData?.text)
      .filter((v, i, a) => a.indexOf(v) === i)
      .length;
  }

  private identifyNewWords(): string[] {
    return [];
  }

  private calculateComplexity(): number {
    return 0.5;
  }

  private calculateSpeed(): number {
    return 0.7;
  }

  private calculateAccuracy(): number {
    return 0.85;
  }

  private calculateIndependence(): number {
    return 0.6;
  }

  private getCategoryUsage(): Map<string, number> {
    return new Map();
  }

  private identifyCommonPhrases(): string[] {
    return [];
  }

  private identifyErrorPatterns(): string[] {
    return [];
  }

  private predictNextWords(): string[] {
    return [];
  }

  private suggestActivities(): string[] {
    return [];
  }

  private calculateDifficultyAdjustment(): number {
    return 0;
  }

  // Cleanup
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushBatch();
  }
}

// Export singleton instance
export const mlDataCollection = MLDataCollectionService.getInstance();

// Export types
export type { MLDataCollectionService };