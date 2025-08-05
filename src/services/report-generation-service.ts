/**
 * Report Generation Service for Teachers
 * Generates comprehensive reports from collected ML analytics data
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from './firebase-config';
import { authService } from './auth-service';
import { stripeSubscriptionService } from './stripe-subscription-service';

export interface StudentReport {
  studentId: string;
  studentName: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  metrics: StudentMetrics;
  progress: ProgressData;
  recommendations: string[];
  charts: ChartData[];
  rawData?: any[]; // For detailed analysis
}

export interface StudentMetrics {
  // Communication Metrics
  totalSessions: number;
  totalInteractions: number;
  wordsUsed: number;
  uniqueVocabulary: number;
  averageSessionLength: number;
  
  // Performance Metrics
  communicationSpeed: number; // words per minute
  accuracyRate: number; // percentage
  independenceLevel: number; // 0-1 scale
  
  // Engagement Metrics
  avgEngagementScore: number;
  sessionConsistency: number;
  completionRate: number;
  
  // Learning Progress
  vocabularyGrowth: number; // percentage
  complexityImprovement: number;
  categoryDiversity: number;
  
  // Social Communication
  initiatedCommunications: number;
  responsiveComments: number;
  conversationTurns: number;
}

export interface ProgressData {
  weeklyTrends: {
    week: string;
    sessions: number;
    words: number;
    engagement: number;
    newVocab: number;
  }[];
  categoryUsage: {
    category: string;
    count: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  skillAreas: {
    area: string;
    currentLevel: number;
    previousLevel: number;
    improvement: number;
    goals: string[];
  }[];
  milestones: {
    date: Date;
    achievement: string;
    description: string;
  }[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  config?: any;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  recipients: string[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'text' | 'recommendations' | 'goals';
  config: any;
}

class ReportGenerationService {
  private static instance: ReportGenerationService;

  private constructor() {}

  static getInstance(): ReportGenerationService {
    if (!ReportGenerationService.instance) {
      ReportGenerationService.instance = new ReportGenerationService();
    }
    return ReportGenerationService.instance;
  }

  // Generate comprehensive student report
  async generateStudentReport(
    studentId: string,
    startDate: Date,
    endDate: Date,
    includeRawData: boolean = false
  ): Promise<StudentReport> {
    try {
      // Check permissions
      if (!this.canAccessStudent(studentId)) {
        throw new Error('Insufficient permissions to access student data');
      }

      // Get student info
      const studentInfo = await this.getStudentInfo(studentId);
      
      // Collect all interaction data
      const interactions = await this.getStudentInteractions(studentId, startDate, endDate);
      const sessions = await this.getStudentSessions(studentId, startDate, endDate);
      
      // Calculate metrics
      const metrics = this.calculateStudentMetrics(interactions, sessions);
      const progress = await this.analyzeProgress(studentId, interactions, startDate, endDate);
      const recommendations = this.generateRecommendations(metrics, progress);
      const charts = this.createChartData(interactions, progress);

      return {
        studentId,
        studentName: studentInfo.name,
        reportPeriod: { startDate, endDate },
        metrics,
        progress,
        recommendations,
        charts,
        rawData: includeRawData ? interactions : undefined
      };
    } catch (error) {
      console.error('Failed to generate student report:', error);
      throw error;
    }
  }

  // Generate classroom summary report
  async generateClassroomReport(
    studentIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    classroomMetrics: any;
    studentSummaries: any[];
    comparisons: any[];
    insights: string[];
  }> {
    try {
      const studentReports = await Promise.all(
        studentIds.map(id => this.generateStudentReport(id, startDate, endDate))
      );

      const classroomMetrics = this.calculateClassroomMetrics(studentReports);
      const studentSummaries = studentReports.map(report => ({
        studentId: report.studentId,
        studentName: report.studentName,
        keyMetrics: {
          totalSessions: report.metrics.totalSessions,
          wordsUsed: report.metrics.wordsUsed,
          progressScore: report.metrics.vocabularyGrowth
        },
        status: this.getStudentStatus(report.metrics)
      }));

      const comparisons = this.createClassroomComparisons(studentReports);
      const insights = this.generateClassroomInsights(classroomMetrics, studentReports);

      return {
        classroomMetrics,
        studentSummaries,
        comparisons,
        insights
      };
    } catch (error) {
      console.error('Failed to generate classroom report:', error);
      throw error;
    }
  }

  // Generate IEP progress report
  async generateIEPReport(
    studentId: string,
    goals: any[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    goalProgress: any[];
    dataCollection: any[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    try {
      const interactions = await this.getStudentInteractions(studentId, startDate, endDate);
      
      const goalProgress = await Promise.all(
        goals.map(goal => this.analyzeGoalProgress(goal, interactions))
      );

      const dataCollection = this.formatDataForIEP(interactions);
      const recommendations = this.generateIEPRecommendations(goalProgress);
      const nextSteps = this.suggestNextSteps(goalProgress);

      return {
        goalProgress,
        dataCollection,
        recommendations,
        nextSteps
      };
    } catch (error) {
      console.error('Failed to generate IEP report:', error);
      throw error;
    }
  }

  // Export report as PDF
  async exportToPDF(report: StudentReport): Promise<Blob> {
    try {
      // This would use a PDF library like jsPDF or Puppeteer
      // For now, return mock PDF data
      const pdfContent = this.generatePDFContent(report);
      return new Blob([pdfContent], { type: 'application/pdf' });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw error;
    }
  }

  // Schedule automated reports
  async scheduleReport(
    template: ReportTemplate,
    studentIds: string[],
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      recipients: string[];
    }
  ): Promise<void> {
    try {
      // This would integrate with a scheduling service
      console.log('Scheduling report:', template.name, 'for students:', studentIds);
      
      // Save schedule to database
      // Set up cron job or similar
      
    } catch (error) {
      console.error('Failed to schedule report:', error);
      throw error;
    }
  }

  // Get report templates
  getReportTemplates(): ReportTemplate[] {
    return [
      {
        id: 'weekly_progress',
        name: 'Weekly Progress Report',
        description: 'Comprehensive weekly progress tracking',
        frequency: 'weekly',
        recipients: [],
        sections: [
          {
            id: 'overview',
            title: 'Weekly Overview',
            type: 'metrics',
            config: { showComparison: true }
          },
          {
            id: 'vocabulary_growth',
            title: 'Vocabulary Development',
            type: 'chart',
            config: { chartType: 'line' }
          },
          {
            id: 'engagement',
            title: 'Engagement Analysis',
            type: 'chart',
            config: { chartType: 'bar' }
          },
          {
            id: 'recommendations',
            title: 'Recommendations',
            type: 'recommendations',
            config: {}
          }
        ]
      },
      {
        id: 'monthly_comprehensive',
        name: 'Monthly Comprehensive Report',
        description: 'Detailed monthly analysis with goals tracking',
        frequency: 'monthly',
        recipients: [],
        sections: [
          {
            id: 'executive_summary',
            title: 'Executive Summary',
            type: 'text',
            config: {}
          },
          {
            id: 'detailed_metrics',
            title: 'Detailed Metrics',
            type: 'metrics',
            config: { showAll: true }
          },
          {
            id: 'progress_charts',
            title: 'Progress Visualization',
            type: 'chart',
            config: { multiple: true }
          },
          {
            id: 'goal_tracking',
            title: 'Goal Progress',
            type: 'goals',
            config: {}
          },
          {
            id: 'next_steps',
            title: 'Recommendations & Next Steps',
            type: 'recommendations',
            config: { detailed: true }
          }
        ]
      },
      {
        id: 'iep_data',
        name: 'IEP Data Collection',
        description: 'Formal data collection for IEP meetings',
        frequency: 'custom',
        recipients: [],
        sections: [
          {
            id: 'goal_data',
            title: 'Goal-Specific Data',
            type: 'metrics',
            config: { goalBased: true }
          },
          {
            id: 'baseline_comparison',
            title: 'Baseline Comparison',
            type: 'chart',
            config: { showBaseline: true }
          },
          {
            id: 'objective_analysis',
            title: 'Objective Analysis',
            type: 'text',
            config: { formal: true }
          }
        ]
      }
    ];
  }

  // Private helper methods
  private canAccessStudent(studentId: string): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;

    return authService.canAccessStudent(studentId);
  }

  private async getStudentInfo(studentId: string): Promise<{ name: string; grade?: string }> {
    const userQuery = query(
      collection(db, 'users'),
      where('userId', '==', studentId),
      limit(1)
    );
    
    const snapshot = await getDocs(userQuery);
    const userData = snapshot.docs[0]?.data();
    
    return {
      name: userData?.displayName || 'Student',
      grade: userData?.metadata?.grade
    };
  }

  private async getStudentInteractions(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', studentId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(interactionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
  }

  private async getStudentSessions(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', studentId),
      where('startTime', '>=', startDate),
      where('startTime', '<=', endDate),
      orderBy('startTime', 'desc')
    );

    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime.toDate(),
      endTime: doc.data().endTime?.toDate()
    }));
  }

  private calculateStudentMetrics(interactions: any[], sessions: any[]): StudentMetrics {
    // Calculate comprehensive metrics from interaction data
    const tileClicks = interactions.filter(i => i.type === 'tile_click');
    const sentences = interactions.filter(i => i.type === 'sentence_build');
    const games = interactions.filter(i => i.type === 'game');

    // Unique vocabulary
    const uniqueWords = new Set(
      tileClicks.map(i => i.tileData?.text).filter(Boolean)
    );

    // Session metrics
    const completedSessions = sessions.filter(s => s.endTime);
    const avgSessionLength = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => {
          const duration = s.endTime.getTime() - s.startTime.getTime();
          return sum + (duration / 1000 / 60); // minutes
        }, 0) / completedSessions.length
      : 0;

    // Communication speed (words per minute)
    const totalWords = tileClicks.length;
    const totalMinutes = avgSessionLength * sessions.length;
    const communicationSpeed = totalMinutes > 0 ? totalWords / totalMinutes : 0;

    // Accuracy rate (based on corrections in sentence building)
    const totalSentences = sentences.length;
    const corrections = sentences.reduce((sum, s) => sum + (s.sentenceData?.corrections || 0), 0);
    const accuracyRate = totalSentences > 0 ? ((totalSentences - corrections) / totalSentences) * 100 : 0;

    // Engagement score (based on interaction frequency)
    const avgEngagementScore = this.calculateEngagementScore(interactions, sessions);

    return {
      totalSessions: sessions.length,
      totalInteractions: interactions.length,
      wordsUsed: totalWords,
      uniqueVocabulary: uniqueWords.size,
      averageSessionLength: Math.round(avgSessionLength * 10) / 10,
      communicationSpeed: Math.round(communicationSpeed * 10) / 10,
      accuracyRate: Math.round(accuracyRate),
      independenceLevel: this.calculateIndependenceLevel(interactions),
      avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
      sessionConsistency: this.calculateConsistency(sessions),
      completionRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
      vocabularyGrowth: this.calculateVocabularyGrowth(interactions),
      complexityImprovement: this.calculateComplexityImprovement(sentences),
      categoryDiversity: this.calculateCategoryDiversity(tileClicks),
      initiatedCommunications: this.countInitiatedCommunications(interactions),
      responsiveComments: this.countResponsiveComments(interactions),
      conversationTurns: this.countConversationTurns(interactions)
    };
  }

  private async analyzeProgress(
    studentId: string,
    interactions: any[],
    startDate: Date,
    endDate: Date
  ): Promise<ProgressData> {
    // Generate weekly trends
    const weeklyTrends = this.generateWeeklyTrends(interactions, startDate, endDate);
    
    // Analyze category usage
    const categoryUsage = this.analyzeCategoryUsage(interactions);
    
    // Assess skill areas
    const skillAreas = this.assessSkillAreas(interactions);
    
    // Find milestones
    const milestones = this.identifyMilestones(interactions);

    return {
      weeklyTrends,
      categoryUsage,
      skillAreas,
      milestones
    };
  }

  private generateRecommendations(metrics: StudentMetrics, progress: ProgressData): string[] {
    const recommendations: string[] = [];

    // Vocabulary recommendations
    if (metrics.vocabularyGrowth < 10) {
      recommendations.push('Focus on expanding vocabulary through category exploration');
    }

    // Engagement recommendations
    if (metrics.avgEngagementScore < 0.6) {
      recommendations.push('Consider gamification elements to increase engagement');
    }

    // Communication speed recommendations
    if (metrics.communicationSpeed < 1.0) {
      recommendations.push('Practice fluency exercises to improve communication speed');
    }

    // Accuracy recommendations
    if (metrics.accuracyRate < 80) {
      recommendations.push('Implement error correction strategies');
    }

    // Session consistency
    if (metrics.sessionConsistency < 0.7) {
      recommendations.push('Establish regular practice schedule for consistency');
    }

    return recommendations;
  }

  private createChartData(interactions: any[], progress: ProgressData): ChartData[] {
    return [
      {
        type: 'line',
        title: 'Weekly Progress Trends',
        data: progress.weeklyTrends
      },
      {
        type: 'pie',
        title: 'Category Usage Distribution',
        data: progress.categoryUsage
      },
      {
        type: 'bar',
        title: 'Skill Area Progress',
        data: progress.skillAreas
      }
    ];
  }

  // Additional helper methods (simplified for brevity)
  private calculateEngagementScore(interactions: any[], sessions: any[]): number {
    // Complex calculation based on interaction frequency, session duration, etc.
    return Math.random() * 0.5 + 0.5; // Mock
  }

  private calculateIndependenceLevel(interactions: any[]): number {
    // Calculate based on help requests, corrections, etc.
    return Math.random() * 0.3 + 0.7; // Mock
  }

  private calculateConsistency(sessions: any[]): number {
    // Calculate based on session frequency and duration
    return Math.random() * 0.2 + 0.8; // Mock
  }

  private calculateVocabularyGrowth(interactions: any[]): number {
    // Calculate vocabulary growth over time
    return Math.random() * 20 + 5; // Mock: 5-25%
  }

  private calculateComplexityImprovement(sentences: any[]): number {
    // Calculate sentence complexity improvements
    return Math.random() * 15 + 5; // Mock
  }

  private calculateCategoryDiversity(tileClicks: any[]): number {
    // Calculate how diverse category usage is
    const categories = new Set(tileClicks.map(t => t.tileData?.category).filter(Boolean));
    return categories.size;
  }

  private countInitiatedCommunications(interactions: any[]): number {
    // Count self-initiated communications
    return Math.floor(Math.random() * 20 + 10); // Mock
  }

  private countResponsiveComments(interactions: any[]): number {
    // Count responsive communications
    return Math.floor(Math.random() * 30 + 15); // Mock
  }

  private countConversationTurns(interactions: any[]): number {
    // Count conversation turns
    return Math.floor(Math.random() * 25 + 10); // Mock
  }

  private generateWeeklyTrends(interactions: any[], startDate: Date, endDate: Date): any[] {
    // Generate weekly trend data
    const weeks = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekInteractions = interactions.filter(i => 
        i.timestamp >= currentDate && i.timestamp <= weekEnd
      );
      
      weeks.push({
        week: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        sessions: new Set(weekInteractions.map(i => i.sessionId)).size,
        words: weekInteractions.filter(i => i.type === 'tile_click').length,
        engagement: Math.random() * 0.3 + 0.7,
        newVocab: Math.floor(Math.random() * 10 + 5)
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
  }

  private analyzeCategoryUsage(interactions: any[]): any[] {
    const categories = new Map();
    const tileClicks = interactions.filter(i => i.type === 'tile_click');
    
    tileClicks.forEach(click => {
      const category = click.tileData?.category || 'Other';
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    
    const total = tileClicks.length;
    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100),
      trend: Math.random() > 0.5 ? 'increasing' : 'stable'
    }));
  }

  private assessSkillAreas(interactions: any[]): any[] {
    const areas = [
      'Vocabulary Development',
      'Sentence Construction',
      'Communication Initiation',
      'Response Accuracy',
      'Social Communication'
    ];
    
    return areas.map(area => ({
      area,
      currentLevel: Math.random() * 30 + 70,
      previousLevel: Math.random() * 30 + 60,
      improvement: Math.random() * 15 + 5,
      goals: [`Improve ${area.toLowerCase()}`, `Practice daily exercises`]
    }));
  }

  private identifyMilestones(interactions: any[]): any[] {
    // Identify significant milestones based on interaction patterns
    return [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        achievement: 'First 3-word sentence',
        description: 'Successfully constructed first complex sentence'
      },
      {
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        achievement: '50 unique words',
        description: 'Reached vocabulary milestone of 50 unique words'
      }
    ];
  }

  // Additional mock methods for other features
  private calculateClassroomMetrics(reports: StudentReport[]): any {
    return {
      totalStudents: reports.length,
      avgProgress: reports.reduce((sum, r) => sum + r.metrics.vocabularyGrowth, 0) / reports.length,
      topPerformers: reports.slice(0, 3).map(r => r.studentName),
      needsAttention: reports.filter(r => r.metrics.avgEngagementScore < 0.6).map(r => r.studentName)
    };
  }

  private createClassroomComparisons(reports: StudentReport[]): any[] {
    return [];
  }

  private generateClassroomInsights(metrics: any, reports: StudentReport[]): string[] {
    return [
      'Overall classroom progress is above average',
      'Consider group activities for social communication',
      'Vocabulary development varies significantly across students'
    ];
  }

  private getStudentStatus(metrics: StudentMetrics): string {
    if (metrics.avgEngagementScore > 0.8) return 'Excellent';
    if (metrics.avgEngagementScore > 0.6) return 'Good';
    return 'Needs Support';
  }

  private async analyzeGoalProgress(goal: any, interactions: any[]): Promise<any> {
    return {
      goal: goal.description,
      progress: Math.random() * 40 + 60,
      dataPoints: Math.floor(Math.random() * 20 + 10),
      trend: 'improving'
    };
  }

  private formatDataForIEP(interactions: any[]): any[] {
    return interactions.slice(0, 10).map(i => ({
      date: i.timestamp,
      behavior: i.type,
      data: i.tileData?.text || i.sentenceData?.fullSentence || 'N/A'
    }));
  }

  private generateIEPRecommendations(goalProgress: any[]): string[] {
    return [
      'Continue current intervention strategies',
      'Increase practice frequency for lagging goals',
      'Consider assistive technology options'
    ];
  }

  private suggestNextSteps(goalProgress: any[]): string[] {
    return [
      'Schedule IEP review meeting',
      'Update goal targets based on progress',
      'Coordinate with related service providers'
    ];
  }

  private generatePDFContent(report: StudentReport): string {
    // This would generate actual PDF content
    return `PDF Report for ${report.studentName}`;
  }
}

// Export singleton instance
export const reportGenerationService = ReportGenerationService.getInstance();