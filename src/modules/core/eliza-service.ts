import { getDataService } from './data-service';
import { getAnalyticsService } from './analytics-service';
import { Category, Tile } from './data-service';

export interface ElizaResponse {
  type: 'response' | 'question_board' | 'drill_down';
  text?: string;
  title?: string;
  items?: Array<{ emoji: string; text: string; speech?: string }>;
  board?: string;
  context?: string;
  dynamicCategory?: string;
}

interface IntentPattern {
  trigger: string[];
  keywords: string[];
}

export class ElizaService {
  private dataService: ReturnType<typeof getDataService> | null = null;
  private analytics: ReturnType<typeof getAnalyticsService> | null = null;

  initialize() {
    console.log('Eliza Service ready - Natural language processing');
    this.dataService = getDataService();
    this.analytics = getAnalyticsService();
  }

  processInput(text: string): ElizaResponse | null {
    const lower = text.toLowerCase();

    // Check for 3rd tier drill-down opportunities
    const drillDown = this.checkForDrillDown(lower, text);
    if (drillDown) {
      // Track drill-down usage
      this.analytics?.track('drill_down_triggered', {
        originalText: text,
        drillDownBoard: drillDown.board,
        drillDownTitle: drillDown.title
      });
      return drillDown;
    }

    // Check for question patterns
    if (this.isQuestionPattern(lower)) {
      return this.parseQuestion(text);
    }

    // Simple responses
    const responses: Record<string, string> = {
      'hello': 'Hello! How can I help you?',
      'how are you': 'I am here to help you communicate!',
      'thank you': 'You are welcome!',
      'help': 'I can help you communicate. What do you need?'
    };

    for (const [key, response] of Object.entries(responses)) {
      if (lower.includes(key)) {
        return { type: 'response', text: response };
      }
    }

    // If no pattern matched, try to parse as a simple list
    const items = this.extractItems(text);
    if (items.length >= 2) {
      return {
        type: 'question_board',
        title: 'Choose One',
        items: items
      };
    }

    return null;
  }

  private checkForDrillDown(lower: string, originalText: string): ElizaResponse | null {
    if (!this.dataService || !this.dataService.isLoaded()) return null;
    
    return this.findDynamicDrillDown(lower, originalText);
  }

  private findDynamicDrillDown(lower: string, originalText: string): ElizaResponse | null {
    if (!this.dataService) return null;

    const categories = this.dataService.getCategories();
    
    for (const category of categories) {
      const result = this.checkCategoryDrillDown(lower, originalText, category);
      if (result) {
        return result;
      }
    }
    
    return null;
  }

  private checkCategoryDrillDown(lower: string, originalText: string, category: Category): ElizaResponse | null {
    if (!this.dataService) return null;

    const categoryId = category.id;
    const intentPatterns = this.getIntentPatternsForCategory(categoryId);
    
    for (const pattern of intentPatterns) {
      if (this.matchesPattern(lower, pattern)) {
        const tiles = this.dataService.getCategoryTiles(categoryId);
        if (tiles && tiles.length > 0) {
          const hasSpecific = tiles.some(tile => {
            const tileText = tile.text.toLowerCase();
            const tileSpeech = (tile.speech || '').toLowerCase();
            return lower.includes(tileText) || lower.includes(tileSpeech);
          });
          
          if (!hasSpecific) {
            return {
              type: 'drill_down',
              board: `dynamic_${categoryId}`,
              title: this.generateQuestionForCategory(categoryId, pattern),
              context: originalText,
              dynamicCategory: categoryId
            };
          }
        }
      }
    }
    
    return null;
  }

  private getIntentPatternsForCategory(categoryId: string): IntentPattern[] {
    if (!this.dataService || !this.dataService.isLoaded()) {
      return [
        { trigger: ['want'], keywords: [categoryId] },
        { trigger: ['need'], keywords: [categoryId] },
        { trigger: ['want to'], keywords: [categoryId] }
      ];
    }
    
    const tiles = this.dataService.getCategoryTiles(categoryId);
    const categoryKeywords = new Set([categoryId]);
    
    if (tiles && tiles.length > 0) {
      tiles.forEach(tile => {
        categoryKeywords.add(tile.text.toLowerCase());
        
        const words = tile.text.toLowerCase().split(' ');
        words.forEach(word => {
          if (word.length > 3 && !['want', 'need', 'have', 'like', 'with', 'from', 'this', 'that'].includes(word)) {
            categoryKeywords.add(word);
          }
        });
      });
    }
    
    const keywordArray = Array.from(categoryKeywords);
    
    const patterns: IntentPattern[] = [
      { trigger: ['want'], keywords: keywordArray },
      { trigger: ['need'], keywords: keywordArray },
      { trigger: ['want to'], keywords: keywordArray },
      { trigger: ['i want'], keywords: keywordArray },
      { trigger: ['i need'], keywords: keywordArray },
      { trigger: ['can i have'], keywords: keywordArray },
      { trigger: ['give me'], keywords: keywordArray }
    ];
    
    // Add category-specific patterns
    if (categoryId.includes('food') || categoryId.includes('meal')) {
      patterns.push(
        { trigger: ['hungry'], keywords: ['something', 'food', ...keywordArray] },
        { trigger: ['eat'], keywords: ['something', ...keywordArray] }
      );
    } else if (categoryId.includes('drink') || categoryId.includes('beverage')) {
      patterns.push(
        { trigger: ['thirsty'], keywords: ['something', 'drink', ...keywordArray] },
        { trigger: ['drink'], keywords: ['something', ...keywordArray] }
      );
    } else if (categoryId.includes('tv') || categoryId.includes('entertainment')) {
      patterns.push(
        { trigger: ['watch'], keywords: ['something', 'tv', 'show', ...keywordArray] },
        { trigger: ['want to watch'], keywords: keywordArray }
      );
    } else if (categoryId.includes('game') || categoryId.includes('play')) {
      patterns.push(
        { trigger: ['play'], keywords: ['something', 'game', ...keywordArray] },
        { trigger: ['want to play'], keywords: keywordArray }
      );
    } else if (categoryId.includes('place') || categoryId.includes('location')) {
      patterns.push(
        { trigger: ['go'], keywords: ['somewhere', 'to', ...keywordArray] },
        { trigger: ['want to go'], keywords: keywordArray }
      );
    }
    
    return patterns;
  }

  private matchesPattern(lower: string, pattern: IntentPattern): boolean {
    const hasTrigger = pattern.trigger.some(trigger => lower.includes(trigger));
    const hasKeyword = pattern.keywords.some(keyword => lower.includes(keyword));
    return hasTrigger && hasKeyword;
  }

  private generateQuestionForCategory(categoryId: string, pattern: IntentPattern): string {
    if (!this.dataService) return `What kind of ${categoryId}?`;

    const category = this.dataService.getCategories().find(c => c.id === categoryId);
    const categoryName = category ? (category.name || categoryId) : categoryId;
    
    if (pattern && pattern.trigger) {
      const trigger = pattern.trigger[0];
      
      if (trigger.includes('eat') || categoryId.includes('food')) {
        return 'What do you want to eat?';
      } else if (trigger.includes('drink') || categoryId.includes('drink')) {
        return 'What do you want to drink?';
      } else if (trigger.includes('watch') || categoryId.includes('entertainment')) {
        return 'What do you want to watch?';
      } else if (trigger.includes('play') || categoryId.includes('game')) {
        return 'What do you want to play?';
      } else if (trigger.includes('go') || categoryId.includes('place')) {
        return 'Where do you want to go?';
      } else if (trigger.includes('see') || categoryId.includes('people')) {
        return 'Who do you want to see?';
      } else if (trigger.includes('feel') || categoryId.includes('emotion')) {
        return 'How do you feel?';
      } else if (trigger.includes('help')) {
        return 'What do you need help with?';
      }
    }
    
    const formattedName = categoryName.replace(/_/g, ' ');
    return `What kind of ${formattedName}?`;
  }

  private isQuestionPattern(text: string): boolean {
    const patterns = [
      'do you want',
      'would you like',
      'can i get you',
      'do you need',
      'choose between',
      'pick from',
      'select from',
      'which one',
      'what about'
    ];
    
    return patterns.some(pattern => text.includes(pattern));
  }

  private parseQuestion(text: string): ElizaResponse | null {
    const items = this.extractItems(text);
    
    if (items.length > 0) {
      return {
        type: 'question_board',
        title: this.extractQuestionTitle(text),
        items: items
      };
    }
    
    return null;
  }

  private extractQuestionTitle(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.includes('do you want')) return 'Do You Want?';
    if (lower.includes('would you like')) return 'Would You Like?';
    if (lower.includes('can i get you')) return 'Can I Get You?';
    if (lower.includes('do you need')) return 'Do You Need?';
    if (lower.includes('choose')) return 'Choose One';
    if (lower.includes('pick')) return 'Pick One';
    if (lower.includes('which')) return 'Which One?';
    
    return 'Choose';
  }

  private extractItems(text: string): Array<{ emoji: string; text: string; speech?: string }> {
    // Remove question words and punctuation
    let cleaned = text.toLowerCase()
      .replace(/do you want|would you like|can i get you|do you need|choose between|pick from|select from|which one|what about/g, '')
      .replace(/\?|!|\./g, '')
      .trim();
    
    let items: string[] = [];
    
    // Try different separators
    if (cleaned.includes(' or ')) {
      items = cleaned.split(/\s+or\s+/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    } else if (cleaned.includes(' and ')) {
      items = cleaned.split(/\s+and\s+/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    } else if (cleaned.includes(',')) {
      items = cleaned.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    } else if (cleaned.includes('  ')) {
      items = cleaned.split(/\s{2,}/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    // Convert to Eliza item format
    return items.map(item => ({
      emoji: this.getEmojiForItem(item),
      text: item.toUpperCase(),
      speech: item
    }));
  }

  private getEmojiForItem(item: string): string {
    // Try to find a matching tile in our data service
    if (this.dataService) {
      const results = this.dataService.searchTiles(item);
      if (results.length > 0) {
        return results[0].emoji;
      }
    }
    
    // Default emoji mappings
    const emojiMap: Record<string, string> = {
      'yes': '✅',
      'no': '❌',
      'maybe': '🤔',
      'apple': '🍎',
      'banana': '🍌',
      'cookie': '🍪',
      'water': '💧',
      'milk': '🥛',
      'juice': '🧃'
    };
    
    return emojiMap[item.toLowerCase()] || '❓';
  }
}

// Singleton instance
let elizaServiceInstance: ElizaService | null = null;

export function getElizaService(): ElizaService {
  if (!elizaServiceInstance) {
    elizaServiceInstance = new ElizaService();
  }
  return elizaServiceInstance;
}