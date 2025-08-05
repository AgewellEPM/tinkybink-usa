// Rewards System Service - Module 24
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getSpeechService } from '../core/speech-service';
import { getUIEffectsService } from '../ui/ui-effects-service';
import { getHapticService } from '../ui/haptic-service';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'communication' | 'learning' | 'practice' | 'milestone' | 'special';
  points: number;
  criteria: {
    type: string;
    value: number;
    comparison: 'equals' | 'greater' | 'less';
  };
  unlockedAt?: number;
  progress?: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'theme' | 'animation' | 'sound' | 'avatar' | 'title';
  value: string;
  pointsCost: number;
  unlocked: boolean;
  equipped?: boolean;
}

interface UserProgress {
  totalPoints: number;
  level: number;
  experienceInLevel: number;
  experienceToNextLevel: number;
  achievements: string[];
  rewards: string[];
  streakDays: number;
  lastActivityDate: string;
  statistics: {
    totalSentences: number;
    totalWords: number;
    gamesPlayed: number;
    sessionsCompleted: number;
    tilesUsed: number;
    voiceCommands: number;
  };
}

export class RewardsSystemService {
  private static instance: RewardsSystemService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private speechService = getSpeechService();
  private uiEffectsService = getUIEffectsService();
  private hapticService = getHapticService();
  
  private userProgress: UserProgress = {
    totalPoints: 0,
    level: 1,
    experienceInLevel: 0,
    experienceToNextLevel: 100,
    achievements: [],
    rewards: [],
    streakDays: 0,
    lastActivityDate: new Date().toISOString(),
    statistics: {
      totalSentences: 0,
      totalWords: 0,
      gamesPlayed: 0,
      sessionsCompleted: 0,
      tilesUsed: 0,
      voiceCommands: 0
    }
  };

  private achievements: Map<string, Achievement> = new Map();
  private rewards: Map<string, Reward> = new Map();
  private pointsMultiplier: number = 1;
  private activeBoosts: Map<string, { multiplier: number; expiresAt: number }> = new Map();

  private constructor() {
    this.initializeAchievements();
    this.initializeRewards();
  }

  static getInstance(): RewardsSystemService {
    if (!RewardsSystemService.instance) {
      RewardsSystemService.instance = new RewardsSystemService();
    }
    return RewardsSystemService.instance;
  }

  initialize(): void {
    console.log('RewardsSystemService initializing...');
    this.loadProgress();
    this.checkDailyStreak();
    this.setupEventListeners();
    console.log('RewardsSystemService initialized');
  }

  private initializeAchievements(): void {
    // Communication achievements
    this.achievements.set('first_sentence', {
      id: 'first_sentence',
      name: 'First Words',
      description: 'Create your first sentence',
      icon: '🗣️',
      category: 'communication',
      points: 10,
      criteria: { type: 'sentences', value: 1, comparison: 'equals' }
    });

    this.achievements.set('word_master_10', {
      id: 'word_master_10',
      name: 'Word Explorer',
      description: 'Use 10 different words',
      icon: '📚',
      category: 'communication',
      points: 25,
      criteria: { type: 'unique_words', value: 10, comparison: 'greater' }
    });

    this.achievements.set('sentence_builder_50', {
      id: 'sentence_builder_50',
      name: 'Sentence Builder',
      description: 'Create 50 sentences',
      icon: '🏗️',
      category: 'communication',
      points: 50,
      criteria: { type: 'sentences', value: 50, comparison: 'greater' }
    });

    // Learning achievements
    this.achievements.set('game_player_5', {
      id: 'game_player_5',
      name: 'Game Enthusiast',
      description: 'Play 5 educational games',
      icon: '🎮',
      category: 'learning',
      points: 20,
      criteria: { type: 'games', value: 5, comparison: 'greater' }
    });

    this.achievements.set('perfect_score', {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get 100% in any game',
      icon: '💯',
      category: 'learning',
      points: 30,
      criteria: { type: 'perfect_game', value: 1, comparison: 'equals' }
    });

    // Practice achievements
    this.achievements.set('daily_practice', {
      id: 'daily_practice',
      name: 'Daily Practice',
      description: 'Practice every day for a week',
      icon: '📅',
      category: 'practice',
      points: 40,
      criteria: { type: 'streak', value: 7, comparison: 'greater' }
    });

    this.achievements.set('voice_commander', {
      id: 'voice_commander',
      name: 'Voice Commander',
      description: 'Use voice commands 20 times',
      icon: '🎤',
      category: 'practice',
      points: 35,
      criteria: { type: 'voice_commands', value: 20, comparison: 'greater' }
    });

    // Milestone achievements
    this.achievements.set('level_5', {
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reach level 5',
      icon: '⭐',
      category: 'milestone',
      points: 100,
      criteria: { type: 'level', value: 5, comparison: 'greater' }
    });

    this.achievements.set('point_collector_500', {
      id: 'point_collector_500',
      name: 'Point Collector',
      description: 'Earn 500 total points',
      icon: '💎',
      category: 'milestone',
      points: 75,
      criteria: { type: 'points', value: 500, comparison: 'greater' }
    });

    // Special achievements
    this.achievements.set('night_owl', {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Use the app after midnight',
      icon: '🦉',
      category: 'special',
      points: 15,
      criteria: { type: 'time_based', value: 0, comparison: 'equals' }
    });

    this.achievements.set('weekend_warrior', {
      id: 'weekend_warrior',
      name: 'Weekend Warrior',
      description: 'Practice on both Saturday and Sunday',
      icon: '⚔️',
      category: 'special',
      points: 25,
      criteria: { type: 'weekend_practice', value: 2, comparison: 'equals' }
    });
  }

  private initializeRewards(): void {
    // Badges
    this.rewards.set('bronze_badge', {
      id: 'bronze_badge',
      name: 'Bronze Badge',
      description: 'A shiny bronze badge for your profile',
      type: 'badge',
      value: 'bronze',
      pointsCost: 50,
      unlocked: false
    });

    this.rewards.set('silver_badge', {
      id: 'silver_badge',
      name: 'Silver Badge',
      description: 'A prestigious silver badge',
      type: 'badge',
      value: 'silver',
      pointsCost: 150,
      unlocked: false
    });

    this.rewards.set('gold_badge', {
      id: 'gold_badge',
      name: 'Gold Badge',
      description: 'The ultimate gold badge',
      type: 'badge',
      value: 'gold',
      pointsCost: 300,
      unlocked: false
    });

    // Themes
    this.rewards.set('ocean_theme', {
      id: 'ocean_theme',
      name: 'Ocean Theme',
      description: 'A calming ocean-inspired theme',
      type: 'theme',
      value: 'ocean',
      pointsCost: 100,
      unlocked: false
    });

    this.rewards.set('space_theme', {
      id: 'space_theme',
      name: 'Space Theme',
      description: 'An out-of-this-world space theme',
      type: 'theme',
      value: 'space',
      pointsCost: 150,
      unlocked: false
    });

    // Animations
    this.rewards.set('sparkle_animation', {
      id: 'sparkle_animation',
      name: 'Sparkle Effect',
      description: 'Add sparkles to your tile selections',
      type: 'animation',
      value: 'sparkle',
      pointsCost: 75,
      unlocked: false
    });

    this.rewards.set('rainbow_animation', {
      id: 'rainbow_animation',
      name: 'Rainbow Effect',
      description: 'Rainbow effects for achievements',
      type: 'animation',
      value: 'rainbow',
      pointsCost: 125,
      unlocked: false
    });

    // Sounds
    this.rewards.set('chime_sound', {
      id: 'chime_sound',
      name: 'Chime Sounds',
      description: 'Pleasant chime sound effects',
      type: 'sound',
      value: 'chime',
      pointsCost: 40,
      unlocked: false
    });

    this.rewards.set('nature_sound', {
      id: 'nature_sound',
      name: 'Nature Sounds',
      description: 'Relaxing nature sound effects',
      type: 'sound',
      value: 'nature',
      pointsCost: 60,
      unlocked: false
    });

    // Avatars
    this.rewards.set('robot_avatar', {
      id: 'robot_avatar',
      name: 'Robot Avatar',
      description: 'A friendly robot companion',
      type: 'avatar',
      value: 'robot',
      pointsCost: 80,
      unlocked: false
    });

    this.rewards.set('animal_avatar', {
      id: 'animal_avatar',
      name: 'Animal Avatar',
      description: 'Choose from various animal friends',
      type: 'avatar',
      value: 'animal',
      pointsCost: 100,
      unlocked: false
    });

    // Titles
    this.rewards.set('communicator_title', {
      id: 'communicator_title',
      name: 'Super Communicator',
      description: 'Display "Super Communicator" title',
      type: 'title',
      value: 'Super Communicator',
      pointsCost: 200,
      unlocked: false
    });

    this.rewards.set('champion_title', {
      id: 'champion_title',
      name: 'AAC Champion',
      description: 'Display "AAC Champion" title',
      type: 'title',
      value: 'AAC Champion',
      pointsCost: 500,
      unlocked: false
    });
  }

  private setupEventListeners(): void {
    // Listen for various user actions
    window.addEventListener('sentenceCompleted', (e: any) => {
      this.onSentenceCompleted(e.detail);
    });

    window.addEventListener('gameCompleted', (e: any) => {
      this.onGameCompleted(e.detail);
    });

    window.addEventListener('tileUsed', () => {
      this.onTileUsed();
    });

    window.addEventListener('voiceCommandUsed', () => {
      this.onVoiceCommandUsed();
    });
  }

  private loadProgress(): void {
    const saved = this.dataService.getData('rewards_progress');
    if (saved) {
      this.userProgress = saved;
      
      // Load unlocked achievements
      saved.achievements?.forEach((achievementId: string) => {
        const achievement = this.achievements.get(achievementId);
        if (achievement) {
          achievement.unlockedAt = Date.now();
        }
      });

      // Load unlocked rewards
      saved.rewards?.forEach((rewardId: string) => {
        const reward = this.rewards.get(rewardId);
        if (reward) {
          reward.unlocked = true;
        }
      });
    }
  }

  private saveProgress(): void {
    this.dataService.setData('rewards_progress', this.userProgress);
  }

  private checkDailyStreak(): void {
    const today = new Date().toDateString();
    const lastActivity = new Date(this.userProgress.lastActivityDate);
    const lastActivityDate = lastActivity.toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActivityDate === today) {
      // Already active today
      return;
    } else if (lastActivityDate === yesterday.toDateString()) {
      // Continuing streak
      this.userProgress.streakDays++;
      this.awardPoints(10, 'Daily streak bonus');
    } else {
      // Streak broken
      this.userProgress.streakDays = 1;
    }
    
    this.userProgress.lastActivityDate = new Date().toISOString();
    this.saveProgress();
  }

  awardPoints(points: number, reason: string): void {
    const multipliedPoints = Math.floor(points * this.getActiveMultiplier());
    this.userProgress.totalPoints += multipliedPoints;
    
    // Check for level up
    this.userProgress.experienceInLevel += multipliedPoints;
    while (this.userProgress.experienceInLevel >= this.userProgress.experienceToNextLevel) {
      this.levelUp();
    }
    
    // Show point animation
    this.uiEffectsService.showFloatingPoints(multipliedPoints, reason);
    
    // Track analytics
    this.analyticsService.trackEvent('points_awarded', {
      points: multipliedPoints,
      reason,
      level: this.userProgress.level,
      totalPoints: this.userProgress.totalPoints
    });
    
    this.checkAchievements();
    this.saveProgress();
  }

  private levelUp(): void {
    this.userProgress.level++;
    this.userProgress.experienceInLevel -= this.userProgress.experienceToNextLevel;
    this.userProgress.experienceToNextLevel = this.calculateNextLevelExperience();
    
    // Celebration effects
    this.uiEffectsService.playAnimation('levelUp');
    this.hapticService.vibrate('success');
    this.speechService.speak(`Congratulations! You've reached level ${this.userProgress.level}!`);
    
    // Award level up bonus
    const bonusPoints = this.userProgress.level * 50;
    this.userProgress.totalPoints += bonusPoints;
    
    // Show level up notification
    this.showLevelUpNotification();
    
    // Check level-based achievements
    this.checkAchievements();
  }

  private calculateNextLevelExperience(): number {
    // Exponential growth formula
    return Math.floor(100 * Math.pow(1.5, this.userProgress.level - 1));
  }

  private getActiveMultiplier(): number {
    let multiplier = this.pointsMultiplier;
    
    // Apply active boosts
    const now = Date.now();
    this.activeBoosts.forEach((boost, id) => {
      if (boost.expiresAt > now) {
        multiplier *= boost.multiplier;
      } else {
        this.activeBoosts.delete(id);
      }
    });
    
    // Weekend bonus
    const day = new Date().getDay();
    if (day === 0 || day === 6) {
      multiplier *= 1.5;
    }
    
    // Streak bonus
    if (this.userProgress.streakDays > 7) {
      multiplier *= 1.2;
    }
    
    return multiplier;
  }

  activateBoost(boostId: string, multiplier: number, durationMinutes: number): void {
    const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
    this.activeBoosts.set(boostId, { multiplier, expiresAt });
    
    this.uiEffectsService.showNotification(
      `${multiplier}x Points Boost Activated!`,
      `Active for ${durationMinutes} minutes`,
      'success'
    );
  }

  private checkAchievements(): void {
    this.achievements.forEach((achievement, id) => {
      if (!this.userProgress.achievements.includes(id)) {
        if (this.checkAchievementCriteria(achievement)) {
          this.unlockAchievement(achievement);
        }
      }
    });
  }

  private checkAchievementCriteria(achievement: Achievement): boolean {
    const { type, value, comparison } = achievement.criteria;
    let currentValue = 0;
    
    switch (type) {
      case 'sentences':
        currentValue = this.userProgress.statistics.totalSentences;
        break;
      case 'unique_words':
        currentValue = this.getUniqueWordCount();
        break;
      case 'games':
        currentValue = this.userProgress.statistics.gamesPlayed;
        break;
      case 'streak':
        currentValue = this.userProgress.streakDays;
        break;
      case 'voice_commands':
        currentValue = this.userProgress.statistics.voiceCommands;
        break;
      case 'level':
        currentValue = this.userProgress.level;
        break;
      case 'points':
        currentValue = this.userProgress.totalPoints;
        break;
      case 'time_based':
        const hour = new Date().getHours();
        return hour >= 0 && hour < 6;
      case 'weekend_practice':
        return this.checkWeekendPractice();
      case 'perfect_game':
        return this.checkPerfectGame();
    }
    
    switch (comparison) {
      case 'equals':
        return currentValue === value;
      case 'greater':
        return currentValue >= value;
      case 'less':
        return currentValue <= value;
      default:
        return false;
    }
  }

  private unlockAchievement(achievement: Achievement): void {
    achievement.unlockedAt = Date.now();
    this.userProgress.achievements.push(achievement.id);
    
    // Award achievement points
    this.awardPoints(achievement.points, `Achievement: ${achievement.name}`);
    
    // Show achievement notification
    this.showAchievementUnlocked(achievement);
    
    // Play celebration effects
    this.uiEffectsService.playAnimation('achievement');
    this.hapticService.vibrate('achievement');
    this.speechService.speak(`Achievement unlocked: ${achievement.name}!`);
    
    // Track analytics
    this.analyticsService.trackEvent('achievement_unlocked', {
      achievementId: achievement.id,
      category: achievement.category,
      points: achievement.points
    });
    
    this.saveProgress();
  }

  purchaseReward(rewardId: string): boolean {
    const reward = this.rewards.get(rewardId);
    if (!reward) return false;
    
    if (reward.unlocked) {
      this.equipReward(rewardId);
      return true;
    }
    
    if (this.userProgress.totalPoints >= reward.pointsCost) {
      this.userProgress.totalPoints -= reward.pointsCost;
      reward.unlocked = true;
      this.userProgress.rewards.push(rewardId);
      
      // Auto-equip the new reward
      this.equipReward(rewardId);
      
      // Show purchase notification
      this.uiEffectsService.showNotification(
        'Reward Purchased!',
        `You've unlocked ${reward.name}`,
        'success'
      );
      
      // Play purchase effects
      this.hapticService.vibrate('purchase');
      
      this.saveProgress();
      return true;
    }
    
    return false;
  }

  equipReward(rewardId: string): void {
    const reward = this.rewards.get(rewardId);
    if (!reward || !reward.unlocked) return;
    
    // Unequip other rewards of the same type
    this.rewards.forEach(r => {
      if (r.type === reward.type && r.equipped) {
        r.equipped = false;
      }
    });
    
    reward.equipped = true;
    
    // Apply reward effects
    this.applyRewardEffect(reward);
    
    this.saveProgress();
  }

  private applyRewardEffect(reward: Reward): void {
    switch (reward.type) {
      case 'theme':
        this.applyTheme(reward.value);
        break;
      case 'animation':
        this.uiEffectsService.setAnimationStyle(reward.value);
        break;
      case 'sound':
        this.setSoundPack(reward.value);
        break;
      case 'avatar':
        this.setAvatar(reward.value);
        break;
      case 'title':
        this.setUserTitle(reward.value);
        break;
      case 'badge':
        this.setBadge(reward.value);
        break;
    }
  }

  private onSentenceCompleted(detail: any): void {
    this.userProgress.statistics.totalSentences++;
    this.userProgress.statistics.totalWords += detail.wordCount || 1;
    
    // Award points based on sentence complexity
    const points = Math.min(detail.wordCount * 5, 50);
    this.awardPoints(points, 'Sentence completed');
    
    this.checkAchievements();
  }

  private onGameCompleted(detail: any): void {
    this.userProgress.statistics.gamesPlayed++;
    
    // Award points based on game performance
    const basePoints = 20;
    const scoreMultiplier = detail.score / 100;
    const points = Math.floor(basePoints * scoreMultiplier);
    this.awardPoints(points, `Game completed: ${detail.gameName}`);
    
    // Check for perfect score
    if (detail.score === 100) {
      this.analyticsService.trackEvent('perfect_game_score', {
        game: detail.gameName
      });
    }
    
    this.checkAchievements();
  }

  private onTileUsed(): void {
    this.userProgress.statistics.tilesUsed++;
    
    // Award point every 10 tiles
    if (this.userProgress.statistics.tilesUsed % 10 === 0) {
      this.awardPoints(5, 'Tile milestone');
    }
  }

  private onVoiceCommandUsed(): void {
    this.userProgress.statistics.voiceCommands++;
    
    // Award points for voice usage
    if (this.userProgress.statistics.voiceCommands % 5 === 0) {
      this.awardPoints(10, 'Voice command milestone');
    }
    
    this.checkAchievements();
  }

  // UI Helper methods
  private showAchievementUnlocked(achievement: Achievement): void {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <h3>Achievement Unlocked!</h3>
        <p>${achievement.name}</p>
        <small>+${achievement.points} points</small>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  private showLevelUpNotification(): void {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
      <div class="level-up-content">
        <h2>LEVEL UP!</h2>
        <div class="level-number">${this.userProgress.level}</div>
        <p>+${this.userProgress.level * 50} bonus points</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Helper methods for criteria checking
  private getUniqueWordCount(): number {
    const wordHistory = this.dataService.getData('word_history') || [];
    return new Set(wordHistory).size;
  }

  private checkWeekendPractice(): boolean {
    // Check if user has practiced on both weekend days
    const weekendActivity = this.dataService.getData('weekend_activity') || {};
    const today = new Date();
    const day = today.getDay();
    
    if (day === 0 || day === 6) {
      weekendActivity[today.toDateString()] = true;
      this.dataService.setData('weekend_activity', weekendActivity);
    }
    
    // Check if both Saturday and Sunday of current week have activity
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - today.getDay() + 6);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    
    return weekendActivity[saturday.toDateString()] && weekendActivity[sunday.toDateString()];
  }

  private checkPerfectGame(): boolean {
    const gameHistory = this.dataService.getData('game_history') || [];
    return gameHistory.some((game: any) => game.score === 100);
  }

  // Theme and customization methods
  private applyTheme(themeName: string): void {
    document.body.setAttribute('data-theme', themeName);
    this.dataService.setData('active_theme', themeName);
  }

  private setSoundPack(soundPack: string): void {
    this.dataService.setData('sound_pack', soundPack);
    // Update sound service configuration
  }

  private setAvatar(avatar: string): void {
    this.dataService.setData('user_avatar', avatar);
    // Update UI to show new avatar
  }

  private setUserTitle(title: string): void {
    this.dataService.setData('user_title', title);
    // Update UI to show title
  }

  private setBadge(badge: string): void {
    this.dataService.setData('user_badge', badge);
    // Update UI to show badge
  }

  // Public API
  getUserProgress(): UserProgress {
    return { ...this.userProgress };
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getRewards(): Reward[] {
    return Array.from(this.rewards.values());
  }

  getUnlockedAchievements(): Achievement[] {
    return this.userProgress.achievements
      .map(id => this.achievements.get(id))
      .filter(Boolean) as Achievement[];
  }

  getAvailableRewards(): Reward[] {
    return Array.from(this.rewards.values())
      .filter(reward => !reward.unlocked && this.userProgress.totalPoints >= reward.pointsCost);
  }

  getEquippedRewards(): Reward[] {
    return Array.from(this.rewards.values())
      .filter(reward => reward.equipped);
  }

  getStreakDays(): number {
    return this.userProgress.streakDays;
  }

  getCurrentLevel(): number {
    return this.userProgress.level;
  }

  getProgressToNextLevel(): number {
    return this.userProgress.experienceInLevel / this.userProgress.experienceToNextLevel;
  }

  getTotalPoints(): number {
    return this.userProgress.totalPoints;
  }
}

export function getRewardsSystemService(): RewardsSystemService {
  return RewardsSystemService.getInstance();
}