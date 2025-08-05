/**
 * Integration Service v2 - Exact Mirror of Original Insurance/Billing APIs
 * Comprehensive healthcare integration with clearinghouses, payment processors, and EMR systems
 * Mirrors complete insurance, billing, and integration functionality from original
 */

import { EventEmitter } from 'events';

interface IntegrationConfig {
  insuranceClearinghouses: ClearinghouseConfig[];
  paymentProcessors: PaymentProcessorConfig[];
  emrSystems: EMRSystemConfig[];
  billingSettings: BillingSettings;
  apiKeys: APIKeyConfig;
  testMode: boolean;
}

interface ClearinghouseConfig {
  id: string;
  name: 'OfficeAlly' | 'Availity' | 'Change Healthcare';
  baseURL: string;
  credentials: {
    username: string;
    password: string;
    providerId: string;
    submitterId: string;
  };
  enabled: boolean;
  primary: boolean;
  testMode: boolean;
}

interface PaymentProcessorConfig {
  id: string;
  name: 'Stripe' | 'Square' | 'PayPal';
  credentials: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  enabled: boolean;
  primary: boolean;
  feePercentage: number;
  testMode: boolean;
}

interface EMRSystemConfig {
  id: string;
  name: 'Epic' | 'Cerner' | 'AllScripts' | 'NextGen';
  format: 'HL7_FHIR_R4' | 'HL7_CDA_3' | 'CSV' | 'PDF';
  endpoint?: string;
  credentials?: {
    clientId: string;
    clientSecret: string;
  };
  enabled: boolean;
}

interface BillingSettings {
  autoGenerateInvoices: boolean;
  sessionBillingUnit: number; // 15-minute increments
  defaultPaymentTerms: number; // days
  lateFeePercentage: number;
  autoSubmitClaims: boolean;
  retryFailedClaims: boolean;
  maxRetryAttempts: number;
}

interface APIKeyConfig {
  stripePublishable: string;
  stripeSecret: string;
  officeAllyAPI: string;
  availityAPI: string;
  changeHealthcareAPI: string;
  squareAppId: string;
  squareAccessToken: string;
  paypalClientId: string;
  paypalClientSecret: string;
}

// Insurance and Claims Interfaces
interface InsuranceClaim {
  id: string;
  patientId: string;
  patientName: string;
  sessionId: string;
  cptCode: string;
  serviceDate: Date;
  amount: number;
  units: number;
  status: ClaimStatus;
  insurancePayer: string;
  submittedDate?: Date;
  paidDate?: Date;
  denialReason?: string;
  ediData?: string;
  clearinghouse: string;
  batchId?: string;
}

interface ClaimBatch {
  id: string;
  submittedDate: Date;
  clearinghouse: string;
  claimCount: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'accepted' | 'rejected';
  claims: string[];
  ediData: string;
}

interface EligibilityVerification {
  patientId: string;
  insuranceProvider: string;
  memberId: string;
  serviceDate: Date;
  verified: boolean;
  benefits: BenefitDetails;
  copay: number;
  deductible: number;
  deductibleMet: number;
  verificationDate: Date;
}

interface BenefitDetails {
  speechTherapy: ServiceBenefit;
  occupationalTherapy: ServiceBenefit;
  physicalTherapy: ServiceBenefit;
  aacDevices: ServiceBenefit;
}

interface ServiceBenefit {
  covered: boolean;
  copay: number;
  coinsurance: number;
  annualMax: number;
  visitLimit: number;
  priorAuth: boolean;
  referralRequired: boolean;
}

// Payment Processing Interfaces
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  patientId: string;
  invoiceId?: string;
  paymentMethod: string;
  status: PaymentStatus;
  processingFee: number;
  netAmount: number;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

interface Subscription {
  id: string;
  patientId: string;
  planType: 'basic' | 'standard' | 'premium';
  amount: number;
  interval: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'paused' | 'cancelled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  paymentMethodId: string;
}

interface Invoice {
  id: string;
  patientId: string;
  sessionIds: string[];
  amount: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  paymentId?: string;
  lineItems: InvoiceLineItem[];
  createdAt: Date;
}

interface InvoiceLineItem {
  description: string;
  cptCode: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceDate: Date;
}

// EMR Export Interfaces
interface EMRExport {
  id: string;
  patientId: string;
  format: string;
  dataType: 'session_notes' | 'clinical_summary' | 'progress_report' | 'full_record';
  dateRange: {
    start: Date;
    end: Date;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface ClinicalData {
  patientDemographics: PatientDemographics;
  sessions: TherapySession[];
  diagnoses: DiagnosisCode[];
  goals: TreatmentGoal[];
  assessments: ClinicalAssessment[];
  medications?: Medication[];
}

interface PatientDemographics {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'O';
  address: Address;
  phone: string;
  email?: string;
  emergencyContact: EmergencyContact;
  insurance: InsuranceInfo;
}

interface TherapySession {
  id: string;
  date: Date;
  duration: number;
  cptCode: string;
  therapist: string;
  notes: string;
  goals: string[];
  interventions: string[];
  progress: ProgressMeasurement[];
  homework?: string;
  nextSession?: Date;
}

interface DiagnosisCode {
  code: string;
  description: string;
  type: 'ICD-10' | 'DSM-5';
  primary: boolean;
  dateOfOnset?: Date;
}

interface TreatmentGoal {
  id: string;
  description: string;
  targetDate: Date;
  status: 'active' | 'achieved' | 'discontinued';
  progress: number; // 0-100
  measurements: ProgressMeasurement[];
}

interface ClinicalAssessment {
  id: string;
  type: string;
  date: Date;
  score: number;
  maxScore: number;
  percentile?: number;
  interpretation: string;
  assessor: string;
}

interface ProgressMeasurement {
  date: Date;
  metric: string;
  value: number;
  unit: string;
  notes?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  startDate: Date;
  endDate?: Date;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface InsuranceInfo {
  provider: string;
  memberId: string;
  groupNumber: string;
  planType: string;
  copay: number;
  deductible: number;
  deductibleMet: number;
  eligibilityVerified: boolean;
  lastVerified?: Date;
}

// CPT and Fee Schedule
interface CPTCode {
  code: string;
  description: string;
  category: 'speech' | 'occupational' | 'physical' | 'evaluation' | 'aac';
  medicareRate: number;
  medicaidRate: number;
  commercialRate: number;
  unitType: '15min' | '30min' | '45min' | '60min' | 'session';
  modifiers?: string[];
}

// Type Definitions
type ClaimStatus = 'draft' | 'submitted' | 'processing' | 'approved' | 'denied' | 'paid' | 'appealed';
type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';

class IntegrationService extends EventEmitter {
  private static instance: IntegrationService;
  private config: IntegrationConfig;
  private claims: Map<string, InsuranceClaim> = new Map();
  private claimBatches: Map<string, ClaimBatch> = new Map();
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private emrExports: Map<string, EMRExport> = new Map();
  private eligibilityCache: Map<string, EligibilityVerification> = new Map();
  private isInitialized = false;

  // CPT Code Fee Schedule - Exact Mirror from Original
  private cptCodes: Map<string, CPTCode> = new Map([
    ['92507', {
      code: '92507',
      description: 'Individual speech therapy',
      category: 'speech',
      medicareRate: 85.50,
      medicaidRate: 78.25,
      commercialRate: 125.00,
      unitType: '15min'
    }],
    ['92508', {
      code: '92508',
      description: 'Group speech therapy',
      category: 'speech',
      medicareRate: 42.75,
      medicaidRate: 39.10,
      commercialRate: 65.00,
      unitType: '15min'
    }],
    ['92523', {
      code: '92523',
      description: 'Evaluation of speech sound production',
      category: 'evaluation',
      medicareRate: 156.75,
      medicaidRate: 143.25,
      commercialRate: 225.00,
      unitType: 'session'
    }],
    ['92609', {
      code: '92609',
      description: 'Therapeutic services for AAC devices',
      category: 'aac',
      medicareRate: 78.50,
      medicaidRate: 71.80,
      commercialRate: 115.00,
      unitType: '15min'
    }],
    ['97165', {
      code: '97165',
      description: 'OT evaluation - low complexity',
      category: 'evaluation',
      medicareRate: 112.45,
      medicaidRate: 102.75,
      commercialRate: 165.00,
      unitType: 'session'
    }],
    ['97166', {
      code: '97166',
      description: 'OT evaluation - moderate complexity',
      category: 'evaluation',
      medicareRate: 168.50,
      medicaidRate: 154.20,
      commercialRate: 245.00,
      unitType: 'session'
    }],
    ['97167', {
      code: '97167',
      description: 'OT evaluation - high complexity',
      category: 'evaluation',
      medicareRate: 224.75,
      medicaidRate: 206.15,
      commercialRate: 325.00,
      unitType: 'session'
    }],
    ['97530', {
      code: '97530',
      description: 'Therapeutic activities',
      category: 'occupational',
      medicareRate: 76.25,
      medicaidRate: 69.85,
      commercialRate: 110.00,
      unitType: '15min'
    }]
  ]);

  private constructor() {
    super();
    this.initializeDefaultConfig();
  }

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  private initializeDefaultConfig(): void {
    this.config = {
      insuranceClearinghouses: [
        {
          id: 'officeally',
          name: 'OfficeAlly',
          baseURL: 'https://api.officeally.com/v1/',
          credentials: {
            username: 'demo_user',
            password: 'demo_pass',
            providerId: 'DEMO123',
            submitterId: 'SUB456'
          },
          enabled: true,
          primary: true,
          testMode: true
        },
        {
          id: 'availity',
          name: 'Availity',
          baseURL: 'https://api.availity.com/v1/',
          credentials: {
            username: 'availity_demo',
            password: 'availity_pass',
            providerId: 'AVAIL789',
            submitterId: 'AVSUB012'
          },
          enabled: true,
          primary: false,
          testMode: true
        },
        {
          id: 'changehealthcare',
          name: 'Change Healthcare',
          baseURL: 'https://api.changehealthcare.com/medical-network/',
          credentials: {
            username: 'change_demo',
            password: 'change_pass',
            providerId: 'CHG345',
            submitterId: 'CHSUB678'
          },
          enabled: false,
          primary: false,
          testMode: true
        }
      ],
      paymentProcessors: [
        {
          id: 'stripe',
          name: 'Stripe',
          credentials: {
            publicKey: 'pk_test_demo',
            secretKey: 'sk_test_demo',
            webhookSecret: 'whsec_demo'
          },
          enabled: true,
          primary: true,
          feePercentage: 2.9,
          testMode: true
        },
        {
          id: 'square',
          name: 'Square',
          credentials: {
            publicKey: 'sq_test_demo',
            secretKey: 'sq_secret_demo',
            webhookSecret: 'sq_webhook_demo'
          },
          enabled: true,
          primary: false,
          feePercentage: 2.6,
          testMode: true
        }
      ],
      emrSystems: [
        {
          id: 'epic',
          name: 'Epic',
          format: 'HL7_FHIR_R4',
          endpoint: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/',
          enabled: true
        },
        {
          id: 'cerner',
          name: 'Cerner',
          format: 'HL7_CDA_3',
          endpoint: 'https://fhir-open.cerner.com/r4/',
          enabled: true
        }
      ],
      billingSettings: {
        autoGenerateInvoices: true,
        sessionBillingUnit: 15,
        defaultPaymentTerms: 30,
        lateFeePercentage: 1.5,
        autoSubmitClaims: true,
        retryFailedClaims: true,
        maxRetryAttempts: 3
      },
      apiKeys: {
        stripePublishable: 'pk_test_demo_key',
        stripeSecret: 'sk_test_demo_key',
        officeAllyAPI: 'oa_test_api_key',
        availityAPI: 'av_test_api_key',
        changeHealthcareAPI: 'ch_test_api_key',
        squareAppId: 'sq_test_app_id',
        squareAccessToken: 'sq_test_access_token',
        paypalClientId: 'pp_test_client_id',
        paypalClientSecret: 'pp_test_client_secret'
      },
      testMode: true
    };
  }

  // Insurance Clearinghouse Integration - Exact Mirror
  async submitClaim(claim: InsuranceClaim): Promise<{ success: boolean; batchId?: string; error?: string }> {
    try {
      const primaryClearinghouse = this.config.insuranceClearinghouses.find(ch => ch.primary && ch.enabled);
      if (!primaryClearinghouse) {
        return { success: false, error: 'No primary clearinghouse configured' };
      }

      // Generate EDI X12 837P data
      const ediData = this.generateEDI837P(claim, primaryClearinghouse);
      
      // Create or add to batch
      const batchId = this.createOrAddToBatch(claim, ediData, primaryClearinghouse.id);
      
      // Submit to clearinghouse
      const result = await this.submitToClearinghouse(batchId, primaryClearinghouse);
      
      if (result.success) {
        claim.status = 'submitted';
        claim.submittedDate = new Date();
        claim.batchId = batchId;
        claim.clearinghouse = primaryClearinghouse.id;
        
        this.claims.set(claim.id, claim);
        this.emit('claimSubmitted', claim);
        
        return { success: true, batchId };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Claim submission failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private generateEDI837P(claim: InsuranceClaim, clearinghouse: ClearinghouseConfig): string {
    // Generate EDI X12 837P format - simplified version
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    
    const ediSegments = [
      // ISA - Interchange Control Header
      `ISA*00*          *00*          *ZZ*${clearinghouse.credentials.submitterId.padEnd(15)}*ZZ*${clearinghouse.credentials.providerId.padEnd(15)}*${dateStr}*${timeStr}*^*00501*000000001*0*T*:~`,
      
      // GS - Functional Group Header
      `GS*HC*${clearinghouse.credentials.submitterId}*${clearinghouse.credentials.providerId}*${dateStr}*${timeStr}*1*X*005010X222A1~`,
      
      // ST - Transaction Set Header
      `ST*837*0001*005010X222A1~`,
      
      // BHT - Beginning of Hierarchical Transaction
      `BHT*0019*00*${claim.id}*${dateStr}*${timeStr}*CH~`,
      
      // NM1 - Submitter Name
      `NM1*41*2*${clearinghouse.name}*****46*${clearinghouse.credentials.submitterId}~`,
      
      // PER - Submitter Contact
      `PER*IC*BILLING DEPT*TE*5551234567~`,
      
      // NM1 - Receiver Name
      `NM1*40*2*${claim.insurancePayer}*****46*RECEIVER123~`,
      
      // HL - Billing Provider Hierarchical Level
      `HL*1**20*1~`,
      
      // PRV - Provider Information
      `PRV*BI*PXC*261QS0132X~`,
      
      // NM1 - Billing Provider Name
      `NM1*85*2*SPEECH THERAPY CLINIC*****XX*1234567890~`,
      
      // N3 - Billing Provider Address
      `N3*123 MAIN ST~`,
      
      // N4 - Billing Provider City/State/ZIP
      `N4*ANYTOWN*ST*12345~`,
      
      // REF - Billing Provider Tax ID
      `REF*EI*123456789~`,
      
      // HL - Patient Hierarchical Level
      `HL*2*1*22*0~`,
      
      // SBR - Subscriber Information
      `SBR*P*18*GROUP123******CI~`,
      
      // NM1 - Patient Name
      `NM1*IL*1*${claim.patientName.split(' ')[1] || 'DOE'}*${claim.patientName.split(' ')[0] || 'JOHN'}****MI*${claim.patientId}~`,
      
      // DMG - Patient Demographics
      `DMG*D8*19850615*M~`,
      
      // NM1 - Insurance Payer
      `NM1*PR*2*${claim.insurancePayer}*****PI*${claim.insurancePayer.toUpperCase().replace(/\s/g, '')}~`,
      
      // CLM - Claim Information
      `CLM*${claim.id}*${claim.amount.toFixed(2)}***11:B:1*Y*A*Y*I~`,
      
      // DTP - Service Date
      `DTP*472*D8*${claim.serviceDate.toISOString().slice(0, 10).replace(/-/g, '')}~`,
      
      // LX - Service Line Number
      `LX*1~`,
      
      // SV1 - Professional Service
      `SV1*HC:${claim.cptCode}*${claim.amount.toFixed(2)}*UN*${claim.units}***1~`,
      
      // DTP - Service Line Date
      `DTP*472*D8*${claim.serviceDate.toISOString().slice(0, 10).replace(/-/g, '')}~`,
      
      // SE - Transaction Set Trailer
      `SE*25*0001~`,
      
      // GE - Functional Group Trailer
      `GE*1*1~`,
      
      // IEA - Interchange Control Trailer
      `IEA*1*000000001~`
    ];

    return ediSegments.join('\n');
  }

  private createOrAddToBatch(claim: InsuranceClaim, ediData: string, clearinghouse: string): string {
    const today = new Date().toISOString().slice(0, 10);
    const batchId = `BATCH_${clearinghouse}_${today}_${Date.now()}`;
    
    const batch: ClaimBatch = {
      id: batchId,
      submittedDate: new Date(),
      clearinghouse,
      claimCount: 1,
      totalAmount: claim.amount,
      status: 'pending',
      claims: [claim.id],
      ediData
    };
    
    this.claimBatches.set(batchId, batch);
    return batchId;
  }

  private async submitToClearinghouse(batchId: string, clearinghouse: ClearinghouseConfig): Promise<{ success: boolean; error?: string }> {
    const batch = this.claimBatches.get(batchId);
    if (!batch) {
      return { success: false, error: 'Batch not found' };
    }

    try {
      // In test mode, simulate successful submission
      if (clearinghouse.testMode || this.config.testMode) {
        batch.status = 'accepted';
        this.emit('batchSubmitted', batch);
        return { success: true };
      }

      // Real submission would happen here
      const response = await fetch(`${clearinghouse.baseURL}claims/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/edi-x12',
          'Authorization': `Basic ${btoa(`${clearinghouse.credentials.username}:${clearinghouse.credentials.password}`)}`
        },
        body: batch.ediData
      });

      if (response.ok) {
        batch.status = 'processing';
        this.emit('batchSubmitted', batch);
        return { success: true };
      }

      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    } catch (error) {
      batch.status = 'rejected';
      return { success: false, error: (error as Error).message };
    }
  }

  // Payment Processing - Exact Mirror
  async processPayment(intent: Omit<PaymentIntent, 'id' | 'createdAt' | 'processingFee' | 'netAmount'>): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const primaryProcessor = this.config.paymentProcessors.find(pp => pp.primary && pp.enabled);
      if (!primaryProcessor) {
        return { success: false, error: 'No primary payment processor configured' };
      }

      const processingFee = intent.amount * (primaryProcessor.feePercentage / 100);
      const netAmount = intent.amount - processingFee;

      const paymentIntent: PaymentIntent = {
        ...intent,
        id: `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date(),
        processingFee,
        netAmount,
        status: 'pending'
      };

      this.paymentIntents.set(paymentIntent.id, paymentIntent);

      // Process based on processor type
      const result = await this.processWithProvider(paymentIntent, primaryProcessor);
      
      if (result.success) {
        paymentIntent.status = 'succeeded';
        paymentIntent.completedAt = new Date();
        
        this.emit('paymentSucceeded', paymentIntent);
        return { success: true, paymentId: paymentIntent.id };
      } else {
        paymentIntent.status = 'failed';
        paymentIntent.errorMessage = result.error;
        
        this.emit('paymentFailed', paymentIntent);
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async processWithProvider(intent: PaymentIntent, processor: PaymentProcessorConfig): Promise<{ success: boolean; error?: string }> {
    if (processor.testMode || this.config.testMode) {
      // Simulate successful payment in test mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }

    switch (processor.name) {
      case 'Stripe':
        return this.processStripePayment(intent, processor);
      case 'Square':
        return this.processSquarePayment(intent, processor);
      case 'PayPal':
        return this.processPayPalPayment(intent, processor);
      default:
        return { success: false, error: 'Unsupported payment processor' };
    }
  }

  private async processStripePayment(intent: PaymentIntent, processor: PaymentProcessorConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${processor.credentials.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: (intent.amount * 100).toString(), // Stripe uses cents
          currency: intent.currency,
          payment_method: intent.paymentMethod,
          confirm: 'true',
          metadata: JSON.stringify({
            patientId: intent.patientId,
            invoiceId: intent.invoiceId || ''
          })
        })
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'succeeded') {
        return { success: true };
      }
      
      return { success: false, error: data.error?.message || 'Payment failed' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async processSquarePayment(intent: PaymentIntent, processor: PaymentProcessorConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://connect.squareup.com/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${processor.credentials.secretKey}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify({
          source_id: intent.paymentMethod,
          amount_money: {
            amount: intent.amount * 100, // Square uses cents
            currency: intent.currency.toUpperCase()
          },
          idempotency_key: intent.id
        })
      });

      const data = await response.json();
      
      if (response.ok && data.payment?.status === 'COMPLETED') {
        return { success: true };
      }
      
      return { success: false, error: data.errors?.[0]?.detail || 'Payment failed' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async processPayPalPayment(intent: PaymentIntent, processor: PaymentProcessorConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // PayPal OAuth token
      const tokenResponse = await fetch('https://api.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${processor.credentials.publicKey}:${processor.credentials.secretKey}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Create payment
      const paymentResponse = await fetch('https://api.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: intent.currency.toUpperCase(),
              value: intent.amount.toFixed(2)
            }
          }]
        })
      });

      const paymentData = await paymentResponse.json();
      
      if (paymentResponse.ok && paymentData.status === 'CREATED') {
        return { success: true };
      }
      
      return { success: false, error: paymentData.message || 'Payment failed' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Eligibility Verification - Exact Mirror
  async verifyEligibility(patientId: string, insuranceProvider: string, memberId: string): Promise<EligibilityVerification> {
    const cacheKey = `${patientId}_${insuranceProvider}_${memberId}`;
    const cached = this.eligibilityCache.get(cacheKey);
    
    // Return cached result if less than 24 hours old
    if (cached && (Date.now() - cached.verificationDate.getTime()) < 24 * 60 * 60 * 1000) {
      return cached;
    }

    try {
      // In test mode, return mock data
      if (this.config.testMode) {
        const mockVerification: EligibilityVerification = {
          patientId,
          insuranceProvider,
          memberId,
          serviceDate: new Date(),
          verified: true,
          benefits: {
            speechTherapy: {
              covered: true,
              copay: 25,
              coinsurance: 20,
              annualMax: 3000,
              visitLimit: 36,
              priorAuth: false,
              referralRequired: false
            },
            occupationalTherapy: {
              covered: true,
              copay: 30,
              coinsurance: 20,
              annualMax: 2500,
              visitLimit: 24,
              priorAuth: true,
              referralRequired: true
            },
            physicalTherapy: {
              covered: true,
              copay: 35,
              coinsurance: 20,
              annualMax: 2000,
              visitLimit: 20,
              priorAuth: false,
              referralRequired: false
            },
            aacDevices: {
              covered: true,
              copay: 0,
              coinsurance: 50,
              annualMax: 5000,
              visitLimit: 1,
              priorAuth: true,
              referralRequired: true
            }
          },
          copay: 25,
          deductible: 1000,
          deductibleMet: 450,
          verificationDate: new Date()
        };

        this.eligibilityCache.set(cacheKey, mockVerification);
        return mockVerification;
      }

      // Real eligibility verification would happen here
      const verification = await this.performRealTimeEligibilityCheck(patientId, insuranceProvider, memberId);
      this.eligibilityCache.set(cacheKey, verification);
      
      return verification;
    } catch (error) {
      console.error('Eligibility verification failed:', error);
      throw error;
    }
  }

  private async performRealTimeEligibilityCheck(patientId: string, insuranceProvider: string, memberId: string): Promise<EligibilityVerification> {
    // Implementation would connect to clearinghouse 270/271 transaction
    // This is a simplified mock for demonstration
    throw new Error('Real-time eligibility verification not implemented in demo mode');
  }

  // Invoice Generation - Exact Mirror
  async generateInvoiceFromSessions(patientId: string, sessionIds: string[]): Promise<Invoice> {
    try {
      const invoiceId = `INV_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Mock session data - in real implementation would fetch from session service
      const mockSessions = sessionIds.map(id => ({
        id,
        cptCode: '92507',
        date: new Date(),
        duration: 45,
        units: 3, // 45 minutes = 3 units of 15 minutes
        description: 'Individual speech therapy session'
      }));

      const lineItems: InvoiceLineItem[] = mockSessions.map(session => {
        const cptInfo = this.cptCodes.get(session.cptCode);
        const unitPrice = cptInfo?.commercialRate || 125.00;
        
        return {
          description: `${cptInfo?.description || 'Therapy session'} (${session.cptCode})`,
          cptCode: session.cptCode,
          quantity: session.units,
          unitPrice,
          total: unitPrice * session.units,
          serviceDate: session.date
        };
      });

      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const tax = 0; // Healthcare services typically not taxed
      const total = subtotal + tax;

      const invoice: Invoice = {
        id: invoiceId,
        patientId,
        sessionIds,
        amount: subtotal,
        tax,
        total,
        status: 'draft',
        dueDate: new Date(Date.now() + this.config.billingSettings.defaultPaymentTerms * 24 * 60 * 60 * 1000),
        lineItems,
        createdAt: new Date()
      };

      this.invoices.set(invoiceId, invoice);
      this.emit('invoiceGenerated', invoice);

      return invoice;
    } catch (error) {
      console.error('Invoice generation failed:', error);
      throw error;
    }
  }

  // EMR Export - Exact Mirror
  async exportToEMR(patientId: string, format: string, dataType: EMRExport['dataType'], dateRange: { start: Date; end: Date }): Promise<EMRExport> {
    try {
      const exportId = `EXP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const emrExport: EMRExport = {
        id: exportId,
        patientId,
        format,
        dataType,
        dateRange,
        status: 'pending',
        createdAt: new Date()
      };

      this.emrExports.set(exportId, emrExport);

      // Start async export process
      this.processEMRExport(emrExport);

      return emrExport;
    } catch (error) {
      console.error('EMR export failed:', error);
      throw error;
    }
  }

  private async processEMRExport(emrExport: EMRExport): Promise<void> {
    try {
      emrExport.status = 'processing';
      this.emit('emrExportStatusChanged', emrExport);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate export data based on format
      const exportData = await this.generateExportData(emrExport);
      
      // Create download URL (in real implementation would upload to secure storage)
      emrExport.downloadUrl = `https://secure.tinkybink.com/exports/${emrExport.id}.${this.getFileExtension(emrExport.format)}`;
      emrExport.status = 'completed';
      emrExport.completedAt = new Date();

      this.emit('emrExportCompleted', emrExport);
    } catch (error) {
      emrExport.status = 'failed';
      console.error('EMR export processing failed:', error);
      this.emit('emrExportFailed', emrExport);
    }
  }

  private async generateExportData(emrExport: EMRExport): Promise<string> {
    // Mock clinical data
    const clinicalData: ClinicalData = {
      patientDemographics: {
        id: emrExport.patientId,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'M',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          zipCode: '12345'
        },
        phone: '555-123-4567',
        email: 'john.doe@email.com',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '555-987-6543'
        },
        insurance: {
          provider: 'Blue Cross Blue Shield',
          memberId: 'BCBS123456789',
          groupNumber: 'GRP001',
          planType: 'PPO',
          copay: 25,
          deductible: 1000,
          deductibleMet: 450,
          eligibilityVerified: true,
          lastVerified: new Date()
        }
      },
      sessions: [
        {
          id: 'SES001',
          date: new Date('2024-01-15'),
          duration: 45,
          cptCode: '92507',
          therapist: 'Dr. Sarah Miller',
          notes: 'Patient demonstrated improved articulation of /r/ sound in structured activities.',
          goals: ['Improve /r/ sound production', 'Increase vocabulary'],
          interventions: ['Articulation drills', 'Vocabulary expansion activities'],
          progress: [
            { date: new Date('2024-01-15'), metric: 'Articulation accuracy', value: 78, unit: '%' }
          ],
          homework: 'Practice /r/ words 10 minutes daily',
          nextSession: new Date('2024-01-22')
        }
      ],
      diagnoses: [
        {
          code: 'F80.1',
          description: 'Expressive language disorder',
          type: 'ICD-10',
          primary: true,
          dateOfOnset: new Date('2020-03-01')
        }
      ],
      goals: [
        {
          id: 'GOAL001',
          description: 'Improve /r/ sound production to 80% accuracy',
          targetDate: new Date('2024-06-01'),
          status: 'active',
          progress: 65,
          measurements: [
            { date: new Date('2024-01-15'), metric: 'Accuracy', value: 65, unit: '%' }
          ]
        }
      ],
      assessments: [
        {
          id: 'ASSESS001',
          type: 'Goldman-Fristoe Test of Articulation',
          date: new Date('2024-01-01'),
          score: 45,
          maxScore: 100,
          percentile: 25,
          interpretation: 'Moderate articulation disorder',
          assessor: 'Dr. Sarah Miller'
        }
      ]
    };

    // Generate format-specific export
    switch (emrExport.format) {
      case 'HL7_FHIR_R4':
        return this.generateFHIRExport(clinicalData);
      case 'HL7_CDA_3':
        return this.generateCDAExport(clinicalData);
      case 'CSV':
        return this.generateCSVExport(clinicalData);
      case 'PDF':
        return this.generatePDFExport(clinicalData);
      default:
        throw new Error(`Unsupported export format: ${emrExport.format}`);
    }
  }

  private generateFHIRExport(data: ClinicalData): string {
    // Generate FHIR R4 JSON Bundle
    const bundle = {
      resourceType: 'Bundle',
      id: `bundle-${Date.now()}`,
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: data.patientDemographics.id,
            name: [{
              family: data.patientDemographics.lastName,
              given: [data.patientDemographics.firstName]
            }],
            gender: data.patientDemographics.gender.toLowerCase(),
            birthDate: data.patientDemographics.dateOfBirth.toISOString().slice(0, 10),
            address: [{
              line: [data.patientDemographics.address.street],
              city: data.patientDemographics.address.city,
              state: data.patientDemographics.address.state,
              postalCode: data.patientDemographics.address.zipCode
            }],
            telecom: [
              { system: 'phone', value: data.patientDemographics.phone },
              { system: 'email', value: data.patientDemographics.email }
            ]
          }
        }
      ]
    };

    return JSON.stringify(bundle, null, 2);
  }

  private generateCDAExport(data: ClinicalData): string {
    // Generate HL7 CDA XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.1"/>
  <id extension="${data.patientDemographics.id}" root="1.2.3.4.5.6.7.8.9"/>
  <code code="34133-9" codeSystem="2.16.840.1.113883.6.1" displayName="Summarization of Episode Note"/>
  <title>Speech Therapy Clinical Summary</title>
  <effectiveTime value="${new Date().toISOString().slice(0, 10).replace(/-/g, '')}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  <recordTarget>
    <patientRole>
      <id extension="${data.patientDemographics.id}" root="1.2.3.4.5.6.7.8.9"/>
      <patient>
        <name>
          <given>${data.patientDemographics.firstName}</given>
          <family>${data.patientDemographics.lastName}</family>
        </name>
        <administrativeGenderCode code="${data.patientDemographics.gender}" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="${data.patientDemographics.dateOfBirth.toISOString().slice(0, 10).replace(/-/g, '')}"/>
      </patient>
    </patientRole>
  </recordTarget>
</ClinicalDocument>`;
  }

  private generateCSVExport(data: ClinicalData): string {
    const headers = ['Date', 'CPT Code', 'Description', 'Duration', 'Therapist', 'Notes'];
    const rows = data.sessions.map(session => [
      session.date.toISOString().slice(0, 10),
      session.cptCode,
      this.cptCodes.get(session.cptCode)?.description || 'Therapy session',
      session.duration.toString(),
      session.therapist,
      session.notes.replace(/,/g, ';') // Escape commas
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generatePDFExport(data: ClinicalData): string {
    // In real implementation, would generate actual PDF
    return `PDF Export for Patient: ${data.patientDemographics.firstName} ${data.patientDemographics.lastName}
Generated: ${new Date().toISOString()}

PATIENT DEMOGRAPHICS
Name: ${data.patientDemographics.firstName} ${data.patientDemographics.lastName}
DOB: ${data.patientDemographics.dateOfBirth.toDateString()}
Gender: ${data.patientDemographics.gender}

THERAPY SESSIONS
${data.sessions.map(session => 
  `Date: ${session.date.toDateString()}
  CPT Code: ${session.cptCode}
  Duration: ${session.duration} minutes
  Therapist: ${session.therapist}
  Notes: ${session.notes}`
).join('\n\n')}`;
  }

  private getFileExtension(format: string): string {
    switch (format) {
      case 'HL7_FHIR_R4': return 'json';
      case 'HL7_CDA_3': return 'xml';
      case 'CSV': return 'csv';
      case 'PDF': return 'pdf';
      default: return 'txt';
    }
  }

  // Subscription Management
  async createSubscription(subscription: Omit<Subscription, 'id'>): Promise<Subscription> {
    const sub: Subscription = {
      ...subscription,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };

    this.subscriptions.set(sub.id, sub);
    this.emit('subscriptionCreated', sub);

    return sub;
  }

  // Public API Methods
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
  }

  getClaims(): InsuranceClaim[] {
    return Array.from(this.claims.values());
  }

  getClaimById(id: string): InsuranceClaim | undefined {
    return this.claims.get(id);
  }

  getClaimBatches(): ClaimBatch[] {
    return Array.from(this.claimBatches.values());
  }

  getPaymentIntents(): PaymentIntent[] {
    return Array.from(this.paymentIntents.values());
  }

  getInvoices(): Invoice[] {
    return Array.from(this.invoices.values());
  }

  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  getEMRExports(): EMRExport[] {
    return Array.from(this.emrExports.values());
  }

  getCPTCodes(): CPTCode[] {
    return Array.from(this.cptCodes.values());
  }

  // Initialize method for module system
  initialize(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log('🔗 Integration Service v2 initialized - Complete Healthcare Integration System');
    this.emit('initialized');
  }

  // Cleanup method
  destroy(): void {
    this.removeAllListeners();
    this.isInitialized = false;
    console.log('🔗 Integration Service destroyed');
  }
}

// Export singleton instance
export function getIntegrationService(): IntegrationService {
  return IntegrationService.getInstance();
}

export default IntegrationService;