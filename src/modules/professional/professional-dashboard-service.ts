// Module 17: Professional Dashboard Service
// Provides comprehensive dashboard for therapists and healthcare professionals

import { getTherapyGoalsService } from './therapy-goals-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getSessionTrackingService } from '../ui/session-tracking-service';
import { getDataService } from '../core/data-service';

export interface DashboardMetrics {
  patients: PatientSummary[];
  overallStats: OverallStats;
  recentActivity: ActivityItem[];
  alerts: Alert[];
  upcomingEvents: ScheduledEvent[];
  performanceMetrics: PerformanceMetrics;
}

export interface PatientSummary {
  id: string;
  name: string;
  avatar?: string;
  lastSession?: Date;
  weeklyProgress: number;
  activeGoals: number;
  communicationLevel: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'inactive' | 'on-break';
  nextAppointment?: Date;
  alerts: number;
}

export interface OverallStats {
  totalPatients: number;
  activePatients: number;
  totalSessions: number;
  averageSessionLength: number;
  totalCommunicationActs: number;
  goalsCompleted: number;
  goalsInProgress: number;
  weeklyGrowth: number;
}

export interface ActivityItem {
  id: string;
  timestamp: Date;
  patientId: string;
  patientName: string;
  type: 'session' | 'goal' | 'milestone' | 'communication' | 'alert';
  description: string;
  importance: 'low' | 'medium' | 'high';
  data?: any;
}

export interface Alert {
  id: string;
  timestamp: Date;
  patientId?: string;
  type: 'goal-at-risk' | 'no-recent-activity' | 'milestone-due' | 'exceptional-progress' | 'system';
  severity: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionRequired: boolean;
  actions?: AlertAction[];
}

export interface AlertAction {
  label: string;
  action: string;
  data?: any;
}

export interface ScheduledEvent {
  id: string;
  patientId: string;
  patientName: string;
  type: 'appointment' | 'assessment' | 'goal-review' | 'report-due';
  date: Date;
  duration?: number;
  location?: string;
  notes?: string;
}

export interface PerformanceMetrics {
  communicationGrowth: ChartData;
  goalProgress: ChartData;
  sessionEngagement: ChartData;
  vocabularyExpansion: ChartData;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface InsightReport {
  patientId: string;
  insights: Insight[];
  recommendations: string[];
  trends: TrendAnalysis[];
}

export interface Insight {
  type: 'positive' | 'concern' | 'neutral';
  category: string;
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
  significance: 'low' | 'medium' | 'high';
}

export class ProfessionalDashboardService {
  private static instance: ProfessionalDashboardService;
  private therapyGoals: ReturnType<typeof getTherapyGoalsService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private sessionTracking: ReturnType<typeof getSessionTrackingService> | null = null;
  private dataService: ReturnType<typeof getDataService> | null = null;
  
  private patients: Map<string, PatientSummary> = new Map();
  private activities: ActivityItem[] = [];
  private alerts: Alert[] = [];
  private events: ScheduledEvent[] = [];

  private constructor() {
    console.log('ProfessionalDashboardService created');
  }

  static getInstance(): ProfessionalDashboardService {
    if (!ProfessionalDashboardService.instance) {
      ProfessionalDashboardService.instance = new ProfessionalDashboardService();
    }
    return ProfessionalDashboardService.instance;
  }

  async initialize(): Promise<void> {
    this.therapyGoals = getTherapyGoalsService();
    this.analytics = getAnalyticsService();
    this.sessionTracking = getSessionTrackingService();
    this.dataService = getDataService();
    
    // Load saved data
    this.loadDashboardData();
    
    // Start monitoring
    this.startMonitoring();
    
    // Generate initial alerts
    this.generateAlerts();
    
    console.log('ProfessionalDashboardService initialized');
  }

  // Get complete dashboard metrics
  getDashboardMetrics(): DashboardMetrics {
    const overallStats = this.calculateOverallStats();
    const performanceMetrics = this.generatePerformanceMetrics();
    
    return {
      patients: Array.from(this.patients.values()),
      overallStats,
      recentActivity: this.getRecentActivity(20),
      alerts: this.getActiveAlerts(),
      upcomingEvents: this.getUpcomingEvents(10),
      performanceMetrics
    };
  }

  // Get patient-specific dashboard
  getPatientDashboard(patientId: string): {
    patient: PatientSummary | null;
    goals: any[];
    recentActivity: ActivityItem[];
    insights: InsightReport;
    performanceCharts: PerformanceMetrics;
  } {
    const patient = this.patients.get(patientId);
    if (!patient) return {
      patient: null,
      goals: [],
      recentActivity: [],
      insights: { patientId, insights: [], recommendations: [], trends: [] },
      performanceCharts: this.generateEmptyPerformanceMetrics()
    };
    
    const goals = this.therapyGoals?.getPatientGoals(patientId) || [];
    const recentActivity = this.activities
      .filter(a => a.patientId === patientId)
      .slice(0, 20);
    const insights = this.generatePatientInsights(patientId);
    const performanceCharts = this.generatePatientPerformanceMetrics(patientId);
    
    return {
      patient,
      goals,
      recentActivity,
      insights,
      performanceCharts
    };
  }

  // Add/update patient
  upsertPatient(patient: PatientSummary): void {
    this.patients.set(patient.id, patient);
    this.saveDashboardData();
    
    this.logActivity({
      patientId: patient.id,
      patientName: patient.name,
      type: 'session',
      description: 'Patient profile updated',
      importance: 'low'
    });
  }

  // Log activity
  logActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    const newActivity: ActivityItem = {
      ...activity,
      id: `activity_${Date.now()}`,
      timestamp: new Date()
    };
    
    this.activities.unshift(newActivity);
    
    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(0, 1000);
    }
    
    this.saveDashboardData();
    
    // Check if activity requires alert
    this.checkActivityForAlerts(newActivity);
  }

  // Create alert
  createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date()
    };
    
    this.alerts.push(newAlert);
    this.saveDashboardData();
    
    // Notify if high severity
    if (alert.severity === 'error' || alert.severity === 'warning') {
      this.notifyAlert(newAlert);
    }
  }

  // Schedule event
  scheduleEvent(event: Omit<ScheduledEvent, 'id'>): void {
    const newEvent: ScheduledEvent = {
      ...event,
      id: `event_${Date.now()}`
    };
    
    this.events.push(newEvent);
    this.events.sort((a, b) => a.date.getTime() - b.date.getTime());
    this.saveDashboardData();
  }

  // Generate insights for a patient
  generatePatientInsights(patientId: string): InsightReport {
    const insights: Insight[] = [];
    const recommendations: string[] = [];
    const trends: TrendAnalysis[] = [];
    
    // Analyze communication patterns
    const commPattern = this.analyzeCommuncationPattern(patientId);
    if (commPattern) insights.push(commPattern);
    
    // Analyze goal progress
    const goalInsight = this.analyzeGoalProgress(patientId);
    if (goalInsight) insights.push(goalInsight);
    
    // Analyze session engagement
    const engagementInsight = this.analyzeSessionEngagement(patientId);
    if (engagementInsight) insights.push(engagementInsight);
    
    // Generate recommendations based on insights
    insights.forEach(insight => {
      if (insight.type === 'concern') {
        recommendations.push(...this.generateRecommendationsForInsight(insight));
      }
    });
    
    // Analyze trends
    trends.push(...this.analyzeTrends(patientId));
    
    return {
      patientId,
      insights,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      trends
    };
  }

  // Export dashboard data
  exportDashboardData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      patients: Array.from(this.patients.entries()),
      activities: this.activities,
      alerts: this.alerts,
      events: this.events,
      exportDate: new Date().toISOString(),
      stats: this.calculateOverallStats()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV export would be implemented here
      return this.convertToCSV(data);
    }
  }

  // Private methods
  private loadDashboardData(): void {
    const saved = localStorage.getItem('professionalDashboard');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        // Load patients
        if (data.patients) {
          data.patients.forEach(([id, patient]: [string, any]) => {
            if (patient.lastSession) patient.lastSession = new Date(patient.lastSession);
            if (patient.nextAppointment) patient.nextAppointment = new Date(patient.nextAppointment);
            this.patients.set(id, patient);
          });
        }
        
        // Load activities
        if (data.activities) {
          this.activities = data.activities.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp)
          }));
        }
        
        // Load alerts
        if (data.alerts) {
          this.alerts = data.alerts.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp)
          }));
        }
        
        // Load events
        if (data.events) {
          this.events = data.events.map((e: any) => ({
            ...e,
            date: new Date(e.date)
          }));
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    }
  }

  private saveDashboardData(): void {
    const data = {
      patients: Array.from(this.patients.entries()),
      activities: this.activities.slice(0, 100), // Save only recent 100
      alerts: this.alerts.filter(a => !this.isAlertExpired(a)),
      events: this.events.filter(e => e.date > new Date())
    };
    
    localStorage.setItem('professionalDashboard', JSON.stringify(data));
  }

  private startMonitoring(): void {
    // Monitor for inactive patients
    setInterval(() => {
      this.checkInactivePatients();
      this.checkUpcomingEvents();
      this.updatePatientProgress();
    }, 60000); // Every minute
    
    // Generate daily alerts
    setInterval(() => {
      this.generateAlerts();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private generateAlerts(): void {
    // Check for patients with no recent activity
    this.patients.forEach(patient => {
      if (patient.status === 'active' && patient.lastSession) {
        const daysSinceLastSession = Math.floor(
          (Date.now() - patient.lastSession.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastSession > 7) {
          this.createAlert({
            patientId: patient.id,
            type: 'no-recent-activity',
            severity: 'warning',
            title: 'No Recent Activity',
            message: `${patient.name} hasn't had a session in ${daysSinceLastSession} days`,
            actionRequired: true,
            actions: [
              { label: 'Schedule Session', action: 'schedule_session', data: { patientId: patient.id } },
              { label: 'Send Reminder', action: 'send_reminder', data: { patientId: patient.id } }
            ]
          });
        }
      }
    });
    
    // Check for goals at risk
    const allGoals = this.therapyGoals?.getActiveGoals() || [];
    allGoals.forEach(goal => {
      const daysUntilTarget = Math.floor(
        (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilTarget < 14) {
        const progress = goal.metrics.reduce((sum, m) => 
          sum + (m.currentValue / m.targetValue), 0
        ) / goal.metrics.length * 100;
        
        if (progress < 60) {
          this.createAlert({
            patientId: goal.patientId,
            type: 'goal-at-risk',
            severity: 'warning',
            title: 'Goal at Risk',
            message: `Goal "${goal.title}" is only ${Math.round(progress)}% complete with ${daysUntilTarget} days remaining`,
            actionRequired: true,
            actions: [
              { label: 'Review Goal', action: 'review_goal', data: { goalId: goal.id } },
              { label: 'Adjust Target', action: 'adjust_target', data: { goalId: goal.id } }
            ]
          });
        }
      }
    });
  }

  private calculateOverallStats(): OverallStats {
    const activePatientsCount = Array.from(this.patients.values())
      .filter(p => p.status === 'active').length;
    
    const sessionData = this.sessionTracking?.getSessionSummary() || {
      totalSessions: 0,
      totalDuration: 0,
      totalCommunicationActs: 0,
      averageSessionLength: 0
    };
    
    const allGoals = this.therapyGoals?.getActiveGoals() || [];
    const completedGoals = allGoals.filter(g => g.status === 'completed').length;
    const inProgressGoals = allGoals.filter(g => g.status === 'active').length;
    
    // Calculate weekly growth
    const weeklyGrowth = this.calculateWeeklyGrowth();
    
    return {
      totalPatients: this.patients.size,
      activePatients: activePatientsCount,
      totalSessions: sessionData.totalSessions,
      averageSessionLength: sessionData.averageSessionLength,
      totalCommunicationActs: sessionData.totalCommunicationActs,
      goalsCompleted: completedGoals,
      goalsInProgress: inProgressGoals,
      weeklyGrowth
    };
  }

  private calculateWeeklyGrowth(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentActivities = this.activities.filter(a => 
      a.timestamp > oneWeekAgo && a.type === 'communication'
    ).length;
    
    const previousWeekActivities = this.activities.filter(a => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return a.timestamp > twoWeeksAgo && a.timestamp <= oneWeekAgo && a.type === 'communication';
    }).length;
    
    if (previousWeekActivities === 0) return 0;
    
    return Math.round(((recentActivities - previousWeekActivities) / previousWeekActivities) * 100);
  }

  private generatePerformanceMetrics(): PerformanceMetrics {
    // Generate data for last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    return {
      communicationGrowth: {
        labels: days,
        datasets: [{
          label: 'Communication Acts',
          data: this.generateWeeklyData('communication'),
          color: '#7b3ff2'
        }]
      },
      goalProgress: {
        labels: days,
        datasets: [{
          label: 'Goals Completed',
          data: this.generateWeeklyData('goals'),
          color: '#00C851'
        }]
      },
      sessionEngagement: {
        labels: days,
        datasets: [{
          label: 'Average Engagement',
          data: this.generateWeeklyData('engagement'),
          color: '#FF9800'
        }]
      },
      vocabularyExpansion: {
        labels: days,
        datasets: [{
          label: 'New Words',
          data: this.generateWeeklyData('vocabulary'),
          color: '#2196F3'
        }]
      }
    };
  }

  private generateWeeklyData(metric: string): number[] {
    // Generate simulated data for demo
    // In production, this would pull from actual analytics
    return Array(7).fill(0).map(() => 
      Math.floor(Math.random() * 50) + 20
    );
  }

  private getRecentActivity(limit: number): ActivityItem[] {
    return this.activities.slice(0, limit);
  }

  private getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !this.isAlertExpired(a));
  }

  private getUpcomingEvents(limit: number): ScheduledEvent[] {
    const now = new Date();
    return this.events
      .filter(e => e.date > now)
      .slice(0, limit);
  }

  private isAlertExpired(alert: Alert): boolean {
    const expiryHours = {
      info: 24,
      warning: 72,
      success: 12,
      error: 168 // 1 week
    };
    
    const hoursOld = (Date.now() - alert.timestamp.getTime()) / (1000 * 60 * 60);
    return hoursOld > expiryHours[alert.severity];
  }

  private checkActivityForAlerts(activity: ActivityItem): void {
    // Check for exceptional progress
    if (activity.type === 'milestone' && activity.importance === 'high') {
      this.createAlert({
        patientId: activity.patientId,
        type: 'exceptional-progress',
        severity: 'success',
        title: 'Exceptional Progress!',
        message: `${activity.patientName} ${activity.description}`,
        actionRequired: false
      });
    }
  }

  private notifyAlert(alert: Alert): void {
    // In production, this would send notifications
    console.log('Alert notification:', alert);
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('professionalAlert', { detail: alert }));
  }

  private checkInactivePatients(): void {
    // Already handled in generateAlerts
  }

  private checkUpcomingEvents(): void {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    this.events
      .filter(e => e.date > now && e.date <= in24Hours)
      .forEach(event => {
        const existingAlert = this.alerts.find(a => 
          a.type === 'system' && 
          a.message.includes(event.id)
        );
        
        if (!existingAlert) {
          this.createAlert({
            type: 'system',
            severity: 'info',
            title: 'Upcoming Event',
            message: `${event.type} with ${event.patientName} scheduled for ${event.date.toLocaleString()}`,
            actionRequired: true,
            actions: [
              { label: 'View Details', action: 'view_event', data: { eventId: event.id } }
            ]
          });
        }
      });
  }

  private updatePatientProgress(): void {
    this.patients.forEach(patient => {
      // Update weekly progress
      const goals = this.therapyGoals?.getPatientGoals(patient.id) || [];
      const activeGoals = goals.filter(g => g.status === 'active');
      
      if (activeGoals.length > 0) {
        const progressSum = activeGoals.reduce((sum, goal) => {
          const goalProgress = goal.metrics.reduce((gSum, m) => 
            gSum + Math.min(100, (m.currentValue / m.targetValue) * 100), 0
          ) / goal.metrics.length;
          return sum + goalProgress;
        }, 0);
        
        patient.weeklyProgress = Math.round(progressSum / activeGoals.length);
        patient.activeGoals = activeGoals.length;
      }
    });
    
    this.saveDashboardData();
  }

  private analyzeCommuncationPattern(patientId: string): Insight | null {
    const recentActs = this.sessionTracking?.getRecentCommunicationActs(168) || []; // Last week
    const patientActs = recentActs.filter(a => a.timestamp); // Would filter by patient in real app
    
    if (patientActs.length < 10) {
      return {
        type: 'concern',
        category: 'communication',
        title: 'Low Communication Activity',
        description: 'Communication attempts are below expected levels',
        evidence: [
          `Only ${patientActs.length} communication acts in the past week`,
          'Average expected: 50+ acts per week'
        ],
        confidence: 0.8
      };
    }
    
    return null;
  }

  private analyzeGoalProgress(patientId: string): Insight | null {
    const goals = this.therapyGoals?.getPatientGoals(patientId) || [];
    const activeGoals = goals.filter(g => g.status === 'active');
    
    if (activeGoals.length === 0) return null;
    
    const avgProgress = activeGoals.reduce((sum, goal) => {
      const progress = goal.metrics.reduce((gSum, m) => 
        gSum + (m.currentValue / m.targetValue), 0
      ) / goal.metrics.length;
      return sum + progress;
    }, 0) / activeGoals.length * 100;
    
    if (avgProgress > 75) {
      return {
        type: 'positive',
        category: 'goals',
        title: 'Excellent Goal Progress',
        description: 'Patient is making exceptional progress towards therapy goals',
        evidence: [
          `Average goal completion: ${Math.round(avgProgress)}%`,
          `${activeGoals.length} active goals being tracked`
        ],
        confidence: 0.9
      };
    }
    
    return null;
  }

  private analyzeSessionEngagement(patientId: string): Insight | null {
    // Analyze session patterns
    const sessions = this.activities
      .filter(a => a.patientId === patientId && a.type === 'session')
      .slice(0, 10);
    
    if (sessions.length < 3) {
      return {
        type: 'concern',
        category: 'engagement',
        title: 'Inconsistent Session Attendance',
        description: 'Session frequency is below recommended levels',
        evidence: [
          `Only ${sessions.length} sessions in recent history`,
          'Recommended: 3-5 sessions per week'
        ],
        confidence: 0.7
      };
    }
    
    return null;
  }

  private generateRecommendationsForInsight(insight: Insight): string[] {
    const recommendations: string[] = [];
    
    switch (insight.category) {
      case 'communication':
        recommendations.push(
          'Increase session frequency to encourage more communication attempts',
          'Introduce new motivating topics or activities',
          'Consider adjusting communication difficulty level'
        );
        break;
      case 'engagement':
        recommendations.push(
          'Schedule sessions at optimal times for the patient',
          'Review and adjust session activities for better engagement',
          'Consider shorter, more frequent sessions'
        );
        break;
      case 'goals':
        if (insight.type === 'concern') {
          recommendations.push(
            'Break down complex goals into smaller milestones',
            'Review goal relevance and adjust if needed',
            'Increase focus on struggling areas'
          );
        }
        break;
    }
    
    return recommendations;
  }

  private analyzeTrends(patientId: string): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    
    // Communication trend
    trends.push({
      metric: 'Communication Frequency',
      direction: 'up',
      change: 15,
      period: 'Last 7 days',
      significance: 'medium'
    });
    
    // Vocabulary trend
    trends.push({
      metric: 'Vocabulary Usage',
      direction: 'stable',
      change: 2,
      period: 'Last 7 days',
      significance: 'low'
    });
    
    return trends;
  }

  private generateEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      communicationGrowth: { labels: [], datasets: [] },
      goalProgress: { labels: [], datasets: [] },
      sessionEngagement: { labels: [], datasets: [] },
      vocabularyExpansion: { labels: [], datasets: [] }
    };
  }

  private generatePatientPerformanceMetrics(patientId: string): PerformanceMetrics {
    // In production, this would generate patient-specific charts
    return this.generatePerformanceMetrics();
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion for stats
    const stats = data.stats;
    const csv = [
      'Metric,Value',
      `Total Patients,${stats.totalPatients}`,
      `Active Patients,${stats.activePatients}`,
      `Total Sessions,${stats.totalSessions}`,
      `Average Session Length,${stats.averageSessionLength}`,
      `Total Communication Acts,${stats.totalCommunicationActs}`,
      `Goals Completed,${stats.goalsCompleted}`,
      `Goals In Progress,${stats.goalsInProgress}`,
      `Weekly Growth,${stats.weeklyGrowth}%`
    ];
    
    return csv.join('\n');
  }
}

// Singleton getter
export function getProfessionalDashboardService(): ProfessionalDashboardService {
  return ProfessionalDashboardService.getInstance();
}