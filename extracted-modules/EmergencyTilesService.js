class EmergencyTilesService {
      initialize() { 
        console.log('Emergency Tiles Service ready');
        this.addEmergencyTiles();
      }
      
      addEmergencyTiles() {
        if (!boards.home) return;
        
        // Add emergency tile if not exists
        const hasEmergency = boards.home.tiles.some(t => t.id === 'emergency');
        if (!hasEmergency) {
          boards.home.tiles.push({
            id: 'emergency',
            emoji: '🚨',
            text: 'EMERGENCY',
            speech: 'This is an emergency! I need help now!',
            color: 'tile-emergency'
          });
        }
      }
    }