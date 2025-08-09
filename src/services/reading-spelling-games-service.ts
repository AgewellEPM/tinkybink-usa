/**
 * Reading & Spelling Games Service
 * Feature #101: Comprehensive Literacy Learning Games
 * 
 * Tile-based reading and spelling games that teach literacy skills
 * through interactive AAC communication tiles and gamification.
 * 
 * Core Learning Areas:
 * - Phonemic awareness and phonics
 * - Sight word recognition and spelling
 * - Word building and decoding
 * - Reading comprehension activities
 * - Sentence construction games
 * 
 * Educational Impact: Transforms AAC tiles into powerful literacy
 * learning tools while maintaining communication focus.
 * 
 * @author TinkyBink AAC Platform
 * @version 1.0.0 - Literacy Edition
 * @since 2024-12-01
 */

import { mlDataCollection } from './ml-data-collection';
import { gameTracking } from './game-tracking';

interface ReadingGameTile {
  id: string;
  text: string;
  phonics: string;
  image_url?: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  word_type: 'sight_word' | 'phonetic' | 'compound' | 'syllable';
  category: string;
  audio_pronunciation?: string;
}

interface SpellingChallenge {
  challenge_id: string;
  word: string;
  definition: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hints: string[];
  phonetic_breakdown: string[];
  available_tiles: ReadingGameTile[];
  correct_sequence: string[];
  learning_objective: string;
}

interface ReadingGame {
  game_id: string;
  game_type: 'word_builder' | 'sight_words' | 'phonics_match' | 'sentence_builder' | 'story_sequencer' | 'rhyme_time' | 'spelling_bee';
  title: string;
  description: string;
  difficulty_level: number;
  learning_objectives: string[];
  estimated_duration: number; // minutes
  tiles_required: ReadingGameTile[];
  success_criteria: {
    accuracy_threshold: number;
    completion_time_limit?: number;
    attempts_allowed: number;
  };
  rewards: {
    points: number;
    badges: string[];
    unlock_games?: string[];
  };
}

interface StudentProgress {
  student_id: string;
  reading_level: number;
  spelling_level: number;
  phonics_mastery: Record<string, number>; // sound -> mastery percentage
  sight_words_learned: string[];
  current_learning_goals: string[];
  strengths: string[];
  areas_for_improvement: string[];
  games_completed: Array<{
    game_id: string;
    completion_date: Date;
    score: number;
    time_taken: number;
    accuracy: number;
  }>;
}

class ReadingSpellingGamesService {
  private static instance: ReadingSpellingGamesService;
  private gameLibrary: Map<string, ReadingGame> = new Map();
  private tileLibrary: Map<string, ReadingGameTile> = new Map();
  private studentProfiles: Map<string, StudentProgress> = new Map();
  private activeGames: Map<string, any> = new Map();
  
  private constructor() {
    this.initializeReadingGames();
  }
  
  static getInstance(): ReadingSpellingGamesService {
    if (!ReadingSpellingGamesService.instance) {
      ReadingSpellingGamesService.instance = new ReadingSpellingGamesService();
    }
    return ReadingSpellingGamesService.instance;
  }

  /**
   * 🎯 Start Reading Game Session
   * Launches adaptive reading games based on student level
   */
  async startReadingGame(
    studentId: string,
    gameType: ReadingGame['game_type'],
    customDifficulty?: number
  ): Promise<{
    session_id: string;
    game: ReadingGame;
    current_tiles: ReadingGameTile[];
    instructions: string;
    progress_tracking: any;
  }> {
    console.log(`📚 Starting ${gameType} reading game for student ${studentId}...`);
    
    try {
      // Get student's current level
      const studentProgress = await this.getStudentProgress(studentId);
      const difficulty = customDifficulty || this.calculateOptimalDifficulty(studentProgress, gameType);
      
      // Select appropriate game
      const game = await this.selectGame(gameType, difficulty);
      const sessionId = `reading_session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Prepare tiles for the game
      const gameTiles = await this.prepareGameTiles(game, studentProgress);
      
      // Initialize session
      const gameSession = {
        session_id: sessionId,
        student_id: studentId,
        game: game,
        start_time: new Date(),
        current_tiles: gameTiles,
        score: 0,
        attempts: 0,
        completed_challenges: 0,
        instructions: await this.generateGameInstructions(game),
        progress_tracking: {
          correct_answers: 0,
          total_attempts: 0,
          time_per_challenge: [],
          learning_moments: []
        }
      };
      
      this.activeGames.set(sessionId, gameSession);
      
      // Track game start
      await mlDataCollection.trackInteraction(studentId, {
        type: 'reading_game_started',
        metadata: {
          game_type: gameType,
          difficulty: difficulty,
          session_id: sessionId,
          tiles_count: gameTiles.length
        }
      });
      
      console.log(`✅ Reading game session ${sessionId} started successfully`);
      
      return {
        session_id: sessionId,
        game: game,
        current_tiles: gameTiles,
        instructions: gameSession.instructions,
        progress_tracking: gameSession.progress_tracking
      };
      
    } catch (error) {
      console.error('Error starting reading game:', error);
      throw new Error(`Failed to start reading game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔤 Word Builder Game
   * Students build words using tile system
   */
  async playWordBuilderGame(sessionId: string): Promise<SpellingChallenge> {
    const session = this.activeGames.get(sessionId);
    if (!session) throw new Error('Game session not found');
    
    const challenge: SpellingChallenge = {
      challenge_id: `word_build_${Date.now()}`,
      word: await this.selectTargetWord(session.student_id),
      definition: '',
      difficulty: 'beginner',
      hints: [],
      phonetic_breakdown: [],
      available_tiles: [],
      correct_sequence: [],
      learning_objective: 'Build words using communication tiles'
    };
    
    // Generate word based on student level
    const targetWord = challenge.word;
    challenge.definition = await this.getWordDefinition(targetWord);
    challenge.phonetic_breakdown = this.breakDownPhonetically(targetWord);
    challenge.hints = [
      `This word has ${targetWord.length} letters`,
      `It starts with the sound "${targetWord[0]}"`,
      `Definition: ${challenge.definition}`
    ];
    
    // Create tiles for word building
    const correctTiles = targetWord.split('').map((letter, index) => ({
      id: `correct_${letter}_${index}`,
      text: letter.toUpperCase(),
      phonics: this.getLetterSound(letter),
      difficulty_level: 2 as const,
      word_type: 'phonetic' as const,
      category: 'letter',
      audio_pronunciation: `/audio/letters/${letter.toLowerCase()}.mp3`
    }));
    
    // Add distractor tiles
    const distractorTiles = await this.generateDistractorTiles(targetWord, 5);
    
    challenge.available_tiles = [...correctTiles, ...distractorTiles].sort(() => Math.random() - 0.5);
    challenge.correct_sequence = correctTiles.map(tile => tile.id);
    
    return challenge;
  }

  /**
   * 👁️ Sight Words Game
   * Recognition and spelling of high-frequency words
   */
  async playSightWordsGame(sessionId: string): Promise<{
    challenge: SpellingChallenge;
    sight_words_bank: ReadingGameTile[];
    game_mode: 'recognition' | 'spelling' | 'sentence_use';
  }> {
    const session = this.activeGames.get(sessionId);
    if (!session) throw new Error('Game session not found');
    
    const studentProgress = await this.getStudentProgress(session.student_id);
    const sightWordsToLearn = await this.getSightWordsForLevel(studentProgress.reading_level);
    
    // Select sight word for this challenge
    const targetWord = this.selectNextSightWord(sightWordsToLearn, studentProgress.sight_words_learned);
    
    const challenge: SpellingChallenge = {
      challenge_id: `sight_word_${Date.now()}`,
      word: targetWord,
      definition: await this.getWordDefinition(targetWord),
      difficulty: 'beginner',
      hints: [
        `This is a sight word you should memorize`,
        `It appears frequently in stories`,
        `Try to remember the whole word shape`
      ],
      phonetic_breakdown: [targetWord], // Sight words learned as whole units
      available_tiles: [],
      correct_sequence: [],
      learning_objective: 'Recognize and spell high-frequency sight words'
    };
    
    // Create sight word tiles
    const sightWordTiles = sightWordsToLearn.map(word => ({
      id: `sight_${word}`,
      text: word.toUpperCase(),
      phonics: word,
      difficulty_level: 1 as const,
      word_type: 'sight_word' as const,
      category: 'sight_word',
      audio_pronunciation: `/audio/sight_words/${word.toLowerCase()}.mp3`
    }));
    
    const gameMode = Math.random() > 0.5 ? 'recognition' : 'spelling';
    
    return {
      challenge,
      sight_words_bank: sightWordTiles,
      game_mode: gameMode
    };
  }

  /**
   * 🔊 Phonics Matching Game
   * Match sounds to letters and letter combinations
   */
  async playPhonicsGame(sessionId: string): Promise<{
    phonics_pairs: Array<{
      sound_tile: ReadingGameTile;
      letter_tiles: ReadingGameTile[];
      correct_match: string;
    }>;
    learning_focus: string;
  }> {
    const session = this.activeGames.get(sessionId);
    if (!session) throw new Error('Game session not found');
    
    const phonicsSounds = [
      { sound: '/æt/', letters: 'at', examples: ['cat', 'bat', 'hat'] },
      { sound: '/ɪn/', letters: 'in', examples: ['pin', 'win', 'bin'] },
      { sound: '/ʌp/', letters: 'up', examples: ['cup', 'pup'] },
      { sound: '/ɛd/', letters: 'ed', examples: ['bed', 'red', 'fed'] },
      { sound: '/ɪt/', letters: 'it', examples: ['sit', 'hit', 'bit'] }
    ];
    
    const selectedSounds = phonicsSounds.slice(0, 3); // Start with 3 sounds
    
    const phonicsPairs = selectedSounds.map(sound => ({
      sound_tile: {
        id: `sound_${sound.sound}`,
        text: sound.sound,
        phonics: sound.sound,
        difficulty_level: 2 as const,
        word_type: 'phonetic' as const,
        category: 'phonics_sound',
        audio_pronunciation: `/audio/phonics/${sound.letters}.mp3`
      },
      letter_tiles: [
        {
          id: `letters_${sound.letters}`,
          text: sound.letters.toUpperCase(),
          phonics: sound.sound,
          difficulty_level: 2 as const,
          word_type: 'phonetic' as const,
          category: 'letter_pattern'
        }
      ],
      correct_match: sound.letters
    }));
    
    return {
      phonics_pairs: phonicsPairs,
      learning_focus: 'Match letter sounds to letter patterns'
    };
  }

  /**
   * 📖 Sentence Builder Game
   * Build sentences using word tiles
   */
  async playSentenceBuilderGame(sessionId: string): Promise<{
    sentence_template: string;
    word_tiles: ReadingGameTile[];
    correct_sentence: string;
    learning_objective: string;
  }> {
    const session = this.activeGames.get(sessionId);
    if (!session) throw new Error('Game session not found');
    
    const sentenceTemplates = [
      { template: "The ___ is ___.", example: "The cat is big.", focus: "Simple sentences" },
      { template: "I can ___ the ___.", example: "I can see the dog.", focus: "Action words" },
      { template: "___ likes to ___.", example: "Mom likes to read.", focus: "Personal preferences" },
      { template: "We go to the ___.", example: "We go to the park.", focus: "Places" }
    ];
    
    const selectedTemplate = sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
    const targetSentence = selectedTemplate.example;
    
    // Create word tiles for sentence
    const words = targetSentence.replace('.', '').split(' ');
    const wordTiles = words.map((word, index) => ({
      id: `word_${word}_${index}`,
      text: word,
      phonics: word.toLowerCase(),
      difficulty_level: 2 as const,
      word_type: 'sight_word' as const,
      category: 'sentence_word'
    }));
    
    // Add distractor words
    const distractors = ['dog', 'run', 'happy', 'blue', 'fast'];
    const distractorTiles = distractors.slice(0, 3).map(word => ({
      id: `distractor_${word}`,
      text: word,
      phonics: word,
      difficulty_level: 2 as const,
      word_type: 'sight_word' as const,
      category: 'distractor'
    }));
    
    const allTiles = [...wordTiles, ...distractorTiles].sort(() => Math.random() - 0.5);
    
    return {
      sentence_template: selectedTemplate.template,
      word_tiles: allTiles,
      correct_sentence: targetSentence,
      learning_objective: selectedTemplate.focus
    };
  }

  /**
   * 🎵 Rhyme Time Game
   * Find words that rhyme using tiles
   */
  async playRhymeGame(sessionId: string): Promise<{
    target_word: ReadingGameTile;
    word_options: ReadingGameTile[];
    rhyming_words: string[];
    learning_focus: string;
  }> {
    const rhymeFamilies = [
      { family: 'at', words: ['cat', 'bat', 'hat', 'mat', 'rat'] },
      { family: 'an', words: ['can', 'man', 'pan', 'ran', 'fan'] },
      { family: 'ig', words: ['big', 'dig', 'fig', 'pig', 'wig'] },
      { family: 'op', words: ['hop', 'mop', 'pop', 'top', 'cop'] }
    ];
    
    const selectedFamily = rhymeFamilies[Math.floor(Math.random() * rhymeFamilies.length)];
    const targetWord = selectedFamily.words[0];
    const rhymingWords = selectedFamily.words.slice(1);
    
    // Create target word tile
    const targetTile: ReadingGameTile = {
      id: `target_${targetWord}`,
      text: targetWord.toUpperCase(),
      phonics: `/${targetWord}/`,
      difficulty_level: 2,
      word_type: 'phonetic',
      category: 'rhyme_family'
    };
    
    // Create option tiles (rhyming + non-rhyming)
    const nonRhyming = ['dog', 'sun', 'tree', 'blue'];
    const options = [...rhymingWords.slice(0, 3), ...nonRhyming.slice(0, 2)];
    
    const optionTiles = options.map(word => ({
      id: `option_${word}`,
      text: word.toUpperCase(),
      phonics: `/${word}/`,
      difficulty_level: 2 as const,
      word_type: 'phonetic' as const,
      category: rhymingWords.includes(word) ? 'rhyme_match' : 'no_rhyme'
    }));
    
    return {
      target_word: targetTile,
      word_options: optionTiles.sort(() => Math.random() - 0.5),
      rhyming_words: rhymingWords,
      learning_focus: 'Identify words that rhyme and sound patterns'
    };
  }

  /**
   * 🏆 Process Game Answer
   * Handle student responses and provide feedback
   */
  async processGameAnswer(
    sessionId: string,
    studentAnswer: string[],
    challengeId: string
  ): Promise<{
    correct: boolean;
    feedback: string;
    score_earned: number;
    learning_tip?: string;
    next_challenge?: any;
  }> {
    const session = this.activeGames.get(sessionId);
    if (!session) throw new Error('Game session not found');
    
    session.attempts++;
    session.progress_tracking.total_attempts++;
    
    // Check answer correctness (implementation depends on game type)
    const correct = await this.validateAnswer(studentAnswer, challengeId, session.game.game_type);
    
    let feedback = '';
    let scoreEarned = 0;
    let learningTip = '';
    
    if (correct) {
      session.score += 10;
      session.completed_challenges++;
      session.progress_tracking.correct_answers++;
      
      feedback = this.getPositiveFeedback();
      scoreEarned = 10;
      
      // Track successful learning
      await mlDataCollection.trackInteraction(session.student_id, {
        type: 'reading_challenge_completed',
        metadata: {
          challenge_id: challengeId,
          correct: true,
          attempts: session.attempts,
          game_type: session.game.game_type
        }
      });
      
    } else {
      feedback = this.getEncouragingFeedback();
      learningTip = await this.generateLearningTip(studentAnswer, challengeId);
      
      // Track learning opportunity
      await mlDataCollection.trackInteraction(session.student_id, {
        type: 'reading_challenge_attempt',
        metadata: {
          challenge_id: challengeId,
          correct: false,
          student_answer: studentAnswer,
          game_type: session.game.game_type
        }
      });
    }
    
    // Generate next challenge if game continues
    let nextChallenge = null;
    if (session.completed_challenges < 5) { // Continue for 5 challenges
      nextChallenge = await this.generateNextChallenge(session);
    }
    
    return {
      correct,
      feedback,
      score_earned: scoreEarned,
      learning_tip,
      next_challenge: nextChallenge
    };
  }

  /**
   * 📊 Get Student Reading Progress
   * Comprehensive literacy progress tracking
   */
  async getStudentProgress(studentId: string): Promise<StudentProgress> {
    let progress = this.studentProfiles.get(studentId);
    
    if (!progress) {
      // Initialize new student profile
      progress = {
        student_id: studentId,
        reading_level: 1,
        spelling_level: 1,
        phonics_mastery: {},
        sight_words_learned: [],
        current_learning_goals: [
          'Learn letter sounds',
          'Recognize 10 sight words',
          'Build simple 3-letter words'
        ],
        strengths: [],
        areas_for_improvement: [],
        games_completed: []
      };
      
      this.studentProfiles.set(studentId, progress);
    }
    
    return progress;
  }

  /**
   * 🎯 Get Adaptive Game Recommendations
   * AI-powered game selection based on progress
   */
  async getGameRecommendations(studentId: string): Promise<{
    recommended_games: ReadingGame[];
    reasoning: string[];
    focus_areas: string[];
  }> {
    const progress = await this.getStudentProgress(studentId);
    const recommendations: ReadingGame[] = [];
    const reasoning: string[] = [];
    const focusAreas: string[] = [];
    
    // Analyze current performance
    if (progress.phonics_mastery && Object.keys(progress.phonics_mastery).length < 5) {
      focusAreas.push('Phonics Development');
      reasoning.push('Student needs more practice with letter sounds');
    }
    
    if (progress.sight_words_learned.length < 20) {
      focusAreas.push('Sight Word Recognition');
      reasoning.push('Building sight word vocabulary is important');
    }
    
    if (progress.spelling_level < progress.reading_level) {
      focusAreas.push('Spelling Practice');
      reasoning.push('Spelling skills need to catch up with reading level');
    }
    
    // Select appropriate games
    const allGames = Array.from(this.gameLibrary.values());
    const suitableGames = allGames.filter(game => 
      game.difficulty_level <= progress.reading_level + 1 &&
      game.difficulty_level >= progress.reading_level - 1
    );
    
    return {
      recommended_games: suitableGames.slice(0, 5),
      reasoning,
      focus_areas: focusAreas
    };
  }

  // Private helper methods
  
  private async initializeReadingGames(): void {
    console.log('📚 Initializing Reading & Spelling Games...');
    
    // Initialize game library
    const games: ReadingGame[] = [
      {
        game_id: 'word_builder_1',
        game_type: 'word_builder',
        title: 'Word Builder Adventure',
        description: 'Build words using letter tiles',
        difficulty_level: 1,
        learning_objectives: ['Letter recognition', 'Phonemic awareness', 'Word construction'],
        estimated_duration: 10,
        tiles_required: [],
        success_criteria: { accuracy_threshold: 0.7, attempts_allowed: 3 },
        rewards: { points: 50, badges: ['Word Builder'] }
      },
      {
        game_id: 'sight_words_1',
        game_type: 'sight_words',
        title: 'Sight Word Safari',
        description: 'Learn high-frequency words',
        difficulty_level: 1,
        learning_objectives: ['Sight word recognition', 'Reading fluency'],
        estimated_duration: 8,
        tiles_required: [],
        success_criteria: { accuracy_threshold: 0.8, attempts_allowed: 2 },
        rewards: { points: 40, badges: ['Sight Word Champion'] }
      },
      {
        game_id: 'phonics_match_1',
        game_type: 'phonics_match',
        title: 'Phonics Party',
        description: 'Match sounds to letters',
        difficulty_level: 1,
        learning_objectives: ['Phonemic awareness', 'Letter-sound correspondence'],
        estimated_duration: 12,
        tiles_required: [],
        success_criteria: { accuracy_threshold: 0.75, attempts_allowed: 3 },
        rewards: { points: 60, badges: ['Phonics Pro'] }
      }
    ];
    
    games.forEach(game => this.gameLibrary.set(game.game_id, game));
    
    console.log(`✅ Initialized ${games.length} reading games`);
  }
  
  private calculateOptimalDifficulty(progress: StudentProgress, gameType: string): number {
    // AI-based difficulty calculation
    const baseLevel = progress.reading_level;
    
    switch (gameType) {
      case 'phonics_match':
        return Math.max(1, baseLevel - 1); // Slightly easier for phonics
      case 'sight_words':
        return baseLevel;
      case 'word_builder':
        return Math.min(5, baseLevel + 1); // Slightly harder for construction
      default:
        return baseLevel;
    }
  }
  
  private async selectGame(gameType: ReadingGame['game_type'], difficulty: number): Promise<ReadingGame> {
    const games = Array.from(this.gameLibrary.values());
    const suitableGames = games.filter(game => 
      game.game_type === gameType && 
      Math.abs(game.difficulty_level - difficulty) <= 1
    );
    
    return suitableGames[0] || games[0]; // Fallback to first game
  }
  
  private async selectTargetWord(studentId: string): Promise<string> {
    const progress = await this.getStudentProgress(studentId);
    
    // Word lists by difficulty
    const wordLists = {
      1: ['cat', 'dog', 'sun', 'run', 'fun'],
      2: ['jump', 'play', 'help', 'look', 'come'],
      3: ['happy', 'today', 'school', 'friend', 'family'],
      4: ['beautiful', 'important', 'together', 'different', 'favorite'],
      5: ['responsibility', 'communication', 'understanding', 'imagination', 'celebration']
    };
    
    const words = wordLists[progress.reading_level as keyof typeof wordLists] || wordLists[1];
    return words[Math.floor(Math.random() * words.length)];
  }
  
  private getPositiveFeedback(): string {
    const messages = [
      "Excellent work! 🌟",
      "Perfect! You're getting so good at this! 🎉",
      "Amazing job! Keep it up! 👏",
      "Fantastic! You're a reading superstar! ⭐",
      "Outstanding! Your reading skills are growing! 📚"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  private getEncouragingFeedback(): string {
    const messages = [
      "Good try! Let's practice that again! 💪",
      "You're learning! Keep trying! 🌱",
      "Almost there! Try one more time! 🎯",
      "Great effort! Learning takes practice! ⭐",
      "You're doing great! Let's figure this out together! 🤝"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  private async generateGameInstructions(game: ReadingGame): Promise<string> {
    const instructions = {
      'word_builder': 'Drag the letter tiles to build the word you hear! Listen carefully and put the letters in the right order.',
      'sight_words': 'Look at the word and remember it! These are special words you should know by sight.',
      'phonics_match': 'Listen to the sound and find the matching letters! What letters make that sound?',
      'sentence_builder': 'Use the word tiles to build a complete sentence! Make sure it makes sense.',
      'rhyme_time': 'Find all the words that rhyme with the target word! They should sound similar at the end.',
      'story_sequencer': 'Put the sentence tiles in order to tell the story! What happens first, next, and last?',
      'spelling_bee': 'Listen to the word and spell it using the letter tiles! Take your time and sound it out.'
    };
    
    return instructions[game.game_type] || 'Follow the game instructions to complete the challenge!';
  }
  
  private async generateDistractorTiles(targetWord: string, count: number): ReadingGameTile[] {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const targetLetters = targetWord.toLowerCase().split('');
    const distractors: ReadingGameTile[] = [];
    
    for (let i = 0; i < count; i++) {
      let letter;
      do {
        letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      } while (targetLetters.includes(letter));
      
      distractors.push({
        id: `distractor_${letter}_${i}`,
        text: letter.toUpperCase(),
        phonics: this.getLetterSound(letter),
        difficulty_level: 2,
        word_type: 'phonetic',
        category: 'distractor'
      });
    }
    
    return distractors;
  }
  
  private getLetterSound(letter: string): string {
    const sounds: Record<string, string> = {
      'a': '/æ/', 'b': '/b/', 'c': '/k/', 'd': '/d/', 'e': '/ɛ/',
      'f': '/f/', 'g': '/g/', 'h': '/h/', 'i': '/ɪ/', 'j': '/dʒ/',
      'k': '/k/', 'l': '/l/', 'm': '/m/', 'n': '/n/', 'o': '/ɒ/',
      'p': '/p/', 'q': '/kw/', 'r': '/r/', 's': '/s/', 't': '/t/',
      'u': '/ʌ/', 'v': '/v/', 'w': '/w/', 'x': '/ks/', 'y': '/j/', 'z': '/z/'
    };
    return sounds[letter.toLowerCase()] || `/${letter}/`;
  }
  
  private async getWordDefinition(word: string): Promise<string> {
    // Simple definitions for common words
    const definitions: Record<string, string> = {
      'cat': 'A small furry animal that says meow',
      'dog': 'A friendly animal that barks and wags its tail',
      'sun': 'The bright star that gives us light and warmth',
      'run': 'To move quickly with your legs',
      'fun': 'Something that makes you happy and excited'
    };
    return definitions[word.toLowerCase()] || `The word "${word}"`;
  }
  
  private async getSightWordsForLevel(level: number): Promise<string[]> {
    const sightWordLists = {
      1: ['the', 'and', 'a', 'to', 'said', 'you', 'of', 'we', 'go', 'me'],
      2: ['are', 'this', 'going', 'they', 'away', 'play', 'yellow', 'what', 'came', 'get'],
      3: ['where', 'help', 'make', 'here', 'good', 'went', 'walk', 'am', 'then', 'eat'],
      4: ['want', 'over', 'how', 'did', 'run', 'know', 'right', 'put', 'too', 'like'],
      5: ['some', 'her', 'would', 'so', 'these', 'come', 'its', 'now', 'find', 'long']
    };
    
    return sightWordLists[level as keyof typeof sightWordLists] || sightWordLists[1];
  }
  
  private selectNextSightWord(available: string[], learned: string[]): string {
    const unlearned = available.filter(word => !learned.includes(word));
    return unlearned[0] || available[0];
  }
  
  private breakDownPhonetically(word: string): string[] {
    // Simple phonetic breakdown
    return word.split('').map(letter => this.getLetterSound(letter));
  }
  
  private async prepareGameTiles(game: ReadingGame, progress: StudentProgress): Promise<ReadingGameTile[]> {
    // Generate appropriate tiles based on game type and student level
    const tiles: ReadingGameTile[] = [];
    
    // This would be expanded based on specific game requirements
    for (let i = 0; i < 10; i++) {
      tiles.push({
        id: `tile_${i}`,
        text: String.fromCharCode(65 + i), // A, B, C, etc.
        phonics: this.getLetterSound(String.fromCharCode(97 + i)),
        difficulty_level: game.difficulty_level,
        word_type: 'phonetic',
        category: 'letter'
      });
    }
    
    return tiles;
  }
  
  private async validateAnswer(answer: string[], challengeId: string, gameType: string): Promise<boolean> {
    // Implementation would depend on specific game type and challenge
    // For now, return random result for demo
    return Math.random() > 0.3; // 70% success rate for demo
  }
  
  private async generateLearningTip(studentAnswer: string[], challengeId: string): Promise<string> {
    return "Try sounding out each letter slowly, then blend them together!";
  }
  
  private async generateNextChallenge(session: any): Promise<any> {
    // Generate next challenge based on game type
    switch (session.game.game_type) {
      case 'word_builder':
        return await this.playWordBuilderGame(session.session_id);
      case 'sight_words':
        return await this.playSightWordsGame(session.session_id);
      default:
        return null;
    }
  }
}

// Export singleton
export const readingSpellingGamesService = ReadingSpellingGamesService.getInstance();