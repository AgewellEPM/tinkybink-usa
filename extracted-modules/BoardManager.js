class BoardManager {
      constructor() {
        this.boards = new Map();
      }
      
      initialize() {
        console.log('Board Manager ready');
      }
      
      addBoard(name, board) {
        this.boards.set(name, board);
      }
      
      getBoard(name) {
        return this.boards.get(name);
      }
      
      getAllBoards() {
        return Array.from(this.boards.entries());
      }
    }