/**
 * Board Sharing Service
 * Module 38: Share boards with others via links, QR codes, and collaboration
 */

interface ShareableBoard {
  id: string;
  boardId: string;
  name: string;
  description: string;
  shareCode: string;
  shareUrl: string;
  qrCodeUrl: string;
  permissions: SharePermissions;
  owner: string;
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  isPublic: boolean;
  tags: string[];
}

interface SharePermissions {
  canView: boolean;
  canCopy: boolean;
  canEdit: boolean;
  canShare: boolean;
  requiresAuth: boolean;
  allowedUsers?: string[];
  allowedDomains?: string[];
}

interface ShareRecipient {
  id: string;
  email: string;
  name?: string;
  permissions: SharePermissions;
  sharedAt: string;
  lastAccessed?: string;
  accessCount: number;
}

interface ShareLink {
  id: string;
  boardId: string;
  url: string;
  shortCode: string;
  type: 'temporary' | 'permanent' | 'one-time';
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  password?: string;
  isActive: boolean;
}

interface BoardCatalogEntry {
  id: string;
  boardId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  rating: number;
  downloads: number;
  previewUrl?: string;
  isFeatured: boolean;
  publishedAt: string;
}

export class BoardSharingService {
  private static instance: BoardSharingService;
  private sharedBoards: Map<string, ShareableBoard> = new Map();
  private shareLinks: Map<string, ShareLink> = new Map();
  private recipients: Map<string, ShareRecipient[]> = new Map();
  private publicCatalog: Map<string, BoardCatalogEntry> = new Map();
  private baseShareUrl = 'https://tinkybink.app/board/';

  private constructor() {
    this.initializeDefaultCatalog();
  }

  static getInstance(): BoardSharingService {
    if (!BoardSharingService.instance) {
      BoardSharingService.instance = new BoardSharingService();
    }
    return BoardSharingService.instance;
  }

  initialize(): void {
    console.log('🔗 Board Sharing Service ready - Share and collaborate on boards');
    this.loadSharedBoards();
    this.setupDeepLinkHandling();
  }

  /**
   * Share a board
   */
  async shareBoard(boardId: string, permissions: Partial<SharePermissions> = {}): Promise<ShareableBoard> {
    try {
      const boardManager = (window as any).moduleSystem?.get('BoardManager');
      const board = boardManager?.getBoard(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }

      const authService = (window as any).moduleSystem?.get('AuthService');
      const currentUser = authService?.getCurrentUser();

      const shareCode = this.generateShareCode();
      const shareUrl = `${this.baseShareUrl}${shareCode}`;
      
      const defaultPermissions: SharePermissions = {
        canView: true,
        canCopy: true,
        canEdit: false,
        canShare: false,
        requiresAuth: false
      };

      const shareableBoard: ShareableBoard = {
        id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        boardId,
        name: board.name,
        description: board.description || '',
        shareCode,
        shareUrl,
        qrCodeUrl: await this.generateQRCode(shareUrl),
        permissions: { ...defaultPermissions, ...permissions },
        owner: currentUser?.id || 'anonymous',
        createdAt: new Date().toISOString(),
        accessCount: 0,
        isPublic: false,
        tags: board.tags || []
      };

      this.sharedBoards.set(shareCode, shareableBoard);
      this.saveSharedBoards();

      // Track sharing
      const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
      if (analyticsService) {
        analyticsService.trackEvent('board_shared', {
          boardId,
          shareCode,
          permissions: shareableBoard.permissions
        });
      }

      console.log(`🔗 Board shared: ${board.name} (${shareCode})`);
      return shareableBoard;

    } catch (error) {
      console.error('Failed to share board:', error);
      throw error;
    }
  }

  /**
   * Create a share link with specific settings
   */
  async createShareLink(
    boardId: string,
    type: ShareLink['type'] = 'permanent',
    options: {
      expiresIn?: number; // hours
      maxUses?: number;
      password?: string;
      permissions?: Partial<SharePermissions>;
    } = {}
  ): Promise<ShareLink> {
    const shortCode = this.generateShortCode();
    const url = `${this.baseShareUrl}link/${shortCode}`;

    const shareLink: ShareLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      boardId,
      url,
      shortCode,
      type,
      expiresAt: options.expiresIn ? 
        new Date(Date.now() + options.expiresIn * 60 * 60 * 1000).toISOString() : 
        undefined,
      maxUses: options.maxUses,
      currentUses: 0,
      password: options.password ? await this.hashPassword(options.password) : undefined,
      isActive: true
    };

    this.shareLinks.set(shortCode, shareLink);
    
    // Also create a shareable board entry
    await this.shareBoard(boardId, options.permissions);

    console.log(`🔗 Created share link: ${url}`);
    return shareLink;
  }

  /**
   * Share board via email
   */
  async shareViaEmail(
    boardId: string,
    recipients: string[],
    message?: string,
    permissions?: Partial<SharePermissions>
  ): Promise<boolean> {
    try {
      const shareableBoard = await this.shareBoard(boardId, permissions);
      
      recipients.forEach(email => {
        const recipient: ShareRecipient = {
          id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          permissions: shareableBoard.permissions,
          sharedAt: new Date().toISOString(),
          accessCount: 0
        };

        const boardRecipients = this.recipients.get(boardId) || [];
        boardRecipients.push(recipient);
        this.recipients.set(boardId, boardRecipients);
      });

      // Send email (mock implementation)
      await this.sendShareEmail(recipients, shareableBoard, message);

      console.log(`📧 Board shared via email to ${recipients.length} recipients`);
      return true;

    } catch (error) {
      console.error('Failed to share via email:', error);
      return false;
    }
  }

  /**
   * Publish board to public catalog
   */
  async publishToCatalog(
    boardId: string,
    category: string,
    description: string,
    tags: string[] = []
  ): Promise<BoardCatalogEntry> {
    const boardManager = (window as any).moduleSystem?.get('BoardManager');
    const board = boardManager?.getBoard(boardId);
    
    if (!board) {
      throw new Error('Board not found');
    }

    const authService = (window as any).moduleSystem?.get('AuthService');
    const currentUser = authService?.getCurrentUser();

    // Create public share
    const shareableBoard = await this.shareBoard(boardId, {
      canView: true,
      canCopy: true,
      canEdit: false,
      canShare: true,
      requiresAuth: false
    });

    shareableBoard.isPublic = true;

    const catalogEntry: BoardCatalogEntry = {
      id: `catalog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      boardId,
      name: board.name,
      description,
      category,
      tags,
      author: currentUser?.name || 'Anonymous',
      rating: 0,
      downloads: 0,
      previewUrl: await this.generateBoardPreview(board),
      isFeatured: false,
      publishedAt: new Date().toISOString()
    };

    this.publicCatalog.set(catalogEntry.id, catalogEntry);
    this.saveCatalog();

    console.log(`📚 Board published to catalog: ${board.name}`);
    return catalogEntry;
  }

  /**
   * Get boards from public catalog
   */
  getCatalogBoards(
    category?: string,
    sortBy: 'popular' | 'recent' | 'rating' = 'popular',
    limit = 20
  ): BoardCatalogEntry[] {
    let boards = Array.from(this.publicCatalog.values());

    // Filter by category
    if (category) {
      boards = boards.filter(board => board.category === category);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        boards.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'recent':
        boards.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        break;
      case 'rating':
        boards.sort((a, b) => b.rating - a.rating);
        break;
    }

    return boards.slice(0, limit);
  }

  /**
   * Import shared board
   */
  async importSharedBoard(shareCodeOrUrl: string): Promise<string | null> {
    try {
      const shareCode = this.extractShareCode(shareCodeOrUrl);
      const shareableBoard = this.sharedBoards.get(shareCode);
      
      if (!shareableBoard) {
        // Try to fetch from link
        const shareLink = this.shareLinks.get(shareCode);
        if (!shareLink || !shareLink.isActive) {
          throw new Error('Invalid or expired share code');
        }

        // Check link constraints
        if (shareLink.type === 'one-time' && shareLink.currentUses > 0) {
          throw new Error('This link has already been used');
        }

        if (shareLink.maxUses && shareLink.currentUses >= shareLink.maxUses) {
          throw new Error('This link has reached its usage limit');
        }

        if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
          shareLink.isActive = false;
          throw new Error('This link has expired');
        }

        // Update usage
        shareLink.currentUses++;
      }

      // Check permissions
      if (shareableBoard?.permissions.requiresAuth) {
        const authService = (window as any).moduleSystem?.get('AuthService');
        if (!authService?.isAuthenticated()) {
          throw new Error('Authentication required to import this board');
        }
      }

      // Copy board
      const boardManager = (window as any).moduleSystem?.get('BoardManager');
      const originalBoard = boardManager?.getBoard(shareableBoard?.boardId || shareLink?.boardId);
      
      if (!originalBoard) {
        throw new Error('Original board not found');
      }

      const copiedBoardId = await boardManager.copyBoard(
        originalBoard.id,
        `${originalBoard.name} (Imported)`
      );

      // Update access count
      if (shareableBoard) {
        shareableBoard.accessCount++;
      }

      // Track import
      const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
      if (analyticsService) {
        analyticsService.trackEvent('board_imported', {
          shareCode,
          boardId: copiedBoardId
        });
      }

      console.log(`📥 Board imported: ${originalBoard.name}`);
      return copiedBoardId;

    } catch (error) {
      console.error('Failed to import board:', error);
      throw error;
    }
  }

  /**
   * Revoke share access
   */
  revokeShare(shareCode: string): boolean {
    const shareableBoard = this.sharedBoards.get(shareCode);
    if (!shareableBoard) return false;

    // Check ownership
    const authService = (window as any).moduleSystem?.get('AuthService');
    const currentUser = authService?.getCurrentUser();
    
    if (shareableBoard.owner !== currentUser?.id) {
      console.error('Only the owner can revoke share access');
      return false;
    }

    this.sharedBoards.delete(shareCode);
    
    // Also deactivate any share links
    for (const [code, link] of this.shareLinks) {
      if (link.boardId === shareableBoard.boardId) {
        link.isActive = false;
      }
    }

    this.saveSharedBoards();

    console.log(`🚫 Share access revoked: ${shareCode}`);
    return true;
  }

  /**
   * Get shared boards for current user
   */
  getMySharedBoards(): ShareableBoard[] {
    const authService = (window as any).moduleSystem?.get('AuthService');
    const currentUser = authService?.getCurrentUser();
    
    if (!currentUser) return [];

    return Array.from(this.sharedBoards.values())
      .filter(board => board.owner === currentUser.id)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Get share statistics
   */
  getShareStatistics(boardId: string): {
    totalShares: number;
    totalAccess: number;
    activeLinks: number;
    recipients: number;
  } {
    const shares = Array.from(this.sharedBoards.values())
      .filter(board => board.boardId === boardId);
    
    const links = Array.from(this.shareLinks.values())
      .filter(link => link.boardId === boardId);
    
    const boardRecipients = this.recipients.get(boardId) || [];

    return {
      totalShares: shares.length,
      totalAccess: shares.reduce((sum, share) => sum + share.accessCount, 0),
      activeLinks: links.filter(link => link.isActive).length,
      recipients: boardRecipients.length
    };
  }

  // Private helper methods
  private generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateShortCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private async generateQRCode(url: string): Promise<string> {
    // In production, use a QR code generation service
    // For now, return a placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash for demo - use bcrypt in production
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private extractShareCode(codeOrUrl: string): string {
    if (codeOrUrl.includes('/')) {
      // Extract from URL
      const parts = codeOrUrl.split('/');
      return parts[parts.length - 1];
    }
    return codeOrUrl;
  }

  private async sendShareEmail(
    recipients: string[],
    shareableBoard: ShareableBoard,
    message?: string
  ): Promise<void> {
    // Mock email sending
    console.log(`📧 Sending share email to: ${recipients.join(', ')}`);
    console.log(`Board: ${shareableBoard.name}`);
    console.log(`URL: ${shareableBoard.shareUrl}`);
    if (message) {
      console.log(`Message: ${message}`);
    }

    // In production, integrate with email service
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async generateBoardPreview(board: any): Promise<string> {
    // In production, generate actual preview image
    // For now, return placeholder
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect width="200" height="150" fill="%23f0f0f0"/%3E%3Ctext x="100" y="75" text-anchor="middle" font-family="Arial" font-size="16" fill="%23333"%3EBoard Preview%3C/text%3E%3C/svg%3E';
  }

  private initializeDefaultCatalog(): void {
    // Add some default catalog entries
    const defaults: BoardCatalogEntry[] = [
      {
        id: 'catalog_default_1',
        boardId: 'template_basic_needs',
        name: 'Basic Daily Needs',
        description: 'Essential communication for daily needs',
        category: 'daily_living',
        tags: ['basic', 'needs', 'beginner'],
        author: 'TinkyBink Team',
        rating: 4.8,
        downloads: 1250,
        isFeatured: true,
        publishedAt: new Date('2024-01-01').toISOString()
      },
      {
        id: 'catalog_default_2',
        boardId: 'template_emotions',
        name: 'Emotions & Feelings',
        description: 'Express emotions and feelings effectively',
        category: 'emotions',
        tags: ['emotions', 'feelings', 'social'],
        author: 'TinkyBink Team',
        rating: 4.9,
        downloads: 980,
        isFeatured: true,
        publishedAt: new Date('2024-01-15').toISOString()
      }
    ];

    defaults.forEach(entry => {
      this.publicCatalog.set(entry.id, entry);
    });
  }

  private setupDeepLinkHandling(): void {
    if (typeof window === 'undefined') return;

    // Handle deep links
    window.addEventListener('load', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shareCode = urlParams.get('share');
      
      if (shareCode) {
        // Auto-import shared board
        this.importSharedBoard(shareCode)
          .then(boardId => {
            if (boardId) {
              // Navigate to imported board
              const navigationService = (window as any).moduleSystem?.get('NavigationService');
              navigationService?.navigateTo(boardId, 'share_import');
            }
          })
          .catch(error => {
            console.error('Failed to import shared board:', error);
            alert('Failed to import shared board: ' + error.message);
          });
      }
    });
  }

  private loadSharedBoards(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem('shared_boards');
      if (data) {
        const boards = JSON.parse(data);
        boards.forEach((board: ShareableBoard) => {
          this.sharedBoards.set(board.shareCode, board);
        });
      }

      const linksData = localStorage.getItem('share_links');
      if (linksData) {
        const links = JSON.parse(linksData);
        links.forEach((link: ShareLink) => {
          this.shareLinks.set(link.shortCode, link);
        });
      }

      const catalogData = localStorage.getItem('board_catalog');
      if (catalogData) {
        const catalog = JSON.parse(catalogData);
        catalog.forEach((entry: BoardCatalogEntry) => {
          this.publicCatalog.set(entry.id, entry);
        });
      }
    } catch (error) {
      console.error('Failed to load shared boards:', error);
    }
  }

  private saveSharedBoards(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'shared_boards',
        JSON.stringify(Array.from(this.sharedBoards.values()))
      );
      
      localStorage.setItem(
        'share_links',
        JSON.stringify(Array.from(this.shareLinks.values()))
      );
    } catch (error) {
      console.error('Failed to save shared boards:', error);
    }
  }

  private saveCatalog(): void {
    if (typeof window === 'undefined') return;

    try {
      // Only save non-default entries
      const customEntries = Array.from(this.publicCatalog.entries())
        .filter(([id]) => !id.startsWith('catalog_default_'))
        .map(([_, entry]) => entry);
      
      localStorage.setItem('board_catalog', JSON.stringify(customEntries));
    } catch (error) {
      console.error('Failed to save catalog:', error);
    }
  }
}

// Export singleton getter function
export function getBoardSharingService(): BoardSharingService {
  return BoardSharingService.getInstance();
}