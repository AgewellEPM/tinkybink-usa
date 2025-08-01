/**
 * Compliance Service
 * Module 47: Regulatory compliance management and reporting
 */

interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  regulation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: ComplianceStatus;
  dueDate?: string;
  lastReviewed?: string;
  reviewer?: string;
  evidence?: ComplianceEvidence[];
  controls: ComplianceControl[];
  tags: string[];
}

type ComplianceCategory = 
  | 'privacy' 
  | 'security' 
  | 'accessibility' 
  | 'data_protection'
  | 'clinical' 
  | 'billing' 
  | 'quality'
  | 'operational';

type ComplianceStatus = 
  | 'compliant' 
  | 'non_compliant' 
  | 'partial' 
  | 'pending_review'
  | 'not_applicable';

interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  type: 'technical' | 'administrative' | 'physical';
  implementation: ControlImplementation;
  effectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_tested';
  testDate?: string;
  testResults?: string;
}

interface ControlImplementation {
  status: 'implemented' | 'partial' | 'planned' | 'not_implemented';
  implementedDate?: string;
  responsibleParty?: string;
  documentation?: string;
}

interface ComplianceEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'report' | 'attestation';
  name: string;
  description?: string;
  url?: string;
  uploadedDate: string;
  uploadedBy: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
}

interface ComplianceReport {
  id: string;
  name: string;
  type: ReportType;
  period: {
    start: string;
    end: string;
  };
  generatedDate: string;
  generatedBy: string;
  summary: ComplianceSummary;
  requirements: ComplianceRequirement[];
  recommendations: string[];
  signature?: DigitalSignature;
}

type ReportType = 
  | 'hipaa_assessment'
  | 'security_audit'
  | 'accessibility_wcag'
  | 'gdpr_compliance'
  | 'sox_compliance'
  | 'custom';

interface ComplianceSummary {
  totalRequirements: number;
  compliant: number;
  nonCompliant: number;
  partial: number;
  pendingReview: number;
  overallScore: number;
  criticalIssues: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface DigitalSignature {
  signedBy: string;
  signedDate: string;
  hash: string;
  certificate?: string;
}

interface ComplianceTask {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'critical' | 'high' | 'medium' | 'low';
  completedDate?: string;
  notes?: string;
}

interface ComplianceRisk {
  id: string;
  requirementId: string;
  description: string;
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
  impact: 'negligible' | 'minor' | 'moderate' | 'major' | 'severe';
  riskScore: number;
  mitigation?: string;
  owner?: string;
}

export class ComplianceService {
  private static instance: ComplianceService;
  private requirements: Map<string, ComplianceRequirement> = new Map();
  private reports: Map<string, ComplianceReport> = new Map();
  private tasks: Map<string, ComplianceTask> = new Map();
  private risks: Map<string, ComplianceRisk> = new Map();
  private complianceFrameworks: Map<string, ComplianceFramework> = new Map();
  private automatedChecks: Map<string, AutomatedCheck> = new Map();

  private constructor() {
    this.initializeFrameworks();
    this.initializeRequirements();
  }

  static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  initialize(): void {
    console.log('⚖️ Compliance Service ready - Regulatory compliance management');
    this.loadComplianceData();
    this.scheduleAutomatedChecks();
    this.performInitialAssessment();
  }

  /**
   * Initialize compliance frameworks
   */
  private initializeFrameworks(): void {
    // HIPAA Framework
    this.complianceFrameworks.set('HIPAA', {
      id: 'HIPAA',
      name: 'Health Insurance Portability and Accountability Act',
      version: '2013',
      categories: ['privacy', 'security', 'breach_notification'],
      requirements: [
        'access_controls',
        'audit_logs',
        'integrity_controls',
        'transmission_security',
        'encryption',
        'user_authentication',
        'automatic_logoff',
        'unique_user_identification'
      ]
    });

    // WCAG Framework
    this.complianceFrameworks.set('WCAG', {
      id: 'WCAG',
      name: 'Web Content Accessibility Guidelines',
      version: '2.1',
      categories: ['perceivable', 'operable', 'understandable', 'robust'],
      requirements: [
        'text_alternatives',
        'keyboard_accessible',
        'color_contrast',
        'resize_text',
        'focus_visible',
        'error_identification',
        'labels_instructions',
        'consistent_navigation'
      ]
    });

    // GDPR Framework
    this.complianceFrameworks.set('GDPR', {
      id: 'GDPR',
      name: 'General Data Protection Regulation',
      version: '2018',
      categories: ['consent', 'rights', 'security', 'accountability'],
      requirements: [
        'lawful_basis',
        'consent_management',
        'data_minimization',
        'right_to_access',
        'right_to_erasure',
        'data_portability',
        'privacy_by_design',
        'breach_notification'
      ]
    });
  }

  /**
   * Initialize default requirements
   */
  private initializeRequirements(): void {
    // HIPAA Requirements
    this.addRequirement({
      id: 'hipaa_access_control',
      name: 'Access Control',
      description: 'Implement technical policies and procedures for electronic information systems',
      category: 'security',
      regulation: 'HIPAA',
      priority: 'critical',
      status: 'compliant',
      controls: [
        {
          id: 'unique_user_id',
          name: 'Unique User Identification',
          description: 'Assign unique identifier to each user',
          type: 'technical',
          implementation: {
            status: 'implemented',
            implementedDate: '2024-01-01',
            responsibleParty: 'Security Team'
          },
          effectiveness: 'effective'
        },
        {
          id: 'automatic_logoff',
          name: 'Automatic Logoff',
          description: 'Terminate session after predetermined time of inactivity',
          type: 'technical',
          implementation: {
            status: 'implemented',
            implementedDate: '2024-01-15'
          },
          effectiveness: 'effective'
        }
      ],
      tags: ['security', 'access', 'authentication']
    });

    this.addRequirement({
      id: 'hipaa_audit_logs',
      name: 'Audit Controls',
      description: 'Hardware, software, and procedural mechanisms to record and examine access',
      category: 'security',
      regulation: 'HIPAA',
      priority: 'critical',
      status: 'compliant',
      controls: [
        {
          id: 'audit_logging',
          name: 'Comprehensive Audit Logging',
          description: 'Log all system access and modifications',
          type: 'technical',
          implementation: {
            status: 'implemented',
            implementedDate: '2024-01-01'
          },
          effectiveness: 'effective'
        }
      ],
      tags: ['security', 'audit', 'logging']
    });

    // WCAG Requirements
    this.addRequirement({
      id: 'wcag_keyboard_access',
      name: 'Keyboard Accessible',
      description: 'All functionality available from keyboard',
      category: 'accessibility',
      regulation: 'WCAG',
      priority: 'high',
      status: 'compliant',
      controls: [
        {
          id: 'keyboard_navigation',
          name: 'Full Keyboard Navigation',
          description: 'Navigate all interactive elements via keyboard',
          type: 'technical',
          implementation: {
            status: 'implemented'
          },
          effectiveness: 'effective'
        }
      ],
      tags: ['accessibility', 'keyboard', 'navigation']
    });

    this.addRequirement({
      id: 'wcag_color_contrast',
      name: 'Color Contrast',
      description: 'Sufficient contrast between text and background',
      category: 'accessibility',
      regulation: 'WCAG',
      priority: 'high',
      status: 'partial',
      controls: [
        {
          id: 'contrast_ratio',
          name: 'WCAG AA Contrast Ratios',
          description: 'Minimum 4.5:1 for normal text, 3:1 for large text',
          type: 'technical',
          implementation: {
            status: 'partial',
            responsibleParty: 'Design Team'
          },
          effectiveness: 'partially_effective'
        }
      ],
      tags: ['accessibility', 'visual', 'contrast']
    });
  }

  /**
   * Add or update a compliance requirement
   */
  addRequirement(requirement: ComplianceRequirement): void {
    this.requirements.set(requirement.id, requirement);
    
    // Create tasks for non-compliant items
    if (requirement.status === 'non_compliant' || requirement.status === 'partial') {
      this.createRemediationTask(requirement);
    }

    // Assess risk
    this.assessRisk(requirement);
    
    this.saveComplianceData();
  }

  /**
   * Update requirement status
   */
  updateRequirementStatus(
    requirementId: string,
    status: ComplianceStatus,
    evidence?: ComplianceEvidence
  ): boolean {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return false;

    requirement.status = status;
    requirement.lastReviewed = new Date().toISOString();
    
    const authService = (window as any).moduleSystem?.get('AuthService');
    const currentUser = authService?.getCurrentUser();
    requirement.reviewer = currentUser?.name || 'System';

    if (evidence) {
      requirement.evidence = requirement.evidence || [];
      requirement.evidence.push(evidence);
    }

    // Log the change
    const auditService = (window as any).moduleSystem?.get('AuditService');
    auditService?.log('update', 'compliance', {
      resourceId: requirementId,
      resourceName: requirement.name,
      changes: [{ field: 'status', oldValue: requirement.status, newValue: status }],
      metadata: { regulation: requirement.regulation }
    });

    this.saveComplianceData();
    return true;
  }

  /**
   * Perform compliance assessment
   */
  async performAssessment(
    regulations?: string[]
  ): Promise<ComplianceReport> {
    const assessmentId = `assessment_${Date.now()}`;
    const requirements = this.getRequirements({ regulations });

    // Run automated checks
    for (const requirement of requirements) {
      await this.runAutomatedCheck(requirement.id);
    }

    // Generate report
    const report = this.generateComplianceReport(
      `Compliance Assessment ${new Date().toLocaleDateString()}`,
      'custom',
      requirements
    );

    this.reports.set(report.id, report);
    this.saveReports();

    return report;
  }

  /**
   * Get requirements with filters
   */
  getRequirements(filters?: {
    category?: ComplianceCategory;
    regulation?: string;
    status?: ComplianceStatus;
    priority?: string;
    regulations?: string[];
  }): ComplianceRequirement[] {
    let requirements = Array.from(this.requirements.values());

    if (filters) {
      if (filters.category) {
        requirements = requirements.filter(r => r.category === filters.category);
      }
      if (filters.regulation) {
        requirements = requirements.filter(r => r.regulation === filters.regulation);
      }
      if (filters.regulations) {
        requirements = requirements.filter(r => filters.regulations!.includes(r.regulation));
      }
      if (filters.status) {
        requirements = requirements.filter(r => r.status === filters.status);
      }
      if (filters.priority) {
        requirements = requirements.filter(r => r.priority === filters.priority);
      }
    }

    return requirements;
  }

  /**
   * Get compliance summary
   */
  getComplianceSummary(regulation?: string): ComplianceSummary {
    const requirements = regulation 
      ? this.getRequirements({ regulation })
      : Array.from(this.requirements.values());

    const summary: ComplianceSummary = {
      totalRequirements: requirements.length,
      compliant: 0,
      nonCompliant: 0,
      partial: 0,
      pendingReview: 0,
      overallScore: 0,
      criticalIssues: 0,
      trend: 'stable'
    };

    requirements.forEach(req => {
      switch (req.status) {
        case 'compliant':
          summary.compliant++;
          break;
        case 'non_compliant':
          summary.nonCompliant++;
          if (req.priority === 'critical') summary.criticalIssues++;
          break;
        case 'partial':
          summary.partial++;
          break;
        case 'pending_review':
          summary.pendingReview++;
          break;
      }
    });

    // Calculate overall score
    if (summary.totalRequirements > 0) {
      summary.overallScore = Math.round(
        ((summary.compliant + summary.partial * 0.5) / summary.totalRequirements) * 100
      );
    }

    // Determine trend (would compare with historical data)
    const previousScore = this.getPreviousScore(regulation);
    if (previousScore !== null) {
      if (summary.overallScore > previousScore + 5) {
        summary.trend = 'improving';
      } else if (summary.overallScore < previousScore - 5) {
        summary.trend = 'declining';
      }
    }

    return summary;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(
    name: string,
    type: ReportType,
    requirements?: ComplianceRequirement[]
  ): ComplianceReport {
    const reqs = requirements || Array.from(this.requirements.values());
    const authService = (window as any).moduleSystem?.get('AuthService');
    const currentUser = authService?.getCurrentUser();

    const report: ComplianceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      period: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      generatedDate: new Date().toISOString(),
      generatedBy: currentUser?.name || 'System',
      summary: this.getComplianceSummary(),
      requirements: reqs,
      recommendations: this.generateRecommendations(reqs)
    };

    return report;
  }

  /**
   * Add compliance evidence
   */
  addEvidence(
    requirementId: string,
    evidence: Omit<ComplianceEvidence, 'id' | 'uploadedDate' | 'uploadedBy'>
  ): boolean {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return false;

    const authService = (window as any).moduleSystem?.get('AuthService');
    const currentUser = authService?.getCurrentUser();

    const fullEvidence: ComplianceEvidence = {
      ...evidence,
      id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadedDate: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'System'
    };

    requirement.evidence = requirement.evidence || [];
    requirement.evidence.push(fullEvidence);

    this.saveComplianceData();
    return true;
  }

  /**
   * Create compliance task
   */
  createTask(task: Omit<ComplianceTask, 'id' | 'status'>): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTask: ComplianceTask = {
      ...task,
      id: taskId,
      status: 'pending'
    };

    this.tasks.set(taskId, fullTask);
    this.saveTasks();

    // Send notification
    this.notifyTaskAssignment(fullTask);

    return taskId;
  }

  /**
   * Get compliance tasks
   */
  getTasks(filters?: {
    assignedTo?: string;
    status?: ComplianceTask['status'];
    requirementId?: string;
  }): ComplianceTask[] {
    let tasks = Array.from(this.tasks.values());

    if (filters) {
      if (filters.assignedTo) {
        tasks = tasks.filter(t => t.assignedTo === filters.assignedTo);
      }
      if (filters.status) {
        tasks = tasks.filter(t => t.status === filters.status);
      }
      if (filters.requirementId) {
        tasks = tasks.filter(t => t.requirementId === filters.requirementId);
      }
    }

    // Check for overdue tasks
    const now = new Date();
    tasks.forEach(task => {
      if (task.status !== 'completed' && new Date(task.dueDate) < now) {
        task.status = 'overdue';
      }
    });

    return tasks;
  }

  /**
   * Get compliance risks
   */
  getRisks(minScore?: number): ComplianceRisk[] {
    let risks = Array.from(this.risks.values());
    
    if (minScore !== undefined) {
      risks = risks.filter(r => r.riskScore >= minScore);
    }

    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Export compliance data
   */
  async exportComplianceData(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> {
    const data = {
      exportDate: new Date().toISOString(),
      summary: this.getComplianceSummary(),
      requirements: Array.from(this.requirements.values()),
      tasks: Array.from(this.tasks.values()),
      risks: Array.from(this.risks.values()),
      reports: Array.from(this.reports.values())
    };

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      case 'csv':
        return this.exportToCSV(data);
      case 'pdf':
        return this.exportToPDF(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Schedule compliance review
   */
  scheduleReview(
    requirementId: string,
    reviewDate: Date,
    reviewer: string
  ): boolean {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) return false;

    this.createTask({
      requirementId,
      title: `Review ${requirement.name}`,
      description: `Scheduled compliance review for ${requirement.regulation} requirement`,
      assignedTo: reviewer,
      dueDate: reviewDate.toISOString(),
      priority: requirement.priority
    });

    return true;
  }

  // Private helper methods
  private createRemediationTask(requirement: ComplianceRequirement): void {
    const dueDate = new Date();
    
    // Set due date based on priority
    switch (requirement.priority) {
      case 'critical':
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case 'high':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'medium':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'low':
        dueDate.setDate(dueDate.getDate() + 90);
        break;
    }

    this.createTask({
      requirementId: requirement.id,
      title: `Remediate: ${requirement.name}`,
      description: `Address non-compliance for ${requirement.regulation} requirement`,
      assignedTo: 'Compliance Team',
      dueDate: dueDate.toISOString(),
      priority: requirement.priority
    });
  }

  private assessRisk(requirement: ComplianceRequirement): void {
    if (requirement.status === 'compliant' || requirement.status === 'not_applicable') {
      return;
    }

    const likelihood = requirement.status === 'non_compliant' ? 'likely' : 'possible';
    const impact = requirement.priority === 'critical' ? 'severe' : 
                   requirement.priority === 'high' ? 'major' : 'moderate';

    const riskScore = this.calculateRiskScore(likelihood, impact);

    const risk: ComplianceRisk = {
      id: `risk_${requirement.id}`,
      requirementId: requirement.id,
      description: `Non-compliance with ${requirement.name}`,
      likelihood,
      impact,
      riskScore,
      mitigation: `Implement controls for ${requirement.name}`
    };

    this.risks.set(risk.id, risk);
  }

  private calculateRiskScore(
    likelihood: ComplianceRisk['likelihood'],
    impact: ComplianceRisk['impact']
  ): number {
    const likelihoodScores = {
      rare: 1,
      unlikely: 2,
      possible: 3,
      likely: 4,
      certain: 5
    };

    const impactScores = {
      negligible: 1,
      minor: 2,
      moderate: 3,
      major: 4,
      severe: 5
    };

    return likelihoodScores[likelihood] * impactScores[impact];
  }

  private generateRecommendations(requirements: ComplianceRequirement[]): string[] {
    const recommendations: string[] = [];
    
    const nonCompliant = requirements.filter(r => 
      r.status === 'non_compliant' || r.status === 'partial'
    );

    if (nonCompliant.length > 0) {
      recommendations.push(
        `Address ${nonCompliant.length} non-compliant requirements, prioritizing critical items`
      );
    }

    const needsReview = requirements.filter(r => 
      !r.lastReviewed || 
      new Date(r.lastReviewed) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );

    if (needsReview.length > 0) {
      recommendations.push(
        `Review ${needsReview.length} requirements that haven't been reviewed in 90+ days`
      );
    }

    const missingEvidence = requirements.filter(r => 
      !r.evidence || r.evidence.length === 0
    );

    if (missingEvidence.length > 0) {
      recommendations.push(
        `Collect and document evidence for ${missingEvidence.length} requirements`
      );
    }

    return recommendations;
  }

  private async runAutomatedCheck(requirementId: string): Promise<void> {
    const check = this.automatedChecks.get(requirementId);
    if (!check) return;

    try {
      const result = await check.execute();
      this.updateRequirementStatus(requirementId, result.status);
    } catch (error) {
      console.error(`Automated check failed for ${requirementId}:`, error);
    }
  }

  private scheduleAutomatedChecks(): void {
    // Run automated checks daily
    setInterval(() => {
      this.performAutomatedChecks();
    }, 24 * 60 * 60 * 1000);
  }

  private async performAutomatedChecks(): Promise<void> {
    console.log('🤖 Running automated compliance checks...');
    
    for (const [requirementId] of this.automatedChecks) {
      await this.runAutomatedCheck(requirementId);
    }
  }

  private performInitialAssessment(): void {
    // Perform initial compliance assessment
    const summary = this.getComplianceSummary();
    
    console.log(`📊 Initial compliance assessment:
      Total Requirements: ${summary.totalRequirements}
      Compliant: ${summary.compliant}
      Non-Compliant: ${summary.nonCompliant}
      Overall Score: ${summary.overallScore}%
      Critical Issues: ${summary.criticalIssues}
    `);
  }

  private getPreviousScore(regulation?: string): number | null {
    // In production, would retrieve from historical data
    return null;
  }

  private notifyTaskAssignment(task: ComplianceTask): void {
    console.log(`📋 Task assigned: ${task.title} to ${task.assignedTo}`);
    // In production, send email/notification
  }

  private exportToCSV(data: any): Blob {
    // Simple CSV export of requirements
    const csv = 'Requirement,Regulation,Category,Status,Priority\n' +
      data.requirements.map((r: ComplianceRequirement) => 
        `"${r.name}","${r.regulation}","${r.category}","${r.status}","${r.priority}"`
      ).join('\n');

    return new Blob([csv], { type: 'text/csv' });
  }

  private exportToPDF(data: any): Blob {
    // In production, use PDF library
    console.log('PDF export not implemented');
    return this.exportToCSV(data);
  }

  private loadComplianceData(): void {
    if (typeof window === 'undefined') return;

    try {
      const requirementsData = localStorage.getItem('compliance_requirements');
      if (requirementsData) {
        const requirements = JSON.parse(requirementsData);
        requirements.forEach((req: ComplianceRequirement) => {
          this.requirements.set(req.id, req);
        });
      }

      const tasksData = localStorage.getItem('compliance_tasks');
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        tasks.forEach((task: ComplianceTask) => {
          this.tasks.set(task.id, task);
        });
      }

      const risksData = localStorage.getItem('compliance_risks');
      if (risksData) {
        const risks = JSON.parse(risksData);
        risks.forEach((risk: ComplianceRisk) => {
          this.risks.set(risk.id, risk);
        });
      }
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    }
  }

  private saveComplianceData(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'compliance_requirements',
        JSON.stringify(Array.from(this.requirements.values()))
      );
    } catch (error) {
      console.error('Failed to save compliance data:', error);
    }
  }

  private saveTasks(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'compliance_tasks',
        JSON.stringify(Array.from(this.tasks.values()))
      );
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  private saveReports(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'compliance_reports',
        JSON.stringify(Array.from(this.reports.values()))
      );
    } catch (error) {
      console.error('Failed to save reports:', error);
    }
  }
}

// Type definitions
interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  categories: string[];
  requirements: string[];
}

interface AutomatedCheck {
  requirementId: string;
  execute: () => Promise<{ status: ComplianceStatus; details?: string }>;
}

// Export singleton getter function
export function getComplianceService(): ComplianceService {
  return ComplianceService.getInstance();
}