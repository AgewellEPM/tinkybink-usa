/**
 * Real-Time Updates Service
 * WebSocket-based real-time notifications for breakthroughs, family engagement, and live recommendations
 */

import { userHistoryTrackingService, BreakthroughMoment } from './user-history-tracking-service';
import { personalizedRecommendationEngine, PersonalizedRecommendation } from './personalized-recommendation-engine';

export interface RealtimeEvent {
  event_id: string;
  event_type: 'breakthrough' | 'recommendation_update' | 'family_notification' | 'milestone_achieved' | 'peer_achievement' | 'therapy_update';
  timestamp: Date;
  user_id: string;
  priority: 'low' | 'medium' | 'high' | 'celebration';
  data: any;
  visual_effect?: 'confetti' | 'fireworks' | 'stars' | 'rainbow' | 'custom';
  audio_cue?: 'chime' | 'fanfare' | 'applause' | 'custom';
  duration_ms?: number;
}

export interface FamilyNotification {
  notification_id: string;
  user_id: string;
  family_member_ids: string[];
  notification_type: 'breakthrough' | 'milestone' | 'daily_summary' | 'concern' | 'celebration';
  title: string;
  message: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
  };
  action_buttons?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary';
  }>;
}

export interface LiveDashboardUpdate {
  update_id: string;
  dashboard_section: 'overview' | 'recommendations' | 'progress' | 'analytics';
  update_type: 'data_refresh' | 'new_item' | 'animation' | 'highlight';
  target_element?: string;
  animation_config?: {
    type: string;
    duration: number;
    easing: string;
  };
  new_data?: any;
}

export class RealtimeUpdatesService {
  private static instance: RealtimeUpdatesService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private activeSubscriptions: Map<string, string[]> = new Map(); // userId -> subscriptionTypes
  private queuedEvents: RealtimeEvent[] = [];
  private isConnected = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): RealtimeUpdatesService {
    if (!RealtimeUpdatesService.instance) {
      RealtimeUpdatesService.instance = new RealtimeUpdatesService();
    }
    return RealtimeUpdatesService.instance;
  }

  private initialize(): void {
    if (typeof window === 'undefined') {
      return; // Skip initialization on server side
    }
    console.log('🔴 Realtime Updates Service initialized');
    this.setupWebSocket();
    this.setupOfflineQueue();
  }

  /**
   * Connect to WebSocket server
   */
  private setupWebSocket(): void {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      return; // Skip WebSocket setup on server side
    }
    try {
      // In production, this would connect to your WebSocket server
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/realtime';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.flushQueuedEvents();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      this.fallbackToPolling();
    }
  }

  /**
   * Subscribe to real-time updates for a user
   */
  subscribeToUserUpdates(
    userId: string, 
    eventTypes: RealtimeEvent['event_type'][] = ['breakthrough', 'recommendation_update']
  ): void {
    this.activeSubscriptions.set(userId, eventTypes);
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        userId,
        eventTypes
      }));
    }
  }

  /**
   * Unsubscribe from user updates
   */
  unsubscribeFromUserUpdates(userId: string): void {
    this.activeSubscriptions.delete(userId);
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        userId
      }));
    }
  }

  /**
   * Register event handler
   */
  on(eventType: RealtimeEvent['event_type'], handler: (event: RealtimeEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: RealtimeEvent['event_type'], handler: (event: RealtimeEvent) => void): void {
    this.eventHandlers.get(eventType)?.delete(handler);
  }

  /**
   * Send breakthrough notification
   */
  async sendBreakthroughNotification(
    breakthrough: BreakthroughMoment,
    visualEffect: RealtimeEvent['visual_effect'] = 'fireworks'
  ): Promise<void> {
    const event: RealtimeEvent = {
      event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'breakthrough',
      timestamp: new Date(),
      user_id: breakthrough.user_id,
      priority: 'celebration',
      data: breakthrough,
      visual_effect: visualEffect,
      audio_cue: 'fanfare',
      duration_ms: 5000
    };

    this.broadcastEvent(event);

    // Send family notification
    await this.notifyFamily(breakthrough.user_id, {
      notification_id: `notif_${Date.now()}`,
      user_id: breakthrough.user_id,
      family_member_ids: await this.getFamilyMembers(breakthrough.user_id),
      notification_type: 'breakthrough',
      title: '🎉 Breakthrough Moment!',
      message: `Amazing progress in ${breakthrough.skill_area}! ${this.getBreakthroughMessage(breakthrough)}`,
      action_buttons: [
        {
          label: 'View Details',
          action: 'view_breakthrough',
          style: 'primary'
        },
        {
          label: 'Send Encouragement',
          action: 'send_message',
          style: 'secondary'
        }
      ]
    });
  }

  /**
   * Send recommendation update
   */
  async sendRecommendationUpdate(
    userId: string,
    newRecommendation: PersonalizedRecommendation
  ): Promise<void> {
    const event: RealtimeEvent = {
      event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'recommendation_update',
      timestamp: new Date(),
      user_id: userId,
      priority: newRecommendation.priority_level === 'critical' ? 'high' : 'medium',
      data: {
        recommendation: newRecommendation,
        update_type: 'new_recommendation'
      }
    };

    this.broadcastEvent(event);

    // Update dashboard in real-time
    this.sendDashboardUpdate({
      update_id: `upd_${Date.now()}`,
      dashboard_section: 'recommendations',
      update_type: 'new_item',
      target_element: 'recommendations-list',
      animation_config: {
        type: 'slideIn',
        duration: 500,
        easing: 'easeOutQuart'
      },
      new_data: newRecommendation
    });
  }

  /**
   * Notify family members
   */
  private async notifyFamily(userId: string, notification: FamilyNotification): Promise<void> {
    // In production, this would send push notifications, emails, SMS
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'family_notification',
        notification
      }));
    }

    // Store notification for later retrieval
    this.storeFamilyNotification(notification);
  }

  /**
   * Send dashboard update
   */
  private sendDashboardUpdate(update: LiveDashboardUpdate): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'dashboard_update',
        update
      }));
    }
  }

  /**
   * Broadcast event to all handlers
   */
  private broadcastEvent(event: RealtimeEvent): void {
    // Queue if not connected
    if (!this.isConnected) {
      this.queuedEvents.push(event);
      return;
    }

    // Send via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'broadcast',
        event
      }));
    }

    // Trigger local handlers
    const handlers = this.eventHandlers.get(event.event_type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: MessageEvent): void {
    try {
      const data = JSON.parse(message.data);
      
      switch (data.type) {
        case 'event':
          this.handleIncomingEvent(data.event);
          break;
        
        case 'peer_achievement':
          this.handlePeerAchievement(data);
          break;
        
        case 'system_update':
          this.handleSystemUpdate(data);
          break;
        
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle incoming real-time event
   */
  private handleIncomingEvent(event: RealtimeEvent): void {
    // Check if user is subscribed to this event
    const subscriptions = this.activeSubscriptions.get(event.user_id);
    if (!subscriptions || !subscriptions.includes(event.event_type)) {
      return;
    }

    // Trigger handlers
    const handlers = this.eventHandlers.get(event.event_type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // Special handling for different event types
    switch (event.event_type) {
      case 'breakthrough':
        this.triggerBreakthroughCelebration(event);
        break;
      
      case 'milestone_achieved':
        this.triggerMilestoneAnimation(event);
        break;
      
      case 'recommendation_update':
        this.updateRecommendationsUI(event);
        break;
    }
  }

  /**
   * Trigger breakthrough celebration effects
   */
  private triggerBreakthroughCelebration(event: RealtimeEvent): void {
    // Dispatch custom event for UI components
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('breakthrough-celebration', {
      detail: {
        effect: event.visual_effect,
        audio: event.audio_cue,
        duration: event.duration_ms,
        data: event.data
      }
    }));
  }

  /**
   * Trigger milestone animation
   */
  private triggerMilestoneAnimation(event: RealtimeEvent): void {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('milestone-achieved', {
      detail: event.data
    }));
  }

  /**
   * Update recommendations UI in real-time
   */
  private updateRecommendationsUI(event: RealtimeEvent): void {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('recommendations-updated', {
      detail: event.data
    }));
  }

  /**
   * Handle peer achievements for social learning
   */
  private handlePeerAchievement(data: any): void {
    // Anonymous peer achievements to inspire users
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('peer-achievement', {
      detail: {
        achievement: data.achievement,
        anonymousId: data.peerId,
        message: data.inspirationalMessage
      }
    }));
  }

  /**
   * Handle system updates
   */
  private handleSystemUpdate(data: any): void {
    console.log('System update received:', data);
    // Handle system-wide updates, new features, etc.
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached, falling back to polling');
      this.fallbackToPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.setupWebSocket();
    }, delay);
  }

  /**
   * Fallback to polling when WebSocket unavailable
   */
  private fallbackToPolling(): void {
    console.log('Falling back to polling mode');
    
    // Poll for updates every 30 seconds
    setInterval(async () => {
      for (const [userId, eventTypes] of this.activeSubscriptions.entries()) {
        // Check for new events via REST API
        try {
          const response = await fetch(`/api/realtime/poll?userId=${userId}&types=${eventTypes.join(',')}`);
          const events = await response.json();
          
          events.forEach((event: RealtimeEvent) => {
            this.handleIncomingEvent(event);
          });
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 30000);
  }

  /**
   * Setup offline event queue
   */
  private setupOfflineQueue(): void {
    if (typeof window === 'undefined') {
      return; // Skip offline queue setup on server side
    }
    // Store events when offline
    window.addEventListener('offline', () => {
      console.log('📴 Gone offline, queuing events');
      this.isConnected = false;
    });

    window.addEventListener('online', () => {
      console.log('📶 Back online, flushing queue');
      this.attemptReconnect();
    });
  }

  /**
   * Flush queued events when reconnected
   */
  private flushQueuedEvents(): void {
    if (this.queuedEvents.length === 0) return;

    console.log(`Flushing ${this.queuedEvents.length} queued events`);
    
    this.queuedEvents.forEach(event => {
      this.broadcastEvent(event);
    });
    
    this.queuedEvents = [];
  }

  /**
   * Get family members for a user
   */
  private async getFamilyMembers(userId: string): Promise<string[]> {
    // In production, this would fetch from user settings
    return ['family_member_1', 'family_member_2'];
  }

  /**
   * Generate breakthrough message
   */
  private getBreakthroughMessage(breakthrough: BreakthroughMoment): string {
    const messages = {
      'first_success': 'First successful completion! A major milestone!',
      'consistency_achieved': 'Showing amazing consistency and dedication!',
      'level_up': 'Advanced to the next level! Incredible progress!',
      'speed_improvement': 'Lightning fast! Response time has significantly improved!',
      'independence_gained': 'Achieving independent mastery! So proud!'
    };

    return messages[breakthrough.breakthrough_type] || 'Wonderful progress achieved!';
  }

  /**
   * Store family notification for later retrieval
   */
  private storeFamilyNotification(notification: FamilyNotification): void {
    try {
      const notifications = JSON.parse(localStorage.getItem('familyNotifications') || '[]');
      notifications.push(notification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.shift();
      }
      
      localStorage.setItem('familyNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store family notification:', error);
    }
  }

  /**
   * Simulate real-time events for testing
   */
  simulateBreakthrough(userId: string): void {
    const breakthrough: BreakthroughMoment = {
      breakthrough_id: `test_${Date.now()}`,
      user_id: userId,
      timestamp: new Date(),
      skill_area: 'memory_games',
      breakthrough_type: 'level_up',
      context: {
        activity: 'Visual Sequence Memory',
        session_id: 'test_session',
        previous_attempts: 10,
        current_performance: { accuracy: 95 }
      },
      significance_score: 9,
      celebration_triggered: true
    };

    this.sendBreakthroughNotification(breakthrough);
  }
}

// Export singleton instance
export const realtimeUpdatesService = RealtimeUpdatesService.getInstance();