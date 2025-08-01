// Module 16: Therapy Goals Service
// Manages therapy goals, progress tracking, and professional reporting

import { getAnalyticsService } from '../core/analytics-service';
import { getSessionTrackingService } from '../ui/session-tracking-service';
import { getDataService } from '../core/data-service';

export interface TherapyGoal {
  id: string;
  patientId: string;
  title: string;
  description: string;
  targetDate: Date;
  createdDate: Date;
  status: 'active' | 'completed' | 'paused' | 'discontinued';
  category: 'communication' | 'vocabulary' | 'sentence-building' | 'social' | 'motor' | 'cognitive';
  metrics: GoalMetric[];
  milestones: Milestone[];
  notes: TherapyNote[];
}

export interface GoalMetric {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  measurementType: 'count' | 'percentage' | 'duration' | 'frequency';
  history: MetricDataPoint[];
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  note?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'achieved' | 'missed';
}

export interface TherapyNote {
  id: string;
  timestamp: Date;
  author: string;
  content: string;
  type: 'progress' | 'observation' | 'recommendation' | 'concern';
}

export interface ProgressReport {
  patientId: string;
  period: { start: Date; end: Date };
  goals: TherapyGoal[];
  summary: {
    goalsActive: number;
    goalsCompleted: number;
    milestonesAchieved: number;
    overallProgress: number;
    communicationActs: number;
    vocabularyGrowth: number;
    sessionCount: number;
    totalDuration: number;
  };
  recommendations: string[];
  nextSteps: string[];
}

export class TherapyGoalsService {
  private static instance: TherapyGoalsService;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private sessionTracking: ReturnType<typeof getSessionTrackingService> | null = null;
  private dataService: ReturnType<typeof getDataService> | null = null;
  
  private goals: Map<string, TherapyGoal> = new Map();
  private activePatientId: string = 'default';

  private constructor() {
    console.log('TherapyGoalsService created');
  }

  static getInstance(): TherapyGoalsService {
    if (!TherapyGoalsService.instance) {
      TherapyGoalsService.instance = new TherapyGoalsService();
    }
    return TherapyGoalsService.instance;
  }

  async initialize(): Promise<void> {
    this.analytics = getAnalyticsService();
    this.sessionTracking = getSessionTrackingService();
    this.dataService = getDataService();
    
    // Load saved goals
    this.loadGoals();
    
    // Start monitoring progress
    this.startProgressMonitoring();
    
    console.log('TherapyGoalsService initialized');
  }

  // Create a new therapy goal
  createGoal(goal: Omit<TherapyGoal, 'id' | 'createdDate'>): TherapyGoal {
    const newGoal: TherapyGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdDate: new Date()
    };
    
    this.goals.set(newGoal.id, newGoal);
    this.saveGoals();
    
    this.analytics?.track('therapy_goal_created', {
      goalId: newGoal.id,
      category: newGoal.category,
      targetDate: newGoal.targetDate
    });
    
    return newGoal;
  }

  // Update goal
  updateGoal(goalId: string, updates: Partial<TherapyGoal>): TherapyGoal | null {
    const goal = this.goals.get(goalId);
    if (!goal) return null;
    
    const updatedGoal = { ...goal, ...updates };
    this.goals.set(goalId, updatedGoal);
    this.saveGoals();
    
    this.analytics?.track('therapy_goal_updated', {
      goalId,
      updates: Object.keys(updates)
    });
    
    return updatedGoal;
  }

  // Add metric data point
  recordMetricProgress(goalId: string, metricId: string, value: number, note?: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    
    const metric = goal.metrics.find(m => m.id === metricId);
    if (!metric) return;
    
    metric.currentValue = value;
    metric.history.push({
      timestamp: new Date(),
      value,
      note
    });
    
    // Check if goal is completed
    this.checkGoalCompletion(goal);
    
    this.saveGoals();
    
    this.analytics?.track('metric_progress_recorded', {
      goalId,
      metricId,
      value,
      progress: (value / metric.targetValue) * 100
    });
  }

  // Add therapy note
  addNote(goalId: string, note: Omit<TherapyNote, 'id' | 'timestamp'>): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    
    const newNote: TherapyNote = {
      ...note,
      id: `note_${Date.now()}`,
      timestamp: new Date()
    };
    
    goal.notes.push(newNote);
    this.saveGoals();
    
    this.analytics?.track('therapy_note_added', {
      goalId,
      noteType: note.type
    });
  }

  // Complete milestone
  completeMilestone(goalId: string, milestoneId: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    
    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    milestone.status = 'achieved';
    milestone.completedDate = new Date();
    
    this.saveGoals();
    
    this.analytics?.track('milestone_completed', {
      goalId,
      milestoneId,
      daysEarly: Math.floor((milestone.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    });
  }

  // Generate progress report
  generateProgressReport(
    patientId: string, 
    startDate: Date, 
    endDate: Date
  ): ProgressReport {
    const patientGoals = Array.from(this.goals.values())
      .filter(g => g.patientId === patientId);
    
    const sessionData = this.sessionTracking?.getSessionSummary() || {
      totalSessions: 0,
      totalDuration: 0,
      totalCommunicationActs: 0,
      averageSessionLength: 0
    };
    
    const summary = {
      goalsActive: patientGoals.filter(g => g.status === 'active').length,
      goalsCompleted: patientGoals.filter(g => g.status === 'completed').length,
      milestonesAchieved: patientGoals
        .flatMap(g => g.milestones)
        .filter(m => m.status === 'achieved' && 
          m.completedDate && 
          m.completedDate >= startDate && 
          m.completedDate <= endDate
        ).length,
      overallProgress: this.calculateOverallProgress(patientGoals),
      communicationActs: sessionData.totalCommunicationActs,
      vocabularyGrowth: this.calculateVocabularyGrowth(patientId, startDate, endDate),
      sessionCount: sessionData.totalSessions,
      totalDuration: sessionData.totalDuration
    };
    
    const recommendations = this.generateRecommendations(patientGoals, summary);
    const nextSteps = this.generateNextSteps(patientGoals);
    
    const report: ProgressReport = {
      patientId,
      period: { start: startDate, end: endDate },
      goals: patientGoals,
      summary,
      recommendations,
      nextSteps
    };
    
    this.analytics?.track('progress_report_generated', {
      patientId,
      periodDays: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      goalsIncluded: patientGoals.length
    });
    
    return report;
  }

  // Get goals for patient
  getPatientGoals(patientId: string): TherapyGoal[] {
    return Array.from(this.goals.values())
      .filter(g => g.patientId === patientId);
  }

  // Get active goals
  getActiveGoals(): TherapyGoal[] {
    return Array.from(this.goals.values())
      .filter(g => g.status === 'active');
  }

  // Export goals data
  exportGoals(): string {
    const data = {
      goals: Array.from(this.goals.entries()),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Import goals data
  importGoals(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.goals && Array.isArray(data.goals)) {
        data.goals.forEach(([id, goal]: [string, TherapyGoal]) => {
          // Convert date strings back to Date objects
          goal.targetDate = new Date(goal.targetDate);
          goal.createdDate = new Date(goal.createdDate);
          goal.milestones.forEach(m => {
            m.targetDate = new Date(m.targetDate);
            if (m.completedDate) m.completedDate = new Date(m.completedDate);
          });
          goal.notes.forEach(n => {
            n.timestamp = new Date(n.timestamp);
          });
          goal.metrics.forEach(m => {
            m.history.forEach(h => {
              h.timestamp = new Date(h.timestamp);
            });
          });
          
          this.goals.set(id, goal);
        });
        
        this.saveGoals();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import goals:', error);
      return false;
    }
  }

  // Private methods
  private loadGoals(): void {
    const saved = localStorage.getItem('therapyGoals');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        data.forEach(([id, goal]: [string, any]) => {
          // Convert date strings back to Date objects
          goal.targetDate = new Date(goal.targetDate);
          goal.createdDate = new Date(goal.createdDate);
          goal.milestones?.forEach((m: any) => {
            m.targetDate = new Date(m.targetDate);
            if (m.completedDate) m.completedDate = new Date(m.completedDate);
          });
          goal.notes?.forEach((n: any) => {
            n.timestamp = new Date(n.timestamp);
          });
          goal.metrics?.forEach((m: any) => {
            m.history?.forEach((h: any) => {
              h.timestamp = new Date(h.timestamp);
            });
          });
          
          this.goals.set(id, goal);
        });
      } catch (error) {
        console.error('Failed to load goals:', error);
      }
    }
  }

  private saveGoals(): void {
    const data = Array.from(this.goals.entries());
    localStorage.setItem('therapyGoals', JSON.stringify(data));
  }

  private startProgressMonitoring(): void {
    // Monitor session data for automatic progress tracking
    setInterval(() => {
      this.updateAutomaticMetrics();
    }, 60000); // Check every minute
  }

  private updateAutomaticMetrics(): void {
    const activeGoals = this.getActiveGoals();
    
    activeGoals.forEach(goal => {
      // Update communication frequency metrics
      const commMetric = goal.metrics.find(m => 
        m.measurementType === 'frequency' && 
        m.name.toLowerCase().includes('communication')
      );
      
      if (commMetric) {
        const recentActs = this.sessionTracking?.getRecentCommunicationActs(60) || [];
        this.recordMetricProgress(goal.id, commMetric.id, recentActs.length);
      }
      
      // Update vocabulary metrics
      const vocabMetric = goal.metrics.find(m => 
        m.name.toLowerCase().includes('vocabulary')
      );
      
      if (vocabMetric) {
        const uniqueWords = this.getUniqueWordsUsed();
        this.recordMetricProgress(goal.id, vocabMetric.id, uniqueWords);
      }
    });
  }

  private checkGoalCompletion(goal: TherapyGoal): void {
    const allMetricsComplete = goal.metrics.every(m => 
      m.currentValue >= m.targetValue
    );
    
    const allMilestonesComplete = goal.milestones.every(m => 
      m.status === 'achieved'
    );
    
    if (allMetricsComplete && allMilestonesComplete && goal.status === 'active') {
      goal.status = 'completed';
      
      this.analytics?.track('goal_completed', {
        goalId: goal.id,
        daysToComplete: Math.floor(
          (Date.now() - goal.createdDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      });
    }
  }

  private calculateOverallProgress(goals: TherapyGoal[]): number {
    if (goals.length === 0) return 0;
    
    const progressSum = goals.reduce((sum, goal) => {
      const metricProgress = goal.metrics.length > 0 
        ? goal.metrics.reduce((mSum, m) => 
            mSum + Math.min(100, (m.currentValue / m.targetValue) * 100), 0
          ) / goal.metrics.length
        : 0;
      
      return sum + metricProgress;
    }, 0);
    
    return Math.round(progressSum / goals.length);
  }

  private calculateVocabularyGrowth(
    patientId: string, 
    startDate: Date, 
    endDate: Date
  ): number {
    // In a real implementation, this would analyze communication acts
    // For now, return a simulated value
    return Math.floor(Math.random() * 50) + 10;
  }

  private getUniqueWordsUsed(): number {
    // Get unique words from recent communication acts
    const recentActs = this.sessionTracking?.getRecentCommunicationActs(1440) || []; // Last 24 hours
    const words = new Set<string>();
    
    recentActs.forEach(act => {
      const actWords = act.content.toLowerCase().split(/\s+/);
      actWords.forEach(word => words.add(word));
    });
    
    return words.size;
  }

  private generateRecommendations(
    goals: TherapyGoal[], 
    summary: ProgressReport['summary']
  ): string[] {
    const recommendations: string[] = [];
    
    // Check progress rate
    if (summary.overallProgress < 25) {
      recommendations.push('Consider breaking down goals into smaller, more achievable milestones');
      recommendations.push('Increase session frequency to accelerate progress');
    } else if (summary.overallProgress > 75) {
      recommendations.push('Excellent progress! Consider introducing more challenging goals');
    }
    
    // Check session engagement
    if (summary.sessionCount < 5) {
      recommendations.push('Increase session frequency for better outcomes');
    }
    
    if (summary.communicationActs / summary.sessionCount < 10) {
      recommendations.push('Focus on increasing communication attempts per session');
    }
    
    // Check vocabulary growth
    if (summary.vocabularyGrowth < 20) {
      recommendations.push('Introduce new vocabulary categories to expand communication options');
    }
    
    // Goal-specific recommendations
    goals.forEach(goal => {
      if (goal.status === 'active') {
        const daysUntilTarget = Math.floor(
          (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilTarget < 30) {
          const goalProgress = this.calculateGoalProgress(goal);
          if (goalProgress < 70) {
            recommendations.push(
              `Goal "${goal.title}" is at risk - consider adjusting target date or increasing focus`
            );
          }
        }
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  private generateNextSteps(goals: TherapyGoal[]): string[] {
    const nextSteps: string[] = [];
    
    goals.forEach(goal => {
      if (goal.status === 'active') {
        // Find next pending milestone
        const nextMilestone = goal.milestones
          .filter(m => m.status === 'pending')
          .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())[0];
        
        if (nextMilestone) {
          nextSteps.push(`Work towards: ${nextMilestone.title} (Target: ${
            nextMilestone.targetDate.toLocaleDateString()
          })`);
        }
        
        // Find metrics needing attention
        goal.metrics.forEach(metric => {
          const progress = (metric.currentValue / metric.targetValue) * 100;
          if (progress < 50) {
            nextSteps.push(
              `Focus on improving ${metric.name}: ${metric.currentValue}/${metric.targetValue} ${metric.unit}`
            );
          }
        });
      }
    });
    
    return nextSteps.slice(0, 5); // Return top 5 next steps
  }

  private calculateGoalProgress(goal: TherapyGoal): number {
    if (goal.metrics.length === 0) return 0;
    
    const metricProgress = goal.metrics.reduce((sum, m) => 
      sum + Math.min(100, (m.currentValue / m.targetValue) * 100), 0
    ) / goal.metrics.length;
    
    return Math.round(metricProgress);
  }
}

// Singleton getter
export function getTherapyGoalsService(): TherapyGoalsService {
  return TherapyGoalsService.getInstance();
}