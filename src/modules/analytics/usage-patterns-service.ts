// Usage Patterns Service - Module 52
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getPredictiveAnalyticsService } from './predictive-analytics-service';

interface UsageSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  activities: SessionActivity[];
  wordCount: number;
  sentenceCount: number;
  tilesUsed: number;
  categories: string[];
  interruptions: number;
  mood?: 'positive' | 'neutral' | 'negative';
}

interface SessionActivity {
  type: 'tile_press' | 'sentence_speak' | 'game_play' | 'settings_change' | 'board_switch';
  timestamp: Date;
  details: Record<string, unknown>;
  duration?: number;
}

interface UsagePattern {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'behavioral' | 'seasonal' | 'contextual';
  description: string;
  frequency: number;
  confidence: number;
  timeRanges?: Array<{ start: number; end: number }>;
  triggers?: string[];
  outcomes?: string[];
}

interface UserHabit {
  habit: string;
  frequency: 'daily' | 'weekly' | 'occasional';
  consistency: number; // 0-1
  timePreference?: string;
  relatedActivities: string[];
  strengthTrend: 'increasing' | 'stable' | 'decreasing';
}

interface PeakUsageTime {
  hour: number;
  dayOfWeek?: number;
  avgDuration: number;
  avgProductivity: number;
  commonActivities: string[];
}

interface CommunicationFlow {
  sequence: string[];
  frequency: number;
  avgCompletionTime: number;
  successRate: number;
  context: string;
}

export class UsagePatternsService {
  private static instance: UsagePatternsService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private predictiveAnalyticsService = getPredictiveAnalyticsService();
  
  private sessions: Map<string, UsageSession> = new Map();
  private currentSession: UsageSession | null = null;
  private patterns: Map<string, UsagePattern> = new Map();
  private habits: Map<string, UserHabit> = new Map();
  private communicationFlows: Map<string, CommunicationFlow> = new Map();
  
  private sessionTimeout: number = 5 * 60 * 1000; // 5 minutes of inactivity
  private lastActivityTime: number = Date.now();
  private sessionTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializePatterns();
  }

  static getInstance(): UsagePatternsService {
    if (!UsagePatternsService.instance) {
      UsagePatternsService.instance = new UsagePatternsService();
    }
    return UsagePatternsService.instance;
  }

  initialize(): void {
    console.log('UsagePatternsService initializing...');
    this.loadHistoricalSessions();
    this.analyzeHistoricalPatterns();
    this.setupEventTracking();
    this.startSessionManagement();
    console.log('UsagePatternsService initialized');
  }

  private initializePatterns(): void {
    // Common usage patterns to detect
    this.patterns.set('morning-routine', {
      id: 'morning-routine',
      name: 'Morning Routine',
      type: 'daily',
      description: 'Regular morning communication activities',
      frequency: 0,
      confidence: 0,
      timeRanges: [{ start: 6, end: 10 }]
    });

    this.patterns.set('bedtime-routine', {
      id: 'bedtime-routine',
      name: 'Bedtime Routine',
      type: 'daily',
      description: 'Evening communication patterns',
      frequency: 0,
      confidence: 0,
      timeRanges: [{ start: 19, end: 22 }]
    });

    this.patterns.set('weekend-usage', {
      id: 'weekend-usage',
      name: 'Weekend Usage',
      type: 'weekly',
      description: 'Different usage patterns on weekends',
      frequency: 0,
      confidence: 0
    });

    this.patterns.set('frustration-pattern', {
      id: 'frustration-pattern',
      name: 'Frustration Indicator',
      type: 'behavioral',
      description: 'Rapid tile deletion or board switching',
      frequency: 0,
      confidence: 0,
      triggers: ['rapid_delete', 'frequent_board_switch']
    });

    this.patterns.set('learning-mode', {
      id: 'learning-mode',
      name: 'Learning Mode',
      type: 'behavioral',
      description: 'Extended exploration of new tiles/boards',
      frequency: 0,
      confidence: 0,
      outcomes: ['vocabulary_expansion']
    });
  }

  private setupEventTracking(): void {
    // Track tile presses
    window.addEventListener('tilePressed', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.recordActivity({
        type: 'tile_press',
        timestamp: new Date(),
        details: {
          tile: customEvent.detail?.tile,
          category: customEvent.detail?.category,
          board: customEvent.detail?.board
        }
      });
    });

    // Track sentence speaks
    window.addEventListener('sentenceSpoken', (e: any) => {
      this.recordActivity({
        type: 'sentence_speak',
        timestamp: new Date(),
        details: {
          sentence: e.detail.sentence,
          wordCount: e.detail.wordCount,
          duration: e.detail.duration
        }
      });
    });

    // Track game plays
    window.addEventListener('gameStarted', (e: any) => {
      this.recordActivity({
        type: 'game_play',
        timestamp: new Date(),
        details: {
          game: e.detail.game,
          difficulty: e.detail.difficulty
        }
      });
    });

    // Track settings changes
    window.addEventListener('settingsChanged', (e: any) => {
      this.recordActivity({
        type: 'settings_change',
        timestamp: new Date(),
        details: {
          setting: e.detail.setting,
          oldValue: e.detail.oldValue,
          newValue: e.detail.newValue
        }
      });
    });

    // Track board switches
    window.addEventListener('boardSwitched', (e: any) => {
      this.recordActivity({
        type: 'board_switch',
        timestamp: new Date(),
        details: {
          from: e.detail.from,
          to: e.detail.to,
          method: e.detail.method
        }
      });
    });
  }

  private startSessionManagement(): void {
    // Check for existing session
    const savedSession = this.dataService.getData('current_session');
    if (savedSession && this.isSessionActive(savedSession)) {
      this.currentSession = savedSession;
    } else {
      this.startNewSession();
    }

    // Set up activity monitoring
    this.monitorActivity();
  }

  private monitorActivity(): void {
    // Clear existing timer
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    // Set new timer
    this.sessionTimer = setTimeout(() => {
      this.endCurrentSession();
    }, this.sessionTimeout);
  }

  private recordActivity(activity: SessionActivity): void {
    this.lastActivityTime = Date.now();
    this.monitorActivity();

    if (!this.currentSession) {
      this.startNewSession();
    }

    // Add activity to current session
    this.currentSession!.activities.push(activity);

    // Update session metrics
    this.updateSessionMetrics(activity);

    // Check for patterns in real-time
    this.detectRealtimePatterns(activity);

    // Save session state
    this.saveCurrentSession();
  }

  private startNewSession(): void {
    const sessionId = `session-${Date.now()}`;
    
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      activities: [],
      wordCount: 0,
      sentenceCount: 0,
      tilesUsed: 0,
      categories: [],
      interruptions: 0
    };

    this.sessions.set(sessionId, this.currentSession);
    
    this.analyticsService.trackEvent('session_started', {
      sessionId,
      time: new Date().toISOString()
    });
  }

  private endCurrentSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.currentSession.duration = 
      this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();

    // Analyze session mood
    this.currentSession.mood = this.analyzeSessionMood(this.currentSession);

    // Detect patterns in completed session
    this.analyzeSessionPatterns(this.currentSession);

    // Save to history
    this.saveSessionToHistory(this.currentSession);

    this.analyticsService.trackEvent('session_ended', {
      sessionId: this.currentSession.id,
      duration: this.currentSession.duration,
      activities: this.currentSession.activities.length
    });

    this.currentSession = null;
    this.dataService.setData('current_session', null);
  }

  private updateSessionMetrics(activity: SessionActivity): void {
    if (!this.currentSession) return;

    switch (activity.type) {
      case 'tile_press':
        this.currentSession.tilesUsed++;
        if (!this.currentSession.categories.includes(activity.details.category)) {
          this.currentSession.categories.push(activity.details.category);
        }
        break;

      case 'sentence_speak':
        this.currentSession.sentenceCount++;
        this.currentSession.wordCount += activity.details.wordCount || 0;
        break;

      case 'board_switch':
        // Rapid board switching might indicate frustration
        const recentSwitches = this.currentSession.activities
          .filter(a => a.type === 'board_switch')
          .filter(a => Date.now() - a.timestamp.getTime() < 30000); // Last 30 seconds
        
        if (recentSwitches.length > 3) {
          this.currentSession.interruptions++;
        }
        break;
    }
  }

  private detectRealtimePatterns(activity: SessionActivity): void {
    // Check for frustration pattern
    if (activity.type === 'board_switch' || activity.details.action === 'delete') {
      const recentActivities = this.currentSession!.activities.slice(-10);
      const rapidActions = recentActivities.filter(a => 
        Date.now() - a.timestamp.getTime() < 10000 // Last 10 seconds
      );

      if (rapidActions.length > 5) {
        this.triggerPattern('frustration-pattern');
      }
    }

    // Check for learning mode
    if (activity.type === 'tile_press') {
      const recentTiles = this.currentSession!.activities
        .filter(a => a.type === 'tile_press')
        .slice(-20);
      
      const uniqueCategories = new Set(recentTiles.map(a => a.details.category));
      
      if (uniqueCategories.size > 5) {
        this.triggerPattern('learning-mode');
      }
    }
  }

  private triggerPattern(patternId: string): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    pattern.frequency++;
    pattern.confidence = Math.min(pattern.frequency / 10, 1);

    // Notify about detected pattern
    window.dispatchEvent(new CustomEvent('patternDetected', {
      detail: { pattern }
    }));

    this.analyticsService.trackEvent('pattern_detected', {
      patternId,
      confidence: pattern.confidence
    });
  }

  private analyzeSessionMood(session: UsageSession): 'positive' | 'neutral' | 'negative' {
    const metrics = {
      productivity: session.sentenceCount / (session.duration / 60000), // Sentences per minute
      exploration: session.categories.length / session.tilesUsed,
      frustration: session.interruptions / session.activities.length
    };

    if (metrics.frustration > 0.2) return 'negative';
    if (metrics.productivity > 1 && metrics.exploration > 0.3) return 'positive';
    return 'neutral';
  }

  private analyzeSessionPatterns(session: UsageSession): void {
    const hour = session.startTime.getHours();
    const dayOfWeek = session.startTime.getDay();

    // Check time-based patterns
    this.patterns.forEach(pattern => {
      if (pattern.timeRanges) {
        const inRange = pattern.timeRanges.some(range => 
          hour >= range.start && hour <= range.end
        );
        if (inRange) {
          pattern.frequency++;
        }
      }

      if (pattern.type === 'weekly' && pattern.id === 'weekend-usage') {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          pattern.frequency++;
        }
      }
    });
  }

  // Pattern Analysis Methods
  async analyzeUsagePatterns(
    timeframe: 'day' | 'week' | 'month' | 'all' = 'week'
  ): Promise<{
    patterns: UsagePattern[];
    habits: UserHabit[];
    insights: string[];
  }> {
    const sessions = this.getSessionsInTimeframe(timeframe);
    
    // Analyze patterns
    const patterns = this.identifyPatterns(sessions);
    
    // Analyze habits
    const habits = this.identifyHabits(sessions);
    
    // Generate insights
    const insights = this.generateInsights(patterns, habits);

    return { patterns, habits, insights };
  }

  private identifyPatterns(sessions: UsageSession[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];

    // Time-based patterns
    const timePatterns = this.analyzeTimePatterns(sessions);
    patterns.push(...timePatterns);

    // Behavioral patterns
    const behaviorPatterns = this.analyzeBehaviorPatterns(sessions);
    patterns.push(...behaviorPatterns);

    // Contextual patterns
    const contextPatterns = this.analyzeContextPatterns(sessions);
    patterns.push(...contextPatterns);

    return patterns
      .filter(p => p.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeTimePatterns(sessions: UsageSession[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    const hourlyUsage = new Array(24).fill(0);
    const hourlyDuration = new Array(24).fill(0);

    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourlyUsage[hour]++;
      hourlyDuration[hour] += session.duration;
    });

    // Find peak usage hours
    const avgUsage = hourlyUsage.reduce((a, b) => a + b) / 24;
    
    for (let hour = 0; hour < 24; hour++) {
      if (hourlyUsage[hour] > avgUsage * 2) {
        patterns.push({
          id: `peak-hour-${hour}`,
          name: `Peak Usage at ${hour}:00`,
          type: 'daily',
          description: `High activity during ${hour}:00-${hour + 1}:00`,
          frequency: hourlyUsage[hour],
          confidence: hourlyUsage[hour] / sessions.length,
          timeRanges: [{ start: hour, end: hour + 1 }]
        });
      }
    }

    return patterns;
  }

  private analyzeBehaviorPatterns(sessions: UsageSession[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];

    // Analyze communication flows
    const flows = this.extractCommunicationFlows(sessions);
    
    flows.forEach((flow, id) => {
      if (flow.frequency > 5) {
        patterns.push({
          id: `flow-${id}`,
          name: `Common Flow: ${flow.sequence.join(' → ')}`,
          type: 'behavioral',
          description: 'Frequently used communication sequence',
          frequency: flow.frequency,
          confidence: flow.successRate,
          outcomes: [flow.context]
        });
      }
    });

    return patterns;
  }

  private analyzeContextPatterns(sessions: UsageSession[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    
    // Analyze category usage patterns
    const categoryPatterns = new Map<string, number>();
    
    sessions.forEach(session => {
      session.categories.forEach(category => {
        categoryPatterns.set(category, (categoryPatterns.get(category) || 0) + 1);
      });
    });

    // Find dominant categories
    const totalCategories = Array.from(categoryPatterns.values()).reduce((a, b) => a + b, 0);
    
    categoryPatterns.forEach((count, category) => {
      const usage = count / totalCategories;
      if (usage > 0.2) {
        patterns.push({
          id: `category-${category}`,
          name: `${category} Focused`,
          type: 'contextual',
          description: `Heavy usage of ${category} category`,
          frequency: count,
          confidence: usage
        });
      }
    });

    return patterns;
  }

  private identifyHabits(sessions: UsageSession[]): UserHabit[] {
    const habits: UserHabit[] = [];

    // Daily communication habit
    const dailySessions = this.groupSessionsByDay(sessions);
    const consistentDays = Array.from(dailySessions.values())
      .filter(daySessions => daySessions.length > 0).length;
    
    if (consistentDays > sessions.length * 0.7) {
      habits.push({
        habit: 'Daily Communication',
        frequency: 'daily',
        consistency: consistentDays / sessions.length,
        timePreference: this.getPreferredTime(sessions),
        relatedActivities: ['sentence_speak', 'tile_press'],
        strengthTrend: this.analyzeHabitTrend(sessions, 'daily')
      });
    }

    // Game playing habit
    const gameSessions = sessions.filter(s => 
      s.activities.some(a => a.type === 'game_play')
    );
    
    if (gameSessions.length > sessions.length * 0.3) {
      habits.push({
        habit: 'Educational Games',
        frequency: 'weekly',
        consistency: gameSessions.length / sessions.length,
        relatedActivities: ['game_play'],
        strengthTrend: this.analyzeHabitTrend(gameSessions, 'game')
      });
    }

    // Vocabulary exploration habit
    const explorationSessions = sessions.filter(s => 
      s.categories.length > 3 && s.tilesUsed > 20
    );
    
    if (explorationSessions.length > sessions.length * 0.2) {
      habits.push({
        habit: 'Vocabulary Explorer',
        frequency: 'occasional',
        consistency: explorationSessions.length / sessions.length,
        relatedActivities: ['tile_press', 'board_switch'],
        strengthTrend: this.analyzeHabitTrend(explorationSessions, 'exploration')
      });
    }

    return habits;
  }

  private generateInsights(patterns: UsagePattern[], habits: UserHabit[]): string[] {
    const insights: string[] = [];

    // Pattern-based insights
    const peakPattern = patterns.find(p => p.type === 'daily' && p.confidence > 0.7);
    if (peakPattern) {
      insights.push(`Most productive during ${peakPattern.name}. Consider scheduling important activities then.`);
    }

    // Habit-based insights
    const strongHabit = habits.find(h => h.consistency > 0.8);
    if (strongHabit) {
      insights.push(`Strong ${strongHabit.habit} habit detected! Keep up the great work.`);
    }

    const decliningHabit = habits.find(h => h.strengthTrend === 'decreasing');
    if (decliningHabit) {
      insights.push(`${decliningHabit.habit} activity has been decreasing. Consider setting reminders.`);
    }

    // Communication flow insights
    const flows = Array.from(this.communicationFlows.values());
    const efficientFlow = flows.find(f => f.successRate > 0.9 && f.frequency > 10);
    if (efficientFlow) {
      insights.push(`The sequence "${efficientFlow.sequence.join(' → ')}" works well for you!`);
    }

    // General insights
    const avgSessionDuration = this.calculateAverageSessionDuration();
    if (avgSessionDuration < 5 * 60 * 1000) {
      insights.push('Sessions are typically short. Consider longer practice periods for better progress.');
    } else if (avgSessionDuration > 30 * 60 * 1000) {
      insights.push('Long sessions detected. Remember to take breaks to maintain focus.');
    }

    return insights;
  }

  // Peak Usage Analysis
  async analyzePeakUsageTimes(): Promise<PeakUsageTime[]> {
    const sessions = Array.from(this.sessions.values());
    const peakTimes: Map<string, PeakUsageTime> = new Map();

    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const day = session.startTime.getDay();
      const key = `${hour}-${day}`;

      if (!peakTimes.has(key)) {
        peakTimes.set(key, {
          hour,
          dayOfWeek: day,
          avgDuration: 0,
          avgProductivity: 0,
          commonActivities: []
        });
      }

      const peak = peakTimes.get(key)!;
      peak.avgDuration += session.duration;
      peak.avgProductivity += this.calculateSessionProductivity(session);
      
      session.activities.forEach(activity => {
        if (!peak.commonActivities.includes(activity.type)) {
          peak.commonActivities.push(activity.type);
        }
      });
    });

    // Calculate averages
    peakTimes.forEach((peak, key) => {
      const count = sessions.filter(s => {
        const h = s.startTime.getHours();
        const d = s.startTime.getDay();
        return `${h}-${d}` === key;
      }).length;

      peak.avgDuration /= count;
      peak.avgProductivity /= count;
    });

    return Array.from(peakTimes.values())
      .sort((a, b) => b.avgProductivity - a.avgProductivity)
      .slice(0, 10);
  }

  // Communication Flow Analysis
  extractCommunicationFlows(sessions: UsageSession[]): Map<string, CommunicationFlow> {
    const flows = new Map<string, CommunicationFlow>();

    sessions.forEach(session => {
      const sequences = this.extractSequences(session);
      
      sequences.forEach(seq => {
        const key = seq.join('|');
        
        if (!flows.has(key)) {
          flows.set(key, {
            sequence: seq,
            frequency: 0,
            avgCompletionTime: 0,
            successRate: 0,
            context: this.inferContext(seq)
          });
        }

        const flow = flows.get(key)!;
        flow.frequency++;
        flow.avgCompletionTime += this.calculateSequenceTime(session, seq);
        flow.successRate += this.calculateSequenceSuccess(session, seq);
      });
    });

    // Calculate averages
    flows.forEach(flow => {
      flow.avgCompletionTime /= flow.frequency;
      flow.successRate /= flow.frequency;
    });

    this.communicationFlows = flows;
    return flows;
  }

  private extractSequences(session: UsageSession): string[][] {
    const sequences: string[][] = [];
    const activities = session.activities.filter(a => a.type === 'tile_press');
    
    // Extract 3-5 tile sequences
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= activities.length - len; i++) {
        const seq = activities.slice(i, i + len).map(a => a.details.tile);
        sequences.push(seq);
      }
    }

    return sequences;
  }

  private calculateSequenceTime(session: UsageSession, sequence: string[]): number {
    // Find the sequence in activities and calculate time
    const activities = session.activities.filter(a => a.type === 'tile_press');
    
    for (let i = 0; i <= activities.length - sequence.length; i++) {
      const match = sequence.every((tile, j) => 
        activities[i + j].details.tile === tile
      );
      
      if (match) {
        const start = activities[i].timestamp.getTime();
        const end = activities[i + sequence.length - 1].timestamp.getTime();
        return end - start;
      }
    }
    
    return 0;
  }

  private calculateSequenceSuccess(session: UsageSession, sequence: string[]): number {
    // Check if sequence led to sentence speak
    const sequenceString = sequence.join(' ');
    const speakActivities = session.activities.filter(a => a.type === 'sentence_speak');
    
    const success = speakActivities.some(speak => 
      speak.details.sentence.includes(sequenceString)
    );
    
    return success ? 1 : 0;
  }

  private inferContext(sequence: string[]): string {
    // Simple context inference based on common patterns
    const patterns = {
      greeting: ['hello', 'hi', 'good', 'morning'],
      request: ['i', 'want', 'need', 'please'],
      response: ['yes', 'no', 'ok', 'thanks'],
      question: ['what', 'where', 'when', 'why', 'how']
    };

    for (const [context, keywords] of Object.entries(patterns)) {
      if (sequence.some(word => keywords.includes(word.toLowerCase()))) {
        return context;
      }
    }

    return 'general';
  }

  // Helper Methods
  private loadHistoricalSessions(): void {
    const saved = this.dataService.getData('usage_sessions') || [];
    saved.forEach((session: UsageSession) => {
      // Convert date strings back to Date objects
      session.startTime = new Date(session.startTime);
      if (session.endTime) {
        session.endTime = new Date(session.endTime);
      }
      session.activities.forEach(activity => {
        activity.timestamp = new Date(activity.timestamp);
      });
      
      this.sessions.set(session.id, session);
    });
  }

  private analyzeHistoricalPatterns(): void {
    const sessions = Array.from(this.sessions.values());
    
    // Update pattern frequencies based on historical data
    this.patterns.forEach(pattern => {
      pattern.frequency = this.countPatternOccurrences(pattern, sessions);
      pattern.confidence = this.calculatePatternConfidence(pattern, sessions);
    });

    // Extract communication flows
    this.extractCommunicationFlows(sessions);
  }

  private countPatternOccurrences(pattern: UsagePattern, sessions: UsageSession[]): number {
    let count = 0;

    sessions.forEach(session => {
      if (this.sessionMatchesPattern(session, pattern)) {
        count++;
      }
    });

    return count;
  }

  private calculatePatternConfidence(pattern: UsagePattern, sessions: UsageSession[]): number {
    if (sessions.length === 0) return 0;
    return Math.min(pattern.frequency / sessions.length, 1);
  }

  private sessionMatchesPattern(session: UsageSession, pattern: UsagePattern): boolean {
    switch (pattern.type) {
      case 'daily':
        if (pattern.timeRanges) {
          const hour = session.startTime.getHours();
          return pattern.timeRanges.some(range => 
            hour >= range.start && hour < range.end
          );
        }
        break;

      case 'weekly':
        const day = session.startTime.getDay();
        return pattern.id === 'weekend-usage' && (day === 0 || day === 6);

      case 'behavioral':
        if (pattern.triggers) {
          return pattern.triggers.some(trigger => 
            this.sessionHasTrigger(session, trigger)
          );
        }
        break;
    }

    return false;
  }

  private sessionHasTrigger(session: UsageSession, trigger: string): boolean {
    switch (trigger) {
      case 'rapid_delete':
        const deleteCount = session.activities.filter(a => 
          a.details.action === 'delete'
        ).length;
        return deleteCount > 5;

      case 'frequent_board_switch':
        const switchCount = session.activities.filter(a => 
          a.type === 'board_switch'
        ).length;
        return switchCount > 10;

      default:
        return false;
    }
  }

  private isSessionActive(session: UsageSession): boolean {
    if (!session.startTime) return false;
    
    const timeSinceStart = Date.now() - new Date(session.startTime).getTime();
    return timeSinceStart < 24 * 60 * 60 * 1000; // Less than 24 hours
  }

  private saveCurrentSession(): void {
    if (this.currentSession) {
      this.dataService.setData('current_session', this.currentSession);
    }
  }

  private saveSessionToHistory(session: UsageSession): void {
    const history = this.dataService.getData('usage_sessions') || [];
    history.push(session);
    
    // Keep only last 1000 sessions
    if (history.length > 1000) {
      history.shift();
    }
    
    this.dataService.setData('usage_sessions', history);
  }

  private getSessionsInTimeframe(timeframe: string): UsageSession[] {
    const now = Date.now();
    const cutoff = {
      day: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
      all: 0
    };

    return Array.from(this.sessions.values())
      .filter(session => session.startTime.getTime() > cutoff[timeframe as keyof typeof cutoff]);
  }

  private groupSessionsByDay(sessions: UsageSession[]): Map<string, UsageSession[]> {
    const grouped = new Map<string, UsageSession[]>();

    sessions.forEach(session => {
      const day = session.startTime.toDateString();
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day)!.push(session);
    });

    return grouped;
  }

  private getPreferredTime(sessions: UsageSession[]): string {
    const hourCounts = new Array(24).fill(0);
    
    sessions.forEach(session => {
      hourCounts[session.startTime.getHours()]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    
    if (peakHour < 6) return 'early_morning';
    if (peakHour < 12) return 'morning';
    if (peakHour < 17) return 'afternoon';
    if (peakHour < 21) return 'evening';
    return 'night';
  }

  private analyzeHabitTrend(sessions: UsageSession[], type: string): UserHabit['strengthTrend'] {
    if (sessions.length < 10) return 'stable';

    const recent = sessions.slice(-5);
    const older = sessions.slice(-10, -5);

    const recentFreq = recent.length;
    const olderFreq = older.length;

    if (recentFreq > olderFreq * 1.2) return 'increasing';
    if (recentFreq < olderFreq * 0.8) return 'decreasing';
    return 'stable';
  }

  private calculateSessionProductivity(session: UsageSession): number {
    if (session.duration === 0) return 0;

    const metrics = {
      sentencesPerMinute: (session.sentenceCount / session.duration) * 60000,
      tilesPerMinute: (session.tilesUsed / session.duration) * 60000,
      categoryDiversity: session.categories.length / Math.max(session.tilesUsed, 1),
      completionRate: session.sentenceCount / Math.max(session.activities.filter(a => a.type === 'tile_press').length / 5, 1)
    };

    // Weighted productivity score
    return (
      metrics.sentencesPerMinute * 0.4 +
      metrics.tilesPerMinute * 0.2 +
      metrics.categoryDiversity * 0.2 +
      metrics.completionRate * 0.2
    );
  }

  private calculateAverageSessionDuration(): number {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.duration > 0);
    
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    return totalDuration / sessions.length;
  }

  // Public API
  getCurrentSession(): UsageSession | null {
    return this.currentSession;
  }

  getSessionHistory(limit: number = 100): UsageSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  getPatterns(): UsagePattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence);
  }

  getHabits(): UserHabit[] {
    return Array.from(this.habits.values());
  }

  getCommunicationFlows(): CommunicationFlow[] {
    return Array.from(this.communicationFlows.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  async generateUsageReport(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    summary: any;
    patterns: UsagePattern[];
    habits: UserHabit[];
    peakTimes: PeakUsageTime[];
    insights: string[];
  }> {
    const analysis = await this.analyzeUsagePatterns(timeframe);
    const peakTimes = await this.analyzePeakUsageTimes();
    const sessions = this.getSessionsInTimeframe(timeframe);

    const summary = {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
      avgSessionDuration: this.calculateAverageSessionDuration(),
      totalWords: sessions.reduce((sum, s) => sum + s.wordCount, 0),
      totalSentences: sessions.reduce((sum, s) => sum + s.sentenceCount, 0),
      uniqueCategories: new Set(sessions.flatMap(s => s.categories)).size,
      productivityScore: sessions.reduce((sum, s) => sum + this.calculateSessionProductivity(s), 0) / sessions.length
    };

    return {
      summary,
      patterns: analysis.patterns,
      habits: analysis.habits,
      peakTimes,
      insights: analysis.insights
    };
  }

  exportPatternData(): any {
    return {
      sessions: Array.from(this.sessions.values()),
      patterns: Array.from(this.patterns.values()),
      habits: Array.from(this.habits.values()),
      communicationFlows: Array.from(this.communicationFlows.values())
    };
  }
}

export function getUsagePatternsService(): UsagePatternsService {
  return UsagePatternsService.getInstance();
}