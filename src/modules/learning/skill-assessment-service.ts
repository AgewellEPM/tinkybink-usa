// Module 23: Skill Assessment Service
// Evaluates communication skills using existing tile interactions

import { getDataService } from '../core/data-service';
import { getSessionTrackingService } from '../ui/session-tracking-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getSpeechService } from '../core/speech-service';

export interface SkillAssessment {
  id: string;
  name: string;
  category: 'vocabulary' | 'comprehension' | 'expression' | 'social' | 'motor' | 'cognitive';
  ageRange: { min: number; max: number };
  description: string;
  tasks: AssessmentTask[];
  scoring: ScoringCriteria;
  duration: number; // minutes
}

export interface AssessmentTask {
  id: string;
  type: 'selection' | 'identification' | 'imitation' | 'spontaneous' | 'comprehension';
  instruction: string;
  stimulus: string; // What to show/say
  correctResponse: string;
  acceptableResponses: string[];
  tiles: TaskTile[];
  timeLimit?: number;
  scoringWeight: number;
}

export interface TaskTile {
  id: string;
  emoji: string;
  text: string;
  isCorrect: boolean;
  isDistractor: boolean;
}

export interface ScoringCriteria {
  maxScore: number;
  passingScore: number;
  skillLevels: SkillLevel[];
}

export interface SkillLevel {
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  recommendations: string[];
}

export interface AssessmentSession {
  assessmentId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  responses: TaskResponse[];
  rawScore: number;
  percentileScore: number;
  skillLevel: string;
  completed: boolean;
  notes: string[];
}

export interface TaskResponse {
  taskId: string;
  response: string;
  correct: boolean;
  reactionTime: number;
  attempts: number;
  timestamp: Date;
  notes?: string;
}

export interface SkillProfile {
  userId: string;
  assessments: Map<string, AssessmentResult>;
  overallLevel: string;
  strengths: string[];
  challengeAreas: string[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  percentile: number;
  skillLevel: string;
  dateCompleted: Date;
  notes: string[];
}

export class SkillAssessmentService {
  private static instance: SkillAssessmentService;
  private dataService: ReturnType<typeof getDataService> | null = null;
  private sessionTracking: ReturnType<typeof getSessionTrackingService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private speechService: ReturnType<typeof getSpeechService> | null = null;
  
  private assessments: Map<string, SkillAssessment> = new Map();
  private currentSession: AssessmentSession | null = null;
  private currentTask = 0;
  private skillProfiles: Map<string, SkillProfile> = new Map();

  private constructor() {
    console.log('SkillAssessmentService created');
  }

  static getInstance(): SkillAssessmentService {
    if (!SkillAssessmentService.instance) {
      SkillAssessmentService.instance = new SkillAssessmentService();
    }
    return SkillAssessmentService.instance;
  }

  async initialize(): Promise<void> {
    this.dataService = getDataService();
    this.sessionTracking = getSessionTrackingService();
    this.analytics = getAnalyticsService();
    this.speechService = getSpeechService();
    
    // Initialize assessment battery
    this.initializeAssessments();
    
    // Load saved profiles
    this.loadSkillProfiles();
    
    console.log('SkillAssessmentService initialized');
  }

  // Get available assessments
  getAvailableAssessments(userAge?: number): SkillAssessment[] {
    const assessments = Array.from(this.assessments.values());
    
    if (userAge) {
      return assessments.filter(a => 
        userAge >= a.ageRange.min && userAge <= a.ageRange.max
      );
    }
    
    return assessments;
  }

  // Start assessment - uses existing tile system
  startAssessment(assessmentId: string, userId: string): boolean {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment || this.currentSession) return false;
    
    this.currentSession = {
      assessmentId,
      userId,
      startTime: new Date(),
      responses: [],
      rawScore: 0,
      percentileScore: 0,
      skillLevel: '',
      completed: false,
      notes: []
    };
    
    this.currentTask = 0;
    
    // Start first task
    this.presentTask(assessment.tasks[0]);
    
    this.analytics?.track('assessment_started', {
      assessmentId,
      assessmentName: assessment.name,
      userId
    });
    
    return true;
  }

  // Handle tile press during assessment
  handleAssessmentResponse(tileId: string): boolean {
    if (!this.currentSession) return false;
    
    const assessment = this.assessments.get(this.currentSession.assessmentId);
    if (!assessment) return false;
    
    const currentTaskData = assessment.tasks[this.currentTask];
    if (!currentTaskData) return false;
    
    const tile = currentTaskData.tiles.find(t => t.id === tileId);
    if (!tile) return false;
    
    const response: TaskResponse = {
      taskId: currentTaskData.id,
      response: tile.text,
      correct: tile.isCorrect,
      reactionTime: Date.now() - this.currentSession.startTime.getTime(),
      attempts: 1, // Would track multiple attempts
      timestamp: new Date()
    };
    
    this.currentSession.responses.push(response);
    
    // Provide feedback
    if (tile.isCorrect) {
      this.speechService?.speak('Good job!');
    } else {
      this.speechService?.speak('Let\'s try the next one');
    }
    
    // Move to next task
    this.currentTask++;
    
    if (this.currentTask >= assessment.tasks.length) {
      this.completeAssessment();
    } else {
      this.presentTask(assessment.tasks[this.currentTask]);
    }
    
    return tile.isCorrect;
  }

  // Get current assessment session
  getCurrentAssessment(): AssessmentSession | null {
    return this.currentSession;
  }

  // Get skill profile for user
  getSkillProfile(userId: string): SkillProfile | null {
    return this.skillProfiles.get(userId) || null;
  }

  // Generate assessment report
  generateAssessmentReport(userId: string): {
    profile: SkillProfile | null;
    recommendations: string[];
    nextSteps: string[];
    strengths: string[];
    challenges: string[];
  } {
    const profile = this.skillProfiles.get(userId);
    
    if (!profile) {
      return {
        profile: null,
        recommendations: ['Complete initial assessments to establish baseline'],
        nextSteps: ['Start with vocabulary assessment'],
        strengths: [],
        challenges: []
      };
    }
    
    return {
      profile,
      recommendations: profile.recommendations,
      nextSteps: this.generateNextSteps(profile),
      strengths: profile.strengths,
      challenges: profile.challengeAreas
    };
  }

  // Recommend next assessments
  recommendNextAssessments(userId: string): SkillAssessment[] {
    const profile = this.skillProfiles.get(userId);
    if (!profile) {
      // Return basic starting assessments
      return this.getAvailableAssessments().slice(0, 2);
    }
    
    // Find areas needing assessment
    const completedCategories = new Set(
      Array.from(profile.assessments.values()).map(result => {
        const assessment = this.assessments.get(result.assessmentId);
        return assessment?.category;
      }).filter(Boolean)
    );
    
    const allCategories = new Set(
      Array.from(this.assessments.values()).map(a => a.category)
    );
    
    // Find missing categories
    const missingCategories = Array.from(allCategories)
      .filter(cat => !completedCategories.has(cat));
    
    return Array.from(this.assessments.values())
      .filter(a => missingCategories.includes(a.category))
      .slice(0, 3);
  }

  // Private methods
  private initializeAssessments(): void {
    const assessments: SkillAssessment[] = [
      {
        id: 'assess_vocab',
        name: 'Vocabulary Assessment',
        category: 'vocabulary',
        ageRange: { min: 2, max: 12 },
        description: 'Assesses receptive and expressive vocabulary',
        duration: 15,
        tasks: [
          {
            id: 'vocab_1',
            type: 'identification',
            instruction: 'Point to the apple',
            stimulus: 'apple',
            correctResponse: 'apple',
            acceptableResponses: ['apple', 'red apple'],
            scoringWeight: 1,
            tiles: [
              { id: 'v1', emoji: '🍎', text: 'Apple', isCorrect: true, isDistractor: false },
              { id: 'v2', emoji: '🍌', text: 'Banana', isCorrect: false, isDistractor: true },
              { id: 'v3', emoji: '🍇', text: 'Grapes', isCorrect: false, isDistractor: true }
            ]
          },
          {
            id: 'vocab_2',
            type: 'identification',
            instruction: 'Show me the dog',
            stimulus: 'dog',
            correctResponse: 'dog',
            acceptableResponses: ['dog', 'puppy'],
            scoringWeight: 1,
            tiles: [
              { id: 'v4', emoji: '🐶', text: 'Dog', isCorrect: true, isDistractor: false },
              { id: 'v5', emoji: '🐱', text: 'Cat', isCorrect: false, isDistractor: true },
              { id: 'v6', emoji: '🐰', text: 'Rabbit', isCorrect: false, isDistractor: true }
            ]
          }
        ],
        scoring: {
          maxScore: 20,
          passingScore: 14,
          skillLevels: [
            {
              name: 'Emerging',
              minScore: 0,
              maxScore: 7,
              description: 'Beginning vocabulary development',
              recommendations: ['Focus on basic nouns', 'Use visual supports']
            },
            {
              name: 'Developing',
              minScore: 8,
              maxScore: 14,
              description: 'Expanding vocabulary knowledge',
              recommendations: ['Introduce action words', 'Practice in different contexts']
            },
            {
              name: 'Proficient',
              minScore: 15,
              maxScore: 20,
              description: 'Strong vocabulary skills',
              recommendations: ['Work on complex vocabulary', 'Focus on categories']
            }
          ]
        }
      },
      {
        id: 'assess_comprehension',
        name: 'Comprehension Assessment',
        category: 'comprehension',
        ageRange: { min: 3, max: 15 },
        description: 'Evaluates understanding of spoken language',
        duration: 20,
        tasks: [
          {
            id: 'comp_1',
            type: 'comprehension',
            instruction: 'Show me what you use to eat',
            stimulus: 'eating utensil',
            correctResponse: 'spoon',
            acceptableResponses: ['spoon', 'fork', 'knife'],
            scoringWeight: 1.5,
            tiles: [
              { id: 'c1', emoji: '🥄', text: 'Spoon', isCorrect: true, isDistractor: false },
              { id: 'c2', emoji: '👕', text: 'Shirt', isCorrect: false, isDistractor: true },
              { id: 'c3', emoji: '📚', text: 'Book', isCorrect: false, isDistractor: true }
            ]
          }
        ],
        scoring: {
          maxScore: 25,
          passingScore: 18,
          skillLevels: [
            {
              name: 'Emerging',
              minScore: 0,
              maxScore: 10,
              description: 'Basic comprehension skills',
              recommendations: ['Use simple instructions', 'Provide visual cues']
            },
            {
              name: 'Developing',
              minScore: 11,
              maxScore: 18,
              description: 'Growing comprehension abilities',
              recommendations: ['Practice following directions', 'Expand complexity gradually']
            },
            {
              name: 'Proficient', 
              minScore: 19,
              maxScore: 25,
              description: 'Strong comprehension skills',
              recommendations: ['Work on abstract concepts', 'Practice inferencing']
            }
          ]
        }
      }
    ];
    
    assessments.forEach(assessment => {
      this.assessments.set(assessment.id, assessment);
    });
  }

  private presentTask(task: AssessmentTask): void {
    if (!this.currentSession) return;
    
    // Switch to assessment mode with task tiles
    this.dataService?.setGameMode(true, task.tiles);
    
    // Give instruction
    this.speechService?.speak(task.instruction);
    
    // Add visual instruction if needed
    window.dispatchEvent(new CustomEvent('showAssessmentInstruction', {
      detail: { instruction: task.instruction }
    }));
  }

  private completeAssessment(): void {
    if (!this.currentSession) return;
    
    const assessment = this.assessments.get(this.currentSession.assessmentId);
    if (!assessment) return;
    
    this.currentSession.endTime = new Date();
    this.currentSession.completed = true;
    
    // Calculate scores
    this.calculateScores(assessment);
    
    // Update skill profile
    this.updateSkillProfile(this.currentSession);
    
    // Exit assessment mode
    this.dataService?.setGameMode(false);
    
    // Provide results feedback
    const feedback = this.generateResultsFeedback(this.currentSession, assessment);
    this.speechService?.speak(feedback);
    
    this.analytics?.track('assessment_completed', {
      assessmentId: this.currentSession.assessmentId,
      userId: this.currentSession.userId,
      rawScore: this.currentSession.rawScore,
      skillLevel: this.currentSession.skillLevel
    });
    
    this.currentSession = null;
    this.currentTask = 0;
  }

  private calculateScores(assessment: SkillAssessment): void {
    if (!this.currentSession) return;
    
    // Calculate raw score
    let totalScore = 0;
    let maxPossible = 0;
    
    this.currentSession.responses.forEach(response => {
      const task = assessment.tasks.find(t => t.id === response.taskId);
      if (task) {
        maxPossible += task.scoringWeight;
        if (response.correct) {
          totalScore += task.scoringWeight;
        }
      }
    });
    
    this.currentSession.rawScore = totalScore;
    this.currentSession.percentileScore = maxPossible > 0 
      ? Math.round((totalScore / maxPossible) * 100) 
      : 0;
    
    // Determine skill level
    const level = assessment.scoring.skillLevels.find(level => 
      totalScore >= level.minScore && totalScore <= level.maxScore
    );
    
    this.currentSession.skillLevel = level?.name || 'Unknown';
  }

  private updateSkillProfile(session: AssessmentSession): void {
    const userId = session.userId;
    let profile = this.skillProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        assessments: new Map(),
        overallLevel: 'Unknown',
        strengths: [],
        challengeAreas: [],
        recommendations: [],
        lastUpdated: new Date()
      };
    }
    
    // Add assessment result
    const result: AssessmentResult = {
      assessmentId: session.assessmentId,
      score: session.rawScore,
      percentile: session.percentileScore,
      skillLevel: session.skillLevel,
      dateCompleted: session.endTime || new Date(),
      notes: session.notes
    };
    
    profile.assessments.set(session.assessmentId, result);
    profile.lastUpdated = new Date();
    
    // Update overall analysis
    this.analyzeSkillProfile(profile);
    
    this.skillProfiles.set(userId, profile);
    this.saveSkillProfiles();
  }

  private analyzeSkillProfile(profile: SkillProfile): void {
    const results = Array.from(profile.assessments.values());
    
    if (results.length === 0) return;
    
    // Calculate overall level
    const avgPercentile = results.reduce((sum, r) => sum + r.percentile, 0) / results.length;
    
    if (avgPercentile >= 80) {
      profile.overallLevel = 'Proficient';
    } else if (avgPercentile >= 60) {
      profile.overallLevel = 'Developing';
    } else {
      profile.overallLevel = 'Emerging';
    }
    
    // Identify strengths and challenges
    profile.strengths = results
      .filter(r => r.percentile >= 75)
      .map(r => {
        const assessment = this.assessments.get(r.assessmentId);
        return assessment?.category || 'Unknown';
      })
      .filter(Boolean);
    
    profile.challengeAreas = results
      .filter(r => r.percentile < 50)
      .map(r => {
        const assessment = this.assessments.get(r.assessmentId);
        return assessment?.category || 'Unknown';
      })
      .filter(Boolean);
    
    // Generate recommendations
    profile.recommendations = this.generateRecommendations(profile);
  }

  private generateRecommendations(profile: SkillProfile): string[] {
    const recommendations: string[] = [];
    
    // Based on challenge areas
    if (profile.challengeAreas.includes('vocabulary')) {
      recommendations.push('Focus on expanding vocabulary through daily practice');
      recommendations.push('Use visual supports and repetition for new words');
    }
    
    if (profile.challengeAreas.includes('comprehension')) {
      recommendations.push('Practice following simple directions');
      recommendations.push('Use gestures and visual cues to support understanding');
    }
    
    // Based on strengths
    if (profile.strengths.includes('vocabulary')) {
      recommendations.push('Continue building on strong vocabulary skills');
    }
    
    // General recommendations
    if (profile.overallLevel === 'Emerging') {
      recommendations.push('Focus on foundational communication skills');
      recommendations.push('Use consistent routines and visual supports');
    }
    
    return recommendations.slice(0, 5); // Limit to top 5
  }

  private generateNextSteps(profile: SkillProfile): string[] {
    const nextSteps: string[] = [];
    
    // Based on missing assessments
    const completedCategories = Array.from(profile.assessments.values())
      .map(r => this.assessments.get(r.assessmentId)?.category)
      .filter(Boolean);
    
    const allCategories = ['vocabulary', 'comprehension', 'expression', 'social'];
    const missing = allCategories.filter(cat => !completedCategories.includes(cat));
    
    missing.forEach(category => {
      nextSteps.push(`Complete ${category} assessment`);
    });
    
    // Based on challenge areas
    profile.challengeAreas.forEach(area => {
      nextSteps.push(`Focus therapy on ${area} skills`);
    });
    
    return nextSteps.slice(0, 3);
  }

  private generateResultsFeedback(session: AssessmentSession, assessment: SkillAssessment): string {
    const percentile = session.percentileScore;
    const level = session.skillLevel;
    
    if (percentile >= 80) {
      return `Excellent work! You scored ${percentile}% on the ${assessment.name}. Your skills are at the ${level} level.`;
    } else if (percentile >= 60) {
      return `Good job! You scored ${percentile}% on the ${assessment.name}. You're at the ${level} level with room to grow.`;
    } else {
      return `You completed the ${assessment.name} and scored ${percentile}%. We'll work together to build these ${level} level skills.`;
    }
  }

  private loadSkillProfiles(): void {
    const saved = localStorage.getItem('skillProfiles');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([userId, profileData]: [string, any]) => {
          // Restore Map objects
          const profile: SkillProfile = {
            ...profileData,
            assessments: new Map(Object.entries(profileData.assessments || {})),
            lastUpdated: new Date(profileData.lastUpdated)
          };
          
          // Convert assessment result dates
          profile.assessments.forEach((result: any) => {
            result.dateCompleted = new Date(result.dateCompleted);
          });
          
          this.skillProfiles.set(userId, profile);
        });
      } catch (error) {
        console.error('Failed to load skill profiles:', error);
      }
    }
  }

  private saveSkillProfiles(): void {
    const data: Record<string, any> = {};
    
    this.skillProfiles.forEach((profile, userId) => {
      data[userId] = {
        ...profile,
        assessments: Object.fromEntries(profile.assessments)
      };
    });
    
    localStorage.setItem('skillProfiles', JSON.stringify(data));
  }
}

// Singleton getter
export function getSkillAssessmentService(): SkillAssessmentService {
  return SkillAssessmentService.getInstance();
}