class ElizaService {
      initialize() {
        console.log('Eliza Service ready - Natural language processing');
      }
      
      processInput(text) {
        const lower = text.toLowerCase();
        
        // Check for 3rd tier drill-down opportunities
        const drillDown = this.checkForDrillDown(lower, text);
        if (drillDown) {
          // Track drill-down usage
          const analytics = moduleSystem.get('AnalyticsService');
          if (analytics) {
            analytics.track('drill_down_triggered', {
              originalText: text,
              drillDownBoard: drillDown.board,
              drillDownTitle: drillDown.title
            });
          }
          return drillDown;
        }
        
        // Check for question patterns
        if (this.isQuestionPattern(lower)) {
          return this.parseQuestion(text);
        }
        
        // Simple responses
        const responses = {
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
      
      // FULLY DYNAMIC 3rd TIER DRILL-DOWN LOGIC
      checkForDrillDown(lower, originalText) {
        // Get all available categories dynamically
        const dataService = moduleSystem.get('DataService');
        if (!dataService || !dataService.isLibraryLoaded) return null;
        
        return this.findDynamicDrillDown(lower, originalText, dataService);
      }
      
      // UNIVERSAL DYNAMIC DRILL-DOWN DETECTOR
      findDynamicDrillDown(lower, originalText, dataService) {
        console.log('Finding dynamic drill-down for:', originalText);
        console.log('DataService loaded:', dataService.isLibraryLoaded);
        
        // Get all available categories from JSON
        const categories = dataService.getCategories();
        console.log('Available categories:', categories.length, categories.map(c => c.id));
        
        // Check each category to see if it could be a drill-down opportunity
        for (const category of categories) {
          const result = this.checkCategoryDrillDown(lower, originalText, category, dataService);
          if (result) {
            console.log('Found drill-down match for category:', category.id);
            return result;
          }
        }
        
        console.log('No drill-down match found');
        return null;
      }
      
      // Check if text matches a category pattern and needs drill-down
      checkCategoryDrillDown(lower, originalText, category, dataService) {
        const categoryId = category.id;
        const categoryName = category.name || categoryId;
        
        // Get intent patterns dynamically based on category
        const intentPatterns = this.getIntentPatternsForCategory(categoryId);
        
        // Check if any intent pattern matches
        for (const pattern of intentPatterns) {
          if (this.matchesPattern(lower, pattern)) {
            // Check if user was already specific
            const tiles = dataService.getCategoryTiles(categoryId);
            if (tiles && tiles.length > 0) {
              const hasSpecific = tiles.some(tile => {
                const tileText = tile.text.toLowerCase();
                const tileSpeech = (tile.speech || '').toLowerCase();
                return lower.includes(tileText) || lower.includes(tileSpeech);
              });
              
              if (!hasSpecific) {
                // Generate drill-down dynamically
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
      
      // Generate intent patterns for each category type dynamically
      getIntentPatternsForCategory(categoryId) {
        // Get DataService to analyze actual tiles in this category
        const dataService = moduleSystem.get('DataService');
        if (!dataService || !dataService.isLibraryLoaded) {
          // Fallback patterns if data not loaded
          return [
            {trigger: ['want'], keywords: [categoryId]},
            {trigger: ['need'], keywords: [categoryId]},
            {trigger: ['want to'], keywords: [categoryId]}
          ];
        }
        
        // Get actual tiles from this category to understand patterns
        const tiles = dataService.getCategoryTiles(categoryId);
        const categoryKeywords = new Set([categoryId]);
        
        // Extract keywords from actual tiles in this category
        if (tiles && tiles.length > 0) {
          tiles.forEach(tile => {
            // Add the tile text itself as a keyword
            categoryKeywords.add(tile.text.toLowerCase());
            
            // Also extract individual meaningful words
            const words = tile.text.toLowerCase().split(' ');
            words.forEach(word => {
              if (word.length > 3 && !['want', 'need', 'have', 'like', 'with', 'from', 'this', 'that'].includes(word)) {
                categoryKeywords.add(word);
              }
            });
          });
        }
        
        // Build dynamic patterns based on actual tile content
        const keywordArray = Array.from(categoryKeywords);
        
        // Common trigger patterns for all categories
        const patterns = [
          {trigger: ['want'], keywords: keywordArray},
          {trigger: ['need'], keywords: keywordArray},
          {trigger: ['want to'], keywords: keywordArray},
          {trigger: ['i want'], keywords: keywordArray},
          {trigger: ['i need'], keywords: keywordArray},
          {trigger: ['can i have'], keywords: keywordArray},
          {trigger: ['give me'], keywords: keywordArray}
        ];
        
        // Add category-specific patterns based on category type
        if (categoryId.includes('food') || categoryId.includes('meal') || categoryId.includes('snack')) {
          patterns.push(
            {trigger: ['hungry'], keywords: ['something', 'food', ...keywordArray]},
            {trigger: ['eat'], keywords: ['something', ...keywordArray]}
          );
        } else if (categoryId.includes('drink') || categoryId.includes('beverage')) {
          patterns.push(
            {trigger: ['thirsty'], keywords: ['something', 'drink', ...keywordArray]},
            {trigger: ['drink'], keywords: ['something', ...keywordArray]}
          );
        } else if (categoryId.includes('tv') || categoryId.includes('entertainment') || categoryId.includes('show')) {
          patterns.push(
            {trigger: ['watch'], keywords: ['something', 'tv', 'show', ...keywordArray]},
            {trigger: ['want to watch'], keywords: keywordArray}
          );
        } else if (categoryId.includes('game') || categoryId.includes('play')) {
          patterns.push(
            {trigger: ['play'], keywords: ['something', 'game', ...keywordArray]},
            {trigger: ['want to play'], keywords: keywordArray}
          );
        } else if (categoryId.includes('place') || categoryId.includes('location')) {
          patterns.push(
            {trigger: ['go'], keywords: ['somewhere', 'to', ...keywordArray]},
            {trigger: ['want to go'], keywords: keywordArray}
          );
        }
        
        return patterns;
      }
      
      // Check if text matches a specific pattern
      matchesPattern(lower, pattern) {
        const hasTrigger = pattern.trigger.some(trigger => lower.includes(trigger));
        const hasKeyword = pattern.keywords.some(keyword => lower.includes(keyword));
        return hasTrigger && hasKeyword;
      }
      
      // Generate appropriate question for category dynamically
      generateQuestionForCategory(categoryId, pattern) {
        // Get DataService to understand the category better
        const dataService = moduleSystem.get('DataService');
        const category = dataService ? dataService.getCategories().find(c => c.id === categoryId) : null;
        const categoryName = category ? (category.name || categoryId) : categoryId;
        
        // Generate question based on the trigger pattern
        if (pattern && pattern.trigger) {
          const trigger = pattern.trigger[0]; // Use first trigger
          
          if (trigger.includes('eat') || categoryId.includes('food') || categoryId.includes('meal')) {
            return 'What do you want to eat?';
          } else if (trigger.includes('drink') || categoryId.includes('drink') || categoryId.includes('beverage')) {
            return 'What do you want to drink?';
          } else if (trigger.includes('watch') || categoryId.includes('tv') || categoryId.includes('entertainment')) {
            return 'What do you want to watch?';
          } else if (trigger.includes('play') || categoryId.includes('game') || categoryId.includes('toy')) {
            return 'What do you want to play?';
          } else if (trigger.includes('go') || categoryId.includes('place') || categoryId.includes('location')) {
            return 'Where do you want to go?';
          } else if (trigger.includes('see') || categoryId.includes('people') || categoryId.includes('person')) {
            return 'Who do you want to see?';
          } else if (trigger.includes('read') || categoryId.includes('book')) {
            return 'What do you want to read?';
          } else if (trigger.includes('draw') || trigger.includes('color') || categoryId.includes('art')) {
            return 'What do you want to draw?';
          } else if (trigger.includes('wear') || categoryId.includes('cloth')) {
            return 'What do you want to wear?';
          } else if (trigger.includes('feel') || categoryId.includes('emotion')) {
            return 'How do you feel?';
          } else if (trigger.includes('help')) {
            return 'What do you need help with?';
          } else if (trigger.includes('listen') || categoryId.includes('music')) {
            return 'What kind of music?';
          } else if (trigger.includes('do')) {
            return 'What do you want to do?';
          }
        }
        
        // Default question format based on category name
        const formattedName = categoryName.replace(/_/g, ' ');
        return `What kind of ${formattedName}?`;
      }
      
      // DYNAMIC HELPER METHODS USING JSON TILE SYSTEM
      hasSpecificFromCategory(text, categories) {
        const dataService = moduleSystem.get('DataService');
        if (!dataService || !dataService.isLibraryLoaded) {
          console.log('DataService not available for category check');
          return false;
        }
        
        for (const category of categories) {
          const tiles = dataService.getCategoryTiles(category);
          if (tiles && tiles.length > 0) {
            console.log(`Checking category "${category}" with ${tiles.length} tiles`);
            const found = tiles.some(tile => {
              const tileText = tile.text.toLowerCase();
              const tileSpeech = (tile.speech || '').toLowerCase();
              const textLower = text.toLowerCase();
              return textLower.includes(tileText) || textLower.includes(tileSpeech);
            });
            if (found) {
              console.log(`Found specific item in category "${category}"`);
              return true;
            }
          }
        }
        return false;
      }
      
      // Helper methods to check if specific items are already mentioned
      hasSpecificJuice(text) {
        return this.hasSpecificFromCategory(text, ['drinks', 'beverages', 'juice']);
      }
      
      hasSpecificSoda(text) {
        return this.hasSpecificFromCategory(text, ['drinks', 'beverages', 'soda']);
      }
      
      hasSpecificDrink(text) {
        return this.hasSpecificFromCategory(text, ['drinks', 'beverages', 'liquids']);
      }
      
      hasBurgerToppings(text) {
        return this.hasSpecificFromCategory(text, ['food_toppings', 'condiments', 'burger_toppings']);
      }
      
      hasSpecificPizza(text) {
        return this.hasSpecificFromCategory(text, ['pizza', 'food_types', 'italian_food']);
      }
      
      hasSpecificFood(text) {
        return this.hasSpecificFromCategory(text, ['food', 'meals', 'snacks', 'food_types']);
      }
      
      hasHomeActivity(text) {
        return this.hasSpecificFromCategory(text, ['home_activities', 'indoor_activities', 'daily_routines']);
      }
      
      hasSpecificPlayActivity(text) {
        return this.hasSpecificFromCategory(text, ['games', 'sports', 'play_activities', 'recreation']);
      }
      
      hasSpecificTVShow(text) {
        return this.hasSpecificFromCategory(text, ['tv_shows', 'entertainment', 'media', 'videos']);
      }
      
      hasSpecificMusic(text) {
        return this.hasSpecificFromCategory(text, ['music', 'songs', 'music_genres', 'audio']);
      }
      
      hasSpecificGame(text) {
        return this.hasSpecificFromCategory(text, ['games', 'sports', 'toys', 'recreation']);
      }
      
      hasSpecificActivity(text) {
        return this.hasSpecificFromCategory(text, ['activities', 'exercise', 'physical_activities', 'actions']);
      }
      
      hasSpecificPlace(text) {
        return this.hasSpecificFromCategory(text, ['places', 'locations', 'buildings', 'destinations']);
      }
      
      hasSpecificPerson(text) {
        return this.hasSpecificFromCategory(text, ['people', 'family', 'relationships', 'social']);
      }
      
      hasSpecificToy(text) {
        return this.hasSpecificFromCategory(text, ['toys', 'games', 'playthings', 'recreation']);
      }
      
      hasSpecificBook(text) {
        return this.hasSpecificFromCategory(text, ['books', 'reading', 'literature', 'stories']);
      }
      
      hasSpecificArt(text) {
        return this.hasSpecificFromCategory(text, ['art', 'drawing', 'creativity', 'crafts']);
      }
      
      hasSpecificClothing(text) {
        return this.hasSpecificFromCategory(text, ['clothing', 'clothes', 'apparel', 'fashion']);
      }
      
      hasSpecificFeeling(text) {
        return this.hasSpecificFromCategory(text, ['emotions', 'feelings', 'mood', 'social_emotional']);
      }
      
      hasSpecificHelp(text) {
        return this.hasSpecificFromCategory(text, ['help', 'assistance', 'support', 'care', 'needs']);
      }
      
      isQuestionPattern(text) {
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
      
      parseQuestion(text) {
        // Extract items from question
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
      
      extractQuestionTitle(text) {
        // Clean up the question for title
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
      
      extractItems(text) {
        // Remove question words and punctuation
        let cleaned = text.toLowerCase()
          .replace(/do you want|would you like|can i get you|do you need|choose between|pick from|select from|which one|what about/g, '')
          .replace(/\?|!|\./g, '')
          .trim();
        
        // First try to split by "or"
        let items = [];
        if (cleaned.includes(' or ')) {
          items = cleaned.split(/\s+or\s+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        } 
        // Then try "and"
        else if (cleaned.includes(' and ')) {
          items = cleaned.split(/\s+and\s+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
        // Then try commas
        else if (cleaned.includes(',')) {
          items = cleaned.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
        // If no separators found, try splitting by multiple spaces
        else if (cleaned.includes('  ')) {
          items = cleaned.split(/\s{2,}/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
        // Otherwise split by single spaces for short phrases
        else {
          const words = cleaned.split(' ').filter(w => w.length > 0);
          if (words.length <= 6) {
            items = words;
          }
        }
        
        // Clean up items - remove stray "or", "and" etc
        items = items.filter(item => !['or', 'and', 'the', 'a', 'an'].includes(item));
        
        return items.map(item => ({
          text: item,
          emoji: detectEmoji(item),
          speech: item
        }));
      }
    }