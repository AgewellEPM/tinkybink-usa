/**
 * Auto-Billing Workflow Service
 * Automatically processes insurance claims during and after therapy sessions
 * Integrates with calendar events to trigger billing on session completion
 */

import { getBillingIntegrationService } from '../modules/professional/billing-integration-service';
// Calendar services would be imported in production
// import { calendarIntegrationService } from './calendar-integration-service';
// import { appointmentSchedulingService } from './appointment-scheduling-service';
import { getSessionTrackingService } from '../modules/ui/session-tracking-service';
import { 
  AAC_CPT_CODES, 
  calculateReimbursement, 
  getDocumentationRequirements,
  INSURANCE_RULES 
} from './enhanced-billing-rates';

export interface AutoBillingSession {
  sessionId: string;
  appointmentId: string;
  patientId: string;
  therapistId: string;
  startTime: Date;
  endTime?: Date;
  actualDuration: number; // in minutes
  plannedDuration: number;
  cptCodes: string[];
  modifiers: string[];
  activities: SessionActivity[];
  documentation: SessionDocumentation;
  billingStatus: 'pending' | 'ready' | 'submitted' | 'processed' | 'denied';
  claimId?: string;
  estimatedReimbursement: number;
  actualReimbursement?: number;
}

export interface SessionActivity {
  timestamp: Date;
  activityType: 'evaluation' | 'treatment' | 'device_training' | 'parent_training';
  cptCode: string;
  duration: number; // minutes
  description: string;
  dataCollected: {
    trials?: number;
    accuracy?: number;
    prompts?: string;
    notes?: string;
  };
}

export interface SessionDocumentation {
  soapNote?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  goalsAddressed: string[];
  progressMade: string;
  homeProgramProvided: boolean;
  parentEducation?: string;
  nextSessionPlan: string;
  signatures: {
    therapist?: string;
    supervisor?: string;
    parent?: string;
  };
}

export interface BillingAlert {
  type: 'documentation_missing' | 'auth_expiring' | 'cap_approaching' | 'claim_denied';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actionRequired: string;
  deadline?: Date;
}

class AutoBillingWorkflowService {
  private static instance: AutoBillingWorkflowService;
  private billingService = getBillingIntegrationService();
  private sessionTracking = getSessionTrackingService();
  private activeSessions: Map<string, AutoBillingSession> = new Map();
  private billingAlerts: BillingAlert[] = [];
  
  // Real-time billing metrics
  private dailyBillingTotal = 0;
  private weeklyBillingTotal = 0;
  private monthlyBillingTotal = 0;
  private pendingClaims: Map<string, Record<string, unknown>> = new Map();
  
  private constructor() {
    this.initialize();
  }

  static getInstance(): AutoBillingWorkflowService {
    if (!AutoBillingWorkflowService.instance) {
      AutoBillingWorkflowService.instance = new AutoBillingWorkflowService();
    }
    return AutoBillingWorkflowService.instance;
  }

  private initialize(): void {
    console.log('💰 Auto-Billing Workflow Service initialized');
    this.setupEventListeners();
    this.loadPendingSessions();
    this.checkAuthorizationStatus();
    this.startBillingMonitor();
  }

  /**
   * Start auto-billing for a therapy session
   * Called when session starts from calendar event
   */
  async startSessionBilling(
    appointmentId: string,
    therapistId: string
  ): Promise<AutoBillingSession> {
    // Get appointment from service
    const appointment = this.getAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Get patient's insurance information
    const billingProfile = this.billingService.getBillingProfile(appointment.patient_id);
    if (!billingProfile) {
      throw new Error('No billing profile found for patient');
    }

    // Check authorization status
    const activeAuth = this.getActiveAuthorization(billingProfile);
    if (!activeAuth) {
      this.createBillingAlert({
        type: 'documentation_missing',
        severity: 'critical',
        message: 'No active authorization for this patient',
        actionRequired: 'Obtain authorization before billing'
      });
    }

    // Determine appropriate CPT codes based on session type
    const cptCodes = this.determineCPTCodes(appointment);
    
    // Calculate estimated reimbursement
    const estimation = this.calculateSessionEstimate(
      cptCodes,
      billingProfile.insuranceInfo.coverageType,
      appointment.duration
    );

    // Create billing session
    const billingSession: AutoBillingSession = {
      sessionId: `session_${Date.now()}`,
      appointmentId,
      patientId: appointment.patient_id,
      therapistId,
      startTime: new Date(),
      plannedDuration: appointment.duration,
      actualDuration: 0,
      cptCodes,
      modifiers: this.determineModifiers(appointment, billingProfile),
      activities: [],
      documentation: {
        goalsAddressed: [],
        progressMade: '',
        homeProgramProvided: false,
        nextSessionPlan: '',
        signatures: {}
      },
      billingStatus: 'pending',
      estimatedReimbursement: estimation.total
    };

    this.activeSessions.set(billingSession.sessionId, billingSession);
    
    // Start session timer
    this.startSessionTimer(billingSession.sessionId);
    
    // Send notification to therapist
    await this.sendNotification({
      to: 'therapist',
      subject: 'Billing Session Started',
      message: `Billing session started. Estimated reimbursement: $${estimation.total.toFixed(2)}`,
      priority: 'normal'
    });

    return billingSession;
  }

  /**
   * Track activity during session for accurate billing
   */
  async trackSessionActivity(
    sessionId: string,
    activity: Omit<SessionActivity, 'timestamp'>
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const timestampedActivity: SessionActivity = {
      ...activity,
      timestamp: new Date()
    };

    session.activities.push(timestampedActivity);
    
    // Update duration tracking
    session.actualDuration = Math.floor(
      (Date.now() - session.startTime.getTime()) / 60000
    );

    // Check if we need to add additional CPT codes
    if (this.shouldAddCPTCode(activity)) {
      session.cptCodes.push(activity.cptCode);
      this.recalculateEstimate(session);
    }

    // Save progress
    this.saveSessionProgress(session);
  }

  /**
   * Complete session and submit claim automatically
   */
  async completeSessionBilling(
    sessionId: string,
    documentation: SessionDocumentation
  ): Promise<{
    claimId: string;
    totalBilled: number;
    estimatedPayment: number;
    submissionStatus: string;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update session with final documentation
    session.endTime = new Date();
    session.actualDuration = Math.floor(
      (session.endTime.getTime() - session.startTime.getTime()) / 60000
    );
    session.documentation = documentation;
    session.billingStatus = 'ready';

    // Validate documentation completeness
    const validationResult = this.validateDocumentation(session);
    if (!validationResult.isValid) {
      this.createBillingAlert({
        type: 'documentation_missing',
        severity: 'warning',
        message: `Missing documentation: ${validationResult.missing.join(', ')}`,
        actionRequired: 'Complete documentation before claim submission',
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
      });
    }

    // Calculate final billing based on actual session time
    const billingProfile = this.billingService.getBillingProfile(session.patientId);
    const finalBilling = this.calculateFinalBilling(session, billingProfile!);

    // Create and submit claim
    const claim = await this.createClaim(session, finalBilling);
    
    // Submit to clearinghouse
    const submissionResult = await this.submitClaimToInsurance(claim);

    // Update session status
    session.billingStatus = 'submitted';
    session.claimId = claim.id;

    // Update daily/weekly/monthly totals
    this.updateBillingTotals(finalBilling.totalAmount);

    // Archive session
    this.archiveSession(session);

    // Update calendar event with billing info
    await this.updateCalendarWithBilling(session, claim);

    // Notify stakeholders
    await this.sendBillingNotifications(session, claim);

    return {
      claimId: claim.id,
      totalBilled: finalBilling.totalAmount,
      estimatedPayment: finalBilling.estimatedPayment,
      submissionStatus: submissionResult.status
    };
  }

  /**
   * Determine CPT codes based on appointment type
   */
  private determineCPTCodes(appointment: any): string[] {
    const codes: string[] = [];
    
    switch (appointment.type) {
      case 'initial_evaluation':
        codes.push('92521', '92597'); // Speech eval + AAC eval
        break;
      case 'aac_training':
        codes.push('92605'); // AAC device training
        break;
      case 'individual_therapy':
        codes.push('92507'); // Individual speech therapy
        break;
      case 'group_therapy':
        codes.push('92508'); // Group therapy
        break;
      case 'device_setup':
        codes.push('92605', '92606'); // Device setup + training
        break;
      case 'teletherapy':
        codes.push('92507', '99457'); // Individual + telehealth
        break;
      case 'cognitive_therapy':
        codes.push('97129', '97130'); // Cognitive intervention
        break;
      default:
        codes.push('92507'); // Default to individual therapy
    }

    return codes;
  }

  /**
   * Determine billing modifiers based on session context
   */
  private determineModifiers(appointment: any, billingProfile: any): string[] {
    const modifiers: string[] = [];

    // Speech therapy modifier
    modifiers.push('GN');

    // Telehealth modifiers
    if (appointment.is_virtual) {
      modifiers.push('GT', '95');
    }

    // Medicare cap exception
    if (billingProfile.insuranceInfo.coverageType === 'medicare') {
      const yearToDate = this.getYearToDateBilling(appointment.patient_id);
      if (yearToDate > INSURANCE_RULES.medicare.therapyCap) {
        modifiers.push('KX'); // Medical necessity exception
      }
    }

    // Habilitative vs Rehabilitative
    const patientAge = this.calculatePatientAge(billingProfile);
    if (patientAge < 21) {
      modifiers.push('96'); // Habilitative
    } else {
      modifiers.push('97'); // Rehabilitative
    }

    return modifiers;
  }

  /**
   * Calculate session billing estimate
   */
  private calculateSessionEstimate(
    cptCodes: string[],
    insuranceType: string,
    duration: number
  ): { total: number; breakdown: any[] } {
    let total = 0;
    const breakdown: any[] = [];

    cptCodes.forEach(code => {
      const cptInfo = AAC_CPT_CODES.find(c => c.code === code);
      if (!cptInfo) return;

      // Calculate units (15-minute increments)
      const units = Math.ceil(duration / 15);
      
      const insType = insuranceType as 'medicare' | 'medicaid' | 'commercial' | 'selfpay';
      const result = calculateReimbursement(code, insType, units);
      
      total += result.amount;
      breakdown.push({
        code,
        description: cptInfo.description,
        units,
        rate: result.amount / units,
        total: result.amount,
        notes: result.notes
      });
    });

    return { total, breakdown };
  }

  /**
   * Calculate final billing based on actual session
   */
  private calculateFinalBilling(session: AutoBillingSession, billingProfile: any): any {
    const breakdown: any[] = [];
    let totalAmount = 0;
    let estimatedPayment = 0;

    // Group activities by CPT code
    const codeGroups = new Map<string, number>();
    session.activities.forEach(activity => {
      const current = codeGroups.get(activity.cptCode) || 0;
      codeGroups.set(activity.cptCode, current + activity.duration);
    });

    // Calculate billing for each code
    codeGroups.forEach((duration, code) => {
      const units = Math.ceil(duration / 15);
      const insType = billingProfile.insuranceInfo.coverageType as any;
      const result = calculateReimbursement(code, insType, units, session.modifiers);
      
      totalAmount += result.amount;
      
      // Apply coinsurance/copay
      let patientResponsibility = 0;
      if (billingProfile.insuranceInfo.copay) {
        patientResponsibility = billingProfile.insuranceInfo.copay;
      } else if (billingProfile.insuranceInfo.coinsurance) {
        patientResponsibility = result.amount * billingProfile.insuranceInfo.coinsurance;
      }
      
      estimatedPayment += (result.amount - patientResponsibility);
      
      breakdown.push({
        code,
        units,
        amount: result.amount,
        allowedAmount: result.amount * 0.8, // Typical 80% of billed
        patientResponsibility,
        notes: result.notes
      });
    });

    return {
      totalAmount,
      estimatedPayment,
      breakdown,
      patientResponsibility: totalAmount - estimatedPayment
    };
  }

  /**
   * Create insurance claim
   */
  private async createClaim(session: AutoBillingSession, billing: any): Promise<any> {
    const claim = {
      id: `CLM${Date.now()}`,
      patientId: session.patientId,
      dateOfService: session.startTime,
      sessions: billing.breakdown.map((item: any) => ({
        sessionId: session.sessionId,
        date: session.startTime,
        duration: item.units * 15,
        cptCode: item.code,
        modifiers: session.modifiers,
        units: item.units,
        rate: item.amount / item.units,
        amount: item.amount,
        notes: session.documentation.progressMade
      })),
      totalAmount: billing.totalAmount,
      status: 'ready',
      diagnosis: this.getPatientDiagnosis(session.patientId),
      renderingProvider: session.therapistId,
      placeOfService: session.modifiers.includes('GT') ? '02' : '11', // Telehealth vs Office
      documentation: {
        soapNote: session.documentation.soapNote,
        goalsAddressed: session.documentation.goalsAddressed,
        progressMade: session.documentation.progressMade,
        dataCollected: session.activities.map(a => a.dataCollected)
      }
    };

    // Save claim
    await this.billingService.submitClaim(claim.patientId, claim.sessions[0], claim.totalAmount);
    
    return claim;
  }

  /**
   * Submit claim to insurance electronically
   */
  private async submitClaimToInsurance(claim: any): Promise<any> {
    // In production, this would connect to a clearinghouse API
    // For now, simulate submission
    
    const submission = {
      claimId: claim.id,
      submissionId: `SUB${Date.now()}`,
      timestamp: new Date(),
      status: 'accepted',
      clearinghouse: 'Change Healthcare',
      payerId: this.getPayerId(claim.patientId),
      estimatedProcessingTime: '3-5 business days',
      trackingNumber: `TRK${Date.now()}`
    };

    // Queue for status checking
    this.pendingClaims.set(claim.id, submission);
    
    // Schedule follow-up
    setTimeout(() => this.checkClaimStatus(claim.id), 24 * 60 * 60 * 1000);

    return submission;
  }

  /**
   * Update calendar event with billing information
   */
  private async updateCalendarWithBilling(session: AutoBillingSession, claim: any): Promise<void> {
    const appointment = this.getAppointmentById(session.appointmentId);
    if (!appointment) return;

    // Add billing info to calendar event
    const billingNote = `
BILLING COMPLETED ✅
Claim #: ${claim.id}
Total Billed: $${claim.totalAmount.toFixed(2)}
CPT Codes: ${session.cptCodes.join(', ')}
Status: Submitted to insurance
Tracking: ${this.pendingClaims.get(claim.id)?.trackingNumber}
    `;

    // Update all synced calendars
    // Update appointment with billing info
    appointment.notes = (appointment.notes || '') + billingNote;
    // In production, this would update the calendar event through the calendar service
  }

  /**
   * Send billing notifications to stakeholders
   */
  private async sendBillingNotifications(session: AutoBillingSession, claim: any): Promise<void> {
    const notifications: any[] = [];

    // Notify therapist
    notifications.push({
      to: 'therapist',
      subject: 'Session Billing Completed',
      message: `Claim ${claim.id} submitted for $${claim.totalAmount.toFixed(2)}`
    });

    // Notify billing department
    notifications.push({
      to: 'billing',
      subject: `New Claim Submitted - ${claim.id}`,
      message: `Patient: ${session.patientId}, Amount: $${claim.totalAmount.toFixed(2)}`
    });

    // Notify family if enabled
    const billingProfile = this.billingService.getBillingProfile(session.patientId);
    const sendFamilyNotifications = true; // Default to true, would be in profile settings
    if (billingProfile && sendFamilyNotifications) {
      notifications.push({
        to: 'family',
        subject: 'Therapy Session Completed',
        message: `Session completed. Insurance claim submitted. Your estimated responsibility: $${(claim.totalAmount * 0.2).toFixed(2)}`
      });
    }

    // Send all notifications
    await Promise.all(notifications.map(n => this.sendNotification(n)));
  }

  /**
   * Monitor billing metrics and alerts
   */
  private startBillingMonitor(): void {
    setInterval(() => {
      // Check authorization expirations
      this.checkAuthorizationExpirations();
      
      // Check therapy caps
      this.checkTherapyCaps();
      
      // Check claim statuses
      this.checkPendingClaims();
      
      // Generate daily report
      if (new Date().getHours() === 17) { // 5 PM
        this.generateDailyBillingReport();
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Check for expiring authorizations
   */
  // Helper method to get appointment by ID
  private getAppointmentById(appointmentId: string): any {
    // In production, this would query the appointment service
    // For now, return a mock appointment
    return {
      id: appointmentId,
      patient_id: 'patient_123',
      duration: 60,
      type: 'individual_therapy',
      is_virtual: false,
      notes: ''
    };
  }

  private checkAuthorizationExpirations(): void {
    // In production, this would get all profiles from the service
    // For now, check active sessions
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    this.activeSessions.forEach(session => {
      const profile = this.billingService.getBillingProfile(session.patientId);
      if (!profile) return;
      
      profile.authorizations.forEach((auth: any) => {
        if (auth.status === 'active' && auth.endDate < thirtyDaysFromNow) {
          this.createBillingAlert({
            type: 'auth_expiring',
            severity: 'warning',
            message: `Authorization ${auth.authNumber} expiring soon`,
            actionRequired: 'Request authorization renewal',
            deadline: auth.endDate
          });
        }

        // Check units remaining
        const unitsRemaining = auth.totalUnits - auth.usedUnits;
        if (unitsRemaining < 5 && auth.status === 'active') {
          this.createBillingAlert({
            type: 'auth_expiring',
            severity: 'warning',
            message: `Only ${unitsRemaining} units remaining on auth ${auth.authNumber}`,
            actionRequired: 'Request additional units or new authorization'
          });
        }
      });
    });
  }

  /**
   * Check Medicare therapy caps
   */
  private checkTherapyCaps(): void {
    // Check therapy caps for active sessions
    this.activeSessions.forEach(session => {
      const profile = this.billingService.getBillingProfile(session.patientId);
      if (!profile) return;
      if (profile.insuranceInfo.coverageType === 'medicare') {
        const yearToDate = this.getYearToDateBilling(profile.patientId);
        const cap = INSURANCE_RULES.medicare.therapyCap;
        const threshold = INSURANCE_RULES.medicare.capExceptionThreshold;

        if (yearToDate > cap * 0.8 && yearToDate < cap) {
          this.createBillingAlert({
            type: 'cap_approaching',
            severity: 'warning',
            message: `Patient approaching Medicare therapy cap ($${yearToDate}/$${cap})`,
            actionRequired: 'Prepare KX modifier documentation for medical necessity'
          });
        } else if (yearToDate > threshold * 0.9) {
          this.createBillingAlert({
            type: 'cap_approaching',
            severity: 'critical',
            message: `Patient near Medicare exception threshold ($${yearToDate}/$${threshold})`,
            actionRequired: 'Medical review required for continued therapy'
          });
        }
      }
    });
  }

  /**
   * Generate daily billing report
   */
  private generateDailyBillingReport(): any {
    const report = {
      date: new Date(),
      summary: {
        totalBilled: this.dailyBillingTotal,
        sessionsCompleted: this.activeSessions.size,
        claimsSubmitted: Array.from(this.pendingClaims.values()).filter(
          c => this.isToday(c.timestamp)
        ).length,
        estimatedRevenue: this.dailyBillingTotal * 0.75, // 75% collection rate
        alerts: this.billingAlerts.filter(a => a.severity === 'critical')
      },
      topCPTCodes: this.getTopCPTCodes(),
      insuranceBreakdown: this.getInsuranceBreakdown(),
      therapistProductivity: this.getTherapistProductivity(),
      denials: this.getDenialsSummary()
    };

    // Save and distribute report
    this.saveReport(report);
    this.distributeReport(report);

    // Reset daily counter
    this.dailyBillingTotal = 0;

    return report;
  }

  // Helper methods
  private getActiveAuthorization(profile: any): any {
    return profile.authorizations.find((auth: any) => 
      auth.status === 'active' && 
      auth.endDate > new Date() &&
      auth.usedUnits < auth.totalUnits
    );
  }

  private validateDocumentation(session: AutoBillingSession): any {
    const required = getDocumentationRequirements(
      session.cptCodes[0],
      'medicare' // Most stringent requirements
    );
    
    const missing: string[] = [];
    
    if (!session.documentation.soapNote) {
      missing.push('SOAP note');
    }
    if (session.documentation.goalsAddressed.length === 0) {
      missing.push('Goals addressed');
    }
    if (!session.documentation.signatures.therapist) {
      missing.push('Therapist signature');
    }
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }

  private createBillingAlert(alert: BillingAlert): void {
    this.billingAlerts.push(alert);
    
    // Send immediate notification for critical alerts
    if (alert.severity === 'critical') {
      this.sendNotification({
        to: 'billing_manager',
        subject: `CRITICAL: ${alert.message}`,
        message: alert.actionRequired,
        priority: 'high'
      });
    }
  }

  private shouldAddCPTCode(activity: any): boolean {
    // Logic to determine if activity warrants additional CPT code
    return activity.activityType === 'device_training' && 
           activity.duration >= 15;
  }

  private recalculateEstimate(session: AutoBillingSession): void {
    const billingProfile = this.billingService.getBillingProfile(session.patientId);
    const estimation = this.calculateSessionEstimate(
      session.cptCodes,
      billingProfile!.insuranceInfo.coverageType,
      session.actualDuration
    );
    session.estimatedReimbursement = estimation.total;
  }

  private getYearToDateBilling(patientId: string): number {
    // Calculate year-to-date billing for patient
    // In production, this would query the billing service
    const currentYear = new Date().getFullYear();
    let total = 0;
    
    // Sum up all claims for this patient this year
    this.pendingClaims.forEach(claim => {
      if (claim.patientId === patientId) {
        const claimDate = new Date(claim.timestamp);
        if (claimDate.getFullYear() === currentYear) {
          total += claim.amount || 0;
        }
      }
    });
    
    return total;
  }

  private calculatePatientAge(profile: any): number {
    // Calculate patient age from profile
    const birthDate = new Date(profile.personalInfo.dateOfBirth);
    const ageDiff = Date.now() - birthDate.getTime();
    return Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
  }

  private updateBillingTotals(amount: number): void {
    this.dailyBillingTotal += amount;
    this.weeklyBillingTotal += amount;
    this.monthlyBillingTotal += amount;
  }

  private startSessionTimer(sessionId: string): void {
    // Update session duration every minute
    setInterval(() => {
      const session = this.activeSessions.get(sessionId);
      if (session && !session.endTime) {
        session.actualDuration = Math.floor(
          (Date.now() - session.startTime.getTime()) / 60000
        );
      }
    }, 60000);
  }

  private getPatientDiagnosis(patientId: string): string[] {
    const profile = this.billingService.getBillingProfile(patientId);
    // Diagnosis codes would be in authorizations or default
    const diagnosisCodes = profile?.authorizations?.[0]?.diagnosis || ['F80.0']; // Default to speech disorder
    return Array.isArray(diagnosisCodes) ? diagnosisCodes : [diagnosisCodes];
  }

  private getPayerId(patientId: string): string {
    const profile = this.billingService.getBillingProfile(patientId);
    const provider = profile?.insuranceInfo.provider || '';
    
    // Map insurance provider to payer ID
    const payerIds: any = {
      'Medicare': 'MEDICARE',
      'Medicaid': 'MEDICAID',
      'Blue Cross': 'BCBS',
      'Aetna': 'AETNA',
      'United': 'UNITED',
      'Cigna': 'CIGNA'
    };
    
    return payerIds[provider] || 'UNKNOWN';
  }

  private checkClaimStatus(claimId: string): void {
    // Check claim status with clearinghouse
    // In production, this would call clearinghouse API
    console.log(`Checking status for claim ${claimId}`);
  }

  private checkPendingClaims(): void {
    this.pendingClaims.forEach((submission, claimId) => {
      const daysSinceSubmission = Math.floor(
        (Date.now() - submission.timestamp.getTime()) / (24 * 60 * 60 * 1000)
      );
      
      if (daysSinceSubmission > 7) {
        this.createBillingAlert({
          type: 'claim_denied',
          severity: 'warning',
          message: `Claim ${claimId} pending for ${daysSinceSubmission} days`,
          actionRequired: 'Follow up with insurance'
        });
      }
    });
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  private getTopCPTCodes(): any[] {
    // Analyze today's CPT code usage
    const codeUsage = new Map<string, number>();
    
    this.activeSessions.forEach(session => {
      session.cptCodes.forEach(code => {
        codeUsage.set(code, (codeUsage.get(code) || 0) + 1);
      });
    });
    
    return Array.from(codeUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));
  }

  private getInsuranceBreakdown(): any {
    // Breakdown by insurance type
    return {
      medicare: this.countByInsurance('medicare'),
      medicaid: this.countByInsurance('medicaid'),
      commercial: this.countByInsurance('commercial'),
      selfpay: this.countByInsurance('selfpay')
    };
  }

  private countByInsurance(type: string): number {
    let count = 0;
    this.activeSessions.forEach(session => {
      const profile = this.billingService.getBillingProfile(session.patientId);
      if (profile?.insuranceInfo.coverageType === type) {
        count++;
      }
    });
    return count;
  }

  private getTherapistProductivity(): any[] {
    // Calculate productivity by therapist
    const productivity = new Map<string, any>();
    
    this.activeSessions.forEach(session => {
      const existing = productivity.get(session.therapistId) || {
        therapistId: session.therapistId,
        sessions: 0,
        minutes: 0,
        billed: 0
      };
      
      existing.sessions++;
      existing.minutes += session.actualDuration;
      existing.billed += session.estimatedReimbursement;
      
      productivity.set(session.therapistId, existing);
    });
    
    return Array.from(productivity.values());
  }

  private getDenialsSummary(): any {
    const denials = this.billingAlerts
      .filter(a => a.type === 'claim_denied')
      .map(a => ({
        message: a.message,
        date: new Date()
      }));
    
    return {
      count: denials.length,
      reasons: denials
    };
  }

  private saveSessionProgress(session: AutoBillingSession): void {
    localStorage.setItem(`billing_session_${session.sessionId}`, JSON.stringify(session));
  }

  private archiveSession(session: AutoBillingSession): void {
    this.activeSessions.delete(session.sessionId);
    localStorage.setItem(`archived_session_${session.sessionId}`, JSON.stringify(session));
  }

  private loadPendingSessions(): void {
    // Load any incomplete sessions from storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('billing_session_')) {
        const session = JSON.parse(localStorage.getItem(key) || '{}');
        if (session.billingStatus === 'pending') {
          this.activeSessions.set(session.sessionId, session);
        }
      }
    }
  }

  private checkAuthorizationStatus(): void {
    // Initial check of all authorizations
    this.checkAuthorizationExpirations();
    this.checkTherapyCaps();
  }

  private async sendNotification(notification: any): Promise<void> {
    // Send notification via appropriate channel
    console.log('Sending notification:', notification);
    // In production, this would use email/SMS/push notifications
  }

  private saveReport(report: any): void {
    localStorage.setItem(`billing_report_${report.date.toISOString()}`, JSON.stringify(report));
  }

  private distributeReport(report: any): void {
    // Send report to stakeholders
    console.log('Distributing daily billing report:', report);
  }

  private setupEventListeners(): void {
    // Listen for calendar events
    window.addEventListener('calendarEventStarted', (event: any) => {
      this.startSessionBilling(event.detail.appointmentId, event.detail.therapistId);
    });

    window.addEventListener('calendarEventCompleted', (event: any) => {
      const session = Array.from(this.activeSessions.values())
        .find(s => s.appointmentId === event.detail.appointmentId);
      
      if (session) {
        this.completeSessionBilling(session.sessionId, event.detail.documentation);
      }
    });
  }

  // Public methods for external access
  getActiveSessions(): AutoBillingSession[] {
    return Array.from(this.activeSessions.values());
  }

  getBillingAlerts(): BillingAlert[] {
    return this.billingAlerts;
  }

  getDailyTotal(): number {
    return this.dailyBillingTotal;
  }

  getWeeklyTotal(): number {
    return this.weeklyBillingTotal;
  }

  getMonthlyTotal(): number {
    return this.monthlyBillingTotal;
  }
}

// Export singleton instance
export const autoBillingWorkflow = AutoBillingWorkflowService.getInstance();

// Export for use in other services
export function getAutoBillingWorkflow(): AutoBillingWorkflowService {
  return AutoBillingWorkflowService.getInstance();
}