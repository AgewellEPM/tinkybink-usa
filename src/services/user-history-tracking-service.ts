/**
 * User History Tracking Service
 * Comprehensive tracking of all user interactions, game sessions, and therapeutic progress
 * Integrates with therapy session logging and billing for complete user analytics
 */

import { therapySessionLogger } from './therapy-session-logger';
import { memoryGamesService } from './memory-games-service';
import { readingSpellingGamesService } from './reading-spelling-games-service';
import { phonicsTileSystemService } from './phonics-tile-system';
import { safeLocalStorage } from '@/utils/storage-helper';

export interface UserInteraction {
  interaction_id: string;
  user_id: string;
  timestamp: Date;
  interaction_type: 'tile_press' | 'game_start' | 'game_complete' | 'navigation' | 'voice_input' | 'gesture' | 'error' | 'breakthrough';
  context: {
    screen: string;
    activity: string;
    session_id?: string;
    tile_id?: string;
    game_type?: string;
  };
  performance_data: {
    response_time?: number;
    accuracy?: number;
    attempts?: number;
    success?: boolean;
    difficulty_level?: number;
  };
  metadata: Record<string, any>;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  duration_minutes?: number;
  session_type: 'free_play' | 'guided_therapy' | 'assessment' | 'training' | 'practice';
  activities: string[];
  interactions_count: number;
  therapeutic_goals?: string[];
  outcomes: {
    goals_met: number;
    total_goals: number;
    engagement_score: number;
    progress_indicators: string[];
    breakthroughs: string[];
    challenges: string[];
  };
  therapy_session_id?: string;
}

export interface LearningProgress {
  user_id: string;
  skill_area: string;
  current_level: number;
  mastery_percentage: number;
  sessions_practiced: number;
  total_time_minutes: number;
  streak_days: number;
  last_practice: Date;
  milestones_achieved: string[];
  focus_areas: string[];
  improvement_rate: number;
  predicted_mastery_date: Date;
}

export interface UserBehaviorPattern {
  user_id: string;
  pattern_type: 'optimal_session_length' | 'best_time_of_day' | 'preferred_activities' | 'attention_span' | 'difficulty_preference';
  pattern_data: {
    value: any;
    confidence_score: number;
    observations: number;
    last_updated: Date;
  };
  recommendations: string[];
}

export interface BreakthroughMoment {
  breakthrough_id: string;
  user_id: string;
  timestamp: Date;
  skill_area: string;
  breakthrough_type: 'first_success' | 'consistency_achieved' | 'level_up' | 'speed_improvement' | 'independence_gained';
  context: {
    activity: string;
    session_id: string;
    previous_attempts: number;
    current_performance: any;
  };
  significance_score: number;
  celebration_triggered: boolean;
}

export interface UserAnalytics {
  user_id: string;
  generated_at: Date;
  time_period: { start: Date; end: Date };
  summary: {
    total_sessions: number;
    total_interactions: number;
    total_time_minutes: number;
    average_session_length: number;
    engagement_trend: 'improving' | 'stable' | 'declining';
    consistency_score: number;
  };
  skill_progress: Map<string, LearningProgress>;
  behavior_patterns: Map<string, UserBehaviorPattern>;
  recent_breakthroughs: BreakthroughMoment[];
  focus_recommendations: string[];
  next_goals: string[];
}

export class UserHistoryTrackingService {
  private static instance: UserHistoryTrackingService;
  private interactions: Map<string, UserInteraction[]> = new Map();
  private sessions: Map<string, UserSession[]> = new Map();
  private learningProgress: Map<string, Map<string, LearningProgress>> = new Map();
  private behaviorPatterns: Map<string, Map<string, UserBehaviorPattern>> = new Map();
  private breakthroughs: Map<string, BreakthroughMoment[]> = new Map();
  private activeUserSessions: Map<string, UserSession> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): UserHistoryTrackingService {
    if (!UserHistoryTrackingService.instance) {
      UserHistoryTrackingService.instance = new UserHistoryTrackingService();
    }
    return UserHistoryTrackingService.instance;
  }

  private initialize(): void {
    console.log('🔍 User History Tracking Service initialized');
    this.loadHistoryData();
    this.startPeriodicAnalysis();
    this.setupGameIntegrations();
  }

  /**
   * Track a user interaction
   */
  trackInteraction(interaction: Omit<UserInteraction, 'interaction_id' | 'timestamp'>): void {
    const fullInteraction: UserInteraction = {
      ...interaction,
      interaction_id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const userInteractions = this.interactions.get(interaction.user_id) || [];
    userInteractions.push(fullInteraction);
    this.interactions.set(interaction.user_id, userInteractions);

    // Update active session
    const activeSession = this.activeUserSessions.get(interaction.user_id);
    if (activeSession) {
      activeSession.interactions_count += 1;
      if (!activeSession.activities.includes(interaction.context.activity)) {
        activeSession.activities.push(interaction.context.activity);
      }
    }

    // Analyze for patterns and breakthroughs
    this.analyzeInteractionForPatterns(fullInteraction);
    this.checkForBreakthroughs(fullInteraction);

    this.saveHistoryData();
  }

  /**
   * Start a new user session with therapy integration
   */
  startUserSession(
    userId: string, 
    sessionType: UserSession['session_type'],
    therapeuticGoals?: string[]
  ): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: UserSession = {
      session_id: sessionId,
      user_id: userId,
      start_time: new Date(),
      session_type: sessionType,
      activities: [],
      interactions_count: 0,
      therapeutic_goals: therapeuticGoals,
      outcomes: {
        goals_met: 0,
        total_goals: therapeuticGoals?.length || 0,
        engagement_score: 0,
        progress_indicators: [],
        breakthroughs: [],
        challenges: []
      }
    };

    // Start therapy session if applicable
    if (sessionType === 'guided_therapy' && therapeuticGoals) {
      const therapySessionId = therapySessionLogger.startToolSession(
        userId, 
        'User History Tracking', 
        therapeuticGoals
      );
      if (therapySessionId) {
        session.therapy_session_id = therapySessionId;
      }
    }

    this.activeUserSessions.set(userId, session);
    console.log(`📊 Started tracking session: ${sessionId} for user: ${userId}`);

    return sessionId;
  }

  /**
   * End user session and analyze results
   */
  async endUserSession(userId: string, sessionNotes?: string): Promise<UserSession | null> {
    const session = this.activeUserSessions.get(userId);
    if (!session) return null;

    session.end_time = new Date();
    session.duration_minutes = Math.floor(
      (session.end_time.getTime() - session.start_time.getTime()) / 60000
    );

    // Calculate engagement score based on interactions and duration
    session.outcomes.engagement_score = this.calculateEngagementScore(session);

    // Analyze session for progress indicators
    session.outcomes.progress_indicators = this.analyzeSessionProgress(session);

    // Store session
    const userSessions = this.sessions.get(userId) || [];
    userSessions.push(session);
    this.sessions.set(userId, userSessions);

    // End therapy session if applicable
    if (session.therapy_session_id) {
      const clinicalNotes = sessionNotes || this.generateSessionNotes(session);
      const observations = this.generateClinicalObservations(session);
      
      await therapySessionLogger.endToolSession(
        session.therapy_session_id, 
        clinicalNotes, 
        observations
      );
    }

    // Update learning progress
    this.updateLearningProgress(userId, session);

    // Remove from active sessions
    this.activeUserSessions.delete(userId);

    this.saveHistoryData();
    console.log(`📊 Completed session analysis: ${session.session_id}`);

    return session;
  }

  /**
   * Update learning progress for a skill area
   */
  updateSkillProgress(
    userId: string, 
    skillArea: string, 
    performance: {
      success: boolean;
      accuracy?: number;
      timeSpent: number;
      difficultyLevel?: number;
    }
  ): void {
    const userProgress = this.learningProgress.get(userId) || new Map();
    const currentProgress = userProgress.get(skillArea) || this.createInitialProgress(userId, skillArea);

    // Update statistics
    currentProgress.sessions_practiced += 1;
    currentProgress.total_time_minutes += performance.timeSpent;
    currentProgress.last_practice = new Date();

    // Update mastery percentage based on performance
    if (performance.success) {
      const improvementFactor = performance.accuracy ? performance.accuracy / 100 : 0.8;
      currentProgress.mastery_percentage = Math.min(100, 
        currentProgress.mastery_percentage + (improvementFactor * 2)
      );
    } else {
      currentProgress.mastery_percentage = Math.max(0, 
        currentProgress.mastery_percentage - 1
      );
    }

    // Check for level progression
    if (currentProgress.mastery_percentage >= (currentProgress.current_level + 1) * 20) {
      currentProgress.current_level += 1;
      this.recordBreakthrough(userId, skillArea, 'level_up', {
        activity: skillArea,
        session_id: this.activeUserSessions.get(userId)?.session_id || 'unknown',
        previous_attempts: currentProgress.sessions_practiced,
        current_performance: performance
      });
    }

    // Update improvement rate
    currentProgress.improvement_rate = this.calculateImprovementRate(userId, skillArea);

    userProgress.set(skillArea, currentProgress);
    this.learningProgress.set(userId, userProgress);
  }

  /**
   * Record a breakthrough moment
   */
  recordBreakthrough(
    userId: string, 
    skillArea: string, 
    type: BreakthroughMoment['breakthrough_type'],
    context: BreakthroughMoment['context']
  ): void {
    const breakthrough: BreakthroughMoment = {
      breakthrough_id: `breakthrough_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      timestamp: new Date(),
      skill_area: skillArea,
      breakthrough_type: type,
      context,
      significance_score: this.calculateSignificanceScore(type, context),
      celebration_triggered: false
    };

    const userBreakthroughs = this.breakthroughs.get(userId) || [];
    userBreakthroughs.push(breakthrough);
    this.breakthroughs.set(userId, userBreakthroughs);

    // Add to active session outcomes
    const activeSession = this.activeUserSessions.get(userId);
    if (activeSession) {
      activeSession.outcomes.breakthroughs.push(`${type}: ${skillArea}`);
    }

    console.log(`🎉 Breakthrough recorded: ${type} in ${skillArea} for user ${userId}`);
  }

  /**
   * Generate comprehensive user analytics
   */
  generateUserAnalytics(userId: string, days: number = 30): UserAnalytics {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userInteractions = this.interactions.get(userId) || [];
    const userSessions = this.sessions.get(userId) || [];
    const userProgress = this.learningProgress.get(userId) || new Map();
    const userPatterns = this.behaviorPatterns.get(userId) || new Map();
    const userBreakthroughs = this.breakthroughs.get(userId) || [];

    // Filter data for time period
    const periodInteractions = userInteractions.filter(i => 
      i.timestamp >= startDate && i.timestamp <= endDate
    );
    const periodSessions = userSessions.filter(s => 
      s.start_time >= startDate && s.start_time <= endDate
    );
    const recentBreakthroughs = userBreakthroughs.filter(b => 
      b.timestamp >= startDate && b.timestamp <= endDate
    );

    // Calculate summary statistics
    const totalTime = periodSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const avgSessionLength = periodSessions.length > 0 ? totalTime / periodSessions.length : 0;

    // Determine engagement trend
    const engagementTrend = this.calculateEngagementTrend(periodSessions);

    return {
      user_id: userId,
      generated_at: new Date(),
      time_period: { start: startDate, end: endDate },
      summary: {
        total_sessions: periodSessions.length,
        total_interactions: periodInteractions.length,
        total_time_minutes: totalTime,
        average_session_length: avgSessionLength,
        engagement_trend: engagementTrend,
        consistency_score: this.calculateConsistencyScore(periodSessions)
      },
      skill_progress: userProgress,
      behavior_patterns: userPatterns,
      recent_breakthroughs: recentBreakthroughs,
      focus_recommendations: this.generateFocusRecommendations(userId),
      next_goals: this.generateNextGoals(userId)
    };
  }

  /**
   * Get user's current learning trajectory
   */
  getLearningTrajectory(userId: string): {
    strengths: string[];
    challenges: string[];
    recommendedFocus: string[];
    predictedMilestones: Array<{
      skill: string;
      milestone: string;
      estimatedDate: Date;
      confidence: number;
    }>;
  } {
    const userProgress = this.learningProgress.get(userId) || new Map();
    const strengths: string[] = [];
    const challenges: string[] = [];
    const predictedMilestones: any[] = [];

    for (const [skill, progress] of userProgress.entries()) {
      if (progress.mastery_percentage >= 75) {
        strengths.push(skill);
      } else if (progress.mastery_percentage < 40) {
        challenges.push(skill);
      }

      // Predict next milestone
      if (progress.improvement_rate > 0) {
        const nextLevel = progress.current_level + 1;
        const requiredMastery = nextLevel * 20;
        const remaining = requiredMastery - progress.mastery_percentage;
        const weeksToMilestone = remaining / (progress.improvement_rate * 4); // Assume weekly improvement
        
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + (weeksToMilestone * 7));

        predictedMilestones.push({
          skill,
          milestone: `Level ${nextLevel} Mastery`,
          estimatedDate,
          confidence: Math.min(100, progress.improvement_rate * 20)
        });
      }
    }

    return {
      strengths,
      challenges,
      recommendedFocus: challenges.slice(0, 3), // Focus on top 3 challenges
      predictedMilestones: predictedMilestones.sort((a, b) => 
        a.estimatedDate.getTime() - b.estimatedDate.getTime()
      ).slice(0, 5)
    };
  }

  // Private helper methods
  private createInitialProgress(userId: string, skillArea: string): LearningProgress {
    const predictedMastery = new Date();
    predictedMastery.setMonth(predictedMastery.getMonth() + 3); // 3 months default

    return {
      user_id: userId,
      skill_area: skillArea,
      current_level: 1,
      mastery_percentage: 0,
      sessions_practiced: 0,
      total_time_minutes: 0,
      streak_days: 0,
      last_practice: new Date(),
      milestones_achieved: [],
      focus_areas: [],
      improvement_rate: 0,
      predicted_mastery_date: predictedMastery
    };
  }

  private calculateEngagementScore(session: UserSession): number {
    const interactionRate = session.interactions_count / (session.duration_minutes || 1);
    const activityDiversity = session.activities.length;
    const goalCompletion = session.outcomes.total_goals > 0 ? 
      (session.outcomes.goals_met / session.outcomes.total_goals) * 100 : 50;

    return Math.min(100, (interactionRate * 10) + (activityDiversity * 5) + goalCompletion);
  }

  private analyzeSessionProgress(session: UserSession): string[] {
    const indicators: string[] = [];

    if (session.interactions_count > 50) {
      indicators.push('High interaction engagement');
    }

    if (session.activities.length >= 3) {
      indicators.push('Good activity diversity');
    }

    if (session.duration_minutes && session.duration_minutes > 20) {
      indicators.push('Sustained attention demonstrated');
    }

    if (session.outcomes.goals_met > 0) {
      indicators.push(`${session.outcomes.goals_met} therapeutic goals achieved`);
    }

    return indicators;
  }

  private calculateImprovementRate(userId: string, skillArea: string): number {
    const userSessions = this.sessions.get(userId) || [];
    const skillSessions = userSessions
      .filter(s => s.activities.includes(skillArea))
      .sort((a, b) => a.start_time.getTime() - b.start_time.getTime());

    if (skillSessions.length < 2) return 0;

    const recent = skillSessions.slice(-5); // Last 5 sessions
    const older = skillSessions.slice(-10, -5); // Previous 5 sessions

    const recentAvg = recent.reduce((sum, s) => sum + s.outcomes.engagement_score, 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((sum, s) => sum + s.outcomes.engagement_score, 0) / older.length : 
      recentAvg * 0.8;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  private calculateSignificanceScore(
    type: BreakthroughMoment['breakthrough_type'], 
    context: BreakthroughMoment['context']
  ): number {
    const typeScores = {
      'first_success': 8,
      'consistency_achieved': 7,
      'level_up': 9,
      'speed_improvement': 6,
      'independence_gained': 10
    };

    let baseScore = typeScores[type] || 5;
    
    // Boost score based on previous attempts
    if (context.previous_attempts > 10) {
      baseScore += 2;
    }

    return Math.min(10, baseScore);
  }

  private analyzeInteractionForPatterns(interaction: UserInteraction): void {
    // Analyze response time patterns
    if (interaction.performance_data.response_time) {
      this.updateBehaviorPattern(
        interaction.user_id,
        'response_time_pattern',
        interaction.performance_data.response_time
      );
    }

    // Analyze accuracy patterns
    if (interaction.performance_data.accuracy !== undefined) {
      this.updateBehaviorPattern(
        interaction.user_id,
        'accuracy_pattern',
        interaction.performance_data.accuracy
      );
    }
  }

  private updateBehaviorPattern(userId: string, patternType: string, value: any): void {
    const userPatterns = this.behaviorPatterns.get(userId) || new Map();
    const pattern = userPatterns.get(patternType) || {
      user_id: userId,
      pattern_type: patternType as any,
      pattern_data: {
        value: [],
        confidence_score: 0,
        observations: 0,
        last_updated: new Date()
      },
      recommendations: []
    };

    // Update pattern data (simplified - in production would use more sophisticated analysis)
    if (!Array.isArray(pattern.pattern_data.value)) {
      pattern.pattern_data.value = [];
    }
    
    pattern.pattern_data.value.push(value);
    pattern.pattern_data.observations += 1;
    pattern.pattern_data.last_updated = new Date();
    
    // Keep only recent observations
    if (pattern.pattern_data.value.length > 50) {
      pattern.pattern_data.value = pattern.pattern_data.value.slice(-50);
    }

    // Update confidence score
    pattern.pattern_data.confidence_score = Math.min(100, pattern.pattern_data.observations * 2);

    userPatterns.set(patternType, pattern);
    this.behaviorPatterns.set(userId, userPatterns);
  }

  private checkForBreakthroughs(interaction: UserInteraction): void {
    // Check for first success
    if (interaction.performance_data.success && interaction.performance_data.attempts === 1) {
      this.recordBreakthrough(
        interaction.user_id,
        interaction.context.activity,
        'first_success',
        {
          activity: interaction.context.activity,
          session_id: interaction.context.session_id || 'unknown',
          previous_attempts: 0,
          current_performance: interaction.performance_data
        }
      );
    }

    // Check for speed improvements
    if (interaction.performance_data.response_time && interaction.performance_data.response_time < 2000) {
      const userPatterns = this.behaviorPatterns.get(interaction.user_id);
      const responsePattern = userPatterns?.get('response_time_pattern');
      
      if (responsePattern && Array.isArray(responsePattern.pattern_data.value)) {
        const recentTimes = responsePattern.pattern_data.value.slice(-10);
        const avgTime = recentTimes.reduce((sum: number, time: number) => sum + time, 0) / recentTimes.length;
        
        if (interaction.performance_data.response_time < avgTime * 0.7) {
          this.recordBreakthrough(
            interaction.user_id,
            interaction.context.activity,
            'speed_improvement',
            {
              activity: interaction.context.activity,
              session_id: interaction.context.session_id || 'unknown',
              previous_attempts: recentTimes.length,
              current_performance: interaction.performance_data
            }
          );
        }
      }
    }
  }

  private calculateEngagementTrend(sessions: UserSession[]): 'improving' | 'stable' | 'declining' {
    if (sessions.length < 3) return 'stable';

    const recent = sessions.slice(-5).map(s => s.outcomes.engagement_score);
    const older = sessions.slice(-10, -5).map(s => s.outcomes.engagement_score);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }

  private calculateConsistencyScore(sessions: UserSession[]): number {
    if (sessions.length < 2) return 0;

    // Calculate consistency based on session frequency and duration
    const sessionDates = sessions.map(s => s.start_time).sort();
    const intervals = [];
    
    for (let i = 1; i < sessionDates.length; i++) {
      const daysBetween = Math.floor(
        (sessionDates[i].getTime() - sessionDates[i-1].getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(daysBetween);
    }

    // Calculate standard deviation of intervals
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    return Math.max(0, 100 - (stdDev * 10));
  }

  private generateFocusRecommendations(userId: string): string[] {
    const userProgress = this.learningProgress.get(userId) || new Map();
    const recommendations: string[] = [];

    // Find areas that need attention
    const challengingSkills = Array.from(userProgress.entries())
      .filter(([_, progress]) => progress.mastery_percentage < 50)
      .sort((a, b) => a[1].mastery_percentage - b[1].mastery_percentage)
      .slice(0, 3)
      .map(([skill, _]) => skill);

    if (challengingSkills.length > 0) {
      recommendations.push(`Focus on improving: ${challengingSkills.join(', ')}`);
    }

    // Check for inconsistent practice
    const inconsistentSkills = Array.from(userProgress.entries())
      .filter(([_, progress]) => {
        const daysSinceLastPractice = Math.floor(
          (Date.now() - progress.last_practice.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastPractice > 7;
      })
      .map(([skill, _]) => skill);

    if (inconsistentSkills.length > 0) {
      recommendations.push(`Resume practice in: ${inconsistentSkills.slice(0, 2).join(', ')}`);
    }

    return recommendations;
  }

  private generateNextGoals(userId: string): string[] {
    const userProgress = this.learningProgress.get(userId) || new Map();
    const goals: string[] = [];

    for (const [skill, progress] of userProgress.entries()) {
      if (progress.mastery_percentage >= 80 && progress.current_level < 5) {
        goals.push(`Advance to Level ${progress.current_level + 1} in ${skill}`);
      } else if (progress.mastery_percentage < 60) {
        goals.push(`Achieve 60% mastery in ${skill}`);
      }
    }

    return goals.slice(0, 5); // Limit to 5 goals
  }

  private generateSessionNotes(session: UserSession): string {
    const duration = session.duration_minutes || 0;
    return `User completed ${session.session_type} session lasting ${duration} minutes. ` +
           `Engaged in ${session.activities.length} activities with ${session.interactions_count} total interactions. ` +
           `Engagement score: ${Math.round(session.outcomes.engagement_score)}%. ` +
           `Progress indicators: ${session.outcomes.progress_indicators.join(', ')}.`;
  }

  private generateClinicalObservations(session: UserSession): string[] {
    const observations: string[] = [];

    if (session.outcomes.engagement_score >= 80) {
      observations.push('High engagement and motivation demonstrated throughout session');
    } else if (session.outcomes.engagement_score < 50) {
      observations.push('Consider strategies to increase engagement and motivation');
    }

    if (session.interactions_count > 100) {
      observations.push('Excellent interaction frequency indicates strong active participation');
    }

    if (session.outcomes.breakthroughs.length > 0) {
      observations.push(`Breakthrough moments achieved: ${session.outcomes.breakthroughs.join(', ')}`);
    }

    return observations;
  }

  private setupGameIntegrations(): void {
    // Integration points for tracking game-specific interactions
    // This would be implemented with event listeners or hooks in the actual games
    console.log('🔗 Setting up game integration tracking points');
  }

  private startPeriodicAnalysis(): void {
    // Run analysis every hour to update patterns and recommendations
    setInterval(() => {
      this.runPeriodicAnalysis();
    }, 60 * 60 * 1000); // Every hour
  }

  private runPeriodicAnalysis(): void {
    // Update behavior patterns and recommendations for active users
    for (const userId of this.activeUserSessions.keys()) {
      this.updateUserRecommendations(userId);
    }
  }

  private updateUserRecommendations(userId: string): void {
    // Update recommendations based on recent activity
    const analytics = this.generateUserAnalytics(userId, 7); // Last 7 days
    console.log(`📊 Updated recommendations for user ${userId}: ${analytics.focus_recommendations.join(', ')}`);
  }

  private loadHistoryData(): void {
    try {
      // Load interactions
      const savedInteractions = safeLocalStorage.getItem('userHistoryInteractions');
      if (savedInteractions) {
        const data = JSON.parse(savedInteractions);
        this.interactions = new Map(data.map(([userId, interactions]: [string, any[]]) => [
          userId,
          interactions.map(i => ({
            ...i,
            timestamp: new Date(i.timestamp)
          }))
        ]));
      }

      // Load sessions
      const savedSessions = safeLocalStorage.getItem('userHistorySessions');
      if (savedSessions) {
        const data = JSON.parse(savedSessions);
        this.sessions = new Map(data.map(([userId, sessions]: [string, any[]]) => [
          userId,
          sessions.map(s => ({
            ...s,
            start_time: new Date(s.start_time),
            end_time: s.end_time ? new Date(s.end_time) : undefined
          }))
        ]));
      }

      // Load learning progress
      const savedProgress = safeLocalStorage.getItem('userLearningProgress');
      if (savedProgress) {
        const data = JSON.parse(savedProgress);
        this.learningProgress = new Map(data.map(([userId, progressMap]: [string, any]) => [
          userId,
          new Map(Object.entries(progressMap).map(([skill, progress]: [string, any]) => [
            skill,
            {
              ...progress,
              last_practice: new Date(progress.last_practice),
              predicted_mastery_date: new Date(progress.predicted_mastery_date)
            }
          ]))
        ]));
      }

      console.log('📊 User history data loaded successfully');
    } catch (error) {
      console.warn('Could not load user history data:', error);
    }
  }

  private saveHistoryData(): void {
    try {
      // Save interactions
      safeLocalStorage.setItem('userHistoryInteractions', JSON.stringify(
        Array.from(this.interactions.entries())
      ));

      // Save sessions
      safeLocalStorage.setItem('userHistorySessions', JSON.stringify(
        Array.from(this.sessions.entries())
      ));

      // Save learning progress
      const progressData = Array.from(this.learningProgress.entries()).map(([userId, progressMap]) => [
        userId,
        Object.fromEntries(progressMap.entries())
      ]);
      safeLocalStorage.setItem('userLearningProgress', JSON.stringify(progressData));
    } catch (error) {
      console.warn('Could not save user history data:', error);
    }
  }
}

// Export singleton instance
export const userHistoryTrackingService = UserHistoryTrackingService.getInstance();