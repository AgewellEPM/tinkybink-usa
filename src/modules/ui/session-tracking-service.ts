import { getAnalyticsService } from '../core/analytics-service';

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  interactions: number;
  tilesClicked: number;
  sentencesSpoken: number;
  boardsVisited: string[];
  communicationActs: CommunicationAct[];
  progressMetrics: ProgressMetrics;
}

export interface CommunicationAct {
  timestamp: number;
  type: 'request' | 'response' | 'comment' | 'question' | 'greeting' | 'expression';
  content: string;
  method: 'tile' | 'typing' | 'sentence';
  success: boolean;
}

export interface ProgressMetrics {
  vocabularySize: number;
  averageUtteranceLength: number;
  communicationRate: number; // acts per minute
  independenceLevel: number; // 0-100
  promptingNeeded: number; // count
}

export class SessionTrackingService {
  private currentSession: SessionMetrics | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;
  private interactionTimer: any = null;
  private idleThreshold = 5 * 60 * 1000; // 5 minutes

  initialize() {
    console.log('Session Tracking Service ready');
    this.analytics = getAnalyticsService();
    this.startNewSession();
    this.setupIdleDetection();
  }

  startNewSession() {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      duration: 0,
      interactions: 0,
      tilesClicked: 0,
      sentencesSpoken: 0,
      boardsVisited: [],
      communicationActs: [],
      progressMetrics: {
        vocabularySize: 0,
        averageUtteranceLength: 0,
        communicationRate: 0,
        independenceLevel: 0,
        promptingNeeded: 0
      }
    };

    this.saveSession();
  }

  endSession() {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    
    // Calculate final metrics
    this.calculateProgressMetrics();
    
    // Save to history
    this.saveToHistory();
    
    // Generate session report
    const report = this.generateSessionReport();
    
    // Reset
    this.currentSession = null;
    
    return report;
  }

  trackInteraction() {
    if (!this.currentSession) return;

    this.currentSession.interactions++;
    this.resetIdleTimer();
    this.saveSession();
  }

  trackTileClick(tile: string, board: string) {
    if (!this.currentSession) return;

    this.currentSession.tilesClicked++;
    this.trackInteraction();
    
    // Track as communication act
    this.addCommunicationAct({
      type: this.classifyCommunicationType(tile),
      content: tile,
      method: 'tile',
      success: true
    });

    this.analytics?.trackTileClick(tile, board);
  }

  trackSentence(sentence: string) {
    if (!this.currentSession) return;

    this.currentSession.sentencesSpoken++;
    this.trackInteraction();
    
    // Track as communication act
    this.addCommunicationAct({
      type: this.classifyCommunicationType(sentence),
      content: sentence,
      method: 'sentence',
      success: true
    });

    // Update average utterance length
    this.updateUtteranceMetrics(sentence);
  }

  trackBoardVisit(boardName: string) {
    if (!this.currentSession) return;

    if (!this.currentSession.boardsVisited.includes(boardName)) {
      this.currentSession.boardsVisited.push(boardName);
    }
    
    this.trackInteraction();
  }

  addCommunicationAct(act: Omit<CommunicationAct, 'timestamp'>) {
    if (!this.currentSession) return;

    const communicationAct: CommunicationAct = {
      ...act,
      timestamp: Date.now()
    };

    this.currentSession.communicationActs.push(communicationAct);
    this.updateCommunicationRate();
  }

  private classifyCommunicationType(text: string): CommunicationAct['type'] {
    const lower = text.toLowerCase();
    
    if (lower.includes('want') || lower.includes('need') || lower.includes('give')) {
      return 'request';
    } else if (lower.includes('yes') || lower.includes('no') || lower.includes('okay')) {
      return 'response';
    } else if (lower.includes('?') || lower.includes('what') || lower.includes('where') || lower.includes('who')) {
      return 'question';
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('bye')) {
      return 'greeting';
    } else if (lower.includes('feel') || lower.includes('happy') || lower.includes('sad')) {
      return 'expression';
    }
    
    return 'comment';
  }

  private updateUtteranceMetrics(sentence: string) {
    if (!this.currentSession) return;

    const words = sentence.split(' ').filter(w => w.length > 0);
    const allUtterances = this.currentSession.communicationActs
      .filter(act => act.method === 'sentence')
      .map(act => act.content.split(' ').length);
    
    allUtterances.push(words.length);
    
    const average = allUtterances.reduce((a, b) => a + b, 0) / allUtterances.length;
    this.currentSession.progressMetrics.averageUtteranceLength = Math.round(average * 10) / 10;
  }

  private updateCommunicationRate() {
    if (!this.currentSession) return;

    const duration = Date.now() - this.currentSession.startTime;
    const minutes = duration / 60000;
    
    if (minutes > 0) {
      const rate = this.currentSession.communicationActs.length / minutes;
      this.currentSession.progressMetrics.communicationRate = Math.round(rate * 10) / 10;
    }
  }

  private calculateProgressMetrics() {
    if (!this.currentSession) return;

    // Calculate vocabulary size (unique words/phrases used)
    const uniqueWords = new Set<string>();
    this.currentSession.communicationActs.forEach(act => {
      act.content.split(' ').forEach(word => {
        if (word.length > 0) uniqueWords.add(word.toLowerCase());
      });
    });
    this.currentSession.progressMetrics.vocabularySize = uniqueWords.size;

    // Calculate independence level (based on interaction patterns)
    const totalActs = this.currentSession.communicationActs.length;
    const successfulActs = this.currentSession.communicationActs.filter(act => act.success).length;
    const independenceScore = totalActs > 0 ? (successfulActs / totalActs) * 100 : 0;
    this.currentSession.progressMetrics.independenceLevel = Math.round(independenceScore);
  }

  private setupIdleDetection() {
    if (typeof window === 'undefined') return;

    ['mousedown', 'touchstart', 'keypress'].forEach(event => {
      window.addEventListener(event, () => this.resetIdleTimer());
    });
  }

  private resetIdleTimer() {
    if (this.interactionTimer) {
      clearTimeout(this.interactionTimer);
    }

    this.interactionTimer = setTimeout(() => {
      this.handleIdleTimeout();
    }, this.idleThreshold);
  }

  private handleIdleTimeout() {
    if (this.currentSession) {
      this.endSession();
      this.startNewSession();
    }
  }

  private saveSession() {
    if (!this.currentSession) return;
    
    sessionStorage.setItem('current_session', JSON.stringify(this.currentSession));
  }

  private saveToHistory() {
    if (!this.currentSession) return;

    const history = JSON.parse(localStorage.getItem('session_history') || '[]');
    history.push(this.currentSession);
    
    // Keep last 100 sessions
    if (history.length > 100) {
      history.shift();
    }
    
    localStorage.setItem('session_history', JSON.stringify(history));
  }

  generateSessionReport(): string {
    if (!this.currentSession) return 'No active session';

    const duration = Math.round((this.currentSession.duration || 0) / 60000);
    const metrics = this.currentSession.progressMetrics;

    return `
Session Report
==============
Duration: ${duration} minutes
Interactions: ${this.currentSession.interactions}
Tiles Clicked: ${this.currentSession.tilesClicked}
Sentences Spoken: ${this.currentSession.sentencesSpoken}
Boards Visited: ${this.currentSession.boardsVisited.length}

Communication Metrics:
- Total Acts: ${this.currentSession.communicationActs.length}
- Rate: ${metrics.communicationRate} acts/min
- Vocabulary Size: ${metrics.vocabularySize} words
- Avg Utterance Length: ${metrics.averageUtteranceLength} words
- Independence Level: ${metrics.independenceLevel}%

Communication Types:
${this.getCommunicationTypeSummary()}
    `.trim();
  }

  private getCommunicationTypeSummary(): string {
    if (!this.currentSession) return '';

    const types = this.currentSession.communicationActs.reduce((acc, act) => {
      acc[act.type] = (acc[act.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(types)
      .map(([type, count]) => `- ${type}: ${count}`)
      .join('\n');
  }

  getCurrentSession(): SessionMetrics | null {
    return this.currentSession;
  }

  getSessionHistory(limit: number = 10): SessionMetrics[] {
    const history = JSON.parse(localStorage.getItem('session_history') || '[]');
    return history.slice(-limit).reverse();
  }

  exportSessionData(): string {
    const data = {
      currentSession: this.currentSession,
      history: this.getSessionHistory(50),
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
let sessionTrackingInstance: SessionTrackingService | null = null;

export function getSessionTrackingService(): SessionTrackingService {
  if (!sessionTrackingInstance) {
    sessionTrackingInstance = new SessionTrackingService();
  }
  return sessionTrackingInstance;
}