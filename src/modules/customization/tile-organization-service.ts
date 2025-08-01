/**
 * Tile Organization Service
 * Module 40: Organize tiles with drag-and-drop, categories, and smart grouping
 */

interface TileGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  tiles: string[]; // tile IDs
  order: number;
  isCollapsed?: boolean;
  isLocked?: boolean;
}

interface TileCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  parent?: string;
  children?: string[];
  tileCount: number;
}

interface OrganizationPreset {
  id: string;
  name: string;
  description: string;
  categories: TileCategory[];
  groups: TileGroup[];
  layout: OrganizationLayout;
}

interface OrganizationLayout {
  type: 'grid' | 'list' | 'category' | 'frequency' | 'alphabetical';
  groupBy?: 'category' | 'usage' | 'color' | 'manual';
  sortBy?: 'name' | 'usage' | 'recent' | 'manual';
  showEmptyGroups: boolean;
  compactMode: boolean;
}

interface DragDropState {
  isDragging: boolean;
  draggedTileId: string | null;
  draggedGroupId: string | null;
  dropTarget: string | null;
  ghostPosition: { x: number; y: number } | null;
}

interface OrganizationAction {
  id: string;
  type: 'move' | 'group' | 'ungroup' | 'reorder' | 'categorize';
  timestamp: string;
  tileIds: string[];
  fromGroup?: string;
  toGroup?: string;
  fromPosition?: number;
  toPosition?: number;
  category?: string;
}

export class TileOrganizationService {
  private static instance: TileOrganizationService;
  private groups: Map<string, TileGroup> = new Map();
  private categories: Map<string, TileCategory> = new Map();
  private presets: Map<string, OrganizationPreset> = new Map();
  private dragDropState: DragDropState = {
    isDragging: false,
    draggedTileId: null,
    draggedGroupId: null,
    dropTarget: null,
    ghostPosition: null
  };
  private organizationHistory: OrganizationAction[] = [];
  private currentLayout: OrganizationLayout = {
    type: 'grid',
    groupBy: 'category',
    sortBy: 'name',
    showEmptyGroups: false,
    compactMode: false
  };

  private constructor() {
    this.initializeDefaultCategories();
    this.initializePresets();
  }

  static getInstance(): TileOrganizationService {
    if (!TileOrganizationService.instance) {
      TileOrganizationService.instance = new TileOrganizationService();
    }
    return TileOrganizationService.instance;
  }

  initialize(): void {
    console.log('📊 Tile Organization Service ready - Drag-and-drop tile management');
    this.loadOrganizationData();
    this.setupDragDropHandlers();
    this.setupKeyboardShortcuts();
  }

  /**
   * Initialize default categories
   */
  private initializeDefaultCategories(): void {
    const defaultCategories: TileCategory[] = [
      {
        id: 'actions',
        name: 'Actions',
        color: '#2196F3',
        icon: '🎯',
        tileCount: 0
      },
      {
        id: 'objects',
        name: 'Objects',
        color: '#4CAF50',
        icon: '📦',
        tileCount: 0
      },
      {
        id: 'people',
        name: 'People',
        color: '#FF9800',
        icon: '👥',
        tileCount: 0
      },
      {
        id: 'places',
        name: 'Places',
        color: '#9C27B0',
        icon: '📍',
        tileCount: 0
      },
      {
        id: 'feelings',
        name: 'Feelings',
        color: '#F44336',
        icon: '❤️',
        tileCount: 0
      },
      {
        id: 'descriptors',
        name: 'Descriptors',
        color: '#00BCD4',
        icon: '🏷️',
        tileCount: 0
      },
      {
        id: 'questions',
        name: 'Questions',
        color: '#FF5722',
        icon: '❓',
        tileCount: 0
      },
      {
        id: 'social',
        name: 'Social',
        color: '#795548',
        icon: '💬',
        tileCount: 0
      }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Initialize organization presets
   */
  private initializePresets(): void {
    const presets: OrganizationPreset[] = [
      {
        id: 'frequency_based',
        name: 'Frequency Based',
        description: 'Organize by usage frequency',
        categories: [],
        groups: [
          {
            id: 'most_used',
            name: 'Most Used',
            color: '#4CAF50',
            icon: '⭐',
            tiles: [],
            order: 1
          },
          {
            id: 'commonly_used',
            name: 'Commonly Used',
            color: '#2196F3',
            icon: '👍',
            tiles: [],
            order: 2
          },
          {
            id: 'occasionally_used',
            name: 'Occasionally Used',
            color: '#FF9800',
            icon: '🔄',
            tiles: [],
            order: 3
          },
          {
            id: 'rarely_used',
            name: 'Rarely Used',
            color: '#9E9E9E',
            icon: '📦',
            tiles: [],
            order: 4
          }
        ],
        layout: {
          type: 'frequency',
          groupBy: 'usage',
          sortBy: 'usage',
          showEmptyGroups: false,
          compactMode: false
        }
      },
      {
        id: 'categorical',
        name: 'Categorical',
        description: 'Organize by tile categories',
        categories: Array.from(this.categories.values()),
        groups: [],
        layout: {
          type: 'category',
          groupBy: 'category',
          sortBy: 'name',
          showEmptyGroups: false,
          compactMode: false
        }
      },
      {
        id: 'alphabetical',
        name: 'Alphabetical',
        description: 'A-Z organization',
        categories: [],
        groups: this.generateAlphabeticalGroups(),
        layout: {
          type: 'alphabetical',
          groupBy: 'manual',
          sortBy: 'name',
          showEmptyGroups: false,
          compactMode: true
        }
      },
      {
        id: 'color_coded',
        name: 'Color Coded',
        description: 'Group by tile colors',
        categories: [],
        groups: [],
        layout: {
          type: 'grid',
          groupBy: 'color',
          sortBy: 'name',
          showEmptyGroups: false,
          compactMode: false
        }
      }
    ];

    presets.forEach(preset => {
      this.presets.set(preset.id, preset);
    });
  }

  /**
   * Create a new tile group
   */
  createGroup(name: string, color: string, icon?: string): string {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const group: TileGroup = {
      id: groupId,
      name,
      color,
      icon,
      tiles: [],
      order: this.groups.size + 1,
      isCollapsed: false,
      isLocked: false
    };

    this.groups.set(groupId, group);
    this.saveOrganizationData();

    console.log(`📁 Created group: ${name}`);
    return groupId;
  }

  /**
   * Add tiles to a group
   */
  addTilesToGroup(groupId: string, tileIds: string[]): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    // Remove tiles from other groups first
    tileIds.forEach(tileId => {
      this.removeTileFromAllGroups(tileId);
    });

    // Add to new group
    group.tiles.push(...tileIds);
    
    // Track action
    this.trackAction({
      type: 'group',
      tileIds,
      toGroup: groupId
    });

    this.saveOrganizationData();

    console.log(`➕ Added ${tileIds.length} tiles to group: ${group.name}`);
    return true;
  }

  /**
   * Move tile between groups or positions
   */
  moveTile(
    tileId: string,
    fromGroup: string | null,
    toGroup: string | null,
    toPosition?: number
  ): boolean {
    // Remove from source
    if (fromGroup) {
      const sourceGroup = this.groups.get(fromGroup);
      if (sourceGroup) {
        sourceGroup.tiles = sourceGroup.tiles.filter(id => id !== tileId);
      }
    }

    // Add to destination
    if (toGroup) {
      const destGroup = this.groups.get(toGroup);
      if (destGroup) {
        if (toPosition !== undefined && toPosition >= 0) {
          destGroup.tiles.splice(toPosition, 0, tileId);
        } else {
          destGroup.tiles.push(tileId);
        }
      }
    }

    // Track action
    this.trackAction({
      type: 'move',
      tileIds: [tileId],
      fromGroup: fromGroup || undefined,
      toGroup: toGroup || undefined,
      toPosition
    });

    this.saveOrganizationData();
    return true;
  }

  /**
   * Categorize tiles
   */
  categorizeTile(tileId: string, categoryId: string): boolean {
    const category = this.categories.get(categoryId);
    if (!category) return false;

    const tileManagement = (window as any).moduleSystem?.get('TileManagementService');
    const tile = tileManagement?.getTile(tileId);
    
    if (!tile) return false;

    // Update tile category
    tile.category = categoryId;
    tileManagement.updateTile(tileId, { category: categoryId });

    // Update category count
    category.tileCount++;

    // Track action
    this.trackAction({
      type: 'categorize',
      tileIds: [tileId],
      category: categoryId
    });

    console.log(`🏷️ Categorized tile as: ${category.name}`);
    return true;
  }

  /**
   * Apply organization preset
   */
  applyPreset(presetId: string): boolean {
    const preset = this.presets.get(presetId);
    if (!preset) return false;

    // Clear existing groups
    this.groups.clear();

    // Apply preset groups
    preset.groups.forEach(group => {
      this.groups.set(group.id, { ...group, tiles: [] });
    });

    // Apply layout
    this.currentLayout = { ...preset.layout };

    // Reorganize tiles based on preset
    this.reorganizeTiles();

    console.log(`📋 Applied preset: ${preset.name}`);
    return true;
  }

  /**
   * Auto-organize tiles
   */
  autoOrganize(
    strategy: 'smart' | 'frequency' | 'category' | 'alphabetical' = 'smart'
  ): void {
    const tileManagement = (window as any).moduleSystem?.get('TileManagementService');
    const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
    
    if (!tileManagement) return;

    const allTiles = tileManagement.getAllTiles();

    switch (strategy) {
      case 'smart':
        // Use AI-like logic to organize based on multiple factors
        this.smartOrganize(allTiles, analyticsService);
        break;
      
      case 'frequency':
        // Organize by usage frequency
        this.organizeByFrequency(allTiles, analyticsService);
        break;
      
      case 'category':
        // Organize by categories
        this.organizeByCategory(allTiles);
        break;
      
      case 'alphabetical':
        // Simple A-Z organization
        this.organizeAlphabetically(allTiles);
        break;
    }

    this.saveOrganizationData();
    console.log(`🤖 Auto-organized tiles using ${strategy} strategy`);
  }

  /**
   * Search and filter tiles
   */
  searchTiles(query: string, filters?: {
    category?: string;
    group?: string;
    color?: string;
  }): string[] {
    const tileManagement = (window as any).moduleSystem?.get('TileManagementService');
    if (!tileManagement) return [];

    let tiles = tileManagement.getAllTiles();

    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      tiles = tiles.filter(tile => 
        tile.text.toLowerCase().includes(lowerQuery) ||
        tile.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters?.category) {
      tiles = tiles.filter(tile => tile.category === filters.category);
    }

    if (filters?.group) {
      const group = this.groups.get(filters.group);
      if (group) {
        tiles = tiles.filter(tile => group.tiles.includes(tile.id));
      }
    }

    if (filters?.color) {
      tiles = tiles.filter(tile => tile.backgroundColor === filters.color);
    }

    return tiles.map(tile => tile.id);
  }

  /**
   * Get organization statistics
   */
  getOrganizationStats(): {
    totalGroups: number;
    totalCategories: number;
    tilesPerGroup: Map<string, number>;
    tilesPerCategory: Map<string, number>;
    unorganizedTiles: number;
  } {
    const tilesPerGroup = new Map<string, number>();
    const tilesPerCategory = new Map<string, number>();

    // Count tiles per group
    this.groups.forEach((group, id) => {
      tilesPerGroup.set(id, group.tiles.length);
    });

    // Count tiles per category
    const tileManagement = (window as any).moduleSystem?.get('TileManagementService');
    if (tileManagement) {
      const allTiles = tileManagement.getAllTiles();
      
      allTiles.forEach((tile: any) => {
        if (tile.category) {
          const count = tilesPerCategory.get(tile.category) || 0;
          tilesPerCategory.set(tile.category, count + 1);
        }
      });

      // Count unorganized tiles
      const organizedTileIds = new Set<string>();
      this.groups.forEach(group => {
        group.tiles.forEach(id => organizedTileIds.add(id));
      });

      const unorganizedTiles = allTiles.filter((tile: any) => 
        !organizedTileIds.has(tile.id)
      ).length;

      return {
        totalGroups: this.groups.size,
        totalCategories: this.categories.size,
        tilesPerGroup,
        tilesPerCategory,
        unorganizedTiles
      };
    }

    return {
      totalGroups: this.groups.size,
      totalCategories: this.categories.size,
      tilesPerGroup,
      tilesPerCategory,
      unorganizedTiles: 0
    };
  }

  /**
   * Undo last organization action
   */
  undo(): boolean {
    if (this.organizationHistory.length === 0) return false;

    const lastAction = this.organizationHistory.pop();
    if (!lastAction) return false;

    // Reverse the action
    switch (lastAction.type) {
      case 'move':
        // Move back to original position
        if (lastAction.tileIds[0]) {
          this.moveTile(
            lastAction.tileIds[0],
            lastAction.toGroup || null,
            lastAction.fromGroup || null,
            lastAction.fromPosition
          );
        }
        break;

      case 'group':
      case 'ungroup':
        // Reverse grouping action
        // Implementation would depend on tracking more state
        break;
    }

    console.log(`↩️ Undid action: ${lastAction.type}`);
    return true;
  }

  /**
   * Export organization configuration
   */
  exportConfiguration(): {
    groups: TileGroup[];
    categories: TileCategory[];
    layout: OrganizationLayout;
  } {
    return {
      groups: Array.from(this.groups.values()),
      categories: Array.from(this.categories.values()),
      layout: { ...this.currentLayout }
    };
  }

  /**
   * Import organization configuration
   */
  importConfiguration(config: {
    groups: TileGroup[];
    categories: TileCategory[];
    layout: OrganizationLayout;
  }): void {
    // Clear existing
    this.groups.clear();
    this.categories.clear();

    // Import groups
    config.groups.forEach(group => {
      this.groups.set(group.id, group);
    });

    // Import categories
    config.categories.forEach(category => {
      this.categories.set(category.id, category);
    });

    // Import layout
    this.currentLayout = { ...config.layout };

    this.saveOrganizationData();
    console.log('📥 Imported organization configuration');
  }

  // Private helper methods
  private setupDragDropHandlers(): void {
    if (typeof document === 'undefined') return;

    // Global drag event handlers would be set up here
    // This would integrate with the tile rendering system
  }

  private setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + G = Create new group
      if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
        event.preventDefault();
        this.showCreateGroupDialog();
      }

      // Ctrl/Cmd + O = Auto-organize
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        this.autoOrganize('smart');
      }

      // Ctrl/Cmd + Z = Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        this.undo();
      }
    });
  }

  private removeTileFromAllGroups(tileId: string): void {
    this.groups.forEach(group => {
      group.tiles = group.tiles.filter(id => id !== tileId);
    });
  }

  private reorganizeTiles(): void {
    const tileManagement = (window as any).moduleSystem?.get('TileManagementService');
    if (!tileManagement) return;

    const allTiles = tileManagement.getAllTiles();

    // Reorganize based on current layout
    switch (this.currentLayout.groupBy) {
      case 'category':
        this.organizeByCategory(allTiles);
        break;
      case 'usage':
        const analyticsService = (window as any).moduleSystem?.get('AnalyticsService');
        this.organizeByFrequency(allTiles, analyticsService);
        break;
      case 'color':
        this.organizeByColor(allTiles);
        break;
    }
  }

  private smartOrganize(tiles: any[], analyticsService: any): void {
    // Smart organization would consider:
    // 1. Usage frequency
    // 2. Categories
    // 3. User patterns
    // 4. Time of day patterns

    // For now, organize by frequency with category consideration
    this.organizeByFrequency(tiles, analyticsService);
  }

  private organizeByFrequency(tiles: any[], analyticsService: any): void {
    if (!analyticsService) return;

    const usage = analyticsService.getTileUsageStats();
    
    // Sort tiles by usage
    tiles.sort((a, b) => {
      const aUsage = usage[a.id] || 0;
      const bUsage = usage[b.id] || 0;
      return bUsage - aUsage;
    });

    // Distribute to frequency groups
    const groups = ['most_used', 'commonly_used', 'occasionally_used', 'rarely_used'];
    const tilesPerGroup = Math.ceil(tiles.length / groups.length);

    groups.forEach((groupId, index) => {
      const group = this.groups.get(groupId);
      if (group) {
        const start = index * tilesPerGroup;
        const end = Math.min(start + tilesPerGroup, tiles.length);
        group.tiles = tiles.slice(start, end).map(t => t.id);
      }
    });
  }

  private organizeByCategory(tiles: any[]): void {
    // Create groups for each category
    this.categories.forEach((category, categoryId) => {
      let group = Array.from(this.groups.values())
        .find(g => g.name === category.name);
      
      if (!group) {
        const groupId = this.createGroup(category.name, category.color, category.icon);
        group = this.groups.get(groupId);
      }

      if (group) {
        group.tiles = tiles
          .filter(tile => tile.category === categoryId)
          .map(tile => tile.id);
      }
    });

    // Handle uncategorized tiles
    const uncategorizedTiles = tiles.filter(tile => !tile.category);
    if (uncategorizedTiles.length > 0) {
      let uncategorizedGroup = Array.from(this.groups.values())
        .find(g => g.name === 'Uncategorized');
      
      if (!uncategorizedGroup) {
        const groupId = this.createGroup('Uncategorized', '#9E9E9E', '❓');
        uncategorizedGroup = this.groups.get(groupId);
      }

      if (uncategorizedGroup) {
        uncategorizedGroup.tiles = uncategorizedTiles.map(t => t.id);
      }
    }
  }

  private organizeByColor(tiles: any[]): void {
    // Group by color
    const colorGroups = new Map<string, any[]>();
    
    tiles.forEach(tile => {
      const color = tile.backgroundColor || '#2196F3';
      const group = colorGroups.get(color) || [];
      group.push(tile);
      colorGroups.set(color, group);
    });

    // Create groups for each color
    colorGroups.forEach((colorTiles, color) => {
      const groupName = `Color: ${color}`;
      let group = Array.from(this.groups.values())
        .find(g => g.name === groupName);
      
      if (!group) {
        const groupId = this.createGroup(groupName, color, '🎨');
        group = this.groups.get(groupId);
      }

      if (group) {
        group.tiles = colorTiles.map(t => t.id);
      }
    });
  }

  private organizeAlphabetically(tiles: any[]): void {
    // Sort tiles alphabetically
    tiles.sort((a, b) => a.text.localeCompare(b.text));

    // Distribute to alphabetical groups
    const groups = this.generateAlphabeticalGroups();
    
    tiles.forEach(tile => {
      const firstLetter = tile.text[0].toUpperCase();
      const group = groups.find(g => g.name.includes(firstLetter));
      
      if (group) {
        const existingGroup = this.groups.get(group.id);
        if (existingGroup) {
          existingGroup.tiles.push(tile.id);
        }
      }
    });
  }

  private generateAlphabeticalGroups(): TileGroup[] {
    const groups: TileGroup[] = [];
    const ranges = [
      { id: 'a-e', name: 'A-E', letters: ['A', 'B', 'C', 'D', 'E'] },
      { id: 'f-j', name: 'F-J', letters: ['F', 'G', 'H', 'I', 'J'] },
      { id: 'k-o', name: 'K-O', letters: ['K', 'L', 'M', 'N', 'O'] },
      { id: 'p-t', name: 'P-T', letters: ['P', 'Q', 'R', 'S', 'T'] },
      { id: 'u-z', name: 'U-Z', letters: ['U', 'V', 'W', 'X', 'Y', 'Z'] },
      { id: 'other', name: 'Other', letters: [] }
    ];

    ranges.forEach((range, index) => {
      groups.push({
        id: `alpha_${range.id}`,
        name: range.name,
        color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#607D8B'][index],
        icon: '🔤',
        tiles: [],
        order: index + 1,
        isCollapsed: false,
        isLocked: false
      });
    });

    return groups;
  }

  private trackAction(action: Omit<OrganizationAction, 'id' | 'timestamp'>): void {
    const fullAction: OrganizationAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.organizationHistory.push(fullAction);
    
    // Keep only last 50 actions
    if (this.organizationHistory.length > 50) {
      this.organizationHistory = this.organizationHistory.slice(-50);
    }
  }

  private showCreateGroupDialog(): void {
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
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

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 15px;
      padding: 30px;
      max-width: 400px;
      width: 90vw;
    `;

    dialog.innerHTML = `
      <h2 style="margin: 0 0 20px 0;">Create New Group</h2>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Group Name</label>
        <input type="text" id="group-name" placeholder="My Group" 
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Color</label>
        <input type="color" id="group-color" value="#2196F3" 
               style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Icon (optional)</label>
        <input type="text" id="group-icon" placeholder="📁" 
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="this.closest('.tile-org-overlay').remove()" 
                style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">
          Cancel
        </button>
        <button onclick="window.tileOrgService.createGroupFromDialog()" 
                style="padding: 10px 20px; border: none; background: #2196F3; color: white; border-radius: 5px; cursor: pointer;">
          Create Group
        </button>
      </div>
    `;

    overlay.className = 'tile-org-overlay';
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Store reference for dialog access
    (window as any).tileOrgService = this;

    // Focus name input
    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    nameInput?.focus();
  }

  createGroupFromDialog(): void {
    const name = (document.getElementById('group-name') as HTMLInputElement)?.value;
    const color = (document.getElementById('group-color') as HTMLInputElement)?.value;
    const icon = (document.getElementById('group-icon') as HTMLInputElement)?.value;

    if (name) {
      this.createGroup(name, color, icon);
      document.querySelector('.tile-org-overlay')?.remove();
    }
  }

  private loadOrganizationData(): void {
    if (typeof window === 'undefined') return;

    try {
      const groupsData = localStorage.getItem('tile_groups');
      if (groupsData) {
        const groups = JSON.parse(groupsData);
        groups.forEach((group: TileGroup) => {
          this.groups.set(group.id, group);
        });
      }

      const layoutData = localStorage.getItem('organization_layout');
      if (layoutData) {
        this.currentLayout = JSON.parse(layoutData);
      }

      const historyData = localStorage.getItem('organization_history');
      if (historyData) {
        this.organizationHistory = JSON.parse(historyData);
      }
    } catch (error) {
      console.error('Failed to load organization data:', error);
    }
  }

  private saveOrganizationData(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'tile_groups',
        JSON.stringify(Array.from(this.groups.values()))
      );

      localStorage.setItem(
        'organization_layout',
        JSON.stringify(this.currentLayout)
      );

      localStorage.setItem(
        'organization_history',
        JSON.stringify(this.organizationHistory)
      );
    } catch (error) {
      console.error('Failed to save organization data:', error);
    }
  }
}

// Export singleton getter function
export function getTileOrganizationService(): TileOrganizationService {
  return TileOrganizationService.getInstance();
}