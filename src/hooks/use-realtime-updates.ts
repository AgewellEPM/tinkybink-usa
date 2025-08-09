/**
 * React Hook for Real-Time Updates
 * Provides easy integration of WebSocket-based real-time notifications in React components
 */

import { useEffect, useCallback, useState } from 'react';
import { realtimeUpdatesService, RealtimeEvent } from '@/services/realtime-updates-service';

interface UseRealtimeUpdatesOptions {
  userId: string;
  eventTypes?: RealtimeEvent['event_type'][];
  onBreakthrough?: (event: RealtimeEvent) => void;
  onRecommendationUpdate?: (event: RealtimeEvent) => void;
  onMilestone?: (event: RealtimeEvent) => void;
  onFamilyNotification?: (event: RealtimeEvent) => void;
}

interface CelebrationState {
  isActive: boolean;
  type: 'confetti' | 'fireworks' | 'stars' | 'rainbow' | null;
  message: string;
  duration: number;
}

export function useRealtimeUpdates({
  userId,
  eventTypes = ['breakthrough', 'recommendation_update', 'milestone_achieved'],
  onBreakthrough,
  onRecommendationUpdate,
  onMilestone,
  onFamilyNotification
}: UseRealtimeUpdatesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<RealtimeEvent | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState>({
    isActive: false,
    type: null,
    message: '',
    duration: 0
  });

  // Handle breakthrough events with celebration
  const handleBreakthrough = useCallback((event: RealtimeEvent) => {
    console.log('🎉 Breakthrough detected:', event);
    
    // Trigger celebration
    setCelebration({
      isActive: true,
      type: event.visual_effect || 'fireworks',
      message: `Amazing breakthrough in ${event.data.skill_area}!`,
      duration: event.duration_ms || 5000
    });

    // Clear celebration after duration
    setTimeout(() => {
      setCelebration(prev => ({ ...prev, isActive: false }));
    }, event.duration_ms || 5000);

    setLatestEvent(event);
    onBreakthrough?.(event);
  }, [onBreakthrough]);

  // Handle recommendation updates
  const handleRecommendationUpdate = useCallback((event: RealtimeEvent) => {
    console.log('📋 New recommendation:', event);
    setLatestEvent(event);
    onRecommendationUpdate?.(event);
  }, [onRecommendationUpdate]);

  // Handle milestone achievements
  const handleMilestone = useCallback((event: RealtimeEvent) => {
    console.log('🏆 Milestone achieved:', event);
    
    // Trigger celebration for milestones too
    setCelebration({
      isActive: true,
      type: 'stars',
      message: 'Milestone achieved!',
      duration: 3000
    });

    setTimeout(() => {
      setCelebration(prev => ({ ...prev, isActive: false }));
    }, 3000);

    setLatestEvent(event);
    onMilestone?.(event);
  }, [onMilestone]);

  // Handle family notifications
  const handleFamilyNotification = useCallback((event: RealtimeEvent) => {
    console.log('👨‍👩‍👧‍👦 Family notification:', event);
    setLatestEvent(event);
    onFamilyNotification?.(event);
  }, [onFamilyNotification]);

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to user updates
    realtimeUpdatesService.subscribeToUserUpdates(userId, eventTypes);
    setIsConnected(true);

    // Register event handlers
    realtimeUpdatesService.on('breakthrough', handleBreakthrough);
    realtimeUpdatesService.on('recommendation_update', handleRecommendationUpdate);
    realtimeUpdatesService.on('milestone_achieved', handleMilestone);
    realtimeUpdatesService.on('family_notification', handleFamilyNotification);

    // Listen for custom events from service
    const handleBreakthroughCelebration = (event: CustomEvent) => {
      console.log('🎊 Celebration event received:', event.detail);
      setCelebration({
        isActive: true,
        type: event.detail.effect,
        message: `${event.detail.data.skill_area} breakthrough!`,
        duration: event.detail.duration
      });

      setTimeout(() => {
        setCelebration(prev => ({ ...prev, isActive: false }));
      }, event.detail.duration);
    };

    window.addEventListener('breakthrough-celebration', handleBreakthroughCelebration as EventListener);

    // Cleanup
    return () => {
      realtimeUpdatesService.unsubscribeFromUserUpdates(userId);
      realtimeUpdatesService.off('breakthrough', handleBreakthrough);
      realtimeUpdatesService.off('recommendation_update', handleRecommendationUpdate);
      realtimeUpdatesService.off('milestone_achieved', handleMilestone);
      realtimeUpdatesService.off('family_notification', handleFamilyNotification);
      window.removeEventListener('breakthrough-celebration', handleBreakthroughCelebration as EventListener);
      setIsConnected(false);
    };
  }, [userId, eventTypes.join(',')]); // Re-subscribe if eventTypes change

  // Simulate breakthrough for testing
  const simulateBreakthrough = useCallback(() => {
    realtimeUpdatesService.simulateBreakthrough(userId);
  }, [userId]);

  return {
    isConnected,
    latestEvent,
    celebration,
    simulateBreakthrough
  };
}

// Additional hook for dashboard-specific updates
export function useDashboardRealtimeUpdates(userId: string) {
  const [dashboardUpdates, setDashboardUpdates] = useState<any[]>([]);

  useEffect(() => {
    const handleDashboardUpdate = (event: CustomEvent) => {
      console.log('📊 Dashboard update:', event.detail);
      setDashboardUpdates(prev => [...prev, event.detail]);
    };

    const handleRecommendationsUpdate = (event: CustomEvent) => {
      console.log('🎯 Recommendations updated:', event.detail);
      // Trigger re-fetch or state update
    };

    window.addEventListener('dashboard-update', handleDashboardUpdate as EventListener);
    window.addEventListener('recommendations-updated', handleRecommendationsUpdate as EventListener);

    return () => {
      window.removeEventListener('dashboard-update', handleDashboardUpdate as EventListener);
      window.removeEventListener('recommendations-updated', handleRecommendationsUpdate as EventListener);
    };
  }, []);

  return {
    dashboardUpdates
  };
}

// Hook for peer learning network
export function usePeerAchievements() {
  const [peerAchievements, setPeerAchievements] = useState<any[]>([]);

  useEffect(() => {
    const handlePeerAchievement = (event: CustomEvent) => {
      console.log('🌟 Peer achievement:', event.detail);
      setPeerAchievements(prev => [event.detail, ...prev].slice(0, 10)); // Keep last 10
    };

    window.addEventListener('peer-achievement', handlePeerAchievement as EventListener);

    return () => {
      window.removeEventListener('peer-achievement', handlePeerAchievement as EventListener);
    };
  }, []);

  return {
    peerAchievements
  };
}