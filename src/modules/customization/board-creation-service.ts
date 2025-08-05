/**
 * Board Creation Service
 * Module 39: Enhanced board creation for SLP/ABA/Family use with professional templates
 */

interface BoardTemplate {
  id: string;
  category: 'slp' | 'aba' | 'family' | 'medical' | 'education' | 'custom';
  name: string;
  description: string;
  tiles: TileTemplate[];
  layout?: BoardLayout;
  settings?: BoardSettings;
  targetAge?: string;
  goals?: string[];
  tags: string[];
}

interface TileTemplate {
  text: string;
  emoji?: string;
  imageUrl?: string;
  audioUrl?: string;
  color: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  isSequence?: boolean;
  metadata?: any;
}

interface BoardLayout {
  type: 'grid' | 'list' | 'custom' | 'visual-schedule';
  gridSize?: { rows: number; columns: number };
  spacing?: number;
  padding?: number;
  backgroundColor?: string;
}

interface BoardSettings {
  autoSpeak: boolean;
  showText: boolean;
  showImages: boolean;
  lockLayout: boolean;
  requireConfirmation: boolean;
  feedbackType: 'visual' | 'auditory' | 'haptic' | 'all';
}

interface CreationWizardData {
  category: string;
  template?: string;
  customization: {
    name: string;
    description: string;
    targetUser?: string;
    goals?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
  tiles: TileTemplate[];
  layout: BoardLayout;
  settings: BoardSettings;
}

export class BoardCreationService {
  private static instance: BoardCreationService;
  private templates: Map<string, BoardTemplate> = new Map();
  private wizardData: CreationWizardData | null = null;
  private customTemplates: Map<string, BoardTemplate> = new Map();

  private constructor() {
    this.initializeProfessionalTemplates();
  }

  static getInstance(): BoardCreationService {
    if (!BoardCreationService.instance) {
      BoardCreationService.instance = new BoardCreationService();
    }
    return BoardCreationService.instance;
  }

  initialize(): void {
    console.log('🎨 Board Creation Service ready - Professional board templates for SLP/ABA/Family');
    this.loadCustomTemplates();
  }

  /**
   * Initialize professional templates
   */
  private initializeProfessionalTemplates(): void {
    // SLP Templates
    const slpTemplates: BoardTemplate[] = [
      {
        id: 'slp_articulation',
        category: 'slp',
        name: 'Articulation Practice',
        description: 'Target specific sounds and phonemes',
        targetAge: '3-12',
        goals: ['Improve articulation', 'Practice target sounds', 'Build phonological awareness'],
        tiles: [
          { text: '/s/ sound', emoji: '🐍', color: '#4CAF50' },
          { text: '/r/ sound', emoji: '🦁', color: '#FF9800' },
          { text: '/l/ sound', emoji: '🔔', color: '#2196F3' },
          { text: '/th/ sound', emoji: '👅', color: '#9C27B0' },
          { text: '/sh/ sound', emoji: '🤫', color: '#E91E63' },
          { text: '/ch/ sound', emoji: '🚂', color: '#795548' },
          { text: 'Try again', emoji: '🔄', color: '#607D8B' },
          { text: 'Good job!', emoji: '⭐', color: '#FFD700' },
          { text: 'Help me', emoji: '🙋', color: '#00BCD4' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['articulation', 'speech', 'phonemes']
      },
      {
        id: 'slp_language',
        category: 'slp',
        name: 'Language Development',
        description: 'Build vocabulary and sentence structure',
        targetAge: '2-8',
        goals: ['Expand vocabulary', 'Improve sentence structure', 'Develop language skills'],
        tiles: [
          { text: 'I want', emoji: '🤚', color: '#2196F3' },
          { text: 'I see', emoji: '👀', color: '#4CAF50' },
          { text: 'I have', emoji: '✋', color: '#9C27B0' },
          { text: 'I need', emoji: '🙏', color: '#FF5722' },
          { text: 'more', emoji: '➕', color: '#FF9800' },
          { text: 'please', emoji: '🙏', color: '#E91E63' },
          { text: 'thank you', emoji: '🤗', color: '#FFEB3B' },
          { text: 'help', emoji: '🆘', color: '#F44336' },
          { text: 'finished', emoji: '✅', color: '#8BC34A' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['language', 'vocabulary', 'sentences']
      },
      {
        id: 'slp_pragmatics',
        category: 'slp',
        name: 'Social Communication',
        description: 'Practice social language skills',
        targetAge: '4-16',
        goals: ['Improve social skills', 'Practice turn-taking', 'Develop conversational abilities'],
        tiles: [
          { text: 'Hello', emoji: '👋', color: '#2196F3' },
          { text: 'Goodbye', emoji: '👋', color: '#9E9E9E' },
          { text: 'My turn', emoji: '🙋', color: '#4CAF50' },
          { text: 'Your turn', emoji: '👉', color: '#FF9800' },
          { text: 'Share', emoji: '🤝', color: '#9C27B0' },
          { text: 'Wait', emoji: '✋', color: '#F44336' },
          { text: 'Sorry', emoji: '😔', color: '#3F51B5' },
          { text: 'Excuse me', emoji: '🙏', color: '#00BCD4' },
          { text: 'Thank you', emoji: '😊', color: '#FFEB3B' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['social', 'pragmatics', 'conversation']
      },
      {
        id: 'slp_fluency',
        category: 'slp',
        name: 'Fluency Strategies',
        description: 'Support for stuttering and fluency',
        targetAge: '6+',
        goals: ['Improve fluency', 'Practice speech strategies', 'Build confidence'],
        tiles: [
          { text: 'Slow down', emoji: '🐢', color: '#4CAF50' },
          { text: 'Take a breath', emoji: '💨', color: '#2196F3' },
          { text: 'Easy start', emoji: '▶️', color: '#9C27B0' },
          { text: 'Stretch it', emoji: '↔️', color: '#FF9800' },
          { text: 'Pause', emoji: '⏸️', color: '#607D8B' },
          { text: 'Try again', emoji: '🔄', color: '#795548' },
          { text: 'I did it!', emoji: '🎉', color: '#FFD700' },
          { text: 'Help', emoji: '🙋', color: '#F44336' },
          { text: 'Practice', emoji: '🎯', color: '#00BCD4' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['fluency', 'stuttering', 'strategies']
      }
    ];

    // ABA Templates
    const abaTemplates: BoardTemplate[] = [
      {
        id: 'aba_token',
        category: 'aba',
        name: 'Token Economy Board',
        description: 'Visual reinforcement system',
        targetAge: '3-12',
        goals: ['Positive reinforcement', 'Behavior management', 'Visual rewards'],
        tiles: [
          { text: 'Token 1', emoji: '⭐', color: '#FFD700' },
          { text: 'Token 2', emoji: '⭐', color: '#FFD700' },
          { text: 'Token 3', emoji: '⭐', color: '#FFD700' },
          { text: 'Token 4', emoji: '⭐', color: '#FFD700' },
          { text: 'Token 5', emoji: '⭐', color: '#FFD700' },
          { text: 'Reward!', emoji: '🎁', color: '#E91E63' }
        ],
        layout: { type: 'grid', gridSize: { rows: 2, columns: 3 } },
        tags: ['token', 'reinforcement', 'reward']
      },
      {
        id: 'aba_first_then',
        category: 'aba',
        name: 'First-Then Board',
        description: 'Visual schedule for activities',
        targetAge: '2-10',
        goals: ['Visual scheduling', 'Transition support', 'Clear expectations'],
        tiles: [
          { text: 'First', emoji: '1️⃣', color: '#2196F3', isSequence: true },
          { text: 'Then', emoji: '2️⃣', color: '#4CAF50', isSequence: true },
          { text: 'All done', emoji: '✅', color: '#9C27B0' }
        ],
        layout: { type: 'grid', gridSize: { rows: 1, columns: 3 } },
        tags: ['schedule', 'first-then', 'visual']
      },
      {
        id: 'aba_behavior',
        category: 'aba',
        name: 'Behavior Support',
        description: 'Positive behavior reinforcement',
        targetAge: '3-12',
        goals: ['Positive behavior support', 'Self-regulation', 'Communication'],
        tiles: [
          { text: 'Good sitting', emoji: '🪑', color: '#2196F3' },
          { text: 'Nice hands', emoji: '🤲', color: '#4CAF50' },
          { text: 'Quiet voice', emoji: '🤫', color: '#9C27B0' },
          { text: 'Good listening', emoji: '👂', color: '#FF9800' },
          { text: 'Walking feet', emoji: '👣', color: '#00BCD4' },
          { text: 'Kind words', emoji: '💬', color: '#E91E63' },
          { text: 'Great job!', emoji: '🌟', color: '#FFD700' },
          { text: 'Try again', emoji: '🔄', color: '#607D8B' },
          { text: 'I need help', emoji: '🙋', color: '#F44336' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['behavior', 'positive', 'support']
      },
      {
        id: 'aba_choices',
        category: 'aba',
        name: 'Choice Making',
        description: 'Present structured choices',
        targetAge: '2-10',
        goals: ['Decision making', 'Communication', 'Independence'],
        tiles: [
          { text: 'Choice 1', emoji: '1️⃣', color: '#2196F3' },
          { text: 'Choice 2', emoji: '2️⃣', color: '#4CAF50' },
          { text: 'Choice 3', emoji: '3️⃣', color: '#FF9800' },
          { text: 'I choose', emoji: '👉', color: '#9C27B0' },
          { text: 'Not now', emoji: '✋', color: '#F44336' },
          { text: 'Something else', emoji: '🔄', color: '#607D8B' }
        ],
        layout: { type: 'grid', gridSize: { rows: 2, columns: 3 } },
        tags: ['choice', 'decision', 'communication']
      },
      {
        id: 'aba_visual_schedule',
        category: 'aba',
        name: 'Visual Schedule',
        description: 'Daily routine visual support',
        targetAge: '3-16',
        goals: ['Routine support', 'Independence', 'Predictability'],
        tiles: [
          { text: 'Morning', emoji: '🌅', color: '#FFEB3B' },
          { text: 'School', emoji: '🏫', color: '#2196F3' },
          { text: 'Lunch', emoji: '🍽️', color: '#FF9800' },
          { text: 'Therapy', emoji: '🧩', color: '#9C27B0' },
          { text: 'Play', emoji: '🎮', color: '#4CAF50' },
          { text: 'Home', emoji: '🏠', color: '#795548' },
          { text: 'Dinner', emoji: '🍝', color: '#FF5722' },
          { text: 'Bath', emoji: '🛁', color: '#00BCD4' },
          { text: 'Bed', emoji: '🛏️', color: '#3F51B5' }
        ],
        layout: { type: 'visual-schedule', gridSize: { rows: 3, columns: 3 } },
        tags: ['schedule', 'visual', 'routine']
      }
    ];

    // Family Templates
    const familyTemplates: BoardTemplate[] = [
      {
        id: 'family_daily_routine',
        category: 'family',
        name: 'Daily Routine',
        description: 'Common daily activities',
        targetAge: 'All ages',
        goals: ['Daily communication', 'Independence', 'Routine support'],
        tiles: [
          { text: 'Wake up', emoji: '🌅', color: '#FFEB3B' },
          { text: 'Breakfast', emoji: '🥞', color: '#FF9800' },
          { text: 'Get dressed', emoji: '👕', color: '#2196F3' },
          { text: 'School/Work', emoji: '🏫', color: '#F44336' },
          { text: 'Lunch', emoji: '🍽️', color: '#4CAF50' },
          { text: 'Play', emoji: '🎮', color: '#9C27B0' },
          { text: 'Dinner', emoji: '🍝', color: '#FF5722' },
          { text: 'Bath', emoji: '🛁', color: '#00BCD4' },
          { text: 'Bedtime', emoji: '🛏️', color: '#3F51B5' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['daily', 'routine', 'family']
      },
      {
        id: 'family_feelings',
        category: 'family',
        name: 'Family Feelings',
        description: 'Express emotions at home',
        targetAge: 'All ages',
        goals: ['Emotional expression', 'Family communication', 'Understanding'],
        tiles: [
          { text: 'Happy', emoji: '😊', color: '#FFD700' },
          { text: 'Sad', emoji: '😢', color: '#64B5F6' },
          { text: 'Angry', emoji: '😠', color: '#EF5350' },
          { text: 'Scared', emoji: '😨', color: '#BA68C8' },
          { text: 'Excited', emoji: '🤗', color: '#FF6B6B' },
          { text: 'Tired', emoji: '😴', color: '#90A4AE' },
          { text: 'Sick', emoji: '🤒', color: '#A5D6A7' },
          { text: 'Love you', emoji: '❤️', color: '#E91E63' },
          { text: 'Hug', emoji: '🤗', color: '#FF4081' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['feelings', 'emotions', 'family']
      },
      {
        id: 'family_activities',
        category: 'family',
        name: 'Family Activities',
        description: 'Fun things to do together',
        targetAge: 'All ages',
        goals: ['Family bonding', 'Activity planning', 'Communication'],
        tiles: [
          { text: 'Read book', emoji: '📚', color: '#2196F3' },
          { text: 'Watch TV', emoji: '📺', color: '#9C27B0' },
          { text: 'Go outside', emoji: '🌳', color: '#4CAF50' },
          { text: 'Play games', emoji: '🎲', color: '#FF9800' },
          { text: 'Cook together', emoji: '👨‍🍳', color: '#795548' },
          { text: 'Art/Craft', emoji: '🎨', color: '#E91E63' },
          { text: 'Music', emoji: '🎵', color: '#00BCD4' },
          { text: 'Exercise', emoji: '🏃', color: '#8BC34A' },
          { text: 'Visit family', emoji: '👨‍👩‍👧‍👦', color: '#FF5722' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['activities', 'family', 'fun']
      }
    ];

    // Medical Templates
    const medicalTemplates: BoardTemplate[] = [
      {
        id: 'medical_pain',
        category: 'medical',
        name: 'Pain Communication',
        description: 'Express pain and discomfort',
        targetAge: 'All ages',
        goals: ['Pain communication', 'Medical needs', 'Self-advocacy'],
        tiles: [
          { text: 'It hurts', emoji: '😣', color: '#F44336' },
          { text: 'Head', emoji: '🤕', color: '#E91E63' },
          { text: 'Stomach', emoji: '🤢', color: '#FF9800' },
          { text: 'Throat', emoji: '🗣️', color: '#FF5722' },
          { text: 'Ear', emoji: '👂', color: '#795548' },
          { text: 'Medicine', emoji: '💊', color: '#2196F3' },
          { text: 'Doctor', emoji: '👨‍⚕️', color: '#4CAF50' },
          { text: 'Better', emoji: '😊', color: '#8BC34A' },
          { text: 'Worse', emoji: '😰', color: '#9E9E9E' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['medical', 'pain', 'health']
      }
    ];

    // Education Templates
    const educationTemplates: BoardTemplate[] = [
      {
        id: 'education_classroom',
        category: 'education',
        name: 'Classroom Communication',
        description: 'School and classroom needs',
        targetAge: '5-18',
        goals: ['Classroom participation', 'Academic communication', 'Independence'],
        tiles: [
          { text: 'Question', emoji: '❓', color: '#2196F3' },
          { text: 'Answer', emoji: '💡', color: '#4CAF50' },
          { text: 'Help', emoji: '🙋', color: '#F44336' },
          { text: 'Bathroom', emoji: '🚽', color: '#FF9800' },
          { text: 'Water', emoji: '💧', color: '#00BCD4' },
          { text: 'Break', emoji: '⏸️', color: '#9C27B0' },
          { text: 'Finished', emoji: '✅', color: '#8BC34A' },
          { text: 'More time', emoji: '⏰', color: '#FF5722' },
          { text: "Don't understand", emoji: '🤷', color: '#607D8B' }
        ],
        layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
        tags: ['school', 'classroom', 'education']
      }
    ];

    // Store all templates
    [...slpTemplates, ...abaTemplates, ...familyTemplates, ...medicalTemplates, ...educationTemplates]
      .forEach(template => {
        this.templates.set(template.id, template);
      });
  }

  /**
   * Start board creation wizard
   */
  startCreationWizard(category?: string): void {
    this.wizardData = {
      category: category || '',
      customization: {
        name: '',
        description: ''
      },
      tiles: [],
      layout: { type: 'grid', gridSize: { rows: 3, columns: 3 } },
      settings: {
        autoSpeak: true,
        showText: true,
        showImages: true,
        lockLayout: false,
        requireConfirmation: false,
        feedbackType: 'all'
      }
    };

    this.showWizardUI();
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): BoardTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  /**
   * Create board from template
   */
  async createFromTemplate(templateId: string, customization?: Partial<CreationWizardData>): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const boardManager = (window as any).moduleSystem?.get('BoardManager');
    if (!boardManager) {
      throw new Error('Board Manager not available');
    }

    const boardData = {
      name: customization?.customization?.name || template.name,
      description: customization?.customization?.description || template.description,
      category: template.category,
      tiles: template.tiles.map(tile => ({
        ...tile,
        id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      layout: template.layout || { type: 'grid' },
      settings: { ...template.settings, ...customization?.settings },
      tags: template.tags,
      metadata: {
        templateId,
        targetAge: template.targetAge,
        goals: customization?.customization?.goals || template.goals,
        createdFrom: 'BoardCreationService'
      }
    };

    const boardId = await boardManager.createBoard(boardData);

    // Track creation
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    if (analyticsService) {
      analyticsService.trackEvent('board_created_from_template', {
        templateId,
        category: template.category,
        boardId
      });
    }

    console.log(`🎨 Created board from template: ${template.name}`);
    return boardId;
  }

  /**
   * Create custom board
   */
  async createCustomBoard(wizardData: CreationWizardData): Promise<string> {
    const boardManager = (window as any).moduleSystem?.get('BoardManager');
    if (!boardManager) {
      throw new Error('Board Manager not available');
    }

    const boardData = {
      name: wizardData.customization.name,
      description: wizardData.customization.description,
      category: wizardData.category || 'custom',
      tiles: wizardData.tiles,
      layout: wizardData.layout,
      settings: wizardData.settings,
      metadata: {
        targetUser: wizardData.customization.targetUser,
        goals: wizardData.customization.goals,
        difficulty: wizardData.customization.difficulty,
        createdFrom: 'BoardCreationService'
      }
    };

    const boardId = await boardManager.createBoard(boardData);

    console.log(`🎨 Created custom board: ${wizardData.customization.name}`);
    return boardId;
  }

  /**
   * Save custom template
   */
  saveAsTemplate(boardId: string, templateName: string, category: string): string {
    const boardManager = (window as any).moduleSystem?.get('BoardManager');
    const board = boardManager?.getBoard(boardId);
    
    if (!board) {
      throw new Error('Board not found');
    }

    const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const template: BoardTemplate = {
      id: templateId,
      category: category as any,
      name: templateName,
      description: board.description || '',
      tiles: board.tiles.map((tile: any) => ({
        text: tile.text,
        emoji: tile.emoji,
        imageUrl: tile.imageUrl,
        audioUrl: tile.audioUrl,
        color: tile.backgroundColor || '#2196F3',
        position: tile.position,
        size: tile.size
      })),
      layout: board.layout,
      settings: board.settings,
      tags: board.tags || []
    };

    this.customTemplates.set(templateId, template);
    this.saveCustomTemplates();

    console.log(`💾 Saved board as template: ${templateName}`);
    return templateId;
  }

  /**
   * Get all templates including custom
   */
  getAllTemplates(): BoardTemplate[] {
    const defaultTemplates = Array.from(this.templates.values());
    const customTemplates = Array.from(this.customTemplates.values());
    return [...defaultTemplates, ...customTemplates];
  }

  /**
   * Delete custom template
   */
  deleteCustomTemplate(templateId: string): boolean {
    if (!templateId.startsWith('custom_')) {
      console.error('Cannot delete built-in templates');
      return false;
    }

    const deleted = this.customTemplates.delete(templateId);
    if (deleted) {
      this.saveCustomTemplates();
      console.log(`🗑️ Deleted custom template: ${templateId}`);
    }

    return deleted;
  }

  /**
   * Get template recommendations
   */
  getRecommendations(userProfile: {
    age?: number;
    role?: string;
    goals?: string[];
  }): BoardTemplate[] {
    const allTemplates = this.getAllTemplates();
    const recommendations: BoardTemplate[] = [];

    // Filter by age if provided
    if (userProfile.age) {
      allTemplates.forEach(template => {
        if (template.targetAge) {
          const [minAge, maxAge] = this.parseAgeRange(template.targetAge);
          if (userProfile.age! >= minAge && (maxAge === -1 || userProfile.age! <= maxAge)) {
            recommendations.push(template);
          }
        }
      });
    }

    // Sort by relevance to goals
    if (userProfile.goals && userProfile.goals.length > 0) {
      recommendations.sort((a, b) => {
        const aRelevance = this.calculateGoalRelevance(a.goals || [], userProfile.goals!);
        const bRelevance = this.calculateGoalRelevance(b.goals || [], userProfile.goals!);
        return bRelevance - aRelevance;
      });
    }

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  // Private helper methods
  private showWizardUI(): void {
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'board-creation-wizard';
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

    const wizard = document.createElement('div');
    wizard.style.cssText = `
      background: white;
      border-radius: 15px;
      padding: 40px;
      max-width: 800px;
      width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    `;

    wizard.innerHTML = `
      <h2>Create Professional Board</h2>
      <p>Choose a category to get started with professional templates</p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;">
        <button class="category-btn" data-category="slp" style="padding: 20px; border: 2px solid #2196F3; background: white; border-radius: 10px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; color: #2196F3;">SLP</h3>
          <p style="margin: 0; font-size: 14px;">Speech-Language Pathology templates</p>
        </button>
        
        <button class="category-btn" data-category="aba" style="padding: 20px; border: 2px solid #4CAF50; background: white; border-radius: 10px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; color: #4CAF50;">ABA</h3>
          <p style="margin: 0; font-size: 14px;">Applied Behavior Analysis templates</p>
        </button>
        
        <button class="category-btn" data-category="family" style="padding: 20px; border: 2px solid #FF9800; background: white; border-radius: 10px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; color: #FF9800;">Family</h3>
          <p style="margin: 0; font-size: 14px;">Family communication templates</p>
        </button>
        
        <button class="category-btn" data-category="medical" style="padding: 20px; border: 2px solid #F44336; background: white; border-radius: 10px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; color: #F44336;">Medical</h3>
          <p style="margin: 0; font-size: 14px;">Healthcare communication</p>
        </button>
        
        <button class="category-btn" data-category="education" style="padding: 20px; border: 2px solid #9C27B0; background: white; border-radius: 10px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; color: #9C27B0;">Education</h3>
          <p style="margin: 0; font-size: 14px;">School and classroom templates</p>
        </button>
        
        <button class="category-btn" data-category="custom" style="padding: 20px; border: 2px solid #607D8B; background: white; border-radius: 10px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; color: #607D8B;">Custom</h3>
          <p style="margin: 0; font-size: 14px;">Create from scratch</p>
        </button>
      </div>
      
      <button onclick="document.getElementById('board-creation-wizard').remove()" 
              style="margin-top: 30px; padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">
        Cancel
      </button>
    `;

    overlay.appendChild(wizard);
    document.body.appendChild(overlay);

    // Add event listeners
    wizard.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = (e.currentTarget as HTMLElement).dataset.category;
        if (category && this.wizardData) {
          this.wizardData.category = category;
          this.showTemplateSelection(category);
        }
      });
    });
  }

  private showTemplateSelection(category: string): void {
    const wizard = document.querySelector('#board-creation-wizard > div');
    if (!wizard) return;

    const templates = this.getTemplatesByCategory(category);
    
    const templatesHTML = templates.map(template => `
      <div class="template-card" data-template-id="${template.id}" 
           style="border: 1px solid #ddd; border-radius: 10px; padding: 20px; cursor: pointer; transition: all 0.2s;">
        <h4 style="margin: 0 0 10px 0;">${template.name}</h4>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">${template.description}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
          ${template.tags.map(tag => `<span style="background: #e0e0e0; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');

    wizard.innerHTML = `
      <h2>Choose a Template</h2>
      <p>Select a professional template for ${category.toUpperCase()}</p>
      
      <div style="display: grid; gap: 20px; margin-top: 30px;">
        ${templatesHTML}
      </div>
      
      <div style="margin-top: 30px; display: flex; gap: 10px;">
        <button onclick="window.boardCreationService.startCreationWizard()" 
                style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">
          Back
        </button>
        <button onclick="document.getElementById('board-creation-wizard').remove()" 
                style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">
          Cancel
        </button>
      </div>
    `;

    // Add window reference
    (window as any).boardCreationService = this;

    // Add template selection handlers
    wizard.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        const templateId = (e.currentTarget as HTMLElement).dataset.templateId;
        if (templateId) {
          const boardId = await this.createFromTemplate(templateId);
          document.getElementById('board-creation-wizard')?.remove();
          
          // Navigate to new board
          const navigationService = (window as any).moduleSystem?.get('NavigationService');
          navigationService?.navigateTo(boardId, 'board_creation');
        }
      });
    });
  }

  private parseAgeRange(ageRange: string): [number, number] {
    if (ageRange === 'All ages') return [0, -1];
    
    const match = ageRange.match(/(\d+)(?:-(\d+))?(?:\+)?/);
    if (!match) return [0, -1];
    
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : (ageRange.includes('+') ? -1 : min);
    
    return [min, max];
  }

  private calculateGoalRelevance(templateGoals: string[], userGoals: string[]): number {
    let relevance = 0;
    templateGoals.forEach(tGoal => {
      userGoals.forEach(uGoal => {
        if (tGoal.toLowerCase().includes(uGoal.toLowerCase()) ||
            uGoal.toLowerCase().includes(tGoal.toLowerCase())) {
          relevance++;
        }
      });
    });
    return relevance;
  }

  private loadCustomTemplates(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem('custom_board_templates');
      if (data) {
        const templates = JSON.parse(data);
        templates.forEach((template: BoardTemplate) => {
          this.customTemplates.set(template.id, template);
        });
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }

  private saveCustomTemplates(): void {
    if (typeof window === 'undefined') return;

    try {
      const templates = Array.from(this.customTemplates.values());
      localStorage.setItem('custom_board_templates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
    }
  }
}

// Export singleton getter function
export function getBoardCreationService(): BoardCreationService {
  return BoardCreationService.getInstance();
}