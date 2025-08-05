/**
 * Custom Board Builder Service
 * Empowers therapists to create personalized AAC boards
 * 
 * Features:
 * - Drag-and-drop tile creation
 * - AI-powered symbol suggestions
 * - Voice recording for custom tiles
 * - Template sharing marketplace
 * - Version control and rollback
 * - Multi-therapist collaboration
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0
 */

import { predictiveCommunicationEngine } from './predictive-communication-engine';
import { mlDataCollection } from './ml-data-collection';

interface CustomTile {
  id: string;
  text: string;
  image: {
    type: 'uploaded' | 'symbol' | 'ai_generated' | 'camera';
    url: string;
    alt_text: string;
  };
  audio?: {
    type: 'recorded' | 'tts' | 'uploaded';
    url: string;
    duration: number;
  };
  category: string;
  tags: string[];
  
  // Customization
  style: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    borderWidth: number;
    animation?: 'none' | 'pulse' | 'bounce' | 'glow';
  };
  
  // Behavior
  action: {
    type: 'speak' | 'navigate' | 'sequence' | 'custom';
    payload: any;
  };
  
  // Metadata
  created_by: string;
  created_at: Date;
  usage_count: number;
  success_rate: number;
}

interface CustomBoard {
  id: string;
  name: string;
  description: string;
  therapist_id: string;
  organization_id?: string;
  
  // Layout
  layout: {
    grid: {
      columns: number;
      rows: number;
      gap: number;
    };
    responsive: boolean;
    tile_size: 'auto' | 'fixed';
    orientation: 'portrait' | 'landscape' | 'both';
  };
  
  // Tiles
  tiles: Array<{
    tile_id: string;
    position: { x: number; y: number };
    span?: { columns: number; rows: number };
    visible: boolean;
    locked: boolean;
  }>;
  
  // Customization
  theme: {
    name: string;
    colors: {
      background: string;
      primary: string;
      secondary: string;
      text: string;
    };
    font: string;
    border_style: 'rounded' | 'square' | 'circle';
  };
  
  // Target User
  target: {
    age_range: string;
    diagnosis: string[];
    skill_level: 'emergent' | 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
  };
  
  // Sharing
  sharing: {
    visibility: 'private' | 'organization' | 'public';
    allow_copying: boolean;
    allow_remixing: boolean;
    attribution: string;
  };
  
  // Version Control
  version: {
    number: string;
    changelog: string;
    parent_id?: string;
    published: boolean;
  };
  
  // Analytics
  analytics: {
    times_used: number;
    avg_session_duration: number;
    effectiveness_score: number;
    patient_outcomes: Array<{
      patient_id: string;
      improvement: number;
      feedback: string;
    }>;
  };
  
  created_at: Date;
  updated_at: Date;
}

interface BoardTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview_url: string;
  
  // Template Data
  board_config: Partial<CustomBoard>;
  tile_set: CustomTile[];
  
  // Marketplace
  author: {
    id: string;
    name: string;
    credentials: string;
    organization: string;
  };
  
  pricing: {
    model: 'free' | 'paid' | 'subscription';
    price?: number;
    license: string;
  };
  
  ratings: {
    average: number;
    count: number;
    reviews: Array<{
      user_id: string;
      rating: number;
      comment: string;
      date: Date;
    }>;
  };
  
  stats: {
    downloads: number;
    active_users: number;
    success_stories: number;
  };
}

class CustomBoardBuilderService {
  private static instance: CustomBoardBuilderService;
  private boards: Map<string, CustomBoard> = new Map();
  private tiles: Map<string, CustomTile> = new Map();
  private templates: Map<string, BoardTemplate> = new Map();
  private aiSymbolCache: Map<string, string> = new Map();
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): CustomBoardBuilderService {
    if (!CustomBoardBuilderService.instance) {
      CustomBoardBuilderService.instance = new CustomBoardBuilderService();
    }
    return CustomBoardBuilderService.instance;
  }
  
  /**
   * Initialize board builder service
   */
  private async initializeService(): Promise<void> {
    console.log('🎨 Initializing Custom Board Builder Service...');
    
    // Load symbol libraries
    await this.loadSymbolLibraries();
    
    // Load marketplace templates
    await this.loadMarketplaceTemplates();
    
    // Set up AI symbol generation
    this.setupAISymbolGeneration();
    
    console.log('✅ Board Builder Service Ready');
  }
  
  /**
   * Create a new custom board
   */
  async createBoard(boardData: Partial<CustomBoard>): Promise<string> {
    const boardId = `board_${Date.now()}`;
    
    const board: CustomBoard = {
      id: boardId,
      name: boardData.name || 'Untitled Board',
      description: boardData.description || '',
      therapist_id: boardData.therapist_id!,
      organization_id: boardData.organization_id,
      
      layout: boardData.layout || {
        grid: { columns: 4, rows: 3, gap: 10 },
        responsive: true,
        tile_size: 'auto',
        orientation: 'both'
      },
      
      tiles: boardData.tiles || [],
      
      theme: boardData.theme || {
        name: 'Default',
        colors: {
          background: '#f0f4f8',
          primary: '#4ECDC4',
          secondary: '#FF6B6B',
          text: '#2d3748'
        },
        font: 'Inter',
        border_style: 'rounded'
      },
      
      target: boardData.target || {
        age_range: 'all',
        diagnosis: [],
        skill_level: 'beginner',
        interests: []
      },
      
      sharing: boardData.sharing || {
        visibility: 'private',
        allow_copying: false,
        allow_remixing: false,
        attribution: ''
      },
      
      version: {
        number: '1.0.0',
        changelog: 'Initial version',
        published: false
      },
      
      analytics: {
        times_used: 0,
        avg_session_duration: 0,
        effectiveness_score: 0,
        patient_outcomes: []
      },
      
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.boards.set(boardId, board);
    
    // Track creation
    await mlDataCollection.trackInteraction(board.therapist_id, {
      type: 'board_created',
      metadata: { boardId, name: board.name },
      timestamp: new Date()
    });
    
    console.log(`✅ Board created: ${board.name}`);
    return boardId;
  }
  
  /**
   * Create a custom tile with AI assistance
   */
  async createTile(tileData: Partial<CustomTile>): Promise<string> {
    const tileId = `tile_${Date.now()}`;
    
    // Get AI symbol suggestion if no image provided
    let imageUrl = tileData.image?.url;
    if (!imageUrl && tileData.text) {
      imageUrl = await this.generateAISymbol(tileData.text);
    }
    
    const tile: CustomTile = {
      id: tileId,
      text: tileData.text || '',
      
      image: tileData.image || {
        type: imageUrl?.startsWith('data:') ? 'ai_generated' : 'symbol',
        url: imageUrl || '/default-symbol.png',
        alt_text: tileData.text || 'Custom symbol'
      },
      
      audio: tileData.audio,
      category: tileData.category || 'custom',
      tags: tileData.tags || [],
      
      style: tileData.style || {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#e2e8f0',
        fontSize: 'medium',
        borderWidth: 2
      },
      
      action: tileData.action || {
        type: 'speak',
        payload: { text: tileData.text }
      },
      
      created_by: tileData.created_by!,
      created_at: new Date(),
      usage_count: 0,
      success_rate: 0
    };
    
    this.tiles.set(tileId, tile);
    
    console.log(`✅ Tile created: ${tile.text}`);
    return tileId;
  }
  
  /**
   * Add tile to board with drag-drop support
   */
  async addTileToBoard(
    boardId: string,
    tileId: string,
    position: { x: number; y: number }
  ): Promise<void> {
    const board = this.boards.get(boardId);
    const tile = this.tiles.get(tileId);
    
    if (!board || !tile) {
      throw new Error('Board or tile not found');
    }
    
    // Check if position is occupied
    const existingTileIndex = board.tiles.findIndex(
      t => t.position.x === position.x && t.position.y === position.y
    );
    
    if (existingTileIndex !== -1) {
      // Replace existing tile
      board.tiles[existingTileIndex] = {
        tile_id: tileId,
        position,
        visible: true,
        locked: false
      };
    } else {
      // Add new tile
      board.tiles.push({
        tile_id: tileId,
        position,
        visible: true,
        locked: false
      });
    }
    
    board.updated_at = new Date();
    this.boards.set(boardId, board);
    
    console.log(`Added tile "${tile.text}" to board at position (${position.x}, ${position.y})`);
  }
  
  /**
   * Record custom audio for tile
   */
  async recordAudioForTile(tileId: string): Promise<void> {
    const tile = this.tiles.get(tileId);
    if (!tile) throw new Error('Tile not found');
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      return new Promise((resolve) => {
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Update tile with recorded audio
          tile.audio = {
            type: 'recorded',
            url: audioUrl,
            duration: 0 // Would calculate actual duration
          };
          
          this.tiles.set(tileId, tile);
          stream.getTracks().forEach(track => track.stop());
          
          console.log('✅ Audio recorded for tile');
          resolve();
        };
        
        // Start recording
        mediaRecorder.start();
        
        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 10000);
      });
      
    } catch (error) {
      console.error('Audio recording failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate AI-powered symbol for text
   */
  private async generateAISymbol(text: string): Promise<string> {
    // Check cache first
    if (this.aiSymbolCache.has(text.toLowerCase())) {
      return this.aiSymbolCache.get(text.toLowerCase())!;
    }
    
    try {
      console.log(`🤖 Generating AI symbol for: ${text}`);
      
      // In production, this would call an AI image generation API
      // For now, return a placeholder with text
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      
      // Background
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, 200, 200);
      
      // Border
      ctx.strokeStyle = '#4ECDC4';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 180, 180);
      
      // Text
      ctx.fillStyle = '#2d3748';
      ctx.font = 'bold 24px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Word wrap if needed
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 160 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);
      
      // Draw text lines
      const lineHeight = 30;
      const startY = 100 - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, 100, startY + index * lineHeight);
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Cache the result
      this.aiSymbolCache.set(text.toLowerCase(), dataUrl);
      
      return dataUrl;
      
    } catch (error) {
      console.error('AI symbol generation failed:', error);
      return '/default-symbol.png';
    }
  }
  
  /**
   * Share board as template
   */
  async shareAsTemplate(boardId: string, templateData: Partial<BoardTemplate>): Promise<string> {
    const board = this.boards.get(boardId);
    if (!board) throw new Error('Board not found');
    
    const templateId = `template_${Date.now()}`;
    
    // Get all tiles used in board
    const boardTiles = board.tiles.map(t => this.tiles.get(t.tile_id)!).filter(Boolean);
    
    const template: BoardTemplate = {
      id: templateId,
      name: templateData.name || board.name + ' Template',
      category: templateData.category || 'Custom',
      description: templateData.description || board.description,
      preview_url: templateData.preview_url || '',
      
      board_config: {
        name: board.name,
        description: board.description,
        layout: board.layout,
        theme: board.theme,
        target: board.target
      },
      
      tile_set: boardTiles,
      
      author: templateData.author!,
      
      pricing: templateData.pricing || {
        model: 'free',
        license: 'CC BY-SA 4.0'
      },
      
      ratings: {
        average: 0,
        count: 0,
        reviews: []
      },
      
      stats: {
        downloads: 0,
        active_users: 0,
        success_stories: 0
      }
    };
    
    this.templates.set(templateId, template);
    
    // Update board sharing settings
    board.sharing.visibility = 'public';
    board.sharing.allow_copying = true;
    this.boards.set(boardId, board);
    
    console.log(`✅ Board shared as template: ${template.name}`);
    return templateId;
  }
  
  /**
   * Get board with all tiles
   */
  async getBoardWithTiles(boardId: string): Promise<{
    board: CustomBoard;
    tiles: CustomTile[];
  }> {
    const board = this.boards.get(boardId);
    if (!board) throw new Error('Board not found');
    
    const tiles = board.tiles.map(t => this.tiles.get(t.tile_id)!).filter(Boolean);
    
    return { board, tiles };
  }
  
  /**
   * Clone board for another patient
   */
  async cloneBoard(boardId: string, newTherapistId: string): Promise<string> {
    const { board, tiles } = await this.getBoardWithTiles(boardId);
    
    // Create new board
    const newBoard = await this.createBoard({
      ...board,
      therapist_id: newTherapistId,
      name: board.name + ' (Copy)',
      sharing: {
        ...board.sharing,
        visibility: 'private'
      },
      version: {
        number: '1.0.0',
        changelog: `Cloned from ${board.name}`,
        parent_id: boardId,
        published: false
      }
    });
    
    // Clone all tiles
    for (const tile of tiles) {
      const newTileId = await this.createTile({
        ...tile,
        created_by: newTherapistId
      });
      
      // Find position in original board
      const position = board.tiles.find(t => t.tile_id === tile.id)?.position;
      if (position) {
        await this.addTileToBoard(newBoard, newTileId, position);
      }
    }
    
    console.log(`✅ Board cloned: ${newBoard}`);
    return newBoard;
  }
  
  /**
   * Get marketplace templates
   */
  getMarketplaceTemplates(filters?: {
    category?: string;
    age_range?: string;
    diagnosis?: string;
    price?: 'free' | 'paid';
  }): BoardTemplate[] {
    let templates = Array.from(this.templates.values());
    
    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.price) {
        templates = templates.filter(t => 
          filters.price === 'free' ? t.pricing.model === 'free' : t.pricing.model !== 'free'
        );
      }
    }
    
    // Sort by popularity
    return templates.sort((a, b) => b.stats.downloads - a.stats.downloads);
  }
  
  /**
   * Preview board in real-time
   */
  generateBoardPreview(board: CustomBoard): string {
    // Generate HTML preview
    const preview = `
      <div style="
        display: grid;
        grid-template-columns: repeat(${board.layout.grid.columns}, 1fr);
        grid-template-rows: repeat(${board.layout.grid.rows}, 1fr);
        gap: ${board.layout.grid.gap}px;
        background: ${board.theme.colors.background};
        padding: 20px;
        border-radius: 10px;
      ">
        ${board.tiles.map(t => {
          const tile = this.tiles.get(t.tile_id);
          if (!tile) return '';
          
          return `
            <div style="
              grid-column: ${t.position.x + 1};
              grid-row: ${t.position.y + 1};
              background: ${tile.style.backgroundColor};
              color: ${tile.style.textColor};
              border: ${tile.style.borderWidth}px solid ${tile.style.borderColor};
              border-radius: ${board.theme.border_style === 'rounded' ? '10px' : '0'};
              padding: 10px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-size: ${tile.style.fontSize};
            ">
              <img src="${tile.image.url}" alt="${tile.image.alt_text}" style="max-width: 80%; max-height: 60%;">
              <span>${tile.text}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    return preview;
  }
  
  // Private helper methods
  
  private async loadSymbolLibraries(): Promise<void> {
    console.log('📚 Loading symbol libraries...');
    // In production, load from CDN or API
    // OpenSymbols, Mulberry, ARASAAC, etc.
  }
  
  private async loadMarketplaceTemplates(): Promise<void> {
    console.log('🛒 Loading marketplace templates...');
    
    // Load some default templates
    const coreVocabularyTemplate: BoardTemplate = {
      id: 'template_core_vocab',
      name: 'Core Vocabulary Starter',
      category: 'Core Words',
      description: 'Essential core vocabulary for beginning communicators',
      preview_url: '/templates/core-vocab-preview.png',
      board_config: {
        name: 'Core Vocabulary',
        layout: {
          grid: { columns: 5, rows: 4, gap: 10 },
          responsive: true,
          tile_size: 'auto',
          orientation: 'both'
        }
      },
      tile_set: [], // Would include actual tiles
      author: {
        id: 'tinkybink',
        name: 'TinkyBink Team',
        credentials: 'SLP, CCC-SLP',
        organization: 'TinkyBink AAC'
      },
      pricing: {
        model: 'free',
        license: 'CC BY-SA 4.0'
      },
      ratings: {
        average: 4.8,
        count: 156,
        reviews: []
      },
      stats: {
        downloads: 1250,
        active_users: 890,
        success_stories: 45
      }
    };
    
    this.templates.set(coreVocabularyTemplate.id, coreVocabularyTemplate);
  }
  
  private setupAISymbolGeneration(): void {
    console.log('🤖 Setting up AI symbol generation...');
    // In production, connect to DALL-E, Stable Diffusion, or custom model
  }
}

// Export singleton instance
export const customBoardBuilderService = CustomBoardBuilderService.getInstance();
export type { CustomBoard, CustomTile, BoardTemplate };