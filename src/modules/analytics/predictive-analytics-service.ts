// Predictive Analytics Service - Module 51
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getBoardManager } from '../core/board-manager';
import { getLanguageService } from '../communication/language-service';

// TensorFlow.js fallback - optional dependency
let tf: any = null;

interface PredictionModel {
  id: string;
  name: string;
  type: 'next-word' | 'sentence-completion' | 'behavior' | 'learning-path' | 'communication-needs';
  version: string;
  accuracy: number;
  lastTrained: Date;
  model?: unknown; // tf.LayersModel when available
  vocabulary?: Map<string, number>;
  features?: string[];
}

interface WordPrediction {
  word: string;
  probability: number;
  category?: string;
  nextWords?: string[];
}

interface BehaviorPrediction {
  action: string;
  likelihood: number;
  timeframe: string;
  confidence: number;
  factors: string[];
}

interface LearningPathPrediction {
  nextModule: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  prerequisites: string[];
  successProbability: number;
}

interface CommunicationPattern {
  pattern: string;
  frequency: number;
  contexts: string[];
  timeOfDay: string[];
  triggers: string[];
}

interface UserProfile {
  id: string;
  communicationLevel: number;
  vocabularySize: number;
  avgSentenceLength: number;
  topCategories: string[];
  preferredModalities: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  progressRate: number;
}

export class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private boardManager = getBoardManager();
  private languageService = getLanguageService();
  
  private models: Map<string, PredictionModel> = new Map();
  private userProfile: UserProfile | null = null;
  private wordHistory: string[] = [];
  private contextHistory: Array<{ context: string; timestamp: number }> = [];
  private predictionCache: Map<string, unknown> = new Map();
  private isTraining: boolean = false;

  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_DATA_FOR_TRAINING = 100;

  private constructor() {
    this.initializeModels();
  }

  static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  async initialize(): Promise<void> {
    console.log('PredictiveAnalyticsService initializing...');
    
    // Try to load TensorFlow.js dynamically (browser only)
    if (typeof window !== 'undefined') {
      try {
        tf = await import('@tensorflow/tfjs');
        console.log('TensorFlow.js loaded successfully');
      } catch (error) {
        console.warn('TensorFlow.js not available, using fallback predictions:', error);
        tf = null;
      }
    } else {
      console.log('Server-side rendering - TensorFlow.js will be loaded on client side');
    }
    
    await this.loadUserProfile();
    await this.loadModels();
    await this.loadHistoricalData();
    this.startBackgroundTraining();
    console.log('PredictiveAnalyticsService initialized');
  }

  private async initializeModels(): Promise<void> {
    // Next Word Prediction Model
    this.models.set('next-word', {
      id: 'next-word',
      name: 'Next Word Predictor',
      type: 'next-word',
      version: '1.0.0',
      accuracy: 0,
      lastTrained: new Date(),
      vocabulary: new Map(),
      features: ['previous_words', 'category', 'time_of_day', 'location']
    });

    // Sentence Completion Model
    this.models.set('sentence-completion', {
      id: 'sentence-completion',
      name: 'Sentence Completion',
      type: 'sentence-completion',
      version: '1.0.0',
      accuracy: 0,
      lastTrained: new Date(),
      features: ['partial_sentence', 'context', 'user_level']
    });

    // Behavior Prediction Model
    this.models.set('behavior', {
      id: 'behavior',
      name: 'Behavior Predictor',
      type: 'behavior',
      version: '1.0.0',
      accuracy: 0,
      lastTrained: new Date(),
      features: ['time_patterns', 'usage_frequency', 'interaction_types']
    });

    // Learning Path Model
    this.models.set('learning-path', {
      id: 'learning-path',
      name: 'Learning Path Optimizer',
      type: 'learning-path',
      version: '1.0.0',
      accuracy: 0,
      lastTrained: new Date(),
      features: ['skill_level', 'progress_rate', 'engagement_metrics']
    });

    // Communication Needs Model
    this.models.set('communication-needs', {
      id: 'communication-needs',
      name: 'Communication Needs Analyzer',
      type: 'communication-needs',
      version: '1.0.0',
      accuracy: 0,
      lastTrained: new Date(),
      features: ['vocabulary_gaps', 'frequent_struggles', 'context_misses']
    });
  }

  // Word Prediction
  async predictNextWords(
    currentWords: string[],
    count: number = 5,
    options?: {
      category?: string;
      context?: string;
      userLevel?: number;
    }
  ): Promise<WordPrediction[]> {
    const cacheKey = `next-words:${currentWords.join(',')}:${JSON.stringify(options)}`;
    const cached = this.getCachedPrediction(cacheKey);
    if (cached) return cached;

    try {
      const model = this.models.get('next-word');
      if (!model?.model) {
        // Fallback to statistical prediction
        return this.statisticalWordPrediction(currentWords, count, options);
      }

      // Prepare input features
      const features = this.prepareWordPredictionFeatures(currentWords, options);
      
      // Run model prediction
      const predictions = await model.model.predict(features).array();
      
      // Convert to word predictions
      const wordPredictions = this.processWordPredictions(predictions, count);
      
      this.cachePrediction(cacheKey, wordPredictions);
      return wordPredictions;
    } catch (error) {
      console.error('Word prediction failed:', error);
      return this.statisticalWordPrediction(currentWords, count, options);
    }
  }

  private statisticalWordPrediction(
    currentWords: string[],
    count: number,
    options?: any
  ): WordPrediction[] {
    const ngrams = this.getNGrams(currentWords);
    const candidates = new Map<string, number>();

    // Analyze historical patterns
    for (let i = 0; i < this.wordHistory.length - currentWords.length; i++) {
      const match = currentWords.every((word, j) => 
        this.wordHistory[i + j]?.toLowerCase() === word.toLowerCase()
      );

      if (match && this.wordHistory[i + currentWords.length]) {
        const nextWord = this.wordHistory[i + currentWords.length];
        candidates.set(nextWord, (candidates.get(nextWord) || 0) + 1);
      }
    }

    // Add category-specific predictions
    if (options?.category) {
      const categoryWords = this.getCategoryWords(options.category);
      categoryWords.forEach(word => {
        candidates.set(word, (candidates.get(word) || 0) + 0.5);
      });
    }

    // Sort by frequency and convert to predictions
    const sorted = Array.from(candidates.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count);

    const total = sorted.reduce((sum, [_, freq]) => sum + freq, 0);

    return sorted.map(([word, freq]) => ({
      word,
      probability: freq / total,
      category: this.getWordCategory(word),
      nextWords: this.getCommonFollowers(word)
    }));
  }

  // Sentence Completion
  async completeSentence(
    partialSentence: string,
    maxLength: number = 10
  ): Promise<string> {
    const cacheKey = `complete:${partialSentence}`;
    const cached = this.getCachedPrediction(cacheKey);
    if (cached) return cached;

    try {
      const words = partialSentence.split(' ');
      const completed = [...words];

      while (completed.length < words.length + maxLength) {
        const predictions = await this.predictNextWords(
          completed.slice(-3), // Use last 3 words for context
          1,
          { context: 'sentence_completion' }
        );

        if (predictions.length === 0 || predictions[0].word === '.') {
          break;
        }

        completed.push(predictions[0].word);

        // Check for natural sentence end
        if (this.isSentenceComplete(completed.join(' '))) {
          break;
        }
      }

      const result = completed.join(' ');
      this.cachePrediction(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Sentence completion failed:', error);
      return partialSentence;
    }
  }

  // Behavior Prediction
  async predictUserBehavior(
    timeframe: 'next-hour' | 'today' | 'this-week' = 'next-hour'
  ): Promise<BehaviorPrediction[]> {
    const predictions: BehaviorPrediction[] = [];

    // Analyze usage patterns
    const patterns = this.analyzeUsagePatterns();
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay();

    // Predict based on time patterns
    patterns.timePatterns.forEach(pattern => {
      if (this.matchesTimeframe(pattern, timeframe, currentTime)) {
        predictions.push({
          action: pattern.action,
          likelihood: pattern.probability,
          timeframe,
          confidence: pattern.confidence,
          factors: pattern.factors
        });
      }
    });

    // Predict based on sequence patterns
    const recentActions = this.getRecentActions();
    const sequencePredictions = this.predictFromSequence(recentActions);
    predictions.push(...sequencePredictions);

    // Sort by likelihood
    return predictions
      .sort((a, b) => b.likelihood - a.likelihood)
      .slice(0, 5);
  }

  // Learning Path Prediction
  async predictLearningPath(
    currentSkillLevel: number,
    completedModules: string[]
  ): Promise<LearningPathPrediction[]> {
    const predictions: LearningPathPrediction[] = [];
    
    // Analyze user's learning patterns
    const learningProfile = this.analyzeLearningProfile(completedModules);
    
    // Get available modules
    const availableModules = this.getAvailableModules(completedModules);
    
    // Predict success probability for each module
    for (const mod of availableModules) {
      const prediction = await this.predictModuleSuccess(
        mod,
        currentSkillLevel,
        learningProfile
      );
      
      predictions.push({
        nextModule: mod.id,
        difficulty: this.calculateDifficulty(mod, currentSkillLevel),
        estimatedTime: this.estimateCompletionTime(module, learningProfile),
        prerequisites: this.getPrerequisites(module, completedModules),
        successProbability: prediction.probability
      });
    }
    
    // Sort by optimal learning order
    return this.optimizeLearningOrder(predictions, learningProfile);
  }

  // Communication Needs Analysis
  async analyzeCommunicationNeeds(): Promise<{
    gaps: string[];
    recommendations: string[];
    predictedVocabulary: string[];
    contexts: string[];
  }> {
    const analysis = {
      gaps: [] as string[],
      recommendations: [] as string[],
      predictedVocabulary: [] as string[],
      contexts: [] as string[]
    };

    // Analyze vocabulary gaps
    const vocabularyAnalysis = this.analyzeVocabularyGaps();
    analysis.gaps = vocabularyAnalysis.gaps;

    // Predict needed vocabulary
    const contexts = this.identifyCommonContexts();
    for (const context of contexts) {
      const neededWords = await this.predictContextVocabulary(context);
      analysis.predictedVocabulary.push(...neededWords);
    }

    // Generate recommendations
    analysis.recommendations = this.generateVocabularyRecommendations(
      vocabularyAnalysis,
      contexts
    );

    // Identify missing contexts
    analysis.contexts = this.identifyMissingContexts();

    return analysis;
  }

  // Pattern Recognition
  async identifyCommunicationPatterns(): Promise<CommunicationPattern[]> {
    const patterns: CommunicationPattern[] = [];
    
    // Analyze phrase patterns
    const phrases = this.extractPhrases();
    const phrasePatterns = this.analyzePhrasePatterns(phrases);
    
    // Analyze temporal patterns
    const temporalPatterns = this.analyzeTemporalPatterns();
    
    // Analyze contextual patterns
    const contextualPatterns = this.analyzeContextualPatterns();
    
    // Combine patterns
    const combinedPatterns = this.combinePatterns(
      phrasePatterns,
      temporalPatterns,
      contextualPatterns
    );
    
    return combinedPatterns;
  }

  // Anomaly Detection
  async detectAnomalies(
    threshold: number = 2.5 // standard deviations
  ): Promise<Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
    recommendation: string;
  }>> {
    const anomalies = [];
    
    // Check usage anomalies
    const usageAnomalies = this.detectUsageAnomalies(threshold);
    anomalies.push(...usageAnomalies);
    
    // Check vocabulary anomalies
    const vocabularyAnomalies = this.detectVocabularyAnomalies(threshold);
    anomalies.push(...vocabularyAnomalies);
    
    // Check pattern anomalies
    const patternAnomalies = this.detectPatternAnomalies(threshold);
    anomalies.push(...patternAnomalies);
    
    return anomalies;
  }

  // Model Training
  async trainModels(
    modelType?: PredictionModel['type']
  ): Promise<void> {
    if (this.isTraining) {
      console.log('Training already in progress');
      return;
    }

    this.isTraining = true;

    try {
      const modelsToTrain = modelType 
        ? [this.models.get(modelType)].filter(Boolean)
        : Array.from(this.models.values());

      for (const model of modelsToTrain) {
        if (!model) continue;
        
        const trainingData = await this.prepareTrainingData(model.type);
        
        if (trainingData.length < this.MIN_DATA_FOR_TRAINING) {
          console.log(`Insufficient data for ${model.type} model`);
          continue;
        }

        await this.trainModel(model, trainingData);
      }
    } finally {
      this.isTraining = false;
    }
  }

  private async trainModel(
    model: PredictionModel,
    trainingData: any[]
  ): Promise<void> {
    console.log(`Training ${model.type} model...`);

    try {
      // Create TensorFlow model
      const tfModel = this.createTensorFlowModel(model.type);
      
      // Prepare data tensors
      const { inputs, outputs } = this.prepareTensors(trainingData, model.type);
      
      // Train model
      await tfModel.fit(inputs, outputs, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
            }
          }
        }
      });
      
      // Update model
      model.model = tfModel;
      model.lastTrained = new Date();
      model.accuracy = await this.evaluateModel(tfModel, trainingData);
      
      // Save model
      await this.saveModel(model);
      
      console.log(`${model.type} model trained with ${model.accuracy}% accuracy`);
    } catch (error) {
      console.error(`Failed to train ${model.type} model:`, error);
    }
  }

  private createTensorFlowModel(type: PredictionModel['type']): tf.LayersModel {
    const model = tf.sequential();

    switch (type) {
      case 'next-word':
        model.add(tf.layers.embedding({
          inputDim: 10000, // vocabulary size
          outputDim: 128,
          inputLength: 5 // context window
        }));
        model.add(tf.layers.lstm({ units: 256, returnSequences: true }));
        model.add(tf.layers.dropout({ rate: 0.3 }));
        model.add(tf.layers.lstm({ units: 128 }));
        model.add(tf.layers.dense({ units: 10000, activation: 'softmax' }));
        break;

      case 'sentence-completion':
        model.add(tf.layers.lstm({
          units: 128,
          inputShape: [null, 300] // variable length, 300-dim embeddings
        }));
        model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 10000, activation: 'softmax' }));
        break;

      case 'behavior':
        model.add(tf.layers.dense({
          units: 64,
          activation: 'relu',
          inputShape: [20] // behavior features
        }));
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 10, activation: 'softmax' })); // action classes
        break;

      case 'learning-path':
        model.add(tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [30] // learning features
        }));
        model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // success probability
        break;

      case 'communication-needs':
        model.add(tf.layers.dense({
          units: 256,
          activation: 'relu',
          inputShape: [50] // communication features
        }));
        model.add(tf.layers.dropout({ rate: 0.3 }));
        model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 100, activation: 'sigmoid' })); // multi-label
        break;
    }

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: type === 'learning-path' ? 'binaryCrossentropy' : 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  // Helper Methods
  private async loadUserProfile(): Promise<void> {
    const saved = this.dataService.getData('user_profile');
    if (saved) {
      this.userProfile = saved;
    } else {
      this.userProfile = await this.createUserProfile();
    }
  }

  private async createUserProfile(): Promise<UserProfile> {
    const stats = this.dataService.getData('communication_stats') || {};
    const vocabulary = this.dataService.getData('vocabulary_history') || [];
    
    return {
      id: 'user-1',
      communicationLevel: this.calculateCommunicationLevel(stats),
      vocabularySize: new Set(vocabulary).size,
      avgSentenceLength: stats.avgSentenceLength || 3,
      topCategories: this.getTopCategories(stats),
      preferredModalities: this.getPreferredModalities(stats),
      learningStyle: this.detectLearningStyle(stats),
      progressRate: this.calculateProgressRate(stats)
    };
  }

  private async loadModels(): Promise<void> {
    for (const [id, model] of this.models) {
      try {
        const savedModel = await this.loadSavedModel(id);
        if (savedModel) {
          model.model = savedModel;
          const metadata = this.dataService.getData(`model_metadata_${id}`);
          if (metadata) {
            model.accuracy = metadata.accuracy;
            model.lastTrained = new Date(metadata.lastTrained);
          }
        }
      } catch (error) {
        console.log(`Failed to load ${id} model:`, error);
      }
    }
  }

  private async loadSavedModel(modelId: string): Promise<tf.LayersModel | null> {
    try {
      // In production, load from IndexedDB or server
      const modelUrl = `/models/${modelId}/model.json`;
      return await tf.loadLayersModel(modelUrl);
    } catch (error) {
      return null;
    }
  }

  private async saveModel(model: PredictionModel): Promise<void> {
    if (!model.model) return;

    try {
      // Save to IndexedDB
      await model.model.save(`indexeddb://${model.id}`);
      
      // Save metadata
      this.dataService.setData(`model_metadata_${model.id}`, {
        accuracy: model.accuracy,
        lastTrained: model.lastTrained,
        version: model.version
      });
    } catch (error) {
      console.error(`Failed to save ${model.id} model:`, error);
    }
  }

  private async loadHistoricalData(): Promise<void> {
    const history = this.dataService.getData('word_history') || [];
    this.wordHistory = history.slice(-this.MAX_HISTORY_SIZE);
    
    const contexts = this.dataService.getData('context_history') || [];
    this.contextHistory = contexts.slice(-this.MAX_HISTORY_SIZE);
  }

  private startBackgroundTraining(): void {
    // Train models periodically
    setInterval(() => {
      if (!this.isTraining && this.hasNewData()) {
        this.trainModels();
      }
    }, 60 * 60 * 1000); // Every hour
  }

  private hasNewData(): boolean {
    const lastTraining = Math.min(
      ...Array.from(this.models.values())
        .map(m => m.lastTrained.getTime())
    );
    
    const newDataCount = this.wordHistory.filter(
      (_, i) => this.contextHistory[i]?.timestamp > lastTraining
    ).length;
    
    return newDataCount > this.MIN_DATA_FOR_TRAINING;
  }

  private prepareWordPredictionFeatures(
    words: string[],
    options?: any
  ): tf.Tensor {
    // Convert words to indices
    const indices = words.map(word => 
      this.models.get('next-word')?.vocabulary?.get(word.toLowerCase()) || 0
    );
    
    // Pad to fixed length
    while (indices.length < 5) {
      indices.unshift(0);
    }
    
    // Add additional features
    const features = [
      ...indices.slice(-5),
      options?.category ? this.getCategoryIndex(options.category) : 0,
      new Date().getHours() / 24, // normalized time
      options?.userLevel || 0.5
    ];
    
    return tf.tensor2d([features]);
  }

  private processWordPredictions(
    predictions: any,
    count: number
  ): WordPrediction[] {
    const probs = predictions[0];
    const topIndices = tf.topk(probs, count);
    
    const indices = Array.from(topIndices.indices.dataSync());
    const probabilities = Array.from(topIndices.values.dataSync());
    
    const vocabulary = Array.from(
      this.models.get('next-word')?.vocabulary?.entries() || []
    );
    const indexToWord = new Map(
      vocabulary.map(([word, idx]) => [idx, word])
    );
    
    return indices.map((idx, i) => ({
      word: indexToWord.get(idx) || 'unknown',
      probability: probabilities[i],
      category: this.getWordCategory(indexToWord.get(idx) || ''),
      nextWords: []
    }));
  }

  private getNGrams(words: string[], n: number = 3): string[][] {
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n));
    }
    return ngrams;
  }

  private getCategoryWords(category: string): string[] {
    const tiles = this.boardManager.getTilesByCategory(category);
    return tiles.map(tile => tile.label);
  }

  private getWordCategory(word: string): string | undefined {
    const tiles = this.boardManager.getAllTiles();
    const tile = tiles.find(t => t.label.toLowerCase() === word.toLowerCase());
    return tile?.category;
  }

  private getCommonFollowers(word: string): string[] {
    const followers = new Map<string, number>();
    
    for (let i = 0; i < this.wordHistory.length - 1; i++) {
      if (this.wordHistory[i].toLowerCase() === word.toLowerCase()) {
        const next = this.wordHistory[i + 1];
        followers.set(next, (followers.get(next) || 0) + 1);
      }
    }
    
    return Array.from(followers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  private isSentenceComplete(sentence: string): boolean {
    // Check for sentence endings
    if (sentence.match(/[.!?]$/)) return true;
    
    // Check for common sentence structures
    const words = sentence.split(' ');
    if (words.length > 10) return true;
    
    // Check for complete thought patterns
    const hasSubject = words.some(w => this.isSubject(w));
    const hasVerb = words.some(w => this.isVerb(w));
    const hasObject = words.length > 2;
    
    return hasSubject && hasVerb && hasObject;
  }

  private isSubject(word: string): boolean {
    const subjects = ['i', 'you', 'he', 'she', 'it', 'we', 'they'];
    return subjects.includes(word.toLowerCase());
  }

  private isVerb(word: string): boolean {
    const verbs = ['am', 'is', 'are', 'was', 'were', 'want', 'need', 'like', 'have', 'go'];
    return verbs.includes(word.toLowerCase());
  }

  private analyzeUsagePatterns(): any {
    const patterns = {
      timePatterns: [] as any[],
      sequencePatterns: [] as any[],
      contextPatterns: [] as any[]
    };
    
    // Analyze by time of day
    const hourlyUsage = new Array(24).fill(0);
    this.contextHistory.forEach(ctx => {
      const hour = new Date(ctx.timestamp).getHours();
      hourlyUsage[hour]++;
    });
    
    // Find peak usage times
    const avgUsage = hourlyUsage.reduce((a, b) => a + b) / 24;
    hourlyUsage.forEach((usage, hour) => {
      if (usage > avgUsage * 1.5) {
        patterns.timePatterns.push({
          action: 'high_usage',
          hour,
          probability: usage / this.contextHistory.length,
          confidence: Math.min(usage / 10, 1),
          factors: ['routine', 'schedule']
        });
      }
    });
    
    return patterns;
  }

  private matchesTimeframe(
    pattern: any,
    timeframe: string,
    currentTime: Date
  ): boolean {
    const hour = currentTime.getHours();
    
    switch (timeframe) {
      case 'next-hour':
        return pattern.hour === (hour + 1) % 24;
      case 'today':
        return pattern.hour > hour;
      case 'this-week':
        return true;
      default:
        return false;
    }
  }

  private getRecentActions(): string[] {
    return this.contextHistory
      .slice(-10)
      .map(ctx => ctx.context);
  }

  private predictFromSequence(actions: string[]): BehaviorPrediction[] {
    const predictions: BehaviorPrediction[] = [];
    
    // Look for patterns in historical data
    const sequenceMap = new Map<string, number>();
    
    for (let i = 0; i < this.contextHistory.length - actions.length; i++) {
      const match = actions.every((action, j) => 
        this.contextHistory[i + j]?.context === action
      );
      
      if (match && this.contextHistory[i + actions.length]) {
        const next = this.contextHistory[i + actions.length].context;
        sequenceMap.set(next, (sequenceMap.get(next) || 0) + 1);
      }
    }
    
    const total = Array.from(sequenceMap.values()).reduce((a, b) => a + b, 0);
    
    sequenceMap.forEach((count, action) => {
      predictions.push({
        action,
        likelihood: count / total,
        timeframe: 'next-hour',
        confidence: Math.min(count / 5, 1),
        factors: ['sequence_pattern']
      });
    });
    
    return predictions;
  }

  private analyzeLearningProfile(completedModules: string[]): any {
    const profile = {
      avgCompletionTime: 0,
      preferredDifficulty: 'medium',
      bestTimeOfDay: 'morning',
      engagementLevel: 0.7
    };
    
    // Analyze completion patterns
    const moduleStats = this.dataService.getData('module_stats') || {};
    
    let totalTime = 0;
    let count = 0;
    
    completedModules.forEach(moduleId => {
      if (moduleStats[moduleId]) {
        totalTime += moduleStats[moduleId].completionTime;
        count++;
      }
    });
    
    profile.avgCompletionTime = count > 0 ? totalTime / count : 30;
    
    return profile;
  }

  private getAvailableModules(completedModules: string[]): any[] {
    // Get all modules and filter out completed ones
    const allModules = [
      { id: 'module-26', name: 'Collaboration Basics', difficulty: 1 },
      { id: 'module-27', name: 'Multi-User Sessions', difficulty: 2 },
      { id: 'module-28', name: 'Advanced Communication', difficulty: 3 }
    ];
    
    return allModules.filter(m => !completedModules.includes(m.id));
  }

  private async predictModuleSuccess(
    module: any,
    skillLevel: number,
    learningProfile: any
  ): Promise<{ probability: number }> {
    const difficultyGap = Math.abs(module.difficulty - skillLevel);
    const baseProb = 1 / (1 + Math.exp(difficultyGap - 2));
    
    // Adjust based on learning profile
    const adjustment = learningProfile.engagementLevel * 0.2;
    
    return {
      probability: Math.min(Math.max(baseProb + adjustment, 0), 1)
    };
  }

  private calculateDifficulty(
    module: any,
    skillLevel: number
  ): 'easy' | 'medium' | 'hard' {
    const diff = module.difficulty - skillLevel;
    if (diff < -0.5) return 'easy';
    if (diff > 0.5) return 'hard';
    return 'medium';
  }

  private estimateCompletionTime(module: any, profile: any): number {
    const baseTime = module.difficulty * 15; // 15 min per difficulty level
    return Math.round(baseTime * (2 - profile.engagementLevel));
  }

  private getPrerequisites(module: any, completed: string[]): string[] {
    const prereqs = {
      'module-27': ['module-26'],
      'module-28': ['module-26', 'module-27']
    };
    
    return (prereqs[module.id as keyof typeof prereqs] || [])
      .filter(p => !completed.includes(p));
  }

  private optimizeLearningOrder(
    predictions: LearningPathPrediction[],
    profile: any
  ): LearningPathPrediction[] {
    // Sort by a combination of success probability and difficulty
    return predictions.sort((a, b) => {
      // Prioritize modules with no prerequisites
      if (a.prerequisites.length !== b.prerequisites.length) {
        return a.prerequisites.length - b.prerequisites.length;
      }
      
      // Then by optimal difficulty
      const aDiffScore = a.difficulty === 'medium' ? 1 : 0.5;
      const bDiffScore = b.difficulty === 'medium' ? 1 : 0.5;
      
      // Combined score
      const aScore = a.successProbability * aDiffScore;
      const bScore = b.successProbability * bDiffScore;
      
      return bScore - aScore;
    });
  }

  private analyzeVocabularyGaps(): any {
    const usedWords = new Set(this.wordHistory);
    const availableWords = new Set(
      this.boardManager.getAllTiles().map(t => t.label.toLowerCase())
    );
    
    const gaps = Array.from(availableWords)
      .filter(word => !usedWords.has(word));
    
    // Categorize gaps
    const gapsByCategory = new Map<string, string[]>();
    gaps.forEach(word => {
      const category = this.getWordCategory(word) || 'uncategorized';
      if (!gapsByCategory.has(category)) {
        gapsByCategory.set(category, []);
      }
      gapsByCategory.get(category)!.push(word);
    });
    
    return {
      gaps,
      byCategory: gapsByCategory,
      totalGaps: gaps.length,
      coverageRatio: usedWords.size / availableWords.size
    };
  }

  private identifyCommonContexts(): string[] {
    const contextCounts = new Map<string, number>();
    
    this.contextHistory.forEach(ctx => {
      contextCounts.set(ctx.context, (contextCounts.get(ctx.context) || 0) + 1);
    });
    
    return Array.from(contextCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([context]) => context);
  }

  private async predictContextVocabulary(context: string): Promise<string[]> {
    // Get words commonly used in this context
    const contextWords = new Map<string, number>();
    
    this.contextHistory.forEach((ctx, i) => {
      if (ctx.context === context && this.wordHistory[i]) {
        const word = this.wordHistory[i];
        contextWords.set(word, (contextWords.get(word) || 0) + 1);
      }
    });
    
    return Array.from(contextWords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  private generateVocabularyRecommendations(
    analysis: any,
    contexts: string[]
  ): string[] {
    const recommendations = [];
    
    // Recommend high-frequency gaps
    const topGaps = analysis.gaps
      .filter((word: string) => this.getWordFrequency(word) > 0.001)
      .slice(0, 10);
    
    if (topGaps.length > 0) {
      recommendations.push(`Learn these common words: ${topGaps.join(', ')}`);
    }
    
    // Recommend category expansions
    analysis.byCategory.forEach((words: string[], category: string) => {
      if (words.length > 5) {
        recommendations.push(`Expand vocabulary in ${category} category`);
      }
    });
    
    // Context-based recommendations
    contexts.forEach(context => {
      recommendations.push(`Practice vocabulary for ${context} situations`);
    });
    
    return recommendations;
  }

  private getWordFrequency(word: string): number {
    // In a real implementation, use corpus frequency data
    const commonWords = ['the', 'a', 'is', 'are', 'want', 'need', 'help', 'please'];
    return commonWords.includes(word.toLowerCase()) ? 0.01 : 0.0001;
  }

  private identifyMissingContexts(): string[] {
    const coveredContexts = new Set(this.contextHistory.map(c => c.context));
    const commonContexts = [
      'greeting', 'request', 'response', 'question',
      'emotion', 'need', 'social', 'emergency'
    ];
    
    return commonContexts.filter(ctx => !coveredContexts.has(ctx));
  }

  private extractPhrases(): string[][] {
    const phrases = [];
    const minPhraseLength = 2;
    const maxPhraseLength = 5;
    
    for (let len = minPhraseLength; len <= maxPhraseLength; len++) {
      for (let i = 0; i <= this.wordHistory.length - len; i++) {
        phrases.push(this.wordHistory.slice(i, i + len));
      }
    }
    
    return phrases;
  }

  private analyzePhrasePatterns(phrases: string[][]): any[] {
    const phraseCount = new Map<string, number>();
    
    phrases.forEach(phrase => {
      const key = phrase.join(' ');
      phraseCount.set(key, (phraseCount.get(key) || 0) + 1);
    });
    
    return Array.from(phraseCount.entries())
      .filter(([_, count]) => count > 2)
      .map(([phrase, count]) => ({
        pattern: phrase,
        frequency: count,
        contexts: this.getPhraseContexts(phrase),
        timeOfDay: this.getPhraseTimeDistribution(phrase),
        triggers: []
      }));
  }

  private analyzeTemporalPatterns(): any[] {
    const patterns = [];
    const hourlyPatterns = new Map<number, Map<string, number>>();
    
    this.contextHistory.forEach((ctx, i) => {
      const hour = new Date(ctx.timestamp).getHours();
      if (!hourlyPatterns.has(hour)) {
        hourlyPatterns.set(hour, new Map());
      }
      
      const word = this.wordHistory[i];
      if (word) {
        const hourMap = hourlyPatterns.get(hour)!;
        hourMap.set(word, (hourMap.get(word) || 0) + 1);
      }
    });
    
    return patterns;
  }

  private analyzeContextualPatterns(): any[] {
    const patterns = [];
    const contextPatterns = new Map<string, Map<string, number>>();
    
    this.contextHistory.forEach((ctx, i) => {
      if (!contextPatterns.has(ctx.context)) {
        contextPatterns.set(ctx.context, new Map());
      }
      
      const word = this.wordHistory[i];
      if (word) {
        const ctxMap = contextPatterns.get(ctx.context)!;
        ctxMap.set(word, (ctxMap.get(word) || 0) + 1);
      }
    });
    
    return patterns;
  }

  private combinePatterns(...patternSets: any[][]): CommunicationPattern[] {
    const combined = new Map<string, CommunicationPattern>();
    
    patternSets.flat().forEach(pattern => {
      const key = pattern.pattern || pattern.phrase || '';
      if (combined.has(key)) {
        const existing = combined.get(key)!;
        existing.frequency += pattern.frequency || 0;
        existing.contexts.push(...(pattern.contexts || []));
        existing.timeOfDay.push(...(pattern.timeOfDay || []));
      } else {
        combined.set(key, {
          pattern: key,
          frequency: pattern.frequency || 0,
          contexts: pattern.contexts || [],
          timeOfDay: pattern.timeOfDay || [],
          triggers: pattern.triggers || []
        });
      }
    });
    
    return Array.from(combined.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  private getPhraseContexts(phrase: string): string[] {
    const contexts = new Set<string>();
    const phraseWords = phrase.split(' ');
    
    for (let i = 0; i <= this.wordHistory.length - phraseWords.length; i++) {
      const match = phraseWords.every((word, j) => 
        this.wordHistory[i + j] === word
      );
      
      if (match && this.contextHistory[i]) {
        contexts.add(this.contextHistory[i].context);
      }
    }
    
    return Array.from(contexts);
  }

  private getPhraseTimeDistribution(phrase: string): string[] {
    const times = [];
    const phraseWords = phrase.split(' ');
    
    for (let i = 0; i <= this.wordHistory.length - phraseWords.length; i++) {
      const match = phraseWords.every((word, j) => 
        this.wordHistory[i + j] === word
      );
      
      if (match && this.contextHistory[i]) {
        const hour = new Date(this.contextHistory[i].timestamp).getHours();
        times.push(this.getTimeOfDayLabel(hour));
      }
    }
    
    return Array.from(new Set(times));
  }

  private getTimeOfDayLabel(hour: number): string {
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private detectUsageAnomalies(threshold: number): any[] {
    const anomalies = [];
    const hourlyUsage = new Array(24).fill(0);
    
    this.contextHistory.forEach(ctx => {
      const hour = new Date(ctx.timestamp).getHours();
      hourlyUsage[hour]++;
    });
    
    const mean = hourlyUsage.reduce((a, b) => a + b) / 24;
    const variance = hourlyUsage.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / 24;
    const stdDev = Math.sqrt(variance);
    
    hourlyUsage.forEach((usage, hour) => {
      const zScore = Math.abs((usage - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          type: 'usage_anomaly',
          description: `Unusual ${usage > mean ? 'high' : 'low'} usage at ${hour}:00`,
          severity: zScore > threshold * 1.5 ? 'high' : 'medium',
          timestamp: new Date(),
          recommendation: usage > mean 
            ? 'Consider scheduling regular breaks'
            : 'Encourage consistent practice'
        });
      }
    });
    
    return anomalies;
  }

  private detectVocabularyAnomalies(threshold: number): any[] {
    const anomalies = [];
    
    // Check for sudden vocabulary changes
    const recentWords = new Set(this.wordHistory.slice(-100));
    const historicalWords = new Set(this.wordHistory.slice(-1000, -100));
    
    const newWords = Array.from(recentWords).filter(w => !historicalWords.has(w));
    const missingWords = Array.from(historicalWords).filter(w => !recentWords.has(w));
    
    if (newWords.length > historicalWords.size * 0.2) {
      anomalies.push({
        type: 'vocabulary_expansion',
        description: `Sudden vocabulary expansion: ${newWords.length} new words`,
        severity: 'low',
        timestamp: new Date(),
        recommendation: 'Great progress! Consider reinforcing new vocabulary'
      });
    }
    
    if (missingWords.length > historicalWords.size * 0.5) {
      anomalies.push({
        type: 'vocabulary_regression',
        description: `Vocabulary usage reduction detected`,
        severity: 'medium',
        timestamp: new Date(),
        recommendation: 'Review and practice previously learned words'
      });
    }
    
    return anomalies;
  }

  private detectPatternAnomalies(threshold: number): any[] {
    const anomalies = [];
    
    // Check for broken communication patterns
    const recentPatterns = this.identifyCommunicationPatterns();
    const expectedPatterns = this.dataService.getData('expected_patterns') || [];
    
    expectedPatterns.forEach((expected: any) => {
      const found = recentPatterns.find(p => p.pattern === expected.pattern);
      if (!found || found.frequency < expected.frequency * 0.3) {
        anomalies.push({
          type: 'pattern_disruption',
          description: `Communication pattern "${expected.pattern}" disrupted`,
          severity: 'medium',
          timestamp: new Date(),
          recommendation: 'Practice familiar phrases to maintain consistency'
        });
      }
    });
    
    return anomalies;
  }

  private getCachedPrediction(key: string): any {
    const cached = this.predictionCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.predictionCache.delete(key);
    return null;
  }

  private cachePrediction(key: string, data: any): void {
    this.predictionCache.set(key, {
      data,
      expires: Date.now() + this.CACHE_DURATION
    });
  }

  private getCategoryIndex(category: string): number {
    const categories = ['general', 'food', 'emotions', 'activities', 'places'];
    return categories.indexOf(category) + 1;
  }

  private prepareTensors(data: any[], modelType: string): any {
    // Simplified tensor preparation
    const inputs = tf.tensor2d(data.map(d => d.features));
    const outputs = tf.tensor2d(data.map(d => d.label));
    return { inputs, outputs };
  }

  private async evaluateModel(model: tf.LayersModel, testData: any[]): Promise<number> {
    // Simplified evaluation
    const { inputs, outputs } = this.prepareTensors(testData, 'test');
    const result = await model.evaluate(inputs, outputs) as tf.Scalar;
    return result.dataSync()[0] * 100;
  }

  private prepareTrainingData(modelType: string): any[] {
    // Prepare data based on model type
    switch (modelType) {
      case 'next-word':
        return this.prepareWordPredictionData();
      case 'behavior':
        return this.prepareBehaviorData();
      default:
        return [];
    }
  }

  private prepareWordPredictionData(): any[] {
    const data = [];
    
    for (let i = 5; i < this.wordHistory.length; i++) {
      data.push({
        features: this.wordHistory.slice(i - 5, i),
        label: this.wordHistory[i]
      });
    }
    
    return data;
  }

  private prepareBehaviorData(): any[] {
    const data = [];
    
    this.contextHistory.forEach((ctx, i) => {
      if (i > 0) {
        data.push({
          features: [
            new Date(ctx.timestamp).getHours(),
            new Date(ctx.timestamp).getDay(),
            // Add more features
          ],
          label: ctx.context
        });
      }
    });
    
    return data;
  }

  private calculateCommunicationLevel(stats: any): number {
    const factors = [
      stats.vocabularySize / 1000,
      stats.avgSentenceLength / 10,
      stats.dailyUsage / 100,
      stats.accuracy || 0.5
    ];
    
    return factors.reduce((a, b) => a + b) / factors.length;
  }

  private getTopCategories(stats: any): string[] {
    return stats.topCategories || ['general', 'needs', 'emotions'];
  }

  private getPreferredModalities(stats: any): string[] {
    return stats.modalities || ['visual', 'text'];
  }

  private detectLearningStyle(stats: any): UserProfile['learningStyle'] {
    // Simplified detection
    if (stats.visualInteractions > stats.audioInteractions) {
      return 'visual';
    }
    return 'mixed';
  }

  private calculateProgressRate(stats: any): number {
    return stats.weeklyGrowth || 0.1;
  }

  // Public API
  async getPredictions(type: 'next-word' | 'behavior' | 'learning'): Promise<any> {
    switch (type) {
      case 'next-word':
        const recentWords = this.wordHistory.slice(-3);
        return this.predictNextWords(recentWords, 5);
      
      case 'behavior':
        return this.predictUserBehavior('next-hour');
      
      case 'learning':
        const completed = this.dataService.getData('completed_modules') || [];
        const level = this.userProfile?.communicationLevel || 0.5;
        return this.predictLearningPath(level, completed);
    }
  }

  recordWord(word: string, context?: string): void {
    this.wordHistory.push(word);
    if (this.wordHistory.length > this.MAX_HISTORY_SIZE) {
      this.wordHistory.shift();
    }
    
    if (context) {
      this.contextHistory.push({
        context,
        timestamp: Date.now()
      });
      
      if (this.contextHistory.length > this.MAX_HISTORY_SIZE) {
        this.contextHistory.shift();
      }
    }
    
    // Update data service
    this.dataService.setData('word_history', this.wordHistory);
    this.dataService.setData('context_history', this.contextHistory);
  }

  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  getModelStatus(): Array<{
    id: string;
    name: string;
    accuracy: number;
    lastTrained: Date;
    isReady: boolean;
  }> {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      accuracy: model.accuracy,
      lastTrained: model.lastTrained,
      isReady: !!model.model
    }));
  }

  async exportAnalytics(): Promise<any> {
    return {
      userProfile: this.userProfile,
      patterns: await this.identifyCommunicationPatterns(),
      predictions: {
        nextWords: await this.predictNextWords(this.wordHistory.slice(-3)),
        behavior: await this.predictUserBehavior(),
        learningPath: await this.predictLearningPath(
          this.userProfile?.communicationLevel || 0.5,
          []
        )
      },
      anomalies: await this.detectAnomalies(),
      communicationNeeds: await this.analyzeCommunicationNeeds()
    };
  }
}

export function getPredictiveAnalyticsService(): PredictiveAnalyticsService {
  return PredictiveAnalyticsService.getInstance();
}