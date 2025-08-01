// Medical Billing Service for Medicare/Medicaid claims
export class BillingService {
  private cptCodes: Map<string, CPTCode> = new Map();
  private hcpcsCodes: Map<string, HCPCSCode> = new Map();
  private sessions: BillingSession[] = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupBillingCodes();
    this.loadFromStorage();
    console.log('Billing Service initialized with Medicare/Medicaid codes');
  }

  private setupBillingCodes(): void {
    // Speech-Language Pathology CPT Codes
    this.cptCodes.set('92507', {
      code: '92507',
      description: 'Treatment of speech, language, voice, communication, and/or auditory processing disorder; individual',
      category: 'SLP',
      medicareRate: 85.50,
      medicaidRate: 78.25,
      duration: 15,
      modifiers: ['59', 'GP', 'GN']
    });
    
    this.cptCodes.set('92508', {
      code: '92508',
      description: 'Treatment of speech, language, voice, communication, and/or auditory processing disorder; group',
      category: 'SLP',
      medicareRate: 42.75,
      medicaidRate: 39.10,
      duration: 15,
      modifiers: ['59', 'GP', 'GN']
    });
    
    // Occupational Therapy CPT Codes
    this.cptCodes.set('97165', {
      code: '97165',
      description: 'Occupational therapy evaluation, low complexity',
      category: 'OT',
      medicareRate: 92.33,
      medicaidRate: 84.50,
      duration: 30,
      modifiers: ['GP', 'GO']
    });
    
    this.cptCodes.set('97166', {
      code: '97166',
      description: 'Occupational therapy evaluation, moderate complexity',
      category: 'OT',
      medicareRate: 137.84,
      medicaidRate: 126.25,
      duration: 45,
      modifiers: ['GP', 'GO']
    });
    
    this.cptCodes.set('97167', {
      code: '97167',
      description: 'Occupational therapy evaluation, high complexity',
      category: 'OT',
      medicareRate: 171.64,
      medicaidRate: 157.10,
      duration: 60,
      modifiers: ['GP', 'GO']
    });
    
    this.cptCodes.set('97168', {
      code: '97168',
      description: 'Re-evaluation of occupational therapy established plan of care',
      category: 'OT',
      medicareRate: 79.37,
      medicaidRate: 72.65,
      duration: 30,
      modifiers: ['GP', 'GO']
    });
    
    // AAC-Specific HCPCS Codes
    this.hcpcsCodes.set('E2510', {
      code: 'E2510',
      description: 'Speech generating device, synthesized speech, permitting multiple methods of message formulation and multiple methods of device access',
      category: 'AAC',
      medicareRate: 8525.00,
      medicaidRate: 7800.00,
      requiresPriorAuth: true
    });
    
    this.hcpcsCodes.set('V5336', {
      code: 'V5336',
      description: 'Repair/modification of augmentative communicative system or device',
      category: 'AAC',
      medicareRate: 125.00,
      medicaidRate: 114.50,
      requiresPriorAuth: false
    });
  }

  createSession(
    patientId: string,
    providerId: string,
    serviceType: string,
    duration: number,
    notes?: string
  ): string {
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const cptCode = this.cptCodes.get(serviceType);
    
    if (!cptCode) {
      throw new Error('Invalid service type');
    }
    
    const units = Math.ceil(duration / cptCode.duration);
    const session: BillingSession = {
      sessionId,
      patientId,
      providerId,
      date: new Date().toISOString(),
      serviceType,
      duration,
      units,
      cptCode: cptCode.code,
      modifiers: [],
      notes: notes || '',
      status: 'pending',
      medicareAmount: cptCode.medicareRate * units,
      medicaidAmount: cptCode.medicaidRate * units,
      totalAmount: 0,
      created: new Date().toISOString()
    };
    
    this.sessions.push(session);
    this.saveToStorage();
    
    // Log session creation
    const hipaa = (window as any).moduleSystem?.get('HIPAAService');
    if (hipaa) {
      hipaa.logAccess('session_created', `Billing session created: ${sessionId}`, providerId);
    }
    
    return sessionId;
  }

  getSession(sessionId: string): BillingSession | null {
    return this.sessions.find(s => s.sessionId === sessionId) || null;
  }

  updateSession(sessionId: string, updates: Partial<BillingSession>): void {
    const index = this.sessions.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      this.sessions[index] = {
        ...this.sessions[index],
        ...updates,
        lastModified: new Date().toISOString()
      };
      this.saveToStorage();
    }
  }

  generateClaim(sessionId: string, insuranceType: 'medicare' | 'medicaid' | 'private'): Claim {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const cptCode = this.cptCodes.get(session.serviceType);
    if (!cptCode) {
      throw new Error('Invalid CPT code');
    }
    
    let amount = 0;
    switch (insuranceType) {
      case 'medicare':
        amount = session.medicareAmount;
        break;
      case 'medicaid':
        amount = session.medicaidAmount;
        break;
      case 'private':
        amount = session.medicareAmount * 1.2; // 120% of Medicare rate
        break;
    }
    
    const claim: Claim = {
      claimId: 'clm_' + Date.now(),
      sessionId,
      patientId: session.patientId,
      providerId: session.providerId,
      insuranceType,
      serviceDate: session.date,
      cptCode: session.cptCode,
      modifiers: session.modifiers,
      units: session.units,
      amount,
      status: 'submitted',
      submittedDate: new Date().toISOString(),
      notes: session.notes
    };
    
    // Update session with claim info
    session.totalAmount = amount;
    session.status = 'claimed';
    session.claimId = claim.claimId;
    this.saveToStorage();
    
    return claim;
  }

  getBillingReport(startDate: Date, endDate: Date): BillingReport {
    const filteredSessions = this.sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
    
    const report: BillingReport = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSessions: filteredSessions.length,
      totalDuration: filteredSessions.reduce((sum, s) => sum + s.duration, 0),
      totalUnits: filteredSessions.reduce((sum, s) => sum + s.units, 0),
      medicareTotal: filteredSessions.reduce((sum, s) => sum + s.medicareAmount, 0),
      medicaidTotal: filteredSessions.reduce((sum, s) => sum + s.medicaidAmount, 0),
      byServiceType: {},
      byStatus: {},
      sessions: filteredSessions
    };
    
    // Group by service type
    filteredSessions.forEach(session => {
      if (!report.byServiceType[session.serviceType]) {
        report.byServiceType[session.serviceType] = {
          count: 0,
          units: 0,
          medicareAmount: 0,
          medicaidAmount: 0
        };
      }
      
      report.byServiceType[session.serviceType].count++;
      report.byServiceType[session.serviceType].units += session.units;
      report.byServiceType[session.serviceType].medicareAmount += session.medicareAmount;
      report.byServiceType[session.serviceType].medicaidAmount += session.medicaidAmount;
    });
    
    // Group by status
    filteredSessions.forEach(session => {
      if (!report.byStatus[session.status]) {
        report.byStatus[session.status] = 0;
      }
      report.byStatus[session.status]++;
    });
    
    return report;
  }

  exportToCSV(sessions: BillingSession[]): string {
    const headers = [
      'Session ID',
      'Date',
      'Patient ID',
      'Service Type',
      'CPT Code',
      'Duration (min)',
      'Units',
      'Medicare Amount',
      'Medicaid Amount',
      'Status',
      'Notes'
    ];
    
    const rows = sessions.map(session => [
      session.sessionId,
      new Date(session.date).toLocaleDateString(),
      session.patientId,
      session.serviceType,
      session.cptCode,
      session.duration,
      session.units,
      session.medicareAmount.toFixed(2),
      session.medicaidAmount.toFixed(2),
      session.status,
      session.notes.replace(/,/g, ';')
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csv;
  }

  private saveToStorage(): void {
    localStorage.setItem('billing_sessions', JSON.stringify(this.sessions));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('billing_sessions');
    if (stored) {
      try {
        this.sessions = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load billing sessions:', error);
      }
    }
  }

  getCPTCodes(): CPTCode[] {
    return Array.from(this.cptCodes.values());
  }

  getHCPCSCodes(): HCPCSCode[] {
    return Array.from(this.hcpcsCodes.values());
  }
}

// Types
interface CPTCode {
  code: string;
  description: string;
  category: 'SLP' | 'OT' | 'PT';
  medicareRate: number;
  medicaidRate: number;
  duration: number; // in minutes
  modifiers: string[];
}

interface HCPCSCode {
  code: string;
  description: string;
  category: string;
  medicareRate: number;
  medicaidRate: number;
  requiresPriorAuth: boolean;
}

interface BillingSession {
  sessionId: string;
  patientId: string;
  providerId: string;
  date: string;
  serviceType: string;
  duration: number;
  units: number;
  cptCode: string;
  modifiers: string[];
  notes: string;
  status: 'pending' | 'claimed' | 'paid' | 'denied';
  medicareAmount: number;
  medicaidAmount: number;
  totalAmount: number;
  created: string;
  lastModified?: string;
  claimId?: string;
}

interface Claim {
  claimId: string;
  sessionId: string;
  patientId: string;
  providerId: string;
  insuranceType: 'medicare' | 'medicaid' | 'private';
  serviceDate: string;
  cptCode: string;
  modifiers: string[];
  units: number;
  amount: number;
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'paid';
  submittedDate: string;
  processedDate?: string;
  paidDate?: string;
  denialReason?: string;
  notes: string;
}

interface BillingReport {
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalDuration: number;
  totalUnits: number;
  medicareTotal: number;
  medicaidTotal: number;
  byServiceType: {
    [serviceType: string]: {
      count: number;
      units: number;
      medicareAmount: number;
      medicaidAmount: number;
    };
  };
  byStatus: {
    [status: string]: number;
  };
  sessions: BillingSession[];
}