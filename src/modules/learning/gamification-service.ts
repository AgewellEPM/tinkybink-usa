// Gamification Service - Module 25
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getRewardsSystemService } from './rewards-system-service';
import { getUIEffectsService } from '../ui/ui-effects-service';
import { getHapticService } from '../ui/haptic-service';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'community';
  category: 'communication' | 'learning' | 'social' | 'exploration';
  requirements: {
    action: string;
    target: number;
    current: number;
  }[];
  rewards: {
    points: number;
    badges?: string[];
    unlocks?: string[];
  };
  startDate: string;
  endDate: string;
  completed: boolean;
  claimed: boolean;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  storyline: string;
  chapters: QuestChapter[];
  currentChapter: number;
  completed: boolean;
  rewards: {
    points: number;
    items: string[];
    title?: string;
  };
}

interface QuestChapter {
  id: string;
  title: string;
  objectives: QuestObjective[];
  narrative: string;
  completed: boolean;
}

interface QuestObjective {
  id: string;
  description: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
}

interface Leaderboard {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category: 'points' | 'sentences' | 'games' | 'streak' | 'achievements';
  entries: LeaderboardEntry[];
  userRank?: number;
  lastUpdated: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  badge?: string;
  isCurrentUser: boolean;
}

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: {
    type: 'points_multiplier' | 'hint_helper' | 'time_freeze' | 'streak_shield' | 'xp_boost';
    value: number;
    duration?: number;
  };
  quantity: number;
  active: boolean;
  expiresAt?: number;
}

interface MiniGame {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockLevel: number;
  highScore: number;
  timesPlayed: number;
  rewards: {
    completion: number;
    perfect: number;
    highScore: number;
  };
}

export class GamificationService {
  private static instance: GamificationService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private rewardsService = getRewardsSystemService();
  private uiEffectsService = getUIEffectsService();
  private hapticService = getHapticService();

  private challenges: Map<string, Challenge> = new Map();
  private quests: Map<string, Quest> = new Map();
  private leaderboards: Map<string, Leaderboard> = new Map();
  private powerUps: Map<string, PowerUp> = new Map();
  private miniGames: Map<string, MiniGame> = new Map();
  
  private activeChallenges: string[] = [];
  private activeQuest: string | null = null;
  private combos: { count: number; multiplier: number } = { count: 0, multiplier: 1 };
  private lastActionTime: number = 0;

  private constructor() {
    this.initializeChallenges();
    this.initializeQuests();
    this.initializePowerUps();
    this.initializeMiniGames();
  }

  static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  initialize(): void {
    console.log('GamificationService initializing...');
    this.loadProgress();
    this.refreshDailyChallenges();
    this.updateLeaderboards();
    this.checkExpiredPowerUps();
    this.setupEventListeners();
    console.log('GamificationService initialized');
  }

  private initializeChallenges(): void {
    // Daily Challenges
    this.generateDailyChallenge('daily_sentences', {
      title: 'Daily Communicator',
      description: 'Create 10 sentences today',
      type: 'daily',
      category: 'communication',
      requirements: [{
        action: 'create_sentence',
        target: 10,
        current: 0
      }],
      rewards: {
        points: 50,
        badges: ['daily_star']
      }
    });

    this.generateDailyChallenge('daily_games', {
      title: 'Game Master',
      description: 'Complete 3 educational games',
      type: 'daily',
      category: 'learning',
      requirements: [{
        action: 'complete_game',
        target: 3,
        current: 0
      }],
      rewards: {
        points: 40
      }
    });

    this.generateDailyChallenge('daily_voice', {
      title: 'Voice Explorer',
      description: 'Use voice commands 5 times',
      type: 'daily',
      category: 'exploration',
      requirements: [{
        action: 'voice_command',
        target: 5,
        current: 0
      }],
      rewards: {
        points: 30
      }
    });

    // Weekly Challenges
    this.generateWeeklyChallenge('weekly_streak', {
      title: 'Consistency Champion',
      description: 'Maintain a 7-day streak',
      type: 'weekly',
      category: 'communication',
      requirements: [{
        action: 'daily_login',
        target: 7,
        current: 0
      }],
      rewards: {
        points: 200,
        badges: ['streak_master']
      }
    });

    this.generateWeeklyChallenge('weekly_perfect', {
      title: 'Perfectionist',
      description: 'Get perfect scores in 5 games',
      type: 'weekly',
      category: 'learning',
      requirements: [{
        action: 'perfect_score',
        target: 5,
        current: 0
      }],
      rewards: {
        points: 150,
        unlocks: ['golden_theme']
      }
    });

    // Special Challenges
    this.challenges.set('special_helper', {
      id: 'special_helper',
      title: 'Helpful Friend',
      description: 'Help another user by sharing a board',
      type: 'special',
      category: 'social',
      requirements: [{
        action: 'share_board',
        target: 1,
        current: 0
      }],
      rewards: {
        points: 100,
        badges: ['helper_badge']
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      claimed: false
    });
  }

  private initializeQuests(): void {
    // Main Story Quest
    this.quests.set('communication_journey', {
      id: 'communication_journey',
      name: 'The Communication Journey',
      description: 'Master the art of AAC communication',
      storyline: 'Embark on an epic journey to unlock the power of communication',
      currentChapter: 0,
      completed: false,
      chapters: [
        {
          id: 'chapter_1',
          title: 'First Words',
          narrative: 'Every journey begins with a single word...',
          objectives: [
            {
              id: 'obj_1_1',
              description: 'Create your first sentence',
              type: 'sentence',
              target: 1,
              current: 0,
              completed: false
            },
            {
              id: 'obj_1_2',
              description: 'Use 5 different tiles',
              type: 'tiles',
              target: 5,
              current: 0,
              completed: false
            }
          ],
          completed: false
        },
        {
          id: 'chapter_2',
          title: 'Finding Your Voice',
          narrative: 'Discover the many ways to express yourself...',
          objectives: [
            {
              id: 'obj_2_1',
              description: 'Try voice input',
              type: 'voice',
              target: 1,
              current: 0,
              completed: false
            },
            {
              id: 'obj_2_2',
              description: 'Create 10 unique sentences',
              type: 'unique_sentences',
              target: 10,
              current: 0,
              completed: false
            }
          ],
          completed: false
        },
        {
          id: 'chapter_3',
          title: 'Building Connections',
          narrative: 'Communication is about connecting with others...',
          objectives: [
            {
              id: 'obj_3_1',
              description: 'Share a sentence',
              type: 'share',
              target: 1,
              current: 0,
              completed: false
            },
            {
              id: 'obj_3_2',
              description: 'Create a custom board',
              type: 'custom_board',
              target: 1,
              current: 0,
              completed: false
            }
          ],
          completed: false
        }
      ],
      rewards: {
        points: 500,
        items: ['legendary_badge', 'master_communicator_title'],
        title: 'Master Communicator'
      }
    });

    // Side Quests
    this.quests.set('game_explorer', {
      id: 'game_explorer',
      name: 'Game Explorer',
      description: 'Discover all educational games',
      storyline: 'Explore the world of learning through play',
      currentChapter: 0,
      completed: false,
      chapters: [
        {
          id: 'explore_1',
          title: 'Game Discovery',
          narrative: 'Try each game type at least once',
          objectives: [
            {
              id: 'try_matching',
              description: 'Play a matching game',
              type: 'game_type',
              target: 1,
              current: 0,
              completed: false
            },
            {
              id: 'try_sequencing',
              description: 'Play a sequencing game',
              type: 'game_type',
              target: 1,
              current: 0,
              completed: false
            }
          ],
          completed: false
        }
      ],
      rewards: {
        points: 200,
        items: ['game_master_badge']
      }
    });
  }

  private initializePowerUps(): void {
    // Points Multiplier
    this.powerUps.set('double_points', {
      id: 'double_points',
      name: 'Double Points',
      description: 'Earn 2x points for 30 minutes',
      icon: '⚡',
      effect: {
        type: 'points_multiplier',
        value: 2,
        duration: 30 * 60 * 1000
      },
      quantity: 0,
      active: false
    });

    // Hint Helper
    this.powerUps.set('hint_helper', {
      id: 'hint_helper',
      name: 'Hint Helper',
      description: 'Get hints in educational games',
      icon: '💡',
      effect: {
        type: 'hint_helper',
        value: 3,
        duration: 60 * 60 * 1000
      },
      quantity: 0,
      active: false
    });

    // Time Freeze
    this.powerUps.set('time_freeze', {
      id: 'time_freeze',
      name: 'Time Freeze',
      description: 'Pause timer in timed challenges',
      icon: '⏰',
      effect: {
        type: 'time_freeze',
        value: 1
      },
      quantity: 0,
      active: false
    });

    // Streak Shield
    this.powerUps.set('streak_shield', {
      id: 'streak_shield',
      name: 'Streak Shield',
      description: 'Protect your streak for one day',
      icon: '🛡️',
      effect: {
        type: 'streak_shield',
        value: 1,
        duration: 24 * 60 * 60 * 1000
      },
      quantity: 0,
      active: false
    });

    // XP Boost
    this.powerUps.set('xp_boost', {
      id: 'xp_boost',
      name: 'XP Boost',
      description: '50% more experience for 1 hour',
      icon: '🚀',
      effect: {
        type: 'xp_boost',
        value: 1.5,
        duration: 60 * 60 * 1000
      },
      quantity: 0,
      active: false
    });
  }

  private initializeMiniGames(): void {
    // Quick Draw
    this.miniGames.set('quick_draw', {
      id: 'quick_draw',
      name: 'Quick Draw',
      description: 'Create sentences as fast as possible',
      icon: '✏️',
      unlockLevel: 3,
      highScore: 0,
      timesPlayed: 0,
      rewards: {
        completion: 20,
        perfect: 50,
        highScore: 100
      }
    });

    // Memory Match
    this.miniGames.set('memory_match', {
      id: 'memory_match',
      name: 'Memory Match',
      description: 'Match tiles from memory',
      icon: '🧠',
      unlockLevel: 5,
      highScore: 0,
      timesPlayed: 0,
      rewards: {
        completion: 25,
        perfect: 60,
        highScore: 120
      }
    });

    // Word Builder
    this.miniGames.set('word_builder', {
      id: 'word_builder',
      name: 'Word Builder',
      description: 'Build words from letter tiles',
      icon: '🔤',
      unlockLevel: 7,
      highScore: 0,
      timesPlayed: 0,
      rewards: {
        completion: 30,
        perfect: 70,
        highScore: 150
      }
    });

    // Tile Cascade
    this.miniGames.set('tile_cascade', {
      id: 'tile_cascade',
      name: 'Tile Cascade',
      description: 'Chain matching tiles for combos',
      icon: '🎯',
      unlockLevel: 10,
      highScore: 0,
      timesPlayed: 0,
      rewards: {
        completion: 40,
        perfect: 80,
        highScore: 200
      }
    });
  }

  private setupEventListeners(): void {
    // Track various game events
    window.addEventListener('gameAction', (e: any) => {
      this.onGameAction(e.detail);
    });

    window.addEventListener('sentenceCreated', (e: any) => {
      this.onSentenceCreated(e.detail);
    });

    window.addEventListener('gameCompleted', (e: any) => {
      this.onGameCompleted(e.detail);
    });

    window.addEventListener('boardShared', () => {
      this.onBoardShared();
    });

    window.addEventListener('voiceUsed', () => {
      this.onVoiceUsed();
    });
  }

  private loadProgress(): void {
    // Load saved challenges
    const savedChallenges = this.dataService.getData('gamification_challenges') || {};
    Object.entries(savedChallenges).forEach(([id, challenge]: [string, any]) => {
      if (this.challenges.has(id)) {
        const existing = this.challenges.get(id)!;
        Object.assign(existing, challenge);
      }
    });

    // Load saved quests
    const savedQuests = this.dataService.getData('gamification_quests') || {};
    Object.entries(savedQuests).forEach(([id, quest]: [string, any]) => {
      if (this.quests.has(id)) {
        const existing = this.quests.get(id)!;
        Object.assign(existing, quest);
      }
    });

    // Load power-ups
    const savedPowerUps = this.dataService.getData('gamification_powerups') || {};
    Object.entries(savedPowerUps).forEach(([id, powerUp]: [string, any]) => {
      if (this.powerUps.has(id)) {
        const existing = this.powerUps.get(id)!;
        Object.assign(existing, powerUp);
      }
    });

    // Load mini-games progress
    const savedMiniGames = this.dataService.getData('gamification_minigames') || {};
    Object.entries(savedMiniGames).forEach(([id, game]: [string, any]) => {
      if (this.miniGames.has(id)) {
        const existing = this.miniGames.get(id)!;
        Object.assign(existing, game);
      }
    });

    // Load active states
    const activeStates = this.dataService.getData('gamification_active') || {};
    this.activeChallenges = activeStates.challenges || [];
    this.activeQuest = activeStates.quest || null;
  }

  private saveProgress(): void {
    // Save challenges
    const challengesData: any = {};
    this.challenges.forEach((challenge, id) => {
      challengesData[id] = challenge;
    });
    this.dataService.setData('gamification_challenges', challengesData);

    // Save quests
    const questsData: any = {};
    this.quests.forEach((quest, id) => {
      questsData[id] = quest;
    });
    this.dataService.setData('gamification_quests', questsData);

    // Save power-ups
    const powerUpsData: any = {};
    this.powerUps.forEach((powerUp, id) => {
      powerUpsData[id] = powerUp;
    });
    this.dataService.setData('gamification_powerups', powerUpsData);

    // Save mini-games
    const miniGamesData: any = {};
    this.miniGames.forEach((game, id) => {
      miniGamesData[id] = game;
    });
    this.dataService.setData('gamification_minigames', miniGamesData);

    // Save active states
    this.dataService.setData('gamification_active', {
      challenges: this.activeChallenges,
      quest: this.activeQuest
    });
  }

  private generateDailyChallenge(id: string, template: Partial<Challenge>): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    this.challenges.set(id, {
      id,
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      completed: false,
      claimed: false,
      ...template
    } as Challenge);
  }

  private generateWeeklyChallenge(id: string, template: Partial<Challenge>): void {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);

    this.challenges.set(id, {
      id,
      startDate: today.toISOString(),
      endDate: nextWeek.toISOString(),
      completed: false,
      claimed: false,
      ...template
    } as Challenge);
  }

  private refreshDailyChallenges(): void {
    const now = new Date();
    
    // Check and refresh expired daily challenges
    this.challenges.forEach((challenge, id) => {
      if (challenge.type === 'daily' && new Date(challenge.endDate) < now) {
        // Archive old challenge
        this.archiveChallenge(challenge);
        
        // Generate new daily challenge
        if (id.startsWith('daily_')) {
          this.generateNewDailyChallenge(id);
        }
      }
    });

    // Ensure we have active daily challenges
    const dailyChallengeTypes = ['daily_sentences', 'daily_games', 'daily_voice'];
    dailyChallengeTypes.forEach(type => {
      if (!this.challenges.has(type) || new Date(this.challenges.get(type)!.endDate) < now) {
        this.generateNewDailyChallenge(type);
      }
    });
  }

  private generateNewDailyChallenge(type: string): void {
    const templates = {
      daily_sentences: [
        { target: 10, points: 50, description: 'Create 10 sentences today' },
        { target: 15, points: 75, description: 'Create 15 sentences today' },
        { target: 5, points: 30, description: 'Create 5 complex sentences' }
      ],
      daily_games: [
        { target: 3, points: 40, description: 'Complete 3 educational games' },
        { target: 5, points: 60, description: 'Complete 5 educational games' },
        { target: 2, points: 50, description: 'Get perfect scores in 2 games' }
      ],
      daily_voice: [
        { target: 5, points: 30, description: 'Use voice commands 5 times' },
        { target: 10, points: 50, description: 'Use voice commands 10 times' },
        { target: 3, points: 40, description: 'Create 3 sentences with voice' }
      ]
    };

    const templateList = templates[type as keyof typeof templates];
    if (!templateList) return;

    const template = templateList[Math.floor(Math.random() * templateList.length)];
    
    this.generateDailyChallenge(type, {
      title: type.replace('daily_', '').charAt(0).toUpperCase() + type.slice(7),
      description: template.description,
      type: 'daily',
      category: type.includes('sentences') ? 'communication' : 
                 type.includes('games') ? 'learning' : 'exploration',
      requirements: [{
        action: type.replace('daily_', ''),
        target: template.target,
        current: 0
      }],
      rewards: {
        points: template.points
      }
    });
  }

  private archiveChallenge(challenge: Challenge): void {
    const archives = this.dataService.getData('challenge_archives') || [];
    archives.push({
      ...challenge,
      archivedAt: new Date().toISOString()
    });
    
    // Keep only last 30 days of archives
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = archives.filter((a: any) => 
      new Date(a.archivedAt).getTime() > thirtyDaysAgo
    );
    
    this.dataService.setData('challenge_archives', filtered);
  }

  private updateLeaderboards(): void {
    // Update daily leaderboard
    this.updateLeaderboard('daily_points', {
      name: 'Daily Points',
      type: 'daily',
      category: 'points'
    });

    // Update weekly leaderboard
    this.updateLeaderboard('weekly_points', {
      name: 'Weekly Points',
      type: 'weekly',
      category: 'points'
    });

    // Update streak leaderboard
    this.updateLeaderboard('streak_leaders', {
      name: 'Streak Leaders',
      type: 'all-time',
      category: 'streak'
    });

    // Update achievement leaderboard
    this.updateLeaderboard('achievement_masters', {
      name: 'Achievement Masters',
      type: 'all-time',
      category: 'achievements'
    });
  }

  private updateLeaderboard(id: string, config: Partial<Leaderboard>): void {
    // In a real app, this would fetch from a server
    // For now, generate mock data
    const mockEntries: LeaderboardEntry[] = [
      {
        rank: 1,
        userId: 'user1',
        username: 'Champion123',
        avatar: '🏆',
        score: 2500,
        badge: 'gold',
        isCurrentUser: false
      },
      {
        rank: 2,
        userId: 'user2',
        username: 'StarPlayer',
        avatar: '⭐',
        score: 2100,
        badge: 'silver',
        isCurrentUser: false
      },
      {
        rank: 3,
        userId: 'current',
        username: 'You',
        avatar: '😊',
        score: 1800,
        badge: 'bronze',
        isCurrentUser: true
      }
    ];

    this.leaderboards.set(id, {
      id,
      entries: mockEntries,
      userRank: 3,
      lastUpdated: new Date().toISOString(),
      ...config
    } as Leaderboard);
  }

  private checkExpiredPowerUps(): void {
    const now = Date.now();
    
    this.powerUps.forEach(powerUp => {
      if (powerUp.active && powerUp.expiresAt && powerUp.expiresAt < now) {
        this.deactivatePowerUp(powerUp.id);
      }
    });
  }

  // Event handlers
  private onGameAction(detail: any): void {
    // Update combo system
    const now = Date.now();
    if (now - this.lastActionTime < 5000) {
      this.combos.count++;
      this.combos.multiplier = Math.min(1 + (this.combos.count * 0.1), 3);
      this.uiEffectsService.showCombo(this.combos.count);
    } else {
      this.combos.count = 1;
      this.combos.multiplier = 1;
    }
    this.lastActionTime = now;

    // Award combo points
    if (this.combos.count > 5) {
      const comboPoints = Math.floor(10 * this.combos.multiplier);
      this.rewardsService.awardPoints(comboPoints, `${this.combos.count}x Combo!`);
    }
  }

  private onSentenceCreated(detail: any): void {
    // Update daily sentence challenge
    this.updateChallengeProgress('daily_sentences', 'create_sentence', 1);
    
    // Update quest progress
    if (this.activeQuest) {
      this.updateQuestProgress(this.activeQuest, 'sentence', 1);
      this.updateQuestProgress(this.activeQuest, 'unique_sentences', 1);
    }

    // Track for analytics
    this.analyticsService.trackEvent('gamification_sentence', {
      wordCount: detail.wordCount,
      combo: this.combos.count
    });
  }

  private onGameCompleted(detail: any): void {
    // Update game challenges
    this.updateChallengeProgress('daily_games', 'complete_game', 1);
    
    if (detail.score === 100) {
      this.updateChallengeProgress('weekly_perfect', 'perfect_score', 1);
    }

    // Update mini-game stats
    if (this.miniGames.has(detail.gameId)) {
      const game = this.miniGames.get(detail.gameId)!;
      game.timesPlayed++;
      
      if (detail.score > game.highScore) {
        game.highScore = detail.score;
        this.rewardsService.awardPoints(
          game.rewards.highScore,
          `New high score in ${game.name}!`
        );
      }
      
      if (detail.score === 100) {
        this.rewardsService.awardPoints(
          game.rewards.perfect,
          `Perfect score in ${game.name}!`
        );
      } else {
        this.rewardsService.awardPoints(
          game.rewards.completion,
          `Completed ${game.name}`
        );
      }
    }

    // Update quest progress
    if (this.activeQuest) {
      this.updateQuestProgress(this.activeQuest, 'game_type', 1);
    }
  }

  private onBoardShared(): void {
    this.updateChallengeProgress('special_helper', 'share_board', 1);
    
    if (this.activeQuest) {
      this.updateQuestProgress(this.activeQuest, 'share', 1);
    }
  }

  private onVoiceUsed(): void {
    this.updateChallengeProgress('daily_voice', 'voice_command', 1);
    
    if (this.activeQuest) {
      this.updateQuestProgress(this.activeQuest, 'voice', 1);
    }
  }

  // Challenge management
  private updateChallengeProgress(challengeId: string, action: string, amount: number): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.completed) return;

    challenge.requirements.forEach(req => {
      if (req.action === action) {
        req.current = Math.min(req.current + amount, req.target);
        
        // Check if requirement met
        if (req.current >= req.target) {
          // Check if all requirements met
          const allMet = challenge.requirements.every(r => r.current >= r.target);
          if (allMet) {
            this.completeChallenge(challenge);
          }
        }
      }
    });

    this.saveProgress();
  }

  private completeChallenge(challenge: Challenge): void {
    challenge.completed = true;
    
    // Show completion notification
    this.uiEffectsService.showNotification(
      'Challenge Complete!',
      `${challenge.title} - Claim your rewards!`,
      'success'
    );
    
    // Play celebration
    this.hapticService.vibrate('achievement');
    
    // Track analytics
    this.analyticsService.trackEvent('challenge_completed', {
      challengeId: challenge.id,
      type: challenge.type,
      category: challenge.category
    });
  }

  claimChallengeRewards(challengeId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) return false;
    
    challenge.claimed = true;
    
    // Award points
    this.rewardsService.awardPoints(
      challenge.rewards.points,
      `Challenge: ${challenge.title}`
    );
    
    // Award badges
    challenge.rewards.badges?.forEach(badge => {
      // Add badge to user's collection
      this.dataService.setData(`badge_${badge}`, true);
    });
    
    // Unlock features
    challenge.rewards.unlocks?.forEach(unlock => {
      this.dataService.setData(`unlock_${unlock}`, true);
    });
    
    this.saveProgress();
    return true;
  }

  // Quest management
  private updateQuestProgress(questId: string, objectiveType: string, amount: number): void {
    const quest = this.quests.get(questId);
    if (!quest || quest.completed) return;
    
    const chapter = quest.chapters[quest.currentChapter];
    if (!chapter) return;
    
    let chapterCompleted = false;
    
    chapter.objectives.forEach(objective => {
      if (objective.type === objectiveType && !objective.completed) {
        objective.current = Math.min(objective.current + amount, objective.target);
        
        if (objective.current >= objective.target) {
          objective.completed = true;
          
          // Check if chapter completed
          if (chapter.objectives.every(obj => obj.completed)) {
            chapterCompleted = true;
          }
        }
      }
    });
    
    if (chapterCompleted) {
      this.completeQuestChapter(quest, chapter);
    }
    
    this.saveProgress();
  }

  private completeQuestChapter(quest: Quest, chapter: QuestChapter): void {
    chapter.completed = true;
    
    // Show chapter completion
    this.uiEffectsService.showNotification(
      'Chapter Complete!',
      `${quest.name}: ${chapter.title}`,
      'success'
    );
    
    // Move to next chapter
    quest.currentChapter++;
    
    if (quest.currentChapter >= quest.chapters.length) {
      this.completeQuest(quest);
    } else {
      // Show next chapter
      const nextChapter = quest.chapters[quest.currentChapter];
      this.showQuestNarrative(nextChapter.narrative);
    }
  }

  private completeQuest(quest: Quest): void {
    quest.completed = true;
    
    // Award quest rewards
    this.rewardsService.awardPoints(
      quest.rewards.points,
      `Quest Complete: ${quest.name}`
    );
    
    // Award items
    quest.rewards.items.forEach(item => {
      this.dataService.setData(`quest_item_${item}`, true);
    });
    
    // Award title
    if (quest.rewards.title) {
      this.dataService.setData('user_title', quest.rewards.title);
    }
    
    // Epic celebration
    this.uiEffectsService.playAnimation('questComplete');
    
    this.analyticsService.trackEvent('quest_completed', {
      questId: quest.id,
      duration: Date.now() - new Date(quest.chapters[0].narrative).getTime()
    });
  }

  private showQuestNarrative(narrative: string): void {
    // Show narrative overlay
    const overlay = document.createElement('div');
    overlay.className = 'quest-narrative-overlay';
    overlay.innerHTML = `
      <div class="quest-narrative">
        <p>${narrative}</p>
        <button onclick="this.parentElement.parentElement.remove()">Continue</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Power-up management
  activatePowerUp(powerUpId: string): boolean {
    const powerUp = this.powerUps.get(powerUpId);
    if (!powerUp || powerUp.quantity <= 0 || powerUp.active) return false;
    
    powerUp.quantity--;
    powerUp.active = true;
    
    if (powerUp.effect.duration) {
      powerUp.expiresAt = Date.now() + powerUp.effect.duration;
    }
    
    // Apply power-up effect
    this.applyPowerUpEffect(powerUp);
    
    // Show activation notification
    this.uiEffectsService.showNotification(
      'Power-Up Activated!',
      powerUp.name,
      'info'
    );
    
    this.saveProgress();
    return true;
  }

  private applyPowerUpEffect(powerUp: PowerUp): void {
    switch (powerUp.effect.type) {
      case 'points_multiplier':
        this.rewardsService.activateBoost(
          powerUp.id,
          powerUp.effect.value,
          (powerUp.effect.duration || 0) / 60000
        );
        break;
        
      case 'hint_helper':
        window.dispatchEvent(new CustomEvent('hintsEnabled', {
          detail: { hints: powerUp.effect.value }
        }));
        break;
        
      case 'time_freeze':
        window.dispatchEvent(new CustomEvent('timeFreezeActivated'));
        break;
        
      case 'streak_shield':
        this.dataService.setData('streak_shield_active', true);
        this.dataService.setData('streak_shield_expires', powerUp.expiresAt);
        break;
        
      case 'xp_boost':
        this.rewardsService.activateBoost(
          powerUp.id,
          powerUp.effect.value,
          (powerUp.effect.duration || 0) / 60000
        );
        break;
    }
  }

  private deactivatePowerUp(powerUpId: string): void {
    const powerUp = this.powerUps.get(powerUpId);
    if (!powerUp) return;
    
    powerUp.active = false;
    powerUp.expiresAt = undefined;
    
    // Remove power-up effect
    switch (powerUp.effect.type) {
      case 'hint_helper':
        window.dispatchEvent(new CustomEvent('hintsDisabled'));
        break;
        
      case 'streak_shield':
        this.dataService.setData('streak_shield_active', false);
        break;
    }
    
    this.saveProgress();
  }

  grantPowerUp(powerUpId: string, quantity: number = 1): void {
    const powerUp = this.powerUps.get(powerUpId);
    if (!powerUp) return;
    
    powerUp.quantity += quantity;
    
    this.uiEffectsService.showNotification(
      'Power-Up Received!',
      `+${quantity} ${powerUp.name}`,
      'success'
    );
    
    this.saveProgress();
  }

  // Public API
  getActiveChallenges(): Challenge[] {
    const now = new Date();
    return Array.from(this.challenges.values())
      .filter(challenge => 
        new Date(challenge.endDate) > now && 
        !challenge.claimed
      );
  }

  getCompletedChallenges(): Challenge[] {
    return Array.from(this.challenges.values())
      .filter(challenge => challenge.completed && !challenge.claimed);
  }

  getActiveQuest(): Quest | null {
    return this.activeQuest ? this.quests.get(this.activeQuest) || null : null;
  }

  getAvailableQuests(): Quest[] {
    return Array.from(this.quests.values())
      .filter(quest => !quest.completed && quest.id !== this.activeQuest);
  }

  startQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.completed || this.activeQuest) return false;
    
    this.activeQuest = questId;
    
    // Show quest introduction
    this.showQuestNarrative(quest.storyline);
    
    // Show first chapter narrative
    setTimeout(() => {
      this.showQuestNarrative(quest.chapters[0].narrative);
    }, 3000);
    
    this.saveProgress();
    return true;
  }

  getLeaderboard(leaderboardId: string): Leaderboard | null {
    return this.leaderboards.get(leaderboardId) || null;
  }

  getAllLeaderboards(): Leaderboard[] {
    return Array.from(this.leaderboards.values());
  }

  getPowerUps(): PowerUp[] {
    return Array.from(this.powerUps.values());
  }

  getActivePowerUps(): PowerUp[] {
    return Array.from(this.powerUps.values()).filter(pu => pu.active);
  }

  getMiniGames(): MiniGame[] {
    const userLevel = this.rewardsService.getCurrentLevel();
    return Array.from(this.miniGames.values())
      .filter(game => game.unlockLevel <= userLevel);
  }

  getComboMultiplier(): number {
    return this.combos.multiplier;
  }

  getComboCount(): number {
    return this.combos.count;
  }
}

export function getGamificationService(): GamificationService {
  return GamificationService.getInstance();
}