/**
 * Data Export Utilities
 * Comprehensive data export functionality for GPT-4 analysis and professional reporting
 */

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'docx';
  includeTypes: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  patientIds: string[];
  anonymize: boolean;
  includePII: boolean;
  compressionLevel: 'none' | 'basic' | 'high';
}

export interface ExportResult {
  export_id: string;
  timestamp: Date;
  format: string;
  file_size: number;
  patient_count: number;
  data_points: number;
  download_url?: string;
  success: boolean;
  errors: string[];
}

class DataExportService {
  private static instance: DataExportService;

  private constructor() {}

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  /**
   * Export comprehensive patient data for GPT-4 analysis
   */
  async exportForGPT4Analysis(patientIds: string[], options?: Partial<ExportOptions>): Promise<any> {
    const defaultOptions: ExportOptions = {
      format: 'json',
      includeTypes: ['all'],
      dateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        end: new Date()
      },
      patientIds,
      anonymize: false,
      includePII: true,
      compressionLevel: 'basic'
    };

    const exportOptions = { ...defaultOptions, ...options };

    try {
      const exportData = {
        metadata: {
          export_id: `gpt4_export_${Date.now()}`,
          export_timestamp: new Date(),
          export_purpose: 'GPT-4 Advanced Analysis',
          patient_count: patientIds.length,
          date_range: exportOptions.dateRange,
          data_types_included: exportOptions.includeTypes,
          anonymized: exportOptions.anonymize,
          version: '1.0'
        },
        patients: []
      };

      // Collect comprehensive data for each patient
      for (const patientId of patientIds) {
        const patientData = await this.collectPatientData(patientId, exportOptions);
        exportData.patients.push(patientData);
      }

      // Apply anonymization if requested
      if (exportOptions.anonymize) {
        this.anonymizeData(exportData);
      }

      return exportData;

    } catch (error) {
      console.error('Error exporting data for GPT-4:', error);
      throw error;
    }
  }

  /**
   * Export professional progress report
   */
  async exportProgressReport(
    patientIds: string[], 
    reportType: 'individual' | 'comparative' | 'summary' = 'individual',
    format: 'pdf' | 'docx' | 'html' = 'pdf'
  ): Promise<ExportResult> {
    try {
      const reportData = await this.generateReportData(patientIds, reportType);
      
      let formattedReport;
      switch (format) {
        case 'pdf':
          formattedReport = await this.generatePDFReport(reportData);
          break;
        case 'docx':
          formattedReport = await this.generateWordReport(reportData);
          break;
        case 'html':
          formattedReport = await this.generateHTMLReport(reportData);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const result: ExportResult = {
        export_id: `report_${Date.now()}`,
        timestamp: new Date(),
        format,
        file_size: formattedReport.size || 0,
        patient_count: patientIds.length,
        data_points: reportData.total_data_points || 0,
        download_url: formattedReport.url,
        success: true,
        errors: []
      };

      return result;

    } catch (error) {
      console.error('Error exporting progress report:', error);
      return {
        export_id: `error_${Date.now()}`,
        timestamp: new Date(),
        format,
        file_size: 0,
        patient_count: 0,
        data_points: 0,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Export session data in CSV format
   */
  async exportSessionDataCSV(patientIds: string[], dateRange?: { start: Date; end: Date }): Promise<string> {
    try {
      const sessions = await this.collectSessionData(patientIds, dateRange);
      
      const headers = [
        'Patient ID',
        'Session Date',
        'Session Duration',
        'Communication Attempts',
        'Successful Communications',
        'Accuracy Rate',
        'New Vocabulary',
        'Games Played',
        'Memory Score',
        'Goal Progress',
        'Notes'
      ];

      const csvRows = [headers.join(',')];

      for (const session of sessions) {
        const row = [
          session.patient_id,
          session.date.toISOString().split('T')[0],
          session.duration_minutes,
          session.communication_attempts,
          session.successful_communications,
          `${(session.accuracy_rate * 100).toFixed(1)}%`,
          session.new_vocabulary_count,
          session.games_played.join(';'),
          session.memory_score || 'N/A',
          `${session.goal_progress}%`,
          `"${session.notes.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      }

      return csvRows.join('\n');

    } catch (error) {
      console.error('Error exporting session data to CSV:', error);
      throw error;
    }
  }

  /**
   * Export analytics dashboard as JSON
   */
  async exportAnalyticsDashboard(patientId?: string): Promise<any> {
    try {
      const dashboardData = {
        export_metadata: {
          export_id: `dashboard_${Date.now()}`,
          timestamp: new Date(),
          patient_id: patientId || 'all_patients',
          export_type: 'analytics_dashboard'
        },
        real_time_insights: await this.collectRealTimeInsights(patientId),
        progress_analytics: await this.collectProgressAnalytics(patientId),
        goal_tracking: await this.collectGoalTracking(patientId),
        intervention_effectiveness: await this.collectInterventionData(patientId),
        breakthrough_predictions: await this.collectBreakthroughPredictions(patientId),
        risk_assessments: await this.collectRiskAssessments(patientId),
        performance_trends: await this.collectPerformanceTrends(patientId)
      };

      return dashboardData;

    } catch (error) {
      console.error('Error exporting analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Create shareable data package for external analysis
   */
  async createShareablePackage(
    patientIds: string[], 
    analysisType: string,
    recipientType: 'researcher' | 'colleague' | 'family' | 'administration'
  ): Promise<any> {
    try {
      const packageData = {
        package_metadata: {
          package_id: `share_${Date.now()}`,
          created_date: new Date(),
          analysis_type: analysisType,
          recipient_type: recipientType,
          patient_count: patientIds.length,
          data_sensitivity: this.assessDataSensitivity(recipientType),
          expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        summary_statistics: await this.generateSummaryStatistics(patientIds),
        key_insights: await this.generateKeyInsights(patientIds, analysisType),
        visualizations: await this.generateVisualizationData(patientIds),
        recommendations: await this.generateRecommendations(patientIds, recipientType)
      };

      // Apply appropriate data filtering based on recipient
      if (recipientType === 'family') {
        packageData = this.filterForFamily(packageData);
      } else if (recipientType === 'administration') {
        packageData = this.filterForAdministration(packageData);
      }

      return packageData;

    } catch (error) {
      console.error('Error creating shareable package:', error);
      throw error;
    }
  }

  // Private helper methods

  private async collectPatientData(patientId: string, options: ExportOptions): Promise<any> {
    // Collect comprehensive patient data based on options
    const patientData = {
      patient_id: options.anonymize ? this.anonymizeId(patientId) : patientId,
      profile: await this.getPatientProfile(patientId, options),
      session_history: await this.getSessionHistory(patientId, options.dateRange),
      goal_progress: await this.getGoalProgress(patientId, options.dateRange),
      game_performance: await this.getGamePerformance(patientId, options.dateRange),
      communication_patterns: await this.getCommunicationPatterns(patientId, options.dateRange),
      intervention_history: await this.getInterventionHistory(patientId, options.dateRange),
      analytics_insights: await this.getAnalyticsInsights(patientId, options.dateRange),
      breakthrough_events: await this.getBreakthroughEvents(patientId, options.dateRange),
      family_feedback: await this.getFamilyFeedback(patientId, options.dateRange)
    };

    return patientData;
  }

  private anonymizeData(data: any): void {
    // Implement data anonymization
    if (data.patients) {
      data.patients.forEach((patient: any) => {
        if (patient.profile) {
          patient.profile.name = this.generateAnonymousName();
          patient.profile.email = 'anonymous@example.com';
          // Remove or anonymize other PII
        }
      });
    }
  }

  private anonymizeId(id: string): string {
    // Generate consistent anonymous ID
    return `patient_${this.hashString(id).substring(0, 8)}`;
  }

  private generateAnonymousName(): string {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Sage', 'River'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Moore', 'Clark'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  private hashString(str: string): string {
    // Simple hash function for consistent anonymization
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async generateReportData(patientIds: string[], reportType: string): Promise<any> {
    // Generate comprehensive report data
    return {
      report_metadata: {
        type: reportType,
        generated_date: new Date(),
        patient_count: patientIds.length
      },
      executive_summary: await this.generateExecutiveSummary(patientIds),
      detailed_analysis: await this.generateDetailedAnalysis(patientIds),
      progress_charts: await this.generateProgressCharts(patientIds),
      recommendations: await this.generateRecommendations(patientIds, 'professional'),
      total_data_points: 1000 // Example count
    };
  }

  private async generatePDFReport(reportData: any): Promise<{ size: number; url: string }> {
    // Generate PDF report (would use a PDF library in production)
    return {
      size: 1024000, // 1MB example
      url: 'blob:pdf-report-url'
    };
  }

  private async generateWordReport(reportData: any): Promise<{ size: number; url: string }> {
    // Generate Word document (would use a Word library in production)
    return {
      size: 512000, // 512KB example
      url: 'blob:docx-report-url'
    };
  }

  private async generateHTMLReport(reportData: any): Promise<{ size: number; url: string }> {
    // Generate HTML report
    const htmlContent = this.formatReportAsHTML(reportData);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    return {
      size: blob.size,
      url
    };
  }

  private formatReportAsHTML(reportData: any): string {
    // Format report data as HTML
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Progress Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .chart { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Patient Progress Report</h1>
        <p>Generated: ${reportData.report_metadata.generated_date}</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>${reportData.executive_summary}</p>
    </div>
    
    <div class="section">
        <h2>Detailed Analysis</h2>
        <p>${reportData.detailed_analysis}</p>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${reportData.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }

  // Data collection methods (would integrate with actual data sources)
  private async getPatientProfile(patientId: string, options: ExportOptions): Promise<any> {
    return {
      id: patientId,
      name: options.includePII ? 'John Doe' : 'Anonymous',
      age: 8,
      diagnosis: ['Autism Spectrum Disorder'],
      therapy_start_date: new Date('2024-01-01')
    };
  }

  private async getSessionHistory(patientId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    return [
      {
        date: new Date('2024-07-01'),
        duration: 45,
        activities: ['AAC practice', 'Memory games'],
        progress_notes: 'Good engagement'
      }
    ];
  }

  private async getGoalProgress(patientId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    return [
      {
        goal_id: 'goal_1',
        title: 'Increase spontaneous requests',
        baseline: 20,
        current: 65,
        target: 80,
        progress_percentage: 75
      }
    ];
  }

  private async getGamePerformance(patientId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    return [
      {
        game_type: 'memory_training',
        sessions_played: 15,
        average_score: 78,
        improvement_rate: 12
      }
    ];
  }

  private async getCommunicationPatterns(patientId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    return {
      total_communications: 245,
      spontaneous_percentage: 34,
      most_used_categories: ['requests', 'social', 'needs'],
      complexity_trend: 'increasing'
    };
  }

  private async getInterventionHistory(patientId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    return [
      {
        intervention: 'Visual supports',
        start_date: new Date('2024-06-01'),
        effectiveness_score: 8.5,
        outcome: 'Positive improvement in accuracy'
      }
    ];
  }

  private async getAnalyticsInsights(patientId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    return [
      {
        insight_type: 'trend_detection',
        description: 'Accelerating progress in communication attempts',
        confidence: 0.89,
        supporting_data: ['15% increase over 2 weeks']
      }
    ];
  }

  private async getBreakthroughEvents(patientId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    return [
      {
        event_date: new Date('2024-07-15'),
        breakthrough_type: 'spontaneous_multi_word',
        description: 'First unprompted 3-word sentence',
        significance: 'major_milestone'
      }
    ];
  }

  private async getFamilyFeedback(patientId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    return [
      {
        date: new Date('2024-07-20'),
        feedback_type: 'progress_observation',
        content: 'Much more talkative at home',
        family_member: 'parent'
      }
    ];
  }

  private async collectSessionData(patientIds: string[], dateRange?: { start: Date; end: Date }): Promise<any[]> {
    // Collect session data for CSV export
    return [
      {
        patient_id: 'patient_1',
        date: new Date('2024-07-20'),
        duration_minutes: 45,
        communication_attempts: 23,
        successful_communications: 18,
        accuracy_rate: 0.78,
        new_vocabulary_count: 3,
        games_played: ['memory_training', 'spelling_bee'],
        memory_score: 85,
        goal_progress: 75,
        notes: 'Excellent session with breakthrough in spontaneous requests'
      }
    ];
  }

  private async collectRealTimeInsights(patientId?: string): Promise<any[]> {
    return [
      {
        insight_id: 'insight_1',
        type: 'breakthrough_signal',
        message: 'Patient showing signs of upcoming breakthrough',
        confidence: 0.87
      }
    ];
  }

  private async collectProgressAnalytics(patientId?: string): Promise<any> {
    return {
      overall_progress: 75,
      goal_completion_rate: 0.68,
      intervention_effectiveness: 0.82,
      family_satisfaction: 0.91
    };
  }

  private async collectGoalTracking(patientId?: string): Promise<any[]> {
    return [
      {
        goal_id: 'goal_1',
        progress: 75,
        trend: 'improving',
        estimated_completion: '2 weeks'
      }
    ];
  }

  private async collectInterventionData(patientId?: string): Promise<any[]> {
    return [
      {
        intervention: 'Visual supports',
        effectiveness: 8.5,
        usage_frequency: 'daily',
        outcome_metrics: { accuracy: 0.78, engagement: 0.85 }
      }
    ];
  }

  private async collectBreakthroughPredictions(patientId?: string): Promise<any[]> {
    return [
      {
        predicted_breakthrough: 'Multi-word spontaneous communication',
        probability: 0.78,
        timeline: '2-3 weeks',
        indicators: ['Increased attempt frequency', 'Higher accuracy scores']
      }
    ];
  }

  private async collectRiskAssessments(patientId?: string): Promise<any[]> {
    return [
      {
        risk_factor: 'Potential plateau in progress',
        likelihood: 0.23,
        mitigation_strategies: ['Increase variety in activities', 'Adjust reinforcement schedule']
      }
    ];
  }

  private async collectPerformanceTrends(patientId?: string): Promise<any> {
    return {
      communication_trend: 'increasing',
      accuracy_trend: 'stable_high',
      engagement_trend: 'increasing',
      family_satisfaction_trend: 'increasing'
    };
  }

  private assessDataSensitivity(recipientType: string): string {
    const sensitivity = {
      'researcher': 'anonymized',
      'colleague': 'professional',
      'family': 'filtered',
      'administration': 'summary'
    };
    return sensitivity[recipientType as keyof typeof sensitivity] || 'restricted';
  }

  private async generateSummaryStatistics(patientIds: string[]): Promise<any> {
    return {
      total_patients: patientIds.length,
      average_progress: 73,
      breakthrough_rate: 0.45,
      intervention_success_rate: 0.82
    };
  }

  private async generateKeyInsights(patientIds: string[], analysisType: string): Promise<string[]> {
    return [
      'Memory training shows strong correlation with communication gains',
      'Visual supports increase accuracy by average 23%',
      'Family engagement correlates with 40% faster progress'
    ];
  }

  private async generateVisualizationData(patientIds: string[]): Promise<any> {
    return {
      progress_charts: {
        type: 'line_chart',
        data: [65, 70, 75, 78, 82],
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
      },
      goal_distribution: {
        type: 'pie_chart',
        data: [40, 35, 25],
        labels: ['Communication', 'Literacy', 'Social']
      }
    };
  }

  private async generateRecommendations(patientIds: string[], recipientType: string): Promise<string[]> {
    const recommendations = {
      'professional': [
        'Continue current intervention strategies',
        'Increase memory training frequency',
        'Implement peer interaction opportunities'
      ],
      'family': [
        'Practice AAC during daily routines',
        'Celebrate small communication wins',
        'Provide consistent response time'
      ],
      'administration': [
        'Allocate additional therapy time',
        'Consider equipment upgrades',
        'Schedule family training sessions'
      ]
    };
    
    return recommendations[recipientType as keyof typeof recommendations] || recommendations.professional;
  }

  private async generateExecutiveSummary(patientIds: string[]): Promise<string> {
    return `Progress analysis for ${patientIds.length} patient(s) shows positive trajectory with 75% average goal completion rate. Key breakthrough indicators suggest accelerated progress in coming weeks.`;
  }

  private async generateDetailedAnalysis(patientIds: string[]): Promise<string> {
    return `Comprehensive analysis reveals strong correlation between memory training activities and communication breakthroughs. Intervention effectiveness averages 82% across all implemented strategies.`;
  }

  private async generateProgressCharts(patientIds: string[]): Promise<any[]> {
    return [
      {
        chart_type: 'progress_over_time',
        data_points: [60, 65, 70, 75, 80],
        time_labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5']
      }
    ];
  }

  private filterForFamily(packageData: any): any {
    // Remove technical details, keep family-friendly information
    return {
      ...packageData,
      summary_statistics: {
        progress_percentage: packageData.summary_statistics.average_progress,
        goals_achieved: Math.floor(packageData.summary_statistics.average_progress / 25),
        celebration_moments: 5
      }
    };
  }

  private filterForAdministration(packageData: any): any {
    // Focus on high-level metrics and outcomes
    return {
      ...packageData,
      administrative_summary: {
        patient_outcomes: packageData.summary_statistics,
        resource_utilization: 'optimal',
        cost_effectiveness: 'above_average',
        satisfaction_scores: 0.91
      }
    };
  }
}

// Export utilities
export const dataExportService = DataExportService.getInstance();

// Convenience functions
export async function exportPatientDataForGPT4(patientIds: string[]): Promise<any> {
  return dataExportService.exportForGPT4Analysis(patientIds);
}

export async function generateProgressReportPDF(patientIds: string[]): Promise<ExportResult> {
  return dataExportService.exportProgressReport(patientIds, 'individual', 'pdf');
}

export async function exportSessionDataCSV(patientIds: string[]): Promise<string> {
  return dataExportService.exportSessionDataCSV(patientIds);
}

export async function createFamilySharePackage(patientIds: string[]): Promise<any> {
  return dataExportService.createShareablePackage(patientIds, 'progress_summary', 'family');
}