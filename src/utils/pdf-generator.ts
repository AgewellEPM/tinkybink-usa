/**
 * PDF Generator for Student Reports
 * Creates professional PDF reports from analytics data
 */

import jsPDF from 'jspdf';
import { StudentReport } from '@/services/report-generation-service';

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
  }

  async generateStudentReport(report: StudentReport): Promise<Blob> {
    // Header
    this.addHeader(report);
    
    // Student Info
    this.addStudentInfo(report);
    
    // Executive Summary
    this.addExecutiveSummary(report);
    
    // Key Metrics
    this.addKeyMetrics(report);
    
    // Progress Analysis
    this.addProgressAnalysis(report);
    
    // Recommendations
    this.addRecommendations(report);
    
    // Data Tables
    this.addDataTables(report);
    
    // Footer
    this.addFooter();

    return new Blob([this.doc.output('blob')], { type: 'application/pdf' });
  }

  private addHeader(report: StudentReport): void {
    // Logo/Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TinkyBink AAC Student Report', this.margin, this.currentY);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Generated on ${new Date().toLocaleDateString()}`, this.pageWidth - this.margin - 40, this.currentY);
    
    // Line separator
    this.currentY += 10;
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 15;
  }

  private addStudentInfo(report: StudentReport): void {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Student: ${report.studentName}`, this.margin, this.currentY);
    
    this.currentY += 10;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Report Period: ${report.reportPeriod.startDate.toLocaleDateString()} - ${report.reportPeriod.endDate.toLocaleDateString()}`,
      this.margin,
      this.currentY
    );
    
    this.currentY += 20;
  }

  private addExecutiveSummary(report: StudentReport): void {
    this.addSectionHeader('Executive Summary');
    
    const summary = this.generateExecutiveSummary(report);
    this.addWrappedText(summary, this.margin, this.currentY, this.pageWidth - 2 * this.margin);
    
    this.currentY += 20;
  }

  private addKeyMetrics(report: StudentReport): void {
    this.addSectionHeader('Key Performance Metrics');
    
    const metrics = [
      { label: 'Total Sessions', value: report.metrics.totalSessions.toString(), unit: '' },
      { label: 'Words Used', value: report.metrics.wordsUsed.toString(), unit: '' },
      { label: 'Unique Vocabulary', value: report.metrics.uniqueVocabulary.toString(), unit: 'words' },
      { label: 'Vocabulary Growth', value: report.metrics.vocabularyGrowth.toFixed(1), unit: '%' },
      { label: 'Communication Speed', value: report.metrics.communicationSpeed.toFixed(1), unit: 'wpm' },
      { label: 'Accuracy Rate', value: report.metrics.accuracyRate.toFixed(0), unit: '%' },
      { label: 'Engagement Score', value: (report.metrics.avgEngagementScore * 100).toFixed(0), unit: '%' },
      { label: 'Independence Level', value: (report.metrics.independenceLevel * 100).toFixed(0), unit: '%' }
    ];

    // Create metrics table
    const startX = this.margin;
    const colWidth = (this.pageWidth - 2 * this.margin) / 4;
    let row = 0;
    
    metrics.forEach((metric, index) => {
      const col = index % 4;
      const x = startX + col * colWidth;
      const y = this.currentY + Math.floor(index / 4) * 25;
      
      // Metric box
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(x, y - 5, colWidth - 5, 20, 'F');
      
      // Metric value
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${metric.value}${metric.unit}`, x + 2, y + 5);
      
      // Metric label  
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(metric.label, x + 2, y + 12);
      
      if (index % 4 === 3 || index === metrics.length - 1) {
        row++;
      }
    });
    
    this.currentY += row * 25 + 20;
  }

  private addProgressAnalysis(report: StudentReport): void {
    this.addSectionHeader('Progress Analysis');
    
    // Weekly trends summary
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Weekly Trends:', this.margin, this.currentY);
    this.currentY += 8;
    
    // Create simple trend visualization
    const trendData = report.progress.weeklyTrends;
    if (trendData.length > 0) {
      this.createSimpleChart(trendData, 'words', 'Words per Week');
      this.currentY += 40;
    }
    
    // Category usage
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Category Usage:', this.margin, this.currentY);
    this.currentY += 8;
    
    report.progress.categoryUsage.forEach(category => {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `${category.category}: ${category.count} uses (${category.percentage}%) - ${category.trend}`,
        this.margin + 5,
        this.currentY
      );
      this.currentY += 6;
    });
    
    this.currentY += 15;
  }

  private addRecommendations(report: StudentReport): void {
    this.addSectionHeader('Recommendations');
    
    report.recommendations.forEach((recommendation, index) => {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${index + 1}. ${recommendation}`, this.margin, this.currentY);
      this.currentY += 8;
    });
    
    this.currentY += 15;
  }

  private addDataTables(report: StudentReport): void {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
    
    this.addSectionHeader('Detailed Data');
    
    // Skill areas table
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Skill Area', this.margin, this.currentY);
    this.doc.text('Current Level', this.margin + 60, this.currentY);
    this.doc.text('Previous Level', this.margin + 100, this.currentY);
    this.doc.text('Improvement', this.margin + 140, this.currentY);
    
    this.currentY += 8;
    this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2);
    
    report.progress.skillAreas.forEach(skill => {
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(skill.area.substring(0, 20), this.margin, this.currentY);
      this.doc.text(skill.currentLevel.toFixed(1), this.margin + 60, this.currentY);
      this.doc.text(skill.previousLevel.toFixed(1), this.margin + 100, this.currentY);
      this.doc.text(`+${skill.improvement.toFixed(1)}%`, this.margin + 140, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 20;
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Page number
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 10
      );
      
      // Confidentiality notice
      this.doc.text(
        'Confidential Student Report - Generated by TinkyBink AAC Platform',
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  private addSectionHeader(title: string): void {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    
    this.currentY += 5;
    this.doc.line(this.margin, this.currentY, this.margin + 100, this.currentY);
    this.currentY += 10;
  }

  private addWrappedText(text: string, x: number, y: number, maxWidth: number): void {
    const lines = this.doc.splitTextToSize(text, maxWidth);
    this.doc.text(lines, x, y);
    this.currentY += lines.length * 6;
  }

  private createSimpleChart(data: any[], key: string, title: string): void {
    const chartWidth = 120;
    const chartHeight = 30;
    const startX = this.margin;
    const startY = this.currentY;
    
    // Chart border
    this.doc.rect(startX, startY, chartWidth, chartHeight);
    
    // Chart title
    this.doc.setFontSize(8);
    this.doc.text(title, startX, startY - 2);
    
    // Simple bar chart
    const maxValue = Math.max(...data.map(d => d[key]));
    const barWidth = chartWidth / data.length;
    
    data.forEach((item, index) => {
      const barHeight = (item[key] / maxValue) * (chartHeight - 5);
      const x = startX + index * barWidth + 2;
      const y = startY + chartHeight - barHeight - 2;
      
      this.doc.setFillColor(100, 100, 200);
      this.doc.rect(x, y, barWidth - 2, barHeight, 'F');
    });
  }

  private generateExecutiveSummary(report: StudentReport): string {
    const metrics = report.metrics;
    const growth = metrics.vocabularyGrowth > 15 ? 'excellent' : 
                   metrics.vocabularyGrowth > 10 ? 'good' : 'moderate';
    
    const engagement = metrics.avgEngagementScore > 0.8 ? 'highly engaged' :
                      metrics.avgEngagementScore > 0.6 ? 'engaged' : 'moderately engaged';
    
    return `${report.studentName} completed ${metrics.totalSessions} AAC sessions during this reporting period, ` +
           `using ${metrics.wordsUsed} total words with ${metrics.uniqueVocabulary} unique vocabulary items. ` +
           `The student demonstrated ${growth} vocabulary growth of ${metrics.vocabularyGrowth.toFixed(1)}% and remained ${engagement} ` +
           `with an average engagement score of ${(metrics.avgEngagementScore * 100).toFixed(0)}%. ` +
           `Communication accuracy was ${metrics.accuracyRate.toFixed(0)}% with an independence level of ${(metrics.independenceLevel * 100).toFixed(0)}%.`;
  }
}

export const pdfGenerator = new PDFGenerator();