/**
 * Therapy Goal Tracking Service
 * SMART goal creation and progress monitoring for speech therapy
 * 
 * Features:
 * - SMART goal framework (Specific, Measurable, Achievable, Relevant, Time-bound)
 * - Automatic progress detection from session data
 * - Insurance-compliant documentation
 * - Goal banks by diagnosis
 * - Visual progress tracking
 * - Milestone notifications
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0
 */

import { mlDataCollection } from './ml-data-collection';
import { clinicalDecisionSupportService } from './clinical-decision-support-service';

interface TherapyGoal {
  id: string;
  patientId: string;
  therapistId: string;
  
  // SMART Goal Components
  specific: {
    skill: string; // "expressive communication", "receptive language", etc.
    context: string; // "during daily activities", "in classroom", etc.
    support_level: 'independent' | 'minimal' | 'moderate' | 'maximum';
  };
  
  measurable: {
    metric: 'accuracy' | 'frequency' | 'duration' | 'words_per_minute' | 'trials';
    target_value: number;
    baseline_value: number;
    unit: string; // "%", "times", "minutes", "wpm"
  };
  
  achievable: {
    steps: string[]; // Breakdown of goal into smaller steps
    prerequisites_met: boolean;
    difficulty_rating: 1 | 2 | 3 | 4 | 5;
  };
  
  relevant: {
    diagnosis_codes: string[]; // ICD-10 codes
    functional_impact: string;
    family_priority: boolean;
    educational_relevance: boolean;
  };
  
  timebound: {
    start_date: Date;
    target_date: Date;
    review_dates: Date[];
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  };
  
  // Progress Tracking
  progress: {
    current_value: number;
    percent_complete: number;
    last_updated: Date;
    trend: 'improving' | 'maintaining' | 'declining' | 'variable';
    data_points: Array<{
      date: Date;
      value: number;
      notes?: string;
      session_id?: string;
    }>;
  };
  
  // Documentation
  documentation: {
    goal_statement: string; // Full SMART goal statement
    insurance_codes: string[];
    requires_prior_auth: boolean;
    medical_necessity: string;
    discharge_criteria: string;
  };
  
  // Status
  status: 'draft' | 'active' | 'on_hold' | 'achieved' | 'discontinued';
  created_at: Date;
  updated_at: Date;
}

interface GoalBank {
  diagnosis: string;
  category: string;
  age_range: string;
  goals: Array<{
    title: string;
    template: Partial<TherapyGoal>;
    evidence_level: 'high' | 'moderate' | 'emerging';
    references: string[];
  }>;
}

interface ProgressAnalysis {
  goal_id: string;
  predicted_achievement_date: Date;
  confidence: number;
  recommendations: string[];
  barriers_identified: string[];
  success_factors: string[];
}

class TherapyGoalTrackingService {
  private static instance: TherapyGoalTrackingService;
  private goals: Map<string, TherapyGoal> = new Map();
  private goalBanks: Map<string, GoalBank> = new Map();
  private sessionGoalTracking: Map<string, Set<string>> = new Map(); // session -> goals
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): TherapyGoalTrackingService {
    if (!TherapyGoalTrackingService.instance) {
      TherapyGoalTrackingService.instance = new TherapyGoalTrackingService();
    }
    return TherapyGoalTrackingService.instance;
  }
  
  /**
   * Initialize goal tracking service
   */
  private async initializeService(): Promise<void> {
    console.log('🎯 Initializing Therapy Goal Tracking Service...');
    
    // Load goal banks
    await this.loadGoalBanks();
    
    // Set up automatic progress detection
    this.setupProgressDetection();
    
    console.log('✅ Goal Tracking Service Ready');
  }
  
  /**
   * Create a new SMART goal
   */
  async createGoal(goalData: Partial<TherapyGoal>): Promise<string> {
    const goalId = `goal_${Date.now()}`;
    
    // Generate SMART goal statement
    const goalStatement = this.generateGoalStatement(goalData);
    
    const goal: TherapyGoal = {
      id: goalId,
      patientId: goalData.patientId!,
      therapistId: goalData.therapistId!,
      
      specific: goalData.specific || {
        skill: 'expressive communication',
        context: 'during therapy sessions',
        support_level: 'moderate'
      },
      
      measurable: goalData.measurable || {
        metric: 'accuracy',
        target_value: 80,
        baseline_value: 40,
        unit: '%'
      },
      
      achievable: goalData.achievable || {
        steps: [],
        prerequisites_met: true,
        difficulty_rating: 3
      },
      
      relevant: goalData.relevant || {
        diagnosis_codes: [],
        functional_impact: '',
        family_priority: true,
        educational_relevance: true
      },
      
      timebound: goalData.timebound || {
        start_date: new Date(),
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        review_dates: [],
        frequency: 'weekly'
      },
      
      progress: {
        current_value: goalData.measurable?.baseline_value || 0,
        percent_complete: 0,
        last_updated: new Date(),
        trend: 'maintaining',
        data_points: []
      },
      
      documentation: {
        goal_statement: goalStatement,
        insurance_codes: goalData.documentation?.insurance_codes || [],
        requires_prior_auth: false,
        medical_necessity: goalData.documentation?.medical_necessity || '',
        discharge_criteria: goalData.documentation?.discharge_criteria || ''
      },
      
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.goals.set(goalId, goal);
    
    // Track goal creation
    await mlDataCollection.trackInteraction(goal.therapistId, {
      type: 'goal_created',
      metadata: {
        goalId,
        patientId: goal.patientId,
        skill: goal.specific.skill,
        target: goal.measurable.target_value
      },
      timestamp: new Date()
    });
    
    console.log(`✅ Goal created: ${goalStatement}`);
    return goalId;
  }
  
  /**
   * Update goal progress automatically from session data
   */
  async updateProgressFromSession(
    sessionId: string,
    patientId: string,
    sessionData: any
  ): Promise<void> {
    // Find active goals for patient
    const patientGoals = Array.from(this.goals.values()).filter(
      goal => goal.patientId === patientId && goal.status === 'active'
    );
    
    for (const goal of patientGoals) {
      const progress = await this.calculateProgressFromSession(goal, sessionData);
      
      if (progress !== null) {
        // Add data point
        goal.progress.data_points.push({
          date: new Date(),
          value: progress,
          session_id: sessionId
        });
        
        // Update current value (weighted average of recent sessions)
        goal.progress.current_value = this.calculateWeightedAverage(
          goal.progress.data_points.slice(-5) // Last 5 sessions
        );
        
        // Calculate completion percentage
        const range = goal.measurable.target_value - goal.measurable.baseline_value;
        const progress_made = goal.progress.current_value - goal.measurable.baseline_value;
        goal.progress.percent_complete = Math.round((progress_made / range) * 100);
        
        // Update trend
        goal.progress.trend = this.calculateTrend(goal.progress.data_points);
        goal.progress.last_updated = new Date();
        
        // Check if goal achieved
        if (goal.progress.current_value >= goal.measurable.target_value) {
          await this.markGoalAchieved(goal.id);
        }
        
        // Save updated goal
        goal.updated_at = new Date();
        this.goals.set(goal.id, goal);
        
        console.log(`📊 Updated progress for goal ${goal.id}: ${goal.progress.current_value}${goal.measurable.unit}`);
      }
    }
  }
  
  /**
   * Get goals for a patient
   */
  getPatientGoals(patientId: string, status?: TherapyGoal['status']): TherapyGoal[] {
    return Array.from(this.goals.values()).filter(goal => {
      const matchesPatient = goal.patientId === patientId;
      const matchesStatus = !status || goal.status === status;
      return matchesPatient && matchesStatus;
    });
  }
  
  /**
   * Get goal banks by diagnosis
   */
  getGoalBanksByDiagnosis(diagnosis: string): GoalBank[] {
    const banks: GoalBank[] = [];
    
    this.goalBanks.forEach(bank => {
      if (bank.diagnosis.toLowerCase().includes(diagnosis.toLowerCase())) {
        banks.push(bank);
      }
    });
    
    return banks;
  }
  
  /**
   * Analyze goal progress with AI
   */
  async analyzeGoalProgress(goalId: string): Promise<ProgressAnalysis> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');
    
    // Use ML to predict achievement date
    const prediction = await this.predictAchievementDate(goal);
    
    // Get clinical recommendations
    const recommendations = await clinicalDecisionSupportService.generateClinicalRecommendations(
      goal.patientId
    );
    
    // Identify barriers and success factors
    const barriers = this.identifyBarriers(goal);
    const successFactors = this.identifySuccessFactors(goal);
    
    return {
      goal_id: goalId,
      predicted_achievement_date: prediction.date,
      confidence: prediction.confidence,
      recommendations: recommendations.map(r => r.recommendation),
      barriers_identified: barriers,
      success_factors: successFactors
    };
  }
  
  /**
   * Generate visual progress report
   */
  async generateProgressReport(goalId: string): Promise<{
    chart_data: any;
    summary: string;
    recommendations: string[];
  }> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');
    
    // Prepare chart data
    const chartData = {
      labels: goal.progress.data_points.map(dp => dp.date.toLocaleDateString()),
      datasets: [{
        label: 'Progress',
        data: goal.progress.data_points.map(dp => dp.value),
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.4
      }, {
        label: 'Target',
        data: goal.progress.data_points.map(() => goal.measurable.target_value),
        borderColor: '#FF6B6B',
        borderDash: [5, 5],
        backgroundColor: 'transparent'
      }]
    };
    
    // Generate summary
    const summary = `${goal.documentation.goal_statement}\n\n` +
      `Current Progress: ${goal.progress.current_value}${goal.measurable.unit} ` +
      `(${goal.progress.percent_complete}% complete)\n` +
      `Trend: ${goal.progress.trend}\n` +
      `Sessions Tracked: ${goal.progress.data_points.length}`;
    
    // Get AI recommendations
    const analysis = await this.analyzeGoalProgress(goalId);
    
    return {
      chart_data: chartData,
      summary,
      recommendations: analysis.recommendations
    };
  }
  
  /**
   * Clone goal as template
   */
  async cloneAsTemplate(goalId: string): Promise<Partial<TherapyGoal>> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');
    
    // Remove patient-specific data
    const template: Partial<TherapyGoal> = {
      specific: goal.specific,
      measurable: {
        ...goal.measurable,
        baseline_value: 0
      },
      achievable: goal.achievable,
      relevant: {
        ...goal.relevant,
        diagnosis_codes: goal.relevant.diagnosis_codes
      },
      timebound: {
        ...goal.timebound,
        start_date: new Date(),
        target_date: new Date()
      }
    };
    
    return template;
  }
  
  // Private helper methods
  
  private async loadGoalBanks(): Promise<void> {
    // Load evidence-based goal banks
    const aphasiaBank: GoalBank = {
      diagnosis: 'Aphasia',
      category: 'Language',
      age_range: 'Adult',
      goals: [
        {
          title: 'Functional Naming - Common Objects',
          template: {
            specific: {
              skill: 'expressive language - naming',
              context: 'when shown common household objects',
              support_level: 'minimal'
            },
            measurable: {
              metric: 'accuracy',
              target_value: 80,
              baseline_value: 0,
              unit: '%'
            }
          },
          evidence_level: 'high',
          references: ['Brady et al., 2016', 'ASHA Practice Portal']
        },
        {
          title: 'Yes/No Questions',
          template: {
            specific: {
              skill: 'receptive language - comprehension',
              context: 'when asked biographical yes/no questions',
              support_level: 'independent'
            },
            measurable: {
              metric: 'accuracy',
              target_value: 90,
              baseline_value: 0,
              unit: '%'
            }
          },
          evidence_level: 'high',
          references: ['Wertz et al., 1984']
        }
      ]
    };
    
    this.goalBanks.set('aphasia', aphasiaBank);
    
    // Add more goal banks for other diagnoses
    console.log(`📚 Loaded ${this.goalBanks.size} goal banks`);
  }
  
  private setupProgressDetection(): void {
    // Set up listeners for automatic progress tracking
    window.addEventListener('tinkybink:session:completed', async (event: any) => {
      const { sessionId, patientId, sessionData } = event.detail;
      await this.updateProgressFromSession(sessionId, patientId, sessionData);
    });
  }
  
  private generateGoalStatement(goalData: Partial<TherapyGoal>): string {
    const specific = goalData.specific!;
    const measurable = goalData.measurable!;
    const timebound = goalData.timebound!;
    
    const timeframe = Math.round(
      (timebound.target_date.getTime() - timebound.start_date.getTime()) / 
      (1000 * 60 * 60 * 24 * 7)
    ); // weeks
    
    return `Patient will demonstrate ${specific.skill} ${specific.context} ` +
      `with ${specific.support_level} support, achieving ${measurable.target_value}${measurable.unit} ` +
      `${measurable.metric} (baseline: ${measurable.baseline_value}${measurable.unit}) ` +
      `within ${timeframe} weeks, as measured ${timebound.frequency}.`;
  }
  
  private async calculateProgressFromSession(
    goal: TherapyGoal,
    sessionData: any
  ): Promise<number | null> {
    // Extract relevant metrics based on goal type
    switch (goal.measurable.metric) {
      case 'accuracy':
        if (sessionData.correct_responses && sessionData.total_responses) {
          return (sessionData.correct_responses / sessionData.total_responses) * 100;
        }
        break;
        
      case 'frequency':
        return sessionData.target_behavior_count || null;
        
      case 'duration':
        return sessionData.engagement_minutes || null;
        
      case 'words_per_minute':
        if (sessionData.words_communicated && sessionData.session_duration_minutes) {
          return sessionData.words_communicated / sessionData.session_duration_minutes;
        }
        break;
        
      case 'trials':
        return sessionData.successful_trials || null;
    }
    
    return null;
  }
  
  private calculateWeightedAverage(dataPoints: Array<{value: number; date: Date}>): number {
    if (dataPoints.length === 0) return 0;
    
    // More recent sessions have higher weight
    let totalWeight = 0;
    let weightedSum = 0;
    
    dataPoints.forEach((dp, index) => {
      const weight = index + 1; // 1, 2, 3, 4, 5
      weightedSum += dp.value * weight;
      totalWeight += weight;
    });
    
    return Math.round(weightedSum / totalWeight);
  }
  
  private calculateTrend(
    dataPoints: Array<{value: number; date: Date}>
  ): 'improving' | 'maintaining' | 'declining' | 'variable' {
    if (dataPoints.length < 3) return 'maintaining';
    
    const recent = dataPoints.slice(-5);
    const values = recent.map(dp => dp.value);
    
    // Calculate slope
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < values.length; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    const n = values.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate variance
    const mean = sumY / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation
    
    // Determine trend
    if (cv > 0.3) return 'variable';
    if (slope > 1) return 'improving';
    if (slope < -1) return 'declining';
    return 'maintaining';
  }
  
  private async markGoalAchieved(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    
    goal.status = 'achieved';
    goal.updated_at = new Date();
    this.goals.set(goalId, goal);
    
    // Notify stakeholders
    console.log(`🎉 Goal achieved: ${goal.documentation.goal_statement}`);
    
    // Track achievement
    await mlDataCollection.trackInteraction(goal.therapistId, {
      type: 'goal_achieved',
      metadata: {
        goalId,
        patientId: goal.patientId,
        days_to_achieve: Math.round(
          (new Date().getTime() - goal.timebound.start_date.getTime()) / 
          (1000 * 60 * 60 * 24)
        )
      },
      timestamp: new Date()
    });
  }
  
  private async predictAchievementDate(goal: TherapyGoal): Promise<{
    date: Date;
    confidence: number;
  }> {
    // Simple linear projection - in production would use ML
    if (goal.progress.data_points.length < 2) {
      return {
        date: goal.timebound.target_date,
        confidence: 0.3
      };
    }
    
    // Calculate rate of progress
    const progressRate = (goal.progress.current_value - goal.measurable.baseline_value) /
      goal.progress.data_points.length;
    
    const remaining = goal.measurable.target_value - goal.progress.current_value;
    const sessionsNeeded = Math.ceil(remaining / progressRate);
    
    // Estimate based on session frequency
    const daysPerSession = goal.timebound.frequency === 'daily' ? 1 :
                           goal.timebound.frequency === 'weekly' ? 7 :
                           goal.timebound.frequency === 'biweekly' ? 14 : 30;
    
    const predictedDate = new Date(
      Date.now() + (sessionsNeeded * daysPerSession * 24 * 60 * 60 * 1000)
    );
    
    // Calculate confidence based on trend consistency
    const confidence = goal.progress.trend === 'improving' ? 0.8 :
                      goal.progress.trend === 'maintaining' ? 0.6 :
                      goal.progress.trend === 'declining' ? 0.3 : 0.4;
    
    return { date: predictedDate, confidence };
  }
  
  private identifyBarriers(goal: TherapyGoal): string[] {
    const barriers: string[] = [];
    
    if (goal.progress.trend === 'declining') {
      barriers.push('Progress trending downward - may need strategy adjustment');
    }
    
    if (goal.progress.trend === 'variable') {
      barriers.push('Inconsistent progress - consider environmental factors');
    }
    
    if (goal.progress.data_points.length < 3) {
      barriers.push('Limited data collection - increase session frequency');
    }
    
    const daysSinceUpdate = (Date.now() - goal.progress.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 14) {
      barriers.push('No recent progress data - schedule follow-up session');
    }
    
    return barriers;
  }
  
  private identifySuccessFactors(goal: TherapyGoal): string[] {
    const factors: string[] = [];
    
    if (goal.progress.trend === 'improving') {
      factors.push('Consistent improvement observed');
    }
    
    if (goal.relevant.family_priority) {
      factors.push('High family engagement and priority');
    }
    
    if (goal.progress.percent_complete > 50) {
      factors.push('Over halfway to goal achievement');
    }
    
    if (goal.achievable.prerequisites_met) {
      factors.push('All prerequisite skills in place');
    }
    
    return factors;
  }
}

// Export singleton instance
export const therapyGoalTrackingService = TherapyGoalTrackingService.getInstance();
export type { TherapyGoal, GoalBank, ProgressAnalysis };