import { useAppStore } from '@/store/app-store';

export interface PECSTile {
  text: string;
  emoji?: string;
  image?: string;
  speech?: string;
  category?: string;
}

export type PECSBoard = Array<PECSTile>

export function usePECSStore() {
  const { boards } = useAppStore();
  
  // Convert the current board to PECS format
  const currentBoard: PECSBoard = boards.map(board => ({
    text: board.name || board.id,
    emoji: '📋',
    speech: board.name || board.id,
    category: 'General'
  }));

  return {
    currentBoard,
    boards
  };
}