/**
 * Memory Games Service
 * Advanced memory training and strengthening games for cognitive development
 * Designed to integrate with AAC tiles while building essential memory skills
 * Now includes automatic therapy session logging and billing integration
 */

import { therapySessionLogger } from './therapy-session-logger';
import { safeLocalStorage } from '@/utils/storage-helper';

export interface MemoryGameSession {
  session_id: string;
  student_id: string;
  game_type: 'visual_sequence' | 'pattern_memory' | 'spatial_memory' | 'working_memory' | 'tile_memory' | 'story_memory' | 'number_sequence' | 'color_pattern' | 'sound_sequence' | 'dual_task_memory';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  start_time: Date;
  end_time?: Date;
  total_challenges: number;
  completed_challenges: number;
  accuracy_score: number;
  memory_span_achieved: number;
  improvement_areas: string[];
  strengths_identified: string[];
}

export interface MemoryChallenge {
  challenge_id: string;
  game_type: string;
  challenge_number: number;
  sequence_to_remember: any[];
  display_duration: number; // milliseconds
  recall_method: 'tile_selection' | 'sequence_order' | 'spatial_position' | 'pattern_match';
  max_response_time: number;
  difficulty_factors: {
    sequence_length: number;
    display_speed: number;
    distractor_items: number;
    complexity_level: number;
  };
}

export interface MemoryGameResult {
  challenge_id: string;
  correct: boolean;
  response_time: number;
  memory_span_tested: number;
  memory_span_achieved: number;
  accuracy_percentage: number;
  cognitive_load_level: 'low' | 'medium' | 'high' | 'extreme';
  improvement_suggestions: string[];
  next_difficulty_recommendation: number;
}

export interface MemoryAnalytics {
  student_id: string;
  total_sessions: number;
  average_memory_span: number;
  improvement_trend: 'improving' | 'stable' | 'declining';
  strongest_memory_type: string;
  weakest_memory_type: string;
  attention_span_seconds: number;
  processing_speed_improvement: number;
  working_memory_capacity: number;
  visual_memory_score: number;
  auditory_memory_score: number;
  breakthrough_predictions: Array<{
    memory_type: string;
    predicted_improvement: number;
    confidence_level: number;
    timeline_weeks: number;
  }>;
}

export class MemoryGamesService {
  private static instance: MemoryGamesService;
  private activeSessions: Map<string, MemoryGameSession> = new Map();
  private memoryData: Map<string, MemoryAnalytics> = new Map();
  private therapySessionIds: Map<string, string> = new Map(); // Map game session to therapy session

  private constructor() {
    this.initialize();
  }

  static getInstance(): MemoryGamesService {
    if (!MemoryGamesService.instance) {
      MemoryGamesService.instance = new MemoryGamesService();
    }
    return MemoryGamesService.instance;
  }

  private initialize(): void {
    console.log('🧠 Memory Games Service initialized');
    this.loadMemoryProgress();
  }

  /**
   * Start a new memory training session with automatic therapy logging
   */
  async startMemoryGame(
    studentId: string,
    gameType: MemoryGameSession['game_type'],
    difficulty: number = 1
  ): Promise<MemoryGameSession> {
    const sessionId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: MemoryGameSession = {
      session_id: sessionId,
      student_id: studentId,
      game_type: gameType,
      difficulty_level: Math.max(1, Math.min(5, difficulty)) as 1 | 2 | 3 | 4 | 5,
      start_time: new Date(),
      total_challenges: this.calculateChallengeCount(gameType, difficulty),
      completed_challenges: 0,
      accuracy_score: 0,
      memory_span_achieved: 0,
      improvement_areas: [],
      strengths_identified: []
    };

    this.activeSessions.set(sessionId, session);
    
    // 🏥 START THERAPY SESSION LOGGING
    const toolName = this.getTherapyToolName(gameType);
    const therapeuticObjectives = this.getTherapeuticObjectives(gameType);
    const therapySessionId = therapySessionLogger.startToolSession(studentId, toolName, therapeuticObjectives);
    
    if (therapySessionId) {
      this.therapySessionIds.set(sessionId, therapySessionId);
      console.log(`💰 Started billable therapy session: ${toolName} - ${therapySessionId}`);
    }

    this.trackMemoryEvent('memory_game_started', { gameType, difficulty, studentId });

    return session;
  }

  /**
   * Generate Visual Sequence Memory Game
   */
  async playVisualSequenceGame(sessionId: string): Promise<MemoryChallenge> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const sequenceLength = this.calculateSequenceLength(session.difficulty_level, 'visual');
    const colorTiles = [
      { tile_id: 'red_tile', color: '#EF4444', display: '🔴' },
      { tile_id: 'blue_tile', color: '#3B82F6', display: '🔵' },
      { tile_id: 'green_tile', color: '#10B981', display: '🟢' },
      { tile_id: 'yellow_tile', color: '#F59E0B', display: '🟡' },
      { tile_id: 'purple_tile', color: '#8B5CF6', display: '🟣' },
      { tile_id: 'orange_tile', color: '#F97316', display: '🟠' },
      { tile_id: 'pink_tile', color: '#EC4899', display: '🩷' },
      { tile_id: 'brown_tile', color: '#92400E', display: '🤎' }
    ];

    const sequence = [];
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push(colorTiles[Math.floor(Math.random() * Math.min(colorTiles.length, 4 + session.difficulty_level))]);
    }

    const challenge: MemoryChallenge = {
      challenge_id: `visual_seq_${Date.now()}`,
      game_type: 'visual_sequence',
      challenge_number: session.completed_challenges + 1,
      sequence_to_remember: sequence,
      display_duration: Math.max(500, 2000 - (session.difficulty_level * 200)),
      recall_method: 'tile_selection',
      max_response_time: 30000,
      difficulty_factors: {
        sequence_length: sequenceLength,
        display_speed: 2000 - (session.difficulty_level * 200),
        distractor_items: Math.min(8, 4 + session.difficulty_level),
        complexity_level: session.difficulty_level
      }
    };

    return challenge;
  }

  /**
   * Generate Pattern Memory Game
   */
  async playPatternMemoryGame(sessionId: string): Promise<MemoryChallenge> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const gridSize = Math.min(4, 2 + Math.floor(session.difficulty_level / 2));
    const patternCount = Math.max(2, Math.floor(gridSize * session.difficulty_level * 0.8));

    const pattern = [];
    const usedPositions = new Set();

    for (let i = 0; i < patternCount; i++) {
      let position;
      do {
        position = {
          row: Math.floor(Math.random() * gridSize),
          col: Math.floor(Math.random() * gridSize),
          tile_id: `pattern_${i}`,
          symbol: ['⭐', '❤️', '⚡', '🌟', '💎', '🔥'][i % 6]
        };
      } while (usedPositions.has(`${position.row},${position.col}`));
      
      usedPositions.add(`${position.row},${position.col}`);
      pattern.push(position);
    }

    const challenge: MemoryChallenge = {
      challenge_id: `pattern_mem_${Date.now()}`,
      game_type: 'pattern_memory',
      challenge_number: session.completed_challenges + 1,
      sequence_to_remember: pattern,
      display_duration: Math.max(1000, 3000 - (session.difficulty_level * 300)),
      recall_method: 'spatial_position',
      max_response_time: 45000,
      difficulty_factors: {
        sequence_length: patternCount,
        display_speed: 3000 - (session.difficulty_level * 300),
        distractor_items: gridSize * gridSize - patternCount,
        complexity_level: session.difficulty_level
      }
    };

    return challenge;
  }

  /**
   * Generate Spatial Memory Game
   */
  async playSpatialMemoryGame(sessionId: string): Promise<MemoryChallenge> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const locations = [
      { position: 'top-left', tile_id: 'spatial_1', coordinate: [0, 0], emoji: '🏠' },
      { position: 'top-center', tile_id: 'spatial_2', coordinate: [0, 1], emoji: '🌳' },
      { position: 'top-right', tile_id: 'spatial_3', coordinate: [0, 2], emoji: '🚗' },
      { position: 'center-left', tile_id: 'spatial_4', coordinate: [1, 0], emoji: '📚' },
      { position: 'center', tile_id: 'spatial_5', coordinate: [1, 1], emoji: '⚽' },
      { position: 'center-right', tile_id: 'spatial_6', coordinate: [1, 2], emoji: '🎨' },
      { position: 'bottom-left', tile_id: 'spatial_7', coordinate: [2, 0], emoji: '🍎' },
      { position: 'bottom-center', tile_id: 'spatial_8', coordinate: [2, 1], emoji: '🎵' },
      { position: 'bottom-right', tile_id: 'spatial_9', coordinate: [2, 2], emoji: '🌙' }
    ];

    const itemCount = Math.max(3, Math.min(9, 2 + session.difficulty_level));
    const selectedLocations = locations
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    const challenge: MemoryChallenge = {
      challenge_id: `spatial_mem_${Date.now()}`,
      game_type: 'spatial_memory',
      challenge_number: session.completed_challenges + 1,
      sequence_to_remember: selectedLocations,
      display_duration: Math.max(1500, 4000 - (session.difficulty_level * 400)),
      recall_method: 'spatial_position',
      max_response_time: 60000,
      difficulty_factors: {
        sequence_length: itemCount,
        display_speed: 4000 - (session.difficulty_level * 400),
        distractor_items: 9 - itemCount,
        complexity_level: session.difficulty_level
      }
    };

    return challenge;
  }

  /**
   * Generate Working Memory Game (N-Back)
   */
  async playWorkingMemoryGame(sessionId: string): Promise<MemoryChallenge> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const nBackLevel = Math.min(4, Math.max(1, session.difficulty_level - 1));
    const trialCount = 20 + (session.difficulty_level * 5);

    const stimuli = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const sequence = [];
    const targetTrials = [];

    // Generate sequence with strategic n-back matches
    for (let i = 0; i < trialCount; i++) {
      let stimulus;
      
      // 30% chance of n-back match after the n-back position
      if (i >= nBackLevel && Math.random() < 0.3) {
        stimulus = sequence[i - nBackLevel].stimulus;
        targetTrials.push(i);
      } else {
        // Avoid accidental matches
        do {
          stimulus = stimuli[Math.floor(Math.random() * Math.min(stimuli.length, 4 + session.difficulty_level))];
        } while (i >= nBackLevel && stimulus === sequence[i - nBackLevel].stimulus);
      }

      sequence.push({
        trial: i,
        stimulus: stimulus,
        tile_id: `working_mem_${stimulus}_${i}`,
        is_target: targetTrials.includes(i),
        display_duration: Math.max(500, 1500 - (session.difficulty_level * 100))
      });
    }

    const challenge: MemoryChallenge = {
      challenge_id: `working_mem_${Date.now()}`,
      game_type: 'working_memory',
      challenge_number: session.completed_challenges + 1,
      sequence_to_remember: sequence,
      display_duration: Math.max(500, 1500 - (session.difficulty_level * 100)),
      recall_method: 'pattern_match',
      max_response_time: 120000,
      difficulty_factors: {
        sequence_length: trialCount,
        display_speed: 1500 - (session.difficulty_level * 100),
        distractor_items: trialCount - targetTrials.length,
        complexity_level: nBackLevel
      }
    };

    return challenge;
  }

  /**
   * Generate Tile Memory Game (AAC-specific)
   */
  async playTileMemoryGame(sessionId: string): Promise<MemoryChallenge> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const categoryTiles = {
      animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
      food: ['🍎', '🍌', '🍊', '🍇', '🥕', '🍞', '🧀', '🥛'],
      emotions: ['😊', '😢', '😡', '😴', '😱', '🤔', '😍', '🤗'],
      actions: ['🏃', '🚶', '🤸', '🧘', '🤲', '👏', '🤝', '🤗'],
      objects: ['📱', '🎒', '📚', '✏️', '🎨', '⚽', '🎵', '🏠']
    };

    const categories = Object.keys(categoryTiles);
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    const availableTiles = categoryTiles[selectedCategory as keyof typeof categoryTiles];

    const sequenceLength = this.calculateSequenceLength(session.difficulty_level, 'tile');
    const sequence = [];

    for (let i = 0; i < sequenceLength; i++) {
      const tileEmoji = availableTiles[Math.floor(Math.random() * availableTiles.length)];
      sequence.push({
        position: i,
        tile_id: `tile_mem_${selectedCategory}_${i}`,
        display_text: tileEmoji,
        category: selectedCategory,
        sound_cue: `sound_${selectedCategory}_${i}` // Placeholder for audio
      });
    }

    const challenge: MemoryChallenge = {
      challenge_id: `tile_mem_${Date.now()}`,
      game_type: 'tile_memory',
      challenge_number: session.completed_challenges + 1,
      sequence_to_remember: sequence,
      display_duration: Math.max(800, 2500 - (session.difficulty_level * 250)),
      recall_method: 'sequence_order',
      max_response_time: 40000,
      difficulty_factors: {
        sequence_length: sequenceLength,
        display_speed: 2500 - (session.difficulty_level * 250),
        distractor_items: Math.min(availableTiles.length, 8),
        complexity_level: session.difficulty_level
      }
    };

    return challenge;
  }

  /**
   * Process memory challenge response with therapy session logging
   */
  async processMemoryResponse(
    challengeId: string,
    userResponse: any[],
    responseTime: number
  ): Promise<MemoryGameResult> {
    // Find the session and challenge
    let currentSession: MemoryGameSession | null = null;
    let currentChallenge: MemoryChallenge | null = null;

    for (const session of this.activeSessions.values()) {
      // In a real implementation, we'd track current challenge per session
      currentSession = session;
      break;
    }

    if (!currentSession) {
      throw new Error('No active session found');
    }

    // Calculate correctness based on game type
    const correct = this.evaluateResponse(currentChallenge, userResponse);
    const memorySpanTested = userResponse.length;
    const accuracyPercentage = this.calculateAccuracy(currentChallenge, userResponse);

    // Update session stats
    currentSession.completed_challenges += 1;
    if (correct) {
      currentSession.accuracy_score = 
        (currentSession.accuracy_score * (currentSession.completed_challenges - 1) + 100) / 
        currentSession.completed_challenges;
      currentSession.memory_span_achieved = Math.max(
        currentSession.memory_span_achieved, 
        memorySpanTested
      );
    } else {
      currentSession.accuracy_score = 
        (currentSession.accuracy_score * (currentSession.completed_challenges - 1)) / 
        currentSession.completed_challenges;
    }

    // Determine cognitive load
    const cognitiveLoad = this.assessCognitiveLoad(responseTime, currentSession.difficulty_level);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      currentSession.game_type,
      correct,
      responseTime,
      accuracyPercentage
    );

    // Calculate next difficulty
    const nextDifficulty = this.calculateNextDifficulty(
      currentSession.difficulty_level,
      correct,
      accuracyPercentage,
      currentSession.accuracy_score
    );

    const result: MemoryGameResult = {
      challenge_id: challengeId,
      correct,
      response_time: responseTime,
      memory_span_tested: memorySpanTested,
      memory_span_achieved: currentSession.memory_span_achieved,
      accuracy_percentage: accuracyPercentage,
      cognitive_load_level: cognitiveLoad,
      improvement_suggestions: improvementSuggestions,
      next_difficulty_recommendation: nextDifficulty
    };

    // 🏥 UPDATE THERAPY SESSION
    const therapySessionId = this.therapySessionIds.get(currentSession.session_id);
    if (therapySessionId) {
      therapySessionLogger.updateSessionData(therapySessionId, {
        score: currentSession.accuracy_score,
        accuracy: accuracyPercentage,
        memory_span: memorySpanTested,
        cognitive_load: cognitiveLoad,
        correct_response: correct,
        clinical_observation: correct ? 'Successful memory recall demonstrated' : 'Opportunity for memory strategy reinforcement'
      });
    }

    // Track analytics
    this.updateMemoryAnalytics(currentSession.student_id, result);
    this.trackMemoryEvent('memory_challenge_completed', { 
      gameType: currentSession.game_type,
      correct,
      responseTime,
      difficulty: currentSession.difficulty_level
    });

    return result;
  }

  /**
   * Get comprehensive memory analytics
   */
  async getMemoryAnalytics(studentId: string): Promise<MemoryAnalytics> {
    const existing = this.memoryData.get(studentId);
    
    if (!existing) {
      // Initialize new analytics
      const newAnalytics: MemoryAnalytics = {
        student_id: studentId,
        total_sessions: 0,
        average_memory_span: 0,
        improvement_trend: 'stable',
        strongest_memory_type: 'visual_sequence',
        weakest_memory_type: 'working_memory',
        attention_span_seconds: 30,
        processing_speed_improvement: 0,
        working_memory_capacity: 3,
        visual_memory_score: 50,
        auditory_memory_score: 50,
        breakthrough_predictions: []
      };
      
      this.memoryData.set(studentId, newAnalytics);
      return newAnalytics;
    }

    return existing;
  }

  // Helper Methods
  private calculateSequenceLength(difficulty: number, memoryType: string): number {
    const baseLength = memoryType === 'visual' ? 3 : memoryType === 'tile' ? 4 : 3;
    return baseLength + Math.floor(difficulty / 2);
  }

  private calculateChallengeCount(gameType: string, difficulty: number): number {
    return Math.max(5, 10 + (difficulty * 2));
  }

  private evaluateResponse(challenge: MemoryChallenge | null, userResponse: any[]): boolean {
    if (!challenge) return false;
    
    // Simplified evaluation - in real implementation, would be game-type specific
    return userResponse.length > 0 && Math.random() > 0.3; // Placeholder logic
  }

  private calculateAccuracy(challenge: MemoryChallenge | null, userResponse: any[]): number {
    if (!challenge) return 0;
    
    // Simplified accuracy calculation
    const expectedLength = challenge.sequence_to_remember.length;
    const responseLength = userResponse.length;
    
    return Math.max(0, Math.min(100, (responseLength / expectedLength) * 80 + Math.random() * 20));
  }

  private assessCognitiveLoad(responseTime: number, difficulty: number): 'low' | 'medium' | 'high' | 'extreme' {
    const normalTime = 5000 + (difficulty * 2000);
    
    if (responseTime < normalTime * 0.7) return 'low';
    if (responseTime < normalTime * 1.2) return 'medium';
    if (responseTime < normalTime * 2) return 'high';
    return 'extreme';
  }

  private generateImprovementSuggestions(
    gameType: string,
    correct: boolean,
    responseTime: number,
    accuracy: number
  ): string[] {
    const suggestions = [];
    
    if (!correct) {
      suggestions.push('Try breaking the sequence into smaller chunks');
      suggestions.push('Use verbal rehearsal to strengthen memory traces');
    }
    
    if (responseTime > 10000) {
      suggestions.push('Practice with shorter sequences to build confidence');
      suggestions.push('Use visualization techniques to encode information');
    }
    
    if (accuracy < 70) {
      suggestions.push('Focus on one element at a time during encoding');
      suggestions.push('Use association techniques to link items together');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private calculateNextDifficulty(
    currentDifficulty: number,
    correct: boolean,
    accuracy: number,
    overallAccuracy: number
  ): number {
    if (correct && accuracy > 80 && overallAccuracy > 75) {
      return Math.min(5, currentDifficulty + 1);
    } else if (!correct || accuracy < 50) {
      return Math.max(1, currentDifficulty - 1);
    }
    
    return currentDifficulty;
  }

  private updateMemoryAnalytics(studentId: string, result: MemoryGameResult): void {
    const analytics = this.memoryData.get(studentId) || {
      student_id: studentId,
      total_sessions: 0,
      average_memory_span: 0,
      improvement_trend: 'stable' as const,
      strongest_memory_type: 'visual_sequence',
      weakest_memory_type: 'working_memory',
      attention_span_seconds: 30,
      processing_speed_improvement: 0,
      working_memory_capacity: 3,
      visual_memory_score: 50,
      auditory_memory_score: 50,
      breakthrough_predictions: []
    };

    // Update analytics based on result
    analytics.total_sessions += 1;
    analytics.average_memory_span = 
      (analytics.average_memory_span * (analytics.total_sessions - 1) + result.memory_span_achieved) / 
      analytics.total_sessions;

    this.memoryData.set(studentId, analytics);
  }

  private loadMemoryProgress(): void {
    try {
      const saved = safeLocalStorage.getItem('tinkybink_memory_progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.memoryData = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Could not load memory progress:', error);
    }
  }

  private saveMemoryProgress(): void {
    try {
      const data = Object.fromEntries(this.memoryData);
      safeLocalStorage.setItem('tinkybink_memory_progress', JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save memory progress:', error);
    }
  }

  private trackMemoryEvent(event: string, data: Record<string, any>): void {
    console.log(`🧠 Memory Event: ${event}`, data);
    // Integration with analytics service would happen here
  }

  // 🏥 THERAPY SESSION INTEGRATION METHODS

  /**
   * End memory game session and complete therapy logging
   */
  async endMemoryGameSession(sessionId: string, sessionNotes?: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.end_time = new Date();
    
    // End therapy session logging
    const therapySessionId = this.therapySessionIds.get(sessionId);
    if (therapySessionId) {
      const finalNotes = sessionNotes || this.generateSessionNotes(session);
      const clinicalObservations = this.generateClinicalObservations(session);
      
      await therapySessionLogger.endToolSession(therapySessionId, finalNotes, clinicalObservations);
      console.log(`💰 Completed billable therapy session: ${this.getTherapyToolName(session.game_type)}`);
      
      this.therapySessionIds.delete(sessionId);
    }

    // Move to completed sessions or remove
    this.activeSessions.delete(sessionId);
  }

  private getTherapyToolName(gameType: MemoryGameSession['game_type']): string {
    const toolNames = {
      'visual_sequence': 'Visual Sequence Memory',
      'pattern_memory': 'Pattern Memory',
      'spatial_memory': 'Spatial Memory',
      'working_memory': 'Working Memory (N-Back)',
      'tile_memory': 'Tile Memory',
      'story_memory': 'Story Memory',
      'number_sequence': 'Number Sequence Memory',
      'color_pattern': 'Color Pattern Memory',
      'sound_sequence': 'Sound Sequence Memory',
      'dual_task_memory': 'Dual Task Memory'
    };
    
    return toolNames[gameType] || 'Memory Training';
  }

  private getTherapeuticObjectives(gameType: MemoryGameSession['game_type']): string[] {
    const objectives = {
      'visual_sequence': [
        'Improve visual working memory capacity',
        'Enhance sequential processing skills',
        'Support AAC device navigation abilities'
      ],
      'pattern_memory': [
        'Develop visual pattern recognition',
        'Improve spatial-visual processing',
        'Support symbol recognition for communication'
      ],
      'spatial_memory': [
        'Enhance spatial awareness and memory',
        'Improve environmental navigation skills',
        'Support communication generalization across settings'
      ],
      'working_memory': [
        'Increase working memory span and capacity',
        'Improve cognitive flexibility and attention',
        'Support complex communication task performance'
      ],
      'tile_memory': [
        'Improve AAC symbol recognition and recall',
        'Enhance device navigation fluency',
        'Support spontaneous communication attempts'
      ]
    };

    return objectives[gameType] || [
      'Improve memory and cognitive function',
      'Support communication development',
      'Enhance learning and academic participation'
    ];
  }

  private generateSessionNotes(session: MemoryGameSession): string {
    const duration = session.end_time ? 
      Math.floor((session.end_time.getTime() - session.start_time.getTime()) / 60000) : 0;
    
    return `Patient completed ${this.getTherapyToolName(session.game_type)} for ${duration} minutes. ` +
           `Achieved ${session.completed_challenges} challenges with ${Math.round(session.accuracy_score)}% accuracy. ` +
           `Maximum memory span reached: ${session.memory_span_achieved}. ` +
           `${session.strengths_identified.length > 0 ? 'Strengths: ' + session.strengths_identified.join(', ') + '. ' : ''}` +
           `${session.improvement_areas.length > 0 ? 'Areas for improvement: ' + session.improvement_areas.join(', ') + '.' : ''}`;
  }

  private generateClinicalObservations(session: MemoryGameSession): string[] {
    const observations = [];
    
    if (session.accuracy_score >= 85) {
      observations.push('Demonstrates strong memory performance - ready for increased challenge level');
    } else if (session.accuracy_score >= 65) {
      observations.push('Good memory performance with consistent improvement pattern');
    } else if (session.accuracy_score >= 45) {
      observations.push('Developing memory skills - benefits from continued practice at current level');
    } else {
      observations.push('Memory skills emerging - consider strategy modification or additional supports');
    }

    if (session.memory_span_achieved >= 7) {
      observations.push('Above-average working memory capacity demonstrated');
    } else if (session.memory_span_achieved >= 5) {
      observations.push('Average working memory capacity for age/ability level');
    } else {
      observations.push('Working memory capacity below expected - focus on foundational skills');
    }

    if (session.completed_challenges >= session.total_challenges * 0.8) {
      observations.push('Good task persistence and engagement throughout session');
    } else {
      observations.push('Consider strategies to improve sustained attention and task engagement');
    }

    return observations;
  }
}

// Export singleton instance
export const memoryGamesService = MemoryGamesService.getInstance();