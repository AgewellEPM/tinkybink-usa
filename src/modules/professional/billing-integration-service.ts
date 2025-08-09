// Module 18: Billing Integration Service
// Handles insurance billing, claims processing, and financial reporting

import { getSessionTrackingService } from '../ui/session-tracking-service';
import { getTherapyGoalsService } from './therapy-goals-service';
import { getAnalyticsService } from '../core/analytics-service';

export interface BillingProfile {
  patientId: string;
  insuranceInfo: InsuranceInfo;
  billingAddress: Address;
  paymentMethod?: PaymentMethod;
  authorizations: Authorization[];
  balance: number;
  creditLimit: number;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberId: string;
  subscriberName: string;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  coverageType: 'private' | 'medicare' | 'medicaid' | 'tricare' | 'other';
  copay?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
  effectiveDate: Date;
  terminationDate?: Date;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'credit' | 'debit' | 'ach' | 'check';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Authorization {
  id: string;
  authNumber: string;
  startDate: Date;
  endDate: Date;
  totalUnits: number;
  usedUnits: number;
  unitType: 'sessions' | 'minutes' | 'hours';
  cptCodes: string[];
  diagnosis: string[];
  status: 'active' | 'expired' | 'exhausted';
  notes?: string;
}

export interface Claim {
  id: string;
  patientId: string;
  claimNumber?: string;
  dateOfService: Date;
  dateSubmitted?: Date;
  sessions: BillableSession[];
  totalAmount: number;
  allowedAmount?: number;
  paidAmount?: number;
  patientResponsibility?: number;
  status: 'draft' | 'submitted' | 'processing' | 'paid' | 'denied' | 'appealed';
  denialReason?: string;
  paymentDate?: Date;
  checkNumber?: string;
  eobDocument?: string;
}

export interface BillableSession {
  sessionId: string;
  date: Date;
  duration: number;
  cptCode: string;
  modifiers?: string[];
  units: number;
  rate: number;
  amount: number;
  notes?: string;
  supervisionRequired: boolean;
  supervisorId?: string;
}

export interface CPTCode {
  code: string;
  description: string;
  category: 'evaluation' | 'treatment' | 'group' | 'teletherapy';
  defaultRate: number;
  defaultUnits: number;
  requiresModifier: boolean;
  allowedModifiers?: string[];
}

export interface BillingReport {
  period: { start: Date; end: Date };
  summary: {
    totalClaims: number;
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    totalDenied: number;
    averageReimbursementRate: number;
    averageDaysToPayment: number;
  };
  byInsurer: Map<string, InsurerStats>;
  byPatient: Map<string, PatientBillingStats>;
  aging: AgingReport;
  projections: FinancialProjections;
}

export interface InsurerStats {
  name: string;
  claimCount: number;
  totalBilled: number;
  totalPaid: number;
  denialRate: number;
  averageDaysToPayment: number;
}

export interface PatientBillingStats {
  patientId: string;
  totalSessions: number;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  lastPayment?: Date;
}

export interface AgingReport {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
}

export interface FinancialProjections {
  nextMonth: number;
  nextQuarter: number;
  assumptions: string[];
}

export class BillingIntegrationService {
  private static instance: BillingIntegrationService;
  private sessionTracking: ReturnType<typeof getSessionTrackingService> | null = null;
  private therapyGoals: ReturnType<typeof getTherapyGoalsService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  
  private billingProfiles: Map<string, BillingProfile> = new Map();
  private claims: Map<string, Claim> = new Map();
  private cptCodes: Map<string, CPTCode> = new Map();
  private standardRates: Map<string, number> = new Map();

  private constructor() {
    console.log('BillingIntegrationService created');
  }

  static getInstance(): BillingIntegrationService {
    if (!BillingIntegrationService.instance) {
      BillingIntegrationService.instance = new BillingIntegrationService();
    }
    return BillingIntegrationService.instance;
  }

  async initialize(): Promise<void> {
    this.sessionTracking = getSessionTrackingService();
    this.therapyGoals = getTherapyGoalsService();
    this.analytics = getAnalyticsService();
    
    // Initialize CPT codes
    this.initializeCPTCodes();
    
    // Load saved data
    this.loadBillingData();
    
    // Start automatic claim generation
    this.startAutomaticBilling();
    
    console.log('BillingIntegrationService initialized');
  }

  // Create/update billing profile
  upsertBillingProfile(profile: BillingProfile): void {
    this.billingProfiles.set(profile.patientId, profile);
    this.saveBillingData();
    
    this.analytics?.track('billing_profile_updated', {
      patientId: profile.patientId,
      insuranceProvider: profile.insuranceInfo.provider
    });
  }

  // Get billing profile
  getBillingProfile(patientId: string): BillingProfile | null {
    return this.billingProfiles.get(patientId) || null;
  }

  // Create claim from sessions
  createClaim(
    patientId: string, 
    sessionIds: string[], 
    options?: { 
      submitImmediately?: boolean;
      includeDraft?: boolean;
    }
  ): Claim | null {
    const profile = this.billingProfiles.get(patientId);
    if (!profile) {
      console.error('No billing profile found for patient');
      return null;
    }
    
    // Get billable sessions
    const billableSessions = this.generateBillableSessions(patientId, sessionIds);
    if (billableSessions.length === 0) {
      console.error('No billable sessions found');
      return null;
    }
    
    // Check authorization
    const auth = this.findApplicableAuthorization(profile, billableSessions[0].date);
    if (!auth) {
      console.error('No valid authorization found');
      return null;
    }
    
    // Calculate total
    const totalAmount = billableSessions.reduce((sum, s) => sum + s.amount, 0);
    
    const claim: Claim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      dateOfService: billableSessions[0].date,
      sessions: billableSessions,
      totalAmount,
      status: options?.submitImmediately ? 'submitted' : 'draft',
      dateSubmitted: options?.submitImmediately ? new Date() : undefined
    };
    
    this.claims.set(claim.id, claim);
    
    // Update authorization units
    this.updateAuthorizationUnits(auth, billableSessions);
    
    this.saveBillingData();
    
    this.analytics?.track('claim_created', {
      claimId: claim.id,
      patientId,
      amount: totalAmount,
      sessionCount: billableSessions.length,
      status: claim.status
    });
    
    if (options?.submitImmediately) {
      this.submitClaim(claim.id);
    }
    
    return claim;
  }

  // Submit claim to insurance
  async submitClaim(claimId: string): Promise<boolean> {
    const claim = this.claims.get(claimId);
    if (!claim || claim.status !== 'draft') return false;
    
    const profile = this.billingProfiles.get(claim.patientId);
    if (!profile) return false;
    
    try {
      // In production, this would integrate with clearinghouse API
      const claimNumber = await this.submitToClearinghouse(claim, profile);
      
      claim.claimNumber = claimNumber;
      claim.status = 'submitted';
      claim.dateSubmitted = new Date();
      
      this.saveBillingData();
      
      this.analytics?.track('claim_submitted', {
        claimId,
        claimNumber,
        amount: claim.totalAmount
      });
      
      // Start tracking claim status
      this.trackClaimStatus(claimId);
      
      return true;
    } catch (error) {
      console.error('Failed to submit claim:', error);
      return false;
    }
  }

  // Process payment
  processPayment(
    claimId: string, 
    payment: {
      amount: number;
      allowedAmount: number;
      patientResponsibility: number;
      checkNumber?: string;
      paymentDate: Date;
    }
  ): void {
    const claim = this.claims.get(claimId);
    if (!claim) return;
    
    claim.status = 'paid';
    claim.paidAmount = payment.amount;
    claim.allowedAmount = payment.allowedAmount;
    claim.patientResponsibility = payment.patientResponsibility;
    claim.checkNumber = payment.checkNumber;
    claim.paymentDate = payment.paymentDate;
    
    this.saveBillingData();
    
    // Update patient balance
    const profile = this.billingProfiles.get(claim.patientId);
    if (profile) {
      profile.balance += payment.patientResponsibility;
      this.saveBillingData();
    }
    
    this.analytics?.track('payment_processed', {
      claimId,
      amount: payment.amount,
      allowedAmount: payment.allowedAmount,
      writeOff: claim.totalAmount - payment.allowedAmount
    });
  }

  // Generate billing report
  generateBillingReport(startDate: Date, endDate: Date): BillingReport {
    const periodClaims = Array.from(this.claims.values()).filter(c => 
      c.dateOfService >= startDate && c.dateOfService <= endDate
    );
    
    const summary = this.calculateBillingSummary(periodClaims);
    const byInsurer = this.calculateInsurerStats(periodClaims);
    const byPatient = this.calculatePatientStats(periodClaims);
    const aging = this.calculateAging();
    const projections = this.calculateProjections();
    
    return {
      period: { start: startDate, end: endDate },
      summary,
      byInsurer,
      byPatient,
      aging,
      projections
    };
  }

  // Check authorization status
  checkAuthorizationStatus(patientId: string): {
    hasActive: boolean;
    unitsRemaining: number;
    expirationDate?: Date;
    warnings: string[];
  } {
    const profile = this.billingProfiles.get(patientId);
    if (!profile) {
      return {
        hasActive: false,
        unitsRemaining: 0,
        warnings: ['No billing profile found']
      };
    }
    
    const activeAuth = profile.authorizations.find(a => 
      a.status === 'active' && 
      a.endDate > new Date() &&
      a.usedUnits < a.totalUnits
    );
    
    if (!activeAuth) {
      return {
        hasActive: false,
        unitsRemaining: 0,
        warnings: ['No active authorization found']
      };
    }
    
    const warnings: string[] = [];
    const unitsRemaining = activeAuth.totalUnits - activeAuth.usedUnits;
    const daysUntilExpiry = Math.floor(
      (activeAuth.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (unitsRemaining < 10) {
      warnings.push(`Only ${unitsRemaining} units remaining`);
    }
    
    if (daysUntilExpiry < 30) {
      warnings.push(`Authorization expires in ${daysUntilExpiry} days`);
    }
    
    return {
      hasActive: true,
      unitsRemaining,
      expirationDate: activeAuth.endDate,
      warnings
    };
  }

  // Export billing data
  exportBillingData(format: 'csv' | 'json' = 'json'): string {
    const data = {
      profiles: Array.from(this.billingProfiles.entries()),
      claims: Array.from(this.claims.entries()),
      exportDate: new Date().toISOString()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      return this.convertBillingToCSV(data);
    }
  }

  // Private methods
  private initializeCPTCodes(): void {
    // Common speech therapy CPT codes + Memory/Cognitive games
    const codes: CPTCode[] = [
      // Traditional Speech Therapy Codes
      {
        code: '92507',
        description: 'Speech/hearing therapy (AAC device training)',
        category: 'treatment',
        defaultRate: 150,
        defaultUnits: 1,
        requiresModifier: false
      },
      {
        code: '92508',
        description: 'Speech/hearing therapy, group',
        category: 'group',
        defaultRate: 50,
        defaultUnits: 1,
        requiresModifier: false
      },
      // AAC-Specific Codes
      {
        code: '92607',
        description: 'Evaluation for speech generating device',
        category: 'evaluation',
        defaultRate: 200,
        defaultUnits: 1,
        requiresModifier: false
      },
      {
        code: '92608',
        description: 'Speech generating device evaluation follow-up',
        category: 'evaluation',
        defaultRate: 175,
        defaultUnits: 1,
        requiresModifier: false
      },
      // Cognitive/Memory Training Codes
      {
        code: '97130',
        description: 'Cognitive function therapeutic activities (Memory Games)',
        category: 'treatment',
        defaultRate: 140,
        defaultUnits: 1,
        requiresModifier: false
      },
      {
        code: '96125',
        description: 'Cognitive assessment by physician/psychologist (Memory Evaluation)',
        category: 'evaluation',
        defaultRate: 180,
        defaultUnits: 1,
        requiresModifier: false
      },
      {
        code: '96127',
        description: 'Cognitive assessment by technician (Working Memory Test)',
        category: 'evaluation',
        defaultRate: 120,
        defaultUnits: 1,
        requiresModifier: false
      },
      // Therapeutic Activities
      {
        code: '97530',
        description: 'Therapeutic activities (Play-based AAC games)',
        category: 'treatment',
        defaultRate: 130,
        defaultUnits: 1,
        requiresModifier: false
      },
      // Traditional Speech Evaluations
      {
        code: '92521',
        description: 'Evaluation of speech fluency',
        category: 'evaluation',
        defaultRate: 200,
        defaultUnits: 1,
        requiresModifier: false
      },
      {
        code: '92522',
        description: 'Evaluation of speech sound production',
        category: 'evaluation',
        defaultRate: 200,
        defaultUnits: 1,
        requiresModifier: false
      },
      {
        code: '92523',
        description: 'Evaluation of speech and language',
        category: 'evaluation',
        defaultRate: 250,
        defaultUnits: 1,
        requiresModifier: false
      },
      {
        code: '92524',
        description: 'Behavioral and qualitative analysis of voice',
        category: 'evaluation',
        defaultRate: 175,
        defaultUnits: 1,
        requiresModifier: false
      },
      // Teletherapy
      {
        code: '98966',
        description: 'Telephone assessment and management',
        category: 'teletherapy',
        defaultRate: 75,
        defaultUnits: 1,
        requiresModifier: true,
        allowedModifiers: ['95', 'GT']
      }
    ];
    
    codes.forEach(code => {
      this.cptCodes.set(code.code, code);
      this.standardRates.set(code.code, code.defaultRate);
    });
  }

  private loadBillingData(): void {
    // Load profiles
    const savedProfiles = localStorage.getItem('billingProfiles');
    if (savedProfiles) {
      try {
        const profiles = JSON.parse(savedProfiles);
        profiles.forEach(([id, profile]: [string, any]) => {
          // Convert dates
          profile.insuranceInfo.effectiveDate = new Date(profile.insuranceInfo.effectiveDate);
          if (profile.insuranceInfo.terminationDate) {
            profile.insuranceInfo.terminationDate = new Date(profile.insuranceInfo.terminationDate);
          }
          profile.authorizations.forEach((auth: any) => {
            auth.startDate = new Date(auth.startDate);
            auth.endDate = new Date(auth.endDate);
          });
          
          this.billingProfiles.set(id, profile);
        });
      } catch (error) {
        console.error('Failed to load billing profiles:', error);
      }
    }
    
    // Load claims
    const savedClaims = localStorage.getItem('billingClaims');
    if (savedClaims) {
      try {
        const claims = JSON.parse(savedClaims);
        claims.forEach(([id, claim]: [string, any]) => {
          // Convert dates
          claim.dateOfService = new Date(claim.dateOfService);
          if (claim.dateSubmitted) claim.dateSubmitted = new Date(claim.dateSubmitted);
          if (claim.paymentDate) claim.paymentDate = new Date(claim.paymentDate);
          claim.sessions.forEach((s: any) => {
            s.date = new Date(s.date);
          });
          
          this.claims.set(id, claim);
        });
      } catch (error) {
        console.error('Failed to load claims:', error);
      }
    }
  }

  private saveBillingData(): void {
    localStorage.setItem('billingProfiles', JSON.stringify(
      Array.from(this.billingProfiles.entries())
    ));
    
    localStorage.setItem('billingClaims', JSON.stringify(
      Array.from(this.claims.entries())
    ));
  }

  private startAutomaticBilling(): void {
    // Check for unbilled sessions daily
    setInterval(() => {
      this.processUnbilledSessions();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private processUnbilledSessions(): void {
    // Get all sessions from last 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    // Group sessions by patient
    // In production, this would query actual session data
    const patientSessions = new Map<string, string[]>();
    
    // Create draft claims for each patient
    patientSessions.forEach((sessionIds, patientId) => {
      if (this.getBillingProfile(patientId)) {
        this.createClaim(patientId, sessionIds, { includeDraft: true });
      }
    });
  }

  private generateBillableSessions(
    patientId: string, 
    sessionIds: string[]
  ): BillableSession[] {
    const sessions: BillableSession[] = [];
    const profile = this.billingProfiles.get(patientId);
    
    sessionIds.forEach(sessionId => {
      // In production, get actual session data
      const session = {
        sessionId,
        date: new Date(),
        duration: 30, // minutes
        cptCode: '92507', // Default individual therapy
        units: 1,
        rate: this.standardRates.get('92507') || 150,
        amount: 150,
        supervisionRequired: false
      };
      
      sessions.push(session);
    });
    
    return sessions;
  }

  private findApplicableAuthorization(
    profile: BillingProfile, 
    serviceDate: Date
  ): Authorization | null {
    return profile.authorizations.find(auth => 
      auth.status === 'active' &&
      auth.startDate <= serviceDate &&
      auth.endDate >= serviceDate &&
      auth.usedUnits < auth.totalUnits
    ) || null;
  }

  private updateAuthorizationUnits(
    auth: Authorization, 
    sessions: BillableSession[]
  ): void {
    const totalUnits = sessions.reduce((sum, s) => sum + s.units, 0);
    auth.usedUnits += totalUnits;
    
    if (auth.usedUnits >= auth.totalUnits) {
      auth.status = 'exhausted';
    }
  }

  private async submitToClearinghouse(
    claim: Claim, 
    profile: BillingProfile
  ): Promise<string> {
    // Simulate clearinghouse submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate claim number
    const claimNumber = `CLM${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    return claimNumber;
  }

  private trackClaimStatus(claimId: string): void {
    // In production, this would poll clearinghouse for status updates
    setTimeout(() => {
      const claim = this.claims.get(claimId);
      if (claim && claim.status === 'submitted') {
        claim.status = 'processing';
        this.saveBillingData();
      }
    }, 5000);
  }

  private calculateBillingSummary(claims: Claim[]): BillingReport['summary'] {
    const totalClaims = claims.length;
    const totalBilled = claims.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalCollected = claims
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalPending = claims
      .filter(c => ['submitted', 'processing'].includes(c.status))
      .reduce((sum, c) => sum + c.totalAmount, 0);
    const totalDenied = claims
      .filter(c => c.status === 'denied')
      .reduce((sum, c) => sum + c.totalAmount, 0);
    
    const paidClaims = claims.filter(c => c.status === 'paid' && c.paymentDate);
    const averageReimbursementRate = paidClaims.length > 0
      ? paidClaims.reduce((sum, c) => sum + ((c.paidAmount || 0) / c.totalAmount), 0) / paidClaims.length * 100
      : 0;
    
    const averageDaysToPayment = paidClaims.length > 0
      ? paidClaims.reduce((sum, c) => {
          const days = c.paymentDate && c.dateSubmitted
            ? Math.floor((c.paymentDate.getTime() - c.dateSubmitted.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          return sum + days;
        }, 0) / paidClaims.length
      : 0;
    
    return {
      totalClaims,
      totalBilled,
      totalCollected,
      totalPending,
      totalDenied,
      averageReimbursementRate,
      averageDaysToPayment
    };
  }

  private calculateInsurerStats(claims: Claim[]): Map<string, InsurerStats> {
    const stats = new Map<string, InsurerStats>();
    
    // Group claims by insurer
    claims.forEach(claim => {
      const profile = this.billingProfiles.get(claim.patientId);
      if (!profile) return;
      
      const insurer = profile.insuranceInfo.provider;
      const existing = stats.get(insurer) || {
        name: insurer,
        claimCount: 0,
        totalBilled: 0,
        totalPaid: 0,
        denialRate: 0,
        averageDaysToPayment: 0
      };
      
      existing.claimCount++;
      existing.totalBilled += claim.totalAmount;
      if (claim.status === 'paid') {
        existing.totalPaid += claim.paidAmount || 0;
      }
      
      stats.set(insurer, existing);
    });
    
    // Calculate denial rates and payment times
    stats.forEach((stat, insurer) => {
      const insurerClaims = claims.filter(c => {
        const profile = this.billingProfiles.get(c.patientId);
        return profile?.insuranceInfo.provider === insurer;
      });
      
      const deniedCount = insurerClaims.filter(c => c.status === 'denied').length;
      stat.denialRate = insurerClaims.length > 0 
        ? (deniedCount / insurerClaims.length) * 100 
        : 0;
      
      const paidClaims = insurerClaims.filter(c => 
        c.status === 'paid' && c.paymentDate && c.dateSubmitted
      );
      
      if (paidClaims.length > 0) {
        const totalDays = paidClaims.reduce((sum, c) => {
          const days = Math.floor(
            ((c.paymentDate?.getTime() || 0) - (c.dateSubmitted?.getTime() || 0)) / 
            (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);
        
        stat.averageDaysToPayment = totalDays / paidClaims.length;
      }
    });
    
    return stats;
  }

  private calculatePatientStats(claims: Claim[]): Map<string, PatientBillingStats> {
    const stats = new Map<string, PatientBillingStats>();
    
    claims.forEach(claim => {
      const existing = stats.get(claim.patientId) || {
        patientId: claim.patientId,
        totalSessions: 0,
        totalBilled: 0,
        totalPaid: 0,
        balance: 0
      };
      
      existing.totalSessions += claim.sessions.length;
      existing.totalBilled += claim.totalAmount;
      
      if (claim.status === 'paid') {
        existing.totalPaid += claim.paidAmount || 0;
        existing.balance += claim.patientResponsibility || 0;
        if (!existing.lastPayment || claim.paymentDate! > existing.lastPayment) {
          existing.lastPayment = claim.paymentDate;
        }
      }
      
      stats.set(claim.patientId, existing);
    });
    
    return stats;
  }

  private calculateAging(): AgingReport {
    const now = new Date();
    const aging: AgingReport = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0
    };
    
    this.claims.forEach(claim => {
      if (claim.status !== 'paid' && claim.dateSubmitted) {
        const daysPending = Math.floor(
          (now.getTime() - claim.dateSubmitted.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const amount = claim.totalAmount;
        
        if (daysPending <= 30) {
          aging.current += amount;
        } else if (daysPending <= 60) {
          aging.days30 += amount;
        } else if (daysPending <= 90) {
          aging.days60 += amount;
        } else if (daysPending <= 120) {
          aging.days90 += amount;
        } else {
          aging.over90 += amount;
        }
      }
    });
    
    return aging;
  }

  private calculateProjections(): FinancialProjections {
    // Simple projection based on historical data
    const lastMonthClaims = Array.from(this.claims.values()).filter(c => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return c.dateOfService > oneMonthAgo;
    });
    
    const monthlyAverage = lastMonthClaims.reduce((sum, c) => 
      sum + (c.paidAmount || c.totalAmount * 0.8), 0
    );
    
    return {
      nextMonth: monthlyAverage,
      nextQuarter: monthlyAverage * 3,
      assumptions: [
        'Based on last 30 days average',
        'Assumes 80% collection rate',
        'Excludes seasonal variations'
      ]
    };
  }

  private convertBillingToCSV(data: any): string {
    // Simple CSV export of claims
    const headers = ['Claim ID', 'Patient ID', 'Date', 'Amount', 'Status', 'Paid'];
    const rows = data.claims.map(([id, claim]: [string, Claim]) => [
      claim.id,
      claim.patientId,
      claim.dateOfService.toLocaleDateString(),
      claim.totalAmount,
      claim.status,
      claim.paidAmount || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton getter
export function getBillingIntegrationService(): BillingIntegrationService {
  return BillingIntegrationService.getInstance();
}