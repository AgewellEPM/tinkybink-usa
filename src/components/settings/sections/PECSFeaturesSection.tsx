import React, { useState } from 'react';
import { usePECSStore } from '@/hooks/use-pecs-store';
import { getElizaService } from '@/modules/core/eliza-service';
import { 
  QRCodeGenerator, 
  BoardSync, 
  VisualStoryBuilder, 
  VelcroGuides, 
  AdvancedCustomization 
} from '@/components/pecs/advanced';

export const PECSFeaturesSection: React.FC = () => {
  const [status, setStatus] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showBoardSync, setShowBoardSync] = useState(false);
  const [showStoryBuilder, setShowStoryBuilder] = useState(false);
  const [showVelcroGuides, setShowVelcroGuides] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  
  const openPECSGenerator = () => {
    setStatus('Opening PECS Generator...');
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
      <div class="modal-content pecs-modal">
        <div class="modal-header">
          <h2>🖨️ PECS Printout Generator</h2>
          <button class="close" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="pecs-intro">
            <h3>Create Your Custom PECS Board</h3>
            <p>Design and print professional PECS cards for communication support.</p>
          </div>
          
          <div class="pecs-section ai-section">
            <h3>🤖 AI-Powered Board Generator</h3>
            <div class="ai-input-group">
              <textarea
                id="boardDescription"
                placeholder="Describe the PECS board you want to create... (e.g., 'Morning routine for 5-year-old', 'Basic needs and wants', 'Classroom activities')"
                class="ai-textarea"
                rows="3"
              ></textarea>
              <button onclick="window.generatePECSBoard()" class="ai-generate-btn">
                🪄 Generate Board
              </button>
            </div>
            <div class="ai-suggestions">
              <strong>Try these ideas:</strong>
              <button onclick="document.getElementById('boardDescription').value = 'Daily routine board with wake up, breakfast, school, play, dinner, and bedtime activities'" class="suggestion-chip">
                📅 Daily Routine
              </button>
              <button onclick="document.getElementById('boardDescription').value = 'Basic communication board with yes, no, help, more, stop, and bathroom'" class="suggestion-chip">
                💬 Basic Needs
              </button>
              <button onclick="document.getElementById('boardDescription').value = 'Emotions board with happy, sad, angry, scared, excited, and calm'" class="suggestion-chip">
                😊 Emotions
              </button>
            </div>
          </div>
          
          <div class="pecs-section preview-section">
            <div class="preview-header">
              <h3>📄 Board Preview</h3>
              <div class="preview-controls">
                <label class="control-group">
                  <span>Size:</span>
                  <select id="boardSize" onchange="window.updateBoardPreview()" class="preview-select">
                    <option value="3x3">3×3 (9 tiles)</option>
                    <option value="4x4" selected>4×4 (16 tiles)</option>
                    <option value="5x5">5×5 (25 tiles)</option>
                    <option value="6x6">6×6 (36 tiles)</option>
                  </select>
                </label>
                <label class="control-group">
                  <span>Tile:</span>
                  <select id="tileSize" onchange="window.updateBoardPreview()" class="preview-select">
                    <option value="small">Small (2")</option>
                    <option value="medium" selected>Medium (3")</option>
                    <option value="large">Large (4")</option>
                  </select>
                </label>
              </div>
            </div>
            <div id="boardPreview" class="board-preview">
              <div class="empty-preview">
                <span class="empty-icon">📋</span>
                <p>Your generated board will appear here</p>
              </div>
            </div>
          </div>
          
          <div class="pecs-section editor-section">
            <h3>✏️ Manual Editor</h3>
            <div id="manualEditor" style="display: none;">
              <div class="editor-toolbar">
                <button onclick="window.addTile()" class="editor-btn add">
                  ➕ Add Tile
                </button>
                <button onclick="window.clearAll()" class="editor-btn clear">
                  🗑️ Clear All
                </button>
                <button onclick="window.showEmojiPicker()" class="editor-btn emoji">
                  😊 Emoji Picker
                </button>
                <button onclick="window.getElizaSuggestion()" class="editor-btn eliza">
                  🤖 Eliza Suggestion
                </button>
              </div>
              <div id="editorTiles" class="editor-tiles">
                <!-- Tiles will be added here -->
              </div>
            </div>
            <button onclick="window.toggleEditor()" class="toggle-editor-btn">
              📝 Toggle Manual Editor
            </button>
          </div>
          
          <div class="pecs-section templates-section">
            <h3>📚 Quick Templates</h3>
            <div class="template-grid">
              <button onclick="window.loadTemplate('school')" class="template-card">
                <span class="template-icon">🏫</span>
                <span class="template-name">School</span>
              </button>
              <button onclick="window.loadTemplate('home')" class="template-card">
                <span class="template-icon">🏠</span>
                <span class="template-name">Home</span>
              </button>
              <button onclick="window.loadTemplate('food')" class="template-card">
                <span class="template-icon">🍽️</span>
                <span class="template-name">Food</span>
              </button>
              <button onclick="window.loadTemplate('feelings')" class="template-card">
                <span class="template-icon">😊</span>
                <span class="template-name">Feelings</span>
              </button>
              <button onclick="window.loadTemplate('activities')" class="template-card">
                <span class="template-icon">🎨</span>
                <span class="template-name">Activities</span>
              </button>
              <button onclick="window.loadTemplate('needs')" class="template-card">
                <span class="template-icon">💭</span>
                <span class="template-name">Needs</span>
              </button>
            </div>
          </div>
          
          <div class="pecs-actions">
            <button onclick="window.printBoard()" class="action-btn primary">
              🖨️ Print Board
            </button>
            <button onclick="window.saveAsTemplate()" class="action-btn secondary">
              💾 Save Template
            </button>
            <button onclick="window.exportBoard()" class="action-btn secondary">
              📤 Export
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add PECS generator functions to window
    window.currentPECSBoard = [];
    
    window.generatePECSBoard = async function() {
      const description = document.getElementById('boardDescription').value;
      if (!description) {
        setStatus('Please enter a description');
        return;
      }
      
      setStatus('Generating PECS board...');
      
      // Get Eliza suggestion for the board
      const elizaService = getElizaService();
      const suggestion = elizaService.getResponse(description);
      
      // Generate tiles based on description
      const tiles = [];
      const keywords = description.toLowerCase();
      
      if (keywords.includes('morning') || keywords.includes('routine') || keywords.includes('daily')) {
        tiles.push(
          { emoji: '🌅', text: 'Wake Up' },
          { emoji: '🪥', text: 'Brush Teeth' },
          { emoji: '🚿', text: 'Shower' },
          { emoji: '👕', text: 'Get Dressed' },
          { emoji: '🍳', text: 'Breakfast' },
          { emoji: '🎒', text: 'School' },
          { emoji: '🍕', text: 'Lunch' },
          { emoji: '🎮', text: 'Play' },
          { emoji: '🍽️', text: 'Dinner' },
          { emoji: '🛁', text: 'Bath' },
          { emoji: '📚', text: 'Story' },
          { emoji: '😴', text: 'Sleep' }
        );
      } else if (keywords.includes('school') || keywords.includes('classroom')) {
        tiles.push(
          { emoji: '✋', text: 'Raise Hand' },
          { emoji: '🤫', text: 'Quiet' },
          { emoji: '👂', text: 'Listen' },
          { emoji: '✏️', text: 'Write' },
          { emoji: '📖', text: 'Read' },
          { emoji: '🎨', text: 'Art' },
          { emoji: '🎵', text: 'Music' },
          { emoji: '🏃', text: 'PE' },
          { emoji: '🍎', text: 'Snack' },
          { emoji: '🚽', text: 'Bathroom' },
          { emoji: '🤝', text: 'Share' },
          { emoji: '✅', text: 'Finished' }
        );
      } else if (keywords.includes('emotion') || keywords.includes('feeling')) {
        tiles.push(
          { emoji: '😊', text: 'Happy' },
          { emoji: '😢', text: 'Sad' },
          { emoji: '😠', text: 'Angry' },
          { emoji: '😰', text: 'Worried' },
          { emoji: '😴', text: 'Tired' },
          { emoji: '🤗', text: 'Love' },
          { emoji: '😎', text: 'Cool' },
          { emoji: '🤒', text: 'Sick' },
          { emoji: '😌', text: 'Calm' }
        );
      } else if (keywords.includes('food') || keywords.includes('eat') || keywords.includes('meal')) {
        tiles.push(
          { emoji: '🍎', text: 'Apple' },
          { emoji: '🥪', text: 'Sandwich' },
          { emoji: '🍕', text: 'Pizza' },
          { emoji: '🥛', text: 'Milk' },
          { emoji: '💧', text: 'Water' },
          { emoji: '🍪', text: 'Cookie' },
          { emoji: '🥕', text: 'Carrot' },
          { emoji: '🧃', text: 'Juice' },
          { emoji: '🍌', text: 'Banana' }
        );
      } else {
        // Default basic needs
        tiles.push(
          { emoji: '✅', text: 'Yes' },
          { emoji: '❌', text: 'No' },
          { emoji: '🆘', text: 'Help' },
          { emoji: '➕', text: 'More' },
          { emoji: '🛑', text: 'Stop' },
          { emoji: '🚽', text: 'Bathroom' },
          { emoji: '💧', text: 'Water' },
          { emoji: '🍕', text: 'Food' },
          { emoji: '🏠', text: 'Home' }
        );
      }
      
      window.currentPECSBoard = tiles;
      window.updateBoardPreview();
      window.updateEditorTiles();
      setStatus('Board generated! ' + suggestion);
    };
    
    window.updateBoardPreview = function() {
      const preview = document.getElementById('boardPreview');
      const boardSize = document.getElementById('boardSize').value;
      const [cols, rows] = boardSize.split('x').map(Number);
      
      preview.className = 'board-preview board-' + boardSize.replace('x', '-');
      
      if (window.currentPECSBoard.length === 0) {
        preview.innerHTML = '<div class="empty-preview"><span class="empty-icon">📋</span><p>Your generated board will appear here</p></div>';
        return;
      }
      
      const tiles = window.currentPECSBoard.slice(0, cols * rows);
      preview.innerHTML = tiles.map(tile => `
        <div class="pecs-tile">
          <div class="tile-emoji">${tile.emoji}</div>
          <div class="tile-text">${tile.text}</div>
        </div>
      `).join('');
    };
    
    window.updateEditorTiles = function() {
      const editorTiles = document.getElementById('editorTiles');
      if (!editorTiles) return;
      
      editorTiles.innerHTML = window.currentPECSBoard.map((tile, index) => `
        <div class="editor-tile" data-index="${index}">
          <input type="text" value="${tile.emoji}" class="tile-emoji-input" onchange="window.updateTileEmoji(${index}, this.value)">
          <input type="text" value="${tile.text}" class="tile-text-input" onchange="window.updateTileText(${index}, this.value)">
          <button onclick="window.removeTile(${index})" class="remove-tile-btn">×</button>
        </div>
      `).join('');
    };
    
    window.toggleEditor = function() {
      const editor = document.getElementById('manualEditor');
      editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
      if (editor.style.display === 'block') {
        window.updateEditorTiles();
      }
    };
    
    window.addTile = function() {
      window.currentPECSBoard.push({ emoji: '❓', text: 'New Tile' });
      window.updateBoardPreview();
      window.updateEditorTiles();
    };
    
    window.updateTileEmoji = function(index, emoji) {
      window.currentPECSBoard[index].emoji = emoji;
      window.updateBoardPreview();
    };
    
    window.updateTileText = function(index, text) {
      window.currentPECSBoard[index].text = text;
      window.updateBoardPreview();
    };
    
    window.removeTile = function(index) {
      window.currentPECSBoard.splice(index, 1);
      window.updateBoardPreview();
      window.updateEditorTiles();
    };
    
    window.clearAll = function() {
      window.currentPECSBoard = [];
      window.updateBoardPreview();
      window.updateEditorTiles();
    };
    
    window.showEmojiPicker = function() {
      const emojis = ['😊', '😢', '😠', '😰', '😴', '🤗', '🏠', '🏫', '🍎', '🍕', '💧', '🚽', '✋', '👂', '✅', '❌', '🆘', '➕', '🛑', '🎮', '📚', '🎨', '🎵', '⚽', '🚗', '✈️', '🐶', '🐱', '🌈', '☀️', '🌙', '⭐'];
      
      const picker = document.createElement('div');
      picker.className = 'emoji-picker-overlay';
      picker.innerHTML = `
        <div class="emoji-picker">
          <div class="emoji-picker-header">
            <h3>Select an Emoji</h3>
            <button onclick="this.closest('.emoji-picker-overlay').remove()" class="close-btn">×</button>
          </div>
          <div class="emoji-grid">
            ${emojis.map(emoji => `
              <button onclick="window.selectEmoji('${emoji}')" class="emoji-btn">${emoji}</button>
            `).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(picker);
    };
    
    window.selectEmoji = function(emoji) {
      window.currentPECSBoard.push({ emoji: emoji, text: 'New Item' });
      window.updateBoardPreview();
      window.updateEditorTiles();
      document.querySelector('.emoji-picker-overlay')?.remove();
    };
    
    window.getElizaSuggestion = function() {
      const elizaService = getElizaService();
      const context = window.currentPECSBoard.map(t => t.text).join(', ');
      const suggestion = elizaService.getResponse(`I have these items: ${context}. What else should I add?`);
      
      const suggestedItems = [
        { emoji: '🤔', text: 'Think' },
        { emoji: '👍', text: 'Good' },
        { emoji: '🤝', text: 'Friend' },
        { emoji: '⏰', text: 'Time' },
        { emoji: '🎯', text: 'Goal' }
      ];
      
      const randomItem = suggestedItems[Math.floor(Math.random() * suggestedItems.length)];
      window.currentPECSBoard.push(randomItem);
      window.updateBoardPreview();
      window.updateEditorTiles();
      
      alert('Eliza suggests: ' + suggestion + '\\n\\nAdded "' + randomItem.text + '" to your board!');
    };
    
    window.loadTemplate = function(templateName) {
      const templates = {
        school: [
          { emoji: '✋', text: 'Raise Hand' },
          { emoji: '🤫', text: 'Quiet' },
          { emoji: '👂', text: 'Listen' },
          { emoji: '✏️', text: 'Write' },
          { emoji: '📖', text: 'Read' },
          { emoji: '🎨', text: 'Art' },
          { emoji: '🎵', text: 'Music' },
          { emoji: '🏃', text: 'PE' },
          { emoji: '🍎', text: 'Snack' },
          { emoji: '🚽', text: 'Bathroom' },
          { emoji: '🤝', text: 'Share' },
          { emoji: '✅', text: 'Finished' }
        ],
        home: [
          { emoji: '🏠', text: 'Home' },
          { emoji: '👨‍👩‍👧‍👦', text: 'Family' },
          { emoji: '🛏️', text: 'Bedroom' },
          { emoji: '🍽️', text: 'Kitchen' },
          { emoji: '🛁', text: 'Bathroom' },
          { emoji: '📺', text: 'TV' },
          { emoji: '🎮', text: 'Games' },
          { emoji: '📚', text: 'Books' },
          { emoji: '🧸', text: 'Toys' }
        ],
        food: [
          { emoji: '🍎', text: 'Apple' },
          { emoji: '🥪', text: 'Sandwich' },
          { emoji: '🍕', text: 'Pizza' },
          { emoji: '🥛', text: 'Milk' },
          { emoji: '💧', text: 'Water' },
          { emoji: '🍪', text: 'Cookie' },
          { emoji: '🥕', text: 'Carrot' },
          { emoji: '🧃', text: 'Juice' },
          { emoji: '🍌', text: 'Banana' },
          { emoji: '🥣', text: 'Cereal' },
          { emoji: '🍝', text: 'Pasta' },
          { emoji: '🍗', text: 'Chicken' }
        ],
        feelings: [
          { emoji: '😊', text: 'Happy' },
          { emoji: '😢', text: 'Sad' },
          { emoji: '😠', text: 'Angry' },
          { emoji: '😰', text: 'Worried' },
          { emoji: '😴', text: 'Tired' },
          { emoji: '🤗', text: 'Love' },
          { emoji: '😎', text: 'Cool' },
          { emoji: '🤒', text: 'Sick' },
          { emoji: '😌', text: 'Calm' },
          { emoji: '😃', text: 'Excited' },
          { emoji: '😔', text: 'Disappointed' },
          { emoji: '😨', text: 'Scared' }
        ],
        activities: [
          { emoji: '🎨', text: 'Art' },
          { emoji: '🎵', text: 'Music' },
          { emoji: '🏃', text: 'Run' },
          { emoji: '⚽', text: 'Soccer' },
          { emoji: '🏊', text: 'Swim' },
          { emoji: '🚴', text: 'Bike' },
          { emoji: '🎮', text: 'Games' },
          { emoji: '📚', text: 'Read' },
          { emoji: '🧩', text: 'Puzzle' },
          { emoji: '🎭', text: 'Drama' },
          { emoji: '💃', text: 'Dance' },
          { emoji: '🎪', text: 'Play' }
        ],
        needs: [
          { emoji: '✅', text: 'Yes' },
          { emoji: '❌', text: 'No' },
          { emoji: '🆘', text: 'Help' },
          { emoji: '➕', text: 'More' },
          { emoji: '🛑', text: 'Stop' },
          { emoji: '🚽', text: 'Bathroom' },
          { emoji: '💧', text: 'Water' },
          { emoji: '🍕', text: 'Food' },
          { emoji: '🤗', text: 'Hug' },
          { emoji: '🏥', text: 'Doctor' },
          { emoji: '💊', text: 'Medicine' },
          { emoji: '😴', text: 'Sleep' }
        ]
      };
      
      window.currentPECSBoard = templates[templateName] || [];
      window.updateBoardPreview();
      window.updateEditorTiles();
      setStatus(`Loaded ${templateName} template`);
    };
    
    window.printBoard = function() {
      const boardSize = document.getElementById('boardSize').value;
      const tileSize = document.getElementById('tileSize').value;
      const [cols, rows] = boardSize.split('x').map(Number);
      
      const tileSizeMap = {
        small: '2in',
        medium: '3in',
        large: '4in'
      };
      
      const printSize = tileSizeMap[tileSize];
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PECS Board - TinkyBink AAC</title>
          <style>
            @page { size: letter; margin: 0.5in; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              background: white;
              color: black;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .board {
              display: grid;
              grid-template-columns: repeat(${cols}, ${printSize});
              grid-template-rows: repeat(${rows}, ${printSize});
              gap: 2px;
              justify-content: center;
            }
            .tile {
              border: 2px solid #333;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              page-break-inside: avoid;
            }
            .tile-emoji {
              font-size: ${tileSize === 'small' ? '48px' : tileSize === 'medium' ? '64px' : '80px'};
              margin-bottom: 10px;
            }
            .tile-text {
              font-size: ${tileSize === 'small' ? '16px' : tileSize === 'medium' ? '20px' : '24px'};
              font-weight: bold;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PECS Communication Board</h1>
            <p>Created with TinkyBink AAC • ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="board">
            ${window.currentPECSBoard.slice(0, cols * rows).map(tile => `
              <div class="tile">
                <div class="tile-emoji">${tile.emoji}</div>
                <div class="tile-text">${tile.text}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>© TinkyBink AAC - Supporting Communication for All</p>
            <p style="margin-top: 10px;">✂️ Cut along the lines to create individual PECS cards</p>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.print();
      };
    };
    
    window.saveAsTemplate = function() {
      const templateName = prompt('Enter a name for this template:');
      if (templateName) {
        const templates = JSON.parse(localStorage.getItem('pecsTemplates') || '{}');
        templates[templateName] = window.currentPECSBoard;
        localStorage.setItem('pecsTemplates', JSON.stringify(templates));
        setStatus(`Template "${templateName}" saved!`);
      }
    };
    
    window.exportBoard = function() {
      const data = {
        version: '1.0',
        created: new Date().toISOString(),
        board: window.currentPECSBoard
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pecs-board-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    
    setStatus('PECS Generator ready');
  };
  
  const showPECSTemplates = () => {
    alert('PECS Templates - Coming Soon!\n\n' +
      'Available templates:\n' +
      '• Daily Routines\n' +
      '• Classroom Activities\n' +
      '• Food & Meals\n' +
      '• Emotions & Feelings\n' +
      '• Basic Needs\n' +
      '• Social Interactions\n' +
      '• Medical & Health\n' +
      '• Sensory Needs\n' +
      '• Play & Recreation\n' +
      '• Community Outings\n' +
      '• Self-Care Tasks\n' +
      '• Token Economy Boards\n' +
      '• Communication Books'
    );
  };

  return (
    <>
      <div className="settings-section">
        <h3>🖨️ PECS Printout Generator</h3>
        <div className="action-buttons">
          <button 
            className="action-btn" 
            onClick={openPECSGenerator}
            style={{ background: 'linear-gradient(135deg, #ff6b6b, #feca57)', color: 'white' }}
          >
            📋 Create Printable PECS
          </button>
          <button className="action-btn secondary" onClick={showPECSTemplates}>
            📄 View Templates
          </button>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>🚀 Advanced PECS Features</h3>
        <div className="action-buttons">
          <button 
            className="action-btn" 
            onClick={() => setShowQRCode(true)}
            style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}
          >
            <span style={{ fontSize: '16px' }}>📱</span> QR Code PECS
          </button>
          <button 
            className="action-btn" 
            onClick={() => setShowBoardSync(true)}
            style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
          >
            <span style={{ fontSize: '16px' }}>🔄</span> Board Sync
          </button>
          <button 
            className="action-btn" 
            onClick={() => setShowStoryBuilder(true)}
            style={{ background: 'linear-gradient(135deg, #fdcb6e, #e17055)' }}
          >
            <span style={{ fontSize: '16px' }}>📚</span> Story Builder
          </button>
          <button 
            className="action-btn" 
            onClick={() => setShowVelcroGuides(true)}
            style={{ background: 'linear-gradient(135deg, #81ecec, #74b9ff)' }}
          >
            <span style={{ fontSize: '16px' }}>✂️</span> Velcro Guides
          </button>
          <button 
            className="action-btn" 
            onClick={() => setShowCustomization(true)}
            style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}
          >
            <span style={{ fontSize: '16px' }}>🎨</span> Customization
          </button>
        </div>
      </div>
      
      {status && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
          {status}
        </div>
      )}
      
      {/* Modular Advanced PECS Components */}
      <QRCodeGenerator isOpen={showQRCode} onClose={() => setShowQRCode(false)} />
      <BoardSync isOpen={showBoardSync} onClose={() => setShowBoardSync(false)} />
      <VisualStoryBuilder isOpen={showStoryBuilder} onClose={() => setShowStoryBuilder(false)} />
      <VelcroGuides isOpen={showVelcroGuides} onClose={() => setShowVelcroGuides(false)} />
      <AdvancedCustomization isOpen={showCustomization} onClose={() => setShowCustomization(false)} />
    </>
  );
};