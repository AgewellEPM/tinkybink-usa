'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { defaultBoards } from '@/data/boards';

export function BoardView() {
  const { currentBoard, addToSentence, gridColumns, tileScale } = useAppStore();

  if (!currentBoard || !defaultBoards[currentBoard]) {
    return null;
  }

  const board = defaultBoards[currentBoard];

  const handleTileClick = (tile: typeof board.tiles[0]) => {
    // Add to sentence
    addToSentence(tile.text);
    
    // Speak immediately
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(tile.speech);
      const { speechRate, speechPitch, speechVolume } = useAppStore.getState();
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      utterance.volume = speechVolume;
      speechSynthesis.speak(utterance);
    }

    // Navigate to subcategory if exists
    if (tile.subcategory) {
      useAppStore.getState().setCurrentBoard(tile.subcategory);
    }
  };

  return (
    <div className="board-container">
      <h2 className="board-title">{board.title}</h2>
      <div 
        className="tiles-grid" 
        style={{ 
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          transform: `scale(${tileScale})`
        }}
      >
        {board.tiles.map((tile, index) => (
          <motion.div
            key={tile.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTileClick(tile)}
            className="tile"
            style={{ backgroundColor: tile.color }}
          >
            <div className="play-button">▶</div>
            <span className="emoji">{tile.emoji}</span>
            <span className="text">{tile.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}