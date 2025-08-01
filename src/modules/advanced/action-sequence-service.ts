/**
 * Action Sequence Service
 * Module 48: Record and replay sequences of actions
 */

interface ActionStep {
  id: string;
  type: 'tile_select' | 'board_change' | 'speak' | 'wait' | 'gesture' | 'custom';
  target?: string;
  data?: any;
  timestamp: number;
  duration?: number;
}

interface ActionSequence {
  id: string;
  name: string;
  description?: string;
  steps: ActionStep[];
  category: string;
  icon?: string;
  color?: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  isPublic: boolean;
  tags: string[];
}

interface SequenceRecording {
  id: string;
  startTime: number;
  steps: ActionStep[];
  isRecording: boolean;
  isPaused: boolean;
}

interface PlaybackOptions {
  speed: number;
  loop: boolean;
  skipWaits: boolean;
  visualFeedback: boolean;
  audioFeedback: boolean;
}

export class ActionSequenceService {
  private static instance: ActionSequenceService;
  private sequences: Map<string, ActionSequence> = new Map();
  private currentRecording: SequenceRecording | null = null;
  private playbackQueue: ActionStep[] = [];
  private isPlaying = false;
  private playbackOptions: PlaybackOptions = {
    speed: 1,
    loop: false,
    skipWaits: false,
    visualFeedback: true,
    audioFeedback: true
  };
  private eventListeners: Map<string, Function> = new Map();

  private constructor() {
    this.initializeDefaultSequences();
  }

  static getInstance(): ActionSequenceService {
    if (!ActionSequenceService.instance) {
      ActionSequenceService.instance = new ActionSequenceService();
    }
    return ActionSequenceService.instance;
  }

  initialize(): void {
    console.log('🎬 Action Sequence Service ready - Record and replay action sequences');
    this.loadSequences();
    this.setupEventCapture();
  }

  /**
   * Initialize default sequences
   */
  private initializeDefaultSequences(): void {
    // Morning routine sequence
    this.addSequence({
      id: 'morning_routine',
      name: 'Morning Routine',
      description: 'Common morning activities sequence',
      steps: [
        { id: '1', type: 'tile_select', target: 'good_morning', timestamp: 0 },
        { id: '2', type: 'wait', duration: 1000, timestamp: 1000 },
        { id: '3', type: 'tile_select', target: 'breakfast', timestamp: 2000 },
        { id: '4', type: 'wait', duration: 1000, timestamp: 3000 },
        { id: '5', type: 'tile_select', target: 'get_dressed', timestamp: 4000 }
      ],
      category: 'daily_routines',
      icon: '🌅',
      color: '#FFD700',
      createdAt: new Date().toISOString(),
      usageCount: 0,
      isPublic: true,
      tags: ['morning', 'routine', 'daily']
    });

    // Basic needs sequence
    this.addSequence({
      id: 'basic_needs',
      name: 'Express Basic Needs',
      description: 'Quickly express basic needs',
      steps: [
        { id: '1', type: 'tile_select', target: 'i_need', timestamp: 0 },
        { id: '2', type: 'wait', duration: 500, timestamp: 500 },
        { id: '3', type: 'board_change', target: 'needs_board', timestamp: 1000 }
      ],
      category: 'communication',
      icon: '💬',
      color: '#2196F3',
      createdAt: new Date().toISOString(),
      usageCount: 0,
      isPublic: true,
      tags: ['needs', 'basic', 'quick']
    });
  }

  /**
   * Start recording a sequence
   */
  startRecording(name?: string): string {
    if (this.currentRecording?.isRecording) {
      this.stopRecording();
    }

    const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentRecording = {
      id: recordingId,
      startTime: Date.now(),
      steps: [],
      isRecording: true,
      isPaused: false
    };

    console.log('🔴 Started recording sequence');
    this.showRecordingIndicator();

    return recordingId;
  }

  /**
   * Stop recording and save sequence
   */
  stopRecording(name?: string, description?: string): ActionSequence | null {
    if (!this.currentRecording || !this.currentRecording.isRecording) {
      return null;
    }

    this.currentRecording.isRecording = false;
    this.hideRecordingIndicator();

    if (this.currentRecording.steps.length === 0) {
      console.log('⚠️ No actions recorded');
      this.currentRecording = null;
      return null;
    }

    const sequence: ActionSequence = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Sequence ${this.sequences.size + 1}`,
      description,
      steps: this.currentRecording.steps,
      category: 'custom',
      createdAt: new Date().toISOString(),
      usageCount: 0,
      isPublic: false,
      tags: []
    };

    this.addSequence(sequence);
    this.currentRecording = null;

    console.log(`⏹️ Stopped recording. Saved sequence: ${sequence.name}`);
    return sequence;
  }

  /**
   * Pause/resume recording
   */
  pauseRecording(): void {
    if (this.currentRecording && this.currentRecording.isRecording) {
      this.currentRecording.isPaused = !this.currentRecording.isPaused;
      console.log(this.currentRecording.isPaused ? '⏸️ Recording paused' : '▶️ Recording resumed');
    }
  }

  /**
   * Play a sequence
   */
  async playSequence(
    sequenceId: string,
    options?: Partial<PlaybackOptions>
  ): Promise<void> {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence || this.isPlaying) return;

    this.playbackOptions = { ...this.playbackOptions, ...options };
    this.playbackQueue = [...sequence.steps];
    this.isPlaying = true;

    console.log(`▶️ Playing sequence: ${sequence.name}`);

    // Update usage stats
    sequence.usageCount++;
    sequence.lastUsed = new Date().toISOString();

    await this.processPlaybackQueue();

    if (this.playbackOptions.loop && this.isPlaying) {
      await this.playSequence(sequenceId, options);
    }
  }

  /**
   * Stop playback
   */
  stopPlayback(): void {
    this.isPlaying = false;
    this.playbackQueue = [];
    console.log('⏹️ Playback stopped');
  }

  /**
   * Add a sequence
   */
  addSequence(sequence: ActionSequence): void {
    this.sequences.set(sequence.id, sequence);
    this.saveSequences();
  }

  /**
   * Delete a sequence
   */
  deleteSequence(sequenceId: string): boolean {
    const deleted = this.sequences.delete(sequenceId);
    if (deleted) {
      this.saveSequences();
    }
    return deleted;
  }

  /**
   * Get all sequences
   */
  getSequences(filter?: {
    category?: string;
    isPublic?: boolean;
    search?: string;
  }): ActionSequence[] {
    let sequences = Array.from(this.sequences.values());

    if (filter) {
      if (filter.category) {
        sequences = sequences.filter(s => s.category === filter.category);
      }
      if (filter.isPublic !== undefined) {
        sequences = sequences.filter(s => s.isPublic === filter.isPublic);
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        sequences = sequences.filter(s => 
          s.name.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search) ||
          s.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }
    }

    return sequences.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get sequence by ID
   */
  getSequence(sequenceId: string): ActionSequence | undefined {
    return this.sequences.get(sequenceId);
  }

  /**
   * Export sequence
   */
  exportSequence(sequenceId: string): string | null {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return null;

    return JSON.stringify(sequence, null, 2);
  }

  /**
   * Import sequence
   */
  importSequence(sequenceData: string): boolean {
    try {
      const sequence = JSON.parse(sequenceData) as ActionSequence;
      sequence.id = `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sequence.isPublic = false;
      sequence.usageCount = 0;
      
      this.addSequence(sequence);
      return true;
    } catch (error) {
      console.error('Failed to import sequence:', error);
      return false;
    }
  }

  /**
   * Get suggested sequences based on context
   */
  getSuggestedSequences(context: {
    timeOfDay?: string;
    currentBoard?: string;
    recentTiles?: string[];
  }): ActionSequence[] {
    const suggestions: ActionSequence[] = [];

    // Time-based suggestions
    if (context.timeOfDay === 'morning') {
      const morningSeq = this.sequences.get('morning_routine');
      if (morningSeq) suggestions.push(morningSeq);
    }

    // Recently used sequences
    const recentlyUsed = Array.from(this.sequences.values())
      .filter(s => s.lastUsed)
      .sort((a, b) => 
        new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime()
      )
      .slice(0, 3);

    suggestions.push(...recentlyUsed);

    return suggestions;
  }

  // Private helper methods
  private async processPlaybackQueue(): Promise<void> {
    while (this.playbackQueue.length > 0 && this.isPlaying) {
      const step = this.playbackQueue.shift()!;
      
      if (this.playbackOptions.visualFeedback) {
        this.showStepIndicator(step);
      }

      await this.executeStep(step);

      // Apply speed modifier
      const delay = step.duration ? step.duration / this.playbackOptions.speed : 0;
      if (delay > 0 && !this.playbackOptions.skipWaits) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.isPlaying = false;
  }

  private async executeStep(step: ActionStep): Promise<void> {
    switch (step.type) {
      case 'tile_select':
        if (step.target) {
          const tileManagement = (window as any).moduleSystem?.get('TileManagementService');
          tileManagement?.selectTile(step.target);
        }
        break;

      case 'board_change':
        if (step.target) {
          const boardManager = (window as any).moduleSystem?.get('BoardManager');
          boardManager?.switchBoard(step.target);
        }
        break;

      case 'speak':
        if (step.data?.text) {
          const speechService = (window as any).moduleSystem?.get('SpeechService');
          await speechService?.speak(step.data.text);
        }
        break;

      case 'wait':
        // Wait is handled in processPlaybackQueue
        break;

      case 'gesture':
        if (step.data) {
          const gestureService = (window as any).moduleSystem?.get('GestureService');
          gestureService?.performGesture(step.data);
        }
        break;

      case 'custom':
        // Emit custom event
        window.dispatchEvent(new CustomEvent('sequenceCustomStep', {
          detail: step
        }));
        break;
    }
  }

  private recordAction(type: ActionStep['type'], target?: string, data?: any): void {
    if (!this.currentRecording || !this.currentRecording.isRecording || this.currentRecording.isPaused) {
      return;
    }

    const step: ActionStep = {
      id: `step_${this.currentRecording.steps.length + 1}`,
      type,
      target,
      data,
      timestamp: Date.now() - this.currentRecording.startTime
    };

    // Calculate duration from previous step
    if (this.currentRecording.steps.length > 0) {
      const prevStep = this.currentRecording.steps[this.currentRecording.steps.length - 1];
      prevStep.duration = step.timestamp - prevStep.timestamp;
    }

    this.currentRecording.steps.push(step);
  }

  private setupEventCapture(): void {
    if (typeof window === 'undefined') return;

    // Capture tile selections
    const tileSelectHandler = (event: any) => {
      this.recordAction('tile_select', event.detail?.tileId);
    };

    // Capture board changes
    const boardChangeHandler = (event: any) => {
      this.recordAction('board_change', event.detail?.boardId);
    };

    // Capture speech
    const speechHandler = (event: any) => {
      this.recordAction('speak', undefined, { text: event.detail?.text });
    };

    window.addEventListener('tileSelected', tileSelectHandler);
    window.addEventListener('boardChanged', boardChangeHandler);
    window.addEventListener('speechStarted', speechHandler);

    this.eventListeners.set('tileSelected', tileSelectHandler);
    this.eventListeners.set('boardChanged', boardChangeHandler);
    this.eventListeners.set('speechStarted', speechHandler);
  }

  private showRecordingIndicator(): void {
    if (typeof document === 'undefined') return;

    const indicator = document.createElement('div');
    indicator.id = 'sequence-recording-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: pulse 2s infinite;
    `;
    indicator.innerHTML = `
      <span style="width: 10px; height: 10px; background: white; border-radius: 50%; animation: blink 1s infinite;"></span>
      Recording...
    `;

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
  }

  private hideRecordingIndicator(): void {
    const indicator = document.getElementById('sequence-recording-indicator');
    indicator?.remove();
  }

  private showStepIndicator(step: ActionStep): void {
    if (typeof document === 'undefined') return;

    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(33, 150, 243, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 10000;
      transition: opacity 0.3s;
    `;
    
    const stepText = step.type === 'tile_select' ? `Select: ${step.target}` :
                     step.type === 'board_change' ? `Board: ${step.target}` :
                     step.type === 'speak' ? 'Speaking...' :
                     step.type === 'wait' ? 'Waiting...' :
                     step.type;
    
    indicator.textContent = stepText;
    document.body.appendChild(indicator);

    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }, 1000);
  }

  private loadSequences(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('action_sequences');
      if (saved) {
        const sequences = JSON.parse(saved);
        sequences.forEach((seq: ActionSequence) => {
          this.sequences.set(seq.id, seq);
        });
      }
    } catch (error) {
      console.error('Failed to load sequences:', error);
    }
  }

  private saveSequences(): void {
    if (typeof window === 'undefined') return;

    try {
      const sequences = Array.from(this.sequences.values());
      localStorage.setItem('action_sequences', JSON.stringify(sequences));
    } catch (error) {
      console.error('Failed to save sequences:', error);
    }
  }
}

// Export singleton getter function
export function getActionSequenceService(): ActionSequenceService {
  return ActionSequenceService.getInstance();
}