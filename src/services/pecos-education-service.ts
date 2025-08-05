/**
 * PECOS Education Service
 * Provides educational content and guidance for Medicare enrollment and billing
 */

interface PECOSEnrollmentStep {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  timeline: string;
  documents: string[];
  tips: string[];
}

interface BillingGuide {
  id: string;
  title: string;
  category: 'enrollment' | 'billing' | 'coding' | 'documentation' | 'compliance';
  content: string;
  keyPoints: string[];
  resources: Array<{ title: string; url: string; type: 'pdf' | 'website' | 'video' }>;
}

interface CPTCodeInfo {
  code: string;
  description: string;
  category: string;
  requirements: string[];
  documentation: string[];
  reimbursementRate: {
    medicare: number;
    medicaid: number;
    commercial: number;
  };
  modifiers?: Array<{ code: string; description: string; when: string }>;
}

class PECOSEducationService {
  private static instance: PECOSEducationService;

  private constructor() {}

  static getInstance(): PECOSEducationService {
    if (!PECOSEducationService.instance) {
      PECOSEducationService.instance = new PECOSEducationService();
    }
    return PECOSEducationService.instance;
  }

  getPECOSEnrollmentSteps(): PECOSEnrollmentStep[] {
    return [
      {
        id: 'step1',
        title: 'Determine Enrollment Requirements',
        description: 'Identify if you need to enroll in PECOS as a speech-language pathologist',
        requirements: [
          'Active state license for speech-language pathology',
          'Certificate of Clinical Competence (CCC-SLP) from ASHA',
          'Valid National Provider Identifier (NPI)',
          'Malpractice insurance coverage'
        ],
        timeline: '1-2 weeks preparation',
        documents: [
          'State license verification',
          'ASHA certification',
          'NPI confirmation letter',
          'Malpractice insurance certificate'
        ],
        tips: [
          'Ensure all licenses are current before starting',
          'Gather all documents before beginning application',
          'Consider hiring a credentialing specialist for complex cases'
        ]
      },
      {
        id: 'step2',
        title: 'Create PECOS Account',
        description: 'Register for Provider Enrollment, Chain and Ownership System',
        requirements: [
          'Valid email address',
          'Secure password meeting CMS requirements',
          'Two-factor authentication setup'
        ],
        timeline: '1 day',
        documents: [
          'Government-issued photo ID',
          'Social Security card',
          'Business formation documents (if applicable)'
        ],
        tips: [
          'Use a professional email address',
          'Keep login credentials secure',
          'Enable all security features'
        ]
      },
      {
        id: 'step3',
        title: 'Complete Medicare Enrollment Application',
        description: 'Submit CMS-855I form for individual practitioners',
        requirements: [
          'Completed CMS-855I application',
          'All supporting documentation',
          'Application fee payment ($627 as of 2024)'
        ],
        timeline: '2-4 weeks to complete',
        documents: [
          'CMS-855I application form',
          'Practice location verification',
          'Bank account information for EFT',
          'Taxonomy code verification'
        ],
        tips: [
          'Double-check all information for accuracy',
          'Use taxonomy code 235Z00000X for SLP',
          'Submit complete application to avoid delays'
        ]
      },
      {
        id: 'step4',
        title: 'Await CMS Review',
        description: 'CMS reviews application and may request additional information',
        requirements: [
          'Respond promptly to any CMS requests',
          'Monitor PECOS account for updates',
          'Maintain current contact information'
        ],
        timeline: '90-120 days average processing',
        documents: [
          'Any additional documents requested by CMS',
          'Clarifications or corrections as needed'
        ],
        tips: [
          'Check PECOS account weekly for updates',
          'Respond to requests within 30 days',
          'Keep copies of all correspondence'
        ]
      },
      {
        id: 'step5',
        title: 'Receive Enrollment Decision',
        description: 'Get approval and effective date for Medicare billing',
        requirements: [
          'Approved enrollment status',
          'Valid effective date',
          'Medicare billing privileges'
        ],
        timeline: 'Upon approval',
        documents: [
          'Enrollment approval notice',
          'Medicare fee schedule access',
          'Provider agreement terms'
        ],
        tips: [
          'Save approval notice for records',
          'Verify billing privileges are active',
          'Begin submitting claims only after effective date'
        ]
      }
    ];
  }

  getBillingGuides(): BillingGuide[] {
    return [
      {
        id: 'medicare-basics',
        title: 'Medicare Basics for Speech Therapists',
        category: 'enrollment',
        content: `Medicare coverage for speech-language pathology services requires proper enrollment and understanding of benefit categories. 
        
        Speech therapy is covered under Medicare Part B as an outpatient service when medically necessary. Services must be provided by qualified speech-language pathologists or under their supervision.
        
        Key coverage requirements:
        - Services must be reasonable and necessary
        - Patient must have a documented medical condition requiring treatment
        - Treatment plan must be established by physician or qualified practitioner
        - Progress must be documented and monitored`,
        keyPoints: [
          'Medicare Part B covers outpatient speech therapy',
          'Services must be medically necessary and prescribed',
          'Annual therapy caps may apply (with exceptions)',
          'Prior authorization may be required for some services'
        ],
        resources: [
          { title: 'CMS Speech Therapy Guidelines', url: 'https://www.cms.gov/medicare-coverage-database', type: 'website' },
          { title: 'Medicare Part B Coverage Guide', url: '#', type: 'pdf' }
        ]
      },
      {
        id: 'aac-billing',
        title: 'Billing for AAC Services',
        category: 'billing',
        content: `Augmentative and Alternative Communication (AAC) services can be billed under specific circumstances and with proper documentation.
        
        AAC evaluations and training are covered when:
        - Patient has severe communication impairment
        - Traditional speech therapy approaches are insufficient
        - AAC device/system is medically necessary
        - Training is required for effective use
        
        Key billing considerations:
        - Use appropriate CPT codes for evaluation and training
        - Document medical necessity thoroughly
        - Include functional communication goals
        - Track progress with measurable outcomes`,
        keyPoints: [
          'AAC services require specific medical necessity documentation',
          'Evaluation and training services use different CPT codes',
          'Device recommendations must be evidence-based',
          'Family/caregiver training is often billable'
        ],
        resources: [
          { title: 'AAC Coverage Guidelines', url: '#', type: 'pdf' },
          { title: 'Documentation Templates', url: '#', type: 'pdf' }
        ]
      },
      {
        id: 'documentation',
        title: 'Documentation Requirements',
        category: 'documentation',
        content: `Proper documentation is essential for Medicare reimbursement and compliance. All services must be thoroughly documented with specific elements.
        
        Required documentation elements:
        - Initial evaluation with medical history
        - Treatment plan with specific goals
        - Progress notes for each session
        - Reassessment and plan updates
        - Discharge summary when appropriate
        
        Documentation must demonstrate:
        - Medical necessity for services
        - Patient progress toward goals
        - Skilled therapy intervention
        - Functional communication improvements`,
        keyPoints: [
          'Document medical necessity in every note',
          'Use objective, measurable language',
          'Include patient/family response to treatment',
          'Maintain HIPAA compliance at all times'
        ],
        resources: [
          { title: 'Documentation Checklist', url: '#', type: 'pdf' },
          { title: 'Sample Progress Notes', url: '#', type: 'pdf' }
        ]
      }
    ];
  }

  getAACCPTCodes(): CPTCodeInfo[] {
    return [
      {
        code: '92507',
        description: 'Treatment of speech, language, voice, communication, and/or auditory processing disorder',
        category: 'Treatment',
        requirements: [
          'Individual treatment session',
          'Skilled therapy intervention',
          'Documented medical necessity',
          'Progress toward established goals'
        ],
        documentation: [
          'Treatment techniques used',
          'Patient response to intervention',
          'Progress toward goals',
          'Plan for next session'
        ],
        reimbursementRate: {
          medicare: 65.50,
          medicaid: 45.20,
          commercial: 85.00
        },
        modifiers: [
          { code: 'GP', description: 'Services delivered under physical therapy plan', when: 'When PT supervises' },
          { code: 'GN', description: 'Services delivered under speech therapy plan', when: 'Standard SLP services' }
        ]
      },
      {
        code: '92508',
        description: 'Treatment of speech, language, voice, communication, and/or auditory processing disorder; group',
        category: 'Group Treatment',
        requirements: [
          'Group of 2-6 patients',
          'All patients working on similar goals',
          'Individual attention to each patient',
          'Documented benefit of group format'
        ],
        documentation: [
          'Group composition and rationale',
          'Individual patient responses',
          'Group dynamics and interactions',
          'Individual progress notes'
        ],
        reimbursementRate: {
          medicare: 32.75,
          medicaid: 22.60,
          commercial: 42.50
        }
      },
      {
        code: '92521',
        description: 'Evaluation of speech fluency',
        category: 'Evaluation',
        requirements: [
          'Comprehensive fluency assessment',
          'Standardized testing when appropriate',
          'Analysis of speech patterns',
          'Treatment recommendations'
        ],
        documentation: [
          'Assessment methods used',
          'Objective test results',
          'Functional impact analysis',
          'Treatment plan recommendations'
        ],
        reimbursementRate: {
          medicare: 125.30,
          medicaid: 87.70,
          commercial: 165.00
        }
      },
      {
        code: '92523',
        description: 'Evaluation of speech sound production',
        category: 'Evaluation',
        requirements: [
          'Articulation/phonology assessment',
          'Oral mechanism examination',
          'Hearing screening',
          'Functional communication impact'
        ],
        documentation: [
          'Assessment tools utilized',
          'Speech sound inventory',
          'Stimulability testing results',
          'Severity rating and prognosis'
        ],
        reimbursementRate: {
          medicare: 118.45,
          medicaid: 82.90,
          commercial: 155.00
        }
      },
      {
        code: '92524',
        description: 'Behavioral and qualitative analysis of voice and resonance',
        category: 'Evaluation',
        requirements: [
          'Voice quality assessment',
          'Resonance evaluation',
          'Respiratory support analysis',
          'Functional voice use'
        ],
        documentation: [
          'Perceptual voice analysis',
          'Acoustic measurements if available',
          'Impact on daily communication',
          'Treatment recommendations'
        ],
        reimbursementRate: {
          medicare: 95.20,
          medicaid: 66.65,
          commercial: 125.00
        }
      }
    ];
  }

  checkEnrollmentStatus(npi: string): Promise<{
    enrolled: boolean;
    status: 'active' | 'pending' | 'rejected' | 'not_found';
    effectiveDate?: string;
    expirationDate?: string;
    specialties: string[];
  }> {
    // This would integrate with CMS PECOS API in production
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          enrolled: Math.random() > 0.3,
          status: 'active',
          effectiveDate: '2023-01-01',
          expirationDate: '2025-12-31',
          specialties: ['Speech-Language Pathology']
        });
      }, 1000);
    });
  }

  calculateReimbursementEstimate(
    cptCode: string,
    units: number,
    payerType: 'medicare' | 'medicaid' | 'commercial'
  ): { amount: number; code: string; description: string } {
    const cptInfo = this.getAACCPTCodes().find(code => code.code === cptCode);
    
    if (!cptInfo) {
      return { amount: 0, code: cptCode, description: 'Code not found' };
    }

    const rate = cptInfo.reimbursementRate[payerType];
    const amount = rate * units;

    return {
      amount: Math.round(amount * 100) / 100,
      code: cptInfo.code,
      description: cptInfo.description
    };
  }

  generateComplianceChecklist(): Array<{ category: string; items: Array<{ task: string; required: boolean; completed: boolean }> }> {
    return [
      {
        category: 'Enrollment & Credentialing',
        items: [
          { task: 'Valid NPI number', required: true, completed: false },
          { task: 'Current state license', required: true, completed: false },
          { task: 'ASHA CCC-SLP certification', required: true, completed: false },
          { task: 'Medicare PECOS enrollment', required: true, completed: false },
          { task: 'Malpractice insurance', required: true, completed: false }
        ]
      },
      {
        category: 'Documentation & Billing',
        items: [
          { task: 'Treatment plan templates', required: true, completed: false },
          { task: 'Progress note templates', required: true, completed: false },
          { task: 'Evaluation report templates', required: true, completed: false },
          { task: 'Billing software setup', required: true, completed: false },
          { task: 'Claims submission process', required: true, completed: false }
        ]
      },
      {
        category: 'Compliance & Quality',
        items: [
          { task: 'HIPAA compliance training', required: true, completed: false },
          { task: 'Medicare guidelines review', required: true, completed: false },
          { task: 'Quality assurance protocols', required: false, completed: false },
          { task: 'Audit preparation procedures', required: false, completed: false }
        ]
      }
    ];
  }
}

export const pecosEducationService = PECOSEducationService.getInstance();
export type { PECOSEnrollmentStep, BillingGuide, CPTCodeInfo };