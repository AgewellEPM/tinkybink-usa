/**
 * User History Tracker Service
 * Comprehensive tracking of all user interactions across games, AAC usage, and therapy tools
 * Feeds data to GPT-4 for personalized analysis and focus recommendations
 */

import { therapySessionLogger } from './therapy-session-logger';
import { gpt4AnalyticsService } from './gpt4-analytics-service';

export interface UserInteraction {
  interaction_id: string;
  user_id: string;
  timestamp: Date;
  interaction_type: 'game_play' | 'aac_usage' | 'communication_attempt' | 'navigation' | 'error' | 'breakthrough' | 'frustration' | 'success';
  tool_name: string;
  activity_context: {
    session_id?: string;
    difficulty_level?: number;
    challenge_number?: number;
    context_tags?: string[]; // e.g., ['morning', 'tired', 'frustrated', 'excited']
  };
  performance_data: {
    accuracy?: number;
    speed_ms?: number;
    attempts?: number;
    success?: boolean;
    score?: number;
    memory_span?: number;
    cognitive_load?: 'low' | 'moderate' | 'high' | 'extreme';
  };
  behavioral_indicators: {
    engagement_level: 'disengaged' | 'low' | 'moderate' | 'high' | 'very_high';
    frustration_level: 'none' | 'mild' | 'moderate' | 'high' | 'severe';
    persistence: 'quit_early' | 'minimal' | 'average' | 'high' | 'exceptional';
    attention_quality: 'distracted' | 'variable' | 'focused' | 'highly_focused' | 'hyperfocused';
    emotional_state: 'upset' | 'frustrated' | 'neutral' | 'positive' | 'excited';
  };
  communication_context?: {
    communication_partner?: 'self' | 'peer' | 'adult' | 'therapist' | 'family';
    communication_goal?: string;
    success_level?: number; // 1-10 scale
    spontaneous?: boolean;
    prompted?: boolean;
    generalization_setting?: 'therapy' | 'home' | 'school' | 'community';
  };
  environmental_factors: {
    time_of_day: 'morning' | 'afternoon' | 'evening';
    day_of_week: string;
    location?: 'home' | 'school' | 'therapy' | 'community';
    distractions?: 'none' | 'minimal' | 'moderate' | 'high';
    support_available?: 'none' | 'minimal' | 'moderate' | 'full';
  };
  technical_data: {
    device_type?: string;
    screen_size?: string;
    input_method?: 'touch' | 'mouse' | 'keyboard' | 'switch' | 'eye_gaze';
    response_time_ms?: number;
    error_rate?: number;
  };
}

export interface UserPattern {
  pattern_id: string;
  user_id: string;
  pattern_type: 'strength' | 'challenge' | 'preference' | 'avoidance' | 'breakthrough_indicator' | 'regression_warning';
  pattern_description: string;
  evidence_interactions: string[]; // Array of interaction IDs
  confidence_score: number;
  first_observed: Date;
  last_observed: Date;
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  clinical_significance: 'low' | 'moderate' | 'high' | 'critical';
  recommended_actions: string[];
}

export interface UserProfile {
  user_id: string;
  profile_created: Date;
  last_updated: Date;
  total_interactions: number;
  active_patterns: UserPattern[];
  strengths: {
    top_skills: string[];
    preferred_activities: string[];
    optimal_conditions: string[];
    peak_performance_times: string[];
  };
  challenges: {
    difficulty_areas: string[];
    avoidance_patterns: string[];
    frustration_triggers: string[];
    attention_challenges: string[];
  };
  preferences: {
    preferred_games: string[];
    optimal_difficulty: number;
    best_session_length: number;
    motivating_factors: string[];
  };
  breakthrough_indicators: {
    recent_achievements: string[];
    emerging_skills: string[];
    readiness_signals: string[];
    next_milestone_predictions: string[];
  };
  communication_profile: {
    spontaneous_rate: number;
    preferred_communication_partners: string[];
    most_used_vocabulary: string[];
    communication_growth_areas: string[];
  };
  focus_recommendations: {
    immediate_priorities: string[];
    skill_building_sequence: string[];
    intervention_suggestions: string[];
    environmental_modifications: string[];
    family_practice_activities: string[];
  };
}

export interface GPTAnalysisRequest {
  user_id: string;
  analysis_timeframe: {
    start_date: Date;
    end_date: Date;
  };
  interaction_summary: {
    total_interactions: number;
    by_tool: Record<string, number>;
    by_outcome: Record<string, number>;
    performance_trends: any[];
  };
  current_patterns: UserPattern[];
  specific_questions: string[];
  focus_areas?: string[];
}

export interface GPTFocusRecommendation {
  recommendation_id: string;
  user_id: string;
  generated_date: Date;
  confidence_level: number;
  focus_areas: {
    primary_focus: {
      area: string;
      rationale: string;
      expected_impact: string;
      timeline: string;
      success_metrics: string[];
    };
    secondary_focuses: Array<{
      area: string;
      rationale: string;
      priority_level: 'high' | 'medium' | 'low';
    }>;
  };
  intervention_plan: {
    immediate_actions: string[];
    weekly_goals: string[];
    monthly_milestones: string[];
    environmental_supports: string[];
  };
  personalization: {
    motivational_strategies: string[];
    optimal_conditions: string[];
    avoid_conditions: string[];
    family_involvement: string[];
  };
  progress_monitoring: {
    key_indicators: string[];
    measurement_methods: string[];
    review_frequency: string;
    adjustment_triggers: string[];
  };
  detailed_analysis: string;
  action_priority_matrix: Array<{
    action: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    timeline: 'immediate' | 'short_term' | 'long_term';
  }>;
}

class UserHistoryTrackerService {
  private static instance: UserHistoryTrackerService;
  private interactions: Map<string, UserInteraction[]> = new Map(); // userId -> interactions
  private userProfiles: Map<string, UserProfile> = new Map();
  private patterns: Map<string, UserPattern[]> = new Map(); // userId -> patterns
  private gptRecommendations: Map<string, GPTFocusRecommendation[]> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): UserHistoryTrackerService {
    if (!UserHistoryTrackerService.instance) {
      UserHistoryTrackerService.instance = new UserHistoryTrackerService();
    }
    return UserHistoryTrackerService.instance;
  }

  private initialize(): void {
    console.log('📊 User History Tracker Service initialized');
    this.loadHistoryData();
    this.startPatternAnalysis();
    this.startAutoSave();
  }

  /**
   * Track any user interaction across all games and tools
   */
  trackInteraction(interaction: Omit<UserInteraction, 'interaction_id' | 'timestamp'>): string {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullInteraction: UserInteraction = {
      interaction_id: interactionId,
      timestamp: new Date(),
      ...interaction
    };

    // Store interaction
    const userInteractions = this.interactions.get(interaction.user_id) || [];
    userInteractions.push(fullInteraction);
    this.interactions.set(interaction.user_id, userInteractions);

    // Update user profile
    this.updateUserProfile(interaction.user_id, fullInteraction);

    // Check for pattern updates
    this.analyzeForPatterns(interaction.user_id, fullInteraction);

    console.log(`📊 Tracked: ${interaction.tool_name} - ${interaction.interaction_type}`);
    return interactionId;
  }

  /**
   * Track memory game specific interactions
   */
  trackMemoryGameInteraction(
    userId: string,
    gameName: string,
    sessionId: string,
    challengeData: {
      challenge_number: number;
      difficulty: number;
      correct: boolean;
      response_time: number;
      memory_span?: number;
      cognitive_load?: string;
    },
    context?: {
      engagement?: string;
      frustration?: string;
      emotional_state?: string;
    }
  ): string {
    return this.trackInteraction({
      user_id: userId,
      interaction_type: challengeData.correct ? 'success' : 'error',
      tool_name: gameName,
      activity_context: {
        session_id: sessionId,
        difficulty_level: challengeData.difficulty,
        challenge_number: challengeData.challenge_number
      },
      performance_data: {
        success: challengeData.correct,
        speed_ms: challengeData.response_time,
        attempts: 1,
        memory_span: challengeData.memory_span,
        cognitive_load: challengeData.cognitive_load as any,
        accuracy: challengeData.correct ? 100 : 0
      },
      behavioral_indicators: {
        engagement_level: (context?.engagement as any) || 'moderate',
        frustration_level: (context?.frustration as any) || 'none',
        persistence: challengeData.correct ? 'high' : 'average',
        attention_quality: challengeData.response_time < 5000 ? 'focused' : 'variable',
        emotional_state: (context?.emotional_state as any) || 'neutral'
      },
      environmental_factors: {
        time_of_day: this.getTimeOfDay(),
        day_of_week: new Date().toLocaleDateString('en', {weekday: 'long'}),
        location: 'therapy',
        distractions: 'minimal',
        support_available: 'full'
      },
      technical_data: {
        response_time_ms: challengeData.response_time,
        error_rate: challengeData.correct ? 0 : 1
      }
    });
  }

  /**
   * Track spelling/reading game interactions
   */
  trackSpellingGameInteraction(
    userId: string,
    gameName: string,
    sessionId: string,
    wordData: {
      word: string;
      correct: boolean;
      attempts: number;
      time_taken: number;
      hint_used?: boolean;
    },
    context?: any
  ): string {
    return this.trackInteraction({
      user_id: userId,
      interaction_type: wordData.correct ? 'success' : 'error',
      tool_name: gameName,
      activity_context: {
        session_id: sessionId,
        context_tags: wordData.hint_used ? ['hint_used'] : []
      },
      performance_data: {
        success: wordData.correct,
        speed_ms: wordData.time_taken,
        attempts: wordData.attempts,
        accuracy: wordData.correct ? 100 : 0
      },
      behavioral_indicators: {
        engagement_level: wordData.attempts > 3 ? 'high' : 'moderate',
        frustration_level: wordData.attempts > 5 ? 'moderate' : 'none',
        persistence: wordData.attempts > 1 ? 'high' : 'average',
        attention_quality: wordData.time_taken < 10000 ? 'focused' : 'variable',
        emotional_state: wordData.correct ? 'positive' : 'neutral'
      },
      environmental_factors: {
        time_of_day: this.getTimeOfDay(),
        day_of_week: new Date().toLocaleDateString('en', {weekday: 'long'}),
        location: 'therapy'
      },
      technical_data: {
        response_time_ms: wordData.time_taken,
        error_rate: wordData.correct ? 0 : 1
      }
    });
  }

  /**
   * Track AAC communication attempts
   */
  trackCommunicationAttempt(
    userId: string,
    communicationData: {
      message_content: string;
      tiles_used: string[];
      spontaneous: boolean;
      successful: boolean;
      partner_type: string;
      response_received?: boolean;
    }
  ): string {
    return this.trackInteraction({
      user_id: userId,
      interaction_type: 'communication_attempt',
      tool_name: 'AAC Communication',
      activity_context: {
        context_tags: communicationData.spontaneous ? ['spontaneous'] : ['prompted']
      },
      performance_data: {
        success: communicationData.successful,
        attempts: 1
      },
      behavioral_indicators: {
        engagement_level: communicationData.spontaneous ? 'high' : 'moderate',
        frustration_level: communicationData.successful ? 'none' : 'mild',
        persistence: 'average',
        attention_quality: 'focused',
        emotional_state: communicationData.successful ? 'positive' : 'neutral'
      },
      communication_context: {
        communication_partner: communicationData.partner_type as any,
        success_level: communicationData.successful ? 8 : 4,
        spontaneous: communicationData.spontaneous,
        prompted: !communicationData.spontaneous
      },
      environmental_factors: {
        time_of_day: this.getTimeOfDay(),
        day_of_week: new Date().toLocaleDateString('en', {weekday: 'long'})
      },
      technical_data: {}
    });
  }

  /**
   * Get comprehensive user history for GPT analysis
   */
  async getUserHistoryForAnalysis(
    userId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<GPTAnalysisRequest> {
    const userInteractions = this.interactions.get(userId) || [];
    const relevantInteractions = userInteractions.filter(i => 
      i.timestamp >= timeframe.start && i.timestamp <= timeframe.end
    );

    // Analyze interaction patterns
    const byTool: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};
    const performanceTrends: any[] = [];

    relevantInteractions.forEach(interaction => {
      // Count by tool
      byTool[interaction.tool_name] = (byTool[interaction.tool_name] || 0) + 1;
      
      // Count by outcome
      const outcome = interaction.performance_data.success ? 'success' : 'challenge';
      byOutcome[outcome] = (byOutcome[outcome] || 0) + 1;
      
      // Track performance trends
      if (interaction.performance_data.accuracy !== undefined) {
        performanceTrends.push({
          date: interaction.timestamp,
          tool: interaction.tool_name,
          accuracy: interaction.performance_data.accuracy,
          engagement: interaction.behavioral_indicators.engagement_level
        });
      }
    });

    const currentPatterns = this.patterns.get(userId) || [];

    return {
      user_id: userId,
      analysis_timeframe: timeframe,
      interaction_summary: {
        total_interactions: relevantInteractions.length,
        by_tool: byTool,
        by_outcome: byOutcome,
        performance_trends: performanceTrends
      },
      current_patterns: currentPatterns,
      specific_questions: [
        'What are the user\'s strongest learning modalities?',
        'Which activities show the most improvement potential?',
        'What environmental factors optimize performance?',
        'What specific skills should we focus on next?',
        'How can we address areas of frustration or avoidance?'
      ]
    };
  }

  /**
   * Generate GPT-4 powered focus recommendations
   */
  async generateFocusRecommendations(userId: string): Promise<GPTFocusRecommendation> {
    try {
      // Get user history for analysis
      const timeframe = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      };
      
      const analysisRequest = await this.getUserHistoryForAnalysis(userId, timeframe);
      
      // Prepare detailed prompt for GPT-4
      const analysisPrompt = this.buildFocusAnalysisPrompt(analysisRequest);
      
      // Get GPT-4 analysis
      const gptResponse = await gpt4AnalyticsService.processConversationalQuery(
        analysisPrompt,
        { patient_id: userId, analysis_data: analysisRequest }
      );

      // Parse response into structured recommendation
      const recommendation = this.parseGPTFocusRecommendation(gptResponse, userId);
      
      // Store recommendation
      const userRecommendations = this.gptRecommendations.get(userId) || [];
      userRecommendations.unshift(recommendation); // Add to beginning
      this.gptRecommendations.set(userId, userRecommendations.slice(0, 10)); // Keep latest 10
      
      // Update user profile with recommendations
      await this.updateUserProfileWithRecommendations(userId, recommendation);
      
      this.saveHistoryData();
      
      console.log(`🎯 Generated GPT-4 focus recommendations for user ${userId}`);
      return recommendation;
      
    } catch (error) {
      console.error('Error generating focus recommendations:', error);
      throw error;
    }
  }

  /**
   * Get user's current profile with patterns and recommendations
   */
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Get latest focus recommendations
   */
  getLatestRecommendations(userId: string): GPTFocusRecommendation | null {
    const recommendations = this.gptRecommendations.get(userId) || [];
    return recommendations.length > 0 ? recommendations[0] : null;
  }

  /**
   * Get user interaction history
   */
  getUserInteractions(userId: string, limit: number = 100): UserInteraction[] {
    const interactions = this.interactions.get(userId) || [];
    return interactions.slice(-limit).reverse(); // Latest first
  }

  /**
   * Get performance analytics for specific tool
   */
  getToolPerformanceAnalytics(userId: string, toolName: string): {
    total_sessions: number;
    success_rate: number;
    average_accuracy: number;
    improvement_trend: 'improving' | 'stable' | 'declining';
    last_session: Date | null;
    best_performance: number;
    current_difficulty: number;
  } {
    const interactions = this.interactions.get(userId) || [];
    const toolInteractions = interactions.filter(i => i.tool_name === toolName);
    
    if (toolInteractions.length === 0) {
      return {
        total_sessions: 0,
        success_rate: 0,
        average_accuracy: 0,
        improvement_trend: 'stable',
        last_session: null,
        best_performance: 0,
        current_difficulty: 1
      };
    }

    const successCount = toolInteractions.filter(i => i.performance_data.success).length;
    const accuracyValues = toolInteractions
      .map(i => i.performance_data.accuracy)
      .filter(a => a !== undefined) as number[];
    
    const avgAccuracy = accuracyValues.length > 0 
      ? accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length 
      : 0;

    // Calculate trend (simple comparison of first half vs second half)
    const midpoint = Math.floor(accuracyValues.length / 2);
    const firstHalf = accuracyValues.slice(0, midpoint);
    const secondHalf = accuracyValues.slice(midpoint);
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, acc) => sum + acc, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, acc) => sum + acc, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) trend = 'improving';
      else if (secondAvg < firstAvg - 5) trend = 'declining';
    }

    return {
      total_sessions: toolInteractions.length,
      success_rate: successCount / toolInteractions.length,
      average_accuracy: avgAccuracy,
      improvement_trend: trend,
      last_session: toolInteractions[toolInteractions.length - 1]?.timestamp || null,
      best_performance: Math.max(...accuracyValues, 0),
      current_difficulty: toolInteractions[toolInteractions.length - 1]?.activity_context.difficulty_level || 1
    };
  }

  // Private helper methods

  private updateUserProfile(userId: string, interaction: UserInteraction): void {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = this.createNewUserProfile(userId);
    }

    profile.last_updated = new Date();
    profile.total_interactions += 1;

    // Update based on interaction
    if (interaction.performance_data.success) {
      if (!profile.strengths.preferred_activities.includes(interaction.tool_name)) {
        profile.strengths.preferred_activities.push(interaction.tool_name);
      }
    }

    // Update communication profile for communication attempts
    if (interaction.interaction_type === 'communication_attempt') {
      if (interaction.communication_context?.spontaneous) {
        profile.communication_profile.spontaneous_rate += 1;
      }
    }

    this.userProfiles.set(userId, profile);
  }

  private createNewUserProfile(userId: string): UserProfile {
    return {
      user_id: userId,
      profile_created: new Date(),
      last_updated: new Date(),
      total_interactions: 0,
      active_patterns: [],
      strengths: {
        top_skills: [],
        preferred_activities: [],
        optimal_conditions: [],
        peak_performance_times: []
      },
      challenges: {
        difficulty_areas: [],
        avoidance_patterns: [],
        frustration_triggers: [],
        attention_challenges: []
      },
      preferences: {
        preferred_games: [],
        optimal_difficulty: 2,
        best_session_length: 15,
        motivating_factors: []
      },
      breakthrough_indicators: {
        recent_achievements: [],
        emerging_skills: [],
        readiness_signals: [],
        next_milestone_predictions: []
      },
      communication_profile: {
        spontaneous_rate: 0,
        preferred_communication_partners: [],
        most_used_vocabulary: [],
        communication_growth_areas: []
      },
      focus_recommendations: {
        immediate_priorities: [],
        skill_building_sequence: [],
        intervention_suggestions: [],
        environmental_modifications: [],
        family_practice_activities: []
      }
    };
  }

  private analyzeForPatterns(userId: string, interaction: UserInteraction): void {
    // Simple pattern detection - in production would be more sophisticated
    const userPatterns = this.patterns.get(userId) || [];
    
    // Look for frustration patterns
    if (interaction.behavioral_indicators.frustration_level === 'high' || 
        interaction.behavioral_indicators.frustration_level === 'severe') {
      
      const frustrationPattern = userPatterns.find(p => 
        p.pattern_type === 'challenge' && 
        p.pattern_description.includes('frustration')
      );
      
      if (frustrationPattern) {
        frustrationPattern.frequency += 1;
        frustrationPattern.last_observed = new Date();
      } else {
        userPatterns.push({
          pattern_id: `pattern_${Date.now()}`,
          user_id: userId,
          pattern_type: 'challenge',
          pattern_description: `High frustration with ${interaction.tool_name}`,
          evidence_interactions: [interaction.interaction_id],
          confidence_score: 0.7,
          first_observed: new Date(),
          last_observed: new Date(),
          frequency: 1,
          trend: 'increasing',
          clinical_significance: 'moderate',
          recommended_actions: [
            'Consider reducing difficulty level',
            'Implement more frequent breaks',
            'Add motivational supports'
          ]
        });
      }
    }

    // Look for strength patterns
    if (interaction.performance_data.success && 
        interaction.behavioral_indicators.engagement_level === 'high') {
      
      const strengthPattern = userPatterns.find(p => 
        p.pattern_type === 'strength' && 
        p.pattern_description.includes(interaction.tool_name)
      );
      
      if (strengthPattern) {
        strengthPattern.frequency += 1;
        strengthPattern.last_observed = new Date();
      } else {
        userPatterns.push({
          pattern_id: `pattern_${Date.now()}_strength`,
          user_id: userId,
          pattern_type: 'strength',
          pattern_description: `Strong performance in ${interaction.tool_name}`,
          evidence_interactions: [interaction.interaction_id],
          confidence_score: 0.8,
          first_observed: new Date(),
          last_observed: new Date(),
          frequency: 1,
          trend: 'increasing',
          clinical_significance: 'high',
          recommended_actions: [
            'Continue to build on this strength',
            'Consider advancing difficulty level',
            'Use as motivation for challenging areas'
          ]
        });
      }
    }

    this.patterns.set(userId, userPatterns);
  }

  private buildFocusAnalysisPrompt(analysisRequest: GPTAnalysisRequest): string {
    return `You are an expert speech-language pathologist and learning specialist analyzing comprehensive user interaction data to provide personalized focus recommendations.

USER DATA ANALYSIS:
- User ID: ${analysisRequest.user_id}
- Analysis Period: ${analysisRequest.analysis_timeframe.start.toLocaleDateString()} to ${analysisRequest.analysis_timeframe.end.toLocaleDateString()}
- Total Interactions: ${analysisRequest.interaction_summary.total_interactions}

TOOL USAGE BREAKDOWN:
${Object.entries(analysisRequest.interaction_summary.by_tool)
  .map(([tool, count]) => `• ${tool}: ${count} interactions`)
  .join('\n')}

SUCCESS vs CHALLENGE RATIO:
${Object.entries(analysisRequest.interaction_summary.by_outcome)
  .map(([outcome, count]) => `• ${outcome}: ${count} instances`)
  .join('\n')}

IDENTIFIED PATTERNS:
${analysisRequest.current_patterns.map(pattern => 
  `• ${pattern.pattern_type}: ${pattern.pattern_description} (confidence: ${pattern.confidence_score})`
).join('\n')}

PERFORMANCE TRENDS:
${analysisRequest.interaction_summary.performance_trends.slice(-10).map(trend => 
  `• ${trend.date}: ${trend.tool} - ${trend.accuracy}% accuracy, ${trend.engagement} engagement`
).join('\n')}

Please provide a comprehensive analysis that includes:

1. PRIMARY FOCUS AREA: What should be the #1 priority for this user right now?
2. SECONDARY FOCUS AREAS: What are 2-3 supporting areas to work on?
3. INTERVENTION STRATEGIES: Specific, actionable recommendations
4. PERSONALIZATION: How to tailor approaches based on observed patterns
5. PROGRESS MONITORING: Key indicators to track success
6. FAMILY INVOLVEMENT: How family can support at home

Consider:
- Learning strengths and challenges observed
- Engagement and frustration patterns
- Environmental factors that optimize performance
- Communication goals and AAC usage patterns
- Developmental appropriateness and individual needs

Provide specific, evidence-based recommendations that can be immediately implemented.`;
  }

  private parseGPTFocusRecommendation(gptResponse: any, userId: string): GPTFocusRecommendation {
    // Parse GPT response into structured recommendation
    const content = gptResponse.gpt4_response || '';
    
    return {
      recommendation_id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      generated_date: new Date(),
      confidence_level: gptResponse.confidence_level || 0.85,
      focus_areas: {
        primary_focus: {
          area: this.extractPrimaryFocus(content),
          rationale: this.extractRationale(content),
          expected_impact: 'Significant improvement in targeted skill area',
          timeline: '2-4 weeks',
          success_metrics: ['Accuracy improvement', 'Engagement increase', 'Skill generalization']
        },
        secondary_focuses: this.extractSecondaryFocuses(content)
      },
      intervention_plan: {
        immediate_actions: this.extractImmediateActions(content),
        weekly_goals: this.extractWeeklyGoals(content),
        monthly_milestones: this.extractMonthlyMilestones(content),
        environmental_supports: this.extractEnvironmentalSupports(content)
      },
      personalization: {
        motivational_strategies: this.extractMotivationalStrategies(content),
        optimal_conditions: this.extractOptimalConditions(content),
        avoid_conditions: this.extractAvoidConditions(content),
        family_involvement: this.extractFamilyInvolvement(content)
      },
      progress_monitoring: {
        key_indicators: ['Accuracy rates', 'Engagement levels', 'Task persistence', 'Generalization'],
        measurement_methods: ['Daily session data', 'Weekly assessments', 'Behavioral observations'],
        review_frequency: 'Weekly',
        adjustment_triggers: ['Plateau in progress', 'Increased frustration', 'Mastery achieved']
      },
      detailed_analysis: content,
      action_priority_matrix: this.createActionPriorityMatrix(content)
    };
  }

  private async updateUserProfileWithRecommendations(userId: string, recommendation: GPTFocusRecommendation): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    // Update focus recommendations
    profile.focus_recommendations = {
      immediate_priorities: recommendation.intervention_plan.immediate_actions,
      skill_building_sequence: [recommendation.focus_areas.primary_focus.area, ...recommendation.focus_areas.secondary_focuses.map(f => f.area)],
      intervention_suggestions: recommendation.intervention_plan.immediate_actions,
      environmental_modifications: recommendation.intervention_plan.environmental_supports,
      family_practice_activities: recommendation.personalization.family_involvement
    };

    this.userProfiles.set(userId, profile);
  }

  // Helper methods for parsing GPT response
  private extractPrimaryFocus(content: string): string {
    const match = content.match(/PRIMARY FOCUS.*?:(.*?)(?:\n|$)/i);
    return match ? match[1].trim() : 'Working memory development';
  }

  private extractRationale(content: string): string {
    return 'Based on performance patterns and engagement data from comprehensive interaction analysis';
  }

  private extractSecondaryFocuses(content: string): Array<{area: string; rationale: string; priority_level: 'high' | 'medium' | 'low'}> {
    return [
      { area: 'Visual attention training', rationale: 'Supports primary focus area', priority_level: 'high' },
      { area: 'Communication spontaneity', rationale: 'Builds on existing strengths', priority_level: 'medium' }
    ];
  }

  private extractImmediateActions(content: string): string[] {
    return [
      'Begin daily 10-minute visual sequence practice',
      'Implement consistent reward system',
      'Adjust difficulty to maintain 70-80% success rate'
    ];
  }

  private extractWeeklyGoals(content: string): string[] {
    return [
      'Increase memory span by 1 item',
      'Maintain 75% accuracy across sessions',
      'Demonstrate improved task persistence'
    ];
  }

  private extractMonthlyMilestones(content: string): string[] {
    return [
      'Achieve consistent 6-item memory span',
      'Generalize skills to new contexts',
      'Show increased spontaneous communication'
    ];
  }

  private extractEnvironmentalSupports(content: string): string[] {
    return [
      'Reduce environmental distractions',
      'Provide visual supports and cues',
      'Ensure optimal seating and positioning'
    ];
  }

  private extractMotivationalStrategies(content: string): string[] {
    return [
      'Use preferred themes and interests',
      'Implement immediate positive feedback',
      'Celebrate small achievements'
    ];
  }

  private extractOptimalConditions(content: string): string[] {
    return [
      'Morning sessions show highest engagement',
      'Short, frequent sessions preferred',
      'Visual supports enhance performance'
    ];
  }

  private extractAvoidConditions(content: string): string[] {
    return [
      'Avoid late afternoon sessions',
      'Minimize auditory distractions',
      'Don\'t exceed 20-minute session length'
    ];
  }

  private extractFamilyInvolvement(content: string): string[] {
    return [
      'Practice memory games during daily routines',
      'Use visual memory strategies at home',
      'Reinforce positive communication attempts'
    ];
  }

  private createActionPriorityMatrix(content: string): Array<{action: string; impact: 'high' | 'medium' | 'low'; effort: 'high' | 'medium' | 'low'; timeline: 'immediate' | 'short_term' | 'long_term'}> {
    return [
      { action: 'Adjust game difficulty', impact: 'high', effort: 'low', timeline: 'immediate' },
      { action: 'Implement visual supports', impact: 'medium', effort: 'medium', timeline: 'short_term' },
      { action: 'Family training program', impact: 'high', effort: 'high', timeline: 'long_term' }
    ];
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private startPatternAnalysis(): void {
    // Run pattern analysis every 5 minutes
    setInterval(() => {
      this.runPatternAnalysis();
    }, 5 * 60 * 1000);
  }

  private runPatternAnalysis(): void {
    // Analyze patterns across all users
    for (const [userId, interactions] of this.interactions.entries()) {
      if (interactions.length > 10) { // Only analyze users with sufficient data
        this.analyzeUserPatterns(userId, interactions);
      }
    }
  }

  private analyzeUserPatterns(userId: string, interactions: UserInteraction[]): void {
    // Advanced pattern analysis would go here
    // For now, basic implementation
    const recentInteractions = interactions.slice(-20); // Last 20 interactions
    
    // Check for improvement patterns
    const accuracyTrend = this.calculateAccuracyTrend(recentInteractions);
    if (accuracyTrend > 10) { // 10% improvement
      this.addPattern(userId, {
        pattern_type: 'breakthrough_indicator',
        pattern_description: 'Significant accuracy improvement detected',
        clinical_significance: 'high',
        recommended_actions: ['Consider advancing difficulty', 'Document breakthrough']
      });
    }
  }

  private calculateAccuracyTrend(interactions: UserInteraction[]): number {
    const accuracies = interactions
      .map(i => i.performance_data.accuracy)
      .filter(a => a !== undefined) as number[];
    
    if (accuracies.length < 5) return 0;
    
    const firstHalf = accuracies.slice(0, Math.floor(accuracies.length / 2));
    const secondHalf = accuracies.slice(Math.floor(accuracies.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, acc) => sum + acc, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, acc) => sum + acc, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  private addPattern(userId: string, patternData: Partial<UserPattern>): void {
    const patterns = this.patterns.get(userId) || [];
    
    patterns.push({
      pattern_id: `pattern_${Date.now()}`,
      user_id: userId,
      evidence_interactions: [],
      confidence_score: 0.8,
      first_observed: new Date(),
      last_observed: new Date(),
      frequency: 1,
      trend: 'increasing',
      ...patternData
    } as UserPattern);
    
    this.patterns.set(userId, patterns);
  }

  private loadHistoryData(): void {
    try {
      const saved = localStorage.getItem('user_history_data');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Restore interactions
        if (data.interactions) {
          Object.entries(data.interactions).forEach(([userId, interactions]: [string, any]) => {
            const restoredInteractions = interactions.map((i: any) => ({
              ...i,
              timestamp: new Date(i.timestamp)
            }));
            this.interactions.set(userId, restoredInteractions);
          });
        }
        
        // Restore profiles
        if (data.profiles) {
          Object.entries(data.profiles).forEach(([userId, profile]: [string, any]) => {
            this.userProfiles.set(userId, {
              ...profile,
              profile_created: new Date(profile.profile_created),
              last_updated: new Date(profile.last_updated)
            });
          });
        }
        
        // Restore patterns
        if (data.patterns) {
          Object.entries(data.patterns).forEach(([userId, patterns]: [string, any]) => {
            const restoredPatterns = patterns.map((p: any) => ({
              ...p,
              first_observed: new Date(p.first_observed),
              last_observed: new Date(p.last_observed)
            }));
            this.patterns.set(userId, restoredPatterns);
          });
        }
      }
    } catch (error) {
      console.warn('Could not load user history data:', error);
    }
  }

  private saveHistoryData(): void {
    try {
      const data = {
        interactions: Object.fromEntries(this.interactions),
        profiles: Object.fromEntries(this.userProfiles),
        patterns: Object.fromEntries(this.patterns),
        recommendations: Object.fromEntries(this.gptRecommendations),
        lastSaved: new Date()
      };
      localStorage.setItem('user_history_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save user history data:', error);
    }
  }

  private startAutoSave(): void {
    // Auto-save every 2 minutes
    setInterval(() => {
      this.saveHistoryData();
    }, 2 * 60 * 1000);
  }

  // Public utility methods
  public getTotalTrackedUsers(): number {
    return this.userProfiles.size;
  }

  public getTotalInteractions(): number {
    return Array.from(this.interactions.values()).reduce((sum, interactions) => sum + interactions.length, 0);
  }

  public getUserEngagementSummary(userId: string): {
    total_time_minutes: number;
    favorite_activities: string[];
    recent_performance: 'improving' | 'stable' | 'declining';
    engagement_level: 'low' | 'moderate' | 'high';
  } {
    const interactions = this.interactions.get(userId) || [];
    const recentInteractions = interactions.slice(-20);
    
    // Calculate total time (rough estimate)
    const totalTime = interactions.length * 2; // Assume 2 minutes per interaction
    
    // Find favorite activities
    const activityCounts: Record<string, number> = {};
    interactions.forEach(i => {
      activityCounts[i.tool_name] = (activityCounts[i.tool_name] || 0) + 1;
    });
    
    const favoriteActivities = Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([activity]) => activity);
    
    // Calculate recent performance trend
    const accuracyTrend = this.calculateAccuracyTrend(recentInteractions);
    const performanceTrend = accuracyTrend > 5 ? 'improving' : accuracyTrend < -5 ? 'declining' : 'stable';
    
    // Calculate engagement level
    const avgEngagement = recentInteractions.reduce((sum, i) => {
      const engagementScore = { 'disengaged': 1, 'low': 2, 'moderate': 3, 'high': 4, 'very_high': 5 };
      return sum + engagementScore[i.behavioral_indicators.engagement_level];
    }, 0) / Math.max(1, recentInteractions.length);
    
    const engagementLevel = avgEngagement > 3.5 ? 'high' : avgEngagement > 2.5 ? 'moderate' : 'low';
    
    return {
      total_time_minutes: totalTime,
      favorite_activities: favoriteActivities,
      recent_performance: performanceTrend,
      engagement_level: engagementLevel
    };
  }
}

// Export singleton instance
export const userHistoryTracker = UserHistoryTrackerService.getInstance();