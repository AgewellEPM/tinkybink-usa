// Multi-tenant Management Service - Module 56 (v2 - Mirror of Original Clinic System)
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getAuditService } from './audit-service';

// Exact mirror of the original AuthenticationSystem.js + WhiteLabelConfig.js structures
interface ClinicConfig {
  id: string;
  name: string;
  domain: string;
  type: 'speech_therapy' | 'occupational_therapy' | 'physical_therapy' | 'multi_discipline' | 'educational';
  status: 'active' | 'suspended' | 'trial' | 'pending' | 'setup';
  createdAt: Date;
  lastActive: Date;
  branding: ClinicBranding;
  settings: ClinicSettings;
  limits: ClinicLimits;
  features: ClinicFeatures;
  billing: ClinicBilling;
  compliance: ComplianceSettings;
  whiteLabelConfig: WhiteLabelConfig;
  patients: ClinicPatient[];
  therapists: ClinicTherapist[];
  sessions: ClinicSession[];
}

interface ClinicBranding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  organizationName: string;
  customDomain?: string;
  favicon?: string;
  customCSS?: string;
  removeWatermark: boolean;
  customSplash: boolean;
  customOnboarding: boolean;
  showPoweredBy: boolean;
}

interface WhiteLabelConfig {
  enabled: boolean;
  brandName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string | null;
  customEmails: boolean;
  removeWatermark: boolean;
  customCSS: string;
  features: {
    showPoweredBy: boolean;
    customSplash: boolean;
    customOnboarding: boolean;
  };
  dnsRecords?: DNSRecord[];
  sslConfigured: boolean;
}

interface DNSRecord {
  type: 'CNAME' | 'A' | 'TXT';
  name: string;
  value: string;
  ttl: number;
}

interface ClinicSettings {
  sessionDuration: number; // Default 30 minutes
  billingEnabled: boolean;
  telehealth: boolean;
  autoBackup: boolean;
  dataRetentionDays: number;
  allowPatientPortal: boolean;
  requireMFA: boolean;
  sessionTimeout: number;
  ipWhitelist?: string[];
  allowedDevices?: string[];
  workingHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  timezone: string;
  language: string;
  currency: string;
}

interface ClinicLimits {
  maxTherapists: number;
  maxPatients: number;
  maxSessions: number;
  storageQuotaGB: number;
  monthlyAPICallLimit: number;
  concurrentSessions: number;
  reportGenerationLimit: number;
  backupRetentionDays: number;
}

interface ClinicFeatures {
  tier: 'basic' | 'professional' | 'enterprise' | 'unlimited';
  billingIntegration: boolean;
  insuranceAPI: boolean;
  telehealth: boolean;
  whiteLabeling: boolean;
  apiAccess: boolean;
  customReports: boolean;
  prioritySupport: boolean;
  singleSignOn: boolean;
  auditLogs: boolean;
  dataExport: boolean;
  customIntegrations: boolean;
  collaborationTools: boolean;
  patientPortal: boolean;
}

interface ClinicBilling {
  plan: 'trial' | 'basic' | 'professional' | 'enterprise' | 'custom';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  paymentMethod?: string;
  nextBillingDate: Date;
  trialEndsAt?: Date;
  invoices: ClinicInvoice[];
  subscriptionId: string;
  stripeCustomerId?: string;
  taxId?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface ClinicInvoice {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  generatedAt: Date;
  paidAt?: Date;
  dueDate: Date;
  items: InvoiceItem[];
  downloadUrl?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  periodStart: Date;
  periodEnd: Date;
}

interface ComplianceSettings {
  hipaaRequired: boolean;
  ferpaRequired: boolean;
  gdprRequired: boolean;
  dataRetentionDays: number;
  auditLogRetention: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptionRequired: boolean;
  accessLogEnabled: boolean;
  dataAnonymization: boolean;
  consentTracking: boolean;
  breachNotification: boolean;
}

interface ClinicPatient {
  id: string;
  name: string;
  dob: string;
  insurance: string;
  insuranceId: string;
  diagnosis: string;
  therapist: string;
  status: 'active' | 'inactive' | 'discharged';
  sessionsPerWeek: number;
  copay: number;
  guardianName?: string;
  guardianEmail?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
  goals?: PatientGoal[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientGoal {
  id: string;
  description: string;
  targetDate: Date;
  status: 'active' | 'achieved' | 'modified' | 'discontinued';
  progress: number; // 0-100
  notes?: string;
  measurableOutcome: string;
}

interface ClinicTherapist {
  id: string;
  name: string;
  email: string;
  role: 'therapist' | 'senior_therapist' | 'supervisor' | 'admin';
  license: string;
  specialties: string[];
  caseloadLimit: number;
  currentCaseload: number;
  schedule: TherapistSchedule;
  credentials: {
    degree: string;
    certifications: string[];
    licenseExpiry: Date;
    continuingEducation: CECredit[];
  };
  status: 'active' | 'inactive' | 'leave' | 'terminated';
  hireDate: Date;
  lastLogin?: Date;
}

interface TherapistSchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  available: boolean;
  location?: 'clinic' | 'telehealth' | 'home_visit';
}

interface CECredit {
  title: string;
  hours: number;
  date: Date;
  provider: string;
  certificateUrl?: string;
}

interface ClinicSession {
  id: string;
  patientId: string;
  therapistId: string;
  date: Date;
  duration: number; // minutes
  type: 'individual' | 'group' | 'family' | 'assessment' | 'consultation';
  location: 'clinic' | 'home' | 'school' | 'telehealth';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  goals: string[];
  materials: string[];
  billableUnits: number;
  insuranceClaim?: {
    claimId: string;
    procedureCode: string;
    submitted: boolean;
    status: 'pending' | 'approved' | 'denied';
  };
  outcome: {
    progress: number;
    nextSteps: string[];
    homeRecommendations?: string[];
  };
  attachments?: SessionAttachment[];
}

interface SessionAttachment {
  id: string;
  filename: string;
  type: 'photo' | 'video' | 'document' | 'assessment';
  url: string;
  uploadedAt: Date;
  size: number;
}

interface ClinicUser {
  id: string;
  clinicId: string;
  email: string;
  role: 'therapist' | 'admin' | 'parent' | 'supervisor';
  name: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  permissions: string[];
  profile: UserProfile;
  mfaEnabled: boolean;
  sessions: UserSession[];
}

interface UserSession {
  token: string;
  clinicId: string;
  expiresAt: number;
  createdAt: number;
  ipAddress: string;
  userAgent: string;
  lastActivity: number;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  title?: string;
  phone?: string;
  avatar?: string;
  preferences: Record<string, unknown>;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    types: string[];
  };
}

export class MultiTenantService {
  private static instance: MultiTenantService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private auditService = getAuditService();
  
  private clinics: Map<string, ClinicConfig> = new Map();
  private currentClinic: ClinicConfig | null = null;
  private clinicUsers: Map<string, ClinicUser[]> = new Map();
  private userSessions: Map<string, UserSession> = new Map();
  
  private sessionCleanupInterval: NodeJS.Timeout | null = null;
  private backupInterval: NodeJS.Timeout | null = null;
  private complianceCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultClinic();
  }

  static getInstance(): MultiTenantService {
    if (!MultiTenantService.instance) {
      MultiTenantService.instance = new MultiTenantService();
    }
    return MultiTenantService.instance;
  }

  initialize(): void {
    console.log('MultiTenantService initializing...');
    this.loadClinics();
    this.detectCurrentClinic();
    this.setupEventListeners();
    this.startSessionCleanup();
    this.startBackupScheduler();
    this.startComplianceMonitoring();
    console.log('MultiTenantService initialized');
  }

  private initializeDefaultClinic(): void {
    const defaultClinic: ClinicConfig = {
      id: 'CLINIC001',
      name: 'Sample Speech Therapy Clinic',
      domain: 'localhost',
      type: 'speech_therapy',
      status: 'active',
      createdAt: new Date(),
      lastActive: new Date(),
      branding: {
        logoUrl: '/assets/clinic-logo.png',
        primaryColor: '#7b3ff2',
        secondaryColor: '#ff006e',
        organizationName: 'Speech Therapy Plus',
        favicon: '/assets/favicon.ico',
        removeWatermark: false,
        customSplash: false,
        customOnboarding: false,
        showPoweredBy: true
      },
      settings: {
        sessionDuration: 30,
        billingEnabled: true,
        telehealth: true,
        autoBackup: true,
        dataRetentionDays: 2555, // 7 years for healthcare
        allowPatientPortal: true,
        requireMFA: false,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        workingHours: {
          monday: { start: '08:00', end: '17:00', enabled: true },
          tuesday: { start: '08:00', end: '17:00', enabled: true },
          wednesday: { start: '08:00', end: '17:00', enabled: true },
          thursday: { start: '08:00', end: '17:00', enabled: true },
          friday: { start: '08:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '13:00', enabled: false },
          sunday: { start: '09:00', end: '13:00', enabled: false }
        },
        timezone: 'America/New_York',
        language: 'en-US',
        currency: 'USD'
      },
      limits: {
        maxTherapists: 10,
        maxPatients: 500,
        maxSessions: 10000,
        storageQuotaGB: 100,
        monthlyAPICallLimit: 50000,
        concurrentSessions: 50,
        reportGenerationLimit: 1000,
        backupRetentionDays: 90
      },
      features: {
        tier: 'professional',
        billingIntegration: true,
        insuranceAPI: true,
        telehealth: true,
        whiteLabeling: false,
        apiAccess: true,
        customReports: true,
        prioritySupport: false,
        singleSignOn: false,
        auditLogs: true,
        dataExport: true,
        customIntegrations: false,
        collaborationTools: true,
        patientPortal: true
      },
      billing: {
        plan: 'professional',
        billingCycle: 'monthly',
        amount: 299,
        currency: 'USD',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        invoices: [],
        subscriptionId: 'sub_default_001',
        billingAddress: {
          street: '123 Healthcare Ave',
          city: 'Medical City',
          state: 'CA',
          zip: '90210',
          country: 'US'
        }
      },
      compliance: {
        hipaaRequired: true,
        ferpaRequired: false,
        gdprRequired: false,
        dataRetentionDays: 2555,
        auditLogRetention: 90,
        backupFrequency: 'daily',
        encryptionRequired: true,
        accessLogEnabled: true,
        dataAnonymization: false,
        consentTracking: true,
        breachNotification: true
      },
      whiteLabelConfig: {
        enabled: false,
        brandName: 'TinkyBink AAC',
        logo: '/assets/logo.png',
        primaryColor: '#4A90E2',
        secondaryColor: '#F5A623',
        customDomain: null,
        customEmails: false,
        removeWatermark: false,
        customCSS: '',
        features: {
          showPoweredBy: true,
          customSplash: false,
          customOnboarding: false
        },
        sslConfigured: false
      },
      patients: this.generateDemoPatients(),
      therapists: this.generateDemoTherapists(),
      sessions: []
    };

    this.clinics.set('CLINIC001', defaultClinic);
  }

  private generateDemoPatients(): ClinicPatient[] {
    return [
      {
        id: 'P001',
        name: 'Emily Johnson',
        dob: '2015-03-15',
        insurance: 'Blue Cross Blue Shield',
        insuranceId: 'BCBS123456789',
        diagnosis: 'F84.0 - Autism Spectrum Disorder',
        therapist: 'Dr. Sarah Miller',
        status: 'active',
        sessionsPerWeek: 3,
        copay: 25,
        guardianName: 'Jennifer Johnson',
        guardianEmail: 'jennifer.johnson@email.com',
        emergencyContact: {
          name: 'Michael Johnson',
          phone: '555-0123',
          relationship: 'Father'
        },
        goals: [
          {
            id: 'G001',
            description: 'Increase functional communication using AAC device',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            status: 'active',
            progress: 65,
            measurableOutcome: 'Use 20+ core vocabulary words independently'
          }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      {
        id: 'P002',
        name: 'Michael Chen',
        dob: '2016-07-22',
        insurance: 'Aetna',
        insuranceId: 'AET987654321',
        diagnosis: 'F80.1 - Expressive Language Disorder',
        therapist: 'Dr. Sarah Miller',
        status: 'active',
        sessionsPerWeek: 2,
        copay: 30,
        guardianName: 'Lisa Chen',
        guardianEmail: 'lisa.chen@email.com',
        goals: [
          {
            id: 'G002',
            description: 'Improve sentence structure and grammar',
            targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            status: 'active',
            progress: 45,
            measurableOutcome: 'Produce 4-5 word sentences with correct grammar'
          }
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date()
      }
    ];
  }

  private generateDemoTherapists(): ClinicTherapist[] {
    return [
      {
        id: 'T001',
        name: 'Dr. Sarah Miller',
        email: 'sarah.miller@clinic.com',
        role: 'senior_therapist',
        license: 'SLP-12345',
        specialties: ['Autism Spectrum Disorders', 'AAC', 'Language Disorders'],
        caseloadLimit: 40,
        currentCaseload: 25,
        schedule: {
          monday: [
            { start: '08:00', end: '12:00', available: true, location: 'clinic' },
            { start: '13:00', end: '17:00', available: true, location: 'clinic' }
          ],
          tuesday: [
            { start: '08:00', end: '17:00', available: true, location: 'clinic' }
          ],
          wednesday: [
            { start: '08:00', end: '17:00', available: true, location: 'telehealth' }
          ],
          thursday: [
            { start: '08:00', end: '17:00', available: true, location: 'clinic' }
          ],
          friday: [
            { start: '08:00', end: '17:00', available: true, location: 'clinic' }
          ],
          saturday: [],
          sunday: []
        },
        credentials: {
          degree: 'M.S. Speech-Language Pathology',
          certifications: ['CCC-SLP', 'BCBA'],
          licenseExpiry: new Date('2025-12-31'),
          continuingEducation: [
            {
              title: 'Advanced AAC Strategies',
              hours: 12,
              date: new Date('2024-03-15'),
              provider: 'ASHA'
            }
          ]
        },
        status: 'active',
        hireDate: new Date('2020-01-15'),
        lastLogin: new Date()
      }
    ];
  }

  private setupEventListeners(): void {
    // Listen for clinic switching
    window.addEventListener('clinicSwitch', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.switchClinic(customEvent.detail?.clinicId);
    });

    // Listen for billing events
    window.addEventListener('billingEvent', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleBillingEvent(customEvent.detail);
    });

    // Listen for patient management events
    window.addEventListener('patientEvent', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handlePatientEvent(customEvent.detail);
    });
  }

  // Core Clinic Management (Mirror of original switchClinic functionality)
  async switchClinic(clinicId: string): Promise<{ success: boolean; error?: string }> {
    const clinic = this.clinics.get(clinicId);
    if (!clinic) {
      return { success: false, error: 'Clinic not found' };
    }

    if (clinic.status !== 'active') {
      return { success: false, error: 'Clinic is not active' };
    }

    // Check user permissions
    const currentUser = this.getCurrentUser();
    if (!currentUser || !this.hasPermission(currentUser, 'switch_clinics')) {
      return { success: false, error: 'Permission denied' };
    }

    this.currentClinic = clinic;
    clinic.lastActive = new Date();

    // Load clinic-specific data
    await this.loadClinicData(clinicId);

    // Apply clinic branding
    this.applyClinicBranding(clinic);

    // Update user session
    if (currentUser) {
      currentUser.clinicId = clinicId;
      this.saveUserSession(currentUser);
    }

    // Notify other services about clinic switch
    window.dispatchEvent(new CustomEvent('clinicChanged', {
      detail: { clinic, previousClinic: this.currentClinic }
    }));

    this.auditService.logAction('clinic_switched', {
      clinicId,
      clinicName: clinic.name,
      userId: currentUser?.id
    });

    return { success: true };
  }

  private async loadClinicData(clinicId: string): Promise<void> {
    // Load clinic-specific patients, sessions, etc.
    const clinicData = this.dataService.getData(`clinic_${clinicId}_data`) || {};
    
    const clinic = this.clinics.get(clinicId);
    if (clinic && clinicData.patients) {
      clinic.patients = clinicData.patients;
      clinic.sessions = clinicData.sessions || [];
    }
  }

  private applyClinicBranding(clinic: ClinicConfig): void {
    // Apply clinic branding (mirror of original applyBranding)
    const branding = clinic.branding;
    
    // Update logos
    document.querySelectorAll('.logo').forEach(logo => {
      if (logo instanceof HTMLImageElement) {
        logo.src = branding.logoUrl;
      }
    });

    // Update brand name
    document.querySelectorAll('.brand-name').forEach(element => {
      element.textContent = branding.organizationName;
    });

    // Update colors
    const style = document.createElement('style');
    style.id = 'clinic-branding';
    
    // Remove existing branding
    const existingStyle = document.getElementById('clinic-branding');
    if (existingStyle) {
      existingStyle.remove();
    }

    style.textContent = `
      :root {
        --primary-color: ${branding.primaryColor};
        --secondary-color: ${branding.secondaryColor};
      }
      
      .btn-primary {
        background-color: ${branding.primaryColor};
      }
      
      .btn-secondary {
        background-color: ${branding.secondaryColor};
      }
      
      .header {
        background: linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor});
      }
      
      ${branding.customCSS || ''}
    `;
    document.head.appendChild(style);

    // Update title
    document.title = branding.organizationName;

    // Update favicon if specified
    if (branding.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.favicon;
      }
    }

    // Hide/show powered by
    const poweredBy = document.querySelector('.powered-by');
    if (poweredBy) {
      (poweredBy as HTMLElement).style.display = branding.showPoweredBy ? '' : 'none';
    }
  }

  // White Label Configuration (Mirror of WhiteLabelConfig.js)
  async updateWhiteLabeling(clinicId: string, config: Partial<WhiteLabelConfig>): Promise<void> {
    const clinic = this.clinics.get(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Validate subscription allows white labeling
    if (!clinic.features.whiteLabeling) {
      throw new Error('White labeling requires Professional or Enterprise plan');
    }

    clinic.whiteLabelConfig = { ...clinic.whiteLabelConfig, ...config };

    // Apply branding immediately if this is the current clinic
    if (this.currentClinic?.id === clinicId) {
      this.applyWhiteLabeling(clinic.whiteLabelConfig);
    }

    // Save configuration
    this.saveClinics();

    this.auditService.logAction('white_label_updated', {
      clinicId,
      changes: Object.keys(config)
    });
  }

  private applyWhiteLabeling(config: WhiteLabelConfig): void {
    if (!config.enabled) return;

    // Update all branding elements
    document.querySelectorAll('.logo').forEach(logo => {
      if (logo instanceof HTMLImageElement) {
        logo.src = config.logo;
      }
    });

    document.querySelectorAll('.brand-name').forEach(element => {
      element.textContent = config.brandName;
    });

    // Apply custom styling
    const style = document.createElement('style');
    style.id = 'white-label-branding';
    
    const existingStyle = document.getElementById('white-label-branding');
    if (existingStyle) {
      existingStyle.remove();
    }

    style.textContent = `
      :root {
        --primary-color: ${config.primaryColor};
        --secondary-color: ${config.secondaryColor};
      }
      
      .btn-primary {
        background-color: ${config.primaryColor};
      }
      
      .btn-secondary {
        background-color: ${config.secondaryColor};
      }
      
      ${config.customCSS}
    `;
    document.head.appendChild(style);

    document.title = config.brandName;

    // Hide/show powered by
    const poweredBy = document.querySelector('.powered-by');
    if (poweredBy) {
      (poweredBy as HTMLElement).style.display = config.features.showPoweredBy ? '' : 'none';
    }
  }

  // Domain Configuration (Mirror of configureDomain from original)
  async configureDomain(clinicId: string, domain: string): Promise<{ verified: boolean; dnsRecords: DNSRecord[] }> {
    const clinic = this.clinics.get(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Enterprise only feature
    if (clinic.features.tier !== 'enterprise') {
      throw new Error('Custom domains require Enterprise plan');
    }

    const dnsRecords = this.generateDNSRecords(domain);
    
    // Verify domain ownership
    const verified = await this.verifyDomain(domain);
    
    if (verified) {
      // Configure SSL
      await this.configureSSL(domain);
      
      // Update routing
      await this.updateRouting(domain);
      
      clinic.whiteLabelConfig.customDomain = domain;
      clinic.whiteLabelConfig.sslConfigured = true;
      clinic.whiteLabelConfig.dnsRecords = dnsRecords;
    }

    this.saveClinics();

    return { verified, dnsRecords };
  }

  private generateDNSRecords(domain: string): DNSRecord[] {
    return [
      {
        type: 'CNAME',
        name: domain,
        value: 'app.tinkybink.com',
        ttl: 300
      },
      {
        type: 'TXT',
        name: `_tinkybink-verification.${domain}`,
        value: `tinkybink-site-verification=${this.generateVerificationToken()}`,
        ttl: 300
      }
    ];
  }

  private generateVerificationToken(): string {
    return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
  }

  private async verifyDomain(domain: string): Promise<boolean> {
    try {
      // In production, this would make actual DNS queries
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Math.random() > 0.3; // 70% success rate for demo
    } catch (error) {
      return false;
    }
  }

  private async configureSSL(domain: string): Promise<void> {
    // In production, this would configure SSL certificates
    console.log(`Configuring SSL for ${domain}`);
  }

  private async updateRouting(domain: string): Promise<void> {
    // In production, this would update routing tables
    console.log(`Updating routing for ${domain}`);
  }

  // Patient Management (Mirror of PatientService from original)
  async addPatient(clinicId: string, patient: Omit<ClinicPatient, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClinicPatient> {
    const clinic = this.clinics.get(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Check patient limits
    if (clinic.patients.length >= clinic.limits.maxPatients) {
      throw new Error(`Patient limit (${clinic.limits.maxPatients}) exceeded`);
    }

    const newPatient: ClinicPatient = {
      ...patient,
      id: `P${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    clinic.patients.push(newPatient);
    this.saveClinics();

    this.auditService.logAction('patient_added', {
      clinicId,
      patientId: newPatient.id,
      patientName: newPatient.name
    });

    return newPatient;
  }

  // Session Management
  async createSession(clinicId: string, sessionData: Omit<ClinicSession, 'id'>): Promise<ClinicSession> {
    const clinic = this.clinics.get(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    const session: ClinicSession = {
      ...sessionData,
      id: `S${Date.now()}`
    };

    clinic.sessions.push(session);
    this.saveClinics();

    // Track analytics
    this.analyticsService.trackEvent('session_created', {
      clinicId,
      sessionType: session.type,
      location: session.location
    });

    return session;
  }

  // Billing Integration (Mirror of BillingInsuranceManager from original)
  async processInsuranceClaim(clinicId: string, sessionId: string): Promise<{ success: boolean; claimId?: string; error?: string }> {
    const clinic = this.clinics.get(clinicId);
    if (!clinic || !clinic.features.insuranceAPI) {
      return { success: false, error: 'Insurance API not available' };
    }

    const session = clinic.sessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const patient = clinic.patients.find(p => p.id === session.patientId);
    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    try {
      // Simulate insurance claim submission
      const claimId = `CLM${Date.now()}`;
      
      session.insuranceClaim = {
        claimId,
        procedureCode: this.getProcedureCode(session.type),
        submitted: true,
        status: 'pending'
      };

      this.saveClinics();

      this.auditService.logAction('insurance_claim_submitted', {
        clinicId,
        sessionId,
        claimId,
        patientId: patient.id
      });

      return { success: true, claimId };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private getProcedureCode(sessionType: string): string {
    const codes = {
      'individual': '97153',
      'group': '97154',
      'family': '97155',
      'assessment': '97151'
    };
    return codes[sessionType as keyof typeof codes] || '97153';
  }

  // User Management & Sessions
  private getCurrentUser(): ClinicUser | null {
    const sessionToken = localStorage.getItem('tinkybink_session_token');
    if (!sessionToken) return null;

    const session = this.userSessions.get(sessionToken);
    if (!session || session.expiresAt < Date.now()) {
      this.userSessions.delete(sessionToken);
      localStorage.removeItem('tinkybink_session_token');
      return null;
    }

    // Find user in clinic users
    const clinicUsers = this.clinicUsers.get(session.clinicId) || [];
    return clinicUsers.find(user => user.id === sessionToken.split('_')[0]) || null;
  }

  private hasPermission(user: ClinicUser, permission: string): boolean {
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  }

  private saveUserSession(user: ClinicUser): void {
    const sessionToken = `${user.id}_${Date.now()}`;
    const session: UserSession = {
      token: sessionToken,
      clinicId: user.clinicId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      createdAt: Date.now(),
      ipAddress: '127.0.0.1', // Would get from request in production
      userAgent: navigator.userAgent,
      lastActivity: Date.now()
    };

    this.userSessions.set(sessionToken, session);
    localStorage.setItem('tinkybink_session_token', sessionToken);
  }

  // Background Tasks
  private startSessionCleanup(): void {
    this.sessionCleanupInterval = setInterval(() => {
      const now = Date.now();
      this.userSessions.forEach((session, token) => {
        if (session.expiresAt < now) {
          this.userSessions.delete(token);
        }
      });
    }, 60 * 60 * 1000); // Every hour
  }

  private startBackupScheduler(): void {
    this.backupInterval = setInterval(() => {
      this.clinics.forEach((clinic, clinicId) => {
        if (clinic.settings.autoBackup) {
          this.createBackup(clinicId);
        }
      });
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async createBackup(clinicId: string): Promise<void> {
    const clinic = this.clinics.get(clinicId);
    if (!clinic) return;

    const backupData = {
      clinic,
      timestamp: new Date(),
      version: '2.0'
    };

    // Store backup
    this.dataService.setData(`backup_${clinicId}_${Date.now()}`, backupData);

    this.auditService.logAction('backup_created', {
      clinicId,
      backupSize: JSON.stringify(backupData).length
    });
  }

  private startComplianceMonitoring(): void {
    this.complianceCheckInterval = setInterval(() => {
      this.clinics.forEach((clinic, clinicId) => {
        this.checkCompliance(clinicId);
      });
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private checkCompliance(clinicId: string): void {
    const clinic = this.clinics.get(clinicId);
    if (!clinic) return;

    const compliance = clinic.compliance;
    const issues: string[] = [];

    // Check data retention
    if (compliance.dataRetentionDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - compliance.dataRetentionDays);
      
      // Check for old data
      const oldSessions = clinic.sessions.filter(s => s.date < cutoffDate);
      if (oldSessions.length > 0) {
        issues.push(`${oldSessions.length} sessions exceed data retention policy`);
      }
    }

    // Check backup compliance
    if (compliance.backupFrequency) {
      const lastBackup = this.dataService.getData(`last_backup_${clinicId}`);
      if (!lastBackup) {
        issues.push('No backup found');
      } else {
        const backupAge = Date.now() - new Date(lastBackup).getTime();
        const maxAge = this.getBackupMaxAge(compliance.backupFrequency);
        if (backupAge > maxAge) {
          issues.push('Backup overdue');
        }
      }
    }

    if (issues.length > 0) {
      this.auditService.logAction('compliance_violation', {
        clinicId,
        issues
      });

      window.dispatchEvent(new CustomEvent('complianceIssues', {
        detail: { clinicId, issues }
      }));
    }
  }

  private getBackupMaxAge(frequency: ComplianceSettings['backupFrequency']): number {
    const frequencies = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };
    return frequencies[frequency];
  }

  private detectCurrentClinic(): void {
    // Try to detect clinic from domain, URL parameter, or saved session
    const hostname = window.location.hostname;
    const searchParams = new URLSearchParams(window.location.search);
    const clinicParam = searchParams.get('clinic');

    let clinicId = 'CLINIC001'; // Default

    if (clinicParam) {
      clinicId = clinicParam;
    } else {
      // Check for custom domain
      const clinic = Array.from(this.clinics.values()).find(c => 
        c.whiteLabelConfig.customDomain === hostname
      );
      if (clinic) {
        clinicId = clinic.id;
      }
    }

    try {
      this.switchClinic(clinicId);
    } catch (error) {
      console.warn('Failed to switch to detected clinic, using default:', error);
      this.switchClinic('CLINIC001');
    }
  }

  // Event Handlers
  private handleBillingEvent(detail: unknown): void {
    console.log('Billing event received:', detail);
  }

  private handlePatientEvent(detail: unknown): void {
    console.log('Patient event received:', detail);
  }

  // Data Persistence
  private loadClinics(): void {
    const saved = this.dataService.getData('clinics');
    if (saved) {
      Object.entries(saved).forEach(([id, data]) => {
        const clinic = data as ClinicConfig;
        // Convert date strings back to Date objects
        clinic.createdAt = new Date(clinic.createdAt);
        clinic.lastActive = new Date(clinic.lastActive);
        clinic.billing.nextBillingDate = new Date(clinic.billing.nextBillingDate);
        if (clinic.billing.trialEndsAt) {
          clinic.billing.trialEndsAt = new Date(clinic.billing.trialEndsAt);
        }
        
        this.clinics.set(id, clinic);
      });
    }
  }

  private saveClinics(): void {
    const clinicData: Record<string, ClinicConfig> = {};
    this.clinics.forEach((clinic, id) => {
      clinicData[id] = clinic;
    });
    this.dataService.setData('clinics', clinicData);
  }

  // Public API
  getCurrentClinic(): ClinicConfig | null {
    return this.currentClinic;
  }

  getClinic(clinicId: string): ClinicConfig | undefined {
    return this.clinics.get(clinicId);
  }

  getAllClinics(): ClinicConfig[] {
    return Array.from(this.clinics.values());
  }

  getClinicPatients(clinicId: string): ClinicPatient[] {
    const clinic = this.clinics.get(clinicId);
    return clinic?.patients || [];
  }

  getClinicTherapists(clinicId: string): ClinicTherapist[] {
    const clinic = this.clinics.get(clinicId);
    return clinic?.therapists || [];
  }

  getClinicSessions(clinicId: string): ClinicSession[] {
    const clinic = this.clinics.get(clinicId);
    return clinic?.sessions || [];
  }

  // Cleanup
  destroy(): void {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    if (this.complianceCheckInterval) {
      clearInterval(this.complianceCheckInterval);
    }
    
    this.saveClinics();
  }
}

export function getMultiTenantService(): MultiTenantService {
  return MultiTenantService.getInstance();
}