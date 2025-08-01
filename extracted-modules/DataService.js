class DataService {
      constructor() {
        this.cache = new Map();
        this.tileLibrary = new Map();
        this.isLibraryLoaded = false;
        this.categories = [];
        this.tiles = {};
      }
      
      initialize() { 
        console.log('Data Service ready');
        this.loadTileLibrary();
      }
      
      // Load embedded tile library
      loadTileLibrary() {
        console.log('Loading embedded TinkyBink tile library...');
        
        // Define categories
        this.categories = [
          { id: 'food', name: 'Food & Meals', emoji: '🍎', tileCount: 150 },
          { id: 'drinks', name: 'Drinks & Beverages', emoji: '🥤', tileCount: 80 },
          { id: 'people', name: 'People & Family', emoji: '👥', tileCount: 120 },
          { id: 'places', name: 'Places & Locations', emoji: '📍', tileCount: 100 },
          { id: 'activities', name: 'Activities & Actions', emoji: '🎯', tileCount: 200 },
          { id: 'emotions', name: 'Feelings & Emotions', emoji: '😊', tileCount: 60 },
          { id: 'entertainment', name: 'TV & Entertainment', emoji: '📺', tileCount: 150 },
          { id: 'games', name: 'Games & Toys', emoji: '🎮', tileCount: 100 },
          { id: 'music', name: 'Music & Songs', emoji: '🎵', tileCount: 80 },
          { id: 'toys', name: 'Toys & Play Items', emoji: '🧸', tileCount: 90 },
          { id: 'books', name: 'Books & Reading', emoji: '📚', tileCount: 70 },
          { id: 'art', name: 'Art & Creativity', emoji: '🎨', tileCount: 60 },
          { id: 'clothing', name: 'Clothes & Apparel', emoji: '👕', tileCount: 80 },
          { id: 'help', name: 'Help & Assistance', emoji: '🆘', tileCount: 50 },
          { id: 'time', name: 'Time & Schedule', emoji: '⏰', tileCount: 40 },
          { id: 'weather', name: 'Weather & Seasons', emoji: '☀️', tileCount: 50 },
          { id: 'school', name: 'School & Learning', emoji: '🏫', tileCount: 100 },
          { id: 'health', name: 'Health & Medical', emoji: '🏥', tileCount: 80 },
          { id: 'sports', name: 'Sports & Exercise', emoji: '⚽', tileCount: 90 },
          { id: 'vehicles', name: 'Transportation', emoji: '🚗', tileCount: 60 }
        ];
        
        // Define tiles for each category
        this.tiles = {
          // FOOD CATEGORY
          food: [
            { id: 'f1', emoji: '🍕', text: 'pizza', speech: 'I want pizza', color: 'tile-food' },
            { id: 'f2', emoji: '🍔', text: 'burger', speech: 'I want a burger', color: 'tile-food' },
            { id: 'f3', emoji: '🌭', text: 'hot dog', speech: 'I want a hot dog', color: 'tile-food' },
            { id: 'f4', emoji: '🍟', text: 'fries', speech: 'I want fries', color: 'tile-food' },
            { id: 'f5', emoji: '🥪', text: 'sandwich', speech: 'I want a sandwich', color: 'tile-food' },
            { id: 'f6', emoji: '🌮', text: 'taco', speech: 'I want tacos', color: 'tile-food' },
            { id: 'f7', emoji: '🍝', text: 'pasta', speech: 'I want pasta', color: 'tile-food' },
            { id: 'f8', emoji: '🍜', text: 'soup', speech: 'I want soup', color: 'tile-food' },
            { id: 'f9', emoji: '🍣', text: 'sushi', speech: 'I want sushi', color: 'tile-food' },
            { id: 'f10', emoji: '🍗', text: 'chicken', speech: 'I want chicken', color: 'tile-food' },
            { id: 'f11', emoji: '🥗', text: 'salad', speech: 'I want salad', color: 'tile-food' },
            { id: 'f12', emoji: '🍞', text: 'bread', speech: 'I want bread', color: 'tile-food' },
            { id: 'f13', emoji: '🧀', text: 'cheese', speech: 'I want cheese', color: 'tile-food' },
            { id: 'f14', emoji: '🥓', text: 'bacon', speech: 'I want bacon', color: 'tile-food' },
            { id: 'f15', emoji: '🥚', text: 'eggs', speech: 'I want eggs', color: 'tile-food' },
            { id: 'f16', emoji: '🥞', text: 'pancakes', speech: 'I want pancakes', color: 'tile-food' },
            { id: 'f17', emoji: '🧇', text: 'waffles', speech: 'I want waffles', color: 'tile-food' },
            { id: 'f18', emoji: '🥣', text: 'cereal', speech: 'I want cereal', color: 'tile-food' },
            { id: 'f19', emoji: '🍎', text: 'apple', speech: 'I want an apple', color: 'tile-food' },
            { id: 'f20', emoji: '🍌', text: 'banana', speech: 'I want a banana', color: 'tile-food' },
            { id: 'f21', emoji: '🍓', text: 'strawberry', speech: 'I want strawberries', color: 'tile-food' },
            { id: 'f22', emoji: '🍇', text: 'grapes', speech: 'I want grapes', color: 'tile-food' },
            { id: 'f23', emoji: '🍊', text: 'orange', speech: 'I want an orange', color: 'tile-food' },
            { id: 'f24', emoji: '🍉', text: 'watermelon', speech: 'I want watermelon', color: 'tile-food' },
            { id: 'f25', emoji: '🍑', text: 'peach', speech: 'I want a peach', color: 'tile-food' },
            { id: 'f26', emoji: '🍍', text: 'pineapple', speech: 'I want pineapple', color: 'tile-food' },
            { id: 'f27', emoji: '🥦', text: 'broccoli', speech: 'I want broccoli', color: 'tile-food' },
            { id: 'f28', emoji: '🥕', text: 'carrot', speech: 'I want carrots', color: 'tile-food' },
            { id: 'f29', emoji: '🌽', text: 'corn', speech: 'I want corn', color: 'tile-food' },
            { id: 'f30', emoji: '🥔', text: 'potato', speech: 'I want potatoes', color: 'tile-food' }
          ],
          
          // DRINKS CATEGORY
          drinks: [
            { id: 'd1', emoji: '💧', text: 'water', speech: 'I want water', color: 'tile-drink' },
            { id: 'd2', emoji: '🥛', text: 'milk', speech: 'I want milk', color: 'tile-drink' },
            { id: 'd3', emoji: '🧃', text: 'juice box', speech: 'I want a juice box', color: 'tile-drink' },
            { id: 'd4', emoji: '🧃', text: 'apple juice', speech: 'I want apple juice', color: 'tile-drink' },
            { id: 'd5', emoji: '🧃', text: 'orange juice', speech: 'I want orange juice', color: 'tile-drink' },
            { id: 'd6', emoji: '🧃', text: 'grape juice', speech: 'I want grape juice', color: 'tile-drink' },
            { id: 'd7', emoji: '🥤', text: 'soda', speech: 'I want soda', color: 'tile-drink' },
            { id: 'd8', emoji: '🥤', text: 'coke', speech: 'I want Coke', color: 'tile-drink' },
            { id: 'd9', emoji: '🥤', text: 'sprite', speech: 'I want Sprite', color: 'tile-drink' },
            { id: 'd10', emoji: '🥤', text: 'lemonade', speech: 'I want lemonade', color: 'tile-drink' },
            { id: 'd11', emoji: '☕', text: 'coffee', speech: 'I want coffee', color: 'tile-drink' },
            { id: 'd12', emoji: '🍵', text: 'tea', speech: 'I want tea', color: 'tile-drink' },
            { id: 'd13', emoji: '🧋', text: 'boba tea', speech: 'I want boba tea', color: 'tile-drink' },
            { id: 'd14', emoji: '🥤', text: 'smoothie', speech: 'I want a smoothie', color: 'tile-drink' },
            { id: 'd15', emoji: '🧃', text: 'fruit punch', speech: 'I want fruit punch', color: 'tile-drink' }
          ],
          
          // ENTERTAINMENT CATEGORY (TV Shows)
          entertainment: [
            { id: 'e1', emoji: '📺', text: 'cartoons', speech: 'I want to watch cartoons', color: 'tile-entertainment' },
            { id: 'e2', emoji: '🎬', text: 'movie', speech: 'I want to watch a movie', color: 'tile-entertainment' },
            { id: 'e3', emoji: '📺', text: 'Bluey', speech: 'I want to watch Bluey', color: 'tile-entertainment' },
            { id: 'e4', emoji: '🐾', text: 'Paw Patrol', speech: 'I want to watch Paw Patrol', color: 'tile-entertainment' },
            { id: 'e5', emoji: '🦈', text: 'Baby Shark', speech: 'I want to watch Baby Shark', color: 'tile-entertainment' },
            { id: 'e6', emoji: '🐷', text: 'Peppa Pig', speech: 'I want to watch Peppa Pig', color: 'tile-entertainment' },
            { id: 'e7', emoji: '🚂', text: 'Thomas', speech: 'I want to watch Thomas', color: 'tile-entertainment' },
            { id: 'e8', emoji: '🏰', text: 'Disney', speech: 'I want to watch Disney', color: 'tile-entertainment' },
            { id: 'e9', emoji: '📺', text: 'PBS Kids', speech: 'I want to watch PBS Kids', color: 'tile-entertainment' },
            { id: 'e10', emoji: '🎮', text: 'YouTube', speech: 'I want to watch YouTube', color: 'tile-entertainment' },
            { id: 'e11', emoji: '📺', text: 'Netflix', speech: 'I want to watch Netflix', color: 'tile-entertainment' },
            { id: 'e12', emoji: '🦸', text: 'superhero', speech: 'I want to watch superheroes', color: 'tile-entertainment' },
            { id: 'e13', emoji: '👸', text: 'princess', speech: 'I want to watch princess shows', color: 'tile-entertainment' },
            { id: 'e14', emoji: '🦕', text: 'dinosaurs', speech: 'I want to watch dinosaurs', color: 'tile-entertainment' },
            { id: 'e15', emoji: '⚽', text: 'sports', speech: 'I want to watch sports', color: 'tile-entertainment' }
          ],
          
          // GAMES CATEGORY
          games: [
            { id: 'g1', emoji: '🎮', text: 'video games', speech: 'I want to play video games', color: 'tile-play' },
            { id: 'g2', emoji: '🎯', text: 'board games', speech: 'I want to play board games', color: 'tile-play' },
            { id: 'g3', emoji: '🃏', text: 'cards', speech: 'I want to play cards', color: 'tile-play' },
            { id: 'g4', emoji: '🧩', text: 'puzzles', speech: 'I want to do puzzles', color: 'tile-play' },
            { id: 'g5', emoji: '🏷️', text: 'tag', speech: 'I want to play tag', color: 'tile-play' },
            { id: 'g6', emoji: '🙈', text: 'hide and seek', speech: 'I want to play hide and seek', color: 'tile-play' },
            { id: 'g7', emoji: '⚽', text: 'soccer', speech: 'I want to play soccer', color: 'tile-play' },
            { id: 'g8', emoji: '🏀', text: 'basketball', speech: 'I want to play basketball', color: 'tile-play' },
            { id: 'g9', emoji: '🎮', text: 'Minecraft', speech: 'I want to play Minecraft', color: 'tile-play' },
            { id: 'g10', emoji: '🎮', text: 'Roblox', speech: 'I want to play Roblox', color: 'tile-play' },
            { id: 'g11', emoji: '🎮', text: 'Fortnite', speech: 'I want to play Fortnite', color: 'tile-play' },
            { id: 'g12', emoji: '🏗️', text: 'blocks', speech: 'I want to play with blocks', color: 'tile-play' },
            { id: 'g13', emoji: '🏗️', text: 'Legos', speech: 'I want to play with Legos', color: 'tile-play' },
            { id: 'g14', emoji: '🎯', text: 'catch', speech: 'I want to play catch', color: 'tile-play' },
            { id: 'g15', emoji: '🎵', text: 'musical chairs', speech: 'I want to play musical chairs', color: 'tile-play' }
          ],
          
          // PEOPLE CATEGORY
          people: [
            { id: 'p1', emoji: '👩', text: 'mom', speech: 'mom', color: 'tile-family' },
            { id: 'p2', emoji: '👨', text: 'dad', speech: 'dad', color: 'tile-family' },
            { id: 'p3', emoji: '👧', text: 'sister', speech: 'sister', color: 'tile-family' },
            { id: 'p4', emoji: '👦', text: 'brother', speech: 'brother', color: 'tile-family' },
            { id: 'p5', emoji: '👵', text: 'grandma', speech: 'grandma', color: 'tile-family' },
            { id: 'p6', emoji: '👴', text: 'grandpa', speech: 'grandpa', color: 'tile-family' },
            { id: 'p7', emoji: '👩‍🏫', text: 'teacher', speech: 'teacher', color: 'tile-people' },
            { id: 'p8', emoji: '👫', text: 'friend', speech: 'friend', color: 'tile-friend' },
            { id: 'p9', emoji: '👨‍⚕️', text: 'doctor', speech: 'doctor', color: 'tile-people' },
            { id: 'p10', emoji: '👮', text: 'police', speech: 'police officer', color: 'tile-people' },
            { id: 'p11', emoji: '👶', text: 'baby', speech: 'baby', color: 'tile-family' },
            { id: 'p12', emoji: '🧑', text: 'cousin', speech: 'cousin', color: 'tile-friend' },
            { id: 'p13', emoji: '👨‍⚕️', text: 'nurse', speech: 'nurse', color: 'tile-people' },
            { id: 'p14', emoji: '🧑‍🍳', text: 'cook', speech: 'cook', color: 'tile-people' },
            { id: 'p15', emoji: '👷', text: 'helper', speech: 'helper', color: 'tile-people' }
          ],
          
          // PLACES CATEGORY
          places: [
            { id: 'pl1', emoji: '🏠', text: 'home', speech: 'home', color: 'tile-place' },
            { id: 'pl2', emoji: '🏫', text: 'school', speech: 'school', color: 'tile-place' },
            { id: 'pl3', emoji: '🏞️', text: 'park', speech: 'park', color: 'tile-place' },
            { id: 'pl4', emoji: '🏪', text: 'store', speech: 'store', color: 'tile-place' },
            { id: 'pl5', emoji: '📚', text: 'library', speech: 'library', color: 'tile-place' },
            { id: 'pl6', emoji: '🏥', text: 'hospital', speech: 'hospital', color: 'tile-place' },
            { id: 'pl7', emoji: '🍕', text: 'restaurant', speech: 'restaurant', color: 'tile-place' },
            { id: 'pl8', emoji: '🎢', text: 'playground', speech: 'playground', color: 'tile-place' },
            { id: 'pl9', emoji: '🏖️', text: 'beach', speech: 'beach', color: 'tile-place' },
            { id: 'pl10', emoji: '🦁', text: 'zoo', speech: 'zoo', color: 'tile-place' },
            { id: 'pl11', emoji: '🛍️', text: 'mall', speech: 'mall', color: 'tile-place' },
            { id: 'pl12', emoji: '🎬', text: 'movies', speech: 'movie theater', color: 'tile-place' },
            { id: 'pl13', emoji: '⛪', text: 'church', speech: 'church', color: 'tile-place' },
            { id: 'pl14', emoji: '🏊', text: 'pool', speech: 'swimming pool', color: 'tile-place' },
            { id: 'pl15', emoji: '🎪', text: 'circus', speech: 'circus', color: 'tile-place' }
          ],
          
          // Add more categories here...
        };
        
        // Mark library as loaded
        this.isLibraryLoaded = true;
        
        // Count total tiles
        let totalTiles = 0;
        for (const category of Object.values(this.tiles)) {
          totalTiles += category.length;
        }
        
        console.log(`✅ Loaded embedded tile library with ${this.categories.length} categories and ${totalTiles} tiles`);
        
        // Trigger library loaded event
        window.dispatchEvent(new CustomEvent('tileLibraryLoaded', {
          detail: { 
            categories: this.categories.length, 
            tiles: totalTiles
          }
        }));
      }
      
      // Get all categories
      getCategories() {
        return this.categories;
      }
      
      // Get tiles from specific category
      getCategoryTiles(categoryId) {
        return this.tiles[categoryId] || [];
      }
      
      // Search tiles across all categories
      searchTiles(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        for (const [categoryId, tiles] of Object.entries(this.tiles)) {
          const category = this.categories.find(c => c.id === categoryId);
          for (const tile of tiles) {
            if (
              tile.text.toLowerCase().includes(searchTerm) ||
              tile.speech.toLowerCase().includes(searchTerm) ||
              tile.emoji.includes(searchTerm)
            ) {
              results.push({
                ...tile,
                categoryId,
                categoryName: category ? category.name : categoryId
              });
            }
          }
        }
        
        return results;
      }
      
      // Get tiles by type
      getTilesByType(type) {
        const results = [];
        
        // For now, return empty array since we don't have typed tiles
        // Can be extended later to support action sequences, etc.
        return results;
      }
      
      save(key, data) {
        try {
          localStorage.setItem(key, JSON.stringify(data));
          this.cache.set(key, data);
          return true;
        } catch (error) {
          console.error('Save error:', error);
          return false;
        }
      }
      
      load(key) {
        if (this.cache.has(key)) {
          return this.cache.get(key);
        }
        
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            this.cache.set(key, parsed);
            return parsed;
          }
        } catch (error) {
          console.error('Load error:', error);
        }
        
        return null;
      }
      
      remove(key) {
        localStorage.removeItem(key);
        this.cache.delete(key);
      }
    }