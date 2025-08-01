/**
 * Quick Create Service
 * Module 37: Quick creation of boards, tiles, and templates
 */

interface QuickCreateTemplate {
  id: string;
  name: string;
  type: 'board' | 'tile' | 'category';
  description: string;
  icon: string;
  category: string;
  content: any;
  usage: number;
  lastUsed: string;
}

interface TileCreationData {
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  category?: string;
  tags?: string[];
}

interface BoardCreationData {
  name: string;
  description?: string;
  category: string;
  tiles: TileCreationData[];
  layout?: 'grid' | 'list' | 'custom';
  gridSize?: { rows: number; columns: number };
  isPublic?: boolean;
  tags?: string[];
}

interface QuickCreateWizardStep {
  id: string;
  title: string;
  description: string;
  type: 'select' | 'input' | 'tiles' | 'preview';
  required: boolean;
  validation?: (value: any) => boolean;
}

export class QuickCreateService {
  private static instance: QuickCreateService;
  private templates: Map<string, QuickCreateTemplate> = new Map();
  private recentCreations: any[] = [];
  private wizardSteps: QuickCreateWizardStep[] = [];
  private currentWizardData: any = {};
  private isWizardOpen = false;

  private constructor() {
    this.initializeTemplates();
    this.initializeWizardSteps();
  }

  static getInstance(): QuickCreateService {
    if (!QuickCreateService.instance) {
      QuickCreateService.instance = new QuickCreateService();
    }
    return QuickCreateService.instance;
  }

  initialize(): void {
    console.log('⚡ Quick Create Service ready - Fast board and tile creation');
    this.loadRecentCreations();
    this.setupKeyboardShortcuts();
  }

  /**
   * Initialize quick create templates
   */
  private initializeTemplates(): void {
    const defaultTemplates: QuickCreateTemplate[] = [
      {
        id: 'basic_communication',
        name: 'Basic Communication',
        type: 'board',
        description: 'Essential communication tiles',
        icon: '💬',
        category: 'communication',
        content: {
          tiles: [
            { text: 'Yes', backgroundColor: '#4CAF50', icon: '✅' },
            { text: 'No', backgroundColor: '#f44336', icon: '❌' },
            { text: 'Help', backgroundColor: '#FF9800', icon: '🆘' },
            { text: 'More', backgroundColor: '#2196F3', icon: '➕' },
            { text: 'Stop', backgroundColor: '#9C27B0', icon: '🛑' },
            { text: 'Please', backgroundColor: '#FFC107', icon: '🙏' }
          ]
        },
        usage: 0,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'feelings',
        name: 'Feelings & Emotions',
        type: 'board',
        description: 'Express how you feel',
        icon: '😊',
        category: 'emotions',
        content: {
          tiles: [
            { text: 'Happy', backgroundColor: '#FFD700', icon: '😊' },
            { text: 'Sad', backgroundColor: '#64B5F6', icon: '😢' },
            { text: 'Angry', backgroundColor: '#EF5350', icon: '😠' },
            { text: 'Scared', backgroundColor: '#BA68C8', icon: '😨' },
            { text: 'Tired', backgroundColor: '#90A4AE', icon: '😴' },
            { text: 'Excited', backgroundColor: '#FF6B6B', icon: '🤗' }
          ]
        },
        usage: 0,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'daily_needs',
        name: 'Daily Needs',
        type: 'board',
        description: 'Common daily requirements',
        icon: '🏠',
        category: 'needs',
        content: {
          tiles: [
            { text: 'Hungry', backgroundColor: '#FF7043', icon: '🍽️' },
            { text: 'Thirsty', backgroundColor: '#42A5F5', icon: '💧' },
            { text: 'Bathroom', backgroundColor: '#66BB6A', icon: '🚽' },
            { text: 'Sleep', backgroundColor: '#5C6BC0', icon: '🛏️' },
            { text: 'Play', backgroundColor: '#FFB300', icon: '🎮' },
            { text: 'Go', backgroundColor: '#EC407A', icon: '🚗' }
          ]
        },
        usage: 0,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'quick_tile',
        name: 'Quick Tile',
        type: 'tile',
        description: 'Create a single tile quickly',
        icon: '🎯',
        category: 'utility',
        content: {
          template: {
            text: '',
            backgroundColor: '#2196F3',
            textColor: '#FFFFFF',
            fontSize: 18
          }
        },
        usage: 0,
        lastUsed: new Date().toISOString()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Initialize wizard steps
   */
  private initializeWizardSteps(): void {
    this.wizardSteps = [
      {
        id: 'type',
        title: 'What would you like to create?',
        description: 'Choose what type of content to create',
        type: 'select',
        required: true
      },
      {
        id: 'template',
        title: 'Choose a template',
        description: 'Start with a template or create from scratch',
        type: 'select',
        required: false
      },
      {
        id: 'details',
        title: 'Basic Information',
        description: 'Name and describe your creation',
        type: 'input',
        required: true,
        validation: (data) => data.name && data.name.length > 0
      },
      {
        id: 'content',
        title: 'Add Content',
        description: 'Add tiles or customize your creation',
        type: 'tiles',
        required: true
      },
      {
        id: 'preview',
        title: 'Preview & Save',
        description: 'Review your creation before saving',
        type: 'preview',
        required: false
      }
    ];
  }

  /**
   * Quick create board from template
   */
  async quickCreateBoard(templateId?: string): Promise<string | null> {
    try {
      const template = templateId ? this.templates.get(templateId) : null;
      const boardManager = (window as any).moduleSystem?.get('BoardManager');
      
      if (!boardManager) {
        throw new Error('Board Manager not available');
      }

      let boardData: BoardCreationData;

      if (template && template.type === 'board') {
        // Create from template
        boardData = {
          name: `${template.name} (${new Date().toLocaleDateString()})`,
          description: template.description,
          category: template.category,
          tiles: template.content.tiles,
          layout: 'grid',
          gridSize: { rows: 2, columns: 3 }
        };
      } else {
        // Create blank board
        boardData = await this.showQuickBoardDialog();
        if (!boardData) return null;
      }

      // Create board
      const boardId = await boardManager.createBoard(boardData);

      // Track creation
      this.trackCreation('board', boardId, boardData);

      // Update template usage
      if (template) {
        template.usage++;
        template.lastUsed = new Date().toISOString();
      }

      console.log(`⚡ Quick created board: ${boardData.name}`);
      return boardId;

    } catch (error) {
      console.error('Quick board creation failed:', error);
      return null;
    }
  }

  /**
   * Quick create tile
   */
  async quickCreateTile(boardId?: string): Promise<string | null> {
    try {
      const tileManagement = (window as any).moduleSystem?.get('TileManagementService');
      
      if (!tileManagement) {
        throw new Error('Tile Management Service not available');
      }

      const tileData = await this.showQuickTileDialog();
      if (!tileData) return null;

      // Create tile
      const tileId = await tileManagement.createTile({
        ...tileData,
        boardId: boardId || 'main'
      });

      // Track creation
      this.trackCreation('tile', tileId, tileData);

      console.log(`⚡ Quick created tile: ${tileData.text}`);
      return tileId;

    } catch (error) {
      console.error('Quick tile creation failed:', error);
      return null;
    }
  }

  /**
   * Start creation wizard
   */
  startWizard(type?: 'board' | 'tile' | 'category'): void {
    this.isWizardOpen = true;
    this.currentWizardData = { type: type || 'board' };
    this.showWizardOverlay();
  }

  /**
   * Get quick create templates
   */
  getTemplates(type?: 'board' | 'tile' | 'category'): QuickCreateTemplate[] {
    const templates = Array.from(this.templates.values());
    return type ? templates.filter(t => t.type === type) : templates;
  }

  /**
   * Get recent creations
   */
  getRecentCreations(limit = 10): any[] {
    return this.recentCreations.slice(0, limit);
  }

  /**
   * Import template
   */
  importTemplate(templateData: QuickCreateTemplate): string {
    const templateId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const template = {
      ...templateData,
      id: templateId,
      usage: 0,
      lastUsed: new Date().toISOString()
    };

    this.templates.set(templateId, template);
    this.saveTemplates();

    console.log(`📥 Imported template: ${template.name}`);
    return templateId;
  }

  /**
   * Export template
   */
  exportTemplate(templateId: string): QuickCreateTemplate | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const exportData = { ...template };
    delete (exportData as any).usage;
    delete (exportData as any).lastUsed;

    return exportData;
  }

  /**
   * Create custom template from existing board
   */
  createTemplateFromBoard(boardId: string, name: string, description: string): string | null {
    try {
      const boardManager = (window as any).moduleSystem?.get('BoardManager');
      const board = boardManager?.getBoard(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }

      const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const template: QuickCreateTemplate = {
        id: templateId,
        name,
        type: 'board',
        description,
        icon: '📋',
        category: 'custom',
        content: {
          tiles: board.tiles,
          layout: board.layout,
          gridSize: board.gridSize
        },
        usage: 0,
        lastUsed: new Date().toISOString()
      };

      this.templates.set(templateId, template);
      this.saveTemplates();

      console.log(`📋 Created template from board: ${name}`);
      return templateId;

    } catch (error) {
      console.error('Failed to create template from board:', error);
      return null;
    }
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    // Don't allow deletion of default templates
    const template = this.templates.get(templateId);
    if (!template || !templateId.startsWith('custom_') && !templateId.startsWith('imported_')) {
      return false;
    }

    this.templates.delete(templateId);
    this.saveTemplates();

    console.log(`🗑️ Deleted template: ${template.name}`);
    return true;
  }

  // Private helper methods
  private async showQuickBoardDialog(): Promise<BoardCreationData | null> {
    return new Promise((resolve) => {
      const overlay = this.createOverlay();
      
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 500px;
        width: 90vw;
      `;

      dialog.innerHTML = `
        <h2 style="margin: 0 0 20px 0;">Quick Create Board</h2>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Board Name</label>
          <input type="text" id="board-name" placeholder="My New Board" 
                 style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Category</label>
          <select id="board-category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <option value="general">General</option>
            <option value="communication">Communication</option>
            <option value="emotions">Emotions</option>
            <option value="needs">Daily Needs</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description (optional)</label>
          <textarea id="board-description" placeholder="Describe your board..." 
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical; min-height: 60px;"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="window.quickCreateResolve(null)" 
                  style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">
            Cancel
          </button>
          <button onclick="window.quickCreateResolve('create')" 
                  style="padding: 10px 20px; border: none; background: #2196F3; color: white; border-radius: 5px; cursor: pointer;">
            Create Board
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Focus on name input
      const nameInput = document.getElementById('board-name') as HTMLInputElement;
      nameInput?.focus();

      // Handle resolution
      (window as any).quickCreateResolve = (action: string | null) => {
        if (action === 'create') {
          const name = (document.getElementById('board-name') as HTMLInputElement)?.value || 'New Board';
          const category = (document.getElementById('board-category') as HTMLSelectElement)?.value || 'general';
          const description = (document.getElementById('board-description') as HTMLTextAreaElement)?.value || '';

          resolve({
            name,
            category,
            description,
            tiles: [],
            layout: 'grid'
          });
        } else {
          resolve(null);
        }

        overlay.remove();
        delete (window as any).quickCreateResolve;
      };
    });
  }

  private async showQuickTileDialog(): Promise<TileCreationData | null> {
    return new Promise((resolve) => {
      const overlay = this.createOverlay();
      
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 400px;
        width: 90vw;
      `;

      dialog.innerHTML = `
        <h2 style="margin: 0 0 20px 0;">Quick Create Tile</h2>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Tile Text</label>
          <input type="text" id="tile-text" placeholder="Enter text..." 
                 style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background Color</label>
          <input type="color" id="tile-color" value="#2196F3" 
                 style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Category</label>
          <input type="text" id="tile-category" placeholder="e.g., actions, objects" 
                 style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="window.quickTileResolve(null)" 
                  style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">
            Cancel
          </button>
          <button onclick="window.quickTileResolve('create')" 
                  style="padding: 10px 20px; border: none; background: #2196F3; color: white; border-radius: 5px; cursor: pointer;">
            Create Tile
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Focus on text input
      const textInput = document.getElementById('tile-text') as HTMLInputElement;
      textInput?.focus();

      // Handle resolution
      (window as any).quickTileResolve = (action: string | null) => {
        if (action === 'create') {
          const text = (document.getElementById('tile-text') as HTMLInputElement)?.value || '';
          const backgroundColor = (document.getElementById('tile-color') as HTMLInputElement)?.value || '#2196F3';
          const category = (document.getElementById('tile-category') as HTMLInputElement)?.value || 'general';

          if (text) {
            resolve({
              text,
              backgroundColor,
              textColor: '#FFFFFF',
              category
            });
          } else {
            alert('Please enter tile text');
            return;
          }
        } else {
          resolve(null);
        }

        overlay.remove();
        delete (window as any).quickTileResolve;
      };
    });
  }

  private showWizardOverlay(): void {
    if (typeof document === 'undefined') return;

    const overlay = this.createOverlay();
    
    const wizard = document.createElement('div');
    wizard.id = 'quick-create-wizard';
    wizard.style.cssText = `
      background: white;
      border-radius: 15px;
      padding: 30px;
      max-width: 800px;
      width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    `;

    // Render current step
    this.renderWizardStep(wizard, 0);

    overlay.appendChild(wizard);
    document.body.appendChild(overlay);
  }

  private renderWizardStep(container: HTMLElement, stepIndex: number): void {
    const step = this.wizardSteps[stepIndex];
    if (!step) {
      this.completeWizard();
      return;
    }

    // Implementation would render each step type
    console.log(`Rendering wizard step: ${step.title}`);
  }

  private completeWizard(): void {
    this.isWizardOpen = false;
    const overlay = document.querySelector('.quick-create-overlay');
    overlay?.remove();

    console.log('✅ Wizard completed with data:', this.currentWizardData);
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'quick-create-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    return overlay;
  }

  private trackCreation(type: string, id: string, data: any): void {
    const creation = {
      id,
      type,
      data,
      createdAt: new Date().toISOString()
    };

    this.recentCreations.unshift(creation);
    this.recentCreations = this.recentCreations.slice(0, 50); // Keep last 50

    // Save recent creations
    this.saveRecentCreations();

    // Track analytics
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      analyticsService.trackEvent('quick_create', {
        type,
        id,
        templateUsed: data.templateId || 'none'
      });
    }
  }

  private setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + B = Quick create board
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        this.quickCreateBoard();
      }

      // Ctrl/Cmd + Shift + T = Quick create tile
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        this.quickCreateTile();
      }

      // Ctrl/Cmd + Shift + W = Open wizard
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'W') {
        event.preventDefault();
        this.startWizard();
      }
    });
  }

  private saveTemplates(): void {
    if (typeof window === 'undefined') return;

    try {
      const customTemplates = Array.from(this.templates.entries())
        .filter(([id]) => id.startsWith('custom_') || id.startsWith('imported_'));
      
      localStorage.setItem('quick_create_templates', JSON.stringify(customTemplates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  private loadRecentCreations(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem('quick_create_recent');
      if (data) {
        this.recentCreations = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load recent creations:', error);
    }
  }

  private saveRecentCreations(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('quick_create_recent', JSON.stringify(this.recentCreations));
    } catch (error) {
      console.error('Failed to save recent creations:', error);
    }
  }
}

// Export singleton getter function
export function getQuickCreateService(): QuickCreateService {
  return QuickCreateService.getInstance();
}