// Module 22: Memory Training Service
// Integrates with existing tile system for memory exercises

import { getDataService } from '../core/data-service';
import { getSpeechService } from '../core/speech-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getEducationalGamesService } from './educational-games-service';

export interface MemoryExercise {
  id: string;
  name: string;
  type: 'sequence' | 'pattern' | 'spatial' | 'verbal' | 'visual';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // seconds
  instructions: string;
  tiles: MemoryTile[];
}

export interface MemoryTile {
  id: string;
  emoji: string;
  text: string;
  position: number;
  showTime: number;
  isTarget: boolean;
}

export interface MemorySession {
  exerciseId: string;
  startTime: Date;
  responses: MemoryResponse[];
  completed: boolean;
  score: number;
  accuracy: number;
  reactionTime: number;
}

export interface MemoryResponse {
  tileId: string;
  timestamp: Date;
  correct: boolean;
  reactionTime: number;
}

export interface MemoryProgress {
  exerciseId: string;
  sessionsCompleted: number;
  averageScore: number;
  bestAccuracy: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastSession: Date;
  difficultyLevel: string;
}

export class MemoryTrainingService {
  private static instance: MemoryTrainingService;
  private dataService: ReturnType<typeof getDataService> | null = null;
  private speechService: ReturnType<typeof getSpeechService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private gamesService: ReturnType<typeof getEducationalGamesService> | null = null;
  
  private exercises: Map<string, MemoryExercise> = new Map();
  private currentSession: MemorySession | null = null;
  private progress: Map<string, MemoryProgress> = new Map();
  private sequenceToRemember: MemoryTile[] = [];
  private currentStep = 0;
  private showingSequence = false;

  private constructor() {
    console.log('MemoryTrainingService created');
  }

  static getInstance(): MemoryTrainingService {
    if (!MemoryTrainingService.instance) {
      MemoryTrainingService.instance = new MemoryTrainingService();
    }
    return MemoryTrainingService.instance;
  }

  async initialize(): Promise<void> {
    this.dataService = getDataService();
    this.speechService = getSpeechService();
    this.analytics = getAnalyticsService();
    this.gamesService = getEducationalGamesService();
    
    // Initialize memory exercises
    this.initializeExercises();
    
    // Load saved progress
    this.loadProgress();
    
    console.log('MemoryTrainingService initialized');
  }

  // Get available exercises
  getAvailableExercises(): MemoryExercise[] {
    return Array.from(this.exercises.values());
  }

  // Start memory exercise - uses existing tile system
  startMemoryExercise(exerciseId: string): boolean {
    const exercise = this.exercises.get(exerciseId);
    if (!exercise) return false;
    
    this.currentSession = {
      exerciseId,
      startTime: new Date(),
      responses: [],
      completed: false,
      score: 0,
      accuracy: 0,
      reactionTime: 0
    };
    
    this.currentStep = 0;
    this.sequenceToRemember = [...exercise.tiles];
    
    // Switch to game mode with memory tiles
    this.dataService?.setGameMode(true, exercise.tiles);
    
    // Start the sequence
    this.speechService?.speak(`Starting ${exercise.name}. ${exercise.instructions}`);
    this.showSequence(exercise);
    
    this.analytics?.track('memory_exercise_started', {
      exerciseId,
      exerciseName: exercise.name,
      difficulty: exercise.difficulty
    });
    
    return true;
  }

  // Handle tile press during memory exercise
  handleMemoryTilePress(tileId: string): boolean {
    if (!this.currentSession || this.showingSequence) return false;
    
    const responseTime = Date.now();
    const expectedTile = this.sequenceToRemember[this.currentStep];
    const isCorrect = expectedTile && expectedTile.id === tileId;
    
    const response: MemoryResponse = {
      tileId,
      timestamp: new Date(responseTime),
      correct: isCorrect,
      reactionTime: responseTime - this.currentSession.startTime.getTime()
    };
    
    this.currentSession.responses.push(response);
    
    if (isCorrect) {
      this.speechService?.speak('Correct!');
      this.currentStep++;
      
      // Check if sequence complete
      if (this.currentStep >= this.sequenceToRemember.length) {
        this.completeMemoryExercise();
      } else {
        // Continue to next tile
        this.speechService?.speak('Good! What\'s next?');
      }
    } else {
      this.speechService?.speak('Try again!');
      // Reset or end exercise based on difficulty
      this.handleIncorrectResponse();
    }
    
    return isCorrect;
  }

  // Get current memory session
  getCurrentMemorySession(): MemorySession | null {
    return this.currentSession;
  }

  // Get memory progress for exercise
  getMemoryProgress(exerciseId: string): MemoryProgress | null {
    return this.progress.get(exerciseId) || null;
  }

  // Get all memory progress
  getAllMemoryProgress(): Map<string, MemoryProgress> {
    return new Map(this.progress);
  }

  // Generate memory training schedule
  generateTrainingSchedule(userAge: number, currentLevel: string): MemoryExercise[] {
    const exercises = Array.from(this.exercises.values());
    
    // Filter by age appropriateness and difficulty
    let suitable = exercises.filter(ex => {
      if (userAge < 5) return ex.difficulty === 'beginner';
      if (userAge < 10) return ex.difficulty !== 'advanced';
      return true;
    });
    
    // Sort by current performance
    suitable.sort((a, b) => {
      const progressA = this.progress.get(a.id);
      const progressB = this.progress.get(b.id);
      
      if (!progressA && !progressB) return 0;
      if (!progressA) return -1;
      if (!progressB) return 1;
      
      return progressA.averageScore - progressB.averageScore;
    });
    
    return suitable.slice(0, 5); // Return top 5 recommended exercises
  }

  // Private methods
  private initializeExercises(): void {
    const exercises: MemoryExercise[] = [
      {
        id: 'mem_1',
        name: 'Sequence Memory',
        type: 'sequence',
        difficulty: 'beginner',
        duration: 30,
        instructions: 'Watch the sequence, then tap the tiles in the same order',
        tiles: [
          { id: 'seq1', emoji: '🔴', text: 'Red', position: 1, showTime: 1000, isTarget: true },
          { id: 'seq2', emoji: '🔵', text: 'Blue', position: 2, showTime: 1000, isTarget: true },
          { id: 'seq3', emoji: '🟢', text: 'Green', position: 3, showTime: 1000, isTarget: true }
        ]
      },
      {
        id: 'mem_2',
        name: 'Pattern Recognition',
        type: 'pattern',
        difficulty: 'intermediate',
        duration: 45,
        instructions: 'Study the pattern, then recreate it',
        tiles: [
          { id: 'pat1', emoji: '⭐', text: 'Star', position: 1, showTime: 2000, isTarget: true },
          { id: 'pat2', emoji: '❤️', text: 'Heart', position: 2, showTime: 2000, isTarget: false },
          { id: 'pat3', emoji: '⭐', text: 'Star', position: 3, showTime: 2000, isTarget: true },
          { id: 'pat4', emoji: '❤️', text: 'Heart', position: 4, showTime: 2000, isTarget: false }
        ]
      },
      {
        id: 'mem_3',
        name: 'Spatial Memory',
        type: 'spatial',
        difficulty: 'intermediate',
        duration: 60,
        instructions: 'Remember where each item was located',
        tiles: [
          { id: 'spa1', emoji: '🍎', text: 'Apple', position: 1, showTime: 3000, isTarget: true },
          { id: 'spa2', emoji: '🍌', text: 'Banana', position: 5, showTime: 3000, isTarget: true },
          { id: 'spa3', emoji: '🍇', text: 'Grapes', position: 9, showTime: 3000, isTarget: true }
        ]
      },
      {
        id: 'mem_4',
        name: 'Working Memory',
        type: 'verbal',
        difficulty: 'advanced',
        duration: 90,
        instructions: 'Listen to the words, then select them in reverse order',
        tiles: [
          { id: 'work1', emoji: '🐶', text: 'Dog', position: 1, showTime: 2000, isTarget: true },
          { id: 'work2', emoji: '🐱', text: 'Cat', position: 2, showTime: 2000, isTarget: true },
          { id: 'work3', emoji: '🐰', text: 'Rabbit', position: 3, showTime: 2000, isTarget: true },
          { id: 'work4', emoji: '🐸', text: 'Frog', position: 4, showTime: 2000, isTarget: true }
        ]
      }
    ];
    
    exercises.forEach(ex => this.exercises.set(ex.id, ex));
  }

  private showSequence(exercise: MemoryExercise): void {
    this.showingSequence = true;
    let currentIndex = 0;
    
    const showNextTile = () => {
      if (currentIndex >= exercise.tiles.length) {
        this.showingSequence = false;
        this.speechService?.speak('Now repeat the sequence!');
        return;
      }
      
      const tile = exercise.tiles[currentIndex];
      
      // Highlight tile (would need UI integration)
      this.highlightTile(tile.id);
      
      setTimeout(() => {
        this.unhighlightTile(tile.id);
        currentIndex++;
        showNextTile();
      }, tile.showTime);
    };
    
    showNextTile();
  }

  private highlightTile(tileId: string): void {
    // Dispatch event for UI to highlight tile
    window.dispatchEvent(new CustomEvent('highlightMemoryTile', { 
      detail: { tileId, highlight: true } 
    }));
  }

  private unhighlightTile(tileId: string): void {
    // Dispatch event for UI to unhighlight tile
    window.dispatchEvent(new CustomEvent('highlightMemoryTile', { 
      detail: { tileId, highlight: false } 
    }));
  }

  private handleIncorrectResponse(): void {
    if (!this.currentSession) return;
    
    const exercise = this.exercises.get(this.currentSession.exerciseId);
    if (!exercise) return;
    
    if (exercise.difficulty === 'beginner') {
      // Give another chance
      this.speechService?.speak('Let me show you again');
      this.currentStep = 0;
      this.showSequence(exercise);
    } else {
      // End exercise
      this.completeMemoryExercise();
    }
  }

  private completeMemoryExercise(): void {
    if (!this.currentSession) return;
    
    this.currentSession.completed = true;
    
    // Calculate metrics
    const correct = this.currentSession.responses.filter(r => r.correct).length;
    const total = this.currentSession.responses.length;
    
    this.currentSession.accuracy = total > 0 ? (correct / total) * 100 : 0;
    this.currentSession.score = Math.round(this.currentSession.accuracy * 10);
    
    const avgReactionTime = this.currentSession.responses.length > 0
      ? this.currentSession.responses.reduce((sum, r) => sum + r.reactionTime, 0) / this.currentSession.responses.length
      : 0;
    this.currentSession.reactionTime = avgReactionTime;
    
    // Update progress
    this.updateMemoryProgress(this.currentSession);
    
    // Exit game mode
    this.dataService?.setGameMode(false);
    
    // Provide feedback
    const feedback = this.generateFeedback(this.currentSession);
    this.speechService?.speak(feedback);
    
    this.analytics?.track('memory_exercise_completed', {
      exerciseId: this.currentSession.exerciseId,
      score: this.currentSession.score,
      accuracy: this.currentSession.accuracy,
      reactionTime: avgReactionTime
    });
    
    this.currentSession = null;
    this.currentStep = 0;
  }

  private updateMemoryProgress(session: MemorySession): void {
    const existing = this.progress.get(session.exerciseId) || {
      exerciseId: session.exerciseId,
      sessionsCompleted: 0,
      averageScore: 0,
      bestAccuracy: 0,
      improvementTrend: 'stable' as const,
      lastSession: new Date(),
      difficultyLevel: 'beginner'
    };
    
    existing.sessionsCompleted++;
    existing.lastSession = new Date();
    existing.bestAccuracy = Math.max(existing.bestAccuracy, session.accuracy);
    existing.averageScore = (existing.averageScore * (existing.sessionsCompleted - 1) + session.score) / existing.sessionsCompleted;
    
    // Determine trend
    if (existing.sessionsCompleted >= 3) {
      const recentSessions = 3; // Would track last 3 sessions
      if (session.score > existing.averageScore * 1.1) {
        existing.improvementTrend = 'improving';
      } else if (session.score < existing.averageScore * 0.9) {
        existing.improvementTrend = 'declining';
      } else {
        existing.improvementTrend = 'stable';
      }
    }
    
    this.progress.set(session.exerciseId, existing);
    this.saveProgress();
  }

  private generateFeedback(session: MemorySession): string {
    const accuracy = session.accuracy;
    
    if (accuracy >= 90) {
      return `Excellent memory! You got ${accuracy.toFixed(0)}% correct. Your memory skills are outstanding!`;
    } else if (accuracy >= 70) {
      return `Good job! You got ${accuracy.toFixed(0)}% correct. Keep practicing to improve even more!`;
    } else if (accuracy >= 50) {
      return `Nice try! You got ${accuracy.toFixed(0)}% correct. Memory exercises get easier with practice!`;
    } else {
      return `Good effort! You got ${accuracy.toFixed(0)}% correct. Let's try an easier exercise next time!`;
    }
  }

  private loadProgress(): void {
    const saved = localStorage.getItem('memoryProgress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([exerciseId, progress]: [string, any]) => {
          progress.lastSession = new Date(progress.lastSession);
          this.progress.set(exerciseId, progress);
        });
      } catch (error) {
        console.error('Failed to load memory progress:', error);
      }
    }
  }

  private saveProgress(): void {
    const data: Record<string, MemoryProgress> = {};
    this.progress.forEach((progress, exerciseId) => {
      data[exerciseId] = progress;
    });
    localStorage.setItem('memoryProgress', JSON.stringify(data));
  }
}

// Singleton getter
export function getMemoryTrainingService(): MemoryTrainingService {
  return MemoryTrainingService.getInstance();
}