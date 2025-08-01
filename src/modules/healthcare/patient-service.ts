// Patient Management Service with HIPAA compliance
import { HIPAAService } from './hipaa-service';

export class PatientService {
  private patients: Map<string, string> = new Map(); // Stores encrypted patient data
  private hipaaService: HIPAAService;

  constructor(hipaaService: HIPAAService) {
    this.hipaaService = hipaaService;
    this.initialize();
  }

  private initialize(): void {
    this.loadFromStorage();
    console.log('Patient Service initialized');
  }

  createPatient(patientData: PatientData): string {
    // Validate required fields
    const required: (keyof PatientData)[] = ['firstName', 'lastName', 'dateOfBirth', 'insuranceType'];
    for (const field of required) {
      if (!patientData[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
    
    const patientId = 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const patient: Patient = {
      patientId,
      ...patientData,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      active: true,
      communicationProfile: {
        primaryMethod: patientData.communicationProfile?.primaryMethod || 'verbal',
        aacDevice: patientData.communicationProfile?.aacDevice || 'TinkyBink',
        vocabularyLevel: patientData.communicationProfile?.vocabularyLevel || 'basic',
        preferredSymbols: patientData.communicationProfile?.preferredSymbols || 'pcs'
      },
      goals: patientData.goals || [],
      progress: []
    };
    
    // Encrypt patient data
    const encryptedPatient = this.hipaaService.encrypt(patient);
    this.patients.set(patientId, encryptedPatient);
    
    this.hipaaService.logAccess('patient_created', `Patient created: ${patientId}`);
    this.saveToStorage();
    return patientId;
  }

  getPatient(patientId: string): Patient | null {
    const encryptedPatient = this.patients.get(patientId);
    
    if (!encryptedPatient) {
      return null;
    }
    
    try {
      const patient = this.hipaaService.decrypt(encryptedPatient) as Patient;
      this.hipaaService.logAccess('patient_accessed', `Patient accessed: ${patientId}`);
      return patient;
    } catch (error) {
      this.hipaaService.logAccess('patient_access_error', `Failed to access patient: ${patientId}`);
      return null;
    }
  }

  updatePatient(patientId: string, updates: Partial<PatientData>): void {
    const patient = this.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    const updatedPatient: Patient = {
      ...patient,
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    const encryptedPatient = this.hipaaService.encrypt(updatedPatient);
    this.patients.set(patientId, encryptedPatient);
    
    this.hipaaService.logAccess('patient_updated', `Patient updated: ${patientId}`);
    this.saveToStorage();
  }

  deletePatient(patientId: string): void {
    if (!this.patients.has(patientId)) {
      throw new Error('Patient not found');
    }
    
    this.patients.delete(patientId);
    this.hipaaService.logAccess('patient_deleted', `Patient deleted: ${patientId}`);
    this.saveToStorage();
  }

  getAllPatients(): Patient[] {
    const patients: Patient[] = [];
    
    this.patients.forEach((encryptedData, patientId) => {
      try {
        const patient = this.hipaaService.decrypt(encryptedData) as Patient;
        patients.push(patient);
      } catch (error) {
        console.error(`Failed to decrypt patient ${patientId}`);
      }
    });
    
    this.hipaaService.logAccess('patients_list_accessed', `Accessed list of ${patients.length} patients`);
    return patients;
  }

  getActivePatients(): Patient[] {
    return this.getAllPatients().filter(p => p.active);
  }

  searchPatients(query: string): Patient[] {
    const lowercaseQuery = query.toLowerCase();
    const patients = this.getAllPatients();
    
    return patients.filter(patient => {
      const searchableFields = [
        patient.firstName,
        patient.lastName,
        patient.patientId,
        patient.insuranceId
      ];
      
      return searchableFields.some(field => 
        field?.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  addProgressNote(patientId: string, note: ProgressNote): void {
    const patient = this.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    const progressNote: ProgressNote = {
      ...note,
      id: 'note_' + Date.now(),
      date: new Date().toISOString()
    };
    
    patient.progress.push(progressNote);
    
    const encryptedPatient = this.hipaaService.encrypt(patient);
    this.patients.set(patientId, encryptedPatient);
    
    this.hipaaService.logAccess('progress_note_added', `Progress note added for patient: ${patientId}`);
    this.saveToStorage();
  }

  getPatientProgress(patientId: string, startDate?: Date, endDate?: Date): ProgressNote[] {
    const patient = this.getPatient(patientId);
    if (!patient) {
      return [];
    }
    
    let progress = patient.progress;
    
    if (startDate || endDate) {
      progress = progress.filter(note => {
        const noteDate = new Date(note.date);
        if (startDate && noteDate < startDate) return false;
        if (endDate && noteDate > endDate) return false;
        return true;
      });
    }
    
    return progress;
  }

  updateGoals(patientId: string, goals: Goal[]): void {
    const patient = this.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    patient.goals = goals.map(goal => ({
      ...goal,
      id: goal.id || 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      created: goal.created || new Date().toISOString()
    }));
    
    const encryptedPatient = this.hipaaService.encrypt(patient);
    this.patients.set(patientId, encryptedPatient);
    
    this.hipaaService.logAccess('goals_updated', `Goals updated for patient: ${patientId}`);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    const data: any = {};
    this.patients.forEach((value, key) => {
      data[key] = value;
    });
    localStorage.setItem('encrypted_patients', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('encrypted_patients');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]) => {
          this.patients.set(key, value as string);
        });
      } catch (error) {
        console.error('Failed to load patients:', error);
      }
    }
  }

  exportPatientData(patientId: string): string {
    const patient = this.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    this.hipaaService.logAccess('patient_data_exported', `Patient data exported: ${patientId}`);
    
    // Sanitize PHI for export
    const sanitized = this.hipaaService.sanitizePHI(patient);
    return JSON.stringify(sanitized, null, 2);
  }
}

// Types
export interface PatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  guardianName?: string;
  guardianRelation?: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  insuranceType: 'medicare' | 'medicaid' | 'private' | 'self-pay';
  insuranceId?: string;
  insurancePlan?: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  communicationProfile?: CommunicationProfile;
  goals?: Goal[];
}

export interface Patient extends PatientData {
  patientId: string;
  created: string;
  lastModified: string;
  active: boolean;
  progress: ProgressNote[];
}

export interface CommunicationProfile {
  primaryMethod: 'verbal' | 'aac' | 'sign' | 'mixed';
  aacDevice?: string;
  vocabularyLevel: 'emerging' | 'basic' | 'intermediate' | 'advanced';
  preferredSymbols: 'pcs' | 'symbolstix' | 'widgit' | 'custom';
  accessMethod?: 'direct' | 'switch' | 'eye-gaze' | 'head-tracking';
  motorAbilities?: {
    finemotor: 'typical' | 'mild' | 'moderate' | 'severe';
    grossmotor: 'typical' | 'mild' | 'moderate' | 'severe';
  };
  cognitiveLevel?: 'typical' | 'mild' | 'moderate' | 'severe';
  visualPerception?: 'typical' | 'impaired' | 'corrected';
  hearingStatus?: 'typical' | 'impaired' | 'aided';
}

export interface Goal {
  id?: string;
  type: 'communication' | 'vocabulary' | 'social' | 'academic' | 'daily-living';
  description: string;
  targetDate: string;
  status: 'active' | 'achieved' | 'discontinued';
  measurable: boolean;
  criteria?: string;
  baseline?: string;
  created?: string;
}

export interface ProgressNote {
  id?: string;
  date: string;
  sessionType: string;
  duration: number;
  activities: string[];
  performance: {
    tilesUsed: number;
    sentencesCreated: number;
    communicationActs: number;
    independenceLevel: 'dependent' | 'min-assist' | 'mod-assist' | 'supervised' | 'independent';
  };
  notes: string;
  nextSteps?: string;
  providerId: string;
}