export interface Board {
  id: string;
  name: string;
  title?: string;
  tiles: BoardTile[];
  category?: string;
  isDefault?: boolean;
  originalQuestion?: string;
}

export interface BoardTile {
  id: string;
  emoji: string;
  text: string;
  speech?: string;
  color?: string;
  boardId?: string;
  position?: number;
  subcategory?: string;
  action?: string;
  isQuestion?: boolean;
  chirpData?: any;
  questionData?: any;
}

export class BoardManager {
  private boards = new Map<string, Board>();

  constructor() {
    this.initialize();
  }

  initialize() {
    console.log('Board Manager ready');
    this.loadDefaultBoards();
  }

  private loadDefaultBoards() {
    // Home board with categories
    const homeBoard: Board = {
      id: 'home',
      name: 'Home',
      tiles: [
        { id: 'home-1', emoji: '🏠', text: 'HOME/SAFE', speech: 'I am home', color: 'tile-home', subcategory: 'home' },
        { id: 'home-2', emoji: '🤚', text: 'WANT', speech: 'I want', color: 'tile-want', subcategory: 'want' },
        { id: 'home-3', emoji: '❗', text: 'NEED', speech: 'I need', color: 'tile-need', subcategory: 'need' },
        { id: 'home-4', emoji: '😊', text: 'FEEL', speech: 'I feel', color: 'tile-feel', subcategory: 'feelings' },
        { id: 'home-5', emoji: '🎯', text: 'DO', speech: 'I want to do', color: 'tile-do', subcategory: 'activities' },
        { id: 'home-6', emoji: '👥', text: 'PEOPLE', speech: 'people', color: 'tile-people', subcategory: 'people' }
      ],
      isDefault: true
    };

    // Want board
    const wantBoard: Board = {
      id: 'want',
      name: 'I Want',
      tiles: [
        { id: 'want-1', emoji: '🍎', text: 'FOOD', speech: 'I want something to eat', color: 'tile-food', subcategory: 'food' },
        { id: 'want-2', emoji: '🥤', text: 'DRINK', speech: 'I want something to drink', color: 'tile-drink', subcategory: 'drinks' },
        { id: 'want-3', emoji: '🎮', text: 'PLAY', speech: 'I want to play', color: 'tile-play', subcategory: 'games' },
        { id: 'want-4', emoji: '📺', text: 'TV', speech: 'I want to watch TV', color: 'tile-entertainment', subcategory: 'entertainment' },
        { id: 'want-5', emoji: '🚗', text: 'GO', speech: 'I want to go somewhere', color: 'tile-place', subcategory: 'places' },
        { id: 'want-6', emoji: '🤗', text: 'HUG', speech: 'I want a hug', color: 'tile-love' }
      ]
    };

    // Need board
    const needBoard: Board = {
      id: 'need',
      name: 'I Need',
      tiles: [
        { id: 'need-1', emoji: '🚽', text: 'BATHROOM', speech: 'I need the bathroom', color: 'tile-bathroom' },
        { id: 'need-2', emoji: '🆘', text: 'HELP', speech: 'I need help', color: 'tile-help' },
        { id: 'need-3', emoji: '😴', text: 'REST', speech: 'I need to rest', color: 'tile-rest' },
        { id: 'need-4', emoji: '🩹', text: 'MEDICINE', speech: 'I need medicine', color: 'tile-medical' },
        { id: 'need-5', emoji: '🧥', text: 'JACKET', speech: 'I need my jacket', color: 'tile-clothing' },
        { id: 'need-6', emoji: '🎒', text: 'BACKPACK', speech: 'I need my backpack', color: 'tile-things' }
      ]
    };

    // Add boards to manager
    this.addBoard('home', homeBoard);
    this.addBoard('want', wantBoard);
    this.addBoard('need', needBoard);
  }

  addBoard(name: string, board: Board) {
    this.boards.set(name, board);
  }

  getBoard(name: string): Board | undefined {
    return this.boards.get(name);
  }

  getAllBoards(): Array<[string, Board]> {
    return Array.from(this.boards.entries());
  }

  createBoard(board: Board) {
    const id = board.id || `board_${Date.now()}`;
    const newBoard = { ...board, id };
    this.boards.set(id, newBoard);
    this.saveBoards();
    return newBoard;
  }

  updateBoard(id: string, updates: Partial<Board>) {
    const board = this.boards.get(id);
    if (board) {
      const updatedBoard = { ...board, ...updates };
      this.boards.set(id, updatedBoard);
      this.saveBoards();
      return updatedBoard;
    }
    return null;
  }

  deleteBoard(id: string): boolean {
    const deleted = this.boards.delete(id);
    if (deleted) {
      this.saveBoards();
    }
    return deleted;
  }

  private saveBoards() {
    const boardsObject: Record<string, Board> = {};
    this.boards.forEach((board, key) => {
      boardsObject[key] = board;
    });
    localStorage.setItem('tinkybink_boards', JSON.stringify(boardsObject));
  }

  loadBoards() {
    const savedBoards = localStorage.getItem('tinkybink_boards');
    if (savedBoards) {
      try {
        const boardsObject = JSON.parse(savedBoards);
        Object.entries(boardsObject).forEach(([key, board]) => {
          this.boards.set(key, board as Board);
        });
      } catch (error) {
        console.error('Failed to load boards:', error);
      }
    }
  }
}

// Singleton instance
let boardManagerInstance: BoardManager | null = null;

export function getBoardManager(): BoardManager {
  if (!boardManagerInstance) {
    boardManagerInstance = new BoardManager();
  }
  return boardManagerInstance;
}