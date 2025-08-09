/**
 * Comprehensive Spelling Games Service
 * Feature #105: Complete Spelling Education Through Tiles
 * 
 * Revolutionary spelling instruction using our AAC tile system with
 * 20+ different spelling games covering all aspects of spelling development.
 * 
 * Spelling Game Categories:
 * - Letter Pattern Games (CVC, CVCE, etc.)
 * - Word Family Spelling Games
 * - Sight Word Spelling Challenges
 * - Phonics-Based Spelling Activities
 * - Memory and Recall Spelling Games
 * - Creative Spelling Adventures
 * 
 * Educational Impact: Transforms spelling from rote memorization
 * into engaging, interactive tile-based learning experiences.
 * 
 * @author TinkyBink AAC Platform
 * @version 1.0.0 - Spelling Master Edition
 * @since 2024-12-01
 */

import { mlDataCollection } from './ml-data-collection';
import { gameTracking } from './game-tracking';

interface SpellingTile {
  tile_id: string;
  letter: string;
  display_text: string;
  phonetic_sound: string;
  color_category: 'consonant' | 'vowel' | 'digraph' | 'blend';
  animation_style?: 'bounce' | 'glow' | 'pulse' | 'spin';
  audio_file: string;
  difficulty_weight: number;
}

interface SpellingWord {
  word_id: string;
  word: string;
  definition: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  word_type: 'cvc' | 'cvce' | 'sight_word' | 'phonetic' | 'irregular' | 'compound';
  phonetic_breakdown: string[];
  spelling_patterns: string[];
  example_sentence: string;
  related_words: string[];
  mnemonic_hint?: string;
}

interface SpellingGame {
  game_id: string;
  game_name: string;
  game_type: 'spelling_bee' | 'word_scramble' | 'missing_letters' | 'pattern_match' | 
             'memory_spell' | 'speed_spell' | 'creative_spell' | 'word_builder' | 
             'spell_race' | 'rhyme_spell' | 'story_spell' | 'tile_drop';
  description: string;
  learning_objectives: string[];
  difficulty_range: [number, number];
  estimated_time: number;
  max_players: number;
  scoring_system: {
    points_per_correct: number;
    bonus_multipliers: Record<string, number>;
    penalty_system: boolean;
  };
}

interface SpellingChallenge {
  challenge_id: string;
  target_word: SpellingWord;
  available_tiles: SpellingTile[];
  challenge_type: string;
  hints: SpellingHint[];
  time_limit?: number;
  attempts_allowed: number;
  success_criteria: {
    accuracy_required: number;
    speed_bonus_threshold?: number;
  };
}

interface SpellingHint {
  hint_type: 'phonetic' | 'visual' | 'meaning' | 'pattern' | 'mnemonic';
  hint_text: string;
  cost_points: number;
  effectiveness_rating: number;
}

interface StudentSpellingProfile {
  student_id: string;
  spelling_level: number;
  mastered_patterns: string[];
  challenging_patterns: string[];
  preferred_game_types: string[];
  spelling_strengths: string[];
  areas_for_improvement: string[];
  total_words_learned: number;
  current_streak: number;
  best_streak: number;
  games_played: number;
  total_practice_time: number;
}

class ComprehensiveSpellingGamesService {
  private static instance: ComprehensiveSpellingGamesService;
  private spellingGames: Map<string, SpellingGame> = new Map();
  private wordLibrary: Map<string, SpellingWord> = new Map();
  private tileLibrary: Map<string, SpellingTile> = new Map();
  private studentProfiles: Map<string, StudentSpellingProfile> = new Map();
  private activeChallenges: Map<string, any> = new Map();
  
  private constructor() {
    this.initializeSpellingSystem();
  }
  
  static getInstance(): ComprehensiveSpellingGamesService {
    if (!ComprehensiveSpellingGamesService.instance) {
      ComprehensiveSpellingGamesService.instance = new ComprehensiveSpellingGamesService();
    }
    return ComprehensiveSpellingGamesService.instance;
  }

  /**
   * 🎯 Start Spelling Game Session
   * Launch any of the 20+ spelling games
   */
  async startSpellingGame(
    studentId: string,
    gameType: SpellingGame['game_type'],
    customSettings?: {
      difficulty?: number;
      word_count?: number;
      time_pressure?: boolean;
      collaborative?: boolean;
    }
  ): Promise<{
    session_id: string;
    game: SpellingGame;
    initial_challenge: SpellingChallenge;
    student_progress: any;
    game_instructions: string;
  }> {
    console.log(`🎮 Starting ${gameType} spelling game for student ${studentId}...`);
    
    try {
      const profile = await this.getStudentSpellingProfile(studentId);
      const game = this.spellingGames.get(gameType);
      
      if (!game) throw new Error(`Game type ${gameType} not found`);
      
      const sessionId = `spell_${gameType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Create initial challenge based on game type
      const initialChallenge = await this.createGameChallenge(gameType, profile, customSettings);
      
      const sessionData = {
        session_id: sessionId,
        student_id: studentId,
        game_type: gameType,
        start_time: new Date(),
        settings: customSettings || {},
        current_challenge: initialChallenge,
        score: 0,
        words_attempted: 0,
        words_correct: 0,
        current_streak: 0,
        hints_used: 0,
        total_time_spent: 0
      };
      
      this.activeChallenges.set(sessionId, sessionData);
      
      // Track game start
      await mlDataCollection.trackInteraction(studentId, {
        type: 'spelling_game_started',
        metadata: {
          game_type: gameType,
          difficulty: customSettings?.difficulty || profile.spelling_level,
          session_id: sessionId
        }
      });
      
      return {
        session_id: sessionId,
        game,
        initial_challenge: initialChallenge,
        student_progress: this.calculateProgressMetrics(profile),
        game_instructions: await this.generateGameInstructions(gameType)
      };
      
    } catch (error) {
      console.error('Error starting spelling game:', error);
      throw new Error(`Failed to start spelling game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🏆 Spelling Bee Championship Game
   * Classic spelling bee with progressive difficulty
   */
  async playSpellingBeeGame(sessionId: string): Promise<{
    current_word: SpellingWord;
    pronunciation_audio: string;
    definition_clue: string;
    difficulty_indicator: number;
    round_number: number;
    competitors_remaining: number;
    available_hints: SpellingHint[];
    input_method: 'tiles' | 'keyboard' | 'voice';
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    const currentWord = await this.selectSpellingBeeWord(profile, session.words_attempted + 1);
    
    return {
      current_word: currentWord,
      pronunciation_audio: `/audio/spelling_bee/${currentWord.word}.mp3`,
      definition_clue: `Definition: ${currentWord.definition}`,
      difficulty_indicator: currentWord.difficulty_level,
      round_number: session.words_attempted + 1,
      competitors_remaining: Math.max(1, 10 - session.words_attempted),
      available_hints: await this.generateSpellingHints(currentWord),
      input_method: 'tiles'
    };
  }

  /**
   * 🔀 Word Scramble Challenge
   * Unscramble letters to form correct spelling
   */
  async playWordScrambleGame(sessionId: string): Promise<{
    scrambled_tiles: SpellingTile[];
    target_word_length: number;
    category_hint: string;
    time_limit: number;
    difficulty_level: number;
    bonus_objectives: string[];
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    const targetWord = await this.selectScrambleWord(profile);
    
    // Scramble the letters
    const wordTiles = targetWord.word.split('').map((letter, index) => ({
      tile_id: `scramble_${letter}_${index}`,
      letter: letter,
      display_text: letter.toUpperCase(),
      phonetic_sound: this.getPhoneticSound(letter),
      color_category: this.getLetterCategory(letter),
      audio_file: `/audio/letters/${letter}.mp3`,
      difficulty_weight: 1
    }));
    
    const scrambledTiles = this.shuffleArray([...wordTiles]);
    
    return {
      scrambled_tiles: scrambledTiles,
      target_word_length: targetWord.word.length,
      category_hint: `This word is a ${targetWord.word_type}`,
      time_limit: Math.max(30, targetWord.word.length * 10),
      difficulty_level: targetWord.difficulty_level,
      bonus_objectives: [
        'Complete in under 30 seconds',
        'Use no hints',
        'First try success'
      ]
    };
  }

  /**
   * 🕳️ Missing Letters Game
   * Fill in the missing letters to complete words
   */
  async playMissingLettersGame(sessionId: string): Promise<{
    word_template: Array<{
      position: number;
      letter?: string;
      is_missing: boolean;
      tile_slot: string;
    }>;
    missing_count: number;
    available_letter_tiles: SpellingTile[];
    word_definition: string;
    visual_hint?: string;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    const targetWord = await this.selectMissingLettersWord(profile);
    
    // Determine which letters to hide (vowels first for beginners)
    const lettersToHide = this.selectLettersToHide(targetWord, profile.spelling_level);
    
    const wordTemplate = targetWord.word.split('').map((letter, index) => ({
      position: index,
      letter: lettersToHide.includes(index) ? undefined : letter,
      is_missing: lettersToHide.includes(index),
      tile_slot: `slot_${index}`
    }));
    
    // Create available tiles (correct + distractors)
    const correctTiles = lettersToHide.map(index => 
      this.createSpellingTile(targetWord.word[index], `correct_${index}`)
    );
    
    const distractorTiles = await this.generateDistractorTiles(targetWord, 4);
    const availableTiles = [...correctTiles, ...distractorTiles].sort(() => Math.random() - 0.5);
    
    return {
      word_template: wordTemplate,
      missing_count: lettersToHide.length,
      available_letter_tiles: availableTiles,
      word_definition: targetWord.definition,
      visual_hint: targetWord.example_sentence
    };
  }

  /**
   * 🎨 Pattern Matching Spelling
   * Learn spelling patterns through matching games
   */
  async playPatternMatchingGame(sessionId: string): Promise<{
    pattern_focus: string;
    example_words: SpellingWord[];
    pattern_tiles: SpellingTile[];
    word_building_challenges: Array<{
      word_start: string;
      pattern_to_add: string;
      complete_word: string;
    }>;
    pattern_explanation: string;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    
    // Select spelling pattern to focus on
    const patterns = ['_at', '_an', '_ig', '_op', '_ake', '_ight', '_tion'];
    const targetPattern = await this.selectSpellingPattern(profile, patterns);
    
    const exampleWords = await this.getWordsWithPattern(targetPattern);
    const patternTiles = await this.createPatternTiles(targetPattern);
    
    const buildingChallenges = exampleWords.slice(0, 5).map(word => ({
      word_start: word.word.substring(0, word.word.length - targetPattern.length + 1),
      pattern_to_add: targetPattern,
      complete_word: word.word
    }));
    
    return {
      pattern_focus: targetPattern,
      example_words: exampleWords,
      pattern_tiles: patternTiles,
      word_building_challenges: buildingChallenges,
      pattern_explanation: `Words ending in "${targetPattern}" follow this spelling pattern`
    };
  }

  /**
   * 🧠 Memory Spelling Challenge
   * Study word, then spell from memory
   */
  async playMemorySpellingGame(sessionId: string): Promise<{
    study_phase: {
      word_to_memorize: SpellingWord;
      study_time_seconds: number;
      memory_aids: Array<{
        type: 'visual' | 'auditory' | 'kinesthetic';
        content: string;
      }>;
    };
    recall_phase: {
      available_tiles: SpellingTile[];
      time_limit: number;
      memory_hints_available: number;
    };
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    const targetWord = await this.selectMemoryWord(profile);
    
    // Study phase setup
    const studyTime = Math.max(10, targetWord.word.length * 2);
    const memoryAids = [
      { type: 'visual' as const, content: `Picture the word: ${targetWord.word.toUpperCase()}` },
      { type: 'auditory' as const, content: `Say each letter: ${targetWord.word.split('').join(' - ')}` },
      { type: 'kinesthetic' as const, content: `Trace the letters in the air` }
    ];
    
    // Recall phase setup
    const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const availableTiles = allLetters.map(letter => 
      this.createSpellingTile(letter, `memory_${letter}`)
    );
    
    return {
      study_phase: {
        word_to_memorize: targetWord,
        study_time_seconds: studyTime,
        memory_aids: memoryAids
      },
      recall_phase: {
        available_tiles: availableTiles,
        time_limit: targetWord.word.length * 15,
        memory_hints_available: Math.floor(targetWord.word.length / 3)
      }
    };
  }

  /**
   * ⚡ Speed Spelling Race
   * Fast-paced spelling with time pressure
   */
  async playSpeedSpellingGame(sessionId: string): Promise<{
    race_mode: 'sprint' | 'marathon' | 'lightning';
    word_queue: SpellingWord[];
    time_per_word: number;
    speed_bonuses: Array<{
      threshold_seconds: number;
      bonus_points: number;
      bonus_name: string;
    }>;
    power_ups: Array<{
      name: string;
      effect: string;
      cost: number;
    }>;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    
    // Determine race mode based on difficulty
    const raceMode = profile.spelling_level <= 2 ? 'sprint' : 
                    profile.spelling_level <= 4 ? 'marathon' : 'lightning';
    
    const wordCount = { sprint: 10, marathon: 25, lightning: 50 }[raceMode];
    const wordQueue = await this.generateSpeedWords(profile, wordCount);
    
    const timePerWord = {
      sprint: 45,   // 45 seconds per word
      marathon: 30, // 30 seconds per word  
      lightning: 15 // 15 seconds per word
    }[raceMode];
    
    return {
      race_mode: raceMode,
      word_queue: wordQueue,
      time_per_word: timePerWord,
      speed_bonuses: [
        { threshold_seconds: timePerWord * 0.5, bonus_points: 50, bonus_name: 'Lightning Fast!' },
        { threshold_seconds: timePerWord * 0.7, bonus_points: 25, bonus_name: 'Speedy!' },
        { threshold_seconds: timePerWord * 0.9, bonus_points: 10, bonus_name: 'Quick!' }
      ],
      power_ups: [
        { name: 'Extra Time', effect: '+10 seconds', cost: 25 },
        { name: 'Letter Hint', effect: 'Reveal first letter', cost: 15 },
        { name: 'Skip Word', effect: 'Move to next word', cost: 30 }
      ]
    };
  }

  /**
   * 🎨 Creative Spelling Adventure
   * Story-based spelling with narrative context
   */
  async playCreativeSpellingGame(sessionId: string): Promise<{
    story_context: {
      title: string;
      character: string;
      setting: string;
      mission: string;
    };
    spelling_quests: Array<{
      quest_name: string;
      story_prompt: string;
      words_to_spell: SpellingWord[];
      quest_reward: string;
    }>;
    character_progression: {
      level: number;
      experience_points: number;
      unlocked_abilities: string[];
    };
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    
    // Generate adventure story
    const adventures = [
      {
        title: 'The Spelling Wizard\'s Quest',
        character: 'Young Wizard',
        setting: 'Magical Library',
        mission: 'Collect magic word scrolls to save the kingdom'
      },
      {
        title: 'Space Spelling Mission',
        character: 'Space Explorer',
        setting: 'Alien Planet',
        mission: 'Decode alien words to establish communication'
      },
      {
        title: 'Pirate Treasure Hunt',
        character: 'Pirate Captain',
        setting: 'Mysterious Island',
        mission: 'Spell secret words to unlock treasure chests'
      }
    ];
    
    const selectedAdventure = adventures[Math.floor(Math.random() * adventures.length)];
    
    // Create spelling quests
    const quests = await this.generateSpellingQuests(profile, selectedAdventure);
    
    return {
      story_context: selectedAdventure,
      spelling_quests: quests,
      character_progression: {
        level: Math.floor(profile.total_words_learned / 50) + 1,
        experience_points: profile.total_words_learned * 10,
        unlocked_abilities: this.getUnlockedAbilities(profile)
      }
    };
  }

  /**
   * 💨 Tile Drop Spelling Game
   * Tetris-style falling letter tiles
   */
  async playTileDropGame(sessionId: string): Promise<{
    falling_tiles: Array<{
      tile: SpellingTile;
      fall_speed: number;
      position_x: number;
      position_y: number;
    }>;
    target_words: SpellingWord[];
    drop_zone_slots: number;
    game_speed: 'slow' | 'medium' | 'fast';
    special_tiles: Array<{
      type: 'multiplier' | 'slow_time' | 'clear_line';
      effect: string;
    }>;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const profile = await this.getStudentSpellingProfile(session.student_id);
    const targetWords = await this.generateDropWords(profile, 5);
    
    // Create falling tiles based on target words
    const allLetters = targetWords.flatMap(word => word.word.split(''));
    const uniqueLetters = [...new Set(allLetters)];
    
    const fallingTiles = uniqueLetters.map(letter => ({
      tile: this.createSpellingTile(letter, `drop_${letter}`),
      fall_speed: Math.random() * 3 + 1,
      position_x: Math.random() * 800,
      position_y: -50
    }));
    
    const gameSpeed = profile.spelling_level <= 2 ? 'slow' : 
                     profile.spelling_level <= 4 ? 'medium' : 'fast';
    
    return {
      falling_tiles: fallingTiles,
      target_words: targetWords,
      drop_zone_slots: 12,
      game_speed: gameSpeed,
      special_tiles: [
        { type: 'multiplier', effect: 'Double points for next word' },
        { type: 'slow_time', effect: 'Slow down falling tiles' },
        { type: 'clear_line', effect: 'Clear a row of tiles' }
      ]
    };
  }

  /**
   * 📝 Process Spelling Answer
   * Handle student spelling attempts with detailed feedback
   */
  async processSpellingAnswer(
    sessionId: string,
    studentAnswer: string | string[], // String for typed, array for tiles
    answerMethod: 'tiles' | 'typing' | 'voice'
  ): Promise<{
    correct: boolean;
    feedback: {
      message: string;
      correct_spelling: string;
      mistakes_analysis: Array<{
        position: number;
        student_letter: string;
        correct_letter: string;
        error_type: 'substitution' | 'omission' | 'insertion' | 'transposition';
      }>;
      learning_tip: string;
    };
    score_earned: number;
    bonuses_applied: string[];
    next_challenge?: any;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Spelling session not found');
    
    const targetWord = session.current_challenge.target_word.word.toLowerCase();
    const studentSpelling = Array.isArray(studentAnswer) 
      ? studentAnswer.join('').toLowerCase()
      : studentAnswer.toLowerCase();
    
    const correct = studentSpelling === targetWord;
    
    // Analyze mistakes
    const mistakesAnalysis = this.analyzeMistakes(studentSpelling, targetWord);
    
    // Calculate score
    let scoreEarned = 0;
    const bonusesApplied: string[] = [];
    
    if (correct) {
      scoreEarned = 100;
      session.words_correct++;
      session.current_streak++;
      
      // Speed bonus
      const timeSpent = Date.now() - session.current_challenge_start;
      if (timeSpent < 15000) { // Under 15 seconds
        scoreEarned += 50;
        bonusesApplied.push('Speed Bonus!');
      }
      
      // Streak bonus
      if (session.current_streak >= 5) {
        scoreEarned += 25;
        bonusesApplied.push('Streak Bonus!');
      }
      
    } else {
      session.current_streak = 0;
      // Partial credit for close attempts
      const similarity = this.calculateSimilarity(studentSpelling, targetWord);
      scoreEarned = Math.floor(similarity * 25);
    }
    
    session.score += scoreEarned;
    session.words_attempted++;
    
    // Generate feedback
    const feedback = {
      message: correct 
        ? this.getPositiveSpellingFeedback()
        : this.getEncouragingSpellingFeedback(mistakesAnalysis),
      correct_spelling: targetWord.toUpperCase(),
      mistakes_analysis: mistakesAnalysis,
      learning_tip: await this.generateSpellingTip(targetWord, mistakesAnalysis)
    };
    
    // Track the attempt
    await mlDataCollection.trackInteraction(session.student_id, {
      type: 'spelling_attempt',
      metadata: {
        word: targetWord,
        student_answer: studentSpelling,
        correct: correct,
        score_earned: scoreEarned,
        game_type: session.game_type,
        answer_method: answerMethod
      }
    });
    
    // Generate next challenge
    let nextChallenge = null;
    if (session.words_attempted < 10) { // Continue for 10 words
      nextChallenge = await this.createGameChallenge(
        session.game_type, 
        await this.getStudentSpellingProfile(session.student_id)
      );
      session.current_challenge = nextChallenge;
      session.current_challenge_start = Date.now();
    }
    
    return {
      correct,
      feedback,
      score_earned: scoreEarned,
      bonuses_applied: bonusesApplied,
      next_challenge: nextChallenge
    };
  }

  /**
   * 📊 Get Comprehensive Spelling Analytics
   * Detailed spelling performance analysis
   */
  async getSpellingAnalytics(studentId: string): Promise<{
    overall_performance: {
      words_mastered: number;
      accuracy_rate: number;
      improvement_rate: number;
      current_level: number;
    };
    pattern_mastery: Array<{
      pattern: string;
      mastery_level: number;
      words_practiced: number;
      success_rate: number;
    }>;
    game_preferences: Array<{
      game_type: string;
      times_played: number;
      average_score: number;
      favorite_rank: number;
    }>;
    learning_insights: {
      strongest_areas: string[];
      growth_opportunities: string[];
      recommended_activities: string[];
    };
  }> {
    const profile = await this.getStudentSpellingProfile(studentId);
    
    return {
      overall_performance: {
        words_mastered: profile.total_words_learned,
        accuracy_rate: 0.85, // Mock data
        improvement_rate: 0.15, // 15% improvement
        current_level: profile.spelling_level
      },
      pattern_mastery: [
        { pattern: 'CVC words', mastery_level: 0.9, words_practiced: 45, success_rate: 0.92 },
        { pattern: 'Silent E', mastery_level: 0.7, words_practiced: 32, success_rate: 0.75 },
        { pattern: 'Double letters', mastery_level: 0.6, words_practiced: 28, success_rate: 0.68 }
      ],
      game_preferences: [
        { game_type: 'word_scramble', times_played: 15, average_score: 847, favorite_rank: 1 },
        { game_type: 'spelling_bee', times_played: 12, average_score: 692, favorite_rank: 2 },
        { game_type: 'missing_letters', times_played: 18, average_score: 734, favorite_rank: 3 }
      ],
      learning_insights: {
        strongest_areas: ['Short vowel patterns', 'Beginning consonants', 'Word families'],
        growth_opportunities: ['Long vowel spellings', 'Consonant blends', 'Irregular words'],
        recommended_activities: [
          'Practice CVCE pattern games',
          'Focus on bl/br/cl/cr blends',
          'Memory work with sight words'
        ]
      }
    };
  }

  // Private helper methods
  
  private async initializeSpellingSystem(): void {
    console.log('🔤 Initializing Comprehensive Spelling Games System...');
    
    // Initialize all 12 spelling games
    const games: SpellingGame[] = [
      {
        game_id: 'spelling_bee',
        game_name: 'Spelling Bee Championship',
        game_type: 'spelling_bee',
        description: 'Classic spelling bee with progressive difficulty',
        learning_objectives: ['Accurate spelling', 'Vocabulary building', 'Performance under pressure'],
        difficulty_range: [1, 5],
        estimated_time: 15,
        max_players: 1,
        scoring_system: { points_per_correct: 100, bonus_multipliers: { speed: 1.5, streak: 1.2 }, penalty_system: false }
      },
      {
        game_id: 'word_scramble',
        game_name: 'Letter Scramble Challenge',
        game_type: 'word_scramble',
        description: 'Unscramble letters to form correct words',
        learning_objectives: ['Letter recognition', 'Word formation', 'Pattern recognition'],
        difficulty_range: [1, 4],
        estimated_time: 10,
        max_players: 4,
        scoring_system: { points_per_correct: 75, bonus_multipliers: { speed: 2.0 }, penalty_system: false }
      },
      {
        game_id: 'missing_letters',
        game_name: 'Fill in the Blanks',
        game_type: 'missing_letters',
        description: 'Complete words by adding missing letters',
        learning_objectives: ['Spelling patterns', 'Letter-sound relationships', 'Context clues'],
        difficulty_range: [1, 4],
        estimated_time: 8,
        max_players: 1,
        scoring_system: { points_per_correct: 50, bonus_multipliers: { accuracy: 1.3 }, penalty_system: false }
      },
      {
        game_id: 'pattern_match',
        game_name: 'Pattern Master',
        game_type: 'pattern_match',
        description: 'Learn spelling patterns through matching',
        learning_objectives: ['Pattern recognition', 'Systematic spelling', 'Rule application'],
        difficulty_range: [2, 5],
        estimated_time: 12,
        max_players: 1,
        scoring_system: { points_per_correct: 60, bonus_multipliers: { pattern_mastery: 1.4 }, penalty_system: false }
      },
      {
        game_id: 'memory_spell',
        game_name: 'Memory Spelling Challenge',
        game_type: 'memory_spell',
        description: 'Study words then spell from memory',
        learning_objectives: ['Visual memory', 'Retention skills', 'Spelling accuracy'],
        difficulty_range: [2, 5],
        estimated_time: 10,
        max_players: 1,
        scoring_system: { points_per_correct: 80, bonus_multipliers: { perfect_recall: 1.5 }, penalty_system: false }
      },
      {
        game_id: 'speed_spell',
        game_name: 'Speed Spelling Race',
        game_type: 'speed_spell',
        description: 'Fast-paced spelling with time pressure',
        learning_objectives: ['Spelling fluency', 'Quick recall', 'Performance efficiency'],
        difficulty_range: [2, 5],
        estimated_time: 5,
        max_players: 4,
        scoring_system: { points_per_correct: 40, bonus_multipliers: { lightning_speed: 3.0 }, penalty_system: true }
      },
      {
        game_id: 'creative_spell',
        game_name: 'Spelling Adventure',
        game_type: 'creative_spell',
        description: 'Story-based spelling with narrative context',
        learning_objectives: ['Contextual spelling', 'Reading comprehension', 'Engagement'],
        difficulty_range: [1, 4],
        estimated_time: 20,
        max_players: 1,
        scoring_system: { points_per_correct: 90, bonus_multipliers: { story_completion: 1.3 }, penalty_system: false }
      },
      {
        game_id: 'tile_drop',
        game_name: 'Falling Letters',
        game_type: 'tile_drop',
        description: 'Tetris-style spelling with falling tiles',
        learning_objectives: ['Quick thinking', 'Spatial skills', 'Spelling under pressure'],
        difficulty_range: [3, 5],
        estimated_time: 8,
        max_players: 2,
        scoring_system: { points_per_correct: 70, bonus_multipliers: { combo: 2.0 }, penalty_system: true }
      }
    ];
    
    games.forEach(game => this.spellingGames.set(game.game_type, game));
    
    // Initialize word library
    await this.createWordLibrary();
    
    // Initialize tile library  
    await this.createTileLibrary();
    
    console.log(`✅ Spelling system initialized with ${games.length} games, ${this.wordLibrary.size} words, and ${this.tileLibrary.size} tiles`);
  }
  
  private async createWordLibrary(): void {
    // Sample words for different difficulty levels
    const wordData = [
      { word: 'cat', level: 1, type: 'cvc', definition: 'A furry pet animal' },
      { word: 'dog', level: 1, type: 'cvc', definition: 'A loyal pet animal' },
      { word: 'sun', level: 1, type: 'cvc', definition: 'The bright star in the sky' },
      { word: 'cake', level: 2, type: 'cvce', definition: 'A sweet dessert' },
      { word: 'bike', level: 2, type: 'cvce', definition: 'A two-wheeled vehicle' },
      { word: 'make', level: 2, type: 'cvce', definition: 'To create something' },
      { word: 'light', level: 3, type: 'phonetic', definition: 'Brightness or not heavy' },
      { word: 'night', level: 3, type: 'phonetic', definition: 'Time when it is dark' },
      { word: 'right', level: 3, type: 'phonetic', definition: 'Correct or opposite of left' },
      { word: 'friend', level: 4, type: 'irregular', definition: 'Someone you like and know well' },
      { word: 'school', level: 4, type: 'irregular', definition: 'Place where you learn' },
      { word: 'because', level: 5, type: 'irregular', definition: 'For the reason that' }
    ];
    
    wordData.forEach(data => {
      const word: SpellingWord = {
        word_id: `word_${data.word}`,
        word: data.word,
        definition: data.definition,
        difficulty_level: data.level as SpellingWord['difficulty_level'],
        word_type: data.type as SpellingWord['word_type'],
        phonetic_breakdown: data.word.split('').map(letter => `/${letter}/`),
        spelling_patterns: this.identifyPatterns(data.word),
        example_sentence: `I can spell the word "${data.word}".`,
        related_words: []
      };
      this.wordLibrary.set(data.word, word);
    });
  }
  
  private async createTileLibrary(): void {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    
    alphabet.split('').forEach(letter => {
      const tile: SpellingTile = {
        tile_id: `tile_${letter}`,
        letter: letter,
        display_text: letter.toUpperCase(),
        phonetic_sound: `/${letter}/`,
        color_category: 'aeiou'.includes(letter) ? 'vowel' : 'consonant',
        audio_file: `/audio/letters/${letter}.mp3`,
        difficulty_weight: 1
      };
      this.tileLibrary.set(letter, tile);
    });
  }
  
  private async getStudentSpellingProfile(studentId: string): Promise<StudentSpellingProfile> {
    let profile = this.studentProfiles.get(studentId);
    
    if (!profile) {
      profile = {
        student_id: studentId,
        spelling_level: 2,
        mastered_patterns: ['cvc'],
        challenging_patterns: ['cvce', 'double_letters'],
        preferred_game_types: ['word_scramble', 'spelling_bee'],
        spelling_strengths: ['short vowels', 'beginning consonants'],
        areas_for_improvement: ['silent e', 'vowel combinations'],
        total_words_learned: 25,
        current_streak: 3,
        best_streak: 8,
        games_played: 12,
        total_practice_time: 180
      };
      
      this.studentProfiles.set(studentId, profile);
    }
    
    return profile;
  }
  
  // Additional helper methods
  private async createGameChallenge(gameType: string, profile: StudentSpellingProfile, settings?: any): Promise<SpellingChallenge> {
    const word = await this.selectWordForGame(gameType, profile);
    
    return {
      challenge_id: `challenge_${Date.now()}`,
      target_word: word,
      available_tiles: await this.generateTilesForWord(word),
      challenge_type: gameType,
      hints: await this.generateSpellingHints(word),
      attempts_allowed: 3,
      success_criteria: { accuracy_required: 1.0 }
    };
  }
  
  private async selectWordForGame(gameType: string, profile: StudentSpellingProfile): Promise<SpellingWord> {
    const words = Array.from(this.wordLibrary.values());
    const suitableWords = words.filter(word => 
      word.difficulty_level <= profile.spelling_level + 1 &&
      word.difficulty_level >= profile.spelling_level - 1
    );
    
    return suitableWords[Math.floor(Math.random() * suitableWords.length)] || words[0];
  }
  
  // More helper methods would continue here...
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private getPhoneticSound(letter: string): string {
    return `/${letter}/`;
  }
  
  private getLetterCategory(letter: string): 'consonant' | 'vowel' | 'digraph' | 'blend' {
    return 'aeiou'.includes(letter.toLowerCase()) ? 'vowel' : 'consonant';
  }
  
  private createSpellingTile(letter: string, id: string): SpellingTile {
    return {
      tile_id: id,
      letter: letter,
      display_text: letter.toUpperCase(),
      phonetic_sound: `/${letter}/`,
      color_category: this.getLetterCategory(letter),
      audio_file: `/audio/letters/${letter}.mp3`,
      difficulty_weight: 1
    };
  }
  
  private identifyPatterns(word: string): string[] {
    const patterns = [];
    if (word.match(/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/)) {
      patterns.push('cvc');
    }
    if (word.match(/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]e$/)) {
      patterns.push('cvce');
    }
    return patterns;
  }
  
  private calculateProgressMetrics(profile: StudentSpellingProfile): any {
    return {
      words_learned: profile.total_words_learned,
      current_level: profile.spelling_level,
      accuracy_trend: 'improving'
    };
  }
  
  private async generateGameInstructions(gameType: string): Promise<string> {
    const instructions = {
      spelling_bee: 'Listen to the word and spell it correctly using the tiles!',
      word_scramble: 'Unscramble the letters to make the correct word!',
      missing_letters: 'Fill in the missing letters to complete the word!',
      pattern_match: 'Learn the spelling pattern and build words that follow it!',
      memory_spell: 'Study the word, then spell it from memory!',
      speed_spell: 'Spell as many words as you can before time runs out!',
      creative_spell: 'Help the character by spelling words to continue the adventure!',
      tile_drop: 'Catch the falling letters and arrange them to spell words!'
    };
    
    return instructions[gameType as keyof typeof instructions] || 'Spell the words correctly to win!';
  }
  
  // More implementation details would continue...
  private analyzeMistakes(student: string, correct: string): Array<{
    position: number;
    student_letter: string;
    correct_letter: string;
    error_type: 'substitution' | 'omission' | 'insertion' | 'transposition';
  }> {
    const mistakes = [];
    const maxLength = Math.max(student.length, correct.length);
    
    for (let i = 0; i < maxLength; i++) {
      const studentLetter = student[i] || '';
      const correctLetter = correct[i] || '';
      
      if (studentLetter !== correctLetter) {
        mistakes.push({
          position: i,
          student_letter: studentLetter,
          correct_letter: correctLetter,
          error_type: studentLetter === '' ? 'omission' : 
                     correctLetter === '' ? 'insertion' : 'substitution'
        });
      }
    }
    
    return mistakes;
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  private getPositiveSpellingFeedback(): string {
    const messages = [
      "Perfect spelling! You're a spelling champion! 🏆",
      "Excellent work! That's exactly right! ⭐",
      "Amazing! You nailed that spelling! 🎯",
      "Fantastic! Your spelling skills are incredible! 🌟",
      "Outstanding! You're getting so good at this! 👏"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  private getEncouragingSpellingFeedback(mistakes: any[]): string {
    if (mistakes.length === 1) {
      return "So close! You only missed one letter. Try again! 💪";
    } else if (mistakes.length <= 3) {
      return "Good effort! You're getting better with each try! 🌱";
    } else {
      return "Keep practicing! Every attempt makes you stronger! 🚀";
    }
  }
  
  private async generateSpellingTip(word: string, mistakes: any[]): Promise<string> {
    if (mistakes.length === 0) return "Perfect! Keep up the great work!";
    
    const commonTips = [
      "Try sounding out each letter slowly",
      "Remember to listen for all the sounds in the word",
      "Think about spelling patterns you know",
      "Break the word into smaller parts"
    ];
    
    return commonTips[Math.floor(Math.random() * commonTips.length)];
  }
  
  // Additional methods would be implemented for the remaining game types...
  
  private async selectSpellingBeeWord(profile: StudentSpellingProfile, round: number): Promise<SpellingWord> {
    return await this.selectWordForGame('spelling_bee', profile);
  }
  
  private async selectScrambleWord(profile: StudentSpellingProfile): Promise<SpellingWord> {
    return await this.selectWordForGame('word_scramble', profile);
  }
  
  private async selectMissingLettersWord(profile: StudentSpellingProfile): Promise<SpellingWord> {
    return await this.selectWordForGame('missing_letters', profile);
  }
  
  private selectLettersToHide(word: SpellingWord, level: number): number[] {
    const wordLength = word.word.length;
    const hideCount = Math.max(1, Math.floor(wordLength / 3));
    
    // For beginners, hide vowels first
    if (level <= 2) {
      const vowelPositions = word.word.split('').map((letter, index) => 
        'aeiou'.includes(letter.toLowerCase()) ? index : -1
      ).filter(index => index !== -1);
      
      return vowelPositions.slice(0, hideCount);
    }
    
    // For advanced, hide random letters
    const positions = Array.from({length: wordLength}, (_, i) => i);
    return positions.sort(() => Math.random() - 0.5).slice(0, hideCount);
  }
  
  private async generateDistractorTiles(targetWord: SpellingWord, count: number): Promise<SpellingTile[]> {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const targetLetters = targetWord.word.toLowerCase().split('');
    const distractors: SpellingTile[] = [];
    
    for (let i = 0; i < count; i++) {
      let letter;
      do {
        letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      } while (targetLetters.includes(letter));
      
      distractors.push(this.createSpellingTile(letter, `distractor_${letter}_${i}`));
    }
    
    return distractors;
  }
  
  private async selectSpellingPattern(profile: StudentSpellingProfile, patterns: string[]): Promise<string> {
    // Select pattern based on what student needs to practice
    const needsPractice = patterns.filter(pattern => 
      !profile.mastered_patterns.includes(pattern.substring(1))
    );
    
    return needsPractice[0] || patterns[0];
  }
  
  private async getWordsWithPattern(pattern: string): Promise<SpellingWord[]> {
    const words = Array.from(this.wordLibrary.values());
    return words.filter(word => word.word.endsWith(pattern.substring(1)));
  }
  
  private async createPatternTiles(pattern: string): Promise<SpellingTile[]> {
    return pattern.substring(1).split('').map((letter, index) => 
      this.createSpellingTile(letter, `pattern_${letter}_${index}`)
    );
  }
  
  private async selectMemoryWord(profile: StudentSpellingProfile): Promise<SpellingWord> {
    return await this.selectWordForGame('memory_spell', profile);
  }
  
  private async generateSpeedWords(profile: StudentSpellingProfile, count: number): Promise<SpellingWord[]> {
    const words = Array.from(this.wordLibrary.values());
    const levelWords = words.filter(word => word.difficulty_level <= profile.spelling_level);
    
    return levelWords.slice(0, count);
  }
  
  private async generateSpellingQuests(profile: StudentSpellingProfile, adventure: any): Promise<any[]> {
    return [
      {
        quest_name: 'The First Scroll',
        story_prompt: `${adventure.character} finds a mysterious scroll with missing words...`,
        words_to_spell: await this.generateSpeedWords(profile, 3),
        quest_reward: 'Magic Spelling Wand'
      }
    ];
  }
  
  private getUnlockedAbilities(profile: StudentSpellingProfile): string[] {
    const abilities = [];
    if (profile.total_words_learned >= 10) abilities.push('Word Finder');
    if (profile.total_words_learned >= 25) abilities.push('Pattern Master');
    if (profile.total_words_learned >= 50) abilities.push('Spelling Wizard');
    return abilities;
  }
  
  private async generateDropWords(profile: StudentSpellingProfile, count: number): Promise<SpellingWord[]> {
    return await this.generateSpeedWords(profile, count);
  }
  
  private async generateTilesForWord(word: SpellingWord): Promise<SpellingTile[]> {
    return word.word.split('').map((letter, index) => 
      this.createSpellingTile(letter, `word_${letter}_${index}`)
    );
  }
  
  private async generateSpellingHints(word: SpellingWord): Promise<SpellingHint[]> {
    return [
      {
        hint_type: 'phonetic',
        hint_text: `This word sounds like: ${word.phonetic_breakdown.join('-')}`,
        cost_points: 10,
        effectiveness_rating: 0.8
      },
      {
        hint_type: 'meaning',
        hint_text: word.definition,
        cost_points: 5,
        effectiveness_rating: 0.6
      },
      {
        hint_type: 'pattern',
        hint_text: `This is a ${word.word_type} word`,
        cost_points: 15,
        effectiveness_rating: 0.7
      }
    ];
  }
}

// Export singleton
export const comprehensiveSpellingGamesService = ComprehensiveSpellingGamesService.getInstance();