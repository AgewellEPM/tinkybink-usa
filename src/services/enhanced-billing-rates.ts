/**
 * Enhanced Billing Rates and CPT Codes for Medicare/Medicaid
 * Complete reimbursement rates for AAC therapy services
 * Updated for 2025 CMS Fee Schedule
 */

export interface EnhancedCPTCode {
  code: string;
  description: string;
  category: 'evaluation' | 'treatment' | 'group' | 'teletherapy' | 'device' | 'training';
  medicareRate: number;      // Medicare Part B rate
  medicaidRate: number;      // State Medicaid average
  commercialRate: number;    // Average commercial insurance rate
  selfPayRate: number;       // Standard self-pay rate
  facilityRate?: number;     // Facility/hospital rate if different
  units: number;             // Default billing units (15-min increments)
  requiresModifier: boolean;
  modifiers?: string[];
  supervisionRequired?: boolean;
  telehealth: boolean;
  documentation: string[];   // Required documentation
}

export interface HCPCSCode {
  code: string;
  description: string;
  medicareRate: number;
  category: 'device' | 'supply' | 'service';
}

// Comprehensive CPT Codes for AAC and Speech Therapy
export const AAC_CPT_CODES: EnhancedCPTCode[] = [
  // ============= EVALUATION CODES =============
  {
    code: '92521',
    description: 'Evaluation of speech fluency (stuttering, cluttering)',
    category: 'evaluation',
    medicareRate: 175.32,
    medicaidRate: 140.26,
    commercialRate: 225.00,
    selfPayRate: 200.00,
    units: 1,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Initial evaluation report', 'Standardized test results', 'Treatment plan']
  },
  {
    code: '92522',
    description: 'Evaluation of speech sound production (articulation, phonology)',
    category: 'evaluation',
    medicareRate: 168.44,
    medicaidRate: 134.75,
    commercialRate: 215.00,
    selfPayRate: 195.00,
    units: 1,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Articulation assessment', 'Phonological analysis', 'Severity rating']
  },
  {
    code: '92523',
    description: 'Evaluation of speech/language with established patient',
    category: 'evaluation',
    medicareRate: 182.20,
    medicaidRate: 145.76,
    commercialRate: 235.00,
    selfPayRate: 210.00,
    units: 1,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Re-evaluation report', 'Progress comparison', 'Updated goals']
  },
  {
    code: '92524',
    description: 'Behavioral qualitative analysis of voice/resonance',
    category: 'evaluation',
    medicareRate: 164.85,
    medicaidRate: 131.88,
    commercialRate: 210.00,
    selfPayRate: 190.00,
    units: 1,
    requiresModifier: false,
    telehealth: false,
    documentation: ['Voice assessment', 'Acoustic analysis', 'Perceptual ratings']
  },

  // ============= AAC DEVICE EVALUATION =============
  {
    code: '92597',
    description: 'AAC device evaluation, first hour',
    category: 'device',
    medicareRate: 156.78,
    medicaidRate: 125.42,
    commercialRate: 195.00,
    selfPayRate: 175.00,
    facilityRate: 142.50,
    units: 4, // 60 minutes
    requiresModifier: true,
    modifiers: ['KX', 'GA'],
    telehealth: false,
    documentation: ['Device trial data', 'Feature matching', 'Vendor quotes', 'Medical necessity']
  },
  {
    code: '92598',
    description: 'AAC device evaluation, each additional 15 minutes',
    category: 'device',
    medicareRate: 38.42,
    medicaidRate: 30.74,
    commercialRate: 48.75,
    selfPayRate: 43.75,
    facilityRate: 35.63,
    units: 1, // 15 minutes
    requiresModifier: true,
    modifiers: ['KX', 'GA'],
    telehealth: false,
    documentation: ['Extended evaluation notes', 'Additional trial data']
  },
  {
    code: '92605',
    description: 'AAC device setup, modification, training - first hour',
    category: 'training',
    medicareRate: 148.56,
    medicaidRate: 118.85,
    commercialRate: 185.00,
    selfPayRate: 165.00,
    units: 4,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Training log', 'Customization details', 'Competency demonstration']
  },
  {
    code: '92606',
    description: 'AAC therapeutic service, additional 15 minutes',
    category: 'training',
    medicareRate: 36.28,
    medicaidRate: 29.02,
    commercialRate: 46.25,
    selfPayRate: 41.25,
    units: 1,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Session notes', 'Skills practiced', 'Progress tracking']
  },
  {
    code: '92607',
    description: 'AAC treatment, individual',
    category: 'treatment',
    medicareRate: 142.84,
    medicaidRate: 114.27,
    commercialRate: 180.00,
    selfPayRate: 160.00,
    units: 4,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Treatment notes', 'Goals addressed', 'Data collection']
  },
  {
    code: '92608',
    description: 'AAC treatment, group (2 or more)',
    category: 'group',
    medicareRate: 45.62,
    medicaidRate: 36.50,
    commercialRate: 60.00,
    selfPayRate: 55.00,
    units: 4,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Group session notes', 'Individual participation', 'Peer interaction']
  },

  // ============= TRADITIONAL SPEECH THERAPY =============
  {
    code: '92507',
    description: 'Speech/language/hearing therapy, individual',
    category: 'treatment',
    medicareRate: 125.68,
    medicaidRate: 100.54,
    commercialRate: 160.00,
    selfPayRate: 145.00,
    facilityRate: 115.00,
    units: 2, // 30 minutes typical
    requiresModifier: false,
    supervisionRequired: false,
    telehealth: true,
    documentation: ['SOAP notes', 'Data sheets', 'Home program']
  },
  {
    code: '92508',
    description: 'Speech/language/hearing therapy, group',
    category: 'group',
    medicareRate: 42.36,
    medicaidRate: 33.89,
    commercialRate: 55.00,
    selfPayRate: 50.00,
    facilityRate: 38.75,
    units: 2, // 30 minutes typical
    requiresModifier: false,
    supervisionRequired: false,
    telehealth: true,
    documentation: ['Group notes', 'Individual tracking', 'Group dynamics']
  },

  // ============= COGNITIVE THERAPY =============
  {
    code: '97129',
    description: 'Cognitive function intervention, initial 15 minutes',
    category: 'treatment',
    medicareRate: 38.84,
    medicaidRate: 31.07,
    commercialRate: 50.00,
    selfPayRate: 45.00,
    units: 1,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Cognitive assessment', 'Functional goals', 'Strategy training']
  },
  {
    code: '97130',
    description: 'Cognitive function intervention, each additional 15 minutes',
    category: 'treatment',
    medicareRate: 36.98,
    medicaidRate: 29.58,
    commercialRate: 47.50,
    selfPayRate: 42.50,
    units: 1,
    requiresModifier: false,
    telehealth: true,
    documentation: ['Progress notes', 'Strategy implementation', 'Generalization']
  },

  // ============= TELEPRACTICE CODES =============
  {
    code: '99453',
    description: 'Remote patient monitoring setup and education',
    category: 'teletherapy',
    medicareRate: 19.31,
    medicaidRate: 15.45,
    commercialRate: 25.00,
    selfPayRate: 22.00,
    units: 1,
    requiresModifier: true,
    modifiers: ['GT', '95'],
    telehealth: true,
    documentation: ['Device setup', 'Patient education', 'Connectivity test']
  },
  {
    code: '99454',
    description: 'Remote patient monitoring, monthly',
    category: 'teletherapy',
    medicareRate: 62.44,
    medicaidRate: 49.95,
    commercialRate: 80.00,
    selfPayRate: 70.00,
    units: 1,
    requiresModifier: true,
    modifiers: ['GT', '95'],
    telehealth: true,
    documentation: ['Monthly report', 'Data review', 'Trend analysis']
  },
  {
    code: '99457',
    description: 'Remote patient monitoring treatment, first 20 minutes',
    category: 'teletherapy',
    medicareRate: 50.94,
    medicaidRate: 40.75,
    commercialRate: 65.00,
    selfPayRate: 58.00,
    units: 1,
    requiresModifier: true,
    modifiers: ['GT', '95'],
    telehealth: true,
    documentation: ['Interactive session', 'Clinical decisions', 'Care plan updates']
  },

  // ============= SPECIAL CODES =============
  {
    code: 'G0153',
    description: 'AAC services by speech-language pathologist',
    category: 'treatment',
    medicareRate: 112.45,
    medicaidRate: 89.96,
    commercialRate: 145.00,
    selfPayRate: 130.00,
    units: 3, // 45 minutes
    requiresModifier: false,
    telehealth: true,
    documentation: ['AAC intervention', 'Device use', 'Communication strategies']
  }
];

// HCPCS Codes for AAC Devices and Supplies
export const AAC_HCPCS_CODES: HCPCSCode[] = [
  {
    code: 'E2510',
    description: 'Speech generating device, digitized speech output',
    medicareRate: 2845.00,
    category: 'device'
  },
  {
    code: 'E2511',
    description: 'Speech generating device, synthesized speech output',
    medicareRate: 4826.00,
    category: 'device'
  },
  {
    code: 'E2512',
    description: 'Accessory for SGD, mounting system',
    medicareRate: 485.00,
    category: 'supply'
  },
  {
    code: 'E2599',
    description: 'Accessory for SGD, not otherwise classified',
    medicareRate: 125.00,
    category: 'supply'
  },
  {
    code: 'V5336',
    description: 'Repair/modification of AAC device',
    medicareRate: 95.00,
    category: 'service'
  }
];

// Modifier codes commonly used with AAC billing
export const BILLING_MODIFIERS = {
  'KX': 'Therapy cap exception (medical necessity)',
  'GA': 'Waiver of liability on file',
  'GN': 'Speech-language therapy service',
  'GT': 'Interactive telecommunication service',
  '95': 'Synchronous telemedicine via real-time interactive audio/video',
  '96': 'Habilitative services',
  '97': 'Rehabilitative services',
  'GO': 'Occupational therapy service',
  'GP': 'Physical therapy service',
  '59': 'Distinct procedural service',
  '76': 'Repeat procedure by same physician',
  '77': 'Repeat procedure by different physician',
  'CQ': 'Outpatient PT/OT services by PTA/OTA',
  'CO': 'Outpatient OT services by OTA'
};

// Insurance-specific billing rules
export const INSURANCE_RULES = {
  medicare: {
    therapyCap: 2330,  // 2025 Medicare therapy cap
    capExceptionThreshold: 3700,
    requiresKXModifier: true,
    coveredDiagnoses: [
      'F80.0', 'F80.1', 'F80.2', 'F80.81', 'F80.82', // Speech disorders
      'F84.0', 'F84.5', 'F84.9', // Autism spectrum
      'G80.0', 'G80.1', 'G80.2', 'G80.3', 'G80.4', // Cerebral palsy
      'R47.01', 'R47.02', 'R47.1', // Aphasia and dysphasia
      'R48.2', // Apraxia
      'R49.0', 'R49.8' // Voice disorders
    ],
    priorAuthRequired: ['E2510', 'E2511'],
    documentationRequirements: [
      'Physician referral',
      'Plan of care',
      'Progress reports every 10 visits',
      'Medical necessity documentation',
      'Functional assessment'
    ]
  },
  medicaid: {
    sessionLimit: 60, // Annual session limit (varies by state)
    requiresPriorAuth: true,
    ageLimit: 21, // EPSDT coverage
    coveredServices: ['evaluation', 'treatment', 'device', 'training'],
    excludedServices: ['maintenance therapy'],
    documentationRequirements: [
      'Prior authorization',
      'Treatment plan',
      'Monthly progress notes',
      'Discharge summary'
    ]
  },
  commercial: {
    requiresPreAuth: true,
    sessionLimit: 40, // Typical annual limit
    coinsurance: 0.20, // 20% typical
    deductible: 500, // Typical deductible
    outOfPocketMax: 3000,
    coveredServices: ['all'],
    documentationRequirements: [
      'Referral or prescription',
      'Evaluation report',
      'Progress notes',
      'Outcomes data'
    ]
  }
};

// Calculate actual reimbursement based on insurance type and modifiers
export function calculateReimbursement(
  cptCode: string,
  insuranceType: 'medicare' | 'medicaid' | 'commercial' | 'selfpay',
  units: number = 1,
  modifiers: string[] = []
): { amount: number; notes: string[] } {
  const code = AAC_CPT_CODES.find(c => c.code === cptCode);
  if (!code) {
    return { amount: 0, notes: ['Invalid CPT code'] };
  }

  let rate = 0;
  const notes: string[] = [];

  switch (insuranceType) {
    case 'medicare':
      rate = code.medicareRate;
      if (modifiers.includes('CQ') || modifiers.includes('CO')) {
        rate *= 0.85; // Assistant modifier reduces to 85%
        notes.push('Assistant modifier applied - 85% of standard rate');
      }
      break;
    case 'medicaid':
      rate = code.medicaidRate;
      break;
    case 'commercial':
      rate = code.commercialRate;
      break;
    case 'selfpay':
      rate = code.selfPayRate;
      notes.push('Self-pay rate applied');
      break;
  }

  // Apply facility rate if applicable
  if (code.facilityRate && modifiers.includes('POS22')) {
    rate = code.facilityRate;
    notes.push('Facility rate applied');
  }

  // Calculate total
  const totalAmount = rate * units;

  // Check therapy cap for Medicare
  if (insuranceType === 'medicare' && totalAmount > INSURANCE_RULES.medicare.therapyCap) {
    notes.push(`Exceeds Medicare therapy cap of $${INSURANCE_RULES.medicare.therapyCap}`);
    notes.push('KX modifier required for medical necessity exception');
  }

  return { amount: totalAmount, notes };
}

// Get documentation requirements for a specific code and insurance
export function getDocumentationRequirements(
  cptCode: string,
  insuranceType: 'medicare' | 'medicaid' | 'commercial'
): string[] {
  const code = AAC_CPT_CODES.find(c => c.code === cptCode);
  if (!code) return [];

  const requirements = [...code.documentation];
  const insuranceReqs = INSURANCE_RULES[insuranceType].documentationRequirements;
  
  return [...new Set([...requirements, ...insuranceReqs])];
}

// Export helper function to integrate with existing billing service
export function getBillingIntegrationEnhancements() {
  return {
    cptCodes: AAC_CPT_CODES,
    hcpcsCodes: AAC_HCPCS_CODES,
    modifiers: BILLING_MODIFIERS,
    insuranceRules: INSURANCE_RULES,
    calculateReimbursement,
    getDocumentationRequirements
  };
}