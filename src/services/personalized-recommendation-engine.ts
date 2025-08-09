/**
 * Personalized Recommendation Engine
 * Advanced AI-powered recommendation system that combines user history, GPT-4 analysis,
 * cross-game tracking, and therapeutic goals to provide personalized learning experiences
 */

import { userHistoryTrackingService, UserAnalytics } from './user-history-tracking-service';
import { gpt4FocusRecommendationsService, FocusRecommendation } from './gpt4-focus-recommendations-service';
import { gameIntegrationTracker, CrossGameAnalytics, ActivityRecommendation } from './game-integration-tracker';
import { therapySessionLogger } from './therapy-session-logger';

export interface PersonalizedRecommendation {
  recommendation_id: string;
  user_id: string;
  generated_at: Date;
  recommendation_type: 'immediate_action' | 'short_term_goal' | 'long_term_pathway' | 'adaptive_adjustment' | 'breakthrough_acceleration';
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  confidence_score: number; // 0-100
  
  // Core recommendation content
  title: string;
  description: string;
  specific_actions: string[];
  expected_outcomes: string[];
  
  // Timing and context
  optimal_timing: {
    time_of_day?: string;
    session_frequency: string;
    duration_minutes: number;
    context_prerequisites?: string[];
  };
  
  // Supporting evidence
  rationale: string;
  supporting_data: {
    user_patterns: string[];
    performance_trends: string[];
    ai_insights: string[];
    therapeutic_alignment: string[];
  };
  
  // Implementation details
  implementation: {
    game_activities: Array<{
      game_type: string;
      activity_name: string;
      difficulty_level: number;
      estimated_duration: number;
    }>;
    progression_milestones: string[];
    success_metrics: Array<{
      metric_name: string;
      target_value: number;
      measurement_method: string;
    }>;
  };
  
  // Adaptive features
  adaptation_triggers: Array<{
    trigger_condition: string;
    adaptation_response: string;
  }>;
  
  // Tracking
  status: 'active' | 'completed' | 'paused' | 'superseded';
  progress_tracking: {
    attempts: number;
    successes: number;
    current_milestone: number;
    last_activity: Date;
  };
}

export interface RecommendationContext {
  user_id: string;
  current_session_type?: string;
  available_time_minutes?: number;
  current_energy_level?: 'high' | 'medium' | 'low';
  recent_challenges?: string[];
  immediate_goals?: string[];
  parent_priorities?: string[];
  therapeutic_focus?: string[];
}

export interface RecommendationBundle {
  bundle_id: string;
  user_id: string;
  created_at: Date;
  bundle_name: string;
  primary_focus: string;
  recommendations: PersonalizedRecommendation[];
  estimated_total_time: number;
  synergy_score: number; // How well recommendations work together
  pathway_coherence: number; // How well aligned with long-term goals
}

export interface AdaptiveLearningProfile {
  user_id: string;
  learning_style: {
    visual_preference: number; // 0-100
    auditory_preference: number;
    kinesthetic_preference: number;
    pace_preference: 'slow' | 'moderate' | 'fast';
    challenge_tolerance: 'low' | 'medium' | 'high';
  };
  motivation_factors: {
    intrinsic_motivation_level: number;
    reward_responsiveness: number;
    social_motivation_factor: number;
    achievement_orientation: number;
  };
  optimal_conditions: {
    session_length_minutes: number;
    break_frequency_minutes: number;
    difficulty_progression_rate: number;
    variety_requirement: number; // How often to switch activities
  };
  success_patterns: {
    breakthrough_predictors: string[];
    optimal_challenge_level: number;
    engagement_maintainers: string[];
    fatigue_indicators: string[];
  };
}

export interface RecommendationOutcome {
  recommendation_id: string;
  outcome_type: 'success' | 'partial_success' | 'no_progress' | 'regression';
  measured_at: Date;
  success_metrics: Array<{
    metric_name: string;
    achieved_value: number;
    target_value: number;
    improvement_percentage: number;
  }>;
  user_feedback?: {
    engagement_rating: number; // 1-5
    difficulty_rating: number; // 1-5
    enjoyment_rating: number; // 1-5
    comments?: string;
  };
  therapist_observations?: string[];
  adaptive_insights: string[];
}

export class PersonalizedRecommendationEngine {
  private static instance: PersonalizedRecommendationEngine;
  private userRecommendations: Map<string, PersonalizedRecommendation[]> = new Map();
  private recommendationBundles: Map<string, RecommendationBundle[]> = new Map();
  private learningProfiles: Map<string, AdaptiveLearningProfile> = new Map();
  private recommendationOutcomes: Map<string, RecommendationOutcome[]> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): PersonalizedRecommendationEngine {
    if (!PersonalizedRecommendationEngine.instance) {
      PersonalizedRecommendationEngine.instance = new PersonalizedRecommendationEngine();
    }
    return PersonalizedRecommendationEngine.instance;
  }

  private initialize(): void {
    console.log('🎯 Personalized Recommendation Engine initialized');
    this.loadRecommendationData();
    this.startAdaptiveAnalysis();
  }

  /**
   * Generate comprehensive personalized recommendations
   */
  async generatePersonalizedRecommendations(
    userId: string,
    context: RecommendationContext = { user_id: userId }
  ): Promise<PersonalizedRecommendation[]> {
    try {
      console.log(`🎯 Generating personalized recommendations for user: ${userId}`);

      // Gather comprehensive user data
      const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 30);
      const learningTrajectory = userHistoryTrackingService.getLearningTrajectory(userId);
      const crossGameAnalytics = gameIntegrationTracker.getCrossGameAnalytics(userId);
      const gptRecommendations = await gpt4FocusRecommendationsService.generateFocusRecommendations(userId);
      const learningProfile = this.getOrCreateLearningProfile(userId, userAnalytics);

      // Generate different types of recommendations
      const immediateRecommendations = await this.generateImmediateActionRecommendations(
        userId, context, userAnalytics, learningProfile
      );

      const shortTermRecommendations = await this.generateShortTermGoalRecommendations(
        userId, gptRecommendations, learningTrajectory, learningProfile
      );

      const longTermRecommendations = await this.generateLongTermPathwayRecommendations(
        userId, userAnalytics, crossGameAnalytics, learningProfile
      );

      const adaptiveRecommendations = await this.generateAdaptiveAdjustmentRecommendations(
        userId, userAnalytics, learningProfile
      );

      const breakthroughRecommendations = await this.generateBreakthroughAccelerationRecommendations(
        userId, learningTrajectory, userAnalytics
      );

      // Combine and prioritize all recommendations
      const allRecommendations = [
        ...immediateRecommendations,
        ...shortTermRecommendations,
        ...longTermRecommendations,
        ...adaptiveRecommendations,
        ...breakthroughRecommendations
      ];

      // Apply personalization filters and ranking
      const personalizedRecommendations = this.personalizeAndRankRecommendations(
        allRecommendations, learningProfile, context
      );

      // Store recommendations
      this.userRecommendations.set(userId, personalizedRecommendations);
      this.saveRecommendationData();

      console.log(`🎯 Generated ${personalizedRecommendations.length} personalized recommendations`);
      return personalizedRecommendations;

    } catch (error) {
      console.error('Failed to generate personalized recommendations:', error);
      return this.generateFallbackRecommendations(userId, context);
    }
  }

  /**
   * Create recommendation bundle for optimal learning sequence
   */
  async createRecommendationBundle(
    userId: string,
    focusArea: string,
    timeAvailable: number = 30
  ): Promise<RecommendationBundle> {
    const userRecommendations = this.userRecommendations.get(userId) || [];
    
    // Filter recommendations by focus area and time constraints
    const relevantRecommendations = userRecommendations.filter(rec =>
      rec.title.toLowerCase().includes(focusArea.toLowerCase()) ||
      rec.description.toLowerCase().includes(focusArea.toLowerCase())
    );

    // Select optimal combination within time constraints
    const bundleRecommendations = this.selectOptimalCombination(
      relevantRecommendations, timeAvailable
    );

    const bundle: RecommendationBundle = {
      bundle_id: `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: new Date(),
      bundle_name: `${focusArea} Focus Session`,
      primary_focus: focusArea,
      recommendations: bundleRecommendations,
      estimated_total_time: bundleRecommendations.reduce(
        (sum, rec) => sum + rec.optimal_timing.duration_minutes, 0
      ),
      synergy_score: this.calculateSynergyScore(bundleRecommendations),
      pathway_coherence: this.calculatePathwayCoherence(bundleRecommendations, userId)
    };

    // Store bundle
    const userBundles = this.recommendationBundles.get(userId) || [];
    userBundles.push(bundle);
    this.recommendationBundles.set(userId, userBundles);

    return bundle;
  }

  /**
   * Track recommendation outcome and adapt future recommendations
   */
  async trackRecommendationOutcome(
    recommendationId: string,
    outcome: Omit<RecommendationOutcome, 'measured_at' | 'adaptive_insights'>
  ): Promise<void> {
    const fullOutcome: RecommendationOutcome = {
      ...outcome,
      measured_at: new Date(),
      adaptive_insights: this.generateAdaptiveInsights(outcome)
    };

    // Store outcome
    const userId = this.findUserIdForRecommendation(recommendationId);
    if (userId) {
      const userOutcomes = this.recommendationOutcomes.get(userId) || [];
      userOutcomes.push(fullOutcome);
      this.recommendationOutcomes.set(userId, userOutcomes);

      // Update learning profile based on outcome
      await this.updateLearningProfileFromOutcome(userId, fullOutcome);

      // Trigger adaptive adjustments if needed
      await this.triggerAdaptiveAdjustments(userId, fullOutcome);
    }

    this.saveRecommendationData();
  }

  /**
   * Get current active recommendations for user
   */
  getActiveRecommendations(userId: string, limit: number = 5): PersonalizedRecommendation[] {
    const recommendations = this.userRecommendations.get(userId) || [];
    
    return recommendations
      .filter(rec => rec.status === 'active')
      .sort((a, b) => {
        // Sort by priority, then confidence, then recency
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityCmp = priorityOrder[b.priority_level] - priorityOrder[a.priority_level];
        if (priorityCmp !== 0) return priorityCmp;
        
        const confidenceCmp = b.confidence_score - a.confidence_score;
        if (confidenceCmp !== 0) return confidenceCmp;
        
        return b.generated_at.getTime() - a.generated_at.getTime();
      })
      .slice(0, limit);
  }

  /**
   * Get contextual recommendations for current session
   */
  async getContextualRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<PersonalizedRecommendation[]> {
    const activeRecommendations = this.getActiveRecommendations(userId);
    
    // Filter by context
    return activeRecommendations.filter(rec => {
      // Check time constraints
      if (context.available_time_minutes && 
          rec.optimal_timing.duration_minutes > context.available_time_minutes) {
        return false;
      }

      // Check energy level matching
      if (context.current_energy_level) {
        const energyMatch = this.matchesEnergyLevel(rec, context.current_energy_level);
        if (!energyMatch) return false;
      }

      // Check therapeutic focus alignment
      if (context.therapeutic_focus && context.therapeutic_focus.length > 0) {
        const therapeuticMatch = context.therapeutic_focus.some(focus =>
          rec.supporting_data.therapeutic_alignment.some(alignment =>
            alignment.toLowerCase().includes(focus.toLowerCase())
          )
        );
        if (!therapeuticMatch) return false;
      }

      return true;
    });
  }

  /**
   * Get learning profile for user
   */
  getLearningProfile(userId: string): AdaptiveLearningProfile | null {
    return this.learningProfiles.get(userId) || null;
  }

  /**
   * Get recommendation effectiveness metrics
   */
  getRecommendationEffectiveness(userId: string): {
    total_recommendations: number;
    success_rate: number;
    average_engagement: number;
    breakthrough_acceleration_factor: number;
    adaptation_frequency: number;
  } {
    const recommendations = this.userRecommendations.get(userId) || [];
    const outcomes = this.recommendationOutcomes.get(userId) || [];

    const successfulOutcomes = outcomes.filter(o => 
      o.outcome_type === 'success' || o.outcome_type === 'partial_success'
    );

    const avgEngagement = outcomes.length > 0 ?
      outcomes.reduce((sum, o) => sum + (o.user_feedback?.engagement_rating || 3), 0) / outcomes.length : 0;

    return {
      total_recommendations: recommendations.length,
      success_rate: outcomes.length > 0 ? (successfulOutcomes.length / outcomes.length) * 100 : 0,
      average_engagement: avgEngagement,
      breakthrough_acceleration_factor: this.calculateBreakthroughAcceleration(userId),
      adaptation_frequency: this.calculateAdaptationFrequency(userId)
    };
  }

  // Private methods

  private async generateImmediateActionRecommendations(
    userId: string,
    context: RecommendationContext,
    userAnalytics: UserAnalytics,
    learningProfile: AdaptiveLearningProfile
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Quick engagement booster if user seems disengaged
    if (userAnalytics.summary.engagement_trend === 'declining') {
      recommendations.push(this.createRecommendation(
        userId,
        'immediate_action',
        'high',
        'Engagement Booster Session',
        'Quick high-success activity to rebuild confidence and engagement',
        ['Start with favorite activity', 'Use preferred difficulty level', 'Celebrate small wins'],
        ['Improved mood and motivation', 'Renewed engagement'],
        {
          session_frequency: 'immediate',
          duration_minutes: Math.min(context.available_time_minutes || 15, 15),
          time_of_day: this.getOptimalTimeForUser(userId)
        },
        'User showing declining engagement - need immediate positive experience',
        85
      ));
    }

    // Quick skill practice if user has been away
    const daysSinceLastSession = this.getDaysSinceLastSession(userId);
    if (daysSinceLastSession > 3) {
      recommendations.push(this.createRecommendation(
        userId,
        'immediate_action',
        'medium',
        'Welcome Back Practice',
        'Gentle reentry session to rebuild familiarity and confidence',
        ['Review previous achievements', 'Practice familiar skills', 'Gradually increase challenge'],
        ['Restored skill familiarity', 'Confidence rebuilding'],
        {
          session_frequency: 'immediate',
          duration_minutes: Math.min(context.available_time_minutes || 20, 20),
          time_of_day: 'flexible'
        },
        `User has been away for ${daysSinceLastSession} days - need reentry support`,
        80
      ));
    }

    return recommendations;
  }

  private async generateShortTermGoalRecommendations(
    userId: string,
    gptRecommendations: FocusRecommendation[],
    learningTrajectory: any,
    learningProfile: AdaptiveLearningProfile
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Convert GPT recommendations to personalized format
    for (const gptRec of gptRecommendations.slice(0, 3)) {
      const personalizedRec = this.createRecommendation(
        userId,
        'short_term_goal',
        gptRec.priority === 'critical' ? 'critical' : gptRec.priority === 'high' ? 'high' : 'medium',
        gptRec.focus_area,
        gptRec.rationale,
        gptRec.specific_activities,
        gptRec.expected_outcomes,
        {
          session_frequency: `${gptRec.timeframe.sessions_per_week} times per week`,
          duration_minutes: gptRec.timeframe.minutes_per_session,
          time_of_day: this.getOptimalTimeForUser(userId)
        },
        gptRec.rationale,
        gptRec.confidence_score
      );

      // Add GPT-specific implementation details
      personalizedRec.implementation.game_activities = this.mapGPTRecommendationsToActivities(gptRec);
      personalizedRec.supporting_data.ai_insights = gptRec.supporting_data.user_patterns;

      recommendations.push(personalizedRec);
    }

    // Add challenge recommendations for strong areas
    for (const strength of learningTrajectory.strengths.slice(0, 2)) {
      recommendations.push(this.createRecommendation(
        userId,
        'short_term_goal',
        'medium',
        `Advanced ${strength} Challenge`,
        `Build on your success in ${strength} with more complex challenges`,
        [`Take on advanced ${strength} activities`, 'Explore real-world applications', 'Mentor others'],
        ['Mastery level achievement', 'Leadership confidence', 'Skill generalization'],
        {
          session_frequency: '2 times per week',
          duration_minutes: learningProfile.optimal_conditions.session_length_minutes,
          time_of_day: this.getOptimalTimeForUser(userId)
        },
        `User demonstrates strength in ${strength} - ready for advanced challenges`,
        75
      ));
    }

    return recommendations;
  }

  private async generateLongTermPathwayRecommendations(
    userId: string,
    userAnalytics: UserAnalytics,
    crossGameAnalytics: CrossGameAnalytics | null,
    learningProfile: AdaptiveLearningProfile
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Skill mastery pathway
    const skillsToMaster = Array.from(userAnalytics.skill_progress.entries())
      .filter(([_, progress]) => progress.mastery_percentage < 80)
      .sort((a, b) => b[1].mastery_percentage - a[1].mastery_percentage)
      .slice(0, 2);

    for (const [skill, progress] of skillsToMaster) {
      recommendations.push(this.createRecommendation(
        userId,
        'long_term_pathway',
        'medium',
        `${skill} Mastery Pathway`,
        `Structured path to achieve mastery in ${skill} over the next 8-12 weeks`,
        [
          'Phase 1: Foundation strengthening (weeks 1-4)',
          'Phase 2: Skill integration (weeks 5-8)',
          'Phase 3: Mastery demonstration (weeks 9-12)'
        ],
        ['80%+ mastery achievement', 'Confident independent use', 'Teaching others capability'],
        {
          session_frequency: '3-4 times per week',
          duration_minutes: learningProfile.optimal_conditions.session_length_minutes,
          time_of_day: this.getOptimalTimeForUser(userId)
        },
        `Current ${skill} mastery at ${Math.round(progress.mastery_percentage)}% - structured pathway needed`,
        85
      ));
    }

    // Cross-game skill transfer pathway
    if (crossGameAnalytics && crossGameAnalytics.skill_transfer_analysis.length > 0) {
      const topTransfer = crossGameAnalytics.skill_transfer_analysis[0];
      recommendations.push(this.createRecommendation(
        userId,
        'long_term_pathway',
        'low',
        'Skill Transfer Acceleration',
        `Leverage your ${topTransfer.source_game} skills to accelerate ${topTransfer.target_game} learning`,
        [
          'Practice bridge activities',
          'Focus on shared skill components',
          'Apply strategies across domains'
        ],
        ['Accelerated learning in new areas', 'Enhanced skill generalization'],
        {
          session_frequency: '2 times per week',
          duration_minutes: 25,
          time_of_day: 'flexible'
        },
        `Strong skill transfer potential identified between ${topTransfer.source_game} and ${topTransfer.target_game}`,
        topTransfer.confidence_level
      ));
    }

    return recommendations;
  }

  private async generateAdaptiveAdjustmentRecommendations(
    userId: string,
    userAnalytics: UserAnalytics,
    learningProfile: AdaptiveLearningProfile
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Session length optimization
    const currentSessionLength = userAnalytics.summary.average_session_length;
    const optimalLength = learningProfile.optimal_conditions.session_length_minutes;
    
    if (Math.abs(currentSessionLength - optimalLength) > 5) {
      const adjustment = currentSessionLength < optimalLength ? 'increase' : 'decrease';
      recommendations.push(this.createRecommendation(
        userId,
        'adaptive_adjustment',
        'low',
        `Session Length Optimization`,
        `Adjust session length to ${adjustment} from ${Math.round(currentSessionLength)} to ${optimalLength} minutes`,
        [
          `Gradually ${adjustment} session duration`,
          'Monitor engagement levels',
          'Adjust break frequency accordingly'
        ],
        ['Improved sustained attention', 'Better learning outcomes', 'Reduced fatigue'],
        {
          session_frequency: 'ongoing adjustment',
          duration_minutes: optimalLength,
          time_of_day: 'apply to all sessions'
        },
        `Current average session length (${Math.round(currentSessionLength)}min) differs from optimal (${optimalLength}min)`,
        70
      ));
    }

    // Difficulty progression adjustment
    const recentAccuracy = this.calculateRecentAccuracy(userId);
    if (recentAccuracy > 90) {
      recommendations.push(this.createRecommendation(
        userId,
        'adaptive_adjustment',
        'medium',
        'Challenge Level Increase',
        'Your high accuracy suggests you are ready for more challenging activities',
        ['Increase difficulty by one level', 'Introduce advanced concepts', 'Add complexity gradually'],
        ['Maintained optimal challenge', 'Continued growth', 'Prevent boredom'],
        {
          session_frequency: 'apply to next sessions',
          duration_minutes: learningProfile.optimal_conditions.session_length_minutes,
          time_of_day: 'flexible'
        },
        `Recent accuracy of ${Math.round(recentAccuracy)}% indicates readiness for increased challenge`,
        80
      ));
    } else if (recentAccuracy < 60) {
      recommendations.push(this.createRecommendation(
        userId,
        'adaptive_adjustment',
        'high',
        'Support Level Increase',
        'Lower accuracy suggests need for additional support and easier challenges',
        ['Reduce difficulty temporarily', 'Add more scaffolding', 'Increase positive reinforcement'],
        ['Rebuilt confidence', 'Improved success rate', 'Reduced frustration'],
        {
          session_frequency: 'immediate implementation',
          duration_minutes: Math.max(15, learningProfile.optimal_conditions.session_length_minutes - 5),
          time_of_day: 'flexible'
        },
        `Recent accuracy of ${Math.round(recentAccuracy)}% indicates need for additional support`,
        85
      ));
    }

    return recommendations;
  }

  private async generateBreakthroughAccelerationRecommendations(
    userId: string,
    learningTrajectory: any,
    userAnalytics: UserAnalytics
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Identify skills close to breakthrough
    const nearBreakthroughSkills = Array.from(userAnalytics.skill_progress.entries())
      .filter(([_, progress]) => 
        progress.mastery_percentage > 60 && 
        progress.mastery_percentage < 80 &&
        progress.improvement_rate > 0
      )
      .sort((a, b) => b[1].improvement_rate - a[1].improvement_rate);

    for (const [skill, progress] of nearBreakthroughSkills.slice(0, 2)) {
      const weeksToBreakthrough = Math.ceil((80 - progress.mastery_percentage) / Math.max(1, progress.improvement_rate));
      
      recommendations.push(this.createRecommendation(
        userId,
        'breakthrough_acceleration',
        'high',
        `${skill} Breakthrough Sprint`,
        `Focused intensive practice to achieve breakthrough in ${skill} within ${weeksToBreakthrough} weeks`,
        [
          'Daily focused practice sessions',
          'Target specific weak areas',
          'Use spaced repetition',
          'Track micro-improvements'
        ],
        [`Breakthrough to 80%+ mastery in ${skill}`, 'Confidence boost', 'Momentum for other skills'],
        {
          session_frequency: 'daily for next 2 weeks',
          duration_minutes: 20,
          time_of_day: this.getOptimalTimeForUser(userId)
        },
        `${skill} at ${Math.round(progress.mastery_percentage)}% with ${progress.improvement_rate.toFixed(1)}% weekly improvement - breakthrough imminent`,
        90
      ));
    }

    // Leverage recent breakthroughs
    if (userAnalytics.recent_breakthroughs.length > 0) {
      const recentBreakthrough = userAnalytics.recent_breakthroughs[0];
      recommendations.push(this.createRecommendation(
        userId,
        'breakthrough_acceleration',
        'medium',
        'Breakthrough Momentum',
        `Build on your recent success in ${recentBreakthrough.skill_area} to accelerate progress in related areas`,
        [
          'Practice related skills immediately',
          'Apply breakthrough strategies to similar challenges',
          'Maintain high engagement while momentum is strong'
        ],
        ['Accelerated learning in related areas', 'Sustained high motivation', 'Skill transfer'],
        {
          session_frequency: '4-5 times this week',
          duration_minutes: 25,
          time_of_day: this.getOptimalTimeForUser(userId)
        },
        `Recent breakthrough in ${recentBreakthrough.skill_area} creates opportunity for momentum transfer`,
        85
      ));
    }

    return recommendations;
  }

  private createRecommendation(
    userId: string,
    type: PersonalizedRecommendation['recommendation_type'],
    priority: PersonalizedRecommendation['priority_level'],
    title: string,
    description: string,
    actions: string[],
    outcomes: string[],
    timing: Omit<PersonalizedRecommendation['optimal_timing'], 'context_prerequisites'>,
    rationale: string,
    confidence: number
  ): PersonalizedRecommendation {
    return {
      recommendation_id: `rec_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      generated_at: new Date(),
      recommendation_type: type,
      priority_level: priority,
      confidence_score: confidence,
      title,
      description,
      specific_actions: actions,
      expected_outcomes: outcomes,
      optimal_timing: timing,
      rationale,
      supporting_data: {
        user_patterns: [],
        performance_trends: [],
        ai_insights: [],
        therapeutic_alignment: []
      },
      implementation: {
        game_activities: [],
        progression_milestones: [],
        success_metrics: []
      },
      adaptation_triggers: [],
      status: 'active',
      progress_tracking: {
        attempts: 0,
        successes: 0,
        current_milestone: 0,
        last_activity: new Date()
      }
    };
  }

  private getOrCreateLearningProfile(
    userId: string, 
    userAnalytics: UserAnalytics
  ): AdaptiveLearningProfile {
    const existing = this.learningProfiles.get(userId);
    if (existing) return existing;

    // Create initial profile based on analytics
    const profile: AdaptiveLearningProfile = {
      user_id: userId,
      learning_style: {
        visual_preference: 70, // Default visual preference for AAC users
        auditory_preference: 40,
        kinesthetic_preference: 60,
        pace_preference: 'moderate',
        challenge_tolerance: 'medium'
      },
      motivation_factors: {
        intrinsic_motivation_level: 60,
        reward_responsiveness: 70,
        social_motivation_factor: 50,
        achievement_orientation: 65
      },
      optimal_conditions: {
        session_length_minutes: Math.round(userAnalytics.summary.average_session_length) || 20,
        break_frequency_minutes: 10,
        difficulty_progression_rate: 1.2,
        variety_requirement: 3 // Switch activities every 3 sessions
      },
      success_patterns: {
        breakthrough_predictors: [],
        optimal_challenge_level: 3,
        engagement_maintainers: [],
        fatigue_indicators: []
      }
    };

    this.learningProfiles.set(userId, profile);
    return profile;
  }

  private personalizeAndRankRecommendations(
    recommendations: PersonalizedRecommendation[],
    learningProfile: AdaptiveLearningProfile,
    context: RecommendationContext
  ): PersonalizedRecommendation[] {
    // Apply personalization based on learning profile
    const personalized = recommendations.map(rec => {
      // Adjust duration based on optimal conditions
      rec.optimal_timing.duration_minutes = Math.min(
        rec.optimal_timing.duration_minutes,
        learningProfile.optimal_conditions.session_length_minutes
      );

      // Adjust confidence based on learning style match
      const styleMatch = this.calculateLearningStyleMatch(rec, learningProfile);
      rec.confidence_score = Math.round(rec.confidence_score * styleMatch);

      return rec;
    });

    // Rank by combined priority, confidence, and personalization fit
    return personalized.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityScore = priorityOrder[b.priority_level] - priorityOrder[a.priority_level];
      if (priorityScore !== 0) return priorityScore;

      const confidenceScore = b.confidence_score - a.confidence_score;
      if (confidenceScore !== 0) return confidenceScore;

      return b.generated_at.getTime() - a.generated_at.getTime();
    }).slice(0, 10); // Limit to top 10 recommendations
  }

  private generateFallbackRecommendations(
    userId: string,
    context: RecommendationContext
  ): PersonalizedRecommendation[] {
    return [
      this.createRecommendation(
        userId,
        'immediate_action',
        'medium',
        'General Practice Session',
        'Continue with regular practice activities',
        ['Choose a preferred activity', 'Practice at comfortable pace', 'Track progress'],
        ['Skill maintenance', 'Continued engagement'],
        {
          session_frequency: '3 times per week',
          duration_minutes: context.available_time_minutes || 20,
          time_of_day: 'flexible'
        },
        'Fallback recommendation when detailed analysis is unavailable',
        60
      )
    ];
  }

  private selectOptimalCombination(
    recommendations: PersonalizedRecommendation[],
    timeLimit: number
  ): PersonalizedRecommendation[] {
    // Simple greedy selection based on confidence score and time fit
    const selected: PersonalizedRecommendation[] = [];
    let remainingTime = timeLimit;

    const sortedRecs = recommendations.sort((a, b) => b.confidence_score - a.confidence_score);

    for (const rec of sortedRecs) {
      if (rec.optimal_timing.duration_minutes <= remainingTime) {
        selected.push(rec);
        remainingTime -= rec.optimal_timing.duration_minutes;
      }
    }

    return selected;
  }

  private calculateSynergyScore(recommendations: PersonalizedRecommendation[]): number {
    // Calculate how well recommendations work together
    if (recommendations.length < 2) return 100;

    let synergyScore = 0;
    
    // Check for complementary recommendation types
    const types = recommendations.map(r => r.recommendation_type);
    const uniqueTypes = new Set(types);
    if (uniqueTypes.size > 1) synergyScore += 20;

    // Check for skill area overlap
    const skillAreas = recommendations.flatMap(r => r.specific_actions);
    const commonSkills = skillAreas.filter((skill, index) => 
      skillAreas.indexOf(skill) !== index
    );
    if (commonSkills.length > 0) synergyScore += 30;

    // Check for progressive difficulty
    const difficulties = recommendations.map(r => 
      r.implementation.game_activities.length > 0 ? 
        r.implementation.game_activities[0].difficulty_level : 3
    );
    const isProgressive = difficulties.every((diff, i) => 
      i === 0 || diff >= difficulties[i - 1]
    );
    if (isProgressive) synergyScore += 25;

    return Math.min(100, synergyScore + 25); // Base score of 25
  }

  private calculatePathwayCoherence(
    recommendations: PersonalizedRecommendation[],
    userId: string
  ): number {
    // Calculate alignment with long-term learning pathway
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 30);
    const focusRecommendations = userAnalytics.focus_recommendations;

    let coherenceScore = 0;

    // Check alignment with focus recommendations
    for (const rec of recommendations) {
      const alignmentCount = focusRecommendations.filter(focus =>
        rec.title.toLowerCase().includes(focus.toLowerCase()) ||
        rec.description.toLowerCase().includes(focus.toLowerCase())
      ).length;
      
      coherenceScore += alignmentCount * 20;
    }

    return Math.min(100, coherenceScore / recommendations.length);
  }

  private generateAdaptiveInsights(outcome: Omit<RecommendationOutcome, 'measured_at' | 'adaptive_insights'>): string[] {
    const insights: string[] = [];

    if (outcome.outcome_type === 'success') {
      insights.push('Recommendation approach was effective - consider similar strategies');
      if (outcome.user_feedback?.engagement_rating && outcome.user_feedback.engagement_rating >= 4) {
        insights.push('High engagement - activity type is well-matched to user preferences');
      }
    } else if (outcome.outcome_type === 'no_progress') {
      insights.push('No progress observed - consider adjusting difficulty or approach');
      if (outcome.user_feedback?.difficulty_rating && outcome.user_feedback.difficulty_rating >= 4) {
        insights.push('User found activity too difficult - reduce challenge level');
      }
    }

    // Analyze success metrics
    const successfulMetrics = outcome.success_metrics.filter(m => 
      m.achieved_value >= m.target_value * 0.8
    );
    if (successfulMetrics.length > 0) {
      insights.push(`Strong performance in: ${successfulMetrics.map(m => m.metric_name).join(', ')}`);
    }

    return insights;
  }

  private async updateLearningProfileFromOutcome(
    userId: string,
    outcome: RecommendationOutcome
  ): Promise<void> {
    const profile = this.learningProfiles.get(userId);
    if (!profile) return;

    // Update motivation factors based on outcome
    if (outcome.outcome_type === 'success') {
      profile.motivation_factors.intrinsic_motivation_level = Math.min(100, 
        profile.motivation_factors.intrinsic_motivation_level + 2
      );
    } else if (outcome.outcome_type === 'no_progress') {
      profile.motivation_factors.intrinsic_motivation_level = Math.max(0, 
        profile.motivation_factors.intrinsic_motivation_level - 1
      );
    }

    // Update reward responsiveness
    if (outcome.user_feedback?.engagement_rating) {
      const engagementImpact = (outcome.user_feedback.engagement_rating - 3) * 2;
      profile.motivation_factors.reward_responsiveness = Math.max(0, Math.min(100,
        profile.motivation_factors.reward_responsiveness + engagementImpact
      ));
    }

    this.learningProfiles.set(userId, profile);
  }

  private async triggerAdaptiveAdjustments(
    userId: string,
    outcome: RecommendationOutcome
  ): Promise<void> {
    // Generate new adaptive recommendations based on outcome
    if (outcome.outcome_type === 'no_progress' || outcome.outcome_type === 'regression') {
      console.log(`🔄 Triggering adaptive adjustments for user ${userId} due to ${outcome.outcome_type}`);
      
      // Generate immediate adjustment recommendations
      const adjustmentRecommendations = await this.generateAdaptiveAdjustmentRecommendations(
        userId,
        userHistoryTrackingService.generateUserAnalytics(userId, 7),
        this.learningProfiles.get(userId)!
      );

      // Add to user's recommendations
      const userRecs = this.userRecommendations.get(userId) || [];
      userRecs.push(...adjustmentRecommendations);
      this.userRecommendations.set(userId, userRecs);
    }
  }

  private findUserIdForRecommendation(recommendationId: string): string | null {
    for (const [userId, recommendations] of this.userRecommendations.entries()) {
      if (recommendations.some(rec => rec.recommendation_id === recommendationId)) {
        return userId;
      }
    }
    return null;
  }

  private matchesEnergyLevel(
    recommendation: PersonalizedRecommendation,
    energyLevel: 'high' | 'medium' | 'low'
  ): boolean {
    const duration = recommendation.optimal_timing.duration_minutes;
    
    switch (energyLevel) {
      case 'high':
        return duration >= 15; // Can handle longer sessions
      case 'medium':
        return duration >= 10 && duration <= 25;
      case 'low':
        return duration <= 15; // Need shorter sessions
      default:
        return true;
    }
  }

  private getOptimalTimeForUser(userId: string): string {
    // Analyze user's historical performance by time of day
    const userEvents = gameIntegrationTracker.getCrossGameAnalytics(userId);
    
    if (userEvents?.engagement_patterns.length > 0) {
      const timePattern = userEvents.engagement_patterns.find(p => p.pattern_type === 'time_of_day');
      if (timePattern) {
        return `Around ${timePattern.pattern_data.optimal_hour}:00`;
      }
    }
    
    return 'flexible';
  }

  private getDaysSinceLastSession(userId: string): number {
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 7);
    if (userAnalytics.summary.total_sessions === 0) return 0;
    
    // This is a simplified calculation - in production would track actual last session date
    return Math.floor(Math.random() * 7); // Placeholder
  }

  private calculateRecentAccuracy(userId: string): number {
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 7);
    
    // Calculate weighted average across skill areas
    let totalAccuracy = 0;
    let skillCount = 0;
    
    for (const [_, progress] of userAnalytics.skill_progress.entries()) {
      totalAccuracy += progress.mastery_percentage;
      skillCount++;
    }
    
    return skillCount > 0 ? totalAccuracy / skillCount : 75; // Default
  }

  private mapGPTRecommendationsToActivities(
    gptRec: FocusRecommendation
  ): PersonalizedRecommendation['implementation']['game_activities'] {
    return gptRec.specific_activities.map(activity => ({
      game_type: this.inferGameTypeFromActivity(activity),
      activity_name: activity,
      difficulty_level: 3, // Default medium difficulty
      estimated_duration: Math.floor(gptRec.timeframe.minutes_per_session / gptRec.specific_activities.length)
    }));
  }

  private inferGameTypeFromActivity(activity: string): string {
    const activityLower = activity.toLowerCase();
    
    if (activityLower.includes('memory') || activityLower.includes('sequence')) {
      return 'memory_games';
    }
    if (activityLower.includes('reading') || activityLower.includes('spelling')) {
      return 'reading_spelling';
    }
    if (activityLower.includes('phonics') || activityLower.includes('letter')) {
      return 'phonics_tiles';
    }
    if (activityLower.includes('communication') || activityLower.includes('message')) {
      return 'communication';
    }
    
    return 'general_practice';
  }

  private calculateLearningStyleMatch(
    recommendation: PersonalizedRecommendation,
    profile: AdaptiveLearningProfile
  ): number {
    // Simple learning style matching - in production would be more sophisticated
    let matchScore = 1.0;
    
    // Adjust based on visual preference
    if (recommendation.title.toLowerCase().includes('visual') && profile.learning_style.visual_preference > 70) {
      matchScore += 0.1;
    }
    
    // Adjust based on pace preference
    if (profile.learning_style.pace_preference === 'fast' && 
        recommendation.optimal_timing.duration_minutes < 20) {
      matchScore += 0.05;
    } else if (profile.learning_style.pace_preference === 'slow' && 
               recommendation.optimal_timing.duration_minutes > 25) {
      matchScore += 0.05;
    }
    
    return Math.min(1.2, matchScore); // Cap at 20% boost
  }

  private calculateBreakthroughAcceleration(userId: string): number {
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 30);
    const recentBreakthroughs = userAnalytics.recent_breakthroughs.length;
    const totalSessions = userAnalytics.summary.total_sessions;
    
    return totalSessions > 0 ? (recentBreakthroughs / totalSessions) * 100 : 0;
  }

  private calculateAdaptationFrequency(userId: string): number {
    const recommendations = this.userRecommendations.get(userId) || [];
    const adaptiveRecs = recommendations.filter(r => r.recommendation_type === 'adaptive_adjustment');
    
    return recommendations.length > 0 ? (adaptiveRecs.length / recommendations.length) * 100 : 0;
  }

  private startAdaptiveAnalysis(): void {
    // Run adaptive analysis every 6 hours for active users
    setInterval(() => {
      this.runAdaptiveAnalysis();
    }, 6 * 60 * 60 * 1000);
  }

  private async runAdaptiveAnalysis(): Promise<void> {
    console.log('🔄 Running adaptive recommendation analysis');
    
    for (const userId of this.userRecommendations.keys()) {
      try {
        // Check if recommendations need updating based on recent activity
        const daysSinceLastGeneration = this.getDaysSinceLastGeneration(userId);
        if (daysSinceLastGeneration > 7) {
          await this.generatePersonalizedRecommendations(userId);
        }
      } catch (error) {
        console.warn(`Failed to update recommendations for user ${userId}:`, error);
      }
    }
  }

  private getDaysSinceLastGeneration(userId: string): number {
    const recommendations = this.userRecommendations.get(userId) || [];
    if (recommendations.length === 0) return 999;
    
    const latestRec = recommendations.reduce((latest, rec) => 
      rec.generated_at > latest.generated_at ? rec : latest
    );
    
    return Math.floor((Date.now() - latestRec.generated_at.getTime()) / (1000 * 60 * 60 * 24));
  }

  private loadRecommendationData(): void {
    try {
      // Load user recommendations
      const savedRecommendations = localStorage.getItem('personalizedRecommendations');
      if (savedRecommendations) {
        const data = JSON.parse(savedRecommendations);
        this.userRecommendations = new Map(data.map(([userId, recs]: [string, any[]]) => [
          userId,
          recs.map(rec => ({
            ...rec,
            generated_at: new Date(rec.generated_at),
            progress_tracking: {
              ...rec.progress_tracking,
              last_activity: new Date(rec.progress_tracking.last_activity)
            }
          }))
        ]));
      }

      // Load learning profiles
      const savedProfiles = localStorage.getItem('adaptiveLearningProfiles');
      if (savedProfiles) {
        const data = JSON.parse(savedProfiles);
        this.learningProfiles = new Map(Object.entries(data));
      }

      console.log('🎯 Personalized recommendation data loaded successfully');
    } catch (error) {
      console.warn('Could not load personalized recommendation data:', error);
    }
  }

  private saveRecommendationData(): void {
    try {
      // Save user recommendations
      localStorage.setItem('personalizedRecommendations', JSON.stringify(
        Array.from(this.userRecommendations.entries())
      ));

      // Save learning profiles
      localStorage.setItem('adaptiveLearningProfiles', JSON.stringify(
        Object.fromEntries(this.learningProfiles.entries())
      ));
    } catch (error) {
      console.warn('Could not save personalized recommendation data:', error);
    }
  }
}

// Export singleton instance
export const personalizedRecommendationEngine = PersonalizedRecommendationEngine.getInstance();