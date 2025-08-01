export interface AnalyticsEvent {
  type: string;
  timestamp: number;
  data?: any;
}

export interface TileClick {
  tile: string;
  board: string;
  timestamp: number;
}

export interface SpeechEvent {
  text: string;
  timestamp: number;
  duration?: number;
}

export interface SessionData {
  startTime: number;
  endTime?: number;
  interactions: number;
  tilesClicked: TileClick[];
  speechEvents: SpeechEvent[];
  boards: string[];
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private currentSession: SessionData | null = null;
  private tilesClicked: TileClick[] = [];
  private speechEvents: SpeechEvent[] = [];
  private boardVisits: Map<string, number> = new Map();
  private tileUsage: Map<string, number> = new Map();

  constructor() {
    this.initialize();
  }

  initialize() {
    console.log('Analytics Service ready');
    this.startSession();
    this.loadStoredAnalytics();
  }

  startSession() {
    this.currentSession = {
      startTime: Date.now(),
      interactions: 0,
      tilesClicked: [],
      speechEvents: [],
      boards: []
    };
  }

  track(eventType: string, data?: any) {
    const event: AnalyticsEvent = {
      type: eventType,
      timestamp: Date.now(),
      data
    };
    
    this.events.push(event);
    
    if (this.currentSession) {
      this.currentSession.interactions++;
    }

    // Store event
    this.saveAnalytics();
  }

  trackTileClick(tileText: string, board: string) {
    const click: TileClick = {
      tile: tileText,
      board,
      timestamp: Date.now()
    };

    this.tilesClicked.push(click);
    
    if (this.currentSession) {
      this.currentSession.tilesClicked.push(click);
    }

    // Update tile usage count
    const count = this.tileUsage.get(tileText) || 0;
    this.tileUsage.set(tileText, count + 1);

    this.track('tile_click', { tile: tileText, board });
  }

  trackSpeech(text: string) {
    const speechEvent: SpeechEvent = {
      text,
      timestamp: Date.now()
    };

    this.speechEvents.push(speechEvent);
    
    if (this.currentSession) {
      this.currentSession.speechEvents.push(speechEvent);
    }

    this.track('speech', { text });
  }

  trackSentence(text: string) {
    this.track('sentence_complete', { text });
  }

  trackBoardVisit(boardName: string) {
    const visits = this.boardVisits.get(boardName) || 0;
    this.boardVisits.set(boardName, visits + 1);

    if (this.currentSession && !this.currentSession.boards.includes(boardName)) {
      this.currentSession.boards.push(boardName);
    }

    this.track('board_visit', { board: boardName });
  }

  getTopTiles(limit: number = 10): Array<{ tile: string; count: number }> {
    const sorted = Array.from(this.tileUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tile, count]) => ({ tile, count }));
    
    return sorted;
  }

  getMostVisitedBoards(limit: number = 5): Array<{ board: string; visits: number }> {
    const sorted = Array.from(this.boardVisits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([board, visits]) => ({ board, visits }));
    
    return sorted;
  }

  getSessionStats() {
    if (!this.currentSession) {
      return null;
    }

    const duration = Date.now() - this.currentSession.startTime;
    const minutes = Math.floor(duration / 60000);
    const interactionsPerMinute = minutes > 0 ? this.currentSession.interactions / minutes : 0;

    return {
      duration: minutes,
      interactions: this.currentSession.interactions,
      tilesClicked: this.currentSession.tilesClicked.length,
      speechEvents: this.currentSession.speechEvents.length,
      boardsVisited: this.currentSession.boards.length,
      interactionsPerMinute: Math.round(interactionsPerMinute * 10) / 10
    };
  }

  getTotalStats() {
    return {
      totalEvents: this.events.length,
      totalTileClicks: this.tilesClicked.length,
      totalSpeechEvents: this.speechEvents.length,
      uniqueTilesUsed: this.tileUsage.size,
      boardsVisited: this.boardVisits.size,
      topTiles: this.getTopTiles(5),
      topBoards: this.getMostVisitedBoards(3)
    };
  }

  getRecentActivity(limit: number = 20): AnalyticsEvent[] {
    return this.events.slice(-limit).reverse();
  }

  exportAnalytics(): string {
    const data = {
      exportDate: new Date().toISOString(),
      totalStats: this.getTotalStats(),
      sessionStats: this.getSessionStats(),
      recentEvents: this.getRecentActivity(100),
      tileUsage: Object.fromEntries(this.tileUsage),
      boardVisits: Object.fromEntries(this.boardVisits)
    };

    return JSON.stringify(data, null, 2);
  }

  private saveAnalytics() {
    const data = {
      events: this.events.slice(-1000), // Keep last 1000 events
      tilesClicked: this.tilesClicked.slice(-500),
      speechEvents: this.speechEvents.slice(-500),
      tileUsage: Object.fromEntries(this.tileUsage),
      boardVisits: Object.fromEntries(this.boardVisits)
    };

    localStorage.setItem('tinkybink_analytics', JSON.stringify(data));
  }

  private loadStoredAnalytics() {
    const stored = localStorage.getItem('tinkybink_analytics');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.tilesClicked = data.tilesClicked || [];
        this.speechEvents = data.speechEvents || [];
        this.tileUsage = new Map(Object.entries(data.tileUsage || {}));
        this.boardVisits = new Map(Object.entries(data.boardVisits || {}));
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    }
  }

  clearAnalytics() {
    this.events = [];
    this.tilesClicked = [];
    this.speechEvents = [];
    this.tileUsage.clear();
    this.boardVisits.clear();
    localStorage.removeItem('tinkybink_analytics');
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}