/**
 * Session Recording Service
 * Module 28: Record therapy sessions for review and documentation
 */

interface RecordingConfig {
  includeVideo: boolean;
  includeAudio: boolean;
  includeScreen: boolean;
  includeBoardChanges: boolean;
  includeChat: boolean;
  quality: 'low' | 'medium' | 'high';
  format: 'webm' | 'mp4';
}

interface RecordingSession {
  id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  config: RecordingConfig;
  status: 'recording' | 'stopped' | 'processing' | 'completed' | 'failed';
  fileSize: number;
  filePath?: string;
  metadata: {
    participants: string[];
    therapist: string;
    patient?: string;
    sessionType: string;
    boardsUsed: string[];
    totalInteractions: number;
  };
}

interface RecordingChunk {
  timestamp: number;
  type: 'video' | 'audio' | 'screen' | 'board' | 'chat';
  data: any;
  size: number;
}

interface BoardAction {
  timestamp: number;
  userId: string;
  action: 'tile_click' | 'board_change' | 'sentence_add' | 'sentence_clear';
  data: any;
}

export class SessionRecordingService {
  private static instance: SessionRecordingService;
  private currentRecording: RecordingSession | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private screenRecorder: MediaRecorder | null = null;
  private recordingChunks: RecordingChunk[] = [];
  private boardActions: BoardAction[] = [];
  private isRecording = false;
  private recordingStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  private defaultConfig: RecordingConfig = {
    includeVideo: true,
    includeAudio: true,
    includeScreen: true,
    includeBoardChanges: true,
    includeChat: true,
    quality: 'medium',
    format: 'webm'
  };

  private constructor() {
    this.setupBoardTracking();
  }

  static getInstance(): SessionRecordingService {
    if (!SessionRecordingService.instance) {
      SessionRecordingService.instance = new SessionRecordingService();
    }
    return SessionRecordingService.instance;
  }

  initialize(): void {
    console.log('🎥 Session Recording Service initialized');
    this.checkRecordingCapabilities();
  }

  /**
   * Check if recording is supported
   */
  private checkRecordingCapabilities(): void {
    if (typeof window === 'undefined') return;

    const capabilities = {
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection)
    };

    console.log('🎥 Recording capabilities:', capabilities);

    if (!capabilities.mediaRecorder) {
      console.warn('⚠️ MediaRecorder not supported - recording disabled');
    }
  }

  /**
   * Start recording session
   */
  async startRecording(sessionId: string, config: Partial<RecordingConfig> = {}): Promise<string> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    // Check permissions
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();
    if (!multiUserService?.hasPermission(currentUser?.id, 'canRecordSession')) {
      throw new Error('Insufficient permissions to record sessions');
    }

    const recordingConfig = { ...this.defaultConfig, ...config };
    const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create recording session
    this.currentRecording = {
      id: recordingId,
      sessionId,
      startTime: new Date().toISOString(),
      duration: 0,
      config: recordingConfig,
      status: 'recording',
      fileSize: 0,
      metadata: {
        participants: multiUserService?.getActiveUsers().map((u: any) => u.name) || [],
        therapist: currentUser?.name || 'Unknown',
        sessionType: 'therapy',
        boardsUsed: [],
        totalInteractions: 0
      }
    };

    try {
      // Setup media streams
      if (recordingConfig.includeVideo || recordingConfig.includeAudio) {
        await this.setupAudioVideoRecording(recordingConfig);
      }

      if (recordingConfig.includeScreen) {
        await this.setupScreenRecording(recordingConfig);
      }

      if (recordingConfig.includeBoardChanges) {
        this.startBoardTracking();
      }

      if (recordingConfig.includeChat) {
        this.startChatTracking();
      }

      this.isRecording = true;
      this.startRecordingTimer();

      // Notify other participants
      this.notifyRecordingStarted();

      console.log(`🎥 Started recording session: ${recordingId}`);
      return recordingId;

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.currentRecording = null;
      throw error;
    }
  }

  /**
   * Stop recording session
   */
  async stopRecording(): Promise<RecordingSession | null> {
    if (!this.isRecording || !this.currentRecording) {
      return null;
    }

    this.isRecording = false;
    this.currentRecording.status = 'processing';
    this.currentRecording.endTime = new Date().toISOString();

    try {
      // Stop all recorders
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }

      if (this.screenRecorder && this.screenRecorder.state === 'recording') {
        this.screenRecorder.stop();
      }

      // Stop streams
      this.recordingStream?.getTracks().forEach(track => track.stop());
      this.screenStream?.getTracks().forEach(track => track.stop());

      // Process recording data
      await this.processRecording();

      this.currentRecording.status = 'completed';
      
      // Notify completion
      this.notifyRecordingCompleted();

      console.log(`✅ Recording completed: ${this.currentRecording.id}`);
      
      const completedRecording = this.currentRecording;
      this.currentRecording = null;
      this.recordingChunks = [];
      this.boardActions = [];

      return completedRecording;

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      if (this.currentRecording) {
        this.currentRecording.status = 'failed';
      }
      throw error;
    }
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.isRecording) return;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }

    if (this.screenRecorder && this.screenRecorder.state === 'recording') {
      this.screenRecorder.pause();
    }

    console.log('⏸️ Recording paused');
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.isRecording) return;

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }

    if (this.screenRecorder && this.screenRecorder.state === 'paused') {
      this.screenRecorder.resume();
    }

    console.log('▶️ Recording resumed');
  }

  /**
   * Setup audio/video recording
   */
  private async setupAudioVideoRecording(config: RecordingConfig): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: config.includeAudio,
      video: config.includeVideo ? {
        width: config.quality === 'high' ? 1920 : config.quality === 'medium' ? 1280 : 640,
        height: config.quality === 'high' ? 1080 : config.quality === 'medium' ? 720 : 480,
        frameRate: config.quality === 'high' ? 30 : 24
      } : false
    };

    this.recordingStream = await navigator.mediaDevices.getUserMedia(constraints);

    const options = {
      mimeType: `video/${config.format}`,
      videoBitsPerSecond: config.quality === 'high' ? 2500000 : config.quality === 'medium' ? 1500000 : 800000
    };

    this.mediaRecorder = new MediaRecorder(this.recordingStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordingChunks.push({
          timestamp: Date.now(),
          type: 'video',
          data: event.data,
          size: event.data.size
        });
      }
    };

    this.mediaRecorder.start(1000); // Record in 1-second chunks
  }

  /**
   * Setup screen recording
   */
  private async setupScreenRecording(config: RecordingConfig): Promise<void> {
    if (!navigator.mediaDevices.getDisplayMedia) {
      console.warn('⚠️ Screen recording not supported');
      return;
    }

    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: config.quality === 'high' ? 1920 : config.quality === 'medium' ? 1280 : 1024,
        height: config.quality === 'high' ? 1080 : config.quality === 'medium' ? 720 : 768,
        frameRate: config.quality === 'high' ? 30 : 15
      },
      audio: true
    });

    const options = {
      mimeType: `video/${config.format}`,
      videoBitsPerSecond: config.quality === 'high' ? 3000000 : config.quality === 'medium' ? 2000000 : 1000000
    };

    this.screenRecorder = new MediaRecorder(this.screenStream, options);

    this.screenRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordingChunks.push({
          timestamp: Date.now(),
          type: 'screen',
          data: event.data,
          size: event.data.size
        });
      }
    };

    this.screenRecorder.start(1000);
  }

  /**
   * Setup board action tracking
   */
  private setupBoardTracking(): void {
    if (typeof window === 'undefined') return;

    // Listen for board events
    window.addEventListener('tileClick', (event: any) => {
      if (this.isRecording && this.currentRecording?.config.includeBoardChanges) {
        this.recordBoardAction('tile_click', event.detail);
      }
    });

    window.addEventListener('boardChange', (event: any) => {
      if (this.isRecording && this.currentRecording?.config.includeBoardChanges) {
        this.recordBoardAction('board_change', event.detail);
      }
    });

    window.addEventListener('sentenceAdd', (event: any) => {
      if (this.isRecording && this.currentRecording?.config.includeBoardChanges) {
        this.recordBoardAction('sentence_add', event.detail);
      }
    });
  }

  /**
   * Start board tracking for current recording
   */
  private startBoardTracking(): void {
    console.log('📋 Started board action tracking');
  }

  /**
   * Start chat tracking
   */
  private startChatTracking(): void {
    // Listen for chat messages during recording
    window.addEventListener('chatMessage', (event: any) => {
      if (this.isRecording && this.currentRecording?.config.includeChat) {
        this.recordingChunks.push({
          timestamp: Date.now(),
          type: 'chat',
          data: event.detail,
          size: JSON.stringify(event.detail).length
        });
      }
    });

    console.log('💬 Started chat tracking');
  }

  /**
   * Record board action
   */
  private recordBoardAction(action: BoardAction['action'], data: any): void {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    this.boardActions.push({
      timestamp: Date.now(),
      userId: currentUser?.id || 'unknown',
      action,
      data
    });

    if (this.currentRecording) {
      this.currentRecording.metadata.totalInteractions++;
    }
  }

  /**
   * Start recording timer
   */
  private startRecordingTimer(): void {
    const startTime = Date.now();
    
    const updateDuration = () => {
      if (this.isRecording && this.currentRecording) {
        this.currentRecording.duration = Date.now() - startTime;
        setTimeout(updateDuration, 1000);
      }
    };

    updateDuration();
  }

  /**
   * Process recording data
   */
  private async processRecording(): Promise<void> {
    if (!this.currentRecording) return;

    // Calculate total file size
    this.currentRecording.fileSize = this.recordingChunks.reduce((total, chunk) => total + chunk.size, 0);

    // Combine video chunks
    const videoChunks = this.recordingChunks.filter(chunk => chunk.type === 'video' || chunk.type === 'screen');
    if (videoChunks.length > 0) {
      const combinedBlob = new Blob(
        videoChunks.map(chunk => chunk.data),
        { type: `video/${this.currentRecording.config.format}` }
      );

      // Create download URL (in production, upload to server)
      const url = URL.createObjectURL(combinedBlob);
      this.currentRecording.filePath = url;
    }

    // Process board actions
    const boardData = {
      actions: this.boardActions,
      summary: this.generateBoardSummary()
    };

    // Store recording metadata
    this.saveRecordingMetadata(this.currentRecording, boardData);
  }

  /**
   * Generate board interaction summary
   */
  private generateBoardSummary(): any {
    const boardsUsed = new Set();
    const interactions = {
      tile_clicks: 0,
      board_changes: 0,
      sentence_adds: 0,
      sentence_clears: 0
    };

    this.boardActions.forEach(action => {
      if (action.data.boardId) {
        boardsUsed.add(action.data.boardId);
      }
      
      switch (action.action) {
        case 'tile_click':
          interactions.tile_clicks++;
          break;
        case 'board_change':
          interactions.board_changes++;
          break;
        case 'sentence_add':
          interactions.sentence_adds++;
          break;
        case 'sentence_clear':
          interactions.sentence_clears++;
          break;
      }
    });

    return {
      boardsUsed: Array.from(boardsUsed),
      totalInteractions: this.boardActions.length,
      interactionBreakdown: interactions,
      sessionDuration: this.currentRecording?.duration || 0
    };
  }

  /**
   * Save recording metadata
   */
  private saveRecordingMetadata(recording: RecordingSession, boardData: any): void {
    const recordingData = {
      ...recording,
      boardData,
      savedAt: new Date().toISOString()
    };

    // Save to localStorage (in production, save to server)
    const recordings = this.getSavedRecordings();
    recordings.push(recordingData);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_recordings', JSON.stringify(recordings));
    }

    console.log('💾 Recording metadata saved');
  }

  /**
   * Get saved recordings
   */
  getSavedRecordings(): RecordingSession[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem('session_recordings');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load recordings:', error);
      return [];
    }
  }

  /**
   * Delete recording
   */
  deleteRecording(recordingId: string): void {
    const recordings = this.getSavedRecordings();
    const updatedRecordings = recordings.filter(r => r.id !== recordingId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_recordings', JSON.stringify(updatedRecordings));
    }

    console.log(`🗑️ Deleted recording: ${recordingId}`);
  }

  /**
   * Export recording
   */
  async exportRecording(recordingId: string, format: 'json' | 'pdf' | 'video' = 'video'): Promise<void> {
    const recordings = this.getSavedRecordings();
    const recording = recordings.find(r => r.id === recordingId);

    if (!recording) {
      throw new Error('Recording not found');
    }

    switch (format) {
      case 'video':
        if (recording.filePath) {
          const link = document.createElement('a');
          link.href = recording.filePath;
          link.download = `session_${recording.sessionId}_${recording.startTime}.${recording.config.format}`;
          link.click();
        }
        break;

      case 'json':
        const jsonData = JSON.stringify(recording, null, 2);
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `session_${recording.sessionId}_metadata.json`;
        jsonLink.click();
        break;

      case 'pdf':
        // Generate PDF report (would need PDF library in production)
        console.log('📄 PDF export would be implemented with PDF library');
        break;
    }
  }

  /**
   * Get current recording status
   */
  getCurrentRecording(): RecordingSession | null {
    return this.currentRecording;
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Notify participants that recording started
   */
  private notifyRecordingStarted(): void {
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'recording_started',
        recordingId: this.currentRecording?.id,
        timestamp: Date.now()
      });
    }

    // Show recording indicator
    this.showRecordingIndicator();
  }

  /**
   * Notify participants that recording completed
   */
  private notifyRecordingCompleted(): void {
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'recording_completed',
        recordingId: this.currentRecording?.id,
        timestamp: Date.now()
      });
    }

    // Hide recording indicator
    this.hideRecordingIndicator();
  }

  /**
   * Show recording indicator
   */
  private showRecordingIndicator(): void {
    if (typeof document === 'undefined') return;

    const indicator = document.createElement('div');
    indicator.id = 'recording-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      z-index: 9999;
      font-size: 14px;
      font-weight: bold;
      animation: pulse 2s infinite;
    `;
    indicator.innerHTML = '🔴 Recording...';

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
  }

  /**
   * Hide recording indicator
   */
  private hideRecordingIndicator(): void {
    if (typeof document === 'undefined') return;

    const indicator = document.getElementById('recording-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// Export singleton getter function
export function getSessionRecordingService(): SessionRecordingService {
  return SessionRecordingService.getInstance();
}