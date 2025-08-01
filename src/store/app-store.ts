import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Tile {
  id: string;
  text: string;
  emoji?: string;
  image?: string;
  speech?: string;
  boardId?: string;
  position: number;
  backgroundColor?: string;
}

interface Board {
  id: string;
  name: string;
  tiles: Tile[];
  category?: string;
  isDefault?: boolean;
}

interface AppState {
  // Core data
  tiles: Tile[];
  boards: Board[];
  currentBoardId: string | null;
  currentBoard: string | null;
  boardHistory: string[];
  sentence: string;
  currentView: 'tiles' | 'eliza' | 'healthcare';
  currentGame: string | null;
  
  // UI state
  isEditMode: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  gridColumns: number;
  tileScale: number;
  
  // Actions
  setTiles: (tiles: Tile[]) => void;
  addTile: (tile: Tile) => void;
  updateTile: (id: string, updates: Partial<Tile>) => void;
  deleteTile: (id: string) => void;
  
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (boardId: string | null) => void;
  navigateBack: () => void;
  
  toggleEditMode: () => void;
  updateSettings: (settings: Partial<AppState>) => void;
  
  // Sentence actions
  addToSentence: (text: string) => void;
  clearSentence: () => void;
  setSentence: (text: string) => void;
  
  // View actions
  setCurrentView: (view: 'tiles' | 'eliza' | 'healthcare') => void;
  
  // Game actions
  setCurrentGame: (gameType: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      tiles: [],
      boards: [],
      currentBoardId: null,
      currentBoard: null,
      boardHistory: [],
      sentence: '',
      currentView: 'tiles',
      currentGame: null,
      
      isEditMode: false,
      speechRate: 1,
      speechPitch: 1,
      speechVolume: 1,
      gridColumns: 3,
      tileScale: 1,
      
      // Actions
      setTiles: (tiles) => set({ tiles }),
      
      addTile: (tile) =>
        set((state) => ({
          tiles: [...state.tiles, tile],
        })),
      
      updateTile: (id, updates) =>
        set((state) => ({
          tiles: state.tiles.map((tile) =>
            tile.id === id ? { ...tile, ...updates } : tile
          ),
        })),
      
      deleteTile: (id) =>
        set((state) => ({
          tiles: state.tiles.filter((tile) => tile.id !== id),
        })),
      
      setBoards: (boards) => set({ boards }),
      
      setCurrentBoard: (board) => set((state) => ({ 
        currentBoard: board,
        currentBoardId: board,
        boardHistory: board ? [...state.boardHistory, state.currentBoard].filter(Boolean) : []
      })),
      
      navigateBack: () => set((state) => {
        const newHistory = [...state.boardHistory];
        const previousBoard = newHistory.pop();
        return {
          currentBoard: previousBoard || null,
          currentBoardId: previousBoard || null,
          boardHistory: newHistory
        };
      }),
      
      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      
      updateSettings: (settings) => set(settings),
      
      // Sentence actions
      addToSentence: (text) => set((state) => ({ 
        sentence: state.sentence ? `${state.sentence} ${text}` : text 
      })),
      
      clearSentence: () => set({ sentence: '' }),
      
      setSentence: (text) => set({ sentence: text }),
      
      // View actions
      setCurrentView: (view) => set({ currentView: view }),
      
      // Game actions
      setCurrentGame: (gameType) => set({ currentGame: gameType }),
    }),
    {
      name: 'tinkybink-storage',
    }
  )
);