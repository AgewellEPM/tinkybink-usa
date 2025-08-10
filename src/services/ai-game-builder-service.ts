/**
 * AI-Powered Game Builder Service
 * Takes natural language input from therapists and automatically builds games using tile injection system
 * All visuals are emoji-based for accessibility and engagement
 */

import { getTileManagementService } from '../modules/ui/tile-management-service';
import { getBoardManager } from '../modules/core/board-manager';
import { gpt4AnalyticsService } from './gpt4-analytics-service';
import { userHistoryTrackingService } from './user-history-tracking-service';
import { safeLocalStorage } from '@/utils/storage-helper';

export interface GameRequest {
  request_id: string;
  therapist_id: string;
  patient_id?: string;
  natural_language_request: string;
  patient_age?: number;
  diagnosis?: string[];
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  session_duration?: number;
  therapy_goals?: string[];
  created_at: Date;
}

export interface GeneratedGame {
  game_id: string;
  game_name: string;
  description: string;
  target_skills: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  estimated_duration: number;
  tiles: GameTile[];
  game_rules: GameRule[];
  success_criteria: SuccessCriteria;
  adaptive_features: AdaptiveFeature[];
  emoji_theme: EmojiTheme;
  created_from_request: string;
  generated_at: Date;
}

export interface GameTile {
  tile_id: string;
  emoji: string;
  label: string;
  category: string;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  interactive_type: 'tap' | 'drag' | 'swipe' | 'hold' | 'sequence';
  audio_cue?: string;
  haptic_feedback?: boolean;
  animation?: string;
  related_tiles?: string[];
  therapeutic_value: string;
}

export interface GameRule {
  rule_id: string;
  rule_type: 'matching' | 'sequencing' | 'categorizing' | 'memory' | 'selection' | 'completion';
  description: string;
  trigger_condition: string;
  success_action: string;
  failure_action: string;
  hint_system: string[];
  difficulty_scaling: boolean;
}

export interface SuccessCriteria {
  primary_goal: string;
  success_percentage: number;
  time_limit?: number;
  attempts_allowed?: number;
  mastery_threshold: number;
  celebration_emoji: string;
  reward_system: string[];
}

export interface AdaptiveFeature {
  feature_type: 'difficulty_scaling' | 'hint_system' | 'error_correction' | 'pacing';
  trigger_conditions: string[];
  adaptation_actions: string[];
  learning_data_points: string[];
}

export interface EmojiTheme {
  theme_name: string;
  primary_category: string;
  emoji_set: string[];
  color_associations: { [emoji: string]: string };
  semantic_groupings: { [group: string]: string[] };
}

export class AIGameBuilderService {
  private static instance: AIGameBuilderService;
  private gameRequests: Map<string, GameRequest> = new Map();
  private generatedGames: Map<string, GeneratedGame> = new Map();
  private tileService = getTileManagementService();
  private boardManager = getBoardManager();

  // Emoji libraries organized by therapeutic categories
  private emojiLibraries = {
    emotions: ['😀', '😢', '😠', '😱', '😴', '🤔', '😍', '😭', '🤗', '😌', '😆', '😔', '😤', '😰', '🥰', '😊'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐷', '🐮', '🐔'],
    food: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥕', '🍞', '🥛', '🍪', '🍰', '🍕', '🍔', '🌭', '🥗', '🍝', '🍜'],
    colors: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🖤', '🤍', '🤎', '🟤', '🔸', '🔹', '💙', '💚', '💛', '🧡'],
    shapes: ['⭐', '🔴', '🔺', '🔶', '🔷', '🔸', '🔹', '⚫', '⚪', '🟫', '🟪', '🟦', '🟩', '🟨', '🟧', '🟥'],
    numbers: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '💯', '🔢', '➕', '➖', '✖️', '➗'],
    letters: ['🅰️', '🅱️', '©️', '🅾️', '🆚', '🔤', '🔡', '🔠', '📝', '✏️', '📖', '📚', '📄', '📃', '📋', '📌'],
    actions: ['👏', '👍', '👎', '👋', '🤝', '👐', '🙌', '👌', '✊', '👊', '🤏', '✋', '🖐️', '🖖', '👆', '👇'],
    social: ['👶', '👦', '👧', '👨', '👩', '👴', '👵', '👪', '👫', '👬', '👭', '🏠', '🏫', '🏥', '🏪', '⛪'],
    sensory: ['👀', '👂', '👃', '👄', '👅', '🫶', '🤲', '👐', '🙏', '💨', '💫', '⭐', '✨', '💥', '🔊', '🔇'],
    weather: ['☀️', '🌙', '⭐', '☁️', '⛅', '🌧️', '⛈️', '🌩️', '❄️', '☃️', '🌈', '🌪️', '🌊', '💧', '💨', '🔥']
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): AIGameBuilderService {
    if (!AIGameBuilderService.instance) {
      AIGameBuilderService.instance = new AIGameBuilderService();
    }
    return AIGameBuilderService.instance;
  }

  private initialize(): void {
    console.log('🎮 AI Game Builder Service initialized with emoji-based tile system');
    this.loadGameData();
  }

  /**
   * Main method: Takes natural language input and generates a complete game
   */
  async generateGameFromRequest(request: Omit<GameRequest, 'request_id' | 'created_at'>): Promise<GeneratedGame> {
    const gameRequest: GameRequest = {
      ...request,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date()
    };

    this.gameRequests.set(gameRequest.request_id, gameRequest);

    console.log(`🤖 Processing game request: "${request.natural_language_request}"`);

    // Step 1: Parse the natural language request
    const parsedRequest = await this.parseNaturalLanguageRequest(request.natural_language_request);

    // Step 2: Select appropriate emoji theme and tiles
    const emojiTheme = this.selectEmojiTheme(parsedRequest);
    const gameTiles = this.generateGameTiles(parsedRequest, emojiTheme);

    // Step 3: Create game rules based on therapeutic goals
    const gameRules = this.generateGameRules(parsedRequest, gameTiles);

    // Step 4: Set up success criteria and adaptive features
    const successCriteria = this.createSuccessCriteria(parsedRequest);
    const adaptiveFeatures = this.createAdaptiveFeatures(parsedRequest);

    // Step 5: Assemble the complete game
    const generatedGame: GeneratedGame = {
      game_id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      game_name: this.generateGameName(parsedRequest),
      description: this.generateGameDescription(parsedRequest),
      target_skills: parsedRequest.targetSkills,
      difficulty_level: this.determineDifficultyLevel(request.skill_level, request.patient_age),
      estimated_duration: request.session_duration || this.estimateDuration(parsedRequest),
      tiles: gameTiles,
      game_rules: gameRules,
      success_criteria: successCriteria,
      adaptive_features: adaptiveFeatures,
      emoji_theme: emojiTheme,
      created_from_request: gameRequest.request_id,
      generated_at: new Date()
    };

    this.generatedGames.set(generatedGame.game_id, generatedGame);

    // Step 6: Deploy to tile system
    await this.deployGameToTileSystem(generatedGame);

    // Step 7: Log for analytics
    this.logGameGeneration(gameRequest, generatedGame);

    console.log(`✅ Generated game: "${generatedGame.game_name}" with ${gameTiles.length} emoji tiles`);
    
    this.saveGameData();
    return generatedGame;
  }

  /**
   * Parse natural language requests using AI pattern matching
   */
  private async parseNaturalLanguageRequest(request: string): Promise<{
    gameType: string;
    targetSkills: string[];
    subjects: string[];
    emojiCategories: string[];
    interactionTypes: string[];
    difficultyHints: string[];
    therapeuticGoals: string[];
  }> {
    const lowercaseRequest = request.toLowerCase();

    // Pattern matching for game types
    const gameTypePatterns = {
      matching: ['match', 'matching', 'pair', 'pairing', 'same', 'identical'],
      memory: ['memory', 'remember', 'recall', 'memorize', 'sequence'],
      categorizing: ['sort', 'group', 'category', 'organize', 'classify'],
      selection: ['choose', 'select', 'pick', 'find', 'identify'],
      sequencing: ['order', 'sequence', 'arrange', 'pattern', 'series'],
      completion: ['complete', 'finish', 'fill', 'missing', 'puzzle']
    };

    // Extract game type
    let gameType = 'selection'; // default
    for (const [type, patterns] of Object.entries(gameTypePatterns)) {
      if (patterns.some(pattern => lowercaseRequest.includes(pattern))) {
        gameType = type;
        break;
      }
    }

    // Extract subjects and emoji categories
    const subjectPatterns = {
      emotions: ['emotion', 'feeling', 'happy', 'sad', 'angry', 'mood'],
      animals: ['animal', 'pet', 'dog', 'cat', 'farm', 'zoo', 'wildlife'],
      food: ['food', 'fruit', 'vegetable', 'meal', 'eating', 'nutrition'],
      colors: ['color', 'red', 'blue', 'green', 'yellow', 'rainbow'],
      shapes: ['shape', 'circle', 'square', 'triangle', 'geometry'],
      numbers: ['number', 'count', 'math', 'arithmetic', 'quantity'],
      letters: ['letter', 'alphabet', 'reading', 'spelling', 'literacy'],
      social: ['social', 'family', 'friend', 'people', 'community'],
      weather: ['weather', 'sunny', 'rainy', 'cloudy', 'season']
    };

    const subjects: string[] = [];
    const emojiCategories: string[] = [];

    for (const [category, patterns] of Object.entries(subjectPatterns)) {
      if (patterns.some(pattern => lowercaseRequest.includes(pattern))) {
        subjects.push(category);
        emojiCategories.push(category);
      }
    }

    // Extract target skills
    const skillPatterns = {
      'visual_recognition': ['see', 'look', 'visual', 'recognize', 'identify'],
      'fine_motor': ['touch', 'tap', 'drag', 'motor', 'coordination'],
      'cognitive': ['think', 'solve', 'problem', 'cognitive', 'brain'],
      'language': ['speak', 'say', 'word', 'language', 'communication'],
      'social': ['share', 'turn', 'together', 'social', 'interact'],
      'emotional': ['feel', 'emotion', 'express', 'emotional', 'mood'],
      'attention': ['focus', 'attention', 'concentrate', 'pay attention'],
      'memory': ['remember', 'memory', 'recall', 'memorize']
    };

    const targetSkills: string[] = [];
    for (const [skill, patterns] of Object.entries(skillPatterns)) {
      if (patterns.some(pattern => lowercaseRequest.includes(pattern))) {
        targetSkills.push(skill);
      }
    }

    // Extract interaction types
    const interactionPatterns = {
      tap: ['tap', 'touch', 'press', 'click'],
      drag: ['drag', 'move', 'slide', 'pull'],
      swipe: ['swipe', 'flick', 'brush'],
      sequence: ['sequence', 'order', 'series', 'chain']
    };

    const interactionTypes: string[] = [];
    for (const [interaction, patterns] of Object.entries(interactionPatterns)) {
      if (patterns.some(pattern => lowercaseRequest.includes(pattern))) {
        interactionTypes.push(interaction);
      }
    }

    // Extract difficulty hints
    const difficultyPatterns = {
      easy: ['easy', 'simple', 'basic', 'beginner', 'start'],
      medium: ['medium', 'intermediate', 'moderate'],
      hard: ['hard', 'difficult', 'advanced', 'challenge', 'complex']
    };

    const difficultyHints: string[] = [];
    for (const [level, patterns] of Object.entries(difficultyPatterns)) {
      if (patterns.some(pattern => lowercaseRequest.includes(pattern))) {
        difficultyHints.push(level);
      }
    }

    // Extract therapeutic goals
    const therapeuticGoals = [
      'improve_focus',
      'enhance_communication',
      'develop_motor_skills',
      'increase_social_interaction',
      'build_confidence',
      'reduce_anxiety'
    ];

    return {
      gameType,
      targetSkills: targetSkills.length > 0 ? targetSkills : ['visual_recognition'],
      subjects: subjects.length > 0 ? subjects : ['emotions'],
      emojiCategories: emojiCategories.length > 0 ? emojiCategories : ['emotions'],
      interactionTypes: interactionTypes.length > 0 ? interactionTypes : ['tap'],
      difficultyHints,
      therapeuticGoals
    };
  }

  /**
   * Select emoji theme based on parsed request
   */
  private selectEmojiTheme(parsedRequest: any): EmojiTheme {
    const primaryCategory = parsedRequest.emojiCategories[0] || 'emotions';
    const emojiSet = this.emojiLibraries[primaryCategory] || this.emojiLibraries.emotions;

    // Create color associations for emojis
    const colorAssociations: { [emoji: string]: string } = {};
    emojiSet.forEach((emoji, index) => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
      colorAssociations[emoji] = colors[index % colors.length];
    });

    // Create semantic groupings
    const semanticGroupings: { [group: string]: string[] } = {};
    if (primaryCategory === 'emotions') {
      semanticGroupings['positive'] = ['😀', '😊', '🥰', '😍', '😆', '🤗', '😌'];
      semanticGroupings['negative'] = ['😢', '😠', '😱', '😰', '😭', '😔', '😤'];
    } else if (primaryCategory === 'animals') {
      semanticGroupings['pets'] = ['🐶', '🐱', '🐭', '🐹', '🐰'];
      semanticGroupings['farm'] = ['🐮', '🐷', '🐔', '🐴', '🐑'];
      semanticGroupings['wild'] = ['🦁', '🐯', '🐻', '🦊', '🐺'];
    }

    return {
      theme_name: `${primaryCategory}_theme`,
      primary_category: primaryCategory,
      emoji_set: emojiSet.slice(0, 12), // Limit to 12 for manageable games
      color_associations: colorAssociations,
      semantic_groupings: semanticGroupings
    };
  }

  /**
   * Generate game tiles based on request and theme
   */
  private generateGameTiles(parsedRequest: any, theme: EmojiTheme): GameTile[] {
    const tiles: GameTile[] = [];
    const gridSize = this.determineGridSize(parsedRequest.gameType);
    const tileSize = this.determineTileSize(parsedRequest.targetSkills);
    const interactiveType = parsedRequest.interactionTypes[0] || 'tap';

    theme.emoji_set.forEach((emoji, index) => {
      const position = this.calculateTilePosition(index, gridSize);
      
      const tile: GameTile = {
        tile_id: `tile_${emoji}_${index}`,
        emoji: emoji,
        label: this.getEmojiLabel(emoji, theme.primary_category),
        category: theme.primary_category,
        position: position,
        size: tileSize,
        interactive_type: interactiveType as any,
        audio_cue: this.generateAudioCue(emoji, theme.primary_category),
        haptic_feedback: true,
        animation: this.selectAnimation(parsedRequest.gameType),
        related_tiles: this.findRelatedTiles(emoji, theme),
        therapeutic_value: this.calculateTherapeuticValue(emoji, parsedRequest.targetSkills)
      };

      tiles.push(tile);
    });

    return tiles;
  }

  /**
   * Generate game rules based on game type and tiles
   */
  private generateGameRules(parsedRequest: any, tiles: GameTile[]): GameRule[] {
    const rules: GameRule[] = [];

    switch (parsedRequest.gameType) {
      case 'matching':
        rules.push({
          rule_id: 'matching_rule',
          rule_type: 'matching',
          description: 'Tap two matching emojis',
          trigger_condition: 'tile_selected',
          success_action: 'celebrate_match',
          failure_action: 'show_hint',
          hint_system: ['Look for the same emoji', 'Try again', 'Great effort!'],
          difficulty_scaling: true
        });
        break;

      case 'sequencing':
        rules.push({
          rule_id: 'sequence_rule',
          rule_type: 'sequencing',
          description: 'Tap emojis in the correct order',
          trigger_condition: 'sequence_started',
          success_action: 'advance_sequence',
          failure_action: 'reset_sequence',
          hint_system: ['Follow the pattern', 'Watch carefully', 'You can do it!'],
          difficulty_scaling: true
        });
        break;

      case 'categorizing':
        rules.push({
          rule_id: 'category_rule',
          rule_type: 'categorizing',
          description: 'Group similar emojis together',
          trigger_condition: 'drag_to_category',
          success_action: 'confirm_category',
          failure_action: 'return_to_origin',
          hint_system: ['These go together', 'Think about what they have in common', 'Nice try!'],
          difficulty_scaling: true
        });
        break;

      default:
        rules.push({
          rule_id: 'selection_rule',
          rule_type: 'selection',
          description: 'Find and tap the correct emoji',
          trigger_condition: 'tile_tapped',
          success_action: 'celebrate_success',
          failure_action: 'encourage_retry',
          hint_system: ['Keep looking', 'You\'re close', 'Great job trying!'],
          difficulty_scaling: false
        });
    }

    return rules;
  }

  /**
   * Create success criteria for the game
   */
  private createSuccessCriteria(parsedRequest: any): SuccessCriteria {
    const difficultyMultiplier = parsedRequest.difficultyHints.includes('hard') ? 0.9 : 
                                parsedRequest.difficultyHints.includes('easy') ? 0.7 : 0.8;

    return {
      primary_goal: `Complete ${parsedRequest.gameType} activity with ${parsedRequest.subjects.join(', ')} emojis`,
      success_percentage: Math.round(difficultyMultiplier * 100),
      time_limit: this.calculateTimeLimit(parsedRequest),
      attempts_allowed: parsedRequest.difficultyHints.includes('easy') ? undefined : 3,
      mastery_threshold: Math.round(difficultyMultiplier * 100),
      celebration_emoji: '🎉',
      reward_system: ['🌟', '🏆', '👏', '🎊', '💫']
    };
  }

  /**
   * Create adaptive features for personalized learning
   */
  private createAdaptiveFeatures(parsedRequest: any): AdaptiveFeature[] {
    return [
      {
        feature_type: 'difficulty_scaling',
        trigger_conditions: ['success_rate_high', 'completion_time_fast'],
        adaptation_actions: ['increase_complexity', 'add_distractors', 'reduce_hints'],
        learning_data_points: ['accuracy', 'response_time', 'hint_usage']
      },
      {
        feature_type: 'hint_system',
        trigger_conditions: ['multiple_failures', 'long_hesitation'],
        adaptation_actions: ['provide_visual_hint', 'highlight_correct_answer', 'offer_encouragement'],
        learning_data_points: ['error_patterns', 'hesitation_points', 'help_requests']
      },
      {
        feature_type: 'error_correction',
        trigger_conditions: ['repeated_same_error', 'confusion_detected'],
        adaptation_actions: ['provide_explanation', 'show_demonstration', 'simplify_task'],
        learning_data_points: ['error_types', 'correction_response', 'learning_speed']
      }
    ];
  }

  /**
   * Deploy the generated game to the tile management system
   */
  private async deployGameToTileSystem(game: GeneratedGame): Promise<void> {
    try {
      // Create a new board for this game
      const boardId = await this.boardManager.createBoard(`${game.game_name}_board`);
      
      // Add each game tile to the board
      for (const tile of game.tiles) {
        await this.tileService.createTile({
          text: tile.emoji,
          symbol: tile.emoji,
          category: tile.category,
          position: tile.position,
          size: tile.size,
          color: game.emoji_theme.color_associations[tile.emoji] || '#667eea',
          audioEnabled: true,
          hapticEnabled: tile.haptic_feedback || false
        });
      }

      // Set up game rules as tile behaviors
      for (const rule of game.game_rules) {
        await this.setupTileRule(rule, game.tiles);
      }

      console.log(`🎮 Game "${game.game_name}" deployed to tile system with board ID: ${boardId}`);
    } catch (error) {
      console.error('Failed to deploy game to tile system:', error);
    }
  }

  // Helper methods

  private determineGridSize(gameType: string): { rows: number; cols: number } {
    const gridSizes = {
      matching: { rows: 3, cols: 4 },
      memory: { rows: 2, cols: 3 },
      categorizing: { rows: 4, cols: 3 },
      selection: { rows: 2, cols: 4 },
      sequencing: { rows: 1, cols: 6 },
      completion: { rows: 3, cols: 3 }
    };
    return gridSizes[gameType] || { rows: 3, cols: 3 };
  }

  private determineTileSize(targetSkills: string[]): 'small' | 'medium' | 'large' {
    if (targetSkills.includes('fine_motor')) return 'small';
    if (targetSkills.includes('visual_recognition')) return 'large';
    return 'medium';
  }

  private calculateTilePosition(index: number, gridSize: { rows: number; cols: number }): { x: number; y: number } {
    const row = Math.floor(index / gridSize.cols);
    const col = index % gridSize.cols;
    return {
      x: col * (100 / gridSize.cols),
      y: row * (100 / gridSize.rows)
    };
  }

  private getEmojiLabel(emoji: string, category: string): string {
    const labels = {
      emotions: {
        '😀': 'happy', '😢': 'sad', '😠': 'angry', '😱': 'scared',
        '😴': 'sleepy', '🤔': 'thinking', '😍': 'love', '😭': 'crying'
      },
      animals: {
        '🐶': 'dog', '🐱': 'cat', '🐭': 'mouse', '🐹': 'hamster',
        '🐰': 'rabbit', '🦊': 'fox', '🐻': 'bear', '🐼': 'panda'
      },
      food: {
        '🍎': 'apple', '🍌': 'banana', '🍊': 'orange', '🍇': 'grapes',
        '🍓': 'strawberry', '🥕': 'carrot', '🍞': 'bread', '🥛': 'milk'
      }
    };
    return labels[category]?.[emoji] || emoji;
  }

  private generateAudioCue(emoji: string, category: string): string {
    return `Say "${this.getEmojiLabel(emoji, category)}"`;
  }

  private selectAnimation(gameType: string): string {
    const animations = {
      matching: 'pulse',
      memory: 'flip',
      categorizing: 'slide',
      selection: 'bounce',
      sequencing: 'glow',
      completion: 'fade'
    };
    return animations[gameType] || 'pulse';
  }

  private findRelatedTiles(emoji: string, theme: EmojiTheme): string[] {
    for (const [group, emojis] of Object.entries(theme.semantic_groupings)) {
      if (emojis.includes(emoji)) {
        return emojis.filter(e => e !== emoji);
      }
    }
    return [];
  }

  private calculateTherapeuticValue(emoji: string, targetSkills: string[]): string {
    return `Develops ${targetSkills.join(', ')} through ${emoji} interaction`;
  }

  private determineDifficultyLevel(skillLevel?: string, age?: number): 'easy' | 'medium' | 'hard' {
    if (skillLevel) {
      return skillLevel === 'beginner' ? 'easy' : 
             skillLevel === 'advanced' ? 'hard' : 'medium';
    }
    if (age) {
      return age < 5 ? 'easy' : age > 12 ? 'hard' : 'medium';
    }
    return 'medium';
  }

  private estimateDuration(parsedRequest: any): number {
    const baseDurations = {
      matching: 10,
      memory: 15,
      categorizing: 12,
      selection: 8,
      sequencing: 20,
      completion: 18
    };
    return baseDurations[parsedRequest.gameType] || 12;
  }

  private generateGameName(parsedRequest: any): string {
    const gameTypeNames = {
      matching: 'Match the',
      memory: 'Remember the',
      categorizing: 'Sort the',
      selection: 'Find the',
      sequencing: 'Order the',
      completion: 'Complete the'
    };
    
    const subjectName = parsedRequest.subjects[0] || 'emojis';
    const gameTypeName = gameTypeNames[parsedRequest.gameType] || 'Play with';
    
    return `${gameTypeName} ${subjectName.charAt(0).toUpperCase() + subjectName.slice(1)}`;
  }

  private generateGameDescription(parsedRequest: any): string {
    const subject = parsedRequest.subjects[0] || 'emojis';
    const skills = parsedRequest.targetSkills.join(', ');
    
    return `An interactive ${parsedRequest.gameType} game using ${subject} emojis to develop ${skills}. Designed for therapeutic engagement and skill building.`;
  }

  private calculateTimeLimit(parsedRequest: any): number | undefined {
    if (parsedRequest.difficultyHints.includes('easy')) return undefined;
    const baseTimes = {
      matching: 60,
      memory: 90,
      categorizing: 120,
      selection: 45,
      sequencing: 180,
      completion: 150
    };
    return baseTimes[parsedRequest.gameType] || 90;
  }

  private async setupTileRule(rule: GameRule, tiles: GameTile[]): Promise<void> {
    // Implementation would integrate with tile management system
    console.log(`Setting up rule: ${rule.description} for ${tiles.length} tiles`);
  }

  private logGameGeneration(request: GameRequest, game: GeneratedGame): void {
    gpt4AnalyticsService.trackEvent('game_generated', {
      request_id: request.request_id,
      game_id: game.game_id,
      therapist_id: request.therapist_id,
      natural_language_request: request.natural_language_request,
      generated_tiles: game.tiles.length,
      target_skills: game.target_skills,
      emoji_theme: game.emoji_theme.theme_name,
      difficulty_level: game.difficulty_level
    });
  }

  private loadGameData(): void {
    try {
      const savedRequests = safeLocalStorage.getItem('aiGameRequests');
      if (savedRequests) {
        const data = JSON.parse(savedRequests);
        data.forEach((req: any) => {
          req.created_at = new Date(req.created_at);
          this.gameRequests.set(req.request_id, req);
        });
      }

      const savedGames = safeLocalStorage.getItem('aiGeneratedGames');
      if (savedGames) {
        const data = JSON.parse(savedGames);
        data.forEach((game: any) => {
          game.generated_at = new Date(game.generated_at);
          this.generatedGames.set(game.game_id, game);
        });
      }
    } catch (error) {
      console.warn('Could not load AI game data:', error);
    }
  }

  private saveGameData(): void {
    try {
      const requests = Array.from(this.gameRequests.values());
      safeLocalStorage.setItem('aiGameRequests', JSON.stringify(requests));

      const games = Array.from(this.generatedGames.values());
      safeLocalStorage.setItem('aiGeneratedGames', JSON.stringify(games));
    } catch (error) {
      console.warn('Could not save AI game data:', error);
    }
  }

  // Public methods for external access

  /**
   * Get all generated games for a therapist
   */
  getTherapistGames(therapistId: string): GeneratedGame[] {
    const requests = Array.from(this.gameRequests.values())
      .filter(req => req.therapist_id === therapistId);
    
    return Array.from(this.generatedGames.values())
      .filter(game => requests.some(req => req.request_id === game.created_from_request));
  }

  /**
   * Get a specific generated game
   */
  getGame(gameId: string): GeneratedGame | null {
    return this.generatedGames.get(gameId) || null;
  }

  /**
   * Get game analytics
   */
  getGameAnalytics(gameId: string): any {
    const game = this.generatedGames.get(gameId);
    if (!game) return null;

    return {
      game_id: gameId,
      total_plays: 0, // Would be tracked in real implementation
      success_rate: 0,
      average_completion_time: 0,
      most_challenging_tiles: [],
      skill_improvement_metrics: {}
    };
  }
}

// Export singleton instance
export const aiGameBuilderService = AIGameBuilderService.getInstance();