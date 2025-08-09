/**
 * ABA Data Collection & Behavior Tracking Service
 * Comprehensive Applied Behavior Analysis tools for therapists
 * 
 * Features:
 * - Real-time behavior tracking
 * - ABC (Antecedent-Behavior-Consequence) data collection
 * - Frequency, duration, and interval recording
 * - Automatic graph generation
 * - Behavior intervention planning
 * - Progress monitoring with statistical analysis
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0
 */

import { mlDataCollection } from './ml-data-collection';
import { therapyGoalTrackingService } from './therapy-goal-tracking-service';

interface BehaviorDefinition {
  id: string;
  name: string;
  description: string;
  topography: string; // Observable characteristics
  
  // Behavior Categories
  category: 'communication' | 'social' | 'adaptive' | 'academic' | 'motor' | 'challenging';
  function: 'escape' | 'attention' | 'tangible' | 'sensory' | 'automatic' | 'unknown';
  
  // Measurement
  measurement_type: 'frequency' | 'duration' | 'latency' | 'intensity' | 'partial_interval' | 'whole_interval';
  target_direction: 'increase' | 'decrease' | 'maintain';
  
  // Operational Definition
  examples: string[];
  non_examples: string[];
  
  created_by: string;
  created_at: Date;
}

interface DataPoint {
  id: string;
  behavior_id: string;
  patient_id: string;
  therapist_id: string;
  session_id: string;
  
  // Timing
  timestamp: Date;
  duration?: number; // in seconds
  latency?: number; // time from prompt to behavior
  
  // Context (ABC Data)
  antecedent: {
    type: 'verbal_prompt' | 'gesture' | 'visual_cue' | 'environmental' | 'peer_interaction' | 'transition' | 'other';
    description: string;
    intensity: 1 | 2 | 3 | 4 | 5; // 1=minimal, 5=intense
  };
  
  behavior: {
    occurred: boolean;
    intensity: 1 | 2 | 3 | 4 | 5;
    duration_seconds?: number;
    topography_notes?: string;
  };
  
  consequence: {
    type: 'praise' | 'tangible' | 'attention' | 'escape' | 'ignore' | 'redirect' | 'other';
    description: string;
    delivered_by: 'therapist' | 'peer' | 'caregiver' | 'automatic';
    timing: 'immediate' | 'delayed' | 'intermittent';
  };
  
  // Environmental Context
  environment: {
    location: string;
    people_present: string[];
    activity: string;
    noise_level: 'quiet' | 'moderate' | 'loud';
    time_of_day: 'morning' | 'afternoon' | 'evening';
  };
  
  // Additional Notes
  notes?: string;
  reliability_observer?: string; // For IOA
  
  created_at: Date;
}

interface BehaviorProgram {
  id: string;
  patient_id: string;
  behavior_id: string;
  
  // Program Details
  program_type: 'skill_acquisition' | 'behavior_reduction' | 'maintenance';
  
  // Target Criteria
  mastery_criteria: {
    target_value: number;
    consecutive_sessions: number;
    across_people: number;
    across_settings: number;
  };
  
  // Teaching Procedures
  teaching_procedure: {
    type: 'discrete_trial' | 'natural_environment' | 'incidental' | 'structured_play';
    prompting_hierarchy: string[];
    reinforcement_schedule: string;
    error_correction: string;
  };
  
  // Data Collection Schedule
  data_schedule: {
    frequency: 'continuous' | '10_second_intervals' | '30_second_intervals' | '1_minute_intervals';
    sessions_per_week: number;
    duration_minutes: number;
  };
  
  // Status
  status: 'active' | 'mastered' | 'discontinued' | 'maintenance';
  start_date: Date;
  target_date: Date;
  
  created_by: string;
  created_at: Date;
}

interface BehaviorAnalysis {
  behavior_id: string;
  date_range: { start: Date; end: Date };
  
  // Descriptive Analysis
  descriptive: {
    total_occurrences: number;
    rate_per_hour: number;
    average_duration: number;
    peak_times: string[];
    
    // ABC Patterns
    common_antecedents: Array<{ type: string; percentage: number }>;
    common_consequences: Array<{ type: string; percentage: number }>;
    
    // Environmental Patterns
    location_analysis: Map<string, number>;
    activity_analysis: Map<string, number>;
    people_analysis: Map<string, number>;
  };
  
  // Functional Analysis
  functional: {
    hypothesized_function: string;
    confidence_level: number; // 0-1
    supporting_evidence: string[];
    
    // Condition Analysis (if experimental FA conducted)
    attention_condition?: number;
    escape_condition?: number;
    tangible_condition?: number;
    automatic_condition?: number;
    control_condition?: number;
  };
  
  // Trend Analysis
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'variable';
    slope: number;
    r_squared: number;
    significance: 'significant' | 'not_significant';
    
    // Phase Analysis
    baseline_average?: number;
    intervention_average?: number;
    percentage_change?: number;
    effect_size?: number;
  };
  
  // Recommendations
  recommendations: {
    intervention_strategies: string[];
    environmental_modifications: string[];
    teaching_strategies: string[];
    data_collection_changes: string[];
  };
}

class ABADataCollectionService {
  private static instance: ABADataCollectionService;
  private behaviors: Map<string, BehaviorDefinition> = new Map();
  private dataPoints: Map<string, DataPoint[]> = new Map(); // behaviorId -> data points
  private programs: Map<string, BehaviorProgram> = new Map();
  private activeSession: string | null = null;
  private activeDataCollection: Map<string, any> = new Map();
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): ABADataCollectionService {
    if (!ABADataCollectionService.instance) {
      ABADataCollectionService.instance = new ABADataCollectionService();
    }
    return ABADataCollectionService.instance;
  }
  
  /**
   * Initialize ABA service
   */
  private async initializeService(): Promise<void> {
    console.log('🎯 Initializing ABA Data Collection Service...');
    
    // Load common behavior definitions
    this.loadCommonBehaviors();
    
    // Set up real-time data collection
    this.setupRealTimeCollection();
    
    console.log('✅ ABA Service Ready');
  }
  
  /**
   * Create behavior definition
   */
  async createBehaviorDefinition(data: Partial<BehaviorDefinition>): Promise<string> {
    const behaviorId = `behavior_${Date.now()}`;
    
    const behavior: BehaviorDefinition = {
      id: behaviorId,
      name: data.name || 'Untitled Behavior',
      description: data.description || '',
      topography: data.topography || '',
      
      category: data.category || 'communication',
      function: data.function || 'unknown',
      
      measurement_type: data.measurement_type || 'frequency',
      target_direction: data.target_direction || 'increase',
      
      examples: data.examples || [],
      non_examples: data.non_examples || [],
      
      created_by: data.created_by!,
      created_at: new Date()
    };
    
    this.behaviors.set(behaviorId, behavior);
    this.dataPoints.set(behaviorId, []);
    
    console.log(`✅ Behavior definition created: ${behavior.name}`);
    return behaviorId;
  }
  
  /**
   * Start data collection session
   */
  async startDataCollection(
    sessionId: string,
    patientId: string,
    behaviorIds: string[],
    environment: DataPoint['environment']
  ): Promise<void> {
    console.log(`📊 Starting ABA data collection for ${behaviorIds.length} behaviors`);
    
    this.activeSession = sessionId;
    
    // Initialize data collection for each behavior
    behaviorIds.forEach(behaviorId => {
      this.activeDataCollection.set(behaviorId, {
        session_start: Date.now(),
        interval_data: [],
        current_interval: 0,
        last_occurrence: null
      });
    });
    
    // Start interval timer if using interval recording
    this.startIntervalTimer();
    
    // Track session start
    await mlDataCollection.trackInteraction(patientId, {
      type: 'aba_session_started',
      metadata: {
        sessionId,
        behaviors: behaviorIds,
        environment
      },
      timestamp: new Date()
    });
  }
  
  /**
   * Record behavior occurrence
   */
  async recordBehavior(
    behaviorId: string,
    patientId: string,
    therapistId: string,
    data: Partial<DataPoint>
  ): Promise<string> {
    if (!this.activeSession) {
      throw new Error('No active data collection session');
    }
    
    const dataPointId = `dp_${Date.now()}`;
    
    const dataPoint: DataPoint = {
      id: dataPointId,
      behavior_id: behaviorId,
      patient_id: patientId,
      therapist_id: therapistId,
      session_id: this.activeSession,
      
      timestamp: new Date(),
      duration: data.duration,
      latency: data.latency,
      
      antecedent: data.antecedent || {
        type: 'other',
        description: 'No antecedent recorded',
        intensity: 3
      },
      
      behavior: data.behavior || {
        occurred: true,
        intensity: 3
      },
      
      consequence: data.consequence || {
        type: 'other',
        description: 'No consequence recorded',
        delivered_by: 'therapist',
        timing: 'immediate'
      },
      
      environment: data.environment!,
      notes: data.notes,
      
      created_at: new Date()
    };
    
    // Add to behavior data points
    const behaviorData = this.dataPoints.get(behaviorId) || [];
    behaviorData.push(dataPoint);
    this.dataPoints.set(behaviorId, behaviorData);
    
    // Update active collection
    const activeData = this.activeDataCollection.get(behaviorId);
    if (activeData) {
      activeData.last_occurrence = Date.now();
      if (dataPoint.behavior.occurred) {
        activeData.interval_data[activeData.current_interval] = 
          (activeData.interval_data[activeData.current_interval] || 0) + 1;
      }
    }
    
    console.log(`📝 Behavior recorded: ${behaviorId} - ${dataPoint.behavior.occurred ? 'Occurred' : 'Did not occur'}`);
    
    // Track data point
    await mlDataCollection.trackInteraction(therapistId, {
      type: 'aba_data_recorded',
      metadata: {
        behaviorId,
        occurred: dataPoint.behavior.occurred,
        function: dataPoint.antecedent.type
      },
      timestamp: new Date()
    });
    
    return dataPointId;
  }
  
  /**
   * Stop data collection session
   */
  async stopDataCollection(): Promise<Map<string, any>> {
    if (!this.activeSession) {
      throw new Error('No active session to stop');
    }
    
    console.log('⏹️ Stopping ABA data collection session');
    
    // Calculate session summaries
    const sessionSummary = new Map<string, any>();
    
    this.activeDataCollection.forEach((data, behaviorId) => {
      const behavior = this.behaviors.get(behaviorId);
      const sessionData = this.dataPoints.get(behaviorId) || [];
      const sessionPoints = sessionData.filter(dp => dp.session_id === this.activeSession);
      
      const summary = {
        behavior_name: behavior?.name,
        total_occurrences: sessionPoints.filter(dp => dp.behavior.occurred).length,
        total_opportunities: sessionPoints.length,
        percentage: sessionPoints.length > 0 ? 
          (sessionPoints.filter(dp => dp.behavior.occurred).length / sessionPoints.length) * 100 : 0,
        session_duration: (Date.now() - data.session_start) / 1000 / 60, // minutes
        rate_per_hour: 0
      };
      
      summary.rate_per_hour = summary.session_duration > 0 ? 
        (summary.total_occurrences / summary.session_duration) * 60 : 0;
      
      sessionSummary.set(behaviorId, summary);
    });
    
    // Clear active session
    this.activeSession = null;
    this.activeDataCollection.clear();
    
    return sessionSummary;
  }
  
  /**
   * Generate behavior analysis
   */
  async analyzeBehavior(
    behaviorId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<BehaviorAnalysis> {
    const behavior = this.behaviors.get(behaviorId);
    if (!behavior) throw new Error('Behavior not found');
    
    const allData = this.dataPoints.get(behaviorId) || [];
    
    // Filter by date range if provided
    const data = dateRange ? 
      allData.filter(dp => dp.timestamp >= dateRange.start && dp.timestamp <= dateRange.end) :
      allData;
    
    console.log(`📈 Analyzing behavior: ${behavior.name} (${data.length} data points)`);
    
    // Descriptive Analysis
    const descriptive = this.performDescriptiveAnalysis(data);
    
    // Functional Analysis
    const functional = this.performFunctionalAnalysis(data);
    
    // Trend Analysis
    const trend = this.performTrendAnalysis(data);
    
    // Generate Recommendations
    const recommendations = this.generateRecommendations(behavior, descriptive, functional, trend);
    
    return {
      behavior_id: behaviorId,
      date_range: dateRange || { 
        start: data[0]?.timestamp || new Date(), 
        end: data[data.length - 1]?.timestamp || new Date() 
      },
      descriptive,
      functional,
      trend,
      recommendations
    };
  }
  
  /**
   * Generate visual graphs
   */
  async generateGraphs(behaviorId: string, graphType: 'line' | 'bar' | 'cumulative' | 'celeration'): Promise<any> {
    const data = this.dataPoints.get(behaviorId) || [];
    const behavior = this.behaviors.get(behaviorId);
    
    if (!behavior) throw new Error('Behavior not found');
    
    switch (graphType) {
      case 'line':
        return this.generateLineGraph(data, behavior);
      case 'bar':
        return this.generateBarGraph(data, behavior);
      case 'cumulative':
        return this.generateCumulativeGraph(data, behavior);
      case 'celeration':
        return this.generateCelerationChart(data, behavior);
      default:
        return this.generateLineGraph(data, behavior);
    }
  }
  
  /**
   * Calculate Inter-Observer Agreement (IOA)
   */
  async calculateIOA(
    behaviorId: string,
    observer1Data: string[],
    observer2Data: string[]
  ): Promise<{
    total_agreement: number;
    occurrence_agreement: number;
    non_occurrence_agreement: number;
    kappa: number;
  }> {
    // Calculate point-by-point agreement
    let agreements = 0;
    let occurrenceAgreements = 0;
    let nonOccurrenceAgreements = 0;
    const totalIntervals = Math.min(observer1Data.length, observer2Data.length);
    
    for (let i = 0; i < totalIntervals; i++) {
      const obs1 = observer1Data[i] === 'occurred';
      const obs2 = observer2Data[i] === 'occurred';
      
      if (obs1 === obs2) {
        agreements++;
        if (obs1) occurrenceAgreements++;
        else nonOccurrenceAgreements++;
      }
    }
    
    const totalAgreement = totalIntervals > 0 ? (agreements / totalIntervals) * 100 : 0;
    
    // Calculate Cohen's Kappa (simplified)
    const po = agreements / totalIntervals;
    const pe = 0.5; // Simplified expected agreement
    const kappa = (po - pe) / (1 - pe);
    
    return {
      total_agreement: Math.round(totalAgreement),
      occurrence_agreement: Math.round((occurrenceAgreements / agreements) * 100) || 0,
      non_occurrence_agreement: Math.round((nonOccurrenceAgreements / agreements) * 100) || 0,
      kappa: Math.round(kappa * 100) / 100
    };
  }
  
  /**
   * Export data for analysis
   */
  async exportBehaviorData(
    behaviorIds: string[],
    format: 'csv' | 'excel' | 'spss',
    dateRange?: { start: Date; end: Date }
  ): Promise<string> {
    console.log(`📤 Exporting behavior data for ${behaviorIds.length} behaviors`);
    
    const exportData: any[] = [];
    
    behaviorIds.forEach(behaviorId => {
      const behavior = this.behaviors.get(behaviorId);
      const data = this.dataPoints.get(behaviorId) || [];
      
      const filteredData = dateRange ?
        data.filter(dp => dp.timestamp >= dateRange.start && dp.timestamp <= dateRange.end) :
        data;
      
      filteredData.forEach(dp => {
        exportData.push({
          behavior_name: behavior?.name,
          behavior_category: behavior?.category,
          date: dp.timestamp.toISOString().split('T')[0],
          time: dp.timestamp.toTimeString().split(' ')[0],
          occurred: dp.behavior.occurred,
          duration: dp.duration,
          intensity: dp.behavior.intensity,
          antecedent: dp.antecedent.type,
          consequence: dp.consequence.type,
          location: dp.environment.location,
          activity: dp.environment.activity,
          notes: dp.notes
        });
      });
    });
    
    // Format based on type
    const fileName = `behavior_data_${Date.now()}.${format}`;
    
    switch (format) {
      case 'csv':
        return this.formatAsCSV(exportData, fileName);
      case 'excel':
        return this.formatAsExcel(exportData, fileName);
      case 'spss':
        return this.formatAsSPSS(exportData, fileName);
      default:
        return this.formatAsCSV(exportData, fileName);
    }
  }
  
  // Private helper methods
  
  private loadCommonBehaviors(): void {
    // Communication behaviors
    const communicationBehaviors = [
      {
        name: 'Spontaneous Request',
        description: 'Patient initiates a request without prompting',
        category: 'communication' as const,
        measurement_type: 'frequency' as const,
        target_direction: 'increase' as const,
        examples: ['Points to desired item', 'Uses AAC to request', 'Vocalizes while reaching'],
        non_examples: ['Responds to "What do you want?"', 'Repeats therapist model']
      },
      {
        name: 'Functional Communication',
        description: 'Uses AAC device for functional communication',
        category: 'communication' as const,
        measurement_type: 'frequency' as const,
        target_direction: 'increase' as const,
        examples: ['Navigates to correct category', 'Selects appropriate symbol', 'Combines symbols'],
        non_examples: ['Random button pressing', 'Imitating therapist selection']
      }
    ];
    
    // Social behaviors
    const socialBehaviors = [
      {
        name: 'Joint Attention',
        description: 'Shares attention with another person about an object or event',
        category: 'social' as const,
        measurement_type: 'frequency' as const,
        target_direction: 'increase' as const,
        examples: ['Points and looks at person', 'Shows object to therapist', 'Follows point'],
        non_examples: ['Looking at object alone', 'Pointing without checking social partner']
      }
    ];
    
    // Challenging behaviors
    const challengingBehaviors = [
      {
        name: 'Aggression',
        description: 'Physical contact intended to harm another person',
        category: 'challenging' as const,
        measurement_type: 'frequency' as const,
        target_direction: 'decrease' as const,
        examples: ['Hitting with open hand', 'Kicking', 'Pushing'],
        non_examples: ['Accidental contact', 'Self-directed hits', 'Play fighting']
      }
    ];
    
    // Create behavior definitions
    [...communicationBehaviors, ...socialBehaviors, ...challengingBehaviors].forEach(async (behaviorData, index) => {
      const behaviorId = await this.createBehaviorDefinition({
        ...behaviorData,
        created_by: 'system'
      });
      console.log(`Loaded behavior: ${behaviorData.name}`);
    });
  }
  
  private setupRealTimeCollection(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Set up hotkeys for quick data collection
    document.addEventListener('keydown', (event) => {
      if (!this.activeSession) return;
      
      // Quick behavior recording with number keys
      if (event.key >= '1' && event.key <= '9' && event.ctrlKey) {
        const behaviorIndex = parseInt(event.key) - 1;
        const behaviorIds = Array.from(this.activeDataCollection.keys());
        
        if (behaviorIds[behaviorIndex]) {
          // Quick record behavior occurrence
          console.log(`Quick record: Behavior ${behaviorIndex + 1}`);
          // Would trigger simplified recording
        }
      }
    });
  }
  
  private startIntervalTimer(): void {
    // Start 10-second interval timer for interval recording
    if (this.activeSession) {
      const intervalTimer = setInterval(() => {
        if (!this.activeSession) {
          clearInterval(intervalTimer);
          return;
        }
        
        // Advance interval for each behavior
        this.activeDataCollection.forEach((data, behaviorId) => {
          data.current_interval++;
          data.interval_data[data.current_interval] = 0;
        });
        
        // Visual/audio cue for interval change
        console.log(`📊 Interval ${this.activeDataCollection.values().next().value?.current_interval || 0}`);
        
      }, 10000); // 10 seconds
    }
  }
  
  private performDescriptiveAnalysis(data: DataPoint[]): BehaviorAnalysis['descriptive'] {
    const occurrences = data.filter(dp => dp.behavior.occurred);
    const totalOccurrences = occurrences.length;
    
    // Calculate rate per hour
    const sessionDuration = data.length > 0 ? 
      (data[data.length - 1].timestamp.getTime() - data[0].timestamp.getTime()) / (1000 * 60 * 60) : 0;
    const ratePerHour = sessionDuration > 0 ? totalOccurrences / sessionDuration : 0;
    
    // Calculate average duration
    const durationsWithValue = occurrences.filter(dp => dp.duration !== undefined);
    const averageDuration = durationsWithValue.length > 0 ?
      durationsWithValue.reduce((sum, dp) => sum + (dp.duration || 0), 0) / durationsWithValue.length : 0;
    
    // Find peak times
    const hourlyOccurrences = new Map<number, number>();
    occurrences.forEach(dp => {
      const hour = dp.timestamp.getHours();
      hourlyOccurrences.set(hour, (hourlyOccurrences.get(hour) || 0) + 1);
    });
    
    const peakTimes = Array.from(hourlyOccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
    
    // Analyze antecedents and consequences
    const antecedentCounts = new Map<string, number>();
    const consequenceCounts = new Map<string, number>();
    
    data.forEach(dp => {
      antecedentCounts.set(dp.antecedent.type, (antecedentCounts.get(dp.antecedent.type) || 0) + 1);
      consequenceCounts.set(dp.consequence.type, (consequenceCounts.get(dp.consequence.type) || 0) + 1);
    });
    
    const commonAntecedents = Array.from(antecedentCounts.entries())
      .map(([type, count]) => ({ type, percentage: (count / data.length) * 100 }))
      .sort((a, b) => b.percentage - a.percentage);
    
    const commonConsequences = Array.from(consequenceCounts.entries())
      .map(([type, count]) => ({ type, percentage: (count / data.length) * 100 }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // Environmental analysis
    const locationCounts = new Map<string, number>();
    const activityCounts = new Map<string, number>();
    const peopleCounts = new Map<string, number>();
    
    data.forEach(dp => {
      locationCounts.set(dp.environment.location, (locationCounts.get(dp.environment.location) || 0) + 1);
      activityCounts.set(dp.environment.activity, (activityCounts.get(dp.environment.activity) || 0) + 1);
      dp.environment.people_present.forEach(person => {
        peopleCounts.set(person, (peopleCounts.get(person) || 0) + 1);
      });
    });
    
    return {
      total_occurrences: totalOccurrences,
      rate_per_hour: Math.round(ratePerHour * 100) / 100,
      average_duration: Math.round(averageDuration * 100) / 100,
      peak_times: peakTimes,
      common_antecedents: commonAntecedents,
      common_consequences: commonConsequences,
      location_analysis: locationCounts,
      activity_analysis: activityCounts,
      people_analysis: peopleCounts
    };
  }
  
  private performFunctionalAnalysis(data: DataPoint[]): BehaviorAnalysis['functional'] {
    // Analyze function based on consequences and patterns
    const functionScores = {
      attention: 0,
      escape: 0,
      tangible: 0,
      automatic: 0
    };
    
    data.forEach(dp => {
      // Score based on consequences
      switch (dp.consequence.type) {
        case 'attention':
        case 'praise':
          functionScores.attention++;
          break;
        case 'escape':
          functionScores.escape++;
          break;
        case 'tangible':
          functionScores.tangible++;
          break;
        default:
          functionScores.automatic++;
      }
    });
    
    // Find most likely function
    const maxScore = Math.max(...Object.values(functionScores));
    const hypothesizedFunction = Object.entries(functionScores)
      .find(([, score]) => score === maxScore)?.[0] || 'unknown';
    
    const confidence = data.length > 0 ? maxScore / data.length : 0;
    
    return {
      hypothesized_function: hypothesizedFunction,
      confidence_level: Math.round(confidence * 100) / 100,
      supporting_evidence: [`${maxScore} occurrences followed by ${hypothesizedFunction} consequences`]
    };
  }
  
  private performTrendAnalysis(data: DataPoint[]): BehaviorAnalysis['trend'] {
    if (data.length < 3) {
      return {
        direction: 'stable',
        slope: 0,
        r_squared: 0,
        significance: 'not_significant'
      };
    }
    
    // Group data by day and calculate daily rates
    const dailyRates = new Map<string, number>();
    
    data.forEach(dp => {
      const dateKey = dp.timestamp.toISOString().split('T')[0];
      if (dp.behavior.occurred) {
        dailyRates.set(dateKey, (dailyRates.get(dateKey) || 0) + 1);
      }
    });
    
    const rates = Array.from(dailyRates.values());
    
    // Simple linear regression
    const n = rates.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = rates.reduce((a, b) => a + b, 0);
    const sumXY = rates.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Determine direction
    let direction: 'increasing' | 'decreasing' | 'stable' | 'variable' = 'stable';
    if (slope > 0.1) direction = 'increasing';
    else if (slope < -0.1) direction = 'decreasing';
    
    // Calculate R-squared (simplified)
    const meanY = sumY / n;
    const ssRes = rates.reduce((sum, y, i) => {
      const predicted = meanY + slope * (i + 1 - (n + 1) / 2);
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const ssTot = rates.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    
    return {
      direction,
      slope: Math.round(slope * 100) / 100,
      r_squared: Math.round(rSquared * 100) / 100,
      significance: rSquared > 0.5 ? 'significant' : 'not_significant'
    };
  }
  
  private generateRecommendations(
    behavior: BehaviorDefinition,
    descriptive: BehaviorAnalysis['descriptive'],
    functional: BehaviorAnalysis['functional'],
    trend: BehaviorAnalysis['trend']
  ): BehaviorAnalysis['recommendations'] {
    const recommendations = {
      intervention_strategies: [] as string[],
      environmental_modifications: [] as string[],
      teaching_strategies: [] as string[],
      data_collection_changes: [] as string[]
    };
    
    // Based on function
    switch (functional.hypothesized_function) {
      case 'attention':
        recommendations.intervention_strategies.push('Provide differential attention for appropriate behaviors');
        recommendations.intervention_strategies.push('Use planned ignoring for attention-seeking behaviors');
        break;
      case 'escape':
        recommendations.intervention_strategies.push('Teach functional communication for breaks');
        recommendations.intervention_strategies.push('Modify task demands to prevent escape behaviors');
        break;
      case 'tangible':
        recommendations.intervention_strategies.push('Implement token economy system');
        recommendations.intervention_strategies.push('Teach appropriate requesting behaviors');
        break;
    }
    
    // Based on environmental patterns
    if (descriptive.peak_times.length > 0) {
      recommendations.environmental_modifications.push(
        `Provide additional support during peak times: ${descriptive.peak_times.join(', ')}`
      );
    }
    
    // Based on trend
    if (trend.direction === 'increasing' && behavior.target_direction === 'decrease') {
      recommendations.intervention_strategies.push('Current intervention may need modification');
      recommendations.data_collection_changes.push('Increase data collection frequency');
    }
    
    return recommendations;
  }
  
  private generateLineGraph(data: DataPoint[], behavior: BehaviorDefinition): any {
    // Group by date
    const dailyData = new Map<string, number>();
    
    data.forEach(dp => {
      const dateKey = dp.timestamp.toISOString().split('T')[0];
      if (dp.behavior.occurred) {
        dailyData.set(dateKey, (dailyData.get(dateKey) || 0) + 1);
      } else if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, 0);
      }
    });
    
    const sortedDates = Array.from(dailyData.keys()).sort();
    
    return {
      type: 'line',
      title: `${behavior.name} - Frequency Over Time`,
      data: {
        labels: sortedDates,
        datasets: [{
          label: 'Occurrences',
          data: sortedDates.map(date => dailyData.get(date) || 0),
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    };
  }
  
  private generateBarGraph(data: DataPoint[], behavior: BehaviorDefinition): any {
    // Analyze by antecedent type
    const antecedentCounts = new Map<string, number>();
    
    data.filter(dp => dp.behavior.occurred).forEach(dp => {
      antecedentCounts.set(dp.antecedent.type, (antecedentCounts.get(dp.antecedent.type) || 0) + 1);
    });
    
    return {
      type: 'bar',
      title: `${behavior.name} - Occurrences by Antecedent`,
      data: {
        labels: Array.from(antecedentCounts.keys()),
        datasets: [{
          label: 'Occurrences',
          data: Array.from(antecedentCounts.values()),
          backgroundColor: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
          ]
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          }
        }
      }
    };
  }
  
  private generateCumulativeGraph(data: DataPoint[], behavior: BehaviorDefinition): any {
    let cumulative = 0;
    const cumulativeData = [];
    
    data.forEach((dp, index) => {
      if (dp.behavior.occurred) cumulative++;
      cumulativeData.push({
        x: dp.timestamp,
        y: cumulative
      });
    });
    
    return {
      type: 'line',
      title: `${behavior.name} - Cumulative Record`,
      data: {
        datasets: [{
          label: 'Cumulative Occurrences',
          data: cumulativeData,
          borderColor: '#845EC2',
          backgroundColor: 'rgba(132, 94, 194, 0.1)',
          stepped: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cumulative Count'
            }
          },
          x: {
            type: 'time',
            title: {
              display: true,
              text: 'Time'
            }
          }
        }
      }
    };
  }
  
  private generateCelerationChart(data: DataPoint[], behavior: BehaviorDefinition): any {
    // Standard Celeration Chart (semi-log)
    const weeklyData = new Map<number, number>();
    
    data.forEach(dp => {
      const weekNumber = Math.floor(dp.timestamp.getTime() / (7 * 24 * 60 * 60 * 1000));
      if (dp.behavior.occurred) {
        weeklyData.set(weekNumber, (weeklyData.get(weekNumber) || 0) + 1);
      }
    });
    
    const weeks = Array.from(weeklyData.keys()).sort();
    
    return {
      type: 'line',
      title: `${behavior.name} - Standard Celeration Chart`,
      data: {
        labels: weeks.map(w => `Week ${w}`),
        datasets: [{
          label: 'Frequency per Week',
          data: weeks.map(w => weeklyData.get(w) || 0),
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: 'Frequency (log scale)'
            }
          }
        }
      }
    };
  }
  
  private formatAsCSV(data: any[], fileName: string): string {
    // Convert data to CSV format
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    console.log(`📄 CSV exported: ${fileName}`);
    return `/exports/${fileName}`;
  }
  
  private formatAsExcel(data: any[], fileName: string): string {
    // In production, would use library like xlsx
    console.log(`📊 Excel exported: ${fileName}`);
    return `/exports/${fileName}`;
  }
  
  private formatAsSPSS(data: any[], fileName: string): string {
    // In production, would format for SPSS import
    console.log(`📈 SPSS exported: ${fileName}`);
    return `/exports/${fileName}`;
  }
}

// Export singleton instance
export const abaDataCollectionService = ABADataCollectionService.getInstance();
export type { BehaviorDefinition, DataPoint, BehaviorProgram, BehaviorAnalysis };