/**
 * Shared Boards Service
 * Module 30: Enable multiple users to collaborate on the same board in real-time
 */

interface SharedBoard {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  collaborators: BoardCollaborator[];
  tiles: SharedTile[];
  settings: BoardSettings;
  version: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface BoardCollaborator {
  userId: string;
  userName: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: BoardPermissions;
  joinedAt: string;
  lastActivity: string;
  cursor?: { x: number; y: number };
  selection?: string[];
}

interface BoardPermissions {
  canAddTiles: boolean;
  canEditTiles: boolean;
  canDeleteTiles: boolean;
  canMoveBoard: boolean;
  canInviteUsers: boolean;
  canChangeSettings: boolean;
  canManageCollaborators: boolean;
}

interface SharedTile {
  id: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  fontSize: number;
  locked: boolean;
  lockedBy?: string;
  version: number;
  lastEditedBy: string;
  lastEditedAt: string;
  metadata?: any;
}

interface BoardSettings {
  backgroundColor: string;
  gridSize: number;
  snapToGrid: boolean;
  allowRealtimeSync: boolean;
  showCursors: boolean;
  enableLocking: boolean;
  autoSave: boolean;
  maxCollaborators: number;
}

interface BoardChange {
  id: string;
  boardId: string;
  userId: string;
  type: 'tile_add' | 'tile_edit' | 'tile_delete' | 'tile_move' | 'board_settings' | 'user_cursor';
  data: any;
  timestamp: string;
  version: number;
}

interface ConflictResolution {
  changeId: string;
  conflictType: 'version' | 'lock' | 'permission';
  resolution: 'accept_remote' | 'accept_local' | 'merge' | 'reject';
  mergedData?: any;
}

export class SharedBoardsService {
  private static instance: SharedBoardsService;
  private activeBoard: SharedBoard | null = null;
  private collaborators: Map<string, BoardCollaborator> = new Map();
  private pendingChanges: Map<string, BoardChange> = new Map();
  private changeHistory: BoardChange[] = [];
  private conflictQueue: ConflictResolution[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private cursors: Map<string, { x: number; y: number }> = new Map();
  private isConnected = false;

  private constructor() {
    this.setupBoardSync();
  }

  static getInstance(): SharedBoardsService {
    if (!SharedBoardsService.instance) {
      SharedBoardsService.instance = new SharedBoardsService();
    }
    return SharedBoardsService.instance;
  }

  initialize(): void {
    console.log('🎯 Shared Boards Service initialized');
    this.startSyncInterval();
  }

  /**
   * Create a new shared board
   */
  async createSharedBoard(name: string, description?: string): Promise<SharedBoard> {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const boardId = `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const defaultSettings: BoardSettings = {
      backgroundColor: '#ffffff',
      gridSize: 20,
      snapToGrid: true,
      allowRealtimeSync: true,
      showCursors: true,
      enableLocking: true,
      autoSave: true,
      maxCollaborators: 10
    };

    const ownerCollaborator: BoardCollaborator = {
      userId: currentUser.id,
      userName: currentUser.name,
      role: 'owner',
      permissions: {
        canAddTiles: true,
        canEditTiles: true,
        canDeleteTiles: true,
        canMoveBoard: true,
        canInviteUsers: true,
        canChangeSettings: true,
        canManageCollaborators: true
      },
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    const sharedBoard: SharedBoard = {
      id: boardId,
      name,
      description,
      ownerId: currentUser.id,
      collaborators: [ownerCollaborator],
      tiles: [],
      settings: defaultSettings,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Save board locally
    this.saveBoard(sharedBoard);

    // Broadcast board creation
    this.broadcastBoardChange('board_created', sharedBoard);

    console.log(`🎯 Created shared board: ${name}`);
    return sharedBoard;
  }

  /**
   * Join an existing shared board
   */
  async joinSharedBoard(boardId: string, inviteCode?: string): Promise<SharedBoard> {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Load board (in production, fetch from server)
    const board = await this.loadBoard(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check if already a collaborator
    const existingCollaborator = board.collaborators.find(c => c.userId === currentUser.id);
    if (existingCollaborator) {
      this.activeBoard = board;
      this.setupCollaborators();
      return board;
    }

    // Check capacity
    if (board.collaborators.length >= board.settings.maxCollaborators) {
      throw new Error('Board has reached maximum collaborators');
    }

    // Add as collaborator
    const newCollaborator: BoardCollaborator = {
      userId: currentUser.id,
      userName: currentUser.name,
      role: 'editor',
      permissions: {
        canAddTiles: true,
        canEditTiles: true,
        canDeleteTiles: false,
        canMoveBoard: false,
        canInviteUsers: false,
        canChangeSettings: false,
        canManageCollaborators: false
      },
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    board.collaborators.push(newCollaborator);
    board.version++;
    board.updatedAt = new Date().toISOString();

    this.activeBoard = board;
    this.setupCollaborators();

    // Notify other collaborators
    this.broadcastBoardChange('user_joined', { userId: currentUser.id, userName: currentUser.name });

    console.log(`🚀 Joined shared board: ${board.name}`);
    return board;
  }

  /**
   * Leave shared board
   */
  leaveSharedBoard(): void {
    if (!this.activeBoard) return;

    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    if (currentUser) {
      // Remove from collaborators
      this.activeBoard.collaborators = this.activeBoard.collaborators.filter(
        c => c.userId !== currentUser.id
      );

      // Notify others
      this.broadcastBoardChange('user_left', { userId: currentUser.id });
    }

    // Clear local state
    this.activeBoard = null;
    this.collaborators.clear();
    this.cursors.clear();

    console.log('👋 Left shared board');
  }

  /**
   * Add tile to shared board
   */
  async addTile(tileData: Omit<SharedTile, 'id' | 'version' | 'lastEditedBy' | 'lastEditedAt'>): Promise<SharedTile> {
    if (!this.activeBoard || !this.canAddTiles()) {
      throw new Error('Cannot add tiles to this board');
    }

    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    const tile: SharedTile = {
      ...tileData,
      id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
      lastEditedBy: currentUser?.id || 'unknown',
      lastEditedAt: new Date().toISOString(),
      locked: false
    };

    // Add to board
    this.activeBoard.tiles.push(tile);
    this.activeBoard.version++;
    this.activeBoard.updatedAt = new Date().toISOString();

    // Create change record
    const change: BoardChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      boardId: this.activeBoard.id,
      userId: currentUser?.id || 'unknown',
      type: 'tile_add',
      data: tile,
      timestamp: new Date().toISOString(),
      version: this.activeBoard.version
    };

    this.recordChange(change);
    this.broadcastChange(change);

    console.log(`➕ Added tile: ${tile.text}`);
    return tile;
  }

  /**
   * Edit tile on shared board
   */
  async editTile(tileId: string, updates: Partial<SharedTile>): Promise<SharedTile> {
    if (!this.activeBoard || !this.canEditTiles()) {
      throw new Error('Cannot edit tiles on this board');
    }

    const tile = this.activeBoard.tiles.find(t => t.id === tileId);
    if (!tile) {
      throw new Error('Tile not found');
    }

    // Check if tile is locked by another user
    if (tile.locked && tile.lockedBy !== this.getCurrentUserId()) {
      throw new Error('Tile is locked by another user');
    }

    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    // Apply updates
    Object.assign(tile, updates, {
      version: tile.version + 1,
      lastEditedBy: currentUser?.id || 'unknown',
      lastEditedAt: new Date().toISOString()
    });

    this.activeBoard.version++;
    this.activeBoard.updatedAt = new Date().toISOString();

    // Create change record
    const change: BoardChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      boardId: this.activeBoard.id,
      userId: currentUser?.id || 'unknown',
      type: 'tile_edit',
      data: { tileId, updates },
      timestamp: new Date().toISOString(),
      version: this.activeBoard.version
    };

    this.recordChange(change);
    this.broadcastChange(change);

    console.log(`✏️ Edited tile: ${tile.text}`);
    return tile;
  }

  /**
   * Delete tile from shared board
   */
  async deleteTile(tileId: string): Promise<void> {
    if (!this.activeBoard || !this.canDeleteTiles()) {
      throw new Error('Cannot delete tiles from this board');
    }

    const tileIndex = this.activeBoard.tiles.findIndex(t => t.id === tileId);
    if (tileIndex === -1) {
      throw new Error('Tile not found');
    }

    const tile = this.activeBoard.tiles[tileIndex];

    // Check if tile is locked by another user
    if (tile.locked && tile.lockedBy !== this.getCurrentUserId()) {
      throw new Error('Tile is locked by another user');
    }

    // Remove tile
    this.activeBoard.tiles.splice(tileIndex, 1);
    this.activeBoard.version++;
    this.activeBoard.updatedAt = new Date().toISOString();

    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    // Create change record
    const change: BoardChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      boardId: this.activeBoard.id,
      userId: currentUser?.id || 'unknown',
      type: 'tile_delete',
      data: { tileId },
      timestamp: new Date().toISOString(),
      version: this.activeBoard.version
    };

    this.recordChange(change);
    this.broadcastChange(change);

    console.log(`🗑️ Deleted tile: ${tile.text}`);
  }

  /**
   * Lock tile for editing
   */
  lockTile(tileId: string): boolean {
    if (!this.activeBoard) return false;

    const tile = this.activeBoard.tiles.find(t => t.id === tileId);
    if (!tile || tile.locked) return false;

    tile.locked = true;
    tile.lockedBy = this.getCurrentUserId();

    this.broadcastBoardChange('tile_locked', { tileId, lockedBy: tile.lockedBy });
    return true;
  }

  /**
   * Unlock tile
   */
  unlockTile(tileId: string): boolean {
    if (!this.activeBoard) return false;

    const tile = this.activeBoard.tiles.find(t => t.id === tileId);
    if (!tile || !tile.locked || tile.lockedBy !== this.getCurrentUserId()) return false;

    tile.locked = false;
    tile.lockedBy = undefined;

    this.broadcastBoardChange('tile_unlocked', { tileId });
    return true;
  }

  /**
   * Update cursor position
   */
  updateCursorPosition(x: number, y: number): void {
    if (!this.activeBoard || !this.activeBoard.settings.showCursors) return;

    const userId = this.getCurrentUserId();
    if (!userId) return;

    this.cursors.set(userId, { x, y });

    // Update collaborator cursor
    const collaborator = this.collaborators.get(userId);
    if (collaborator) {
      collaborator.cursor = { x, y };
    }

    // Broadcast cursor update
    this.broadcastBoardChange('user_cursor', { userId, x, y });
  }

  /**
   * Invite user to board
   */
  async inviteUser(userId: string, role: 'editor' | 'viewer' = 'editor'): Promise<void> {
    if (!this.activeBoard || !this.canInviteUsers()) {
      throw new Error('Cannot invite users to this board');
    }

    // Check if user is already a collaborator
    if (this.activeBoard.collaborators.some(c => c.userId === userId)) {
      throw new Error('User is already a collaborator');
    }

    // Send invitation through collaboration service
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'board_invitation',
        boardId: this.activeBoard.id,
        boardName: this.activeBoard.name,
        invitedUserId: userId,
        role,
        invitedBy: this.getCurrentUserId()
      });
    }

    console.log(`📧 Invited user ${userId} to board as ${role}`);
  }

  /**
   * Setup board synchronization
   */
  private setupBoardSync(): void {
    if (typeof window === 'undefined') return;

    // Listen for collaboration messages
    window.addEventListener('collaboration_message', (event: any) => {
      this.handleCollaborationMessage(event.detail);
    });

    // Track mouse movement for cursor sharing
    document.addEventListener('mousemove', (event) => {
      if (this.activeBoard?.settings.showCursors) {
        this.updateCursorPosition(event.clientX, event.clientY);
      }
    });
  }

  /**
   * Handle collaboration messages
   */
  private handleCollaborationMessage(message: any): void {
    switch (message.type) {
      case 'board_change':
        this.applyRemoteChange(message.change);
        break;
        
      case 'user_joined':
        this.handleUserJoined(message.data);
        break;
        
      case 'user_left':
        this.handleUserLeft(message.data);
        break;
        
      case 'user_cursor':
        this.updateRemoteCursor(message.data);
        break;
        
      case 'tile_locked':
        this.handleTileLocked(message.data);
        break;
        
      case 'tile_unlocked':
        this.handleTileUnlocked(message.data);
        break;
    }
  }

  /**
   * Apply remote change to board
   */
  private applyRemoteChange(change: BoardChange): void {
    if (!this.activeBoard || change.boardId !== this.activeBoard.id) return;

    // Check for conflicts
    const conflict = this.detectConflict(change);
    if (conflict) {
      this.resolveConflict(conflict);
      return;
    }

    // Apply change based on type
    switch (change.type) {
      case 'tile_add':
        this.activeBoard.tiles.push(change.data);
        break;
        
      case 'tile_edit':
        const tile = this.activeBoard.tiles.find(t => t.id === change.data.tileId);
        if (tile) {
          Object.assign(tile, change.data.updates);
        }
        break;
        
      case 'tile_delete':
        this.activeBoard.tiles = this.activeBoard.tiles.filter(t => t.id !== change.data.tileId);
        break;
        
      case 'board_settings':
        Object.assign(this.activeBoard.settings, change.data);
        break;
    }

    this.activeBoard.version = Math.max(this.activeBoard.version, change.version);
    this.recordChange(change);
  }

  /**
   * Detect conflicts in changes
   */
  private detectConflict(remoteChange: BoardChange): ConflictResolution | null {
    // Check version conflicts
    if (remoteChange.version <= this.activeBoard!.version) {
      return {
        changeId: remoteChange.id,
        conflictType: 'version',
        resolution: 'accept_remote' // Simple resolution strategy
      };
    }

    // Check lock conflicts
    if (remoteChange.type === 'tile_edit' || remoteChange.type === 'tile_delete') {
      const tile = this.activeBoard!.tiles.find(t => t.id === remoteChange.data.tileId);
      if (tile?.locked && tile.lockedBy !== remoteChange.userId) {
        return {
          changeId: remoteChange.id,
          conflictType: 'lock',
          resolution: 'reject'
        };
      }
    }

    return null;
  }

  /**
   * Resolve conflicts
   */
  private resolveConflict(conflict: ConflictResolution): void {
    // Add conflict to resolution queue
    this.conflictQueue.push(conflict);
    
    // Simple resolution for now - in production, would have more sophisticated strategies
    console.log(`⚠️ Conflict detected: ${conflict.conflictType}, resolution: ${conflict.resolution}`);
  }

  /**
   * Setup collaborators
   */
  private setupCollaborators(): void {
    if (!this.activeBoard) return;

    this.collaborators.clear();
    this.activeBoard.collaborators.forEach(collaborator => {
      this.collaborators.set(collaborator.userId, collaborator);
    });
  }

  /**
   * Handle user joined
   */
  private handleUserJoined(data: any): void {
    console.log(`👋 User joined board: ${data.userName}`);
    // Update UI to show new collaborator
  }

  /**
   * Handle user left
   */
  private handleUserLeft(data: any): void {
    this.collaborators.delete(data.userId);
    this.cursors.delete(data.userId);
    console.log(`👋 User left board: ${data.userId}`);
  }

  /**
   * Update remote cursor
   */
  private updateRemoteCursor(data: any): void {
    if (data.userId === this.getCurrentUserId()) return;

    this.cursors.set(data.userId, { x: data.x, y: data.y });
    
    // Update cursor visualization
    this.renderCursor(data.userId, data.x, data.y);
  }

  /**
   * Render collaborator cursor
   */
  private renderCursor(userId: string, x: number, y: number): void {
    if (typeof document === 'undefined') return;

    let cursor = document.getElementById(`cursor-${userId}`);
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = `cursor-${userId}`;
      cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: hsl(${userId.charCodeAt(0) * 10}, 70%, 50%);
        border: 2px solid white;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        transition: all 0.1s ease;
      `;
      
      // Add user name label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: 25px;
        left: 50%;
        transform: translateX(-50%);
        background: hsl(${userId.charCodeAt(0) * 10}, 70%, 50%);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        white-space: nowrap;
      `;
      
      const collaborator = this.collaborators.get(userId);
      label.textContent = collaborator?.userName || 'User';
      cursor.appendChild(label);
      
      document.body.appendChild(cursor);
    }

    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
  }

  /**
   * Handle tile locked
   */
  private handleTileLocked(data: any): void {
    const tile = this.activeBoard?.tiles.find(t => t.id === data.tileId);
    if (tile) {
      tile.locked = true;
      tile.lockedBy = data.lockedBy;
    }
  }

  /**
   * Handle tile unlocked
   */
  private handleTileUnlocked(data: any): void {
    const tile = this.activeBoard?.tiles.find(t => t.id === data.tileId);
    if (tile) {
      tile.locked = false;
      tile.lockedBy = undefined;
    }
  }

  /**
   * Record change in history
   */
  private recordChange(change: BoardChange): void {
    this.changeHistory.push(change);
    
    // Keep only last 100 changes
    if (this.changeHistory.length > 100) {
      this.changeHistory = this.changeHistory.slice(-100);
    }
  }

  /**
   * Broadcast change to other collaborators
   */
  private broadcastChange(change: BoardChange): void {
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'board_change',
        change
      });
    }
  }

  /**
   * Broadcast board event
   */
  private broadcastBoardChange(type: string, data: any): void {
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type,
        data,
        boardId: this.activeBoard?.id
      });
    }
  }

  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.activeBoard && this.isConnected) {
        this.syncBoard();
      }
    }, 5000); // Sync every 5 seconds
  }

  /**
   * Sync board with remote
   */
  private syncBoard(): void {
    if (!this.activeBoard) return;

    // Save board state
    this.saveBoard(this.activeBoard);
    
    // Process pending changes
    this.processPendingChanges();
  }

  /**
   * Process pending changes
   */
  private processPendingChanges(): void {
    this.pendingChanges.forEach((change, changeId) => {
      // Apply pending change
      this.applyRemoteChange(change);
      this.pendingChanges.delete(changeId);
    });
  }

  /**
   * Save board to storage
   */
  private saveBoard(board: SharedBoard): void {
    if (typeof window === 'undefined') return;

    try {
      const boards = this.getSavedBoards();
      const existingIndex = boards.findIndex(b => b.id === board.id);
      
      if (existingIndex >= 0) {
        boards[existingIndex] = board;
      } else {
        boards.push(board);
      }

      localStorage.setItem('shared_boards', JSON.stringify(boards));
    } catch (error) {
      console.error('Failed to save board:', error);
    }
  }

  /**
   * Load board from storage
   */
  private async loadBoard(boardId: string): Promise<SharedBoard | null> {
    if (typeof window === 'undefined') return null;

    try {
      const boards = this.getSavedBoards();
      return boards.find(b => b.id === boardId) || null;
    } catch (error) {
      console.error('Failed to load board:', error);
      return null;
    }
  }

  /**
   * Get saved boards
   */
  private getSavedBoards(): SharedBoard[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem('shared_boards');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load boards:', error);
      return [];
    }
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    return multiUserService?.getCurrentUser()?.id || '';
  }

  /**
   * Permission checks
   */
  private canAddTiles(): boolean {
    const userId = this.getCurrentUserId();
    const collaborator = this.collaborators.get(userId);
    return collaborator?.permissions.canAddTiles || false;
  }

  private canEditTiles(): boolean {
    const userId = this.getCurrentUserId();
    const collaborator = this.collaborators.get(userId);
    return collaborator?.permissions.canEditTiles || false;
  }

  private canDeleteTiles(): boolean {
    const userId = this.getCurrentUserId();
    const collaborator = this.collaborators.get(userId);
    return collaborator?.permissions.canDeleteTiles || false;
  }

  private canInviteUsers(): boolean {
    const userId = this.getCurrentUserId();
    const collaborator = this.collaborators.get(userId);
    return collaborator?.permissions.canInviteUsers || false;
  }

  /**
   * Get active board
   */
  getActiveBoard(): SharedBoard | null {
    return this.activeBoard;
  }

  /**
   * Get board collaborators
   */
  getCollaborators(): BoardCollaborator[] {
    return Array.from(this.collaborators.values());
  }

  /**
   * Get board changes history
   */
  getChangeHistory(): BoardChange[] {
    return this.changeHistory;
  }

  /**
   * Get all saved boards
   */
  getAllBoards(): SharedBoard[] {
    return this.getSavedBoards();
  }

  /**
   * Delete board
   */
  deleteBoard(boardId: string): void {
    const boards = this.getSavedBoards();
    const updatedBoards = boards.filter(b => b.id !== boardId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('shared_boards', JSON.stringify(updatedBoards));
    }

    if (this.activeBoard?.id === boardId) {
      this.leaveSharedBoard();
    }

    console.log(`🗑️ Deleted board: ${boardId}`);
  }
}

// Export singleton getter function
export function getSharedBoardsService(): SharedBoardsService {
  return SharedBoardsService.getInstance();
}