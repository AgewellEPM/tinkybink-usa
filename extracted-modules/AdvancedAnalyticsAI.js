class AdvancedAnalyticsAI {
      constructor() {
        this.model = null;
        this.patternModel = null;
        this.predictionModel = null;
        this.sessionData = [];
        this.patientProfiles = new Map();
        this.recommendations = [];
        this.initializeAI();
      }
      
      async initializeAI() {
        try {
          // Load pre-trained models for therapy predictions
          await this.loadModels();
          
          // Initialize real-time analytics
          this.setupRealtimeAnalytics();
          
          // Start anomaly detection
          this.startAnomalyDetection();
          
          console.log('AI Analytics initialized');
        } catch (error) {
          console.error('AI initialization error:', error);
        }
      }
      
      async loadModels() {
        // Create a simple neural network for progress prediction
        this.progressModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [10], units: 50, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 25, activation: 'relu' }),
            tf.layers.dense({ units: 1, activation: 'sigmoid' })
          ]
        });
        
        // Compile the model
        this.progressModel.compile({
          optimizer: tf.train.adam(0.001),
          loss: 'binaryCrossentropy',
          metrics: ['accuracy']
        });
        
        // Pattern recognition model for communication patterns
        this.patternModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [20], units: 100, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.3 }),
            tf.layers.dense({ units: 50, activation: 'relu' }),
            tf.layers.dense({ units: 5, activation: 'softmax' })
          ]
        });
        
        this.patternModel.compile({
          optimizer: tf.train.adam(0.001),
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy']
        });
      }
      
      trackSession(sessionData) {
        const enrichedData = {
          ...sessionData,
          timestamp: new Date().toISOString(),
          duration: sessionData.endTime - sessionData.startTime,
          tileInteractions: sessionData.tiles?.length || 0,
          speechAttempts: sessionData.speechCount || 0,
          successRate: this.calculateSuccessRate(sessionData),
          engagementLevel: this.calculateEngagement(sessionData),
          communicationPattern: this.detectPattern(sessionData)
        };
        
        this.sessionData.push(enrichedData);
        
        // Update patient profile
        this.updatePatientProfile(sessionData.patientId, enrichedData);
        
        // Generate real-time insights
        this.generateInsights(enrichedData);
        
        // Predict future progress
        this.predictProgress(sessionData.patientId);
        
        return enrichedData;
      }
      
      calculateSuccessRate(session) {
        if (!session.attempts || session.attempts === 0) return 0;
        return (session.successes / session.attempts) * 100;
      }
      
      calculateEngagement(session) {
        const factors = {
          duration: Math.min(session.duration / 1800000, 1), // 30 min max
          interactions: Math.min(session.tileInteractions / 50, 1),
          variety: Math.min(session.uniqueTiles / 10, 1),
          consistency: session.consistencyScore || 0.5
        };
        
        return Object.values(factors).reduce((a, b) => a + b) / Object.keys(factors).length;
      }
      
      detectPattern(session) {
        const patterns = {
          requesting: 0,
          labeling: 0,
          socializing: 0,
          expressing: 0,
          questioning: 0
        };
        
        // Analyze tile usage patterns
        session.tiles?.forEach(tile => {
          if (tile.category === 'wants' || tile.category === 'needs') patterns.requesting++;
          if (tile.category === 'objects' || tile.category === 'animals') patterns.labeling++;
          if (tile.category === 'social' || tile.category === 'greetings') patterns.socializing++;
          if (tile.category === 'feelings' || tile.category === 'emotions') patterns.expressing++;
          if (tile.category === 'questions') patterns.questioning++;
        });
        
        // Return dominant pattern
        return Object.entries(patterns).sort((a, b) => b[1] - a[1])[0][0];
      }
      
      updatePatientProfile(patientId, sessionData) {
        if (!this.patientProfiles.has(patientId)) {
          this.patientProfiles.set(patientId, {
            id: patientId,
            sessions: [],
            avgEngagement: 0,
            avgSuccessRate: 0,
            dominantPattern: null,
            progressTrend: 'stable',
            strengths: [],
            areasForImprovement: [],
            milestones: []
          });
        }
        
        const profile = this.patientProfiles.get(patientId);
        profile.sessions.push(sessionData);
        
        // Recalculate averages
        const sessions = profile.sessions;
        profile.avgEngagement = sessions.reduce((sum, s) => sum + s.engagementLevel, 0) / sessions.length;
        profile.avgSuccessRate = sessions.reduce((sum, s) => sum + s.successRate, 0) / sessions.length;
        
        // Detect trends
        if (sessions.length > 5) {
          const recent = sessions.slice(-5);
          const older = sessions.slice(-10, -5);
          
          const recentAvg = recent.reduce((sum, s) => sum + s.successRate, 0) / recent.length;
          const olderAvg = older.reduce((sum, s) => sum + s.successRate, 0) / older.length;
          
          if (recentAvg > olderAvg * 1.1) profile.progressTrend = 'improving';
          else if (recentAvg < olderAvg * 0.9) profile.progressTrend = 'declining';
          else profile.progressTrend = 'stable';
        }
        
        // Check for milestones
        this.checkMilestones(profile);
      }
      
      checkMilestones(profile) {
        const milestones = [
          { threshold: 10, name: 'First 10 Sessions', achieved: false },
          { threshold: 50, name: '50 Sessions Milestone', achieved: false },
          { threshold: 100, name: 'Century Club', achieved: false },
          { successRate: 80, name: 'High Achiever', achieved: false },
          { engagement: 0.8, name: 'Highly Engaged', achieved: false },
          { pattern: 'socializing', count: 20, name: 'Social Butterfly', achieved: false }
        ];
        
        milestones.forEach(milestone => {
          if (milestone.threshold && profile.sessions.length >= milestone.threshold) {
            if (!profile.milestones.find(m => m.name === milestone.name)) {
              profile.milestones.push({
                ...milestone,
                achievedAt: new Date().toISOString()
              });
              this.celebrateMilestone(milestone);
            }
          }
        });
      }
      
      celebrateMilestone(milestone) {
        // Trigger celebration UI
        if (window.speak) {
          window.speak(`Congratulations! Achievement unlocked: ${milestone.name}`);
        }
      }
      
      async predictProgress(patientId) {
        const profile = this.patientProfiles.get(patientId);
        if (!profile || profile.sessions.length < 5) return null;
        
        try {
          // Prepare features for prediction
          const features = tf.tensor2d([this.extractFeatures(profile)]);
          
          // Make prediction
          const prediction = await this.progressModel.predict(features).data();
          
          features.dispose();
          
          return {
            likelihood: prediction[0],
            confidence: Math.abs(prediction[0] - 0.5) * 2,
            recommendation: this.generateRecommendation(prediction[0], profile)
          };
        } catch (error) {
          console.error('Prediction error:', error);
          return null;
        }
      }
      
      extractFeatures(profile) {
        const recent = profile.sessions.slice(-10);
        return [
          profile.avgEngagement,
          profile.avgSuccessRate / 100,
          profile.sessions.length / 100,
          recent.length / 10,
          profile.progressTrend === 'improving' ? 1 : 0,
          profile.progressTrend === 'declining' ? 1 : 0,
          profile.milestones.length / 10,
          recent.reduce((sum, s) => sum + s.tileInteractions, 0) / recent.length / 50,
          recent.reduce((sum, s) => sum + s.speechAttempts, 0) / recent.length / 20,
          recent.reduce((sum, s) => sum + s.duration, 0) / recent.length / 1800000
        ];
      }
      
      generateRecommendation(likelihood, profile) {
        const recommendations = [];
        
        if (likelihood > 0.7) {
          recommendations.push('Excellent progress! Consider introducing more complex communication boards.');
        } else if (likelihood > 0.5) {
          recommendations.push('Good steady progress. Maintain current approach with slight variations.');
        } else {
          recommendations.push('Consider adjusting session structure or trying different tile categories.');
        }
        
        // Specific recommendations based on patterns
        if (profile.avgEngagement < 0.5) {
          recommendations.push('Try shorter, more frequent sessions to boost engagement.');
        }
        
        if (profile.dominantPattern === 'requesting') {
          recommendations.push('Introduce more descriptive and social communication tiles.');
        }
        
        return recommendations;
      }
      
      generateInsights(sessionData) {
        const insights = [];
        
        // Engagement insights
        if (sessionData.engagementLevel > 0.8) {
          insights.push({
            type: 'positive',
            message: 'High engagement detected! This session format works well.',
            icon: '🌟'
          });
        }
        
        // Pattern insights
        if (sessionData.communicationPattern) {
          insights.push({
            type: 'info',
            message: `Primary communication pattern: ${sessionData.communicationPattern}`,
            icon: '🎯'
          });
        }
        
        // Anomaly detection
        if (this.detectAnomaly(sessionData)) {
          insights.push({
            type: 'warning',
            message: 'Unusual session pattern detected. May need attention.',
            icon: '⚠️'
          });
        }
        
        this.recommendations = insights;
        this.updateInsightsUI(insights);
      }
      
      detectAnomaly(session) {
        // Simple anomaly detection based on standard deviations
        const allSessions = Array.from(this.patientProfiles.values())
          .flatMap(p => p.sessions);
        
        if (allSessions.length < 20) return false;
        
        const avgDuration = allSessions.reduce((sum, s) => sum + s.duration, 0) / allSessions.length;
        const stdDuration = Math.sqrt(
          allSessions.reduce((sum, s) => sum + Math.pow(s.duration - avgDuration, 2), 0) / allSessions.length
        );
        
        return Math.abs(session.duration - avgDuration) > 2 * stdDuration;
      }
      
      updateInsightsUI(insights) {
        // Update the UI with insights
        const insightsContainer = document.getElementById('aiInsights');
        if (insightsContainer) {
          insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
              <span class="insight-icon">${insight.icon}</span>
              <span class="insight-message">${insight.message}</span>
            </div>
          `).join('');
        }
      }
      
      setupRealtimeAnalytics() {
        // Monitor tile clicks
        document.addEventListener('tileClicked', (event) => {
          this.trackInteraction({
            type: 'tile',
            tileId: event.detail.tileId,
            category: event.detail.category,
            timestamp: Date.now()
          });
        });
        
        // Monitor speech events
        document.addEventListener('speechUttered', (event) => {
          this.trackInteraction({
            type: 'speech',
            text: event.detail.text,
            duration: event.detail.duration,
            timestamp: Date.now()
          });
        });
      }
      
      trackInteraction(interaction) {
        // Real-time interaction tracking
        const currentSession = this.getCurrentSession();
        if (currentSession) {
          currentSession.interactions = currentSession.interactions || [];
          currentSession.interactions.push(interaction);
          
          // Update live metrics
          this.updateLiveMetrics(currentSession);
        }
      }
      
      getCurrentSession() {
        // Get or create current session
        return this.sessionData[this.sessionData.length - 1] || null;
      }
      
      updateLiveMetrics(session) {
        // Update dashboard with live metrics
        const metricsDisplay = document.getElementById('liveMetrics');
        if (metricsDisplay) {
          metricsDisplay.innerHTML = `
            <div class="metric">
              <span class="metric-label">Interactions</span>
              <span class="metric-value">${session.interactions?.length || 0}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Engagement</span>
              <span class="metric-value">${(this.calculateEngagement(session) * 100).toFixed(0)}%</span>
            </div>
          `;
        }
      }
      
      startAnomalyDetection() {
        // Check for anomalies every 5 minutes
        setInterval(() => {
          const currentSession = this.getCurrentSession();
          if (currentSession && this.detectAnomaly(currentSession)) {
            this.alertAnomaly(currentSession);
          }
        }, 5 * 60 * 1000);
      }
      
      alertAnomaly(session) {
        console.warn('Anomaly detected in session:', session);
        // Could trigger notifications or alerts here
      }
      
      generateReport(patientId, dateRange) {
        const profile = this.patientProfiles.get(patientId);
        if (!profile) return null;
        
        const sessions = profile.sessions.filter(s => {
          const sessionDate = new Date(s.timestamp);
          return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
        });
        
        return {
          patientId,
          dateRange,
          summary: {
            totalSessions: sessions.length,
            avgEngagement: profile.avgEngagement,
            avgSuccessRate: profile.avgSuccessRate,
            progressTrend: profile.progressTrend,
            dominantPattern: profile.dominantPattern
          },
          milestones: profile.milestones,
          recommendations: this.generateRecommendation(0.6, profile),
          detailedMetrics: this.calculateDetailedMetrics(sessions),
          visualizations: this.prepareVisualizationData(sessions)
        };
      }
      
      calculateDetailedMetrics(sessions) {
        return {
          communicationGrowth: this.calculateGrowthRate(sessions, 'tileInteractions'),
          engagementTrend: this.calculateTrend(sessions, 'engagementLevel'),
          sessionConsistency: this.calculateConsistency(sessions),
          peakPerformanceTimes: this.findPeakTimes(sessions)
        };
      }
      
      calculateGrowthRate(sessions, metric) {
        if (sessions.length < 2) return 0;
        
        const first = sessions.slice(0, Math.floor(sessions.length / 3));
        const last = sessions.slice(-Math.floor(sessions.length / 3));
        
        const firstAvg = first.reduce((sum, s) => sum + (s[metric] || 0), 0) / first.length;
        const lastAvg = last.reduce((sum, s) => sum + (s[metric] || 0), 0) / last.length;
        
        return ((lastAvg - firstAvg) / firstAvg) * 100;
      }
      
      calculateTrend(sessions, metric) {
        // Simple linear regression for trend
        const x = sessions.map((_, i) => i);
        const y = sessions.map(s => s[metric] || 0);
        
        const n = sessions.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        return slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable';
      }
      
      calculateConsistency(sessions) {
        if (sessions.length < 2) return 1;
        
        const intervals = [];
        for (let i = 1; i < sessions.length; i++) {
          const interval = new Date(sessions[i].timestamp) - new Date(sessions[i-1].timestamp);
          intervals.push(interval);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Return consistency score (0-1, where 1 is most consistent)
        return Math.max(0, 1 - (stdDev / avgInterval));
      }
      
      findPeakTimes(sessions) {
        const hourCounts = new Array(24).fill(0);
        const hourSuccess = new Array(24).fill(0);
        
        sessions.forEach(session => {
          const hour = new Date(session.timestamp).getHours();
          hourCounts[hour]++;
          hourSuccess[hour] += session.successRate || 0;
        });
        
        const peaks = [];
        for (let i = 0; i < 24; i++) {
          if (hourCounts[i] > 0) {
            peaks.push({
              hour: i,
              frequency: hourCounts[i],
              avgSuccess: hourSuccess[i] / hourCounts[i]
            });
          }
        }
        
        return peaks.sort((a, b) => b.avgSuccess - a.avgSuccess).slice(0, 3);
      }
      
      prepareVisualizationData(sessions) {
        return {
          progressChart: {
            labels: sessions.map(s => new Date(s.timestamp).toLocaleDateString()),
            datasets: [{
              label: 'Success Rate',
              data: sessions.map(s => s.successRate),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }, {
              label: 'Engagement',
              data: sessions.map(s => s.engagementLevel * 100),
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1
            }]
          },
          patternDistribution: {
            labels: ['Requesting', 'Labeling', 'Socializing', 'Expressing', 'Questioning'],
            data: this.calculatePatternDistribution(sessions)
          },
          heatmap: this.generateActivityHeatmap(sessions)
        };
      }
      
      calculatePatternDistribution(sessions) {
        const patterns = { requesting: 0, labeling: 0, socializing: 0, expressing: 0, questioning: 0 };
        
        sessions.forEach(session => {
          if (session.communicationPattern) {
            patterns[session.communicationPattern]++;
          }
        });
        
        return Object.values(patterns);
      }
      
      generateActivityHeatmap(sessions) {
        const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
        
        sessions.forEach(session => {
          const date = new Date(session.timestamp);
          const day = date.getDay();
          const hour = date.getHours();
          heatmap[day][hour]++;
        });
        
        return heatmap;
      }
    }
    
    // Initialize AI Analytics
    window.aiAnalytics = new AdvancedAnalyticsAI();
            tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
            tf.layers.lstm({ units: 32, returnSequences: false }),
            tf.layers.dense({ units: 16, activation: 'relu' }),
            tf.layers.dense({ units: 5, activation: 'softmax' }) // 5 pattern categories
          ]
        });
        
        this.patternModel.compile({
          optimizer: 'adam',
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy']
        });
        
        // Regression model for session duration prediction
        this.durationModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [8], units: 32, activation: 'relu' }),
            tf.layers.dense({ units: 16, activation: 'relu' }),
            tf.layers.dense({ units: 1 })
          ]
        });
        
        this.durationModel.compile({
          optimizer: 'sgd',
          loss: 'meanSquaredError'
        });
      }
      
      setupRealtimeAnalytics() {
        // Track all user interactions
        document.addEventListener('click', (e) => {
          const tile = e.target.closest('.tile');
          if (tile) {
            this.trackInteraction({
              type: 'tile_click',
              tileId: tile.dataset.id,
              tileText: tile.querySelector('.tile-text')?.textContent,
              timestamp: Date.now(),
              context: this.getCurrentContext()
            });
          }
        });
        
        // Track session metrics
        setInterval(() => {
          if (window.sessionTimer && window.sessionTimer.isRunning) {
            this.updateSessionMetrics();
          }
        }, 30000); // Every 30 seconds
      }
      
      trackInteraction(interaction) {
        // Store interaction
        this.sessionData.push(interaction);
        
        // Real-time pattern analysis
        this.analyzeInteractionPattern(interaction);
        
        // Update patient profile
        this.updatePatientProfile(interaction);
        
        // Generate real-time insights
        this.generateInsights();
      }
      
      getCurrentContext() {
        return {
          isActionMode: window.isActionMode || false,
          currentCategory: window.currentCategory || 'home',
          currentBoard: window.currentBoard || null,
          sessionDuration: window.sessionTimer?.getElapsed() || 0,
          userId: window.authSystem?.getCurrentUser()?.id || null
        };
      }
      
      analyzeInteractionPattern(interaction) {
        const recentInteractions = this.sessionData.slice(-20);
        
        // Extract features for pattern analysis
        const features = this.extractPatternFeatures(recentInteractions);
        
        // Predict pattern category
        if (features.length === 20) {
          const prediction = this.patternModel.predict(tf.tensor2d([features]));
          prediction.array().then(result => {
            const patterns = ['Requesting', 'Expressing', 'Social', 'Learning', 'Playing'];
            const maxIndex = result[0].indexOf(Math.max(...result[0]));
            const pattern = patterns[maxIndex];
            const confidence = result[0][maxIndex];
            
            if (confidence > 0.7) {
              this.showPatternInsight(pattern, confidence);
            }
          });
        }
      }
      
      extractPatternFeatures(interactions) {
        // Feature engineering for pattern recognition
        const features = [];
        
        // Time-based features
        const timeDiffs = [];
        for (let i = 1; i < interactions.length; i++) {
          timeDiffs.push(interactions[i].timestamp - interactions[i-1].timestamp);
        }
        
        features.push(
          timeDiffs.length > 0 ? Math.mean(timeDiffs) / 1000 : 0, // Avg time between clicks
          timeDiffs.length > 0 ? Math.std(timeDiffs) / 1000 : 0,  // Std dev of time
          interactions.filter(i => i.type === 'tile_click').length, // Click count
          new Set(interactions.map(i => i.tileText)).size, // Unique tiles
          interactions.filter(i => i.context.isActionMode).length, // Action mode usage
        );
        
        // Category distribution
        const categories = {};
        interactions.forEach(i => {
          const category = i.context.currentCategory || 'home';
          categories[category] = (categories[category] || 0) + 1;
        });
        
        // Pad features to fixed length
        while (features.length < 20) {
          features.push(0);
        }
        
        return features.slice(0, 20);
      }
      
      updatePatientProfile(interaction) {
        const patientId = window.currentPatientId || 'default';
        
        if (!this.patientProfiles.has(patientId)) {
          this.patientProfiles.set(patientId, {
            totalInteractions: 0,
            preferredTiles: {},
            sessionCount: 0,
            avgSessionDuration: 0,
            progressScore: 0,
            strengths: [],
            challenges: [],
            lastUpdated: Date.now()
          });
        }
        
        const profile = this.patientProfiles.get(patientId);
        profile.totalInteractions++;
        
        // Track preferred tiles
        if (interaction.tileText) {
          profile.preferredTiles[interaction.tileText] = 
            (profile.preferredTiles[interaction.tileText] || 0) + 1;
        }
        
        // Update profile analytics
        this.calculateProgressScore(patientId);
      }
      
      calculateProgressScore(patientId) {
        const profile = this.patientProfiles.get(patientId);
        if (!profile) return;
        
        // Features for progress prediction
        const features = [
          profile.totalInteractions / 100,
          profile.sessionCount / 10,
          profile.avgSessionDuration / 3600,
          Object.keys(profile.preferredTiles).length / 50,
          this.calculateConsistencyScore(patientId),
          this.calculateComplexityScore(patientId),
          this.calculateEngagementScore(patientId),
          this.calculateIndependenceScore(patientId),
          this.calculateSocialScore(patientId),
          this.calculateAchievementScore(patientId)
        ];
        
        // Predict progress
        const prediction = this.progressModel.predict(tf.tensor2d([features]));
        prediction.array().then(result => {
          profile.progressScore = Math.round(result[0][0] * 100);
          this.updateProgressDisplay(patientId, profile.progressScore);
        });
      }
      
      calculateConsistencyScore(patientId) {
        // Analyze session regularity
        const sessions = this.getPatientSessions(patientId);
        if (sessions.length < 2) return 0;
        
        const intervals = [];
        for (let i = 1; i < sessions.length; i++) {
          intervals.push(sessions[i].timestamp - sessions[i-1].timestamp);
        }
        
        const avgInterval = Math.mean(intervals);
        const stdInterval = Math.std(intervals);
        
        return Math.max(0, 1 - (stdInterval / avgInterval));
      }
      
      calculateComplexityScore(patientId) {
        const profile = this.patientProfiles.get(patientId);
        const recentInteractions = this.sessionData.filter(i => 
          (Date.now() - i.timestamp) < 7 * 24 * 60 * 60 * 1000 // Last 7 days
        );
        
        // Measure vocabulary diversity and sentence length
        const uniqueWords = new Set();
        let totalWords = 0;
        
        recentInteractions.forEach(i => {
          if (i.tileText) {
            uniqueWords.add(i.tileText);
            totalWords++;
          }
        });
        
        return Math.min(1, uniqueWords.size / 100);
      }
      
      calculateEngagementScore(patientId) {
        const recentSessions = this.getPatientSessions(patientId).slice(-10);
        if (recentSessions.length === 0) return 0;
        
        const avgDuration = Math.mean(recentSessions.map(s => s.duration));
        const avgInteractions = Math.mean(recentSessions.map(s => s.interactions));
        
        return Math.min(1, (avgDuration / 1800 + avgInteractions / 100) / 2);
      }
      
      calculateIndependenceScore(patientId) {
        // Measure reduction in prompts/assistance over time
        const sessions = this.getPatientSessions(patientId);
        if (sessions.length < 5) return 0.5;
        
        const recentSessions = sessions.slice(-5);
        const olderSessions = sessions.slice(-10, -5);
        
        const recentAssistance = Math.mean(recentSessions.map(s => s.assistanceLevel || 0));
        const olderAssistance = Math.mean(olderSessions.map(s => s.assistanceLevel || 1));
        
        return Math.max(0, 1 - recentAssistance);
      }
      
      calculateSocialScore(patientId) {
        const profile = this.patientProfiles.get(patientId);
        const socialTiles = ['HELLO', 'THANK YOU', 'PLEASE', 'FRIEND', 'PLAY', 'SHARE'];
        
        let socialInteractions = 0;
        socialTiles.forEach(tile => {
          socialInteractions += profile.preferredTiles[tile] || 0;
        });
        
        return Math.min(1, socialInteractions / 50);
      }
      
      calculateAchievementScore(patientId) {
        const profile = this.patientProfiles.get(patientId);
        const milestones = [
          profile.totalInteractions >= 100,
          profile.sessionCount >= 10,
          Object.keys(profile.preferredTiles).length >= 20,
          profile.avgSessionDuration >= 600,
          this.hasCompletedGoals(patientId)
        ];
        
        return milestones.filter(m => m).length / milestones.length;
      }
      
      hasCompletedGoals(patientId) {
        // Check if patient has completed therapy goals
        const goals = this.getPatientGoals(patientId);
        return goals.some(g => g.completed);
      }
      
      getPatientSessions(patientId) {
        // Mock data - in production, fetch from database
        return JSON.parse(localStorage.getItem(`sessions_${patientId}`) || '[]');
      }
      
      getPatientGoals(patientId) {
        // Mock data - in production, fetch from database
        return JSON.parse(localStorage.getItem(`goals_${patientId}`) || '[]');
      }
      
      generateInsights() {
        const insights = [];
        
        // Analyze current session
        if (this.sessionData.length > 10) {
          const recentData = this.sessionData.slice(-10);
          
          // Communication velocity
          const velocity = this.calculateCommunicationVelocity(recentData);
          if (velocity > 2) {
            insights.push({
              type: 'positive',
              message: 'Great communication pace! The patient is engaged.',
              metric: 'velocity',
              value: velocity
            });
          }
          
          // Pattern detection
          const patterns = this.detectCommunicationPatterns(recentData);
          patterns.forEach(pattern => {
            insights.push({
              type: 'observation',
              message: `Pattern detected: ${pattern.name}`,
              confidence: pattern.confidence
            });
          });
        }
        
        // Store insights
        this.recommendations = insights;
        
        // Display insights if significant
        if (insights.length > 0 && Math.random() < 0.3) { // 30% chance to show
          this.displayInsight(insights[0]);
        }
      }
      
      calculateCommunicationVelocity(interactions) {
        if (interactions.length < 2) return 0;
        
        const timeSpan = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
        return (interactions.length / (timeSpan / 60000)); // Interactions per minute
      }
      
      detectCommunicationPatterns(interactions) {
        const patterns = [];
        
        // Repetition pattern
        const tiles = interactions.map(i => i.tileText).filter(Boolean);
        const repetitions = {};
        tiles.forEach(tile => {
          repetitions[tile] = (repetitions[tile] || 0) + 1;
        });
        
        Object.entries(repetitions).forEach(([tile, count]) => {
          if (count >= 3) {
            patterns.push({
              name: `Repeated use of "${tile}"`,
              type: 'repetition',
              confidence: count / tiles.length
            });
          }
        });
        
        // Sequence pattern
        for (let i = 0; i < tiles.length - 2; i++) {
          const sequence = tiles.slice(i, i + 3).join(' → ');
          const remainingTiles = tiles.slice(i + 3);
          if (remainingTiles.join(' ').includes(sequence)) {
            patterns.push({
              name: `Sequence pattern: ${sequence}`,
              type: 'sequence',
              confidence: 0.8
            });
          }
        }
        
        return patterns;
      }
      
      showPatternInsight(pattern, confidence) {
        const insight = document.createElement('div');
        insight.className = 'ai-insight pattern-insight';
        insight.style.cssText = `
          position: fixed;
          top: 100px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          max-width: 300px;
          z-index: 1000;
          animation: slideInRight 0.5s ease-out;
        `;
        
        insight.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 24px; margin-right: 12px;">🧠</span>
            <strong>AI Insight</strong>
          </div>
          <div>Communication pattern detected: <strong>${pattern}</strong></div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
            Confidence: ${Math.round(confidence * 100)}%
          </div>
        `;
        
        document.body.appendChild(insight);
        
        setTimeout(() => {
          insight.style.animation = 'slideOutRight 0.5s ease-out';
          setTimeout(() => insight.remove(), 500);
        }, 5000);
      }
      
      displayInsight(insight) {
        const container = document.createElement('div');
        container.className = 'ai-insight';
        container.style.cssText = `
          position: fixed;
          bottom: 100px;
          left: 20px;
          background: ${insight.type === 'positive' ? '#00C851' : '#2196F3'};
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          max-width: 350px;
          z-index: 1000;
          animation: slideInLeft 0.5s ease-out;
        `;
        
        container.innerHTML = `
          <div style="display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 12px;">
              ${insight.type === 'positive' ? '✨' : '💡'}
            </span>
            <div>
              <div style="font-weight: 600; margin-bottom: 4px;">AI Analytics</div>
              <div>${insight.message}</div>
            </div>
          </div>
        `;
        
        document.body.appendChild(container);
        
        setTimeout(() => {
          container.style.animation = 'slideOutLeft 0.5s ease-out';
          setTimeout(() => container.remove(), 500);
        }, 6000);
      }
      
      updateProgressDisplay(patientId, score) {
        // Update progress in UI if visible
        const progressElement = document.getElementById('patientProgress');
        if (progressElement) {
          progressElement.innerHTML = `
            <div class="progress-score" style="
              font-size: 48px;
              font-weight: bold;
              color: ${score >= 70 ? '#00C851' : score >= 40 ? '#FF9800' : '#F44336'};
              text-align: center;
              margin: 20px 0;
            ">
              ${score}%
            </div>
            <div style="text-align: center; color: #666;">
              Overall Progress Score
            </div>
          `;
        }
      }
      
      // Predictive Analytics
      async predictSessionOutcome(sessionFeatures) {
        // Features: duration, interaction_count, unique_tiles, error_rate, assistance_level
        const prediction = this.progressModel.predict(tf.tensor2d([sessionFeatures]));
        const result = await prediction.array();
        
        return {
          successProbability: result[0][0],
          recommendedActions: this.getRecommendations(sessionFeatures, result[0][0])
        };
      }
      
      getRecommendations(features, probability) {
        const recommendations = [];
        
        if (probability < 0.3) {
          recommendations.push('Consider simplifying the current activity');
          recommendations.push('Provide more visual prompts');
          recommendations.push('Reduce session complexity');
        } else if (probability > 0.7) {
          recommendations.push('Patient is ready for more complex tasks');
          recommendations.push('Introduce new vocabulary');
          recommendations.push('Extend session duration');
        }
        
        return recommendations;
      }
      
      // Anomaly Detection
      startAnomalyDetection() {
        setInterval(() => {
          this.detectAnomalies();
        }, 60000); // Every minute
      }
      
      detectAnomalies() {
        if (this.sessionData.length < 10) return;
        
        const recentData = this.sessionData.slice(-20);
        
        // Check for unusual patterns
        const anomalies = [];
        
        // Sudden stop in activity
        const lastInteraction = recentData[recentData.length - 1];
        if (Date.now() - lastInteraction.timestamp > 300000) { // 5 minutes
          anomalies.push({
            type: 'inactivity',
            severity: 'medium',
            message: 'No activity for 5 minutes'
          });
        }
        
        // Repetitive clicking
        const lastFive = recentData.slice(-5);
        if (lastFive.every(i => i.tileText === lastFive[0].tileText)) {
          anomalies.push({
            type: 'repetition',
            severity: 'low',
            message: 'Repetitive selection detected'
          });
        }
        
        // Error spike
        const errors = recentData.filter(i => i.type === 'error').length;
        if (errors > 5) {
          anomalies.push({
            type: 'errors',
            severity: 'high',
            message: 'High error rate detected'
          });
        }
        
        // Alert therapist if high severity
        anomalies.filter(a => a.severity === 'high').forEach(anomaly => {
          this.alertTherapist(anomaly);
        });
      }
      
      alertTherapist(anomaly) {
        const alert = document.createElement('div');
        alert.className = 'therapist-alert';
        alert.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #F44336;
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(244, 67, 54, 0.3);
          z-index: 10000;
          animation: shake 0.5s ease-in-out;
        `;
        
        alert.innerHTML = `
          <strong>⚠️ Alert:</strong> ${anomaly.message}
          <button onclick="this.parentElement.remove()" style="
            margin-left: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
          ">Dismiss</button>
        `;
        
        document.body.appendChild(alert);
        
        // Log for audit
        this.logAlert(anomaly);
      }
      
      logAlert(anomaly) {
        const alerts = JSON.parse(localStorage.getItem('therapist_alerts') || '[]');
        alerts.push({
          ...anomaly,
          timestamp: new Date().toISOString(),
          patientId: window.currentPatientId,
          sessionId: window.sessionId
        });
        localStorage.setItem('therapist_alerts', JSON.stringify(alerts));
      }
      
      // Export analytics data
      exportAnalytics() {
        const data = {
          sessionData: this.sessionData,
          patientProfiles: Array.from(this.patientProfiles.entries()),
          insights: this.recommendations,
          timestamp: new Date().toISOString()
        };
        
        return data;
      }
      
      // Generate comprehensive report
      generateAIReport(patientId) {
        const profile = this.patientProfiles.get(patientId);
        if (!profile) return null;
        
        const report = {
          patientId,
          generatedAt: new Date().toISOString(),
          progressScore: profile.progressScore,
          strengths: this.identifyStrengths(profile),
          challenges: this.identifyChallenges(profile),
          recommendations: this.generatePersonalizedRecommendations(profile),
          predictedOutcomes: this.predictFutureProgress(profile),
          communicationPatterns: this.analyzeCommunicationStyle(profile),
          milestones: this.identifyMilestones(profile)
        };
        
        return report;
      }
      
      identifyStrengths(profile) {
        const strengths = [];
        
        // High frequency tiles indicate preferences
        const topTiles = Object.entries(profile.preferredTiles)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        if (topTiles.length > 0) {
          strengths.push(`Strong preference for: ${topTiles.map(t => t[0]).join(', ')}`);
        }
        
        if (profile.progressScore > 70) {
          strengths.push('Excellent overall progress');
        }
        
        if (this.calculateConsistencyScore(profile.patientId) > 0.8) {
          strengths.push('Very consistent session attendance');
        }
        
        return strengths;
      }
      
      identifyChallenges(profile) {
        const challenges = [];
        
        if (profile.avgSessionDuration < 300) {
          challenges.push('Short attention span - sessions under 5 minutes');
        }
        
        if (Object.keys(profile.preferredTiles).length < 10) {
          challenges.push('Limited vocabulary usage');
        }
        
        if (this.calculateEngagementScore(profile.patientId) < 0.3) {
          challenges.push('Low engagement levels');
        }
        
        return challenges;
      }
      
      generatePersonalizedRecommendations(profile) {
        const recommendations = [];
        
        // Based on progress score
        if (profile.progressScore < 40) {
          recommendations.push('Focus on basic communication needs');
          recommendations.push('Use more visual supports');
          recommendations.push('Shorter, more frequent sessions');
        } else if (profile.progressScore < 70) {
          recommendations.push('Gradually increase session complexity');
          recommendations.push('Introduce new vocabulary weekly');
          recommendations.push('Work on sentence building');
        } else {
          recommendations.push('Challenge with abstract concepts');
          recommendations.push('Focus on social communication');
          recommendations.push('Prepare for mainstream integration');
        }
        
        return recommendations;
      }
      
      predictFutureProgress(profile) {
        // Simple linear projection based on current trend
        const currentScore = profile.progressScore;
        const weeklyImprovement = 2.5; // Average expected improvement
        
        return {
          oneMonth: Math.min(100, currentScore + weeklyImprovement * 4),
          threeMonths: Math.min(100, currentScore + weeklyImprovement * 12),
          sixMonths: Math.min(100, currentScore + weeklyImprovement * 24),
          confidence: 0.75
        };
      }
      
      analyzeCommunicationStyle(profile) {
        const topTiles = Object.entries(profile.preferredTiles)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        const categories = {
          requesting: ['WANT', 'MORE', 'PLEASE', 'HELP', 'NEED'],
          social: ['HELLO', 'THANK YOU', 'FRIEND', 'PLAY', 'SHARE'],
          expressing: ['HAPPY', 'SAD', 'ANGRY', 'TIRED', 'HURT'],
          activities: ['EAT', 'DRINK', 'BATHROOM', 'SLEEP', 'GO']
        };
        
        const style = {};
        Object.entries(categories).forEach(([category, words]) => {
          style[category] = topTiles.filter(([tile]) => 
            words.includes(tile.toUpperCase())
          ).length;
        });
        
        return style;
      }
      
      identifyMilestones(profile) {
        const milestones = [];
        
        if (profile.totalInteractions >= 100) {
          milestones.push({
            achieved: true,
            name: '100 Interactions',
            date: new Date(profile.lastUpdated).toLocaleDateString()
          });
        }
        
        if (Object.keys(profile.preferredTiles).length >= 25) {
          milestones.push({
            achieved: true,
            name: '25 Word Vocabulary',
            date: new Date(profile.lastUpdated).toLocaleDateString()
          });
        }
        
        if (profile.sessionCount >= 20) {
          milestones.push({
            achieved: true,
            name: '20 Sessions Completed',
            date: new Date(profile.lastUpdated).toLocaleDateString()
          });
        }
        
        return milestones;
      }
      
      // Update session metrics
      updateSessionMetrics() {
        const currentSession = {
          timestamp: Date.now(),
          duration: window.sessionTimer?.getElapsed() || 0,
          interactions: this.sessionData.filter(d => 
            d.timestamp > Date.now() - window.sessionTimer?.getElapsed() * 1000
          ).length,
          patientId: window.currentPatientId
        };
        
        // Predict optimal session duration
        this.predictOptimalDuration(currentSession);
        
        // Check if intervention needed
        this.checkInterventionNeeded(currentSession);
      }
      
      predictOptimalDuration(session) {
        const features = [
          session.interactions / 10,
          session.duration / 600,
          new Date().getHours() / 24, // Time of day
          new Date().getDay() / 7, // Day of week
          this.getPatientFatigue(),
          this.getEngagementLevel(),
          this.getSuccessRate(),
          this.getComplexityLevel()
        ];
        
        const prediction = this.durationModel.predict(tf.tensor2d([features]));
        prediction.array().then(result => {
          const optimalMinutes = result[0][0] * 60;
          
          if (Math.abs(optimalMinutes - session.duration / 60) > 10) {
            this.suggestDurationAdjustment(optimalMinutes, session.duration / 60);
          }
        });
      }
      
      getPatientFatigue() {
        // Estimate based on interaction frequency decline
        const recent = this.sessionData.slice(-20);
        const older = this.sessionData.slice(-40, -20);
        
        if (recent.length === 0 || older.length === 0) return 0.5;
        
        const recentRate = recent.length / ((recent[recent.length-1].timestamp - recent[0].timestamp) / 60000);
        const olderRate = older.length / ((older[older.length-1].timestamp - older[0].timestamp) / 60000);
        
        return Math.max(0, Math.min(1, 1 - (recentRate / olderRate)));
      }
      
      getEngagementLevel() {
        const recent = this.sessionData.slice(-10);
        const uniqueTiles = new Set(recent.map(d => d.tileText)).size;
        return Math.min(1, uniqueTiles / 8);
      }
      
      getSuccessRate() {
        const recent = this.sessionData.slice(-20);
        const errors = recent.filter(d => d.type === 'error').length;
        return 1 - (errors / recent.length);
      }
      
      getComplexityLevel() {
        // Measure based on current board/activity complexity
        return 0.5; // Default medium complexity
      }
      
      suggestDurationAdjustment(optimal, current) {
        const message = optimal > current 
          ? `Consider extending session to ${Math.round(optimal)} minutes for optimal learning`
          : `Consider wrapping up soon - optimal session length reached`;
        
        this.displayInsight({
          type: 'observation',
          message: message
        });
      }
      
      checkInterventionNeeded(session) {
        const interventions = [];
        
        // Low interaction rate
        if (session.interactions < session.duration / 120) {
          interventions.push('Low interaction rate - consider changing activity');
        }
        
        // High error rate
        const errors = this.sessionData.filter(d => 
          d.type === 'error' && d.timestamp > Date.now() - 300000
        ).length;
        
        if (errors > 5) {
          interventions.push('High error rate - simplify current task');
        }
        
        // Display interventions
        interventions.forEach(intervention => {
          this.displayInsight({
            type: 'warning',
            message: intervention
          });
        });
      }
    }
    
    // Initialize AI analytics
    window.aiAnalytics = new AdvancedAnalyticsAI();
    
    // Add required utilities
    Math.mean = function(arr) {
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    };
    
    Math.std = function(arr) {
      const mean = Math.mean(arr);
      const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
      return Math.sqrt(Math.mean(squareDiffs));
    };
    
    // Healthcare Production Systems