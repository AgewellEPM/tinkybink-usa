// Module 21: Educational Games Service
// Manages learning games that integrate with existing tile system

import { getDataService } from '../core/data-service';
import { getSpeechService } from '../core/speech-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getUIEffectsService } from '../ui/ui-effects-service';

export interface Game {
  id: string;
  name: string;
  type: 'matching' | 'sequence' | 'category' | 'memory' | 'spelling';
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  instructions: string[];
  targetAge: { min: number; max: number };
  categories: string[];
  tiles: GameTile[];
  settings: GameSettings;
}

export interface GameTile {
  id: string;
  emoji: string;
  text: string;
  audioUrl?: string;
  category?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  matchWith?: string;
}

export interface GameSettings {
  timeLimit?: number;
  maxAttempts?: number;
  showHints: boolean;
  playAudio: boolean;
  celebrateSuccess: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameSession {
  gameId: string;
  startTime: Date;
  endTime?: Date;
  score: number;
  attempts: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  completed: boolean;
}

export interface GameProgress {
  gameId: string;
  bestScore: number;
  timesPlayed: number;
  averageScore: number;
  lastPlayed: Date;
  difficulty: string;
  improvements: string[];
}

export class EducationalGamesService {
  private static instance: EducationalGamesService;
  private dataService: ReturnType<typeof getDataService> | null = null;
  private speechService: ReturnType<typeof getSpeechService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private uiEffects: ReturnType<typeof getUIEffectsService> | null = null;
  
  private games: Map<string, Game> = new Map();
  private currentGame: Game | null = null;
  private currentSession: GameSession | null = null;
  private gameProgress: Map<string, GameProgress> = new Map();
  private gameActive = false;

  private constructor() {
    console.log('EducationalGamesService created');
  }

  static getInstance(): EducationalGamesService {
    if (!EducationalGamesService.instance) {
      EducationalGamesService.instance = new EducationalGamesService();
    }
    return EducationalGamesService.instance;
  }

  async initialize(): Promise<void> {
    this.dataService = getDataService();
    this.speechService = getSpeechService();
    this.analytics = getAnalyticsService();
    this.uiEffects = getUIEffectsService();
    
    // Initialize built-in games
    this.initializeGames();
    
    // Load saved progress
    this.loadGameProgress();
    
    console.log('EducationalGamesService initialized');
  }

  // Get all available games
  getAvailableGames(): Game[] {
    return Array.from(this.games.values());
  }

  // Start a game - modifies existing tile board
  startGame(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    
    this.currentGame = game;
    this.gameActive = true;
    
    // Create new session
    this.currentSession = {
      gameId,
      startTime: new Date(),
      score: 0,
      attempts: 0,
      correctAnswers: 0,
      totalQuestions: game.tiles.length,
      timeSpent: 0,
      completed: false
    };
    
    // Replace current tiles with game tiles
    this.dataService?.setGameMode(true, game.tiles);
    
    // Show game instructions
    this.speechService?.speak(`Starting ${game.name}. ${game.instructions[0]}`);
    
    // Show visual feedback
    this.uiEffects?.showGameStart(game.name);
    
    this.analytics?.track('game_started', {
      gameId,
      gameName: game.name,
      difficulty: game.difficulty
    });
    
    return true;
  }

  // Handle tile selection during game
  handleGameTilePress(tileId: string): boolean {
    if (!this.gameActive || !this.currentGame || !this.currentSession) {
      return false;
    }
    
    const tile = this.currentGame.tiles.find(t => t.id === tileId);
    if (!tile) return false;
    
    this.currentSession.attempts++;
    
    const isCorrect = this.checkAnswer(tile);
    
    if (isCorrect) {
      this.currentSession.correctAnswers++;
      this.currentSession.score += this.calculateScore();
      
      // Success feedback
      this.speechService?.speak(tile.text || 'Correct!');
      this.uiEffects?.showSuccess();
      
      // Check if game complete
      if (this.isGameComplete()) {
        this.endGame(true);
      }
    } else {
      // Wrong answer feedback
      this.speechService?.speak('Try again!');
      this.uiEffects?.showError();
      
      // Check max attempts
      if (this.currentGame.settings.maxAttempts && 
          this.currentSession.attempts >= this.currentGame.settings.maxAttempts) {
        this.endGame(false);
      }
    }
    
    return isCorrect;
  }

  // End current game
  endGame(completed: boolean): void {
    if (!this.currentSession || !this.currentGame) return;
    
    this.currentSession.endTime = new Date();
    this.currentSession.completed = completed;
    this.currentSession.timeSpent = 
      this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    
    // Update progress
    this.updateGameProgress(this.currentSession);
    
    // Exit game mode
    this.dataService?.setGameMode(false);
    this.gameActive = false;
    
    // Show results
    const message = completed 
      ? `Great job! You scored ${this.currentSession.score} points!`
      : `Game over. You scored ${this.currentSession.score} points. Try again!`;
    
    this.speechService?.speak(message);
    
    if (completed) {
      this.uiEffects?.showCelebration();
    }
    
    this.analytics?.track('game_ended', {
      gameId: this.currentGame.id,
      completed,
      score: this.currentSession.score,
      attempts: this.currentSession.attempts,
      timeSpent: this.currentSession.timeSpent
    });
    
    this.currentGame = null;
    this.currentSession = null;
  }

  // Get game progress
  getGameProgress(gameId: string): GameProgress | null {
    return this.gameProgress.get(gameId) || null;
  }

  // Get all progress
  getAllProgress(): Map<string, GameProgress> {
    return new Map(this.gameProgress);
  }

  // Check if currently in game mode
  isGameActive(): boolean {
    return this.gameActive;
  }

  // Get current game
  getCurrentGame(): Game | null {
    return this.currentGame;
  }

  // Private methods
  private initializeGames(): void {
    const games: Game[] = [
      {
        id: 'game_1',
        name: 'Which One Doesn\'t Belong?',
        type: 'category',
        difficulty: 'easy',
        description: 'Find the item that doesn\'t belong in the group',
        instructions: [
          'Look at all the tiles',
          'Find the one that doesn\'t belong',
          'Tap the different one'
        ],
        targetAge: { min: 3, max: 8 },
        categories: ['food', 'animals', 'colors'],
        tiles: this.generateCategoryGame(),
        settings: {
          maxAttempts: 3,
          showHints: true,
          playAudio: true,
          celebrateSuccess: true,
          difficulty: 'easy'
        }
      },
      {
        id: 'game_2',
        name: 'Match the Same',
        type: 'matching',
        difficulty: 'medium',
        description: 'Find pairs of matching items',
        instructions: [
          'Find two tiles that match',
          'Tap both matching tiles',
          'Find all the pairs'
        ],
        targetAge: { min: 4, max: 10 },
        categories: ['shapes', 'colors', 'animals'],
        tiles: this.generateMatchingGame(),
        settings: {
          showHints: false,
          playAudio: true,
          celebrateSuccess: true,
          difficulty: 'medium'
        }
      },
      {
        id: 'game_3',
        name: 'First Letter Match',
        type: 'spelling',
        difficulty: 'hard',
        description: 'Match words that start with the same letter',
        instructions: [
          'Listen to the letter sound',
          'Find words that start with that letter',
          'Tap all the matching words'
        ],
        targetAge: { min: 5, max: 12 },
        categories: ['vocabulary'],
        tiles: this.generateSpellingGame(),
        settings: {
          timeLimit: 60,
          showHints: true,
          playAudio: true,
          celebrateSuccess: true,
          difficulty: 'hard'
        }
      },
      {
        id: 'game_4',
        name: 'Sequence Builder',
        type: 'sequence',
        difficulty: 'medium',
        description: 'Put items in the correct order',
        instructions: [
          'Look at the sequence',
          'Tap the tiles in the right order',
          'Complete the pattern'
        ],
        targetAge: { min: 4, max: 10 },
        categories: ['numbers', 'daily_routine'],
        tiles: this.generateSequenceGame(),
        settings: {
          maxAttempts: 5,
          showHints: true,
          playAudio: true,
          celebrateSuccess: true,
          difficulty: 'medium'
        }
      }
    ];
    
    games.forEach(game => this.games.set(game.id, game));
  }

  private generateCategoryGame(): GameTile[] {
    return [
      { id: 'ct1', emoji: '🍎', text: 'Apple', category: 'food', isCorrect: false },
      { id: 'ct2', emoji: '🍌', text: 'Banana', category: 'food', isCorrect: false },
      { id: 'ct3', emoji: '🍇', text: 'Grapes', category: 'food', isCorrect: false },
      { id: 'ct4', emoji: '🚗', text: 'Car', category: 'vehicle', isCorrect: true }
    ];
  }

  private generateMatchingGame(): GameTile[] {
    return [
      { id: 'mt1', emoji: '🐶', text: 'Dog', matchWith: 'mt2' },
      { id: 'mt2', emoji: '🐶', text: 'Dog', matchWith: 'mt1' },
      { id: 'mt3', emoji: '🐱', text: 'Cat', matchWith: 'mt4' },
      { id: 'mt4', emoji: '🐱', text: 'Cat', matchWith: 'mt3' },
      { id: 'mt5', emoji: '🐼', text: 'Bear', matchWith: 'mt6' },
      { id: 'mt6', emoji: '🐼', text: 'Bear', matchWith: 'mt5' }
    ];
  }

  private generateSpellingGame(): GameTile[] {
    return [
      { id: 'st1', emoji: '🍎', text: 'Apple', correctAnswer: 'A', isCorrect: true },
      { id: 'st2', emoji: '🐶', text: 'Dog', correctAnswer: 'A', isCorrect: false },
      { id: 'st3', emoji: '✈️', text: 'Airplane', correctAnswer: 'A', isCorrect: true },
      { id: 'st4', emoji: '🐜', text: 'Ant', correctAnswer: 'A', isCorrect: true },
      { id: 'st5', emoji: '🚗', text: 'Car', correctAnswer: 'A', isCorrect: false },
      { id: 'st6', emoji: '🎈', text: 'Balloon', correctAnswer: 'A', isCorrect: false }
    ];
  }

  private generateSequenceGame(): GameTile[] {
    return [
      { id: 'seq1', emoji: '1️⃣', text: 'One', correctAnswer: '1' },
      { id: 'seq2', emoji: '2️⃣', text: 'Two', correctAnswer: '2' },
      { id: 'seq3', emoji: '3️⃣', text: 'Three', correctAnswer: '3' },
      { id: 'seq4', emoji: '4️⃣', text: 'Four', correctAnswer: '4' }
    ];
  }

  private checkAnswer(tile: GameTile): boolean {
    if (!this.currentGame) return false;
    
    switch (this.currentGame.type) {
      case 'category':
        return tile.isCorrect === true;
      case 'matching':
        // Would need more complex matching logic
        return true;
      case 'spelling':
        return tile.isCorrect === true;
      case 'sequence':
        // Would need sequence validation
        return true;
      default:
        return false;
    }
  }

  private calculateScore(): number {
    if (!this.currentGame || !this.currentSession) return 0;
    
    const baseScore = 10;
    const difficultyMultiplier = {
      'easy': 1,
      'medium': 1.5,
      'hard': 2
    };
    
    return Math.round(baseScore * difficultyMultiplier[this.currentGame.difficulty]);
  }

  private isGameComplete(): boolean {
    if (!this.currentSession || !this.currentGame) return false;
    
    // Simple completion check - would be more complex per game type
    return this.currentSession.correctAnswers >= this.currentGame.tiles.length;
  }

  private updateGameProgress(session: GameSession): void {
    const existing = this.gameProgress.get(session.gameId) || {
      gameId: session.gameId,
      bestScore: 0,
      timesPlayed: 0,
      averageScore: 0,
      lastPlayed: new Date(),
      difficulty: 'easy',
      improvements: []
    };
    
    existing.timesPlayed++;
    existing.lastPlayed = session.endTime || new Date();
    existing.bestScore = Math.max(existing.bestScore, session.score);
    existing.averageScore = (existing.averageScore * (existing.timesPlayed - 1) + session.score) / existing.timesPlayed;
    
    if (this.currentGame) {
      existing.difficulty = this.currentGame.difficulty;
    }
    
    // Add improvement suggestions
    if (session.completed && session.score > existing.bestScore * 0.8) {
      const improvement = this.generateImprovement(session);
      if (improvement && !existing.improvements.includes(improvement)) {
        existing.improvements.push(improvement);
        if (existing.improvements.length > 3) {
          existing.improvements.shift();
        }
      }
    }
    
    this.gameProgress.set(session.gameId, existing);
    this.saveGameProgress();
  }

  private generateImprovement(session: GameSession): string {
    const accuracy = session.correctAnswers / session.totalQuestions;
    const efficiency = session.correctAnswers / session.attempts;
    
    if (accuracy >= 0.9) return 'Perfect accuracy! Try a harder difficulty.';
    if (efficiency >= 0.8) return 'Great efficiency! You\'re getting faster.';
    if (session.timeSpent < 30000) return 'Speed demon! Challenge yourself more.';
    
    return 'Keep practicing! You\'re improving every game.';
  }

  private loadGameProgress(): void {
    const saved = localStorage.getItem('gameProgress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([gameId, progress]: [string, any]) => {
          progress.lastPlayed = new Date(progress.lastPlayed);
          this.gameProgress.set(gameId, progress);
        });
      } catch (error) {
        console.error('Failed to load game progress:', error);
      }
    }
  }

  private saveGameProgress(): void {
    const data: Record<string, GameProgress> = {};
    this.gameProgress.forEach((progress, gameId) => {
      data[gameId] = progress;
    });
    localStorage.setItem('gameProgress', JSON.stringify(data));
  }
}

// Singleton getter
export function getEducationalGamesService(): EducationalGamesService {
  return EducationalGamesService.getInstance();
}