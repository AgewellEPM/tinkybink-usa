/**
 * Game Integration Tracker
 * Centralizes tracking across all game services and educational activities
 * Provides unified interface for user history tracking and analytics
 */

import { userHistoryTrackingService } from './user-history-tracking-service';
import { memoryGamesService } from './memory-games-service';
import { readingSpellingGamesService } from './reading-spelling-games-service';
import { phonicsTileSystemService } from './phonics-tile-system';
import { gpt4FocusRecommendationsService } from './gpt4-focus-recommendations-service';
import { safeLocalStorage } from '@/utils/storage-helper';

export interface GameSession {
  session_id: string;
  game_type: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  game_specific_data: any;
  performance_metrics: {
    accuracy: number;
    response_time_avg: number;
    attempts_total: number;
    successes: number;
    difficulty_level: number;
  };
  learning_outcomes: string[];
  challenges_encountered: string[];
}

export interface GameInteractionEvent {
  event_id: string;
  session_id: string;
  user_id: string;
  game_type: string;
  timestamp: Date;
  event_type: 'start' | 'success' | 'failure' | 'hint_used' | 'level_complete' | 'breakthrough' | 'pause' | 'resume' | 'quit';
  event_data: {
    challenge_id?: string;
    response_time?: number;
    accuracy?: number;
    difficulty_level?: number;
    hint_type?: string;
    error_type?: string;
    success_streak?: number;
  };
  contextual_info: {
    current_level: number;
    total_attempts: number;
    session_duration: number;
    emotional_state?: 'engaged' | 'frustrated' | 'confident' | 'tired';
  };
}

export interface CrossGameAnalytics {
  user_id: string;
  analysis_period: { start: Date; end: Date };
  game_performance: Map<string, GamePerformanceStats>;
  skill_transfer_analysis: SkillTransferInsight[];
  engagement_patterns: EngagementPattern[];
  learning_velocity: LearningVelocityMetrics;
  breakthrough_correlations: BreakthroughCorrelation[];
  recommended_next_activities: ActivityRecommendation[];
}

export interface GamePerformanceStats {
  game_type: string;
  total_sessions: number;
  total_time_minutes: number;
  average_accuracy: number;
  improvement_rate: number;
  highest_level_reached: number;
  breakthrough_moments: number;
  engagement_score: number;
  consistency_rating: number;
}

export interface SkillTransferInsight {
  source_game: string;
  target_game: string;
  skill_area: string;
  transfer_strength: number; // 0-100
  evidence: string[];
  confidence_level: number;
}

export interface EngagementPattern {
  pattern_type: 'time_of_day' | 'session_length' | 'game_sequence' | 'difficulty_preference';
  pattern_data: any;
  engagement_impact: number;
  recommendations: string[];
}

export interface LearningVelocityMetrics {
  overall_velocity: number; // Skills per week
  by_skill_area: Map<string, number>;
  acceleration_trend: 'increasing' | 'stable' | 'decreasing';
  velocity_factors: string[];
}

export interface BreakthroughCorrelation {
  primary_game: string;
  breakthrough_skill: string;
  correlated_improvements: Array<{
    game: string;
    skill: string;
    improvement_percentage: number;
  }>;
  correlation_strength: number;
}

export interface ActivityRecommendation {
  recommended_game: string;
  recommended_activity: string;
  rationale: string;
  expected_benefit: string;
  optimal_timing: string;
  duration_suggestion: number; // minutes
}

export class GameIntegrationTracker {
  private static instance: GameIntegrationTracker;
  private activeSessions: Map<string, GameSession> = new Map();
  private gameEvents: Map<string, GameInteractionEvent[]> = new Map();
  private crossGameAnalytics: Map<string, CrossGameAnalytics> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): GameIntegrationTracker {
    if (!GameIntegrationTracker.instance) {
      GameIntegrationTracker.instance = new GameIntegrationTracker();
    }
    return GameIntegrationTracker.instance;
  }

  private initialize(): void {
    console.log('🎮 Game Integration Tracker initialized');
    this.setupGameHooks();
    this.loadTrackingData();
    this.startPeriodicAnalysis();
  }

  /**
   * Start tracking a game session
   */
  startGameSession(
    userId: string,
    gameType: string,
    gameSpecificData: any = {}
  ): string {
    const sessionId = `game_${gameType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: GameSession = {
      session_id: sessionId,
      game_type: gameType,
      user_id: userId,
      start_time: new Date(),
      game_specific_data: gameSpecificData,
      performance_metrics: {
        accuracy: 0,
        response_time_avg: 0,
        attempts_total: 0,
        successes: 0,
        difficulty_level: gameSpecificData.difficulty || 1
      },
      learning_outcomes: [],
      challenges_encountered: []
    };

    this.activeSessions.set(sessionId, session);

    // Track with user history service
    userHistoryTrackingService.trackInteraction({
      user_id: userId,
      interaction_type: 'game_start',
      context: {
        screen: gameType,
        activity: gameType,
        session_id: sessionId,
        game_type: gameType
      },
      performance_data: {
        difficulty_level: session.performance_metrics.difficulty_level
      },
      metadata: gameSpecificData
    });

    console.log(`🎮 Started game session: ${gameType} for user: ${userId}`);
    return sessionId;
  }

  /**
   * Track game interaction event
   */
  trackGameEvent(
    sessionId: string,
    eventType: GameInteractionEvent['event_type'],
    eventData: GameInteractionEvent['event_data'] = {},
    contextualInfo: Partial<GameInteractionEvent['contextual_info']> = {}
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`No active session found for ID: ${sessionId}`);
      return;
    }

    const event: GameInteractionEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: sessionId,
      user_id: session.user_id,
      game_type: session.game_type,
      timestamp: new Date(),
      event_type: eventType,
      event_data: eventData,
      contextual_info: {
        current_level: session.performance_metrics.difficulty_level,
        total_attempts: session.performance_metrics.attempts_total,
        session_duration: Math.floor((Date.now() - session.start_time.getTime()) / 60000),
        ...contextualInfo
      }
    };

    // Store event
    const userEvents = this.gameEvents.get(session.user_id) || [];
    userEvents.push(event);
    this.gameEvents.set(session.user_id, userEvents);

    // Update session metrics
    this.updateSessionMetrics(session, event);

    // Track with user history service
    userHistoryTrackingService.trackInteraction({
      user_id: session.user_id,
      interaction_type: eventType === 'success' ? 'tile_press' : 'error',
      context: {
        screen: session.game_type,
        activity: session.game_type,
        session_id: sessionId,
        game_type: session.game_type
      },
      performance_data: {
        response_time: eventData.response_time,
        accuracy: eventData.accuracy,
        attempts: session.performance_metrics.attempts_total,
        success: eventType === 'success',
        difficulty_level: session.performance_metrics.difficulty_level
      },
      metadata: eventData
    });

    // Check for breakthrough patterns
    this.checkForBreakthroughPatterns(session, event);

    this.saveTrackingData();
  }

  /**
   * End game session and analyze performance
   */
  async endGameSession(sessionId: string, sessionNotes?: string): Promise<GameSession | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    session.end_time = new Date();

    // Final performance analysis
    this.analyzeSessionPerformance(session);

    // Update skill progress
    this.updateSkillProgress(session);

    // Generate learning outcomes
    session.learning_outcomes = this.generateLearningOutcomes(session);

    // Track session completion
    userHistoryTrackingService.trackInteraction({
      user_id: session.user_id,
      interaction_type: 'game_complete',
      context: {
        screen: session.game_type,
        activity: session.game_type,
        session_id: sessionId,
        game_type: session.game_type
      },
      performance_data: {
        accuracy: session.performance_metrics.accuracy,
        attempts: session.performance_metrics.attempts_total,
        success: session.performance_metrics.accuracy > 70,
        difficulty_level: session.performance_metrics.difficulty_level
      },
      metadata: {
        duration_minutes: Math.floor((session.end_time.getTime() - session.start_time.getTime()) / 60000),
        learning_outcomes: session.learning_outcomes
      }
    });

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    // Trigger cross-game analysis
    await this.updateCrossGameAnalytics(session.user_id);

    this.saveTrackingData();
    console.log(`🎮 Completed game session analysis: ${sessionId}`);

    return session;
  }

  /**
   * Get cross-game analytics for user
   */
  getCrossGameAnalytics(userId: string, days: number = 30): CrossGameAnalytics | null {
    return this.crossGameAnalytics.get(userId) || null;
  }

  /**
   * Get user's game performance summary
   */
  getGamePerformanceSummary(userId: string): Map<string, GamePerformanceStats> {
    const userEvents = this.gameEvents.get(userId) || [];
    const performanceMap = new Map<string, GamePerformanceStats>();

    // Group events by game type
    const gameGroups = new Map<string, GameInteractionEvent[]>();
    userEvents.forEach(event => {
      const events = gameGroups.get(event.game_type) || [];
      events.push(event);
      gameGroups.set(event.game_type, events);
    });

    // Calculate performance stats for each game
    for (const [gameType, events] of gameGroups.entries()) {
      const stats = this.calculateGamePerformanceStats(gameType, events);
      performanceMap.set(gameType, stats);
    }

    return performanceMap;
  }

  /**
   * Get skill transfer insights
   */
  getSkillTransferInsights(userId: string): SkillTransferInsight[] {
    const analytics = this.crossGameAnalytics.get(userId);
    return analytics?.skill_transfer_analysis || [];
  }

  /**
   * Get personalized activity recommendations
   */
  async getPersonalizedRecommendations(userId: string): Promise<ActivityRecommendation[]> {
    const crossGameAnalytics = this.getCrossGameAnalytics(userId);
    if (!crossGameAnalytics) return [];

    // Get GPT-4 recommendations
    const gptRecommendations = await gpt4FocusRecommendationsService.generateFocusRecommendations(userId);

    // Convert to activity recommendations
    const activityRecommendations: ActivityRecommendation[] = [];

    for (const recommendation of gptRecommendations.slice(0, 3)) {
      const gameRecommendation = this.mapFocusAreaToGame(recommendation.focus_area);
      
      activityRecommendations.push({
        recommended_game: gameRecommendation.game,
        recommended_activity: gameRecommendation.activity,
        rationale: recommendation.rationale,
        expected_benefit: recommendation.expected_outcomes.join(', '),
        optimal_timing: this.determineOptimalTiming(userId, gameRecommendation.game),
        duration_suggestion: recommendation.timeframe.minutes_per_session
      });
    }

    return activityRecommendations;
  }

  // Private helper methods

  private setupGameHooks(): void {
    // Set up event listeners for different game services
    console.log('🔗 Setting up game integration hooks');
    
    // Note: In a production environment, these would be proper event listeners
    // For now, games need to manually call the tracking methods
  }

  private updateSessionMetrics(session: GameSession, event: GameInteractionEvent): void {
    session.performance_metrics.attempts_total += 1;

    if (event.event_type === 'success') {
      session.performance_metrics.successes += 1;
    }

    // Update accuracy
    session.performance_metrics.accuracy = 
      (session.performance_metrics.successes / session.performance_metrics.attempts_total) * 100;

    // Update average response time
    if (event.event_data.response_time) {
      const currentAvg = session.performance_metrics.response_time_avg;
      const totalAttempts = session.performance_metrics.attempts_total;
      session.performance_metrics.response_time_avg = 
        ((currentAvg * (totalAttempts - 1)) + event.event_data.response_time) / totalAttempts;
    }

    // Update difficulty level based on performance
    if (session.performance_metrics.attempts_total % 5 === 0) {
      session.performance_metrics.difficulty_level = this.adjustDifficultyLevel(session);
    }
  }

  private adjustDifficultyLevel(session: GameSession): number {
    const currentLevel = session.performance_metrics.difficulty_level;
    const accuracy = session.performance_metrics.accuracy;

    if (accuracy > 85 && currentLevel < 5) {
      return currentLevel + 1;
    } else if (accuracy < 50 && currentLevel > 1) {
      return currentLevel - 1;
    }

    return currentLevel;
  }

  private checkForBreakthroughPatterns(session: GameSession, event: GameInteractionEvent): void {
    // Check for success streaks
    if (event.event_data.success_streak && event.event_data.success_streak >= 5) {
      session.learning_outcomes.push(`Achieved ${event.event_data.success_streak}-streak success`);
    }

    // Check for rapid improvement
    if (event.event_data.response_time && event.event_data.response_time < 2000) {
      const avgResponseTime = session.performance_metrics.response_time_avg;
      if (avgResponseTime > 0 && event.event_data.response_time < avgResponseTime * 0.7) {
        session.learning_outcomes.push('Demonstrated significant speed improvement');
      }
    }

    // Check for level progression
    if (event.event_type === 'level_complete') {
      session.learning_outcomes.push(`Successfully completed level ${event.contextual_info.current_level}`);
    }
  }

  private analyzeSessionPerformance(session: GameSession): void {
    const duration = session.end_time ? 
      Math.floor((session.end_time.getTime() - session.start_time.getTime()) / 60000) : 0;

    // Analyze engagement based on session length and interactions
    if (duration > 20 && session.performance_metrics.attempts_total > 30) {
      session.learning_outcomes.push('High engagement and sustained attention');
    }

    // Analyze accuracy trends
    if (session.performance_metrics.accuracy > 80) {
      session.learning_outcomes.push('Excellent accuracy performance');
    } else if (session.performance_metrics.accuracy < 50) {
      session.challenges_encountered.push('Accuracy below target threshold');
    }

    // Analyze response time
    if (session.performance_metrics.response_time_avg < 3000) {
      session.learning_outcomes.push('Good processing speed demonstrated');
    }
  }

  private updateSkillProgress(session: GameSession): void {
    const skillMappings = this.getSkillMappingsForGame(session.game_type);
    
    for (const skill of skillMappings) {
      userHistoryTrackingService.updateSkillProgress(
        session.user_id,
        skill,
        {
          success: session.performance_metrics.accuracy > 70,
          accuracy: session.performance_metrics.accuracy,
          timeSpent: session.end_time ? 
            Math.floor((session.end_time.getTime() - session.start_time.getTime()) / 60000) : 0,
          difficultyLevel: session.performance_metrics.difficulty_level
        }
      );
    }
  }

  private getSkillMappingsForGame(gameType: string): string[] {
    const mappings: Record<string, string[]> = {
      'memory_games': ['working_memory', 'visual_processing', 'attention'],
      'reading_spelling': ['phonemic_awareness', 'reading_comprehension', 'spelling'],
      'phonics_tiles': ['letter_recognition', 'sound_blending', 'phonics'],
      'math_games': ['number_recognition', 'counting', 'arithmetic'],
      'communication': ['symbol_recognition', 'message_construction', 'social_communication']
    };

    return mappings[gameType] || ['general_learning'];
  }

  private generateLearningOutcomes(session: GameSession): string[] {
    const outcomes = [...session.learning_outcomes];

    // Add performance-based outcomes
    if (session.performance_metrics.accuracy > 90) {
      outcomes.push('Achieved mastery-level performance');
    } else if (session.performance_metrics.accuracy > 75) {
      outcomes.push('Demonstrated solid skill development');
    }

    // Add engagement outcomes
    const duration = session.end_time ? 
      Math.floor((session.end_time.getTime() - session.start_time.getTime()) / 60000) : 0;
    
    if (duration > 15) {
      outcomes.push('Maintained sustained engagement');
    }

    return outcomes.slice(0, 5); // Limit to 5 key outcomes
  }

  private async updateCrossGameAnalytics(userId: string): Promise<void> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const gamePerformance = this.getGamePerformanceSummary(userId);
    const skillTransferAnalysis = this.analyzeSkillTransfer(userId);
    const engagementPatterns = this.analyzeEngagementPatterns(userId);
    const learningVelocity = this.calculateLearningVelocity(userId);
    const breakthroughCorrelations = this.analyzeBreakthroughCorrelations(userId);
    const recommendedActivities = await this.getPersonalizedRecommendations(userId);

    const analytics: CrossGameAnalytics = {
      user_id: userId,
      analysis_period: { start: startDate, end: endDate },
      game_performance: gamePerformance,
      skill_transfer_analysis: skillTransferAnalysis,
      engagement_patterns: engagementPatterns,
      learning_velocity: learningVelocity,
      breakthrough_correlations: breakthroughCorrelations,
      recommended_next_activities: recommendedActivities
    };

    this.crossGameAnalytics.set(userId, analytics);
  }

  private calculateGamePerformanceStats(gameType: string, events: GameInteractionEvent[]): GamePerformanceStats {
    const sessions = new Set(events.map(e => e.session_id)).size;
    const successEvents = events.filter(e => e.event_type === 'success');
    const totalAttempts = events.filter(e => e.event_type === 'success' || e.event_type === 'failure').length;
    
    const accuracy = totalAttempts > 0 ? (successEvents.length / totalAttempts) * 100 : 0;
    const highestLevel = Math.max(...events.map(e => e.contextual_info.current_level));
    const breakthroughs = events.filter(e => e.event_type === 'breakthrough').length;

    // Calculate total time (simplified - would need session duration tracking)
    const totalTime = events.reduce((sum, e) => sum + e.contextual_info.session_duration, 0);

    return {
      game_type: gameType,
      total_sessions: sessions,
      total_time_minutes: totalTime,
      average_accuracy: accuracy,
      improvement_rate: this.calculateImprovementRate(events),
      highest_level_reached: highestLevel,
      breakthrough_moments: breakthroughs,
      engagement_score: this.calculateEngagementScore(events),
      consistency_rating: this.calculateConsistencyRating(events)
    };
  }

  private calculateImprovementRate(events: GameInteractionEvent[]): number {
    // Calculate improvement rate based on accuracy trend over time
    const recentEvents = events.slice(-20); // Last 20 events
    const olderEvents = events.slice(-40, -20); // Previous 20 events

    if (olderEvents.length === 0) return 0;

    const recentAccuracy = recentEvents.filter(e => e.event_type === 'success').length / recentEvents.length * 100;
    const olderAccuracy = olderEvents.filter(e => e.event_type === 'success').length / olderEvents.length * 100;

    return ((recentAccuracy - olderAccuracy) / olderAccuracy) * 100;
  }

  private calculateEngagementScore(events: GameInteractionEvent[]): number {
    // Factor in session length, interaction frequency, and completion rates
    const avgSessionDuration = events.reduce((sum, e) => sum + e.contextual_info.session_duration, 0) / events.length;
    const completionEvents = events.filter(e => e.event_type === 'level_complete').length;
    const quitEvents = events.filter(e => e.event_type === 'quit').length;
    
    let score = Math.min(avgSessionDuration * 2, 60); // Base score from session duration
    score += completionEvents * 5; // Bonus for completions
    score -= quitEvents * 10; // Penalty for quitting

    return Math.max(0, Math.min(100, score));
  }

  private calculateConsistencyRating(events: GameInteractionEvent[]): number {
    // Analyze consistency of play patterns over time
    const dailyEvents = new Map<string, number>();
    
    events.forEach(event => {
      const day = event.timestamp.toDateString();
      dailyEvents.set(day, (dailyEvents.get(day) || 0) + 1);
    });

    const days = Array.from(dailyEvents.values());
    if (days.length < 2) return 50; // Default for insufficient data

    // Calculate standard deviation
    const avg = days.reduce((sum, count) => sum + count, 0) / days.length;
    const variance = days.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / days.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    return Math.max(0, 100 - (stdDev * 10));
  }

  private analyzeSkillTransfer(userId: string): SkillTransferInsight[] {
    // Simplified skill transfer analysis
    const insights: SkillTransferInsight[] = [];
    const gamePerformance = this.getGamePerformanceSummary(userId);

    // Look for correlations between game improvements
    const games = Array.from(gamePerformance.keys());
    
    for (let i = 0; i < games.length; i++) {
      for (let j = i + 1; j < games.length; j++) {
        const game1 = games[i];
        const game2 = games[j];
        const stats1 = gamePerformance.get(game1)!;
        const stats2 = gamePerformance.get(game2)!;

        // Check for shared skills
        const sharedSkills = this.findSharedSkills(game1, game2);
        
        if (sharedSkills.length > 0 && stats1.improvement_rate > 0 && stats2.improvement_rate > 0) {
          insights.push({
            source_game: game1,
            target_game: game2,
            skill_area: sharedSkills[0],
            transfer_strength: Math.min(Math.abs(stats1.improvement_rate + stats2.improvement_rate), 100),
            evidence: [`Both games show positive improvement rates`, `Shared skill: ${sharedSkills[0]}`],
            confidence_level: 75
          });
        }
      }
    }

    return insights.slice(0, 3); // Limit to top 3 insights
  }

  private findSharedSkills(game1: string, game2: string): string[] {
    const skills1 = this.getSkillMappingsForGame(game1);
    const skills2 = this.getSkillMappingsForGame(game2);
    
    return skills1.filter(skill => skills2.includes(skill));
  }

  private analyzeEngagementPatterns(userId: string): EngagementPattern[] {
    const userEvents = this.gameEvents.get(userId) || [];
    const patterns: EngagementPattern[] = [];

    // Analyze time of day patterns
    const hourlyEngagement = new Map<number, number>();
    userEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      hourlyEngagement.set(hour, (hourlyEngagement.get(hour) || 0) + 1);
    });

    const bestHour = Array.from(hourlyEngagement.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (bestHour) {
      patterns.push({
        pattern_type: 'time_of_day',
        pattern_data: { optimal_hour: bestHour[0], engagement_count: bestHour[1] },
        engagement_impact: 15,
        recommendations: [`Schedule sessions around ${bestHour[0]}:00 for optimal engagement`]
      });
    }

    return patterns;
  }

  private calculateLearningVelocity(userId: string): LearningVelocityMetrics {
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 30);
    const skillVelocities = new Map<string, number>();

    // Calculate velocity for each skill area
    for (const [skill, progress] of userAnalytics.skill_progress.entries()) {
      const weeksOfPractice = Math.max(1, progress.total_time_minutes / (60 * 7)); // Approximate weeks
      const velocity = progress.mastery_percentage / weeksOfPractice;
      skillVelocities.set(skill, velocity);
    }

    const overallVelocity = Array.from(skillVelocities.values())
      .reduce((sum, vel) => sum + vel, 0) / skillVelocities.size;

    return {
      overall_velocity: overallVelocity,
      by_skill_area: skillVelocities,
      acceleration_trend: overallVelocity > 5 ? 'increasing' : overallVelocity > 2 ? 'stable' : 'decreasing',
      velocity_factors: ['Consistent practice', 'Appropriate difficulty level', 'High engagement']
    };
  }

  private analyzeBreakthroughCorrelations(userId: string): BreakthroughCorrelation[] {
    // Simplified breakthrough correlation analysis
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 30);
    const correlations: BreakthroughCorrelation[] = [];

    // Look for breakthroughs and their potential impacts
    for (const breakthrough of userAnalytics.recent_breakthroughs) {
      const relatedSkills = this.getSkillMappingsForGame(breakthrough.skill_area);
      const correlatedGames = this.findGamesWithSkills(relatedSkills);

      if (correlatedGames.length > 1) {
        correlations.push({
          primary_game: breakthrough.skill_area,
          breakthrough_skill: breakthrough.skill_area,
          correlated_improvements: correlatedGames.map(game => ({
            game,
            skill: relatedSkills[0],
            improvement_percentage: 15 // Estimated improvement
          })),
          correlation_strength: 0.8
        });
      }
    }

    return correlations;
  }

  private findGamesWithSkills(skills: string[]): string[] {
    const games: string[] = [];
    const allGameTypes = ['memory_games', 'reading_spelling', 'phonics_tiles', 'communication'];

    for (const gameType of allGameTypes) {
      const gameSkills = this.getSkillMappingsForGame(gameType);
      if (skills.some(skill => gameSkills.includes(skill))) {
        games.push(gameType);
      }
    }

    return games;
  }

  private mapFocusAreaToGame(focusArea: string): { game: string; activity: string } {
    const focusLower = focusArea.toLowerCase();

    if (focusLower.includes('memory') || focusLower.includes('attention')) {
      return { game: 'memory_games', activity: 'Visual Sequence Memory' };
    }
    if (focusLower.includes('reading') || focusLower.includes('spelling')) {
      return { game: 'reading_spelling', activity: 'Word Building Challenge' };
    }
    if (focusLower.includes('phonics') || focusLower.includes('letter')) {
      return { game: 'phonics_tiles', activity: 'Letter-Sound Matching' };
    }
    if (focusLower.includes('communication') || focusLower.includes('social')) {
      return { game: 'communication', activity: 'Message Construction Practice' };
    }

    return { game: 'memory_games', activity: 'General Practice' };
  }

  private determineOptimalTiming(userId: string, gameType: string): string {
    const userEvents = this.gameEvents.get(userId) || [];
    const gameEvents = userEvents.filter(e => e.game_type === gameType);

    if (gameEvents.length === 0) return 'Anytime';

    // Find most successful time periods
    const hourlySuccess = new Map<number, { total: number; success: number }>();
    
    gameEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      const stats = hourlySuccess.get(hour) || { total: 0, success: 0 };
      stats.total += 1;
      if (event.event_type === 'success') stats.success += 1;
      hourlySuccess.set(hour, stats);
    });

    const bestHour = Array.from(hourlySuccess.entries())
      .filter(([_, stats]) => stats.total >= 3) // Need sufficient data
      .sort((a, b) => (b[1].success / b[1].total) - (a[1].success / a[1].total))[0];

    if (bestHour) {
      return `Best around ${bestHour[0]}:00`;
    }

    return 'Anytime';
  }

  private startPeriodicAnalysis(): void {
    // Update cross-game analytics daily for active users
    setInterval(() => {
      this.runPeriodicAnalysis();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async runPeriodicAnalysis(): Promise<void> {
    console.log('🔄 Running periodic cross-game analysis');
    
    for (const userId of new Set([
      ...this.gameEvents.keys(),
      ...this.activeSessions.values()
    ].map(session => typeof session === 'string' ? session : session.user_id))) {
      try {
        await this.updateCrossGameAnalytics(userId);
      } catch (error) {
        console.warn(`Failed to update cross-game analytics for user ${userId}:`, error);
      }
    }
  }

  private loadTrackingData(): void {
    try {
      // Load game events
      const savedEvents = safeLocalStorage.getItem('gameTrackingEvents');
      if (savedEvents) {
        const data = JSON.parse(savedEvents);
        this.gameEvents = new Map(data.map(([userId, events]: [string, any[]]) => [
          userId,
          events.map(event => ({
            ...event,
            timestamp: new Date(event.timestamp)
          }))
        ]));
      }

      // Load cross-game analytics
      const savedAnalytics = safeLocalStorage.getItem('crossGameAnalytics');
      if (savedAnalytics) {
        const data = JSON.parse(savedAnalytics);
        this.crossGameAnalytics = new Map(data.map(([userId, analytics]: [string, any]) => [
          userId,
          {
            ...analytics,
            analysis_period: {
              start: new Date(analytics.analysis_period.start),
              end: new Date(analytics.analysis_period.end)
            },
            game_performance: new Map(Object.entries(analytics.game_performance))
          }
        ]));
      }

      console.log('🎮 Game tracking data loaded successfully');
    } catch (error) {
      console.warn('Could not load game tracking data:', error);
    }
  }

  private saveTrackingData(): void {
    try {
      // Save game events
      safeLocalStorage.setItem('gameTrackingEvents', JSON.stringify(
        Array.from(this.gameEvents.entries())
      ));

      // Save cross-game analytics
      const analyticsData = Array.from(this.crossGameAnalytics.entries()).map(([userId, analytics]) => [
        userId,
        {
          ...analytics,
          game_performance: Object.fromEntries(analytics.game_performance.entries())
        }
      ]);
      safeLocalStorage.setItem('crossGameAnalytics', JSON.stringify(analyticsData));
    } catch (error) {
      console.warn('Could not save game tracking data:', error);
    }
  }
}

// Export singleton instance
export const gameIntegrationTracker = GameIntegrationTracker.getInstance();