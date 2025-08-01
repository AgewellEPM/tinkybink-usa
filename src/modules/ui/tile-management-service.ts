import { getBoardManager } from '../core/board-manager';
import { BoardTile } from '../core/board-manager';

export class TileManagementService {
  private boardManager: ReturnType<typeof getBoardManager> | null = null;

  initialize() {
    console.log('Tile Management Service ready');
    this.boardManager = getBoardManager();
  }

  createTile(boardId: string, tile: Omit<BoardTile, 'id'>): BoardTile | null {
    if (!this.boardManager) return null;

    const board = this.boardManager.getBoard(boardId);
    if (!board) return null;

    const newTile: BoardTile = {
      ...tile,
      id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: board.tiles.length
    };

    const updatedTiles = [...board.tiles, newTile];
    this.boardManager.updateBoard(boardId, { tiles: updatedTiles });

    return newTile;
  }

  updateTile(boardId: string, tileId: string, updates: Partial<BoardTile>): BoardTile | null {
    if (!this.boardManager) return null;

    const board = this.boardManager.getBoard(boardId);
    if (!board) return null;

    const tileIndex = board.tiles.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return null;

    const updatedTile = { ...board.tiles[tileIndex], ...updates };
    const updatedTiles = [...board.tiles];
    updatedTiles[tileIndex] = updatedTile;

    this.boardManager.updateBoard(boardId, { tiles: updatedTiles });

    return updatedTile;
  }

  deleteTile(boardId: string, tileId: string): boolean {
    if (!this.boardManager) return false;

    const board = this.boardManager.getBoard(boardId);
    if (!board) return false;

    const updatedTiles = board.tiles.filter(t => t.id !== tileId);
    this.boardManager.updateBoard(boardId, { tiles: updatedTiles });

    return true;
  }

  moveTile(boardId: string, tileId: string, newPosition: number): boolean {
    if (!this.boardManager) return false;

    const board = this.boardManager.getBoard(boardId);
    if (!board) return false;

    const tileIndex = board.tiles.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return false;

    const tiles = [...board.tiles];
    const [movedTile] = tiles.splice(tileIndex, 1);
    tiles.splice(newPosition, 0, movedTile);

    // Update positions
    tiles.forEach((tile, index) => {
      tile.position = index;
    });

    this.boardManager.updateBoard(boardId, { tiles });

    return true;
  }

  duplicateTile(boardId: string, tileId: string): BoardTile | null {
    if (!this.boardManager) return null;

    const board = this.boardManager.getBoard(boardId);
    if (!board) return null;

    const tileToDuplicate = board.tiles.find(t => t.id === tileId);
    if (!tileToDuplicate) return null;

    const newTile: BoardTile = {
      ...tileToDuplicate,
      id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: `${tileToDuplicate.text} (Copy)`,
      position: board.tiles.length
    };

    const updatedTiles = [...board.tiles, newTile];
    this.boardManager.updateBoard(boardId, { tiles: updatedTiles });

    return newTile;
  }

  getTile(boardId: string, tileId: string): BoardTile | null {
    if (!this.boardManager) return null;

    const board = this.boardManager.getBoard(boardId);
    if (!board) return null;

    return board.tiles.find(t => t.id === tileId) || null;
  }

  getAllTiles(boardId: string): BoardTile[] {
    if (!this.boardManager) return [];

    const board = this.boardManager.getBoard(boardId);
    return board ? board.tiles : [];
  }

  searchTiles(query: string): Array<{ tile: BoardTile; boardId: string }> {
    if (!this.boardManager) return [];

    const results: Array<{ tile: BoardTile; boardId: string }> = [];
    const searchTerm = query.toLowerCase();

    for (const [boardId, board] of this.boardManager.getAllBoards()) {
      for (const tile of board.tiles) {
        if (
          tile.text.toLowerCase().includes(searchTerm) ||
          (tile.speech && tile.speech.toLowerCase().includes(searchTerm)) ||
          tile.emoji.includes(searchTerm)
        ) {
          results.push({ tile, boardId });
        }
      }
    }

    return results;
  }

  // Batch operations
  batchCreateTiles(boardId: string, tiles: Array<Omit<BoardTile, 'id'>>): BoardTile[] {
    const createdTiles: BoardTile[] = [];

    for (const tile of tiles) {
      const created = this.createTile(boardId, tile);
      if (created) {
        createdTiles.push(created);
      }
    }

    return createdTiles;
  }

  batchDeleteTiles(boardId: string, tileIds: string[]): number {
    let deletedCount = 0;

    for (const tileId of tileIds) {
      if (this.deleteTile(boardId, tileId)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Validation
  validateTile(tile: Partial<BoardTile>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tile.text || tile.text.trim().length === 0) {
      errors.push('Tile text is required');
    }

    if (!tile.emoji || tile.emoji.length === 0) {
      errors.push('Tile emoji is required');
    }

    if (tile.text && tile.text.length > 50) {
      errors.push('Tile text must be less than 50 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
let tileManagementInstance: TileManagementService | null = null;

export function getTileManagementService(): TileManagementService {
  if (!tileManagementInstance) {
    tileManagementInstance = new TileManagementService();
  }
  return tileManagementInstance;
}