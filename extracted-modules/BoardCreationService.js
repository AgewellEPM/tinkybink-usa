class BoardCreationService {
      constructor() {
        this.templates = {
          // SLP Templates
          slp: {
            'articulation': {
              name: 'Articulation Practice',
              description: 'Target specific sounds and phonemes',
              tiles: [
                { text: '/s/ sound', emoji: '🐍', color: 'green' },
                { text: '/r/ sound', emoji: '🦁', color: 'orange' },
                { text: '/l/ sound', emoji: '🔔', color: 'blue' },
                { text: '/th/ sound', emoji: '👅', color: 'purple' },
                { text: 'Try again', emoji: '🔄', color: 'gray' },
                { text: 'Good job!', emoji: '⭐', color: 'gold' }
              ]
            },
            'language': {
              name: 'Language Development',
              description: 'Build vocabulary and sentence structure',
              tiles: [
                { text: 'I want', emoji: '🤚', color: 'blue' },
                { text: 'I see', emoji: '👀', color: 'green' },
                { text: 'I have', emoji: '✋', color: 'purple' },
                { text: 'more', emoji: '➕', color: 'orange' },
                { text: 'please', emoji: '🙏', color: 'pink' },
                { text: 'thank you', emoji: '🤗', color: 'yellow' }
              ]
            },
            'pragmatics': {
              name: 'Social Communication',
              description: 'Practice social language skills',
              tiles: [
                { text: 'Hello', emoji: '👋', color: 'blue' },
                { text: 'My turn', emoji: '🙋', color: 'green' },
                { text: 'Your turn', emoji: '👉', color: 'orange' },
                { text: 'Share', emoji: '🤝', color: 'purple' },
                { text: 'Help', emoji: '🆘', color: 'red' },
                { text: 'Bye', emoji: '👋', color: 'gray' }
              ]
            }
          },
          // ABA Templates
          aba: {
            'token': {
              name: 'Token Economy Board',
              description: 'Visual reinforcement system',
              tiles: [
                { text: 'Token 1', emoji: '⭐', color: 'gold' },
                { text: 'Token 2', emoji: '⭐', color: 'gold' },
                { text: 'Token 3', emoji: '⭐', color: 'gold' },
                { text: 'Token 4', emoji: '⭐', color: 'gold' },
                { text: 'Token 5', emoji: '⭐', color: 'gold' },
                { text: 'Reward!', emoji: '🎁', color: 'rainbow' }
              ]
            },
            'first_then': {
              name: 'First-Then Board',
              description: 'Visual schedule for activities',
              tiles: [
                { text: 'First', emoji: '1️⃣', color: 'blue', isSequence: true },
                { text: 'Then', emoji: '2️⃣', color: 'green', isSequence: true },
                { text: 'All done', emoji: '✅', color: 'purple' }
              ]
            },
            'behavior': {
              name: 'Behavior Support',
              description: 'Positive behavior reinforcement',
              tiles: [
                { text: 'Good sitting', emoji: '🪑', color: 'blue' },
                { text: 'Nice hands', emoji: '🤲', color: 'green' },
                { text: 'Quiet voice', emoji: '🤫', color: 'purple' },
                { text: 'Good listening', emoji: '👂', color: 'orange' },
                { text: 'Great job!', emoji: '🌟', color: 'gold' },
                { text: 'Try again', emoji: '🔄', color: 'gray' }
              ]
            },
            'choices': {
              name: 'Choice Making',
              description: 'Present structured choices',
              tiles: [
                { text: 'Choice 1', emoji: '1️⃣', color: 'blue' },
                { text: 'Choice 2', emoji: '2️⃣', color: 'green' },
                { text: 'Choice 3', emoji: '3️⃣', color: 'orange' },
                { text: 'I choose', emoji: '👉', color: 'purple' }
              ]
            }
          },
          // Family Templates
          family: {
            'daily_routine': {
              name: 'Daily Routine',
              description: 'Common daily activities',
              tiles: [
                { text: 'Wake up', emoji: '🌅', color: 'yellow' },
                { text: 'Breakfast', emoji: '🥞', color: 'orange' },
                { text: 'Get dressed', emoji: '👕', color: 'blue' },
                { text: 'School', emoji: '🏫', color: 'red' },
                { text: 'Play', emoji: '🎮', color: 'purple' },
                { text: 'Bedtime', emoji: '🛏️', color: 'navy' }
              ]
            },
            'feelings': {
              name: 'Feelings & Emotions',
              description: 'Express how you feel',
              tiles: [
                { text: 'Happy', emoji: '😊', color: 'yellow' },
                { text: 'Sad', emoji: '😢', color: 'blue' },
                { text: 'Mad', emoji: '😠', color: 'red' },
                { text: 'Scared', emoji: '😨', color: 'purple' },
                { text: 'Tired', emoji: '😴', color: 'gray' },
                { text: 'Excited', emoji: '🤗', color: 'orange' }
              ]
            },
            'family_members': {
              name: 'Family Members',
              description: 'Talk about family',
              tiles: [
                { text: 'Mom', emoji: '👩', color: 'pink' },
                { text: 'Dad', emoji: '👨', color: 'blue' },
                { text: 'Brother', emoji: '👦', color: 'green' },
                { text: 'Sister', emoji: '👧', color: 'purple' },
                { text: 'Grandma', emoji: '👵', color: 'lavender' },
                { text: 'Grandpa', emoji: '👴', color: 'brown' }
              ]
            }
          },
          // Activity Templates
          activities: {
            'playground': {
              name: 'Playground',
              description: 'Outdoor play activities',
              tiles: [
                { text: 'Swing', emoji: '🎠', color: 'blue' },
                { text: 'Slide', emoji: '🛝', color: 'yellow' },
                { text: 'Climb', emoji: '🧗', color: 'green' },
                { text: 'Run', emoji: '🏃', color: 'orange' },
                { text: 'Jump', emoji: '🦘', color: 'purple' },
                { text: 'Rest', emoji: '🪑', color: 'gray' }
              ]
            },
            'mealtime': {
              name: 'Mealtime',
              description: 'Food and eating',
              tiles: [
                { text: 'Hungry', emoji: '🤤', color: 'orange' },
                { text: 'Thirsty', emoji: '🥤', color: 'blue' },
                { text: 'More', emoji: '➕', color: 'green' },
                { text: 'All done', emoji: '✅', color: 'purple' },
                { text: 'Yummy', emoji: '😋', color: 'pink' },
                { text: 'No thank you', emoji: '🙅', color: 'red' }
              ]
            }
          },
          // PECS Templates
          pecs: {
            'phase1': {
              name: 'PECS Phase 1',
              description: 'Single picture exchange',
              tiles: [
                { text: 'Cookie', emoji: '🍪', color: 'brown', isPECS: true },
                { text: 'Juice', emoji: '🧃', color: 'orange', isPECS: true },
                { text: 'Ball', emoji: '⚽', color: 'blue', isPECS: true },
                { text: 'Book', emoji: '📚', color: 'green', isPECS: true }
              ]
            },
            'phase2': {
              name: 'PECS Phase 2',
              description: 'Distance and persistence',
              tiles: [
                { text: 'I want', emoji: '🤚', color: 'purple', isPECS: true },
                { text: 'Cookie', emoji: '🍪', color: 'brown', isPECS: true },
                { text: 'Juice', emoji: '🧃', color: 'orange', isPECS: true },
                { text: 'Play', emoji: '🎮', color: 'blue', isPECS: true }
              ]
            }
          },
          // Visual Schedule Templates
          visualSchedule: {
            'morning': {
              name: 'Morning Routine',
              description: 'Step-by-step morning activities',
              tiles: [
                { text: 'Wake up', emoji: '⏰', color: 'yellow', isSequence: true, order: 1 },
                { text: 'Bathroom', emoji: '🚽', color: 'blue', isSequence: true, order: 2 },
                { text: 'Brush teeth', emoji: '🪥', color: 'green', isSequence: true, order: 3 },
                { text: 'Get dressed', emoji: '👕', color: 'purple', isSequence: true, order: 4 },
                { text: 'Breakfast', emoji: '🥞', color: 'orange', isSequence: true, order: 5 },
                { text: 'School bus', emoji: '🚌', color: 'red', isSequence: true, order: 6 }
              ]
            },
            'classroom': {
              name: 'Classroom Schedule',
              description: 'Daily classroom activities',
              tiles: [
                { text: 'Circle time', emoji: '⭕', color: 'blue', isSequence: true },
                { text: 'Math', emoji: '🔢', color: 'green', isSequence: true },
                { text: 'Reading', emoji: '📖', color: 'purple', isSequence: true },
                { text: 'Snack', emoji: '🍎', color: 'red', isSequence: true },
                { text: 'Recess', emoji: '🎮', color: 'orange', isSequence: true },
                { text: 'Art', emoji: '🎨', color: 'pink', isSequence: true }
              ]
            },
            'therapy': {
              name: 'Therapy Session',
              description: 'Structured therapy activities',
              tiles: [
                { text: 'Hello song', emoji: '👋', color: 'blue', isSequence: true },
                { text: 'Work time', emoji: '✏️', color: 'green', isSequence: true },
                { text: 'Break', emoji: '⏸️', color: 'yellow', isSequence: true },
                { text: 'More work', emoji: '📝', color: 'purple', isSequence: true },
                { text: 'Choice time', emoji: '🎯', color: 'orange', isSequence: true },
                { text: 'Goodbye', emoji: '👋', color: 'red', isSequence: true }
              ]
            }
          },
          // Social Story Templates
          socialStories: {
            'doctor': {
              name: 'Going to the Doctor',
              description: 'Prepare for doctor visits',
              tiles: [
                { text: 'Today I will see the doctor', emoji: '👨‍⚕️', color: 'blue', isStory: true },
                { text: 'The doctor helps me stay healthy', emoji: '❤️', color: 'red', isStory: true },
                { text: 'I might wait in the waiting room', emoji: '🪑', color: 'purple', isStory: true },
                { text: 'The doctor will check my ears', emoji: '👂', color: 'orange', isStory: true },
                { text: 'The doctor will listen to my heart', emoji: '💓', color: 'pink', isStory: true },
                { text: 'I am brave', emoji: '💪', color: 'green', isStory: true }
              ]
            },
            'sharing': {
              name: 'Sharing with Friends',
              description: 'Learn about sharing',
              tiles: [
                { text: 'Sometimes friends want the same toy', emoji: '🧸', color: 'blue', isStory: true },
                { text: 'We can take turns', emoji: '🔄', color: 'green', isStory: true },
                { text: 'I play, then you play', emoji: '🤝', color: 'purple', isStory: true },
                { text: 'Sharing makes friends happy', emoji: '😊', color: 'yellow', isStory: true },
                { text: 'When I share, I am kind', emoji: '💝', color: 'pink', isStory: true },
                { text: 'Good job sharing!', emoji: '⭐', color: 'gold', isStory: true }
              ]
            },
            'newPlace': {
              name: 'Going Somewhere New',
              description: 'Prepare for new experiences',
              tiles: [
                { text: 'Sometimes we go new places', emoji: '🗺️', color: 'blue', isStory: true },
                { text: 'New places can be fun', emoji: '🎉', color: 'purple', isStory: true },
                { text: 'I might feel nervous', emoji: '😟', color: 'orange', isStory: true },
                { text: 'That is okay', emoji: '👌', color: 'green', isStory: true },
                { text: 'I can take deep breaths', emoji: '🌬️', color: 'blue', isStory: true },
                { text: 'I am safe with my family', emoji: '👨‍👩‍👧', color: 'red', isStory: true }
              ]
            }
          },
          // Behavior Support Templates
          behaviorSupport: {
            'calming': {
              name: 'Calming Strategies',
              description: 'Tools for self-regulation',
              tiles: [
                { text: 'Take deep breaths', emoji: '🌬️', color: 'blue', action: 'breathe' },
                { text: 'Count to 10', emoji: '🔢', color: 'green', action: 'count' },
                { text: 'Squeeze hands', emoji: '🤲', color: 'purple' },
                { text: 'Ask for break', emoji: '⏸️', color: 'orange' },
                { text: 'Get a drink', emoji: '💧', color: 'blue' },
                { text: 'Walk around', emoji: '🚶', color: 'green' }
              ]
            },
            'zones': {
              name: 'Zones of Regulation',
              description: 'Emotional regulation support',
              tiles: [
                { text: 'Blue Zone - Sad/Tired', emoji: '😔', color: 'blue' },
                { text: 'Green Zone - Happy/Calm', emoji: '😊', color: 'green' },
                { text: 'Yellow Zone - Frustrated', emoji: '😤', color: 'yellow' },
                { text: 'Red Zone - Angry', emoji: '😡', color: 'red' },
                { text: 'What zone am I in?', emoji: '🤔', color: 'purple' },
                { text: 'Tools to feel better', emoji: '🧰', color: 'gray' }
              ]
            }
          }
        };
        
        this.wizard = {
          currentStep: 0,
          steps: ['purpose', 'category', 'customize', 'finalize'],
          data: {}
        };
      }
      
      initialize() {
        console.log('Enhanced Board Creation Service ready');
        this.addBoardCreationUI();
      }
      
      addBoardCreationUI() {
        // Add board creation wizard button to settings
        const dataSection = document.querySelector('.settings-section:last-child .action-buttons');
        if (dataSection) {
          const wizardBtn = document.createElement('button');
          wizardBtn.className = 'action-btn';
          wizardBtn.innerHTML = '🧙 Board Creation Wizard';
          wizardBtn.onclick = () => this.openWizard();
          dataSection.insertBefore(wizardBtn, dataSection.firstChild);
          
        }
        
        // Add quick create button to header
        const headerButtons = document.querySelector('.header-buttons');
        if (headerButtons) {
          const quickCreateBtn = document.createElement('button');
          quickCreateBtn.className = 'header-btn';
          quickCreateBtn.innerHTML = '➕';
          quickCreateBtn.title = 'Quick Create Board (Q)';
          quickCreateBtn.onclick = () => this.showQuickCreate();
          headerButtons.insertBefore(quickCreateBtn, headerButtons.children[1]);
        }
        
        // Listen for tile library loaded event
        window.addEventListener('tileLibraryLoaded', (event) => {
          console.log(`🎯 Action Builder ready with ${event.detail.tiles} tiles from ${event.detail.files} files`);
        });
      }
      
      showQuickCreate() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
          <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
              <h2>➕ Quick Create Board</h2>
              <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div style="padding: 20px;">
              <h3>🚀 Instant Boards for Common Situations</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0;">
                <button class="action-btn" onclick="moduleSystem.get('BoardCreationService').quickBuildBoard('meltdown'); this.closest('.modal').remove();">
                  😤 Calm Down Board
                </button>
                <button class="action-btn" onclick="moduleSystem.get('BoardCreationService').quickBuildBoard('restaurant'); this.closest('.modal').remove();">
                  🍽️ Restaurant Board
                </button>
                <button class="action-btn" onclick="moduleSystem.get('BoardCreationService').quickBuildBoard('playground'); this.closest('.modal').remove();">
                  🎮 Playground Board
                </button>
              </div>
              
              <h3>🎯 Or type what you need:</h3>
              <div style="display: flex; gap: 10px; margin: 15px 0;">
                <input type="text" id="quickNeedInput" placeholder="e.g., 'board for bedtime routine'" 
                       style="flex: 1; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px;"
                       onkeypress="if(event.key === 'Enter') moduleSystem.get('BoardCreationService').createFromNeed()">
                <button class="action-btn" onclick="moduleSystem.get('BoardCreationService').createFromNeed()">
                  🧠 Create with AI
                </button>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <button class="action-btn secondary" onclick="moduleSystem.get('BoardCreationService').openWizard(); this.closest('.modal').remove();">
                  🧙 Open Full Wizard
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('quickNeedInput')?.focus();
      }
      
      createFromNeed() {
        const input = document.getElementById('quickNeedInput')?.value.trim();
        if (!input) return;
        
        // Parse the need and create appropriate board
        const need = input.toLowerCase();
        
        // Analyze keywords
        if (need.includes('bedtime') || need.includes('sleep')) {
          this.createBedtimeBoard();
        } else if (need.includes('school') || need.includes('classroom')) {
          this.wizard.data = { purpose: 'visualSchedule', template: 'classroom' };
          this.showStep(2);
        } else if (need.includes('doctor') || need.includes('medical')) {
          this.wizard.data = { purpose: 'socialStories', template: 'doctor' };
          this.showStep(2);
        } else if (need.includes('calm') || need.includes('upset')) {
          this.wizard.data = { purpose: 'behaviorSupport', template: 'calming' };
          this.showStep(2);
        } else {
          // Use Eliza to parse and create custom board
          const elizaService = moduleSystem.get('ElizaService');
          if (elizaService) {
            const items = elizaService.extractItems(need);
            if (items.length > 0) {
              this.createCustomBoardFromItems(need, items);
            }
          }
        }
        
        document.querySelector('.modal')?.remove();
      }
      
      createBedtimeBoard() {
        boards['bedtime_routine'] = {
          title: 'Bedtime Routine',
          tiles: [
            { text: 'Bath time', emoji: '🛁', color: 'blue' },
            { text: 'Pajamas', emoji: '👕', color: 'purple' },
            { text: 'Brush teeth', emoji: '🪥', color: 'green' },
            { text: 'Story time', emoji: '📚', color: 'orange' },
            { text: 'Lights off', emoji: '💡', color: 'gray' },
            { text: 'Good night', emoji: '🌙', color: 'navy' }
          ],
          settings: { quickBuild: true }
        };
        saveToStorage();
        navigateToBoard('bedtime_routine');
      }
      
      createCustomBoardFromItems(title, items) {
        const boardId = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const elizaService = moduleSystem.get('ElizaService');
        
        boards[boardId] = {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          tiles: items.map(item => ({
            text: item,
            emoji: elizaService?.getEmoji(item) || '📌',
            color: ['blue', 'green', 'orange', 'purple', 'red'][Math.floor(Math.random() * 5)]
          })),
          settings: { aiGenerated: true }
        };
        
        saveToStorage();
        navigateToBoard(boardId);
      }
      
      // Open Action Board Builder with TinkyBink tile library
      openActionBuilder() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'actionBuilderModal';
        modal.style.display = 'flex';
        modal.innerHTML = `
          <div class="modal-content" style="max-width: 1200px; height: 90vh;">
            <div class="modal-header">
              <h2>🎯 Action Board Builder</h2>
              <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div id="actionBuilderContent" style="height: calc(100% - 60px); overflow: hidden;">
              ${this.renderActionBuilder()}
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        this.initializeActionBuilder();
      }
      
      renderActionBuilder() {
        const dataService = moduleSystem.get('DataService');
        if (!dataService || !dataService.isLibraryLoaded) {
          return `
            <div style="padding: 40px; text-align: center;">
              <div class="loading-spinner" style="margin: 20px auto;"></div>
              <h3>Loading TinkyBink Tile Library...</h3>
              <p>Loading 5,900+ professional AAC tiles...</p>
            </div>
          `;
        }
        
        return `
          <div style="display: flex; height: 100%;">
            <!-- Left Panel: Categories & Search -->
            <div style="width: 300px; border-right: 2px solid #eee; overflow-y: auto; padding: 20px;">
              <div style="margin-bottom: 20px;">
                <h3>🔍 Search Tiles</h3>
                <input type="text" id="tileSearchInput" placeholder="Search 5,900+ tiles..." 
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 10px;"
                       oninput="moduleSystem.get('BoardCreationService').searchTiles(this.value)">
                <div id="searchResults" style="max-height: 200px; overflow-y: auto; background: #f8f9fa; border-radius: 8px; padding: 10px;"></div>
              </div>
              
              <div>
                <h3>📚 Categories</h3>
                <div id="categoryList" style="max-height: 400px; overflow-y: auto;">
                  ${this.renderCategories()}
                </div>
              </div>
            </div>
            
            <!-- Center Panel: Selected Tiles -->
            <div style="flex: 1; padding: 20px; overflow-y: auto;">
              <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                <h3>🎯 Your Action Board</h3>
                <div>
                  <input type="text" id="actionBoardName" placeholder="Board Name" 
                         style="padding: 8px; border: 2px solid #ddd; border-radius: 8px; margin-right: 10px;">
                  <button class="action-btn" onclick="moduleSystem.get('BoardCreationService').saveActionBoard()">
                    💾 Save Board
                  </button>
                </div>
              </div>
              
              <div id="selectedTiles" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; min-height: 300px; border: 2px dashed #ddd; border-radius: 12px; padding: 20px;">
                <div style="grid-column: 1/-1; text-align: center; color: #888; font-size: 18px;">
                  Drop tiles here or click tiles from categories to add them
                </div>
              </div>
              
              <div style="margin-top: 20px;">
                <h4>💡 Board Statistics</h4>
                <div id="boardStats" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                  <span id="tileCount">0 tiles</span> • 
                  <span id="categoryCount">0 categories</span> • 
                  <span id="actionSequenceCount">0 action sequences</span>
                </div>
              </div>
            </div>
            
            <!-- Right Panel: Tile Details -->
            <div style="width: 250px; border-left: 2px solid #eee; padding: 20px; overflow-y: auto;">
              <div id="tileDetails">
                <h3>ℹ️ Tile Details</h3>
                <p style="color: #666;">Click a tile to see details and preview</p>
              </div>
            </div>
          </div>
        `;
      }
      
      renderCategories() {
        const dataService = moduleSystem.get('DataService');
        const categories = dataService.getCategories();
        
        return categories.map(category => `
          <div class="category-item" onclick="moduleSystem.get('BoardCreationService').loadCategoryTiles('${category.id}')" 
               style="padding: 12px; margin: 5px 0; background: #f8f9fa; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${category.emoji}</span>
              <div style="flex: 1;">
                <div style="font-weight: bold; font-size: 14px;">${category.name}</div>
                <div style="font-size: 12px; color: #666;">${category.tileCount} tiles</div>
              </div>
            </div>
          </div>
        `).join('');
      }
      
      initializeActionBuilder() {
        this.selectedTiles = [];
        this.updateBoardStats();
        
        // Add drag and drop styles
        this.addActionBuilderStyles();
      }
      
      loadCategoryTiles(categoryId) {
        const dataService = moduleSystem.get('DataService');
        const tiles = dataService.getCategoryTiles(categoryId);
        const category = dataService.getCategories().find(cat => cat.id === categoryId);
        
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = `
          <h4>${category.emoji} ${category.name}</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 10px;">
            ${tiles.map(tile => `
              <div class="library-tile" data-tile='${JSON.stringify(tile)}' 
                   onclick="moduleSystem.get('BoardCreationService').addTileToBoard(this)"
                   style="background: ${this.getTileGradient(tile.color)}; padding: 10px; border-radius: 8px; text-align: center; cursor: pointer; transition: transform 0.2s ease;">
                <div style="font-size: 20px;">${tile.emoji}</div>
                <div style="font-size: 10px; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">
                  ${tile.text.substring(0, 12)}${tile.text.length > 12 ? '...' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
        
        // Highlight selected category
        document.querySelectorAll('.category-item').forEach(item => {
          item.style.borderColor = 'transparent';
          item.style.background = '#f8f9fa';
        });
        event.target.closest('.category-item').style.borderColor = 'var(--primary-color)';
        event.target.closest('.category-item').style.background = '#f0f4ff';
      }
      
      searchTiles(query) {
        if (query.length < 2) {
          const searchResults = document.getElementById('searchResults');
          if (searchResults) searchResults.innerHTML = '<p style="color: #666;">Type to search tiles...</p>';
          return;
        }
        
        const dataService = moduleSystem.get('DataService');
        const results = dataService.searchTiles(query);
        
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = `
          <h4>🔍 Search Results (${results.length})</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 10px; max-height: 300px; overflow-y: auto;">
            ${results.slice(0, 50).map(tile => `
              <div class="library-tile" data-tile='${JSON.stringify(tile)}' 
                   onclick="moduleSystem.get('BoardCreationService').addTileToBoard(this)"
                   style="background: ${this.getTileGradient(tile.color)}; padding: 10px; border-radius: 8px; text-align: center; cursor: pointer; transition: transform 0.2s ease;">
                <div style="font-size: 20px;">${tile.emoji}</div>
                <div style="font-size: 10px; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">
                  ${tile.text.substring(0, 12)}${tile.text.length > 12 ? '...' : ''}
                </div>
                <div style="font-size: 8px; color: rgba(255,255,255,0.8);">${tile.categoryName}</div>
              </div>
            `).join('')}
            ${results.length > 50 ? `<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 10px;">... and ${results.length - 50} more</div>` : ''}
          </div>
        `;
      }
      
      addTileToBoard(element) {
        let tileData = null;
        try {
          tileData = JSON.parse(element.getAttribute('data-tile'));
        } catch (error) {
          console.error('Failed to parse tile data:', error);
          return;
        }
        
        // Check if tile already exists
        if (this.selectedTiles.find(t => t.id === tileData.id)) {
          this.showNotification('Tile already added to board', 'warning');
          return;
        }
        
        this.selectedTiles.push(tileData);
        this.renderSelectedTiles();
        this.updateBoardStats();
        this.showTileDetails(tileData);
        
        // Visual feedback
        element.style.transform = 'scale(0.9)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 150);
        
        this.showNotification(`Added "${tileData.text}" to board`, 'success');
      }
      
      renderSelectedTiles() {
        const container = document.getElementById('selectedTiles');
        
        if (this.selectedTiles.length === 0) {
          container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #888; font-size: 18px;">
              Drop tiles here or click tiles from categories to add them
            </div>
          `;
          return;
        }
        
        container.innerHTML = this.selectedTiles.map((tile, index) => {
          window[`tempTileData_${index}`] = tile;
          return `
          <div class="selected-tile" style="background: ${this.getTileGradient(tile.color)}; padding: 15px; border-radius: 12px; text-align: center; position: relative; cursor: pointer;"
               onclick="moduleSystem.get('BoardCreationService').showTileDetails(window.tempTileData_${index}); delete window.tempTileData_${index};">
            <button onclick="event.stopPropagation(); moduleSystem.get('BoardCreationService').removeTileFromBoard(${index})" 
                    style="position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;">×</button>
            <div style="font-size: 32px; margin-bottom: 8px;">${tile.emoji}</div>
            <div style="font-size: 12px; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">
              ${tile.text}
            </div>
            ${tile.type === 'action_sequence' ? '<div style="font-size: 8px; color: rgba(255,255,255,0.8); margin-top: 4px;">🎯 ACTION</div>' : ''}
          </div>
        `;
        }).join('');
      }
      
      removeTileFromBoard(index) {
        const removedTile = this.selectedTiles.splice(index, 1)[0];
        this.renderSelectedTiles();
        this.updateBoardStats();
        this.showNotification(`Removed "${removedTile.text}" from board`, 'info');
      }
      
      showTileDetails(tile) {
        const detailsContainer = document.getElementById('tileDetails');
        
        detailsContainer.innerHTML = `
          <h3>ℹ️ Tile Details</h3>
          <div style="background: ${this.getTileGradient(tile.color)}; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 15px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${tile.emoji}</div>
            <div style="font-size: 16px; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">
              ${tile.text}
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <h4>🗣️ Speech</h4>
            <p>"${tile.speech}"</p>
            <button class="action-btn secondary" onclick="speakText('${tile.speech}')" style="width: 100%; margin: 10px 0;">
              🔊 Preview Speech
            </button>
            
            <h4>📊 Properties</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Type:</strong> ${tile.type === 'action_sequence' ? '🎯 Action Sequence' : '📝 Standard'}</li>
              <li><strong>Category:</strong> ${tile.category || 'Unknown'}</li>
              ${tile.categoryName ? `<li><strong>Collection:</strong> ${tile.categoryName}</li>` : ''}
              ${tile.steps ? `<li><strong>Steps:</strong> ${tile.steps.length}</li>` : ''}
            </ul>
            
            ${tile.steps ? `
              <h4>📋 Action Steps</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${tile.steps.map(step => `
                  <span style="background: #e9ecef; padding: 5px 8px; border-radius: 12px; font-size: 12px;">
                    ${step.emoji} ${step.word}
                  </span>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }
      
      updateBoardStats() {
        const tileCount = document.getElementById('tileCount');
        if (tileCount) tileCount.textContent = `${this.selectedTiles.length} tiles`;
        
        const categories = new Set(this.selectedTiles.map(t => t.category));
        const categoryCount = document.getElementById('categoryCount');
        if (categoryCount) categoryCount.textContent = `${categories.size} categories`;
        
        const actionSequences = this.selectedTiles.filter(t => t.type === 'action_sequence');
        const actionSequenceCount = document.getElementById('actionSequenceCount');
        if (actionSequenceCount) actionSequenceCount.textContent = `${actionSequences.length} action sequences`;
      }
      
      saveActionBoard() {
        const boardNameEl = document.getElementById('actionBoardName');
        if (!boardNameEl) return;
        const boardName = boardNameEl.value.trim();
        if (!boardName) {
          alert('Please enter a board name');
          return;
        }
        
        if (this.selectedTiles.length === 0) {
          alert('Please add some tiles to your board');
          return;
        }
        
        const boardId = boardName.toLowerCase().replace(/\s+/g, '_');
        
        // Convert library tiles to board format
        const boardTiles = this.selectedTiles.map((tile, index) => ({
          id: `action_${index}`,
          emoji: tile.emoji,
          text: tile.text,
          speech: tile.speech,
          color: tile.color,
          action: tile.type === 'action_sequence' ? 'action_sequence' : 'speak',
          steps: tile.steps,
          libraryTile: tile
        }));
        
        boards[boardId] = {
          title: boardName,
          tiles: boardTiles,
          settings: {
            createdWith: 'actionBuilder',
            sourceFiles: [...new Set(this.selectedTiles.map(t => t.source))],
            createdAt: new Date().toISOString()
          }
        };
        
        saveToStorage();
        
        // Close modal and navigate to board
        const modal = document.getElementById('actionBuilderModal');
        if (modal) modal.remove();
        navigateToBoard(boardId);
        
        this.showNotification(`✅ Created action board "${boardName}" with ${this.selectedTiles.length} tiles!`, 'success');
      }
      
      showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 100px;
          right: 20px;
          background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 10001;
          animation: slideInRight 0.3s ease;
          max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
      
      addActionBuilderStyles() {
        if (document.getElementById('actionBuilderStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'actionBuilderStyles';
        style.textContent = `
          .library-tile:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          
          .selected-tile:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          
          .category-item:hover {
            background: #f0f4ff !important;
            border-color: var(--primary-color) !important;
          }
          
          .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      openWizard() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'boardWizardModal';
        modal.style.display = 'flex';
        modal.innerHTML = `
          <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
              <h2>🧙 Board Creation Wizard</h2>
              <span class="close" onclick="moduleSystem.get('BoardCreationService').closeWizard()">&times;</span>
            </div>
            <div id="wizardContent"></div>
          </div>
        `;
        document.body.appendChild(modal);
        this.showStep(0);
      }
      
      closeWizard() {
        const modal = document.getElementById('boardWizardModal');
        if (modal) modal.remove();
        this.wizard.currentStep = 0;
        this.wizard.data = {};
      }
      
      showStep(step) {
        this.wizard.currentStep = step;
        const content = document.getElementById('wizardContent');
        
        switch(step) {
          case 0: // Purpose
            content.innerHTML = `
              <div class="wizard-step">
                <h3>Who will use this board?</h3>
                <div class="wizard-options">
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('slp')">
                    <span class="wizard-icon">🗣️</span>
                    <h4>Speech Therapy</h4>
                    <p>For SLPs working on articulation, language, or social skills</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('aba')">
                    <span class="wizard-icon">📊</span>
                    <h4>ABA Therapy</h4>
                    <p>For behavior analysts and therapists</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('family')">
                    <span class="wizard-icon">👨‍👩‍👧‍👦</span>
                    <h4>Family Use</h4>
                    <p>For daily communication at home</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('visualSchedule')">
                    <span class="wizard-icon">📅</span>
                    <h4>Visual Schedule</h4>
                    <p>Step-by-step activity sequences</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('socialStories')">
                    <span class="wizard-icon">📖</span>
                    <h4>Social Stories</h4>
                    <p>Prepare for situations and events</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('behaviorSupport')">
                    <span class="wizard-icon">🎯</span>
                    <h4>Behavior Support</h4>
                    <p>Self-regulation and coping tools</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('pecs')">
                    <span class="wizard-icon">🖼️</span>
                    <h4>PECS Boards</h4>
                    <p>Picture Exchange Communication</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('activities')">
                    <span class="wizard-icon">🎮</span>
                    <h4>Activity Boards</h4>
                    <p>Context-specific communication</p>
                  </div>
                  <div class="wizard-option" onclick="moduleSystem.get('BoardCreationService').selectPurpose('custom')">
                    <span class="wizard-icon">✨</span>
                    <h4>Custom Board</h4>
                    <p>Create your own from scratch</p>
                  </div>
                </div>
              </div>
            `;
            break;
            
          case 1: // Category
            const purpose = this.wizard.data.purpose;
            const categories = purpose === 'custom' ? 
              { custom: { name: 'Blank Board', description: 'Start with empty board' } } :
              Object.entries(this.templates[purpose] || {}).reduce((acc, [key, val]) => {
                acc[key] = { name: val.name, description: val.description };
                return acc;
              }, {});
              
            content.innerHTML = `
              <div class="wizard-step">
                <h3>Choose a template</h3>
                <div class="wizard-templates">
                  ${Object.entries(categories).map(([key, cat]) => `
                    <div class="wizard-template" onclick="moduleSystem.get('BoardCreationService').selectTemplate('${key}')">
                      <h4>${cat.name}</h4>
                      <p>${cat.description}</p>
                    </div>
                  `).join('')}
                </div>
                <button class="action-btn secondary" onclick="moduleSystem.get('BoardCreationService').showStep(0)">← Back</button>
              </div>
            `;
            break;
            
          case 2: // Customize
            const template = this.getSelectedTemplate();
            content.innerHTML = `
              <div class="wizard-step">
                <h3>Customize Your Board</h3>
                <div class="wizard-customize">
                  <div class="customize-section">
                    <label>Board Name:</label>
                    <input type="text" id="boardNameInput" value="${template?.name || 'My Board'}" 
                           style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px;">
                  </div>
                  
                  <div class="customize-section">
                    <label>Preview Tiles:</label>
                    <div class="tiles-preview" id="tilesPreview">
                      ${this.renderTilesPreview(template?.tiles || [])}
                    </div>
                  </div>
                  
                  <div class="customize-section">
                    <label>Add Custom Tile:</label>
                    <div style="display: flex; gap: 10px;">
                      <input type="text" id="customTileText" placeholder="Tile text" 
                             style="flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                      <input type="text" id="customTileEmoji" placeholder="Emoji" 
                             style="width: 80px; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                      <button class="action-btn" onclick="moduleSystem.get('BoardCreationService').addCustomTile()">+ Add</button>
                    </div>
                  </div>
                  
                  <div class="customize-section">
                    <label>Board Settings:</label>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                      <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="enableDrilldown" checked>
                        Enable drill-down navigation
                      </label>
                      <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="enablePrediction">
                        Enable word prediction
                      </label>
                      <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="enableVisualSchedule">
                        Visual schedule mode
                      </label>
                    </div>
                  </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                  <button class="action-btn secondary" onclick="moduleSystem.get('BoardCreationService').showStep(1)">← Back</button>
                  <button class="action-btn" onclick="moduleSystem.get('BoardCreationService').finalizeBoard()">Create Board →</button>
                </div>
              </div>
            `;
            
            // Add styles for wizard
            this.addWizardStyles();
            break;
        }
      }
      
      selectPurpose(purpose) {
        this.wizard.data.purpose = purpose;
        this.showStep(1);
      }
      
      selectTemplate(template) {
        this.wizard.data.template = template;
        this.wizard.data.customTiles = [];
        this.showStep(2);
      }
      
      getSelectedTemplate() {
        const { purpose, template } = this.wizard.data;
        if (purpose === 'custom') return { name: 'My Custom Board', tiles: [] };
        return this.templates[purpose]?.[template];
      }
      
      renderTilesPreview(tiles) {
        const allTiles = [...tiles, ...(this.wizard.data.customTiles || [])];
        return `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-height: 300px; overflow-y: auto;">
            ${allTiles.map((tile, idx) => `
              <div class="tile-preview" style="background: ${this.getTileGradient(tile.color)}; padding: 15px; border-radius: 12px; text-align: center; position: relative;">
                <span style="font-size: 40px;">${tile.emoji}</span>
                <div style="font-size: 14px; margin-top: 5px;">${tile.text}</div>
                ${idx >= tiles.length ? `<button onclick="moduleSystem.get('BoardCreationService').removeCustomTile(${idx - tiles.length})" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">×</button>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
      
      getTileGradient(color) {
        const gradients = {
          blue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          green: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
          orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          purple: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          red: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
          yellow: 'linear-gradient(135deg, #ffd93d 0%, #6bcf7f 100%)',
          pink: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          gray: 'linear-gradient(135deg, #d3d3d3 0%, #a9a9a9 100%)',
          gold: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
          navy: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          brown: 'linear-gradient(135deg, #d2691e 0%, #8b4513 100%)',
          lavender: 'linear-gradient(135deg, #e6e6fa 0%, #dda0dd 100%)',
          rainbow: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)'
        };
        return gradients[color] || gradients.blue;
      }
      
      addCustomTile() {
        const text = document.getElementById('customTileText').value.trim();
        const emoji = document.getElementById('customTileEmoji').value.trim() || '📌';
        
        if (!text) return;
        
        if (!this.wizard.data.customTiles) this.wizard.data.customTiles = [];
        this.wizard.data.customTiles.push({
          text,
          emoji,
          color: ['blue', 'green', 'orange', 'purple', 'red'][this.wizard.data.customTiles.length % 5]
        });
        
        document.getElementById('customTileText').value = '';
        document.getElementById('customTileEmoji').value = '';
        
        const template = this.getSelectedTemplate();
        document.getElementById('tilesPreview').innerHTML = this.renderTilesPreview(template?.tiles || []);
      }
      
      removeCustomTile(index) {
        this.wizard.data.customTiles.splice(index, 1);
        const template = this.getSelectedTemplate();
        document.getElementById('tilesPreview').innerHTML = this.renderTilesPreview(template?.tiles || []);
      }
      
      finalizeBoard() {
        const boardName = document.getElementById('boardNameInput').value.trim();
        if (!boardName) {
          alert('Please enter a board name');
          return;
        }
        
        const boardId = boardName.toLowerCase().replace(/\s+/g, '_');
        const template = this.getSelectedTemplate();
        const allTiles = [...(template?.tiles || []), ...(this.wizard.data.customTiles || [])];
        
        // Create the board
        boards[boardId] = {
          title: boardName,
          tiles: allTiles.map(tile => ({
            text: tile.text,
            emoji: tile.emoji,
            color: tile.color,
            action: tile.action || 'speak',
            targetBoard: tile.targetBoard,
            isPECS: tile.isPECS,
            isSequence: tile.isSequence
          })),
          settings: {
            drilldown: document.getElementById('enableDrilldown')?.checked ?? true,
            prediction: document.getElementById('enablePrediction')?.checked ?? false,
            visualSchedule: document.getElementById('enableVisualSchedule')?.checked ?? false,
            createdBy: this.wizard.data.purpose,
            template: this.wizard.data.template,
            createdAt: new Date().toISOString()
          }
        };
        
        saveToStorage();
        this.closeWizard();
        navigateToBoard(boardId);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 40px;
          border-radius: 12px;
          font-size: 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 10000;
          animation: fadeInOut 3s ease;
        `;
        successMsg.textContent = `✨ Board "${boardName}" created successfully!`;
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      }
      
      // AI-powered board suggestions
      suggestBoards(userProfile) {
        const suggestions = [];
        
        // Analyze user needs
        if (userProfile.age && userProfile.age < 7) {
          suggestions.push({
            type: 'family',
            template: 'daily_routine',
            reason: 'Young children benefit from visual routines'
          });
        }
        
        if (userProfile.diagnosis?.includes('autism')) {
          suggestions.push({
            type: 'visualSchedule',
            template: 'morning',
            reason: 'Visual schedules help with predictability'
          });
          suggestions.push({
            type: 'socialStories',
            template: 'newPlace',
            reason: 'Social stories prepare for new experiences'
          });
        }
        
        if (userProfile.goals?.includes('behavior')) {
          suggestions.push({
            type: 'behaviorSupport',
            template: 'zones',
            reason: 'Zones help with emotional regulation'
          });
        }
        
        if (userProfile.setting === 'school') {
          suggestions.push({
            type: 'visualSchedule',
            template: 'classroom',
            reason: 'Classroom schedules provide structure'
          });
        }
        
        return suggestions;
      }
      
      // Quick board builder for common scenarios
      quickBuildBoard(scenario) {
        const quickTemplates = {
          'meltdown': {
            name: 'Calm Down Board',
            tiles: [
              { text: 'I need space', emoji: '🛑', color: 'red' },
              { text: 'Deep breaths', emoji: '🌬️', color: 'blue' },
              { text: 'Count to 10', emoji: '🔢', color: 'green' },
              { text: 'I need help', emoji: '🆘', color: 'orange' }
            ]
          },
          'restaurant': {
            name: 'Restaurant Board',
            tiles: [
              { text: 'Menu please', emoji: '📋', color: 'blue' },
              { text: 'I want', emoji: '👉', color: 'green' },
              { text: 'Water', emoji: '💧', color: 'blue' },
              { text: 'All done', emoji: '✅', color: 'purple' },
              { text: 'Bathroom', emoji: '🚽', color: 'orange' },
              { text: 'Thank you', emoji: '🙏', color: 'pink' }
            ]
          },
          'playground': {
            name: 'Playground Communication',
            tiles: [
              { text: 'My turn', emoji: '🙋', color: 'blue' },
              { text: 'Can I play?', emoji: '🤝', color: 'green' },
              { text: 'Share please', emoji: '🤲', color: 'purple' },
              { text: 'Help', emoji: '🆘', color: 'red' },
              { text: 'Stop', emoji: '🛑', color: 'red' },
              { text: 'Fun!', emoji: '🎉', color: 'yellow' }
            ]
          }
        };
        
        const template = quickTemplates[scenario];
        if (template) {
          const boardId = template.name.toLowerCase().replace(/\s+/g, '_');
          boards[boardId] = {
            title: template.name,
            tiles: template.tiles,
            settings: { quickBuild: true }
          };
          saveToStorage();
          navigateToBoard(boardId);
        }
      }
      
      addWizardStyles() {
        if (document.getElementById('wizardStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'wizardStyles';
        style.textContent = `
          .wizard-step {
            padding: 20px;
          }
          
          .wizard-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          
          .wizard-option {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .wizard-option:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-color: var(--primary-color);
          }
          
          .wizard-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 10px;
          }
          
          .wizard-option h4 {
            margin: 10px 0 5px;
            color: #333;
          }
          
          .wizard-option p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          
          .wizard-templates {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }
          
          .wizard-template {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .wizard-template:hover {
            border-color: var(--primary-color);
            background: #f0f4ff;
          }
          
          .wizard-template h4 {
            margin: 0 0 5px;
            color: #333;
          }
          
          .wizard-template p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          
          .wizard-customize {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
          }
          
          .customize-section {
            margin-bottom: 20px;
          }
          
          .customize-section label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
            color: #333;
          }
          
          .tiles-preview {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          
          .tile-preview {
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          
          .tile-preview:hover {
            transform: scale(1.05);
          }
          
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
          
          @keyframes slideInRight {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes slideOutRight {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }