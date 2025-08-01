// Module 19: Prescription Management Service
// Manages therapy prescriptions, exercises, and home programs

import { getTherapyGoalsService } from './therapy-goals-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getDataService } from '../core/data-service';

export interface TherapyPrescription {
  id: string;
  patientId: string;
  prescriberId: string;
  dateCreated: Date;
  dateModified: Date;
  status: 'active' | 'completed' | 'paused' | 'discontinued';
  type: 'home-program' | 'exercises' | 'communication-tasks' | 'combined';
  frequency: PrescriptionFrequency;
  duration: PrescriptionDuration;
  exercises: Exercise[];
  communicationTasks: CommunicationTask[];
  parentGuidance: ParentGuidance[];
  progressTracking: ProgressTracking;
  notes?: string;
}

export interface PrescriptionFrequency {
  sessionsPerWeek: number;
  minutesPerSession: number;
  preferredDays?: string[];
  preferredTimes?: string[];
}

export interface PrescriptionDuration {
  startDate: Date;
  endDate?: Date;
  totalWeeks?: number;
  renewable: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'articulation' | 'language' | 'fluency' | 'voice' | 'pragmatics' | 'oral-motor';
  description: string;
  instructions: string[];
  videoUrl?: string;
  imageUrls?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetSounds?: string[];
  materials: string[];
  repetitions: number;
  duration: number; // minutes
  adaptations?: Adaptation[];
  precautions?: string[];
}

export interface CommunicationTask {
  id: string;
  name: string;
  type: 'vocabulary' | 'sentence-building' | 'conversation' | 'requesting' | 'social';
  description: string;
  goals: string[];
  scenarios: Scenario[];
  targetWords?: string[];
  communicationBoards?: string[];
  successCriteria: SuccessCriteria;
  dataCollection: DataCollectionMethod;
}

export interface Scenario {
  title: string;
  description: string;
  setting: string;
  participants: string[];
  prompts: string[];
  expectedResponses: string[];
}

export interface SuccessCriteria {
  accuracyTarget: number; // percentage
  independenceLevel: 'full-prompt' | 'partial-prompt' | 'independent';
  generalizationRequired: boolean;
  maintenanceWeeks: number;
}

export interface DataCollectionMethod {
  type: 'frequency' | 'accuracy' | 'duration' | 'interval';
  trackingSheet?: string;
  instructions: string;
}

export interface ParentGuidance {
  id: string;
  title: string;
  category: 'strategies' | 'environment' | 'reinforcement' | 'troubleshooting';
  content: string;
  tips: string[];
  doList: string[];
  dontList: string[];
  videoResources?: string[];
  handouts?: string[];
}

export interface Adaptation {
  condition: string;
  modification: string;
  rationale: string;
}

export interface ProgressTracking {
  method: 'daily' | 'weekly' | 'per-session';
  metrics: ProgressMetric[];
  parentReporting: boolean;
  therapistReview: boolean;
}

export interface ProgressMetric {
  name: string;
  type: 'count' | 'percentage' | 'rating' | 'yes-no';
  target: number | boolean;
  description: string;
}

export interface HomeProgramProgress {
  prescriptionId: string;
  date: Date;
  exercises: ExerciseProgress[];
  communicationTasks: TaskProgress[];
  parentNotes?: string;
  therapistNotes?: string;
  overallRating?: number; // 1-5
  challenges?: string[];
  successes?: string[];
}

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  repetitionsCompleted: number;
  accuracyPercentage?: number;
  independenceLevel?: string;
  notes?: string;
}

export interface TaskProgress {
  taskId: string;
  completed: boolean;
  successfulTrials: number;
  totalTrials: number;
  promptLevel?: string;
  generalization?: boolean;
  notes?: string;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  category: string;
  ageRange: { min: number; max: number };
  diagnoses: string[];
  exercises: Exercise[];
  communicationTasks: CommunicationTask[];
  frequency: PrescriptionFrequency;
  duration: Omit<PrescriptionDuration, 'startDate'>;
  notes: string;
}

export class PrescriptionManagementService {
  private static instance: PrescriptionManagementService;
  private therapyGoals: ReturnType<typeof getTherapyGoalsService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private dataService: ReturnType<typeof getDataService> | null = null;
  
  private prescriptions: Map<string, TherapyPrescription> = new Map();
  private templates: Map<string, PrescriptionTemplate> = new Map();
  private exerciseLibrary: Map<string, Exercise> = new Map();
  private taskLibrary: Map<string, CommunicationTask> = new Map();
  private progressRecords: Map<string, HomeProgramProgress[]> = new Map();

  private constructor() {
    console.log('PrescriptionManagementService created');
  }

  static getInstance(): PrescriptionManagementService {
    if (!PrescriptionManagementService.instance) {
      PrescriptionManagementService.instance = new PrescriptionManagementService();
    }
    return PrescriptionManagementService.instance;
  }

  async initialize(): Promise<void> {
    this.therapyGoals = getTherapyGoalsService();
    this.analytics = getAnalyticsService();
    this.dataService = getDataService();
    
    // Initialize libraries
    this.initializeExerciseLibrary();
    this.initializeTaskLibrary();
    this.initializeTemplates();
    
    // Load saved data
    this.loadPrescriptionData();
    
    // Start monitoring
    this.startProgressMonitoring();
    
    console.log('PrescriptionManagementService initialized');
  }

  // Create prescription
  createPrescription(
    prescription: Omit<TherapyPrescription, 'id' | 'dateCreated' | 'dateModified'>
  ): TherapyPrescription {
    const newPrescription: TherapyPrescription = {
      ...prescription,
      id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateCreated: new Date(),
      dateModified: new Date()
    };
    
    this.prescriptions.set(newPrescription.id, newPrescription);
    this.savePrescriptionData();
    
    this.analytics?.track('prescription_created', {
      prescriptionId: newPrescription.id,
      type: newPrescription.type,
      exerciseCount: newPrescription.exercises.length,
      taskCount: newPrescription.communicationTasks.length
    });
    
    return newPrescription;
  }

  // Create from template
  createFromTemplate(
    templateId: string,
    patientId: string,
    prescriberId: string,
    customizations?: Partial<TherapyPrescription>
  ): TherapyPrescription | null {
    const template = this.templates.get(templateId);
    if (!template) return null;
    
    const prescription: Omit<TherapyPrescription, 'id' | 'dateCreated' | 'dateModified'> = {
      patientId,
      prescriberId,
      status: 'active',
      type: 'combined',
      frequency: template.frequency,
      duration: {
        ...template.duration,
        startDate: new Date()
      },
      exercises: [...template.exercises],
      communicationTasks: [...template.communicationTasks],
      parentGuidance: [],
      progressTracking: {
        method: 'weekly',
        metrics: this.generateDefaultMetrics(template),
        parentReporting: true,
        therapistReview: true
      },
      notes: template.notes,
      ...customizations
    };
    
    return this.createPrescription(prescription);
  }

  // Update prescription
  updatePrescription(
    prescriptionId: string,
    updates: Partial<TherapyPrescription>
  ): TherapyPrescription | null {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) return null;
    
    const updated = {
      ...prescription,
      ...updates,
      dateModified: new Date()
    };
    
    this.prescriptions.set(prescriptionId, updated);
    this.savePrescriptionData();
    
    this.analytics?.track('prescription_updated', {
      prescriptionId,
      fieldsUpdated: Object.keys(updates)
    });
    
    return updated;
  }

  // Record progress
  recordProgress(progress: HomeProgramProgress): void {
    const prescriptionProgress = this.progressRecords.get(progress.prescriptionId) || [];
    prescriptionProgress.push(progress);
    this.progressRecords.set(progress.prescriptionId, prescriptionProgress);
    
    this.savePrescriptionData();
    
    // Update prescription metrics
    this.updatePrescriptionMetrics(progress);
    
    // Check for alerts
    this.checkProgressAlerts(progress);
    
    this.analytics?.track('home_program_progress_recorded', {
      prescriptionId: progress.prescriptionId,
      completionRate: this.calculateCompletionRate(progress),
      overallRating: progress.overallRating
    });
  }

  // Get prescription
  getPrescription(prescriptionId: string): TherapyPrescription | null {
    return this.prescriptions.get(prescriptionId) || null;
  }

  // Get patient prescriptions
  getPatientPrescriptions(patientId: string): TherapyPrescription[] {
    return Array.from(this.prescriptions.values())
      .filter(p => p.patientId === patientId);
  }

  // Get active prescriptions
  getActivePrescriptions(): TherapyPrescription[] {
    return Array.from(this.prescriptions.values())
      .filter(p => p.status === 'active');
  }

  // Get prescription progress
  getPrescriptionProgress(prescriptionId: string): HomeProgramProgress[] {
    return this.progressRecords.get(prescriptionId) || [];
  }

  // Generate progress report
  generateProgressReport(
    prescriptionId: string,
    startDate: Date,
    endDate: Date
  ): {
    prescription: TherapyPrescription | null;
    progressRecords: HomeProgramProgress[];
    summary: {
      totalSessions: number;
      completionRate: number;
      averageAccuracy: number;
      trendsAnalysis: string[];
      recommendations: string[];
    };
    exerciseAnalysis: Map<string, ExerciseAnalysis>;
    taskAnalysis: Map<string, TaskAnalysis>;
  } {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      return {
        prescription: null,
        progressRecords: [],
        summary: {
          totalSessions: 0,
          completionRate: 0,
          averageAccuracy: 0,
          trendsAnalysis: [],
          recommendations: []
        },
        exerciseAnalysis: new Map(),
        taskAnalysis: new Map()
      };
    }
    
    const records = (this.progressRecords.get(prescriptionId) || [])
      .filter(r => r.date >= startDate && r.date <= endDate);
    
    const summary = this.calculateProgressSummary(records);
    const exerciseAnalysis = this.analyzeExerciseProgress(prescription, records);
    const taskAnalysis = this.analyzeTaskProgress(prescription, records);
    
    return {
      prescription,
      progressRecords: records,
      summary,
      exerciseAnalysis,
      taskAnalysis
    };
  }

  // Get exercise library
  getExerciseLibrary(): Exercise[] {
    return Array.from(this.exerciseLibrary.values());
  }

  // Get task library
  getTaskLibrary(): CommunicationTask[] {
    return Array.from(this.taskLibrary.values());
  }

  // Get templates
  getTemplates(): PrescriptionTemplate[] {
    return Array.from(this.templates.values());
  }

  // Add custom exercise
  addCustomExercise(exercise: Exercise): void {
    this.exerciseLibrary.set(exercise.id, exercise);
    this.savePrescriptionData();
    
    this.analytics?.track('custom_exercise_added', {
      exerciseId: exercise.id,
      category: exercise.category
    });
  }

  // Add custom task
  addCustomTask(task: CommunicationTask): void {
    this.taskLibrary.set(task.id, task);
    this.savePrescriptionData();
    
    this.analytics?.track('custom_task_added', {
      taskId: task.id,
      type: task.type
    });
  }

  // Private methods
  private initializeExerciseLibrary(): void {
    const exercises: Exercise[] = [
      {
        id: 'ex_1',
        name: 'Mirror Speech Sounds',
        category: 'articulation',
        description: 'Practice speech sounds while looking in a mirror',
        instructions: [
          'Sit with child in front of a mirror',
          'Model the target sound clearly',
          'Have child watch and imitate',
          'Provide gentle corrections as needed'
        ],
        materials: ['Hand mirror', 'Sound cards'],
        difficulty: 'beginner',
        targetSounds: ['p', 'b', 'm'],
        repetitions: 10,
        duration: 5
      },
      {
        id: 'ex_2',
        name: 'Bubble Breathing',
        category: 'oral-motor',
        description: 'Breathing exercises using bubbles',
        instructions: [
          'Dip wand in bubble solution',
          'Take deep breath through nose',
          'Slowly blow bubbles',
          'Count bubbles together'
        ],
        materials: ['Bubble solution', 'Bubble wand'],
        difficulty: 'beginner',
        repetitions: 5,
        duration: 10
      },
      {
        id: 'ex_3',
        name: 'Story Retelling',
        category: 'language',
        description: 'Practice narrative skills through story retelling',
        instructions: [
          'Read short story together',
          'Ask child to retell story',
          'Use picture cards as prompts',
          'Expand on child\'s utterances'
        ],
        materials: ['Story books', 'Picture cards'],
        difficulty: 'intermediate',
        repetitions: 1,
        duration: 15
      }
    ];
    
    exercises.forEach(ex => this.exerciseLibrary.set(ex.id, ex));
  }

  private initializeTaskLibrary(): void {
    const tasks: CommunicationTask[] = [
      {
        id: 'task_1',
        name: 'Requesting Snacks',
        type: 'requesting',
        description: 'Practice requesting preferred snacks using AAC',
        goals: [
          'Increase requesting vocabulary',
          'Improve sentence structure',
          'Generalize to different settings'
        ],
        scenarios: [
          {
            title: 'Snack Time',
            description: 'Child requests snack during designated snack time',
            setting: 'Kitchen/Dining room',
            participants: ['Child', 'Parent/Caregiver'],
            prompts: ['What do you want?', 'Show me what you want'],
            expectedResponses: ['I want cookie', 'Cookie please', 'More crackers']
          }
        ],
        targetWords: ['want', 'more', 'please', 'cookie', 'crackers', 'juice'],
        successCriteria: {
          accuracyTarget: 80,
          independenceLevel: 'partial-prompt',
          generalizationRequired: true,
          maintenanceWeeks: 2
        },
        dataCollection: {
          type: 'frequency',
          instructions: 'Record each successful request and prompt level needed'
        }
      },
      {
        id: 'task_2',
        name: 'Social Greetings',
        type: 'social',
        description: 'Practice appropriate greetings in different contexts',
        goals: [
          'Initiate greetings independently',
          'Respond to greetings appropriately',
          'Use appropriate eye contact'
        ],
        scenarios: [
          {
            title: 'Morning Greeting',
            description: 'Greet family members in the morning',
            setting: 'Home',
            participants: ['Child', 'Family members'],
            prompts: ['Say good morning', 'Wave hello'],
            expectedResponses: ['Good morning', 'Hi', 'Hello']
          }
        ],
        targetWords: ['hello', 'hi', 'goodbye', 'morning', 'night'],
        successCriteria: {
          accuracyTarget: 90,
          independenceLevel: 'independent',
          generalizationRequired: true,
          maintenanceWeeks: 4
        },
        dataCollection: {
          type: 'accuracy',
          instructions: 'Track successful greetings and responses'
        }
      }
    ];
    
    tasks.forEach(task => this.taskLibrary.set(task.id, task));
  }

  private initializeTemplates(): void {
    const templates: PrescriptionTemplate[] = [
      {
        id: 'tmpl_1',
        name: 'Early Communication Starter',
        category: 'Beginner AAC',
        ageRange: { min: 2, max: 5 },
        diagnoses: ['Autism', 'Developmental Delay'],
        exercises: [this.exerciseLibrary.get('ex_1')!, this.exerciseLibrary.get('ex_2')!],
        communicationTasks: [this.taskLibrary.get('task_1')!],
        frequency: {
          sessionsPerWeek: 5,
          minutesPerSession: 20
        },
        duration: {
          totalWeeks: 8,
          renewable: true
        },
        notes: 'Focus on basic requesting and early communication skills'
      },
      {
        id: 'tmpl_2',
        name: 'Social Communication Builder',
        category: 'Social Skills',
        ageRange: { min: 5, max: 10 },
        diagnoses: ['Autism', 'Social Communication Disorder'],
        exercises: [this.exerciseLibrary.get('ex_3')!],
        communicationTasks: [this.taskLibrary.get('task_2')!],
        frequency: {
          sessionsPerWeek: 3,
          minutesPerSession: 30
        },
        duration: {
          totalWeeks: 12,
          renewable: true
        },
        notes: 'Emphasis on social interaction and pragmatic language skills'
      }
    ];
    
    templates.forEach(tmpl => this.templates.set(tmpl.id, tmpl));
  }

  private loadPrescriptionData(): void {
    // Load prescriptions
    const savedPrescriptions = localStorage.getItem('therapyPrescriptions');
    if (savedPrescriptions) {
      try {
        const data = JSON.parse(savedPrescriptions);
        data.forEach(([id, prescription]: [string, any]) => {
          // Convert dates
          prescription.dateCreated = new Date(prescription.dateCreated);
          prescription.dateModified = new Date(prescription.dateModified);
          prescription.duration.startDate = new Date(prescription.duration.startDate);
          if (prescription.duration.endDate) {
            prescription.duration.endDate = new Date(prescription.duration.endDate);
          }
          
          this.prescriptions.set(id, prescription);
        });
      } catch (error) {
        console.error('Failed to load prescriptions:', error);
      }
    }
    
    // Load progress records
    const savedProgress = localStorage.getItem('prescriptionProgress');
    if (savedProgress) {
      try {
        const data = JSON.parse(savedProgress);
        Object.entries(data).forEach(([prescriptionId, records]: [string, any]) => {
          const progressRecords = records.map((r: any) => ({
            ...r,
            date: new Date(r.date)
          }));
          this.progressRecords.set(prescriptionId, progressRecords);
        });
      } catch (error) {
        console.error('Failed to load progress records:', error);
      }
    }
  }

  private savePrescriptionData(): void {
    // Save prescriptions
    localStorage.setItem('therapyPrescriptions', JSON.stringify(
      Array.from(this.prescriptions.entries())
    ));
    
    // Save progress records
    const progressData: Record<string, HomeProgramProgress[]> = {};
    this.progressRecords.forEach((records, prescriptionId) => {
      progressData[prescriptionId] = records;
    });
    localStorage.setItem('prescriptionProgress', JSON.stringify(progressData));
  }

  private startProgressMonitoring(): void {
    // Check for missed sessions daily
    setInterval(() => {
      this.checkMissedSessions();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private checkMissedSessions(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.prescriptions.forEach(prescription => {
      if (prescription.status !== 'active') return;
      
      const progress = this.progressRecords.get(prescription.id) || [];
      const lastProgress = progress[progress.length - 1];
      
      if (lastProgress) {
        const daysSinceLastProgress = Math.floor(
          (today.getTime() - lastProgress.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const expectedDays = 7 / prescription.frequency.sessionsPerWeek;
        
        if (daysSinceLastProgress > expectedDays * 2) {
          // Alert about missed sessions
          window.dispatchEvent(new CustomEvent('prescriptionAlert', {
            detail: {
              type: 'missed-sessions',
              prescriptionId: prescription.id,
              daysMissed: daysSinceLastProgress
            }
          }));
        }
      }
    });
  }

  private generateDefaultMetrics(template: PrescriptionTemplate): ProgressMetric[] {
    const metrics: ProgressMetric[] = [
      {
        name: 'Exercises Completed',
        type: 'percentage',
        target: 80,
        description: 'Percentage of prescribed exercises completed'
      },
      {
        name: 'Communication Tasks Success',
        type: 'percentage',
        target: 70,
        description: 'Success rate for communication tasks'
      },
      {
        name: 'Independence Level',
        type: 'rating',
        target: 4,
        description: 'Level of independence (1-5 scale)'
      }
    ];
    
    return metrics;
  }

  private updatePrescriptionMetrics(progress: HomeProgramProgress): void {
    const prescription = this.prescriptions.get(progress.prescriptionId);
    if (!prescription) return;
    
    // Update therapy goals if linked
    const goals = this.therapyGoals?.getPatientGoals(prescription.patientId) || [];
    goals.forEach(goal => {
      const relevantMetric = goal.metrics.find(m => 
        m.name.toLowerCase().includes('home program') ||
        m.name.toLowerCase().includes('prescription')
      );
      
      if (relevantMetric) {
        const completionRate = this.calculateCompletionRate(progress);
        this.therapyGoals?.recordMetricProgress(
          goal.id,
          relevantMetric.id,
          completionRate,
          'Home program progress recorded'
        );
      }
    });
  }

  private checkProgressAlerts(progress: HomeProgramProgress): void {
    const completionRate = this.calculateCompletionRate(progress);
    
    if (completionRate < 50) {
      window.dispatchEvent(new CustomEvent('prescriptionAlert', {
        detail: {
          type: 'low-completion',
          prescriptionId: progress.prescriptionId,
          completionRate
        }
      }));
    }
    
    if (progress.challenges && progress.challenges.length > 2) {
      window.dispatchEvent(new CustomEvent('prescriptionAlert', {
        detail: {
          type: 'multiple-challenges',
          prescriptionId: progress.prescriptionId,
          challenges: progress.challenges
        }
      }));
    }
  }

  private calculateCompletionRate(progress: HomeProgramProgress): number {
    const exerciseCompletion = progress.exercises.filter(e => e.completed).length / 
      progress.exercises.length || 0;
    const taskCompletion = progress.communicationTasks.filter(t => t.completed).length / 
      progress.communicationTasks.length || 0;
    
    return Math.round(((exerciseCompletion + taskCompletion) / 2) * 100);
  }

  private calculateProgressSummary(records: HomeProgramProgress[]): any {
    if (records.length === 0) {
      return {
        totalSessions: 0,
        completionRate: 0,
        averageAccuracy: 0,
        trendsAnalysis: ['No data available'],
        recommendations: ['Continue collecting progress data']
      };
    }
    
    const totalSessions = records.length;
    
    const completionRates = records.map(r => this.calculateCompletionRate(r));
    const averageCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
    
    const accuracies = records.flatMap(r => 
      r.exercises
        .filter(e => e.accuracyPercentage !== undefined)
        .map(e => e.accuracyPercentage!)
    );
    const averageAccuracy = accuracies.length > 0
      ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
      : 0;
    
    const trendsAnalysis = this.analyzeTrends(records);
    const recommendations = this.generateRecommendations(records, averageCompletion, averageAccuracy);
    
    return {
      totalSessions,
      completionRate: Math.round(averageCompletion),
      averageAccuracy: Math.round(averageAccuracy),
      trendsAnalysis,
      recommendations
    };
  }

  private analyzeTrends(records: HomeProgramProgress[]): string[] {
    const trends: string[] = [];
    
    if (records.length < 3) {
      trends.push('Insufficient data for trend analysis');
      return trends;
    }
    
    // Completion trend
    const recentCompletion = records.slice(-3).map(r => this.calculateCompletionRate(r));
    const avgRecent = recentCompletion.reduce((a, b) => a + b, 0) / 3;
    const earlyCompletion = records.slice(0, 3).map(r => this.calculateCompletionRate(r));
    const avgEarly = earlyCompletion.reduce((a, b) => a + b, 0) / 3;
    
    if (avgRecent > avgEarly + 10) {
      trends.push('Improving completion rates over time');
    } else if (avgRecent < avgEarly - 10) {
      trends.push('Declining completion rates - may need adjustment');
    } else {
      trends.push('Stable completion rates');
    }
    
    // Challenge patterns
    const recentChallenges = records.slice(-5).flatMap(r => r.challenges || []);
    if (recentChallenges.length > 10) {
      trends.push('Frequent challenges reported - consider program modification');
    }
    
    return trends;
  }

  private generateRecommendations(
    records: HomeProgramProgress[],
    completionRate: number,
    accuracy: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (completionRate < 60) {
      recommendations.push('Consider reducing session length or frequency');
      recommendations.push('Review exercises for difficulty level');
    }
    
    if (accuracy < 70) {
      recommendations.push('Focus on accuracy before increasing difficulty');
      recommendations.push('Consider additional modeling and practice');
    }
    
    if (completionRate > 90 && accuracy > 85) {
      recommendations.push('Consider advancing to more challenging exercises');
      recommendations.push('Explore generalization opportunities');
    }
    
    return recommendations;
  }

  private analyzeExerciseProgress(
    prescription: TherapyPrescription,
    records: HomeProgramProgress[]
  ): Map<string, ExerciseAnalysis> {
    const analysis = new Map<string, ExerciseAnalysis>();
    
    prescription.exercises.forEach(exercise => {
      const exerciseRecords = records.flatMap(r => 
        r.exercises.filter(e => e.exerciseId === exercise.id)
      );
      
      if (exerciseRecords.length === 0) return;
      
      const completionRate = exerciseRecords.filter(e => e.completed).length / 
        exerciseRecords.length * 100;
      
      const accuracies = exerciseRecords
        .filter(e => e.accuracyPercentage !== undefined)
        .map(e => e.accuracyPercentage!);
      
      const averageAccuracy = accuracies.length > 0
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : 0;
      
      analysis.set(exercise.id, {
        exerciseName: exercise.name,
        attemptsCount: exerciseRecords.length,
        completionRate,
        averageAccuracy,
        commonChallenges: this.extractCommonNotes(exerciseRecords)
      });
    });
    
    return analysis;
  }

  private analyzeTaskProgress(
    prescription: TherapyPrescription,
    records: HomeProgramProgress[]
  ): Map<string, TaskAnalysis> {
    const analysis = new Map<string, TaskAnalysis>();
    
    prescription.communicationTasks.forEach(task => {
      const taskRecords = records.flatMap(r => 
        r.communicationTasks.filter(t => t.taskId === task.id)
      );
      
      if (taskRecords.length === 0) return;
      
      const completionRate = taskRecords.filter(t => t.completed).length / 
        taskRecords.length * 100;
      
      const successRates = taskRecords.map(t => 
        t.totalTrials > 0 ? (t.successfulTrials / t.totalTrials) * 100 : 0
      );
      
      const averageSuccess = successRates.reduce((a, b) => a + b, 0) / successRates.length;
      
      analysis.set(task.id, {
        taskName: task.name,
        attemptsCount: taskRecords.length,
        completionRate,
        averageSuccessRate: averageSuccess,
        generalizationAchieved: taskRecords.some(t => t.generalization === true)
      });
    });
    
    return analysis;
  }

  private extractCommonNotes(records: any[]): string[] {
    const notes = records
      .filter(r => r.notes)
      .map(r => r.notes!.toLowerCase());
    
    // Simple frequency analysis
    const noteFrequency = new Map<string, number>();
    notes.forEach(note => {
      const words = note.split(/\s+/);
      words.forEach(word => {
        if (word.length > 4) { // Skip short words
          noteFrequency.set(word, (noteFrequency.get(word) || 0) + 1);
        }
      });
    });
    
    // Return most common terms
    return Array.from(noteFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }
}

// Type definitions for analysis results
interface ExerciseAnalysis {
  exerciseName: string;
  attemptsCount: number;
  completionRate: number;
  averageAccuracy: number;
  commonChallenges: string[];
}

interface TaskAnalysis {
  taskName: string;
  attemptsCount: number;
  completionRate: number;
  averageSuccessRate: number;
  generalizationAchieved: boolean;
}

// Singleton getter
export function getPrescriptionManagementService(): PrescriptionManagementService {
  return PrescriptionManagementService.getInstance();
}