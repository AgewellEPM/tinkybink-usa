/**
 * Game Tracking Service
 * Handles analytics, billing, and progress tracking for learning games
 */

interface GameActivity {
  gameName: string;
  round: number;
  selected: string;
  correct: string;
  isCorrect: boolean;
  score: number;
  totalRounds: number;
  category: string;
  cptCode: string;
  duration: number;
  timestamp: string;
  sessionId: string;
}

interface GameSession {
  sessionId: string;
  gameName: string;
  startTime: string;
  endTime?: string;
  totalScore: number;
  totalRounds: number;
  accuracy: number;
  activities: GameActivity[];
  cptCode: string;
  totalDuration: number;
}

interface CPTMapping {
  code: string;
  description: string;
  sessionType: string;
  reasoning: string;
}

export class GameTrackingService {
  private static instance: GameTrackingService;
  private sessions: Map<string, GameSession> = new Map();
  private currentSession: GameSession | null = null;

  private constructor() {
    this.loadStoredSessions();
  }

  static getInstance(): GameTrackingService {
    if (!GameTrackingService.instance) {
      GameTrackingService.instance = new GameTrackingService();
    }
    return GameTrackingService.instance;
  }

  initialize(): void {
    console.log('🎮 Game Tracking Service initialized');
  }

  /**
   * Start a new game session
   */
  startGameSession(gameName: string): string {
    const sessionId = this.generateSessionId();
    const session: GameSession = {
      sessionId,
      gameName,
      startTime: new Date().toISOString(),
      totalScore: 0,
      totalRounds: 0,
      accuracy: 0,
      activities: [],
      cptCode: this.autoAssignCPTCode(gameName, 0, '').code,
      totalDuration: 0
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;
    console.log(`🎮 Started game session: ${gameName} (${sessionId})`);
    
    return sessionId;
  }

  /**
   * Track a game activity
   */
  trackActivity(data: Omit<GameActivity, 'timestamp' | 'sessionId'>): void {
    if (!this.currentSession) {
      console.warn('No active game session');
      return;
    }

    const activity: GameActivity = {
      ...data,
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession.sessionId
    };

    this.currentSession.activities.push(activity);
    this.currentSession.totalScore = data.score;
    this.currentSession.totalRounds = data.round;
    this.currentSession.totalDuration += data.duration;
    this.currentSession.accuracy = (this.currentSession.totalScore / this.currentSession.totalRounds) * 100;

    // Track for analytics
    this.trackForAnalytics(activity);
    
    // Track for billing
    this.trackForBilling(activity);

    // Store to localStorage
    this.saveSession(this.currentSession);

    console.log(`📊 Tracked activity: ${data.gameName} - Round ${data.round} - ${data.isCorrect ? 'Correct' : 'Incorrect'}`);
  }

  /**
   * End the current game session
   */
  endGameSession(): GameSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = new Date().toISOString();
    const completedSession = { ...this.currentSession };
    
    // Final save
    this.saveSession(completedSession);
    
    console.log(`🏁 Game session completed: ${completedSession.gameName} - Score: ${completedSession.totalScore}/${completedSession.totalRounds}`);
    
    this.currentSession = null;
    return completedSession;
  }

  /**
   * Get current session
   */
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  /**
   * Get all sessions for a game
   */
  getGameSessions(gameName: string): GameSession[] {
    return Array.from(this.sessions.values()).filter(s => s.gameName === gameName);
  }

  /**
   * Get session analytics
   */
  getSessionAnalytics(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      gameName: session.gameName,
      totalScore: session.totalScore,
      totalRounds: session.totalRounds,
      accuracy: session.accuracy,
      duration: session.totalDuration,
      averageResponseTime: session.activities.reduce((sum, a) => sum + a.duration, 0) / session.activities.length,
      correctAnswers: session.activities.filter(a => a.isCorrect).length,
      incorrectAnswers: session.activities.filter(a => !a.isCorrect).length,
      categories: [...new Set(session.activities.map(a => a.category))],
      startTime: session.startTime,
      endTime: session.endTime
    };
  }

  /**
   * Auto-assign CPT codes based on game type and duration
   */
  private autoAssignCPTCode(gameName: string, duration: number, category: string): CPTMapping {
    const durationMinutes = Math.ceil(duration / 60);
    
    const gameToSpeechMapping: Record<string, { category: string; primarySkill: string }> = {
      'Which One Doesn\'t Belong': {
        category: 'cognitive_assessment',
        primarySkill: 'visual_discrimination'
      },
      'Match the Same': {
        category: 'cognitive_training', 
        primarySkill: 'pattern_recognition'
      },
      'Make a Sandwich': {
        category: 'functional_communication',
        primarySkill: 'sequential_processing'
      },
      'Pick the Color': {
        category: 'vocabulary_building',
        primarySkill: 'color_identification'
      },
      'Put Away Items': {
        category: 'categorization',
        primarySkill: 'semantic_organization'
      },
      'Yes or No Game': {
        category: 'critical_thinking',
        primarySkill: 'logical_reasoning'
      },
      'Sound Matching': {
        category: 'auditory_processing',
        primarySkill: 'sound_discrimination'
      },
      'What\'s Missing': {
        category: 'visual_processing',
        primarySkill: 'attention_to_detail'
      },
      'Daily Routine Builder': {
        category: 'functional_communication',
        primarySkill: 'daily_living_language'
      }
    };

    const gameInfo = gameToSpeechMapping[gameName];
    if (!gameInfo) {
      return {
        code: '97129',
        description: 'Therapeutic interventions (unspecified)',
        sessionType: 'brief_activity',
        reasoning: 'Unknown game type'
      };
    }

    // Complex decision tree for CPT assignment
    if (durationMinutes >= 30) {
      if (gameInfo.category === 'cognitive_assessment') {
        return {
          code: '96116',
          description: 'Neurobehavioral status exam',
          sessionType: 'comprehensive_assessment',
          reasoning: `${durationMinutes}-minute cognitive assessment focusing on ${gameInfo.primarySkill}`
        };
      } else if (gameInfo.category === 'auditory_processing' || gameInfo.category === 'speech_production') {
        return {
          code: '92507',
          description: 'Treatment of speech, language, voice disorders',
          sessionType: 'individual_therapy',
          reasoning: `${durationMinutes}-minute speech therapy targeting ${gameInfo.primarySkill}`
        };
      } else {
        return {
          code: '97127',
          description: 'Therapeutic interventions for cognitive function',
          sessionType: 'individual_therapy',
          reasoning: `${durationMinutes}-minute cognitive training for ${gameInfo.primarySkill}`
        };
      }
    } else if (durationMinutes >= 15) {
      return {
        code: '97129',
        description: 'Therapeutic interventions (group equivalent)',
        sessionType: 'structured_activity',
        reasoning: `${durationMinutes}-minute structured activity targeting ${gameInfo.primarySkill}`
      };
    } else {
      return {
        code: '97129',
        description: 'Therapeutic interventions (group equivalent)',
        sessionType: 'brief_activity',
        reasoning: `Brief ${durationMinutes}-minute activity targeting ${gameInfo.primarySkill}`
      };
    }
  }

  /**
   * Track for analytics dashboard
   */
  private trackForAnalytics(activity: GameActivity): void {
    // Get analytics service if available
    const analytics = (window as any).moduleSystem?.get('AnalyticsService');
    if (analytics) {
      analytics.track('learning_game_activity', {
        game: activity.gameName,
        timestamp: activity.timestamp,
        round: activity.round,
        selected: activity.selected,
        correct: activity.correct,
        isCorrect: activity.isCorrect,
        score: activity.score,
        category: activity.category,
        duration: activity.duration
      });
    }
  }

  /**
   * Track for medical billing
   */
  private trackForBilling(activity: GameActivity): void {
    const assignedCPT = this.autoAssignCPTCode(activity.gameName, activity.duration, activity.category);
    
    const billingData = {
      timestamp: activity.timestamp,
      activity: activity.gameName,
      cptCode: assignedCPT.code,
      cptDescription: assignedCPT.description,
      duration: activity.duration,
      sessionId: activity.sessionId,
      notes: `${assignedCPT.description}: ${activity.gameName}. ${activity.isCorrect ? 'Correct' : 'Incorrect'} response. Score: ${activity.score}. Session duration: ${activity.duration}s`,
      rate: this.getCPTRate(assignedCPT.code)
    };

    // Store billing data
    const billingRecords = JSON.parse(localStorage.getItem('billing_records') || '[]');
    billingRecords.push(billingData);
    localStorage.setItem('billing_records', JSON.stringify(billingRecords));

    console.log(`💰 Billing tracked: ${assignedCPT.code} - ${activity.gameName}`);
  }

  /**
   * Get CPT code rates
   */
  private getCPTRate(cptCode: string): number {
    const rates: Record<string, number> = {
      '92507': 75.00, // Speech therapy
      '92508': 70.00, // Speech therapy treatment
      '96116': 95.00, // Neurobehavioral status exam
      '97127': 65.00, // Therapeutic interventions (cognitive)
      '97129': 60.00  // Therapeutic interventions (group)
    };
    return rates[cptCode] || 65.00;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save session to localStorage
   */
  private saveSession(session: GameSession): void {
    const sessions = JSON.parse(localStorage.getItem('game_sessions') || '{}');
    sessions[session.sessionId] = session;
    localStorage.setItem('game_sessions', JSON.stringify(sessions));
  }

  /**
   * Load stored sessions from localStorage
   */
  private loadStoredSessions(): void {
    try {
      const sessions = JSON.parse(localStorage.getItem('game_sessions') || '{}');
      for (const [id, session] of Object.entries(sessions)) {
        this.sessions.set(id, session as GameSession);
      }
      console.log(`📂 Loaded ${this.sessions.size} stored game sessions`);
    } catch (error) {
      console.error('Error loading stored sessions:', error);
    }
  }

  /**
   * Get game statistics
   */
  getGameStats(gameName: string): any {
    const sessions = this.getGameSessions(gameName);
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalScore = sessions.reduce((sum, s) => sum + s.totalScore, 0);
    const totalRounds = sessions.reduce((sum, s) => sum + s.totalRounds, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.totalDuration, 0);

    return {
      gameName,
      totalSessions,
      averageScore: totalScore / totalSessions,
      averageAccuracy: sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions,
      totalPlayTime: totalDuration,
      bestScore: Math.max(...sessions.map(s => s.totalScore)),
      bestAccuracy: Math.max(...sessions.map(s => s.accuracy)),
      lastPlayed: sessions[sessions.length - 1]?.startTime,
      improvementTrend: this.calculateImprovementTrend(sessions)
    };
  }

  /**
   * Calculate improvement trend
   */
  private calculateImprovementTrend(sessions: GameSession[]): string {
    if (sessions.length < 2) return 'insufficient_data';
    
    const recent = sessions.slice(-3);
    const older = sessions.slice(-6, -3);
    
    if (older.length === 0) return 'insufficient_data';
    
    const recentAvg = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.accuracy, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }
}

// Export singleton getter function
export function getGameTrackingService(): GameTrackingService {
  return GameTrackingService.getInstance();
}