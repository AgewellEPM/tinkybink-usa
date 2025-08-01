'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useSpeech } from '@/hooks/use-speech';
import { useEffect, useState } from 'react';
import { getAnalyticsService, getUIEffectsService, getHapticService } from '@/modules/module-system';

const categories = [
  { id: 'home-safe', text: 'HOME/SAFE', emoji: '🏠', color: '#20B2AA', boardId: 'home' },
  { id: 'want', text: 'WANT', emoji: '🤚', color: '#9370DB', boardId: 'want' },
  { id: 'need', text: 'NEED', emoji: '❗', color: '#FF6347', boardId: 'need' },
  { id: 'feel', text: 'FEEL', emoji: '😊', color: '#00CED1', boardId: 'feelings' },
  { id: 'do', text: 'DO', emoji: '🎯', color: '#8B4513', boardId: 'actions' },
  { id: 'people', text: 'PEOPLE', emoji: '👥', color: '#FF8C00', boardId: 'people' },
];

export function CategoryBoard() {
  const setCurrentBoard = useAppStore((state) => state.setCurrentBoard);
  const { speak } = useSpeech();
  const [analytics, setAnalytics] = useState<ReturnType<typeof getAnalyticsService> | null>(null);
  const [uiEffects, setUIEffects] = useState<ReturnType<typeof getUIEffectsService> | null>(null);
  const [haptic, setHaptic] = useState<ReturnType<typeof getHapticService> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAnalytics(getAnalyticsService());
      setUIEffects(getUIEffectsService());
      setHaptic(getHapticService());
    }
  }, []);

  const handleCategoryClick = (category: typeof categories[0]) => {
    // Haptic feedback
    haptic?.tap();
    
    // UI effects
    const element = document.getElementById(`category-${category.id}`);
    if (element && uiEffects) {
      uiEffects.triggerTileCelebration(element, category);
    }

    // Analytics
    analytics?.trackTileClick(category.text, 'home');
    analytics?.trackBoardVisit(category.boardId);

    // Navigate
    setCurrentBoard(category.boardId);
    
    // Speak
    speak(category.text);
  };

  return (
    <div className="tiles-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {categories.map((category) => (
        <motion.div
          key={category.id}
          id={`category-${category.id}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCategoryClick(category)}
          className="category-tile"
          style={{ backgroundColor: category.color }}
        >
          {/* Play button in corner */}
          <div className="play-button">▶</div>
          
          {/* Content */}
          <span className="emoji">{category.emoji}</span>
          <span className="text">{category.text}</span>
        </motion.div>
      ))}
    </div>
  );
}