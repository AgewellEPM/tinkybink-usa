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
  
  toggleEditMode: () => void;
  updateSettings: (settings: Partial<AppState>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      tiles: [],
      boards: [],
      currentBoardId: null,
      
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
      
      setCurrentBoard: (boardId) => set({ currentBoardId: boardId }),
      
      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      
      updateSettings: (settings) => set(settings),
    }),
    {
      name: 'tinkybink-storage',
    }
  )
);