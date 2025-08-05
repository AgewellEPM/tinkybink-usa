import { useState, useEffect, useCallback } from 'react';
import { 
  getPerformanceMetricsService,
  getUsagePatternsService,
  getDataVisualizationService,
  getReportGenerationService,
  getPredictiveAnalyticsService
} from '@/modules/module-system';

export interface AnalyticsData {
  performance: {
    overallScore: number;
    metrics: any[];
    goals: any[];
    milestones: any[];
    alerts: any[];
  };
  patterns: {
    currentSession: any;
    recentSessions: any[];
    patterns: any[];
    habits: any[];
  };
  predictions: {
    nextWords: string[];
    learningPath: any;
    behaviorPredictions: any[];
  };
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    performance: {
      overallScore: 0,
      metrics: [],
      goals: [],
      milestones: [],
      alerts: []
    },
    patterns: {
      currentSession: null,
      recentSessions: [],
      patterns: [],
      habits: []
    },
    predictions: {
      nextWords: [],
      learningPath: null,
      behaviorPredictions: []
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const performanceService = getPerformanceMetricsService();
      const patternsService = getUsagePatternsService();
      const predictiveService = getPredictiveAnalyticsService();

      // Get performance data
      const performanceReport = await performanceService.generatePerformanceReport();
      const metrics = performanceService.getAllMetrics();
      const goals = performanceService.getGoals();
      const milestones = performanceService.getMilestones(10);
      const alerts = performanceService.getAlerts(true);

      // Get patterns data
      const currentSession = patternsService.getCurrentSession();
      const recentSessions = patternsService.getSessionHistory(20);
      const patternsAnalysis = await patternsService.analyzeUsagePatterns();

      // Get predictions (with fallback if service not available)
      let nextWords: string[] = [];
      let learningPath = null;
      let behaviorPredictions: any[] = [];
      
      try {
        nextWords = await predictiveService.predictNextWords('', 5);
        learningPath = await predictiveService.generateLearningPath();
        behaviorPredictions = await predictiveService.predictBehavior();
      } catch (predError) {
        console.warn('Predictive analytics not available:', predError);
      }

      setData({
        performance: {
          overallScore: performanceReport.summary.overallScore,
          metrics,
          goals,
          milestones,
          alerts
        },
        patterns: {
          currentSession,
          recentSessions,
          patterns: patternsAnalysis.patterns,
          habits: patternsAnalysis.habits
        },
        predictions: {
          nextWords,
          learningPath,
          behaviorPredictions
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data loading
  useEffect(() => {
    loadData();

    // Set up event listeners for real-time updates
    const handleMetricUpdate = () => loadData();
    const handlePatternDetected = () => loadData();
    const handleMilestoneAchieved = () => loadData();

    window.addEventListener('metricUpdated', handleMetricUpdate);
    window.addEventListener('patternDetected', handlePatternDetected);
    window.addEventListener('milestoneAchieved', handleMilestoneAchieved);

    // Auto-refresh every 2 minutes
    const interval = setInterval(loadData, 2 * 60 * 1000);

    return () => {
      window.removeEventListener('metricUpdated', handleMetricUpdate);
      window.removeEventListener('patternDetected', handlePatternDetected);
      window.removeEventListener('milestoneAchieved', handleMilestoneAchieved);
      clearInterval(interval);
    };
  }, [loadData]);

  // Generate a report
  const generateReport = useCallback(async (
    type: 'progress' | 'clinical' | 'educational' | 'executive' = 'progress'
  ) => {
    try {
      const reportService = getReportGenerationService();
      const templates = reportService.getTemplates();
      const template = templates.find(t => t.type === type);
      
      if (!template) {
        throw new Error(`Template for ${type} report not found`);
      }

      const config = reportService.createReportFromTemplate(template.id, {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`
      });

      const report = await reportService.generateReport(config.id);
      return report;
    } catch (err) {
      throw new Error(`Failed to generate ${type} report: ${err}`);
    }
  }, []);

  // Create a visualization
  const createVisualization = useCallback((
    type: 'performance' | 'usage' | 'comparison',
    options?: any
  ) => {
    try {
      const vizService = getDataVisualizationService();
      
      switch (type) {
        case 'performance':
          return vizService.createPerformanceChart(
            options?.metric || 'words_per_minute',
            options?.timeRange || 'week'
          );
        case 'usage':
          return vizService.createHeatmap('usage');
        case 'comparison':
          return vizService.createComparisonChart(
            options?.metrics || ['words_per_minute', 'accuracy_rate'],
            options?.timeRange || 'week'
          );
        default:
          throw new Error(`Unknown visualization type: ${type}`);
      }
    } catch (err) {
      throw new Error(`Failed to create ${type} visualization: ${err}`);
    }
  }, []);

  // Set a performance goal
  const setGoal = useCallback(async (
    metric: string,
    targetValue: number,
    deadline?: Date
  ) => {
    try {
      const performanceService = getPerformanceMetricsService();
      const goal = await performanceService.setPerformanceGoal(metric, targetValue, deadline);
      await loadData(); // Refresh data
      return goal;
    } catch (err) {
      throw new Error(`Failed to set goal: ${err}`);
    }
  }, [loadData]);

  // Get predictions for text input
  const getPredictions = useCallback(async (text: string, limit: number = 5) => {
    try {
      const predictiveService = getPredictiveAnalyticsService();
      return await predictiveService.predictNextWords(text, limit);
    } catch (err) {
      console.warn('Predictions not available:', err);
      return [];
    }
  }, []);

  // Get current performance summary
  const getPerformanceSummary = useCallback(() => {
    const { performance } = data;
    
    return {
      overallScore: performance.overallScore,
      keyMetrics: performance.metrics.slice(0, 4).map(m => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        trend: m.trend
      })),
      activeGoals: performance.goals.filter(g => g.status === 'active').length,
      recentMilestones: performance.milestones.slice(0, 3),
      urgentAlerts: performance.alerts.filter(a => a.severity === 'high').length
    };
  }, [data]);

  return {
    // Data
    data,
    isLoading,
    error,
    
    // Actions
    refresh: loadData,
    generateReport,
    createVisualization,
    setGoal,
    getPredictions,
    
    // Computed values
    performanceSummary: getPerformanceSummary(),
    
    // Service accessors (for advanced usage)
    services: {
      performance: getPerformanceMetricsService,
      patterns: getUsagePatternsService,
      visualization: getDataVisualizationService,
      reports: getReportGenerationService,
      predictions: getPredictiveAnalyticsService
    }
  };
}

// Hook for quick performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const service = getPerformanceMetricsService();
        const allMetrics = service.getAllMetrics();
        const report = await service.generatePerformanceReport();
        
        setMetrics(allMetrics);
        setOverallScore(report.summary.overallScore);
      } catch (error) {
        console.error('Error loading performance metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    
    const interval = setInterval(loadMetrics, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return { metrics, overallScore, isLoading };
}

// Hook for usage patterns
export function useUsagePatterns() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const service = getUsagePatternsService();
        const analysis = await service.analyzeUsagePatterns();
        const session = service.getCurrentSession();
        
        setPatterns(analysis.patterns);
        setCurrentSession(session);
      } catch (error) {
        console.error('Error loading usage patterns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatterns();
    
    const interval = setInterval(loadPatterns, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return { patterns, currentSession, isLoading };
}