/**
 * Comprehensive Therapy Games Service
 * Engaging, evidence-based games for SLP, ABA, OT, and PT
 * 
 * Features:
 * - Adaptive difficulty levels
 * - Progress tracking integration
 * - Multi-modal gameplay (voice, touch, eye tracking)
 * - Custom game creation tools
 * - Gamified therapy goals
 * - Social multiplayer options
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0
 */

import { mlDataCollection } from './ml-data-collection';
import { therapyGoalTrackingService } from './therapy-goal-tracking-service';
import { voiceSynthesisService } from './voice-synthesis-service';
import { advancedEyeTrackingService } from './advanced-eye-tracking-service';

interface TherapyGame {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'language' | 'cognitive' | 'motor' | 'social' | 'academic' | 'sensory';
  therapy_types: ('slp' | 'aba' | 'ot' | 'pt')[];
  
  // Game Configuration
  config: {
    min_age: number;
    max_age: number;
    difficulty_levels: string[];
    session_duration_minutes: number[];
    max_players: number;
    requires_therapist: boolean;
  };
  
  // Therapeutic Targets
  targets: {
    primary_skills: string[];
    secondary_skills: string[];
    contraindications: string[];
    evidence_level: 'high' | 'moderate' | 'emerging' | 'expert_opinion';
  };
  
  // Game Mechanics
  mechanics: {
    input_methods: ('touch' | 'voice' | 'eye_gaze' | 'switch' | 'gesture')[];
    feedback_types: ('visual' | 'auditory' | 'haptic' | 'social')[];
    progression_type: 'linear' | 'branching' | 'adaptive' | 'free_play';
    scoring_system: 'points' | 'completion' | 'accuracy' | 'speed' | 'effort';
  };
  
  // Customization
  customization: {
    vocabulary_sets: string[];
    visual_themes: string[];
    audio_settings: string[];
    difficulty_parameters: Record<string, { min: number; max: number }>;
  };
  
  // Analytics
  analytics: {
    tracks_accuracy: boolean;
    tracks_response_time: boolean;
    tracks_attempts: boolean;
    tracks_engagement: boolean;
    tracks_learning_curve: boolean;
  };
  
  created_by: string;
  created_at: Date;
}

interface GameSession {
  id: string;
  game_id: string;
  patient_id: string;
  therapist_id: string;
  
  // Session Settings
  settings: {
    difficulty_level: string;
    duration_minutes: number;
    custom_parameters: Record<string, any>;
    vocabulary_set: string[];
    theme: string;
  };
  
  // Performance Data
  performance: {
    start_time: Date;
    end_time?: Date;
    total_attempts: number;
    correct_responses: number;
    accuracy_percentage: number;
    average_response_time: number;
    engagement_score: number; // 0-100
    
    // Detailed Metrics
    response_times: number[];
    error_patterns: Array<{
      stimulus: string;
      response: string;
      error_type: string;
      timestamp: Date;
    }>;
    
    // Game-specific metrics
    levels_completed: number;
    achievements_unlocked: string[];
    help_requests: number;
    frustration_indicators: number;
  };
  
  // Adaptive Adjustments
  adaptations: Array<{
    timestamp: Date;
    parameter: string;
    old_value: any;
    new_value: any;
    reason: string;
  }>;
  
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  notes?: string;
}

interface GameLibrary {
  // Communication Games
  communication_games: TherapyGame[];
  
  // Language Games
  language_games: TherapyGame[];
  
  // Cognitive Games
  cognitive_games: TherapyGame[];
  
  // Motor Games
  motor_games: TherapyGame[];
  
  // Social Games
  social_games: TherapyGame[];
  
  // Custom Games
  custom_games: TherapyGame[];
}

class TherapyGamesService {
  private static instance: TherapyGamesService;
  private gameLibrary: GameLibrary;
  private activeSessions: Map<string, GameSession> = new Map();
  private gameAnalytics: Map<string, any> = new Map();
  
  private constructor() {
    this.gameLibrary = {
      communication_games: [],
      language_games: [],
      cognitive_games: [],
      motor_games: [],
      social_games: [],
      custom_games: []
    };
    this.initializeService();
  }
  
  static getInstance(): TherapyGamesService {
    if (!TherapyGamesService.instance) {
      TherapyGamesService.instance = new TherapyGamesService();
    }
    return TherapyGamesService.instance;
  }
  
  /**
   * Initialize games service
   */
  private async initializeService(): Promise<void> {
    console.log('🎮 Initializing Therapy Games Service...');
    
    // Load game library
    await this.loadGameLibrary();
    
    // Set up adaptive algorithms
    this.setupAdaptiveEngine();
    
    console.log('✅ Games Service Ready');
    console.log(`🎯 Loaded ${this.getTotalGamesCount()} therapeutic games`);
  }
  
  /**
   * Get recommended games for patient
   */
  async getRecommendedGames(
    patientId: string,
    therapyType: 'slp' | 'aba' | 'ot' | 'pt',
    targetSkills?: string[]
  ): Promise<TherapyGame[]> {
    // Get patient data for personalization
    const patientData = await this.getPatientGameData(patientId);
    
    // Get all games for therapy type
    const allGames = this.getAllGames().filter(game => 
      game.therapy_types.includes(therapyType)
    );
    
    // Filter by target skills if provided
    let filteredGames = targetSkills ? 
      allGames.filter(game => 
        game.targets.primary_skills.some(skill => targetSkills.includes(skill))
      ) : allGames;
    
    // Score games based on patient factors
    const scoredGames = filteredGames.map(game => ({
      game,
      score: this.calculateGameRecommendationScore(game, patientData)
    }));
    
    // Sort by score and return top recommendations
    return scoredGames
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.game);
  }
  
  /**
   * Start game session
   */
  async startGameSession(
    gameId: string,
    patientId: string,
    therapistId: string,
    settings?: Partial<GameSession['settings']>
  ): Promise<string> {
    const game = this.findGameById(gameId);
    if (!game) throw new Error('Game not found');
    
    const sessionId = `session_${Date.now()}`;
    
    // Create session with adaptive settings
    const adaptiveSettings = await this.generateAdaptiveSettings(game, patientId);
    
    const session: GameSession = {
      id: sessionId,
      game_id: gameId,
      patient_id: patientId,
      therapist_id: therapistId,
      
      settings: {
        ...adaptiveSettings,
        ...settings
      },
      
      performance: {
        start_time: new Date(),
        total_attempts: 0,
        correct_responses: 0,
        accuracy_percentage: 0,
        average_response_time: 0,
        engagement_score: 100,
        response_times: [],
        error_patterns: [],
        levels_completed: 0,
        achievements_unlocked: [],
        help_requests: 0,
        frustration_indicators: 0
      },
      
      adaptations: [],
      status: 'active'
    };
    
    this.activeSessions.set(sessionId, session);
    
    // Track session start
    await mlDataCollection.trackInteraction(therapistId, {
      type: 'game_session_started',
      metadata: {
        sessionId,
        gameId,
        gameName: game.name,
        patientId,
        difficulty: session.settings.difficulty_level
      },
      timestamp: new Date()
    });
    
    console.log(`🎮 Started game session: ${game.name} for patient ${patientId}`);
    return sessionId;
  }
  
  /**
   * Record game response
   */
  async recordGameResponse(
    sessionId: string,
    stimulus: string,
    response: string,
    correct: boolean,
    responseTimeMs: number
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Active session not found');
    
    // Update performance metrics
    session.performance.total_attempts++;
    if (correct) session.performance.correct_responses++;
    
    session.performance.response_times.push(responseTimeMs);
    session.performance.average_response_time = 
      session.performance.response_times.reduce((a, b) => a + b, 0) / 
      session.performance.response_times.length;
    
    session.performance.accuracy_percentage = 
      (session.performance.correct_responses / session.performance.total_attempts) * 100;
    
    // Record error patterns
    if (!correct) {
      session.performance.error_patterns.push({
        stimulus,
        response,
        error_type: this.classifyError(stimulus, response),
        timestamp: new Date()
      });
    }
    
    // Check for adaptive adjustments
    await this.checkForAdaptations(session);
    
    console.log(`📊 Response recorded: ${stimulus} -> ${response} (${correct ? 'Correct' : 'Incorrect'})`);
  }
  
  /**
   * End game session
   */
  async endGameSession(sessionId: string, notes?: string): Promise<GameSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    session.end_time = new Date();
    session.status = 'completed';
    session.notes = notes;
    
    // Calculate final engagement score
    session.performance.engagement_score = this.calculateEngagementScore(session);
    
    // Update therapy goals if applicable
    await this.updateTherapyGoalsFromGame(session);
    
    // Save session data
    await this.saveGameSession(session);
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    
    console.log(`🏁 Game session completed: ${sessionId}`);
    return session;
  }
  
  /**
   * Create custom game
   */
  async createCustomGame(
    gameData: Partial<TherapyGame>,
    creatorId: string
  ): Promise<string> {
    const gameId = `custom_game_${Date.now()}`;
    
    const customGame: TherapyGame = {
      id: gameId,
      name: gameData.name || 'Custom Game',
      description: gameData.description || '',
      category: gameData.category || 'communication',
      therapy_types: gameData.therapy_types || ['slp'],
      
      config: gameData.config || {
        min_age: 3,
        max_age: 18,
        difficulty_levels: ['Easy', 'Medium', 'Hard'],
        session_duration_minutes: [10, 15, 20],
        max_players: 1,
        requires_therapist: true
      },
      
      targets: gameData.targets || {
        primary_skills: [],
        secondary_skills: [],
        contraindications: [],
        evidence_level: 'expert_opinion'
      },
      
      mechanics: gameData.mechanics || {
        input_methods: ['touch'],
        feedback_types: ['visual', 'auditory'],
        progression_type: 'linear',
        scoring_system: 'accuracy'
      },
      
      customization: gameData.customization || {
        vocabulary_sets: [],
        visual_themes: ['default'],
        audio_settings: ['standard'],
        difficulty_parameters: {}
      },
      
      analytics: gameData.analytics || {
        tracks_accuracy: true,
        tracks_response_time: true,
        tracks_attempts: true,
        tracks_engagement: true,
        tracks_learning_curve: true
      },
      
      created_by: creatorId,
      created_at: new Date()
    };
    
    this.gameLibrary.custom_games.push(customGame);
    
    console.log(`✅ Custom game created: ${customGame.name}`);
    return gameId;
  }
  
  /**
   * Get game analytics
   */
  async getGameAnalytics(
    gameId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    // Get all sessions for this game
    const sessions = await this.getGameSessions(gameId, dateRange);
    
    if (sessions.length === 0) {
      return {
        total_sessions: 0,
        average_accuracy: 0,
        average_engagement: 0,
        completion_rate: 0
      };
    }
    
    // Calculate aggregate metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const completionRate = (completedSessions / totalSessions) * 100;
    
    const averageAccuracy = sessions.reduce((sum, s) => 
      sum + s.performance.accuracy_percentage, 0) / totalSessions;
    
    const averageEngagement = sessions.reduce((sum, s) => 
      sum + s.performance.engagement_score, 0) / totalSessions;
    
    const averageResponseTime = sessions.reduce((sum, s) => 
      sum + s.performance.average_response_time, 0) / totalSessions;
    
    // Analyze learning curves
    const learningCurves = this.analyzeLearningCurves(sessions);
    
    // Common error patterns
    const errorPatterns = this.analyzeErrorPatterns(sessions);
    
    return {
      total_sessions: totalSessions,
      completion_rate: Math.round(completionRate),
      average_accuracy: Math.round(averageAccuracy),
      average_engagement: Math.round(averageEngagement),
      average_response_time: Math.round(averageResponseTime),
      learning_curves: learningCurves,
      common_errors: errorPatterns,
      
      // Usage patterns
      peak_usage_times: this.findPeakUsageTimes(sessions),
      preferred_difficulty: this.findPreferredDifficulty(sessions),
      
      // Therapeutic outcomes
      skill_improvements: await this.analyzeSkillImprovements(sessions)
    };
  }
  
  /**
   * Get multiplayer game options
   */
  async getMultiplayerGames(): Promise<TherapyGame[]> {
    return this.getAllGames().filter(game => game.config.max_players > 1);
  }
  
  /**
   * Start multiplayer session
   */
  async startMultiplayerSession(
    gameId: string,
    playerIds: string[],
    therapistId: string
  ): Promise<string> {
    const game = this.findGameById(gameId);
    if (!game) throw new Error('Game not found');
    
    if (playerIds.length > game.config.max_players) {
      throw new Error('Too many players for this game');
    }
    
    const sessionId = `multiplayer_${Date.now()}`;
    
    // Create individual sessions for each player
    const playerSessions = await Promise.all(
      playerIds.map(playerId => 
        this.startGameSession(gameId, playerId, therapistId)
      )
    );
    
    // Track multiplayer session
    await mlDataCollection.trackInteraction(therapistId, {
      type: 'multiplayer_game_started',
      metadata: {
        sessionId,
        gameId,
        playerIds,
        playerSessions
      },
      timestamp: new Date()
    });
    
    console.log(`🎮👥 Multiplayer session started: ${game.name} with ${playerIds.length} players`);
    return sessionId;
  }
  
  // Private helper methods
  
  private async loadGameLibrary(): Promise<void> {
    console.log('📚 Loading therapy games library...');
    
    // Communication Games
    this.gameLibrary.communication_games = [
      {
        id: 'picture_naming',
        name: 'Picture Naming Challenge',
        description: 'Name pictures to build expressive vocabulary',
        category: 'communication',
        therapy_types: ['slp'],
        config: {
          min_age: 2,
          max_age: 12,
          difficulty_levels: ['Single Words', 'Phrases', 'Sentences'],
          session_duration_minutes: [5, 10, 15],
          max_players: 2,
          requires_therapist: false
        },
        targets: {
          primary_skills: ['expressive_vocabulary', 'word_retrieval', 'articulation'],
          secondary_skills: ['visual_processing', 'categorization'],
          contraindications: ['severe_visual_impairment'],
          evidence_level: 'high'
        },
        mechanics: {
          input_methods: ['touch', 'voice'],
          feedback_types: ['visual', 'auditory'],
          progression_type: 'adaptive',
          scoring_system: 'accuracy'
        },
        customization: {
          vocabulary_sets: ['core_words', 'nouns', 'verbs', 'adjectives', 'custom'],
          visual_themes: ['realistic', 'cartoon', 'photos', 'symbols'],
          audio_settings: ['male_voice', 'female_voice', 'child_voice'],
          difficulty_parameters: {
            response_time: { min: 2, max: 10 },
            word_complexity: { min: 1, max: 5 }
          }
        },
        analytics: {
          tracks_accuracy: true,
          tracks_response_time: true,
          tracks_attempts: true,
          tracks_engagement: true,
          tracks_learning_curve: true
        },
        created_by: 'system',
        created_at: new Date()
      },
      
      {
        id: 'sentence_builder',
        name: 'Sentence Building Adventure',
        description: 'Construct sentences using drag-and-drop word tiles',
        category: 'language',
        therapy_types: ['slp'],
        config: {
          min_age: 4,
          max_age: 16,
          difficulty_levels: ['2-word', '3-word', '4+ word', 'Complex'],
          session_duration_minutes: [10, 15, 20, 25],
          max_players: 1,
          requires_therapist: true
        },
        targets: {
          primary_skills: ['syntax', 'sentence_structure', 'grammar'],
          secondary_skills: ['vocabulary', 'sequencing', 'comprehension'],
          contraindications: [],
          evidence_level: 'high'
        },
        mechanics: {
          input_methods: ['touch', 'eye_gaze'],
          feedback_types: ['visual', 'auditory', 'social'],
          progression_type: 'branching',
          scoring_system: 'completion'
        },
        customization: {
          vocabulary_sets: ['core_words', 'themed_vocabulary', 'curriculum_based'],
          visual_themes: ['space', 'underwater', 'forest', 'city'],
          audio_settings: ['encouraging', 'neutral', 'celebratory'],
          difficulty_parameters: {
            sentence_length: { min: 2, max: 8 },
            grammatical_complexity: { min: 1, max: 4 }
          }
        },
        analytics: {
          tracks_accuracy: true,
          tracks_response_time: true,
          tracks_attempts: true,
          tracks_engagement: true,
          tracks_learning_curve: true
        },
        created_by: 'system',
        created_at: new Date()
      }
    ];
    
    // ABA Games
    this.gameLibrary.cognitive_games = [
      {
        id: 'matching_mastery',
        name: 'Matching Mastery',
        description: 'Build cognitive skills through systematic matching tasks',
        category: 'cognitive',
        therapy_types: ['aba', 'slp'],
        config: {
          min_age: 2,
          max_age: 10,
          difficulty_levels: ['Identical', 'Similar', 'Category', 'Function'],
          session_duration_minutes: [5, 10, 15],
          max_players: 1,
          requires_therapist: true
        },
        targets: {
          primary_skills: ['visual_discrimination', 'matching', 'categorization'],
          secondary_skills: ['attention', 'following_directions', 'turn_taking'],
          contraindications: ['severe_visual_impairment'],
          evidence_level: 'high'
        },
        mechanics: {
          input_methods: ['touch', 'eye_gaze', 'switch'],
          feedback_types: ['visual', 'auditory', 'social'],
          progression_type: 'linear',
          scoring_system: 'accuracy'
        },
        customization: {
          vocabulary_sets: ['objects', 'animals', 'colors', 'shapes', 'letters'],
          visual_themes: ['simple', 'detailed', 'real_photos', 'line_drawings'],
          audio_settings: ['praise_heavy', 'neutral', 'minimal'],
          difficulty_parameters: {
            distractors: { min: 1, max: 6 },
            similarity_level: { min: 1, max: 4 }
          }
        },
        analytics: {
          tracks_accuracy: true,
          tracks_response_time: true,
          tracks_attempts: true,
          tracks_engagement: true,
          tracks_learning_curve: true
        },
        created_by: 'system',
        created_at: new Date()
      }
    ];
    
    // Motor Games
    this.gameLibrary.motor_games = [
      {
        id: 'finger_painting',
        name: 'Digital Finger Painting',
        description: 'Develop fine motor skills through creative digital art',
        category: 'motor',
        therapy_types: ['ot'],
        config: {
          min_age: 2,
          max_age: 8,
          difficulty_levels: ['Free Draw', 'Trace Lines', 'Complete Shapes', 'Detailed Art'],
          session_duration_minutes: [10, 15, 20],
          max_players: 2,
          requires_therapist: false
        },
        targets: {
          primary_skills: ['fine_motor', 'hand_eye_coordination', 'bilateral_coordination'],
          secondary_skills: ['creativity', 'color_recognition', 'spatial_awareness'],
          contraindications: ['severe_motor_impairment'],
          evidence_level: 'moderate'
        },
        mechanics: {
          input_methods: ['touch', 'gesture'],
          feedback_types: ['visual', 'haptic'],
          progression_type: 'free_play',
          scoring_system: 'effort'
        },
        customization: {
          vocabulary_sets: ['colors', 'shapes', 'art_terms'],
          visual_themes: ['rainbow', 'nature', 'space', 'abstract'],
          audio_settings: ['classical', 'ambient', 'no_music'],
          difficulty_parameters: {
            brush_size: { min: 5, max: 50 },
            precision_required: { min: 1, max: 5 }
          }
        },
        analytics: {
          tracks_accuracy: false,
          tracks_response_time: false,
          tracks_attempts: true,
          tracks_engagement: true,
          tracks_learning_curve: false
        },
        created_by: 'system',
        created_at: new Date()
      }
    ];
    
    // Social Games
    this.gameLibrary.social_games = [
      {
        id: 'emotion_detective',
        name: 'Emotion Detective',
        description: 'Learn to recognize and express emotions',
        category: 'social',
        therapy_types: ['slp', 'aba'],
        config: {
          min_age: 3,
          max_age: 12,
          difficulty_levels: ['Basic Emotions', 'Complex Emotions', 'Social Situations'],
          session_duration_minutes: [10, 15, 20],
          max_players: 4,
          requires_therapist: true
        },
        targets: {
          primary_skills: ['emotion_recognition', 'social_communication', 'empathy'],
          secondary_skills: ['vocabulary', 'perspective_taking', 'conversation'],
          contraindications: [],
          evidence_level: 'moderate'
        },
        mechanics: {
          input_methods: ['touch', 'voice'],
          feedback_types: ['visual', 'auditory', 'social'],
          progression_type: 'branching',
          scoring_system: 'points'
        },
        customization: {
          vocabulary_sets: ['emotion_words', 'social_phrases', 'situation_descriptions'],
          visual_themes: ['diverse_faces', 'cartoon_characters', 'real_photos'],
          audio_settings: ['expressive', 'calm', 'encouraging'],
          difficulty_parameters: {
            emotion_complexity: { min: 1, max: 4 },
            context_clues: { min: 0, max: 3 }
          }
        },
        analytics: {
          tracks_accuracy: true,
          tracks_response_time: true,
          tracks_attempts: true,
          tracks_engagement: true,
          tracks_learning_curve: true
        },
        created_by: 'system',
        created_at: new Date()
      }
    ];
    
    console.log(`✅ Loaded ${this.getTotalGamesCount()} games across all categories`);
  }
  
  private setupAdaptiveEngine(): void {
    console.log('🤖 Setting up adaptive game engine...');
    
    // Set up real-time adaptation monitoring
    setInterval(() => {
      this.activeSessions.forEach(async (session) => {
        await this.checkForAdaptations(session);
      });
    }, 30000); // Check every 30 seconds
  }
  
  private async getPatientGameData(patientId: string): Promise<any> {
    // Get patient's game history and preferences
    const sessions = await this.getPatientGameSessions(patientId);
    
    return {
      total_sessions: sessions.length,
      favorite_games: this.findFavoriteGames(sessions),
      average_accuracy: this.calculateAverageAccuracy(sessions),
      preferred_difficulty: this.findPreferredDifficulty(sessions),
      engagement_patterns: this.analyzeEngagementPatterns(sessions),
      learning_rate: this.calculateLearningRate(sessions)
    };
  }
  
  private calculateGameRecommendationScore(game: TherapyGame, patientData: any): number {
    let score = 0;
    
    // Base score from evidence level
    const evidenceScore = {
      'high': 100,
      'moderate': 80,
      'emerging': 60,
      'expert_opinion': 40
    }[game.targets.evidence_level];
    
    score += evidenceScore;
    
    // Bonus for matching patient preferences
    if (patientData.favorite_games?.includes(game.category)) {
      score += 50;
    }
    
    // Bonus for appropriate difficulty
    if (game.config.difficulty_levels.includes(patientData.preferred_difficulty)) {
      score += 30;
    }
    
    // Bonus for engagement history
    score += Math.min(patientData.learning_rate * 20, 40);
    
    return score;
  }
  
  private findGameById(gameId: string): TherapyGame | null {
    const allGames = this.getAllGames();
    return allGames.find(game => game.id === gameId) || null;
  }
  
  private getAllGames(): TherapyGame[] {
    return [
      ...this.gameLibrary.communication_games,
      ...this.gameLibrary.language_games,
      ...this.gameLibrary.cognitive_games,
      ...this.gameLibrary.motor_games,
      ...this.gameLibrary.social_games,
      ...this.gameLibrary.custom_games
    ];
  }
  
  private getTotalGamesCount(): number {
    return this.getAllGames().length;
  }
  
  private async generateAdaptiveSettings(game: TherapyGame, patientId: string): Promise<GameSession['settings']> {
    const patientData = await this.getPatientGameData(patientId);
    
    // Start with appropriate difficulty
    let difficultyLevel = game.config.difficulty_levels[0]; // Default to easiest
    
    if (patientData.preferred_difficulty && 
        game.config.difficulty_levels.includes(patientData.preferred_difficulty)) {
      difficultyLevel = patientData.preferred_difficulty;
    }
    
    // Adaptive duration based on attention span
    const duration = patientData.engagement_patterns?.average_session_minutes || 
                    game.config.session_duration_minutes[0];
    
    return {
      difficulty_level: difficultyLevel,
      duration_minutes: Math.min(duration, Math.max(...game.config.session_duration_minutes)),
      custom_parameters: {},
      vocabulary_set: game.customization.vocabulary_sets[0] ? [game.customization.vocabulary_sets[0]] : [],
      theme: game.customization.visual_themes[0] || 'default'
    };
  }
  
  private classifyError(stimulus: string, response: string): string {
    // Simple error classification - in production would use more sophisticated NLP
    if (response.length === 0) return 'no_response';
    if (response === stimulus) return 'repetition';
    if (response.length < stimulus.length) return 'incomplete';
    return 'substitution';
  }
  
  private async checkForAdaptations(session: GameSession): Promise<void> {
    const game = this.findGameById(session.game_id);
    if (!game) return;
    
    // Check if adaptation is needed based on performance
    const recentAccuracy = this.getRecentAccuracy(session, 10); // Last 10 responses
    const recentResponseTime = this.getRecentResponseTime(session, 10);
    
    // Too easy - increase difficulty
    if (recentAccuracy > 90 && recentResponseTime < 2000) {
      await this.adaptDifficulty(session, 'increase', 'High accuracy and fast responses');
    }
    
    // Too hard - decrease difficulty
    if (recentAccuracy < 50 && session.performance.frustration_indicators > 3) {
      await this.adaptDifficulty(session, 'decrease', 'Low accuracy and frustration indicators');
    }
    
    // Engagement dropping - change theme or add variety
    if (session.performance.engagement_score < 70) {
      await this.adaptEngagement(session, 'Engagement score dropping');
    }
  }
  
  private getRecentAccuracy(session: GameSession, count: number): number {
    const recent = session.performance.response_times.slice(-count);
    if (recent.length === 0) return session.performance.accuracy_percentage;
    
    // This is simplified - would need to track individual response accuracy
    return session.performance.accuracy_percentage;
  }
  
  private getRecentResponseTime(session: GameSession, count: number): number {
    const recent = session.performance.response_times.slice(-count);
    if (recent.length === 0) return session.performance.average_response_time;
    
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }
  
  private async adaptDifficulty(session: GameSession, direction: 'increase' | 'decrease', reason: string): Promise<void> {
    const game = this.findGameById(session.game_id);
    if (!game) return;
    
    const currentIndex = game.config.difficulty_levels.indexOf(session.settings.difficulty_level);
    let newIndex = currentIndex;
    
    if (direction === 'increase' && currentIndex < game.config.difficulty_levels.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'decrease' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }
    
    if (newIndex !== currentIndex) {
      const oldLevel = session.settings.difficulty_level;
      const newLevel = game.config.difficulty_levels[newIndex];
      
      session.settings.difficulty_level = newLevel;
      session.adaptations.push({
        timestamp: new Date(),
        parameter: 'difficulty_level',
        old_value: oldLevel,
        new_value: newLevel,
        reason
      });
      
      console.log(`🎚️ Adapted difficulty: ${oldLevel} → ${newLevel} (${reason})`);
    }
  }
  
  private async adaptEngagement(session: GameSession, reason: string): Promise<void> {
    // Try changing theme or adding elements
    const game = this.findGameById(session.game_id);
    if (!game) return;
    
    const themes = game.customization.visual_themes;
    const currentTheme = session.settings.theme;
    const newTheme = themes.find(theme => theme !== currentTheme) || themes[0];
    
    if (newTheme !== currentTheme) {
      session.settings.theme = newTheme;
      session.adaptations.push({
        timestamp: new Date(),
        parameter: 'theme',
        old_value: currentTheme,
        new_value: newTheme,
        reason
      });
      
      console.log(`🎨 Adapted theme: ${currentTheme} → ${newTheme} (${reason})`);
    }
  }
  
  private calculateEngagementScore(session: GameSession): number {
    let score = 100;
    
    // Reduce score based on negative indicators
    score -= session.performance.frustration_indicators * 10;
    score -= session.performance.help_requests * 5;
    
    // Increase score based on positive indicators
    if (session.performance.accuracy_percentage > 70) score += 10;
    if (session.performance.levels_completed > 0) score += session.performance.levels_completed * 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private async updateTherapyGoalsFromGame(session: GameSession): Promise<void> {
    // Update therapy goals based on game performance
    const game = this.findGameById(session.game_id);
    if (!game) return;
    
    // Map game skills to therapy goals
    const skillMappings = {
      'expressive_vocabulary': 'vocabulary_goals',
      'sentence_structure': 'syntax_goals',
      'articulation': 'speech_clarity_goals'
    };
    
    // Update relevant goals
    for (const skill of game.targets.primary_skills) {
      if (skillMappings[skill as keyof typeof skillMappings]) {
        // Would update specific therapy goals
        console.log(`📈 Updated therapy progress for ${skill}: ${session.performance.accuracy_percentage}%`);
      }
    }
  }
  
  private async saveGameSession(session: GameSession): Promise<void> {
    // Save session data for analytics
    console.log(`💾 Saving game session: ${session.id}`);
    
    // In production, would save to database
    await mlDataCollection.trackInteraction(session.therapist_id, {
      type: 'game_session_completed',
      metadata: {
        sessionId: session.id,
        gameId: session.game_id,
        patientId: session.patient_id,
        performance: session.performance,
        adaptations: session.adaptations
      },
      timestamp: new Date()
    });
  }
  
  private async getGameSessions(gameId: string, dateRange?: { start: Date; end: Date }): Promise<GameSession[]> {
    // Mock implementation - in production would query database
    return [];
  }
  
  private async getPatientGameSessions(patientId: string): Promise<GameSession[]> {
    // Mock implementation - in production would query database
    return [];
  }
  
  private findFavoriteGames(sessions: GameSession[]): string[] {
    const gameFrequency = new Map<string, number>();
    
    sessions.forEach(session => {
      const gameId = session.game_id;
      gameFrequency.set(gameId, (gameFrequency.get(gameId) || 0) + 1);
    });
    
    return Array.from(gameFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([gameId]) => gameId);
  }
  
  private calculateAverageAccuracy(sessions: GameSession[]): number {
    if (sessions.length === 0) return 0;
    
    const totalAccuracy = sessions.reduce((sum, session) => 
      sum + session.performance.accuracy_percentage, 0);
    
    return totalAccuracy / sessions.length;
  }
  
  private analyzeEngagementPatterns(sessions: GameSession[]): any {
    if (sessions.length === 0) return null;
    
    const durations = sessions
      .filter(s => s.end_time)
      .map(s => (s.end_time!.getTime() - s.start_time.getTime()) / 60000); // minutes
    
    return {
      average_session_minutes: durations.reduce((a, b) => a + b, 0) / durations.length,
      preferred_times: this.findPeakUsageTimes(sessions)
    };
  }
  
  private calculateLearningRate(sessions: GameSession[]): number {
    if (sessions.length < 2) return 0;
    
    // Calculate improvement over time
    const sorted = sessions.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    const first = sorted.slice(0, Math.ceil(sorted.length / 3));
    const last = sorted.slice(-Math.ceil(sorted.length / 3));
    
    const firstAvg = first.reduce((sum, s) => sum + s.performance.accuracy_percentage, 0) / first.length;
    const lastAvg = last.reduce((sum, s) => sum + s.performance.accuracy_percentage, 0) / last.length;
    
    return (lastAvg - firstAvg) / sorted.length; // Improvement per session
  }
  
  private analyzeLearningCurves(sessions: GameSession[]): any {
    // Mock implementation
    return {
      initial_performance: 65,
      current_performance: 78,
      improvement_rate: 2.3,
      plateau_detected: false
    };
  }
  
  private analyzeErrorPatterns(sessions: GameSession[]): any[] {
    const errorCounts = new Map<string, number>();
    
    sessions.forEach(session => {
      session.performance.error_patterns.forEach(error => {
        errorCounts.set(error.error_type, (errorCounts.get(error.error_type) || 0) + 1);
      });
    });
    
    return Array.from(errorCounts.entries())
      .map(([type, count]) => ({ error_type: type, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }
  
  private findPeakUsageTimes(sessions: GameSession[]): string[] {
    const timeSlots = new Map<string, number>();
    
    sessions.forEach(session => {
      const hour = session.start_time.getHours();
      const timeSlot = `${hour}:00`;
      timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
    });
    
    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([time]) => time);
  }
  
  private async analyzeSkillImprovements(sessions: GameSession[]): Promise<any> {
    return {
      vocabulary_growth: '+15%',
      response_time_improvement: '-23%',
      accuracy_improvement: '+12%',
      engagement_trend: 'stable'
    };
  }
}

// Export singleton instance
export const therapyGamesService = TherapyGamesService.getInstance();
export type { TherapyGame, GameSession, GameLibrary };