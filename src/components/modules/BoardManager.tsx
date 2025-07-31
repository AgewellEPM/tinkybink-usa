'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Plus, Volume2 } from 'lucide-react';
import { defaultTiles } from '@/lib/default-tiles';

export function BoardManager() {
  const {
    tiles,
    isEditMode,
    gridColumns,
    tileScale,
    setTiles,
    updateTile,
    deleteTile,
    addTile,
  } = useAppStore();

  // Load default tiles on first load
  useEffect(() => {
    if (tiles.length === 0) {
      setTiles(defaultTiles);
    }
  }, [tiles.length, setTiles]);

  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = useAppStore.getState().speechRate;
      utterance.pitch = useAppStore.getState().speechPitch;
      utterance.volume = useAppStore.getState().speechVolume;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const handleTileClick = useCallback(
    (tile: typeof tiles[0]) => {
      if (isEditMode) {
        setSelectedTile(tile.id);
      } else {
        speak(tile.speech || tile.text);
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    },
    [isEditMode, speak]
  );

  const createNewTile = useCallback(() => {
    const newTile = {
      id: `tile-${Date.now()}`,
      text: 'New Tile',
      emoji: '➕',
      position: tiles.length,
      speech: 'New Tile',
    };
    addTile(newTile);
  }, [tiles.length, addTile]);

  return (
    <div className="board-container p-4">
      <div
        className="grid gap-4 transition-all duration-300"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
        }}
      >
        <AnimatePresence mode="popLayout">
          {tiles.map((tile) => (
            <motion.div
              key={tile.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`tile relative rounded-lg p-4 cursor-pointer transition-all ${
                selectedTile === tile.id ? 'ring-4 ring-purple-500' : ''
              }`}
              style={{
                backgroundColor: tile.backgroundColor || '#7b3ff2',
                transform: `scale(${tileScale})`,
              }}
              onClick={() => handleTileClick(tile)}
            >
              {/* Tile Content */}
              <div className="flex flex-col items-center justify-center h-full">
                {tile.image ? (
                  <img
                    src={tile.image}
                    alt={tile.text}
                    className="w-16 h-16 object-contain mb-2"
                  />
                ) : (
                  <span className="text-4xl mb-2">{tile.emoji}</span>
                )}
                <span className="text-white text-center font-medium">
                  {tile.text}
                </span>
              </div>

              {/* Edit Mode Controls */}
              {isEditMode && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open edit modal
                    }}
                    className="p-1 bg-white/20 rounded hover:bg-white/30"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTile(tile.id);
                    }}
                    className="p-1 bg-red-500/20 rounded hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Speech indicator */}
              <div className="absolute bottom-2 right-2">
                <Volume2 size={16} className="text-white/60" />
              </div>
            </motion.div>
          ))}

          {/* Add New Tile Button */}
          {isEditMode && (
            <motion.button
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={createNewTile}
              className="tile-add border-2 border-dashed border-gray-400 rounded-lg p-4 cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all flex items-center justify-center"
              style={{
                minHeight: '120px',
                transform: `scale(${tileScale})`,
              }}
            >
              <Plus size={32} className="text-gray-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}