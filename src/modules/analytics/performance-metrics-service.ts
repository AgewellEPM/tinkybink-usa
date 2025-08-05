// Performance Metrics Service - Module 53
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getUsagePatternsService } from './usage-patterns-service';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  timestamp: Date;
  category: 'speed' | 'accuracy' | 'engagement' | 'progress' | 'system';
}

interface UserPerformance {
  userId: string;
  metrics: Map<string, PerformanceMetric>;
  history: PerformanceSnapshot[];
  milestones: Milestone[];
  alerts: PerformanceAlert[];
}

interface PerformanceSnapshot {
  timestamp: Date;
  metrics: Record<string, number>;
  sessionId?: string;
  context?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  achievedAt: Date;
  metric: string;
  value: number;
  threshold: number;
}

interface PerformanceAlert {
  id: string;
  type: 'improvement' | 'decline' | 'anomaly' | 'milestone';
  metric: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  acknowledged: boolean;
}

interface PerformanceGoal {
  id: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  deadline?: Date;
  progress: number;
  status: 'active' | 'completed' | 'missed';
}

interface SystemPerformance {
  responseTime: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  renderTime: number;
  apiLatency: number;
}

export class PerformanceMetricsService {
  private static instance: PerformanceMetricsService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private usagePatternsService = getUsagePatternsService();
  
  private userPerformance: Map<string, UserPerformance> = new Map();
  private systemMetrics: SystemPerformance = {
    responseTime: 0,
    errorRate: 0,
    uptime: 100,
    memoryUsage: 0,
    renderTime: 0,
    apiLatency: 0
  };
  
  private metricsUpdateInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private goals: Map<string, PerformanceGoal> = new Map();
  
  private readonly metricDefinitions = new Map([
    ['words_per_minute', { name: 'Words Per Minute', unit: 'wpm', category: 'speed' as const }],
    ['sentence_completion_time', { name: 'Sentence Completion Time', unit: 'seconds', category: 'speed' as const }],
    ['accuracy_rate', { name: 'Accuracy Rate', unit: '%', category: 'accuracy' as const }],
    ['vocabulary_growth', { name: 'Vocabulary Growth', unit: 'words', category: 'progress' as const }],
    ['session_engagement', { name: 'Session Engagement', unit: 'minutes', category: 'engagement' as const }],
    ['tile_selection_speed', { name: 'Tile Selection Speed', unit: 'ms', category: 'speed' as const }],
    ['error_correction_rate', { name: 'Error Correction Rate', unit: '%', category: 'accuracy' as const }],
    ['communication_efficiency', { name: 'Communication Efficiency', unit: 'score', category: 'progress' as const }],
    ['learning_velocity', { name: 'Learning Velocity', unit: 'score', category: 'progress' as const }],
    ['independence_score', { name: 'Independence Score', unit: 'score', category: 'progress' as const }]
  ]);

  private constructor() {
    this.initializeMetrics();
  }

  static getInstance(): PerformanceMetricsService {
    if (!PerformanceMetricsService.instance) {
      PerformanceMetricsService.instance = new PerformanceMetricsService();
    }
    return PerformanceMetricsService.instance;
  }

  initialize(): void {
    console.log('PerformanceMetricsService initializing...');
    this.loadHistoricalData();
    this.setupPerformanceMonitoring();
    this.startMetricsCollection();
    this.setupEventTracking();
    console.log('PerformanceMetricsService initialized');
  }

  private initializeMetrics(): void {
    const userId = this.getCurrentUserId();
    
    if (!this.userPerformance.has(userId)) {
      const metrics = new Map<string, PerformanceMetric>();
      
      // Initialize all metrics
      this.metricDefinitions.forEach((def, id) => {
        metrics.set(id, {
          id,
          name: def.name,
          value: 0,
          unit: def.unit,
          trend: 'stable',
          changePercentage: 0,
          timestamp: new Date(),
          category: def.category
        });
      });

      this.userPerformance.set(userId, {
        userId,
        metrics,
        history: [],
        milestones: [],
        alerts: []
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Monitor navigation timing
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.systemMetrics.responseTime = navEntry.loadEventEnd - navEntry.fetchStart;
        } else if (entry.entryType === 'measure') {
          this.handlePerformanceMeasure(entry);
        }
      }
    });

    this.performanceObserver.observe({ 
      entryTypes: ['navigation', 'measure', 'resource'] 
    });

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.systemMetrics.memoryUsage = 
          (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      }, 30000); // Every 30 seconds
    }
  }

  private startMetricsCollection(): void {
    // Update metrics every minute
    this.metricsUpdateInterval = setInterval(() => {
      this.updateAllMetrics();
      this.checkGoalProgress();
      this.detectAnomalies();
    }, 60000);

    // Initial update
    this.updateAllMetrics();
  }

  private setupEventTracking(): void {
    // Track tile selection speed
    let lastTileTime = Date.now();
    window.addEventListener('tilePressed', () => {
      const now = Date.now();
      const speed = now - lastTileTime;
      lastTileTime = now;
      
      this.recordMetricValue('tile_selection_speed', speed);
    });

    // Track sentence completion
    let sentenceStartTime = 0;
    window.addEventListener('sentenceStarted', () => {
      sentenceStartTime = Date.now();
    });

    window.addEventListener('sentenceSpoken', (e: any) => {
      if (sentenceStartTime > 0) {
        const completionTime = (Date.now() - sentenceStartTime) / 1000;
        this.recordMetricValue('sentence_completion_time', completionTime);
        
        // Calculate words per minute
        const wordCount = e.detail.wordCount || 0;
        const wpm = (wordCount / completionTime) * 60;
        this.recordMetricValue('words_per_minute', wpm);
        
        sentenceStartTime = 0;
      }
    });

    // Track errors and corrections
    let errorCount = 0;
    let correctionCount = 0;
    
    window.addEventListener('tileDeleted', () => {
      errorCount++;
    });

    window.addEventListener('tileCorrected', () => {
      correctionCount++;
    });

    // Update error correction rate periodically
    setInterval(() => {
      if (errorCount > 0) {
        const rate = (correctionCount / errorCount) * 100;
        this.recordMetricValue('error_correction_rate', rate);
      }
    }, 300000); // Every 5 minutes
  }

  private updateAllMetrics(): void {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return;

    // Update session engagement
    const currentSession = this.usagePatternsService.getCurrentSession();
    if (currentSession) {
      const engagementMinutes = 
        (Date.now() - currentSession.startTime.getTime()) / 60000;
      this.updateMetric('session_engagement', engagementMinutes);
    }

    // Update vocabulary growth
    const vocabularySize = this.calculateVocabularySize();
    this.updateMetric('vocabulary_growth', vocabularySize);

    // Update accuracy rate
    const accuracy = this.calculateAccuracyRate();
    this.updateMetric('accuracy_rate', accuracy);

    // Update composite scores
    this.updateMetric('communication_efficiency', this.calculateEfficiencyScore());
    this.updateMetric('learning_velocity', this.calculateLearningVelocity());
    this.updateMetric('independence_score', this.calculateIndependenceScore());

    // Create snapshot
    this.createPerformanceSnapshot();
  }

  private recordMetricValue(metricId: string, value: number): void {
    const metric = this.getMetric(metricId);
    if (!metric) return;

    // Smooth the value using exponential moving average
    const alpha = 0.3; // Smoothing factor
    const smoothedValue = alpha * value + (1 - alpha) * metric.value;
    
    this.updateMetric(metricId, smoothedValue);
  }

  private updateMetric(metricId: string, value: number): void {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return;

    const metric = performance.metrics.get(metricId);
    if (!metric) return;

    const previousValue = metric.value;
    metric.value = value;
    metric.timestamp = new Date();

    // Calculate trend
    if (previousValue === 0) {
      metric.trend = 'stable';
      metric.changePercentage = 0;
    } else {
      const change = ((value - previousValue) / previousValue) * 100;
      metric.changePercentage = change;
      
      if (Math.abs(change) < 5) {
        metric.trend = 'stable';
      } else {
        metric.trend = change > 0 ? 'up' : 'down';
      }
    }

    // Check for milestones
    this.checkMilestone(metricId, value);

    // Track significant changes
    if (Math.abs(metric.changePercentage) > 20) {
      this.createAlert({
        type: metric.changePercentage > 0 ? 'improvement' : 'decline',
        metric: metricId,
        message: `${metric.name} has ${metric.trend === 'up' ? 'improved' : 'declined'} by ${Math.abs(metric.changePercentage).toFixed(1)}%`,
        severity: Math.abs(metric.changePercentage) > 50 ? 'high' : 'medium'
      });
    }

    this.analyticsService.trackEvent('metric_updated', {
      metric: metricId,
      value,
      trend: metric.trend,
      change: metric.changePercentage
    });
  }

  private checkMilestone(metricId: string, value: number): void {
    const milestoneThresholds = {
      words_per_minute: [10, 20, 30, 40, 50],
      accuracy_rate: [50, 70, 80, 90, 95],
      vocabulary_growth: [50, 100, 200, 500, 1000],
      independence_score: [25, 50, 75, 90, 95]
    };

    const thresholds = milestoneThresholds[metricId as keyof typeof milestoneThresholds];
    if (!thresholds) return;

    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return;

    for (const threshold of thresholds) {
      const milestoneId = `${metricId}-${threshold}`;
      const existingMilestone = performance.milestones.find(m => m.id === milestoneId);
      
      if (!existingMilestone && value >= threshold) {
        const metric = this.metricDefinitions.get(metricId);
        const milestone: Milestone = {
          id: milestoneId,
          name: `${metric?.name} - ${threshold}${metric?.unit}`,
          description: `Achieved ${threshold}${metric?.unit} in ${metric?.name}`,
          achievedAt: new Date(),
          metric: metricId,
          value,
          threshold
        };

        performance.milestones.push(milestone);
        
        this.createAlert({
          type: 'milestone',
          metric: metricId,
          message: `Milestone achieved: ${milestone.name}!`,
          severity: 'high'
        });

        this.analyticsService.trackEvent('milestone_achieved', {
          milestone: milestoneId,
          metric: metricId,
          value,
          threshold
        });
      }
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return;

    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}`,
      ...alertData,
      timestamp: new Date(),
      acknowledged: false
    };

    performance.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (performance.alerts.length > 50) {
      performance.alerts = performance.alerts.slice(-50);
    }

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('performanceAlert', {
      detail: alert
    }));
  }

  private createPerformanceSnapshot(): void {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return;

    const metrics: Record<string, number> = {};
    performance.metrics.forEach((metric, id) => {
      metrics[id] = metric.value;
    });

    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(),
      metrics,
      sessionId: this.usagePatternsService.getCurrentSession()?.id,
      context: this.inferContext()
    };

    performance.history.push(snapshot);
    
    // Keep only last 1000 snapshots
    if (performance.history.length > 1000) {
      performance.history = performance.history.slice(-1000);
    }

    this.savePerformanceData();
  }

  private detectAnomalies(): void {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance || performance.history.length < 10) return;

    performance.metrics.forEach((metric, metricId) => {
      const recentValues = performance.history
        .slice(-20)
        .map(h => h.metrics[metricId])
        .filter(v => v !== undefined);

      if (recentValues.length < 10) return;

      // Calculate statistics
      const mean = recentValues.reduce((a, b) => a + b) / recentValues.length;
      const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length;
      const stdDev = Math.sqrt(variance);

      // Check if current value is an anomaly (> 2 standard deviations)
      if (Math.abs(metric.value - mean) > 2 * stdDev) {
        this.createAlert({
          type: 'anomaly',
          metric: metricId,
          message: `Unusual ${metric.name} detected: ${metric.value.toFixed(1)}${metric.unit} (typically ${mean.toFixed(1)}${metric.unit})`,
          severity: 'medium'
        });
      }
    });
  }

  // Calculation Methods
  private calculateVocabularySize(): number {
    const uniqueTiles = this.dataService.getData('unique_tiles_used') || new Set();
    return uniqueTiles.size;
  }

  private calculateAccuracyRate(): number {
    const sessions = this.usagePatternsService.getSessionHistory(10);
    if (sessions.length === 0) return 0;

    let totalAttempts = 0;
    let successfulAttempts = 0;

    sessions.forEach(session => {
      totalAttempts += session.tilesUsed;
      successfulAttempts += session.sentenceCount * 5; // Assume 5 tiles per sentence
    });

    return totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
  }

  private calculateEfficiencyScore(): number {
    const wpm = this.getMetric('words_per_minute')?.value || 0;
    const accuracy = this.getMetric('accuracy_rate')?.value || 0;
    const completionTime = this.getMetric('sentence_completion_time')?.value || 1;
    
    // Efficiency = (WPM * Accuracy) / Completion Time
    return (wpm * (accuracy / 100)) / Math.max(completionTime, 1);
  }

  private calculateLearningVelocity(): number {
    const performance = this.userPerformance.get(this.getCurrentUserId());
    if (!performance || performance.history.length < 2) return 0;

    // Compare current metrics to 7 days ago
    const currentSnapshot = performance.history[performance.history.length - 1];
    const weekAgoSnapshot = performance.history.find(s => 
      Date.now() - s.timestamp.getTime() >= 7 * 24 * 60 * 60 * 1000
    );

    if (!weekAgoSnapshot) return 0;

    // Calculate improvement across key metrics
    const improvements = ['words_per_minute', 'accuracy_rate', 'vocabulary_growth']
      .map(metric => {
        const current = currentSnapshot.metrics[metric] || 0;
        const previous = weekAgoSnapshot.metrics[metric] || 0;
        return previous > 0 ? ((current - previous) / previous) * 100 : 0;
      });

    // Average improvement rate
    return improvements.reduce((a, b) => a + b) / improvements.length;
  }

  private calculateIndependenceScore(): number {
    const errorRate = this.getMetric('error_correction_rate')?.value || 0;
    const efficiency = this.getMetric('communication_efficiency')?.value || 0;
    const engagement = this.getMetric('session_engagement')?.value || 0;
    
    // Independence = High efficiency + Low errors + Consistent engagement
    const errorScore = Math.max(0, 100 - errorRate);
    const efficiencyScore = Math.min(100, efficiency * 10);
    const engagementScore = Math.min(100, engagement * 2);
    
    return (errorScore + efficiencyScore + engagementScore) / 3;
  }

  private inferContext(): string {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    if (hour < 9) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 14) return 'lunch';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
  }

  private handlePerformanceMeasure(entry: PerformanceEntry): void {
    // Handle custom performance measures
    if (entry.name.startsWith('tile-render-')) {
      this.systemMetrics.renderTime = entry.duration;
    } else if (entry.name.startsWith('api-call-')) {
      this.systemMetrics.apiLatency = entry.duration;
    }
  }

  // Goal Management
  async setPerformanceGoal(
    metric: string,
    targetValue: number,
    deadline?: Date
  ): Promise<PerformanceGoal> {
    const currentMetric = this.getMetric(metric);
    if (!currentMetric) {
      throw new Error(`Unknown metric: ${metric}`);
    }

    const goal: PerformanceGoal = {
      id: `goal-${Date.now()}`,
      metric,
      targetValue,
      currentValue: currentMetric.value,
      deadline,
      progress: (currentMetric.value / targetValue) * 100,
      status: 'active'
    };

    this.goals.set(goal.id, goal);
    
    this.analyticsService.trackEvent('goal_created', {
      metric,
      targetValue,
      currentValue: currentMetric.value,
      deadline: deadline?.toISOString()
    });

    return goal;
  }

  private checkGoalProgress(): void {
    this.goals.forEach(goal => {
      if (goal.status !== 'active') return;

      const currentMetric = this.getMetric(goal.metric);
      if (!currentMetric) return;

      goal.currentValue = currentMetric.value;
      goal.progress = (currentMetric.value / goal.targetValue) * 100;

      // Check if goal is completed
      if (goal.currentValue >= goal.targetValue) {
        goal.status = 'completed';
        
        this.createAlert({
          type: 'milestone',
          metric: goal.metric,
          message: `Goal achieved: ${currentMetric.name} reached ${goal.targetValue}${currentMetric.unit}!`,
          severity: 'high'
        });

        this.analyticsService.trackEvent('goal_completed', {
          goalId: goal.id,
          metric: goal.metric,
          targetValue: goal.targetValue,
          achievedValue: goal.currentValue
        });
      }

      // Check if deadline is missed
      if (goal.deadline && new Date() > goal.deadline && goal.status === 'active') {
        goal.status = 'missed';
        
        this.createAlert({
          type: 'decline',
          metric: goal.metric,
          message: `Goal deadline missed: ${currentMetric.name} target of ${goal.targetValue}${currentMetric.unit}`,
          severity: 'medium'
        });
      }
    });
  }

  // Reporting Methods
  async generatePerformanceReport(
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    summary: any;
    metrics: PerformanceMetric[];
    trends: any;
    goals: PerformanceGoal[];
    milestones: Milestone[];
    recommendations: string[];
  }> {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) {
      throw new Error('No performance data available');
    }

    const metrics = Array.from(performance.metrics.values());
    const trends = this.analyzeTrends(performance.history, timeframe);
    const activeGoals = Array.from(this.goals.values());
    const recentMilestones = this.getRecentMilestones(timeframe);
    const recommendations = this.generateRecommendations(metrics, trends);

    const summary = {
      overallScore: this.calculateOverallScore(metrics),
      improvementRate: this.calculateImprovementRate(performance.history),
      strongestAreas: this.identifyStrengths(metrics),
      areasForImprovement: this.identifyWeaknesses(metrics),
      systemHealth: this.getSystemHealth()
    };

    return {
      summary,
      metrics,
      trends,
      goals: activeGoals,
      milestones: recentMilestones,
      recommendations
    };
  }

  private analyzeTrends(
    history: PerformanceSnapshot[], 
    timeframe: string
  ): Record<string, any> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const relevantHistory = history.filter(h => h.timestamp.getTime() > cutoff);
    
    const trends: Record<string, any> = {};
    
    this.metricDefinitions.forEach((def, metricId) => {
      const values = relevantHistory.map(h => h.metrics[metricId]).filter(v => v !== undefined);
      
      if (values.length > 1) {
        trends[metricId] = {
          direction: this.calculateTrendDirection(values),
          volatility: this.calculateVolatility(values),
          average: values.reduce((a, b) => a + b) / values.length,
          peak: Math.max(...values),
          low: Math.min(...values)
        };
      }
    });

    return trends;
  }

  private calculateTrendDirection(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'improving' : 'declining';
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateOverallScore(metrics: PerformanceMetric[]): number {
    // Weighted average of normalized metrics
    const weights = {
      words_per_minute: 0.2,
      accuracy_rate: 0.2,
      communication_efficiency: 0.2,
      independence_score: 0.2,
      learning_velocity: 0.1,
      session_engagement: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    metrics.forEach(metric => {
      const weight = weights[metric.id as keyof typeof weights] || 0;
      if (weight > 0) {
        // Normalize to 0-100 scale
        let normalizedValue = metric.value;
        if (metric.unit !== '%' && metric.unit !== 'score') {
          // Use predefined ranges for normalization
          const ranges: Record<string, [number, number]> = {
            words_per_minute: [0, 50],
            sentence_completion_time: [30, 1], // Inverted - lower is better
            vocabulary_growth: [0, 1000],
            session_engagement: [0, 60]
          };
          
          const range = ranges[metric.id];
          if (range) {
            if (metric.id === 'sentence_completion_time') {
              // Invert for metrics where lower is better
              normalizedValue = ((range[0] - metric.value) / (range[0] - range[1])) * 100;
            } else {
              normalizedValue = ((metric.value - range[0]) / (range[1] - range[0])) * 100;
            }
          }
        }
        
        totalScore += normalizedValue * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateImprovementRate(history: PerformanceSnapshot[]): number {
    if (history.length < 2) return 0;
    
    const recent = history.slice(-10);
    const older = history.slice(-20, -10);
    
    if (older.length === 0) return 0;
    
    const recentScore = recent.reduce((sum, h) => {
      const metrics = Object.values(h.metrics);
      return sum + metrics.reduce((a, b) => a + b, 0) / metrics.length;
    }, 0) / recent.length;
    
    const olderScore = older.reduce((sum, h) => {
      const metrics = Object.values(h.metrics);
      return sum + metrics.reduce((a, b) => a + b, 0) / metrics.length;
    }, 0) / older.length;
    
    return ((recentScore - olderScore) / olderScore) * 100;
  }

  private identifyStrengths(metrics: PerformanceMetric[]): string[] {
    return metrics
      .filter(m => m.trend === 'up' || (m.category === 'accuracy' && m.value > 80))
      .map(m => m.name)
      .slice(0, 3);
  }

  private identifyWeaknesses(metrics: PerformanceMetric[]): string[] {
    return metrics
      .filter(m => m.trend === 'down' || (m.category === 'accuracy' && m.value < 50))
      .map(m => m.name)
      .slice(0, 3);
  }

  private generateRecommendations(
    metrics: PerformanceMetric[], 
    trends: any
  ): string[] {
    const recommendations: string[] = [];

    // Check for low accuracy
    const accuracy = metrics.find(m => m.id === 'accuracy_rate');
    if (accuracy && accuracy.value < 70) {
      recommendations.push('Consider slowing down to improve accuracy. Quality over speed!');
    }

    // Check for declining trends
    Object.entries(trends).forEach(([metricId, trend]: [string, any]) => {
      if (trend.direction === 'declining') {
        const metric = metrics.find(m => m.id === metricId);
        if (metric) {
          recommendations.push(`Focus on improving ${metric.name} - it's been declining recently.`);
        }
      }
    });

    // Check for low engagement
    const engagement = metrics.find(m => m.id === 'session_engagement');
    if (engagement && engagement.value < 10) {
      recommendations.push('Try longer practice sessions for better progress.');
    }

    // Check for high volatility
    Object.entries(trends).forEach(([metricId, trend]: [string, any]) => {
      if (trend.volatility > 0.3) {
        const metric = metrics.find(m => m.id === metricId);
        if (metric) {
          recommendations.push(`Work on consistency with ${metric.name}.`);
        }
      }
    });

    return recommendations.slice(0, 5);
  }

  private getSystemHealth(): Record<string, any> {
    const errorThreshold = 5; // 5% error rate threshold
    const latencyThreshold = 200; // 200ms latency threshold
    
    return {
      status: this.systemMetrics.errorRate < errorThreshold && 
              this.systemMetrics.apiLatency < latencyThreshold ? 'healthy' : 'degraded',
      metrics: this.systemMetrics,
      issues: [
        ...(this.systemMetrics.errorRate >= errorThreshold ? ['High error rate detected'] : []),
        ...(this.systemMetrics.apiLatency >= latencyThreshold ? ['High latency detected'] : []),
        ...(this.systemMetrics.memoryUsage > 80 ? ['High memory usage'] : [])
      ]
    };
  }

  // Helper Methods
  private loadHistoricalData(): void {
    const saved = this.dataService.getData('performance_data');
    if (saved) {
      // Restore user performance data
      Object.entries(saved.users || {}).forEach(([userId, data]: [string, any]) => {
        const metrics = new Map(Object.entries(data.metrics || {}));
        this.userPerformance.set(userId, {
          userId,
          metrics,
          history: data.history || [],
          milestones: data.milestones || [],
          alerts: data.alerts || []
        });
      });

      // Restore goals
      Object.entries(saved.goals || {}).forEach(([id, goal]: [string, any]) => {
        this.goals.set(id, goal);
      });
    }
  }

  private savePerformanceData(): void {
    const data = {
      users: {},
      goals: {}
    };

    // Save user performance
    this.userPerformance.forEach((performance, userId) => {
      data.users[userId as keyof typeof data.users] = {
        metrics: Object.fromEntries(performance.metrics),
        history: performance.history.slice(-1000), // Keep last 1000 snapshots
        milestones: performance.milestones,
        alerts: performance.alerts.slice(-50) // Keep last 50 alerts
      };
    });

    // Save goals
    this.goals.forEach((goal, id) => {
      data.goals[id as keyof typeof data.goals] = goal;
    });

    this.dataService.setData('performance_data', data);
  }

  private getCurrentUserId(): string {
    return this.dataService.getData('current_user_id') || 'default';
  }

  private getTimeframeCutoff(timeframe: string): number {
    const now = Date.now();
    const cutoffs = {
      day: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000
    };
    return cutoffs[timeframe as keyof typeof cutoffs] || cutoffs.week;
  }

  private getRecentMilestones(timeframe: string): Milestone[] {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    
    if (!performance) return [];
    
    return performance.milestones
      .filter(m => m.achievedAt.getTime() > cutoff)
      .sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());
  }

  // Public API
  getMetric(metricId: string): PerformanceMetric | undefined {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    return performance?.metrics.get(metricId);
  }

  getAllMetrics(): PerformanceMetric[] {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    return performance ? Array.from(performance.metrics.values()) : [];
  }

  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.getAllMetrics().filter(m => m.category === category);
  }

  getAlerts(unacknowledgedOnly = false): PerformanceAlert[] {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return [];
    
    const alerts = performance.alerts;
    return unacknowledgedOnly ? alerts.filter(a => !a.acknowledged) : alerts;
  }

  acknowledgeAlert(alertId: string): void {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return;
    
    const alert = performance.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.savePerformanceData();
    }
  }

  getGoals(activeOnly = true): PerformanceGoal[] {
    const goals = Array.from(this.goals.values());
    return activeOnly ? goals.filter(g => g.status === 'active') : goals;
  }

  getMilestones(limit?: number): Milestone[] {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    if (!performance) return [];
    
    const milestones = performance.milestones
      .sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());
    
    return limit ? milestones.slice(0, limit) : milestones;
  }

  getSystemMetrics(): SystemPerformance {
    return { ...this.systemMetrics };
  }

  exportPerformanceData(): any {
    const userId = this.getCurrentUserId();
    const performance = this.userPerformance.get(userId);
    
    return {
      user: userId,
      metrics: performance ? Object.fromEntries(performance.metrics) : {},
      history: performance?.history || [],
      milestones: performance?.milestones || [],
      goals: Array.from(this.goals.values()),
      systemMetrics: this.systemMetrics,
      exportDate: new Date().toISOString()
    };
  }

  // Cleanup
  destroy(): void {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.savePerformanceData();
  }
}

export function getPerformanceMetricsService(): PerformanceMetricsService {
  return PerformanceMetricsService.getInstance();
}