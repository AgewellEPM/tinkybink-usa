class AnalyticsService {
      constructor() {
        this.sessionStartTime = new Date();
        this.tileClicks = {};
        this.boardVisits = {};
        this.speechCount = 0;
        this.totalClicks = 0;
        this.sentenceCount = 0;
        this.timeline = [];
        this.hourlyUsage = {};
        this.dailyUsage = {};
        this.mostUsedTiles = [];
        this.sessionDuration = 0;
      }
      
      initialize() {
        console.log('Analytics Service ready');
        this.loadAnalytics();
        
        // Update session duration every minute
        setInterval(() => this.updateSessionDuration(), 60000);
        
        // Save analytics every 5 minutes
        setInterval(() => this.saveAnalytics(), 300000);
      }
      
      track(event, data) {
        this.timeline.push({
          event,
          data,
          timestamp: new Date().toISOString()
        });
      }
      
      trackTileClick(tileText, boardName) {
        this.totalClicks++;
        const key = `${boardName}:${tileText}`;
        this.tileClicks[key] = (this.tileClicks[key] || 0) + 1;
        this.updateMostUsed();
        this.track('tile_click', { tile: tileText, board: boardName });
      }
      
      trackBoardVisit(boardName) {
        this.boardVisits[boardName] = (this.boardVisits[boardName] || 0) + 1;
        this.track('board_visit', { board: boardName });
      }
      
      trackSpeech(text) {
        this.speechCount++;
        this.track('speech', { text });
      }
      
      trackSentence(sentence) {
        this.sentenceCount++;
        this.track('sentence', { sentence });
      }
      
      updateSessionDuration() {
        const now = new Date();
        this.sessionDuration = Math.floor((now - this.sessionStartTime) / 1000);
      }
      
      updateMostUsed() {
        // Sort tiles by usage
        const tiles = Object.entries(this.tileClicks)
          .map(([key, count]) => {
            const [board, tile] = key.split(':');
            return { board, tile, count };
          })
          .sort((a, b) => b.count - a.count);
        
        this.mostUsedTiles = tiles.slice(0, 10);
      }
      
      saveAnalytics() {
        this.updateSessionDuration();
        const dataService = moduleSystem.get('DataService');
        if (dataService) {
          dataService.save('tinkybink_analytics', {
            sessionStartTime: this.sessionStartTime,
            tileClicks: this.tileClicks,
            boardVisits: this.boardVisits,
            speechCount: this.speechCount,
            totalClicks: this.totalClicks,
            sentenceCount: this.sentenceCount,
            timeline: this.timeline.slice(-1000), // Keep last 1000 events
            hourlyUsage: this.hourlyUsage,
            dailyUsage: this.dailyUsage,
            mostUsedTiles: this.mostUsedTiles,
            lastUpdated: new Date()
          });
        }
      }
      
      loadAnalytics() {
        const dataService = moduleSystem.get('DataService');
        if (dataService) {
          const saved = dataService.load('tinkybink_analytics');
          if (saved) {
            // Merge with existing data
            Object.keys(saved.tileClicks || {}).forEach(key => {
              this.tileClicks[key] = (this.tileClicks[key] || 0) + saved.tileClicks[key];
            });
            Object.keys(saved.boardVisits || {}).forEach(key => {
              this.boardVisits[key] = (this.boardVisits[key] || 0) + saved.boardVisits[key];
            });
            this.speechCount += saved.speechCount || 0;
            this.totalClicks += saved.totalClicks || 0;
            this.sentenceCount += saved.sentenceCount || 0;
            this.updateMostUsed();
          }
        }
      }
      
      getReport() {
        this.updateSessionDuration();
        return {
          sessionDuration: this.sessionDuration,
          totalClicks: this.totalClicks,
          speechCount: this.speechCount,
          sentenceCount: this.sentenceCount,
          boardsVisited: Object.keys(this.boardVisits).length,
          mostUsedTiles: this.mostUsedTiles,
          mostVisitedBoards: Object.entries(this.boardVisits)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
          timeline: this.timeline.slice(-100)
        };
      }
      
      getSuggestions() {
        // Get top 6 most used tiles for smart layout
        return this.mostUsedTiles.slice(0, 6);
      }
      
      clearData() {
        this.tileClicks = {};
        this.boardVisits = {};
        this.speechCount = 0;
        this.totalClicks = 0;
        this.sentenceCount = 0;
        this.timeline = [];
        this.mostUsedTiles = [];
        this.sessionStartTime = new Date();
        this.sessionDuration = 0;
        
        const dataService = moduleSystem.get('DataService');
        if (dataService) {
          dataService.remove('tinkybink_analytics');
        }
      }
    }