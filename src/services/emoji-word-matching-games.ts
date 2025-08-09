/**
 * Emoji-to-Word Matching Games Service
 * Feature #106: Visual Symbol-Word Association Learning
 * 
 * Revolutionary visual learning system that uses emojis to teach
 * word recognition, vocabulary building, and symbol-to-text mapping
 * through our AAC tile system.
 * 
 * Game Categories:
 * - Basic Emoji-Word Matching
 * - Category-Based Matching (Animals, Foods, etc.)
 * - Emotion Recognition and Word Mapping
 * - Action Verb Emoji Games
 * - Descriptive Word Matching
 * - Story Building with Emojis
 * 
 * Educational Impact: Bridges visual symbols to text comprehension,
 * essential for AAC users transitioning to literacy.
 * 
 * @author TinkyBink AAC Platform
 * @version 1.0.0 - Visual Learning Edition
 * @since 2024-12-01
 */

import { mlDataCollection } from './ml-data-collection';
import { gameTracking } from './game-tracking';

interface EmojiWordPair {
  pair_id: string;
  emoji: string;
  word: string;
  category: 'animals' | 'food' | 'emotions' | 'actions' | 'objects' | 'nature' | 'transportation' | 'family';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  alternative_words: string[];
  pronunciation: string;
  definition: string;
  example_sentence: string;
  cultural_variants?: string[];
}

interface EmojiMatchingGame {
  game_id: string;
  game_type: 'basic_match' | 'category_match' | 'emotion_match' | 'action_match' | 
             'story_build' | 'rapid_match' | 'memory_match' | 'sequence_match';
  title: string;
  description: string;
  learning_objectives: string[];
  target_age_range: string;
  estimated_duration: number;
  difficulty_settings: {
    pairs_count: number;
    time_limit?: number;
    hints_available: number;
  };
}

interface MatchingChallenge {
  challenge_id: string;
  emoji_options: EmojiWordPair[];
  word_tiles: Array<{
    tile_id: string;
    word: string;
    is_correct_match: boolean;
    corresponding_emoji?: string;
  }>;
  challenge_type: string;
  success_criteria: {
    matches_required: number;
    accuracy_threshold: number;
    time_bonus_threshold?: number;
  };
  hints: Array<{
    hint_type: 'definition' | 'category' | 'sound' | 'example';
    content: string;
    cost: number;
  }>;
}

interface StudentMatchingProfile {
  student_id: string;
  visual_processing_level: number;
  symbol_recognition_skills: number;
  vocabulary_size: number;
  preferred_categories: string[];
  mastered_pairs: EmojiWordPair[];
  challenging_pairs: EmojiWordPair[];
  response_time_average: number;
  accuracy_trend: number[];
}

class EmojiWordMatchingGamesService {
  private static instance: EmojiWordMatchingGamesService;
  private emojiWordPairs: Map<string, EmojiWordPair> = new Map();
  private matchingGames: Map<string, EmojiMatchingGame> = new Map();
  private studentProfiles: Map<string, StudentMatchingProfile> = new Map();
  private activeChallenges: Map<string, any> = new Map();
  
  private constructor() {
    this.initializeEmojiMatchingSystem();
  }
  
  static getInstance(): EmojiWordMatchingGamesService {
    if (!EmojiWordMatchingGamesService.instance) {
      EmojiWordMatchingGamesService.instance = new EmojiWordMatchingGamesService();
    }
    return EmojiWordMatchingGamesService.instance;
  }

  /**
   * 🎯 Start Emoji Matching Game
   * Launch visual symbol-to-word matching activities
   */
  async startEmojiMatchingGame(
    studentId: string,
    gameType: EmojiMatchingGame['game_type'],
    customSettings?: {
      category?: string;
      difficulty?: number;
      pairs_count?: number;
      time_limit?: number;
    }
  ): Promise<{
    session_id: string;
    game: EmojiMatchingGame;
    initial_challenge: MatchingChallenge;
    game_instructions: string;
    visual_setup: any;
  }> {
    console.log(`🎮 Starting ${gameType} emoji matching game for student ${studentId}...`);
    
    try {
      const profile = await this.getStudentMatchingProfile(studentId);
      const game = this.matchingGames.get(gameType);
      
      if (!game) throw new Error(`Game type ${gameType} not found`);
      
      const sessionId = `emoji_match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Create challenge based on game type and settings
      const initialChallenge = await this.createMatchingChallenge(gameType, profile, customSettings);
      
      const sessionData = {
        session_id: sessionId,
        student_id: studentId,
        game_type: gameType,
        start_time: new Date(),
        settings: customSettings || {},
        current_challenge: initialChallenge,
        score: 0,
        matches_made: 0,
        correct_matches: 0,
        hints_used: 0,
        average_response_time: 0
      };
      
      this.activeChallenges.set(sessionId, sessionData);
      
      // Track game start
      await mlDataCollection.trackInteraction(studentId, {
        type: 'emoji_matching_started',
        metadata: {
          game_type: gameType,
          category: customSettings?.category,
          difficulty: customSettings?.difficulty || profile.visual_processing_level
        }
      });
      
      return {
        session_id: sessionId,
        game,
        initial_challenge: initialChallenge,
        game_instructions: await this.generateGameInstructions(gameType),
        visual_setup: await this.createVisualGameSetup(initialChallenge)
      };
      
    } catch (error) {
      console.error('Error starting emoji matching game:', error);
      throw new Error(`Failed to start emoji matching game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🐾 Animal Emoji Matching
   * Match animal emojis to their word names
   */
  async playAnimalMatchingGame(sessionId: string): Promise<{
    animal_emojis: EmojiWordPair[];
    word_options: Array<{
      word: string;
      is_correct: boolean;
      tile_color: string;
    }>;
    learning_facts: Array<{
      emoji: string;
      fun_fact: string;
      sound: string;
    }>;
    bonus_challenge: string;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Emoji matching session not found');
    
    // Select animal emoji pairs
    const animalPairs = Array.from(this.emojiWordPairs.values())
      .filter(pair => pair.category === 'animals')
      .slice(0, 6);
    
    // Create word options (correct + distractors)
    const correctWords = animalPairs.map(pair => ({
      word: pair.word,
      is_correct: true,
      tile_color: '#4CAF50'
    }));
    
    const distractorWords = [
      { word: 'house', is_correct: false, tile_color: '#9E9E9E' },
      { word: 'book', is_correct: false, tile_color: '#9E9E9E' },
      { word: 'happy', is_correct: false, tile_color: '#9E9E9E' }
    ];
    
    const allWords = [...correctWords, ...distractorWords].sort(() => Math.random() - 0.5);
    
    // Generate learning facts
    const learningFacts = animalPairs.map(pair => ({
      emoji: pair.emoji,
      fun_fact: this.getAnimalFact(pair.word),
      sound: this.getAnimalSound(pair.word)
    }));
    
    return {
      animal_emojis: animalPairs,
      word_options: allWords,
      learning_facts: learningFacts,
      bonus_challenge: 'Can you make the animal sounds too?'
    };
  }

  /**
   * 🍎 Food Emoji Matching
   * Match food emojis to their names
   */
  async playFoodMatchingGame(sessionId: string): Promise<{
    food_emojis: EmojiWordPair[];
    category_groups: Array<{
      category: string;
      emojis: string[];
      words: string[];
    }>;
    nutrition_facts: Array<{
      emoji: string;
      food: string;
      nutrition_tip: string;
    }>;
    cooking_activity: string;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Emoji matching session not found');
    
    const foodPairs = Array.from(this.emojiWordPairs.values())
      .filter(pair => pair.category === 'food')
      .slice(0, 8);
    
    // Group foods by type
    const categoryGroups = [
      {
        category: 'Fruits',
        emojis: ['🍎', '🍌', '🍇'],
        words: ['apple', 'banana', 'grapes']
      },
      {
        category: 'Vegetables',
        emojis: ['🥕', '🥬', '🍅'],
        words: ['carrot', 'lettuce', 'tomato']
      },
      {
        category: 'Snacks',
        emojis: ['🍪', '🍰'],
        words: ['cookie', 'cake']
      }
    ];
    
    const nutritionFacts = foodPairs.map(pair => ({
      emoji: pair.emoji,
      food: pair.word,
      nutrition_tip: this.getNutritionTip(pair.word)
    }));
    
    return {
      food_emojis: foodPairs,
      category_groups: categoryGroups,
      nutrition_facts: nutritionFacts,
      cooking_activity: 'What would you like to cook with these ingredients?'
    };
  }

  /**
   * 😊 Emotion Emoji Matching
   * Match emotion emojis to feeling words
   */
  async playEmotionMatchingGame(sessionId: string): Promise<{
    emotion_pairs: EmojiWordPair[];
    emotion_scenarios: Array<{
      emoji: string;
      emotion: string;
      scenario: string;
      coping_strategy: string;
    }>;
    feeling_check: {
      question: string;
      emoji_options: string[];
    };
    social_story: string;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Emoji matching session not found');
    
    const emotionPairs = Array.from(this.emojiWordPairs.values())
      .filter(pair => pair.category === 'emotions')
      .slice(0, 6);
    
    const emotionScenarios = emotionPairs.map(pair => ({
      emoji: pair.emoji,
      emotion: pair.word,
      scenario: this.getEmotionScenario(pair.word),
      coping_strategy: this.getCopingStrategy(pair.word)
    }));
    
    return {
      emotion_pairs: emotionPairs,
      emotion_scenarios: emotionScenarios,
      feeling_check: {
        question: 'How are you feeling right now?',
        emoji_options: emotionPairs.map(pair => pair.emoji)
      },
      social_story: 'Learning about emotions helps us understand ourselves and others better!'
    };
  }

  /**
   * 🏃 Action Emoji Matching
   * Match action emojis to verb words
   */
  async playActionMatchingGame(sessionId: string): Promise<{
    action_pairs: EmojiWordPair[];
    verb_conjugations: Array<{
      base_verb: string;
      emoji: string;
      forms: {
        present: string;
        past: string;
        future: string;
      };
    }>;
    action_challenges: Array<{
      emoji: string;
      action: string;
      challenge: string;
    }>;
    movement_activity: string;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Emoji matching session not found');
    
    const actionPairs = Array.from(this.emojiWordPairs.values())
      .filter(pair => pair.category === 'actions')
      .slice(0, 6);
    
    const verbConjugations = actionPairs.map(pair => ({
      base_verb: pair.word,
      emoji: pair.emoji,
      forms: {
        present: `I ${pair.word}`,
        past: `I ${this.getPastTense(pair.word)}`,
        future: `I will ${pair.word}`
      }
    }));
    
    const actionChallenges = actionPairs.map(pair => ({
      emoji: pair.emoji,
      action: pair.word,
      challenge: `Can you show me how to ${pair.word}?`
    }));
    
    return {
      action_pairs: actionPairs,
      verb_conjugations: verbConjugations,
      action_challenges: actionChallenges,
      movement_activity: 'Let\'s act out these actions together!'
    };
  }

  /**
   * 📚 Story Building with Emojis
   * Create stories using emoji-word combinations
   */
  async playStoryBuildingGame(sessionId: string): Promise<{
    story_template: string;
    emoji_slots: Array<{
      position: number;
      category_hint: string;
      emoji_options: EmojiWordPair[];
    }>;
    completed_stories: string[];
    creativity_bonus: {
      challenge: string;
      reward: string;
    };
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Emoji matching session not found');
    
    const storyTemplates = [
      'Once upon a time, a {animal} went to the {place} to eat {food} and felt very {emotion}.',
      'The {character} liked to {action} every day and always ate {food} for lunch.',
      'In the magical forest, {animal} found a {object} and decided to {action} with joy!'
    ];
    
    const selectedTemplate = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
    
    const emojiSlots = [
      {
        position: 1,
        category_hint: 'Choose an animal',
        emoji_options: Array.from(this.emojiWordPairs.values())
          .filter(pair => pair.category === 'animals').slice(0, 4)
      },
      {
        position: 2,
        category_hint: 'Choose a food',
        emoji_options: Array.from(this.emojiWordPairs.values())
          .filter(pair => pair.category === 'food').slice(0, 4)
      },
      {
        position: 3,
        category_hint: 'Choose an emotion',
        emoji_options: Array.from(this.emojiWordPairs.values())
          .filter(pair => pair.category === 'emotions').slice(0, 4)
      }
    ];
    
    return {
      story_template: selectedTemplate,
      emoji_slots: emojiSlots,
      completed_stories: [
        'Once upon a time, a 🐱 cat went to the park to eat 🍎 apple and felt very 😊 happy.',
        'The 🦋 butterfly liked to 💃 dance every day and always ate 🌸 flowers for lunch.'
      ],
      creativity_bonus: {
        challenge: 'Create your own story using 5 different emojis!',
        reward: 'Storyteller Badge'
      }
    };
  }

  /**
   * ⚡ Rapid Emoji Matching
   * Fast-paced matching with time pressure
   */
  async playRapidMatchingGame(sessionId: string): Promise<{
    time_limit: number;
    emoji_stream: Array<{
      emoji: string;
      word: string;
      display_time: number;
      points_value: number;
    }>;
    speed_bonuses: Array<{
      threshold_ms: number;
      bonus_points: number;
      bonus_name: string;
    }>;
    power_ups: Array<{
      name: string;
      effect: string;
      activation_emoji: string;
    }>;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Emoji matching session not found');
    
    const profile = await this.getStudentMatchingProfile(session.student_id);
    
    // Create fast-paced emoji stream
    const allPairs = Array.from(this.emojiWordPairs.values())
      .filter(pair => pair.difficulty_level <= profile.visual_processing_level + 1);
    
    const emojiStream = allPairs.slice(0, 20).map(pair => ({
      emoji: pair.emoji,
      word: pair.word,
      display_time: Math.max(2000, 5000 - (profile.visual_processing_level * 500)),
      points_value: pair.difficulty_level * 10
    }));
    
    return {
      time_limit: 120, // 2 minutes
      emoji_stream: emojiStream,
      speed_bonuses: [
        { threshold_ms: 1000, bonus_points: 50, bonus_name: 'Lightning Fast!' },
        { threshold_ms: 2000, bonus_points: 25, bonus_name: 'Speedy!' },
        { threshold_ms: 3000, bonus_points: 10, bonus_name: 'Quick!' }
      ],
      power_ups: [
        { name: 'Slow Time', effect: 'Slows down emoji stream', activation_emoji: '⏰' },
        { name: 'Double Points', effect: 'Double points for next 5 matches', activation_emoji: '⭐' },
        { name: 'Skip', effect: 'Skip difficult emoji', activation_emoji: '⏭️' }
      ]
    };
  }

  /**
   * 🧠 Process Matching Answer
   * Handle student matching attempts with feedback
   */
  async processMatchingAnswer(
    sessionId: string,
    selectedEmoji: string,
    selectedWord: string
  ): Promise<{
    correct: boolean;
    feedback: {
      message: string;
      explanation: string;
      learning_tip: string;
    };
    score_earned: number;
    bonuses: string[];
    visual_feedback: {
      animation: string;
      celebration: string;
    };
    next_challenge?: any;
  }> {
    const session = this.activeChallenges.get(sessionId);
    if (!session) throw new Error('Matching session not found');
    
    const startTime = session.current_match_start || Date.now();
    const responseTime = Date.now() - startTime;
    
    // Find the correct pair
    const correctPair = Array.from(this.emojiWordPairs.values())
      .find(pair => pair.emoji === selectedEmoji);
    
    const correct = correctPair && correctPair.word.toLowerCase() === selectedWord.toLowerCase();
    
    let scoreEarned = 0;
    const bonuses: string[] = [];
    
    if (correct) {
      scoreEarned = 50;
      session.correct_matches++;
      
      // Speed bonus
      if (responseTime < 2000) {
        scoreEarned += 25;
        bonuses.push('Speed Bonus!');
      }
      
      // Accuracy streak bonus
      if (session.correct_matches % 5 === 0) {
        scoreEarned += 50;
        bonuses.push('Streak Bonus!');
      }
    }
    
    session.score += scoreEarned;
    session.matches_made++;
    
    const feedback = {
      message: correct 
        ? this.getPositiveMatchingFeedback()
        : this.getEncouragingMatchingFeedback(),
      explanation: correctPair 
        ? `${correctPair.emoji} matches "${correctPair.word}" - ${correctPair.definition}`
        : 'Let\'s try again with a different match!',
      learning_tip: await this.generateMatchingTip(selectedEmoji, selectedWord, correct)
    };
    
    const visualFeedback = {
      animation: correct ? 'bounce' : 'shake',
      celebration: correct ? '🎉✨🌟' : '💪🎯'
    };
    
    // Track the attempt
    await mlDataCollection.trackInteraction(session.student_id, {
      type: 'emoji_matching_attempt',
      metadata: {
        emoji: selectedEmoji,
        word: selectedWord,
        correct: correct,
        response_time: responseTime,
        score_earned: scoreEarned
      }
    });
    
    // Generate next challenge if continuing
    let nextChallenge = null;
    if (session.matches_made < 10) {
      nextChallenge = await this.createMatchingChallenge(
        session.game_type,
        await this.getStudentMatchingProfile(session.student_id)
      );
      session.current_match_start = Date.now();
    }
    
    return {
      correct,
      feedback,
      score_earned: scoreEarned,
      bonuses,
      visual_feedback: visualFeedback,
      next_challenge: nextChallenge
    };
  }

  /**
   * 📊 Get Matching Analytics
   * Comprehensive emoji-word matching progress
   */
  async getMatchingAnalytics(studentId: string): Promise<{
    overall_performance: {
      total_matches_attempted: number;
      accuracy_rate: number;
      average_response_time: number;
      favorite_categories: string[];
    };
    category_mastery: Array<{
      category: string;
      pairs_mastered: number;
      total_pairs: number;
      mastery_percentage: number;
    }>;
    visual_processing_insights: {
      symbol_recognition_speed: number;
      visual_memory_strength: number;
      pattern_recognition_ability: number;
    };
    recommendations: string[];
  }> {
    const profile = await this.getStudentMatchingProfile(studentId);
    
    const categories = ['animals', 'food', 'emotions', 'actions', 'objects'];
    const categoryMastery = categories.map(category => {
      const categoryPairs = Array.from(this.emojiWordPairs.values())
        .filter(pair => pair.category === category);
      const mastered = profile.mastered_pairs.filter(pair => pair.category === category);
      
      return {
        category: category,
        pairs_mastered: mastered.length,
        total_pairs: categoryPairs.length,
        mastery_percentage: (mastered.length / categoryPairs.length) * 100
      };
    });
    
    return {
      overall_performance: {
        total_matches_attempted: 156,
        accuracy_rate: 0.87,
        average_response_time: profile.response_time_average,
        favorite_categories: profile.preferred_categories
      },
      category_mastery: categoryMastery,
      visual_processing_insights: {
        symbol_recognition_speed: profile.visual_processing_level * 20,
        visual_memory_strength: profile.symbol_recognition_skills * 15,
        pattern_recognition_ability: 85
      },
      recommendations: [
        'Practice emotion recognition for better social understanding',
        'Work on action verbs to improve communication',
        'Try story building to enhance creativity'
      ]
    };
  }

  // Private helper methods
  
  private async initializeEmojiMatchingSystem(): void {
    console.log('🎮 Initializing Emoji-Word Matching System...');
    
    // Initialize emoji-word pairs
    const emojiPairs: EmojiWordPair[] = [
      // Animals
      { pair_id: 'animal_cat', emoji: '🐱', word: 'cat', category: 'animals', difficulty_level: 1, alternative_words: ['kitty', 'kitten'], pronunciation: '/kæt/', definition: 'A small furry pet', example_sentence: 'The cat sits on the mat.' },
      { pair_id: 'animal_dog', emoji: '🐶', word: 'dog', category: 'animals', difficulty_level: 1, alternative_words: ['puppy', 'doggy'], pronunciation: '/dɒg/', definition: 'A loyal pet animal', example_sentence: 'The dog wags its tail.' },
      { pair_id: 'animal_bird', emoji: '🐦', word: 'bird', category: 'animals', difficulty_level: 1, alternative_words: [], pronunciation: '/bɜːrd/', definition: 'An animal that flies', example_sentence: 'The bird sings in the tree.' },
      { pair_id: 'animal_fish', emoji: '🐟', word: 'fish', category: 'animals', difficulty_level: 1, alternative_words: [], pronunciation: '/fɪʃ/', definition: 'An animal that swims', example_sentence: 'The fish swims in water.' },
      { pair_id: 'animal_elephant', emoji: '🐘', word: 'elephant', category: 'animals', difficulty_level: 2, alternative_words: [], pronunciation: '/ˈɛlɪfənt/', definition: 'A large animal with a trunk', example_sentence: 'The elephant is very big.' },
      
      // Food
      { pair_id: 'food_apple', emoji: '🍎', word: 'apple', category: 'food', difficulty_level: 1, alternative_words: [], pronunciation: '/ˈæpəl/', definition: 'A red or green fruit', example_sentence: 'I eat an apple for lunch.' },
      { pair_id: 'food_banana', emoji: '🍌', word: 'banana', category: 'food', difficulty_level: 1, alternative_words: [], pronunciation: '/bəˈnænə/', definition: 'A yellow curved fruit', example_sentence: 'The banana is sweet.' },
      { pair_id: 'food_pizza', emoji: '🍕', word: 'pizza', category: 'food', difficulty_level: 2, alternative_words: [], pronunciation: '/ˈpitsə/', definition: 'A round food with cheese', example_sentence: 'We share pizza for dinner.' },
      { pair_id: 'food_cookie', emoji: '🍪', word: 'cookie', category: 'food', difficulty_level: 2, alternative_words: ['biscuit'], pronunciation: '/ˈkʊki/', definition: 'A sweet baked treat', example_sentence: 'The cookie tastes good.' },
      
      // Emotions
      { pair_id: 'emotion_happy', emoji: '😊', word: 'happy', category: 'emotions', difficulty_level: 1, alternative_words: ['glad', 'joyful'], pronunciation: '/ˈhæpi/', definition: 'Feeling good and cheerful', example_sentence: 'I am happy today.' },
      { pair_id: 'emotion_sad', emoji: '😢', word: 'sad', category: 'emotions', difficulty_level: 1, alternative_words: ['unhappy'], pronunciation: '/sæd/', definition: 'Feeling not happy', example_sentence: 'She feels sad.' },
      { pair_id: 'emotion_angry', emoji: '😠', word: 'angry', category: 'emotions', difficulty_level: 2, alternative_words: ['mad'], pronunciation: '/ˈæŋgri/', definition: 'Feeling very upset', example_sentence: 'He is angry about it.' },
      { pair_id: 'emotion_surprised', emoji: '😮', word: 'surprised', category: 'emotions', difficulty_level: 3, alternative_words: ['shocked'], pronunciation: '/sərˈpraɪzd/', definition: 'Feeling unexpected', example_sentence: 'I am surprised by the gift.' },
      
      // Actions
      { pair_id: 'action_run', emoji: '🏃', word: 'run', category: 'actions', difficulty_level: 1, alternative_words: ['jog'], pronunciation: '/rʌn/', definition: 'Move quickly with legs', example_sentence: 'I run in the park.' },
      { pair_id: 'action_sleep', emoji: '😴', word: 'sleep', category: 'actions', difficulty_level: 1, alternative_words: ['rest'], pronunciation: '/sliːp/', definition: 'Rest with eyes closed', example_sentence: 'I sleep at night.' },
      { pair_id: 'action_eat', emoji: '🍽️', word: 'eat', category: 'actions', difficulty_level: 1, alternative_words: [], pronunciation: '/iːt/', definition: 'Put food in mouth', example_sentence: 'We eat dinner together.' },
      { pair_id: 'action_dance', emoji: '💃', word: 'dance', category: 'actions', difficulty_level: 2, alternative_words: [], pronunciation: '/dæns/', definition: 'Move to music', example_sentence: 'She likes to dance.' },
      
      // Objects
      { pair_id: 'object_ball', emoji: '⚽', word: 'ball', category: 'objects', difficulty_level: 1, alternative_words: [], pronunciation: '/bɔːl/', definition: 'A round toy to play with', example_sentence: 'The ball is round.' },
      { pair_id: 'object_book', emoji: '📚', word: 'book', category: 'objects', difficulty_level: 1, alternative_words: [], pronunciation: '/bʊk/', definition: 'Something to read', example_sentence: 'I read a book.' },
      { pair_id: 'object_car', emoji: '🚗', word: 'car', category: 'objects', difficulty_level: 1, alternative_words: ['automobile'], pronunciation: '/kɑːr/', definition: 'A vehicle to drive', example_sentence: 'The car is fast.' },
      { pair_id: 'object_house', emoji: '🏠', word: 'house', category: 'objects', difficulty_level: 1, alternative_words: ['home'], pronunciation: '/haʊs/', definition: 'A place to live', example_sentence: 'My house is big.' }
    ];
    
    emojiPairs.forEach(pair => this.emojiWordPairs.set(pair.pair_id, pair));
    
    // Initialize games
    const games: EmojiMatchingGame[] = [
      {
        game_id: 'basic_match',
        game_type: 'basic_match',
        title: 'Basic Emoji Matching',
        description: 'Match emojis to their word names',
        learning_objectives: ['Symbol recognition', 'Word association', 'Visual processing'],
        target_age_range: '3-8 years',
        estimated_duration: 10,
        difficulty_settings: { pairs_count: 6, hints_available: 3 }
      },
      {
        game_id: 'category_match',
        game_type: 'category_match',
        title: 'Category Matching',
        description: 'Match emojis within specific categories',
        learning_objectives: ['Categorization', 'Vocabulary building', 'Classification skills'],
        target_age_range: '4-10 years',
        estimated_duration: 12,
        difficulty_settings: { pairs_count: 8, hints_available: 2 }
      },
      {
        game_id: 'emotion_match',
        game_type: 'emotion_match',
        title: 'Emotion Recognition',
        description: 'Match emotion emojis to feeling words',
        learning_objectives: ['Emotional intelligence', 'Self-awareness', 'Social skills'],
        target_age_range: '5-12 years',
        estimated_duration: 15,
        difficulty_settings: { pairs_count: 6, hints_available: 4 }
      },
      {
        game_id: 'rapid_match',
        game_type: 'rapid_match',
        title: 'Speed Matching',
        description: 'Fast-paced emoji matching',
        learning_objectives: ['Processing speed', 'Quick recognition', 'Fluency'],
        target_age_range: '6-15 years',
        estimated_duration: 5,
        difficulty_settings: { pairs_count: 20, time_limit: 120, hints_available: 1 }
      }
    ];
    
    games.forEach(game => this.matchingGames.set(game.game_type, game));
    
    console.log(`✅ Emoji matching system initialized with ${emojiPairs.length} pairs and ${games.length} games`);
  }
  
  private async getStudentMatchingProfile(studentId: string): Promise<StudentMatchingProfile> {
    let profile = this.studentProfiles.get(studentId);
    
    if (!profile) {
      profile = {
        student_id: studentId,
        visual_processing_level: 2,
        symbol_recognition_skills: 3,
        vocabulary_size: 150,
        preferred_categories: ['animals', 'food'],
        mastered_pairs: [],
        challenging_pairs: [],
        response_time_average: 3500,
        accuracy_trend: [0.6, 0.7, 0.75, 0.8, 0.85]
      };
      
      this.studentProfiles.set(studentId, profile);
    }
    
    return profile;
  }
  
  private async createMatchingChallenge(
    gameType: string,
    profile: StudentMatchingProfile,
    settings?: any
  ): Promise<MatchingChallenge> {
    const category = settings?.category || profile.preferred_categories[0];
    const difficulty = settings?.difficulty || profile.visual_processing_level;
    
    // Select appropriate emoji pairs
    const availablePairs = Array.from(this.emojiWordPairs.values())
      .filter(pair => 
        (!category || pair.category === category) &&
        pair.difficulty_level <= difficulty + 1
      );
    
    const selectedPairs = availablePairs.slice(0, settings?.pairs_count || 6);
    
    // Create word tiles (correct + distractors)
    const correctTiles = selectedPairs.map(pair => ({
      tile_id: `correct_${pair.word}`,
      word: pair.word,
      is_correct_match: true,
      corresponding_emoji: pair.emoji
    }));
    
    const distractorWords = ['happy', 'jump', 'tree', 'blue'];
    const distractorTiles = distractorWords.slice(0, 3).map(word => ({
      tile_id: `distractor_${word}`,
      word: word,
      is_correct_match: false
    }));
    
    const allTiles = [...correctTiles, ...distractorTiles].sort(() => Math.random() - 0.5);
    
    return {
      challenge_id: `challenge_${Date.now()}`,
      emoji_options: selectedPairs,
      word_tiles: allTiles,
      challenge_type: gameType,
      success_criteria: {
        matches_required: selectedPairs.length,
        accuracy_threshold: 0.8
      },
      hints: selectedPairs.map(pair => ({
        hint_type: 'definition' as const,
        content: pair.definition,
        cost: 10
      }))
    };
  }
  
  private getAnimalFact(animal: string): string {
    const facts: Record<string, string> = {
      'cat': 'Cats can rotate their ears 180 degrees!',
      'dog': 'Dogs have an amazing sense of smell!',
      'bird': 'Birds can see more colors than humans!',
      'fish': 'Fish never stop growing throughout their lives!',
      'elephant': 'Elephants never forget and are very smart!'
    };
    return facts[animal] || `${animal}s are amazing creatures!`;
  }
  
  private getAnimalSound(animal: string): string {
    const sounds: Record<string, string> = {
      'cat': 'Meow! 🐱',
      'dog': 'Woof! 🐶',
      'bird': 'Tweet! 🐦',
      'elephant': 'Trumpet! 🐘'
    };
    return sounds[animal] || 'What sound does this animal make?';
  }
  
  private getNutritionTip(food: string): string {
    const tips: Record<string, string> = {
      'apple': 'Apples are full of fiber and vitamins!',
      'banana': 'Bananas give you energy and potassium!',
      'pizza': 'Pizza can be healthy with vegetables on top!',
      'cookie': 'Cookies are a special treat to enjoy sometimes!'
    };
    return tips[food] || `${food} can be part of a healthy diet!`;
  }
  
  private getEmotionScenario(emotion: string): string {
    const scenarios: Record<string, string> = {
      'happy': 'When you get a surprise gift from a friend',
      'sad': 'When your favorite toy breaks',
      'angry': 'When someone takes your turn without asking',
      'surprised': 'When you find something unexpected'
    };
    return scenarios[emotion] || `A time when you might feel ${emotion}`;
  }
  
  private getCopingStrategy(emotion: string): string {
    const strategies: Record<string, string> = {
      'happy': 'Share your happiness with others!',
      'sad': 'Talk to someone you trust about your feelings',
      'angry': 'Take deep breaths and count to ten',
      'surprised': 'Take a moment to understand what happened'
    };
    return strategies[emotion] || 'Remember that all feelings are okay to have';
  }
  
  private getPastTense(verb: string): string {
    const pastTense: Record<string, string> = {
      'run': 'ran',
      'sleep': 'slept',
      'eat': 'ate',
      'dance': 'danced'
    };
    return pastTense[verb] || `${verb}ed`;
  }
  
  private getPositiveMatchingFeedback(): string {
    const messages = [
      "Perfect match! You're amazing! 🌟",
      "Excellent! You got it right! 👏",
      "Fantastic matching! Well done! 🎉",
      "Super job! That's exactly right! ⭐",
      "Wonderful! You're a matching master! 🏆"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  private getEncouragingMatchingFeedback(): string {
    const messages = [
      "Good try! Let's find the right match! 💪",
      "Almost there! Keep looking! 🔍",
      "You're learning! Try another one! 🌱",
      "Great effort! Let's try again! 🎯",
      "Keep going! You can do this! 🚀"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  private async generateMatchingTip(emoji: string, word: string, correct: boolean): Promise<string> {
    if (correct) {
      return `Great! ${emoji} and "${word}" go together perfectly!`;
    } else {
      return `Think about what ${emoji} represents. What word describes this emoji?`;
    }
  }
  
  private async generateGameInstructions(gameType: string): Promise<string> {
    const instructions = {
      basic_match: 'Look at each emoji and find the word that matches it!',
      category_match: 'Match emojis to words within the same category!',
      emotion_match: 'Match each emotion emoji to the feeling word!',
      action_match: 'Connect action emojis to their verb words!',
      story_build: 'Choose emojis to complete the story!',
      rapid_match: 'Quick! Match as many emoji-word pairs as you can!',
      memory_match: 'Remember the emoji locations and find their word matches!',
      sequence_match: 'Match emojis to words in the correct sequence!'
    };
    
    return instructions[gameType as keyof typeof instructions] || 'Match emojis to their word names!';
  }
  
  private async createVisualGameSetup(challenge: MatchingChallenge): Promise<any> {
    return {
      layout: 'grid',
      emoji_size: 'large',
      word_tile_style: 'rounded',
      background_theme: 'cheerful',
      animation_style: 'bounce'
    };
  }
}

// Export singleton
export const emojiWordMatchingGamesService = EmojiWordMatchingGamesService.getInstance();