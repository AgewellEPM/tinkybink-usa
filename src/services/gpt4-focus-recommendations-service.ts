/**
 * GPT-4 Focus Recommendations Service
 * Advanced AI-powered analysis of user learning patterns to generate personalized focus recommendations
 * Integrates with user history tracking and therapeutic goals for comprehensive educational guidance
 */

import { userHistoryTrackingService, UserAnalytics, LearningProgress, BreakthroughMoment } from './user-history-tracking-service';
import { therapySessionLogger } from './therapy-session-logger';

export interface FocusRecommendation {
  recommendation_id: string;
  user_id: string;
  generated_at: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  focus_area: string;
  recommendation_type: 'skill_building' | 'reinforcement' | 'challenge_progression' | 'remediation' | 'maintenance';
  specific_activities: string[];
  expected_outcomes: string[];
  timeframe: {
    duration_weeks: number;
    sessions_per_week: number;
    minutes_per_session: number;
  };
  rationale: string;
  confidence_score: number;
  supporting_data: {
    user_patterns: string[];
    performance_trends: string[];
    therapeutic_alignment: string[];
  };
}

export interface LearningPathway {
  pathway_id: string;
  user_id: string;
  created_at: Date;
  pathway_name: string;
  current_phase: number;
  total_phases: number;
  phases: LearningPhase[];
  adaptive_adjustments: AdaptiveAdjustment[];
  success_metrics: SuccessMetric[];
  estimated_completion: Date;
}

export interface LearningPhase {
  phase_number: number;
  phase_name: string;
  focus_skills: string[];
  target_mastery_level: number;
  estimated_duration_weeks: number;
  key_activities: string[];
  assessment_criteria: string[];
  transition_requirements: string[];
}

export interface AdaptiveAdjustment {
  adjustment_id: string;
  timestamp: Date;
  trigger_event: string;
  adjustment_type: 'difficulty_increase' | 'difficulty_decrease' | 'focus_shift' | 'pacing_change';
  previous_plan: any;
  new_plan: any;
  rationale: string;
}

export interface SuccessMetric {
  metric_name: string;
  current_value: number;
  target_value: number;
  measurement_unit: string;
  tracking_frequency: 'daily' | 'weekly' | 'monthly';
  last_measured: Date;
}

export interface GPTAnalysisRequest {
  user_analytics: UserAnalytics;
  learning_objectives: string[];
  current_challenges: string[];
  therapeutic_goals?: string[];
  context: {
    age_range?: string;
    ability_level?: string;
    communication_needs?: string[];
    learning_preferences?: string[];
  };
}

export interface GPTAnalysisResponse {
  analysis_summary: string;
  key_insights: string[];
  learning_strengths: string[];
  areas_for_improvement: string[];
  recommended_focus_areas: string[];
  suggested_activities: Array<{
    activity_name: string;
    skill_targets: string[];
    difficulty_level: number;
    estimated_engagement: number;
  }>;
  adaptive_strategies: string[];
  progress_predictions: Array<{
    skill_area: string;
    predicted_improvement: number;
    confidence_level: number;
    timeline_weeks: number;
  }>;
}

export class GPT4FocusRecommendationsService {
  private static instance: GPT4FocusRecommendationsService;
  private recommendations: Map<string, FocusRecommendation[]> = new Map();
  private learningPathways: Map<string, LearningPathway> = new Map();
  private analysisCache: Map<string, GPTAnalysisResponse> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): GPT4FocusRecommendationsService {
    if (!GPT4FocusRecommendationsService.instance) {
      GPT4FocusRecommendationsService.instance = new GPT4FocusRecommendationsService();
    }
    return GPT4FocusRecommendationsService.instance;
  }

  private initialize(): void {
    console.log('🧠 GPT-4 Focus Recommendations Service initialized');
    this.loadRecommendationData();
    this.startPeriodicAnalysis();
  }

  /**
   * Generate comprehensive focus recommendations using GPT-4 analysis
   */
  async generateFocusRecommendations(
    userId: string,
    learningObjectives: string[] = [],
    therapeuticGoals: string[] = []
  ): Promise<FocusRecommendation[]> {
    try {
      // Get comprehensive user analytics
      const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 30);
      const learningTrajectory = userHistoryTrackingService.getLearningTrajectory(userId);

      // Prepare GPT analysis request
      const analysisRequest: GPTAnalysisRequest = {
        user_analytics: userAnalytics,
        learning_objectives: learningObjectives,
        current_challenges: learningTrajectory.challenges,
        therapeutic_goals: therapeuticGoals,
        context: {
          ability_level: this.determineAbilityLevel(userAnalytics),
          communication_needs: this.identifyCommunicationNeeds(userAnalytics),
          learning_preferences: this.identifyLearningPreferences(userAnalytics)
        }
      };

      // Get GPT-4 analysis
      const gptAnalysis = await this.performGPTAnalysis(analysisRequest);

      // Convert GPT insights into structured recommendations
      const recommendations = this.convertAnalysisToRecommendations(userId, gptAnalysis, userAnalytics);

      // Store recommendations
      this.recommendations.set(userId, recommendations);
      this.saveRecommendationData();

      console.log(`🎯 Generated ${recommendations.length} focus recommendations for user ${userId}`);
      return recommendations;

    } catch (error) {
      console.error('Failed to generate focus recommendations:', error);
      return this.generateFallbackRecommendations(userId);
    }
  }

  /**
   * Create adaptive learning pathway
   */
  async createLearningPathway(
    userId: string,
    pathwayName: string,
    targetSkills: string[],
    durationWeeks: number = 12
  ): Promise<LearningPathway> {
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 30);
    const recommendations = await this.generateFocusRecommendations(userId, targetSkills);

    // Create phases based on current skill levels and targets
    const phases = this.createLearningPhases(targetSkills, userAnalytics, durationWeeks);

    const pathway: LearningPathway = {
      pathway_id: `pathway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: new Date(),
      pathway_name: pathwayName,
      current_phase: 1,
      total_phases: phases.length,
      phases,
      adaptive_adjustments: [],
      success_metrics: this.createSuccessMetrics(targetSkills),
      estimated_completion: new Date(Date.now() + (durationWeeks * 7 * 24 * 60 * 60 * 1000))
    };

    this.learningPathways.set(userId, pathway);
    this.saveRecommendationData();

    console.log(`🛤️ Created learning pathway: ${pathwayName} for user ${userId}`);
    return pathway;
  }

  /**
   * Adapt learning pathway based on progress
   */
  async adaptLearningPathway(userId: string, progressData: any): Promise<void> {
    const pathway = this.learningPathways.get(userId);
    if (!pathway) return;

    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 7);
    
    // Analyze if adaptation is needed
    const adaptationNeeded = this.assessAdaptationNeeds(pathway, userAnalytics, progressData);
    
    if (adaptationNeeded.required) {
      const adjustment: AdaptiveAdjustment = {
        adjustment_id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        trigger_event: adaptationNeeded.trigger,
        adjustment_type: adaptationNeeded.type,
        previous_plan: { ...pathway.phases[pathway.current_phase - 1] },
        new_plan: adaptationNeeded.newPlan,
        rationale: adaptationNeeded.rationale
      };

      // Apply adjustment
      pathway.phases[pathway.current_phase - 1] = adaptationNeeded.newPlan;
      pathway.adaptive_adjustments.push(adjustment);

      this.saveRecommendationData();
      console.log(`🔄 Adapted learning pathway for user ${userId}: ${adjustment.adjustment_type}`);
    }
  }

  /**
   * Get current focus recommendations for user
   */
  getCurrentRecommendations(userId: string): FocusRecommendation[] {
    const recommendations = this.recommendations.get(userId) || [];
    
    // Filter for current/relevant recommendations
    return recommendations
      .filter(rec => {
        const ageInDays = Math.floor((Date.now() - rec.generated_at.getTime()) / (1000 * 60 * 60 * 24));
        return ageInDays <= 30; // Keep recommendations for 30 days
      })
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  /**
   * Get learning pathway progress
   */
  getPathwayProgress(userId: string): {
    pathway: LearningPathway | null;
    current_phase_progress: number;
    overall_progress: number;
    next_milestones: string[];
    recent_adjustments: AdaptiveAdjustment[];
  } {
    const pathway = this.learningPathways.get(userId);
    if (!pathway) {
      return {
        pathway: null,
        current_phase_progress: 0,
        overall_progress: 0,
        next_milestones: [],
        recent_adjustments: []
      };
    }

    const currentPhase = pathway.phases[pathway.current_phase - 1];
    const userAnalytics = userHistoryTrackingService.generateUserAnalytics(userId, 7);
    
    // Calculate progress based on skill mastery
    const currentPhaseProgress = this.calculatePhaseProgress(currentPhase, userAnalytics);
    const overallProgress = ((pathway.current_phase - 1) + currentPhaseProgress) / pathway.total_phases * 100;

    return {
      pathway,
      current_phase_progress: currentPhaseProgress,
      overall_progress: overallProgress,
      next_milestones: currentPhase.transition_requirements,
      recent_adjustments: pathway.adaptive_adjustments.slice(-3)
    };
  }

  // Private methods

  private async performGPTAnalysis(request: GPTAnalysisRequest): Promise<GPTAnalysisResponse> {
    // Create cache key
    const cacheKey = this.createAnalysisCacheKey(request);
    
    // Check cache first
    const cachedResult = this.analysisCache.get(cacheKey);
    if (cachedResult) {
      console.log('📄 Using cached GPT analysis');
      return cachedResult;
    }

    // Simulate GPT-4 analysis (in production, this would call OpenAI API)
    const analysis = await this.simulateGPTAnalysis(request);
    
    // Cache result
    this.analysisCache.set(cacheKey, analysis);
    
    return analysis;
  }

  private async simulateGPTAnalysis(request: GPTAnalysisRequest): Promise<GPTAnalysisResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { user_analytics, current_challenges, learning_objectives } = request;
    
    // Analyze user patterns
    const strengths = this.identifyStrengths(user_analytics);
    const improvements = this.identifyImprovementAreas(user_analytics, current_challenges);
    const focusAreas = this.prioritizeFocusAreas(improvements, learning_objectives);

    return {
      analysis_summary: this.generateAnalysisSummary(user_analytics, strengths, improvements),
      key_insights: this.generateKeyInsights(user_analytics),
      learning_strengths: strengths,
      areas_for_improvement: improvements,
      recommended_focus_areas: focusAreas,
      suggested_activities: this.suggestActivities(focusAreas, user_analytics),
      adaptive_strategies: this.generateAdaptiveStrategies(user_analytics),
      progress_predictions: this.generateProgressPredictions(user_analytics, focusAreas)
    };
  }

  private identifyStrengths(analytics: UserAnalytics): string[] {
    const strengths: string[] = [];

    // High engagement
    if (analytics.summary.engagement_trend === 'improving') {
      strengths.push('Consistently improving engagement and motivation');
    }

    // Strong consistency
    if (analytics.summary.consistency_score > 75) {
      strengths.push('Excellent practice consistency and routine adherence');
    }

    // Breakthrough performance
    if (analytics.recent_breakthroughs.length > 0) {
      strengths.push('Demonstrating breakthrough learning moments');
    }

    // Skill mastery
    for (const [skill, progress] of analytics.skill_progress.entries()) {
      if (progress.mastery_percentage > 80) {
        strengths.push(`Strong mastery in ${skill}`);
      }
    }

    return strengths.slice(0, 5); // Limit to top 5 strengths
  }

  private identifyImprovementAreas(analytics: UserAnalytics, challenges: string[]): string[] {
    const improvements: string[] = [];

    // Low mastery areas
    for (const [skill, progress] of analytics.skill_progress.entries()) {
      if (progress.mastery_percentage < 40) {
        improvements.push(`Foundational skill building needed in ${skill}`);
      }
    }

    // Engagement issues
    if (analytics.summary.engagement_trend === 'declining') {
      improvements.push('Focus on increasing engagement and motivation strategies');
    }

    // Consistency issues
    if (analytics.summary.consistency_score < 50) {
      improvements.push('Develop more consistent practice routine');
    }

    // Include user-identified challenges
    improvements.push(...challenges.map(challenge => `Address identified challenge: ${challenge}`));

    return improvements.slice(0, 6); // Limit to top 6 improvement areas
  }

  private prioritizeFocusAreas(improvements: string[], objectives: string[]): string[] {
    // Combine improvements and objectives, prioritizing by impact
    const focusAreas = new Set<string>();

    // Add critical improvement areas first
    improvements.slice(0, 3).forEach(improvement => {
      focusAreas.add(improvement);
    });

    // Add learning objectives
    objectives.slice(0, 3).forEach(objective => {
      focusAreas.add(objective);
    });

    return Array.from(focusAreas).slice(0, 5);
  }

  private suggestActivities(focusAreas: string[], analytics: UserAnalytics): Array<{
    activity_name: string;
    skill_targets: string[];
    difficulty_level: number;
    estimated_engagement: number;
  }> {
    const activities = [];

    for (const area of focusAreas.slice(0, 3)) {
      // Map focus areas to specific activities
      if (area.includes('memory')) {
        activities.push({
          activity_name: 'Visual Sequence Memory Game',
          skill_targets: ['working memory', 'visual processing', 'attention'],
          difficulty_level: this.calculateOptimalDifficulty(analytics, 'memory'),
          estimated_engagement: 85
        });
      }

      if (area.includes('communication')) {
        activities.push({
          activity_name: 'AAC Tile Navigation Practice',
          skill_targets: ['symbol recognition', 'navigation skills', 'communication'],
          difficulty_level: this.calculateOptimalDifficulty(analytics, 'communication'),
          estimated_engagement: 90
        });
      }

      if (area.includes('reading')) {
        activities.push({
          activity_name: 'Phonics Tile Building',
          skill_targets: ['phonemic awareness', 'letter-sound correspondence', 'reading'],
          difficulty_level: this.calculateOptimalDifficulty(analytics, 'reading'),
          estimated_engagement: 80
        });
      }
    }

    return activities;
  }

  private calculateOptimalDifficulty(analytics: UserAnalytics, skillType: string): number {
    const skillProgress = analytics.skill_progress.get(skillType);
    if (!skillProgress) return 2; // Default medium difficulty

    // Base difficulty on current mastery level
    if (skillProgress.mastery_percentage > 80) return 4; // High
    if (skillProgress.mastery_percentage > 60) return 3; // Medium-high
    if (skillProgress.mastery_percentage > 40) return 2; // Medium
    return 1; // Low
  }

  private generateAnalysisSummary(analytics: UserAnalytics, strengths: string[], improvements: string[]): string {
    return `User demonstrates ${strengths.length} key strengths including ${strengths[0] || 'active engagement'}. ` +
           `Primary focus should be on ${improvements.length} improvement areas, with emphasis on ${improvements[0] || 'continued practice'}. ` +
           `Current engagement trend is ${analytics.summary.engagement_trend} with ${Math.round(analytics.summary.consistency_score)}% consistency score.`;
  }

  private generateKeyInsights(analytics: UserAnalytics): string[] {
    const insights: string[] = [];

    // Session pattern insights
    if (analytics.summary.average_session_length > 20) {
      insights.push('Demonstrates strong sustained attention capabilities');
    } else if (analytics.summary.average_session_length < 10) {
      insights.push('Benefits from shorter, more frequent practice sessions');
    }

    // Progress rate insights
    const improvingSkills = Array.from(analytics.skill_progress.values())
      .filter(progress => progress.improvement_rate > 0).length;
    
    if (improvingSkills > 2) {
      insights.push('Shows positive learning trajectory across multiple skill areas');
    }

    // Breakthrough insights
    if (analytics.recent_breakthroughs.length > 0) {
      insights.push(`Recent breakthrough in ${analytics.recent_breakthroughs[0].skill_area} indicates readiness for advanced challenges`);
    }

    return insights.slice(0, 4);
  }

  private generateAdaptiveStrategies(analytics: UserAnalytics): string[] {
    const strategies: string[] = [];

    // Engagement strategies
    if (analytics.summary.engagement_trend === 'declining') {
      strategies.push('Introduce variety and choice in activities to renew engagement');
      strategies.push('Implement reward systems and celebration of small wins');
    }

    // Difficulty adjustment strategies
    const avgMastery = Array.from(analytics.skill_progress.values())
      .reduce((sum, progress) => sum + progress.mastery_percentage, 0) / analytics.skill_progress.size;

    if (avgMastery > 75) {
      strategies.push('Gradually increase challenge level to maintain optimal learning zone');
    } else if (avgMastery < 40) {
      strategies.push('Focus on foundational skill building with high success rates');
    }

    // Session timing strategies
    if (analytics.summary.average_session_length < 15) {
      strategies.push('Optimize for shorter, more frequent sessions to match attention span');
    }

    return strategies.slice(0, 4);
  }

  private generateProgressPredictions(analytics: UserAnalytics, focusAreas: string[]): Array<{
    skill_area: string;
    predicted_improvement: number;
    confidence_level: number;
    timeline_weeks: number;
  }> {
    const predictions = [];

    for (const [skill, progress] of analytics.skill_progress.entries()) {
      if (focusAreas.some(area => area.toLowerCase().includes(skill.toLowerCase()))) {
        const improvementRate = Math.max(1, progress.improvement_rate);
        const timelineWeeks = Math.max(2, Math.min(12, (100 - progress.mastery_percentage) / improvementRate));
        
        predictions.push({
          skill_area: skill,
          predicted_improvement: Math.min(30, improvementRate * 4), // 4 weeks of improvement
          confidence_level: Math.min(95, 60 + (progress.sessions_practiced * 2)),
          timeline_weeks: Math.round(timelineWeeks)
        });
      }
    }

    return predictions.slice(0, 3);
  }

  private convertAnalysisToRecommendations(
    userId: string, 
    analysis: GPTAnalysisResponse, 
    userAnalytics: UserAnalytics
  ): FocusRecommendation[] {
    const recommendations: FocusRecommendation[] = [];

    // Create recommendations for each focus area
    for (let i = 0; i < analysis.recommended_focus_areas.length && i < 3; i++) {
      const focusArea = analysis.recommended_focus_areas[i];
      const suggestedActivity = analysis.suggested_activities[i];

      const recommendation: FocusRecommendation = {
        recommendation_id: `rec_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        generated_at: new Date(),
        priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
        focus_area: focusArea,
        recommendation_type: this.determineRecommendationType(focusArea, userAnalytics),
        specific_activities: suggestedActivity ? [suggestedActivity.activity_name] : [`Practice activities for ${focusArea}`],
        expected_outcomes: [`Improvement in ${focusArea}`, 'Increased engagement', 'Skill progression'],
        timeframe: {
          duration_weeks: 4,
          sessions_per_week: 3,
          minutes_per_session: Math.round(userAnalytics.summary.average_session_length)
        },
        rationale: `Based on analysis: ${analysis.areas_for_improvement[i] || focusArea}`,
        confidence_score: 85,
        supporting_data: {
          user_patterns: analysis.key_insights.slice(0, 2),
          performance_trends: [userAnalytics.summary.engagement_trend],
          therapeutic_alignment: analysis.learning_strengths.slice(0, 2)
        }
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  private determineRecommendationType(
    focusArea: string, 
    userAnalytics: UserAnalytics
  ): FocusRecommendation['recommendation_type'] {
    if (focusArea.toLowerCase().includes('foundational') || focusArea.toLowerCase().includes('basic')) {
      return 'skill_building';
    }
    if (focusArea.toLowerCase().includes('challenge') || focusArea.toLowerCase().includes('advanced')) {
      return 'challenge_progression';
    }
    if (focusArea.toLowerCase().includes('maintain') || focusArea.toLowerCase().includes('practice')) {
      return 'maintenance';
    }
    if (focusArea.toLowerCase().includes('reinforc') || focusArea.toLowerCase().includes('strengthen')) {
      return 'reinforcement';
    }
    return 'remediation';
  }

  private generateFallbackRecommendations(userId: string): FocusRecommendation[] {
    // Generate basic recommendations when GPT analysis fails
    return [{
      recommendation_id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      generated_at: new Date(),
      priority: 'medium',
      focus_area: 'General skill practice',
      recommendation_type: 'skill_building',
      specific_activities: ['Continue regular practice sessions', 'Review previous activities'],
      expected_outcomes: ['Maintained engagement', 'Continued progress'],
      timeframe: {
        duration_weeks: 2,
        sessions_per_week: 3,
        minutes_per_session: 20
      },
      rationale: 'Default recommendation due to analysis limitations',
      confidence_score: 60,
      supporting_data: {
        user_patterns: ['Regular activity needed'],
        performance_trends: ['Stable'],
        therapeutic_alignment: ['General development']
      }
    }];
  }

  private createLearningPhases(
    targetSkills: string[], 
    userAnalytics: UserAnalytics, 
    totalWeeks: number
  ): LearningPhase[] {
    const phases: LearningPhase[] = [];
    const weeksPerPhase = Math.ceil(totalWeeks / 3); // 3 phases

    // Foundation Phase
    phases.push({
      phase_number: 1,
      phase_name: 'Foundation Building',
      focus_skills: targetSkills.slice(0, 2),
      target_mastery_level: 60,
      estimated_duration_weeks: weeksPerPhase,
      key_activities: ['Basic skill practice', 'Fundamental exercises'],
      assessment_criteria: ['60% accuracy achieved', 'Consistent engagement'],
      transition_requirements: ['Complete foundation assessments', 'Demonstrate readiness']
    });

    // Development Phase
    phases.push({
      phase_number: 2,
      phase_name: 'Skill Development',
      focus_skills: targetSkills,
      target_mastery_level: 80,
      estimated_duration_weeks: weeksPerPhase,
      key_activities: ['Progressive challenges', 'Integration exercises'],
      assessment_criteria: ['80% accuracy achieved', 'Independent performance'],
      transition_requirements: ['Master key competencies', 'Show consistent progress']
    });

    // Mastery Phase
    phases.push({
      phase_number: 3,
      phase_name: 'Mastery & Generalization',
      focus_skills: [...targetSkills, 'generalization'],
      target_mastery_level: 90,
      estimated_duration_weeks: totalWeeks - (weeksPerPhase * 2),
      key_activities: ['Advanced applications', 'Real-world practice'],
      assessment_criteria: ['90% accuracy achieved', 'Generalized use'],
      transition_requirements: ['Complete mastery demonstration', 'Ready for new challenges']
    });

    return phases;
  }

  private createSuccessMetrics(targetSkills: string[]): SuccessMetric[] {
    return targetSkills.map(skill => ({
      metric_name: `${skill} mastery percentage`,
      current_value: 0,
      target_value: 85,
      measurement_unit: 'percentage',
      tracking_frequency: 'weekly' as const,
      last_measured: new Date()
    }));
  }

  private assessAdaptationNeeds(
    pathway: LearningPathway, 
    userAnalytics: UserAnalytics, 
    progressData: any
  ): {
    required: boolean;
    trigger: string;
    type: AdaptiveAdjustment['adjustment_type'];
    newPlan: any;
    rationale: string;
  } {
    // Check if user is progressing too slowly or too quickly
    const currentPhase = pathway.phases[pathway.current_phase - 1];
    const phaseProgress = this.calculatePhaseProgress(currentPhase, userAnalytics);

    if (phaseProgress > 90 && userAnalytics.summary.engagement_trend === 'improving') {
      return {
        required: true,
        trigger: 'Rapid progress detected',
        type: 'difficulty_increase',
        newPlan: { ...currentPhase, target_mastery_level: Math.min(95, currentPhase.target_mastery_level + 10) },
        rationale: 'User demonstrating rapid progress, increasing challenge level'
      };
    }

    if (phaseProgress < 30 && userAnalytics.summary.engagement_trend === 'declining') {
      return {
        required: true,
        trigger: 'Slow progress and declining engagement',
        type: 'difficulty_decrease',
        newPlan: { ...currentPhase, target_mastery_level: Math.max(40, currentPhase.target_mastery_level - 10) },
        rationale: 'Adjusting difficulty to rebuild confidence and engagement'
      };
    }

    return {
      required: false,
      trigger: '',
      type: 'pacing_change',
      newPlan: null,
      rationale: ''
    };
  }

  private calculatePhaseProgress(phase: LearningPhase, userAnalytics: UserAnalytics): number {
    // Calculate progress based on skill mastery in the phase
    let totalProgress = 0;
    let skillCount = 0;

    for (const skill of phase.focus_skills) {
      const progress = userAnalytics.skill_progress.get(skill);
      if (progress) {
        totalProgress += (progress.mastery_percentage / phase.target_mastery_level) * 100;
        skillCount++;
      }
    }

    return skillCount > 0 ? totalProgress / skillCount : 0;
  }

  private determineAbilityLevel(analytics: UserAnalytics): string {
    const avgMastery = Array.from(analytics.skill_progress.values())
      .reduce((sum, progress) => sum + progress.mastery_percentage, 0) / analytics.skill_progress.size;

    if (avgMastery > 80) return 'advanced';
    if (avgMastery > 60) return 'intermediate';
    if (avgMastery > 40) return 'developing';
    return 'emerging';
  }

  private identifyCommunicationNeeds(analytics: UserAnalytics): string[] {
    const needs: string[] = [];
    
    // Check AAC-related skills
    if (analytics.skill_progress.has('aac_navigation')) {
      const aacProgress = analytics.skill_progress.get('aac_navigation')!;
      if (aacProgress.mastery_percentage < 60) {
        needs.push('AAC device navigation support');
      }
    }

    // Check communication skills
    if (analytics.skill_progress.has('communication')) {
      const commProgress = analytics.skill_progress.get('communication')!;
      if (commProgress.mastery_percentage < 60) {
        needs.push('Expressive communication development');
      }
    }

    return needs;
  }

  private identifyLearningPreferences(analytics: UserAnalytics): string[] {
    const preferences: string[] = [];

    // Session length preference
    if (analytics.summary.average_session_length < 15) {
      preferences.push('Short, focused sessions');
    } else if (analytics.summary.average_session_length > 30) {
      preferences.push('Extended learning sessions');
    }

    // Activity preference based on engagement
    if (analytics.recent_breakthroughs.some(b => b.skill_area.includes('visual'))) {
      preferences.push('Visual learning activities');
    }

    if (analytics.recent_breakthroughs.some(b => b.skill_area.includes('memory'))) {
      preferences.push('Memory-based challenges');
    }

    return preferences;
  }

  private createAnalysisCacheKey(request: GPTAnalysisRequest): string {
    // Create a hash-like key based on request parameters
    const keyData = {
      totalSessions: request.user_analytics.summary.total_sessions,
      engagementTrend: request.user_analytics.summary.engagement_trend,
      skillCount: request.user_analytics.skill_progress.size,
      objectives: request.learning_objectives.join(','),
      challenges: request.current_challenges.join(',')
    };
    
    return btoa(JSON.stringify(keyData)).substr(0, 20);
  }

  private startPeriodicAnalysis(): void {
    // Generate new recommendations weekly for active users
    setInterval(() => {
      this.runPeriodicRecommendationUpdates();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  private async runPeriodicRecommendationUpdates(): void {
    console.log('🔄 Running periodic recommendation updates');
    
    // Update recommendations for users with active pathways
    for (const userId of this.learningPathways.keys()) {
      try {
        await this.generateFocusRecommendations(userId);
      } catch (error) {
        console.warn(`Failed to update recommendations for user ${userId}:`, error);
      }
    }
  }

  private loadRecommendationData(): void {
    try {
      // Load recommendations
      const savedRecommendations = localStorage.getItem('gpt4FocusRecommendations');
      if (savedRecommendations) {
        const data = JSON.parse(savedRecommendations);
        this.recommendations = new Map(data.map(([userId, recs]: [string, any[]]) => [
          userId,
          recs.map(rec => ({
            ...rec,
            generated_at: new Date(rec.generated_at)
          }))
        ]));
      }

      // Load learning pathways
      const savedPathways = localStorage.getItem('learningPathways');
      if (savedPathways) {
        const data = JSON.parse(savedPathways);
        this.learningPathways = new Map(data.map(([userId, pathway]: [string, any]) => [
          userId,
          {
            ...pathway,
            created_at: new Date(pathway.created_at),
            estimated_completion: new Date(pathway.estimated_completion),
            adaptive_adjustments: pathway.adaptive_adjustments.map((adj: any) => ({
              ...adj,
              timestamp: new Date(adj.timestamp)
            }))
          }
        ]));
      }

      console.log('📊 GPT-4 recommendation data loaded successfully');
    } catch (error) {
      console.warn('Could not load GPT-4 recommendation data:', error);
    }
  }

  private saveRecommendationData(): void {
    try {
      // Save recommendations
      localStorage.setItem('gpt4FocusRecommendations', JSON.stringify(
        Array.from(this.recommendations.entries())
      ));

      // Save learning pathways
      localStorage.setItem('learningPathways', JSON.stringify(
        Array.from(this.learningPathways.entries())
      ));
    } catch (error) {
      console.warn('Could not save GPT-4 recommendation data:', error);
    }
  }
}

// Export singleton instance
export const gpt4FocusRecommendationsService = GPT4FocusRecommendationsService.getInstance();