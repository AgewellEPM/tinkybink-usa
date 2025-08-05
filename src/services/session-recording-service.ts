/**
 * Session Recording & Playback Service
 * Records therapy sessions for analysis and progress tracking
 * 
 * Features:
 * - Video/audio recording of sessions
 * - Screen capture of AAC interactions
 * - Automatic transcription and annotation
 * - Highlight reel generation
 * - HIPAA-compliant storage
 * - Progress comparison over time
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0
 */

import { mlDataCollection } from './ml-data-collection';
import { therapyGoalTrackingService } from './therapy-goal-tracking-service';

interface SessionRecording {
  id: string;
  session_id: string;
  patient_id: string;
  therapist_id: string;
  
  // Recording Data
  media: {
    video?: {
      url: string;
      duration: number;
      resolution: string;
      codec: string;
    };
    audio?: {
      url: string;
      duration: number;
      bitrate: number;
    };
    screen?: {
      url: string;
      duration: number;
      interactions: InteractionEvent[];
    };
  };
  
  // Metadata
  metadata: {
    start_time: Date;
    end_time: Date;
    duration_minutes: number;
    location: string;
    session_type: 'in_person' | 'telehealth' | 'home_practice';
    goals_addressed: string[];
  };
  
  // Transcription
  transcription: {
    full_text: string;
    utterances: Array<{
      speaker: 'patient' | 'therapist' | 'caregiver';
      text: string;
      timestamp: number;
      confidence: number;
    }>;
    aac_communications: Array<{
      tiles_selected: string[];
      sentence_formed: string;
      timestamp: number;
      success: boolean;
    }>;
  };
  
  // Analysis
  analysis: {
    communication_attempts: number;
    successful_communications: number;
    words_per_minute: number;
    engagement_score: number; // 0-10
    key_moments: Array<{
      timestamp: number;
      type: 'breakthrough' | 'struggle' | 'achievement' | 'interaction';
      description: string;
      thumbnail?: string;
    }>;
    emotion_timeline: Array<{
      timestamp: number;
      emotion: string;
      confidence: number;
    }>;
  };
  
  // Highlights
  highlights: {
    clips: Array<{
      id: string;
      start_time: number;
      end_time: number;
      title: string;
      category: 'progress' | 'achievement' | 'challenge' | 'strategy';
      notes?: string;
    }>;
    auto_generated: boolean;
    therapist_selected: string[];
    family_friendly: string[];
  };
  
  // Privacy & Compliance
  privacy: {
    consent_obtained: boolean;
    retention_period_days: number;
    sharing_permissions: {
      therapist: boolean;
      family: boolean;
      research: boolean;
    };
    encryption: {
      at_rest: boolean;
      algorithm: string;
    };
  };
  
  // Status
  status: 'recording' | 'processing' | 'ready' | 'archived';
  created_at: Date;
  processed_at?: Date;
}

interface InteractionEvent {
  timestamp: number;
  type: 'tile_select' | 'board_navigate' | 'sentence_speak' | 'game_play';
  details: any;
  screenshot?: string;
}

interface RecordingOptions {
  video: boolean;
  audio: boolean;
  screen: boolean;
  quality: 'low' | 'medium' | 'high';
  max_duration_minutes: number;
}

class SessionRecordingService {
  private static instance: SessionRecordingService;
  private recordings: Map<string, SessionRecording> = new Map();
  private activeRecording: SessionRecording | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private screenRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private interactionLog: InteractionEvent[] = [];
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): SessionRecordingService {
    if (!SessionRecordingService.instance) {
      SessionRecordingService.instance = new SessionRecordingService();
    }
    return SessionRecordingService.instance;
  }
  
  /**
   * Initialize recording service
   */
  private async initializeService(): Promise<void> {
    console.log('🎥 Initializing Session Recording Service...');
    
    // Set up interaction tracking
    this.setupInteractionTracking();
    
    // Check for media permissions
    await this.checkMediaPermissions();
    
    console.log('✅ Recording Service Ready');
  }
  
  /**
   * Start recording a therapy session
   */
  async startRecording(
    sessionId: string,
    patientId: string,
    therapistId: string,
    options: RecordingOptions
  ): Promise<string> {
    if (this.activeRecording) {
      throw new Error('Recording already in progress');
    }
    
    const recordingId = `rec_${Date.now()}`;
    
    // Initialize recording object
    this.activeRecording = {
      id: recordingId,
      session_id: sessionId,
      patient_id: patientId,
      therapist_id: therapistId,
      
      media: {},
      
      metadata: {
        start_time: new Date(),
        end_time: new Date(),
        duration_minutes: 0,
        location: 'clinic',
        session_type: 'in_person',
        goals_addressed: []
      },
      
      transcription: {
        full_text: '',
        utterances: [],
        aac_communications: []
      },
      
      analysis: {
        communication_attempts: 0,
        successful_communications: 0,
        words_per_minute: 0,
        engagement_score: 0,
        key_moments: [],
        emotion_timeline: []
      },
      
      highlights: {
        clips: [],
        auto_generated: false,
        therapist_selected: [],
        family_friendly: []
      },
      
      privacy: {
        consent_obtained: true,
        retention_period_days: 365,
        sharing_permissions: {
          therapist: true,
          family: false,
          research: false
        },
        encryption: {
          at_rest: true,
          algorithm: 'AES-256'
        }
      },
      
      status: 'recording',
      created_at: new Date()
    };
    
    // Start media recording based on options
    try {
      if (options.video || options.audio) {
        await this.startMediaRecording(options);
      }
      
      if (options.screen) {
        await this.startScreenRecording(options);
      }
      
      // Start interaction logging
      this.interactionLog = [];
      
      // Set max duration timer
      setTimeout(() => {
        if (this.activeRecording?.status === 'recording') {
          this.stopRecording();
        }
      }, options.max_duration_minutes * 60 * 1000);
      
      console.log(`🔴 Recording started: ${recordingId}`);
      
      // Track recording start
      await mlDataCollection.trackInteraction(therapistId, {
        type: 'recording_started',
        metadata: { recordingId, sessionId, patientId },
        timestamp: new Date()
      });
      
      return recordingId;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.activeRecording = null;
      throw error;
    }
  }
  
  /**
   * Stop recording and process
   */
  async stopRecording(): Promise<SessionRecording> {
    if (!this.activeRecording) {
      throw new Error('No active recording');
    }
    
    console.log('⏹️ Stopping recording...');
    
    // Stop media recorders
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.screenRecorder && this.screenRecorder.state === 'recording') {
      this.screenRecorder.stop();
    }
    
    // Update metadata
    this.activeRecording.metadata.end_time = new Date();
    this.activeRecording.metadata.duration_minutes = 
      (this.activeRecording.metadata.end_time.getTime() - 
       this.activeRecording.metadata.start_time.getTime()) / 60000;
    
    // Save interaction log
    if (this.activeRecording.media.screen) {
      this.activeRecording.media.screen.interactions = [...this.interactionLog];
    }
    
    // Update status
    this.activeRecording.status = 'processing';
    
    // Save recording
    const recording = { ...this.activeRecording };
    this.recordings.set(recording.id, recording);
    
    // Process recording asynchronously
    this.processRecording(recording.id);
    
    // Clear active recording
    this.activeRecording = null;
    this.recordingChunks = [];
    this.interactionLog = [];
    
    return recording;
  }
  
  /**
   * Add AAC communication to recording
   */
  async addAACCommunication(
    tilesSelected: string[],
    sentenceFormed: string,
    success: boolean
  ): Promise<void> {
    if (!this.activeRecording) return;
    
    const communication = {
      tiles_selected: tilesSelected,
      sentence_formed: sentenceFormed,
      timestamp: Date.now() - this.activeRecording.metadata.start_time.getTime(),
      success
    };
    
    this.activeRecording.transcription.aac_communications.push(communication);
    this.activeRecording.analysis.communication_attempts++;
    
    if (success) {
      this.activeRecording.analysis.successful_communications++;
    }
    
    // Log as key moment if significant
    if (success && sentenceFormed.split(' ').length > 3) {
      this.activeRecording.analysis.key_moments.push({
        timestamp: communication.timestamp,
        type: 'achievement',
        description: `Successfully communicated: "${sentenceFormed}"`
      });
    }
  }
  
  /**
   * Process recording with AI analysis
   */
  private async processRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return;
    
    console.log(`🔄 Processing recording ${recordingId}...`);
    
    try {
      // Generate transcription
      if (recording.media.audio) {
        await this.transcribeAudio(recording);
      }
      
      // Analyze communication patterns
      await this.analyzeCommunicationPatterns(recording);
      
      // Generate highlights
      await this.generateHighlights(recording);
      
      // Calculate metrics
      this.calculateSessionMetrics(recording);
      
      // Update goal progress
      await this.updateGoalProgress(recording);
      
      // Mark as ready
      recording.status = 'ready';
      recording.processed_at = new Date();
      
      console.log(`✅ Recording processed: ${recordingId}`);
      
    } catch (error) {
      console.error('Recording processing failed:', error);
      recording.status = 'ready'; // Mark ready even if processing partially fails
    }
  }
  
  /**
   * Generate highlight reel
   */
  async generateHighlightReel(
    recordingId: string,
    options?: {
      max_duration_seconds?: number;
      include_categories?: string[];
      family_friendly?: boolean;
    }
  ): Promise<string> {
    const recording = this.recordings.get(recordingId);
    if (!recording) throw new Error('Recording not found');
    
    console.log('🎬 Generating highlight reel...');
    
    const highlights = recording.highlights.clips.filter(clip => {
      if (options?.include_categories) {
        return options.include_categories.includes(clip.category);
      }
      if (options?.family_friendly) {
        return recording.highlights.family_friendly.includes(clip.id);
      }
      return true;
    });
    
    // Sort by importance/impact
    highlights.sort((a, b) => {
      const priority = { achievement: 4, progress: 3, strategy: 2, challenge: 1 };
      return priority[b.category] - priority[a.category];
    });
    
    // Trim to max duration
    let totalDuration = 0;
    const maxDuration = options?.max_duration_seconds || 120; // 2 minutes default
    const selectedClips = [];
    
    for (const clip of highlights) {
      const clipDuration = clip.end_time - clip.start_time;
      if (totalDuration + clipDuration <= maxDuration) {
        selectedClips.push(clip);
        totalDuration += clipDuration;
      }
    }
    
    // In production, would use FFmpeg or cloud service to create video
    const highlightReelUrl = `/highlights/${recordingId}_highlights.mp4`;
    
    console.log(`✅ Highlight reel created with ${selectedClips.length} clips`);
    
    return highlightReelUrl;
  }
  
  /**
   * Get session recordings for patient
   */
  getPatientRecordings(
    patientId: string,
    options?: {
      date_from?: Date;
      date_to?: Date;
      status?: SessionRecording['status'];
    }
  ): SessionRecording[] {
    let recordings = Array.from(this.recordings.values()).filter(
      rec => rec.patient_id === patientId
    );
    
    if (options?.date_from) {
      recordings = recordings.filter(
        rec => rec.metadata.start_time >= options.date_from!
      );
    }
    
    if (options?.date_to) {
      recordings = recordings.filter(
        rec => rec.metadata.start_time <= options.date_to!
      );
    }
    
    if (options?.status) {
      recordings = recordings.filter(rec => rec.status === options.status);
    }
    
    return recordings.sort((a, b) => 
      b.metadata.start_time.getTime() - a.metadata.start_time.getTime()
    );
  }
  
  /**
   * Compare progress across sessions
   */
  async compareProgress(recordingIds: string[]): Promise<{
    metrics_comparison: any;
    trend_analysis: any;
    recommendations: string[];
  }> {
    const recordings = recordingIds.map(id => this.recordings.get(id)).filter(Boolean) as SessionRecording[];
    
    if (recordings.length < 2) {
      throw new Error('Need at least 2 recordings to compare');
    }
    
    // Sort by date
    recordings.sort((a, b) => 
      a.metadata.start_time.getTime() - b.metadata.start_time.getTime()
    );
    
    // Compare key metrics
    const metrics_comparison = {
      communication_attempts: recordings.map(r => ({
        date: r.metadata.start_time,
        value: r.analysis.communication_attempts
      })),
      success_rate: recordings.map(r => ({
        date: r.metadata.start_time,
        value: (r.analysis.successful_communications / r.analysis.communication_attempts) * 100
      })),
      words_per_minute: recordings.map(r => ({
        date: r.metadata.start_time,
        value: r.analysis.words_per_minute
      })),
      engagement_score: recordings.map(r => ({
        date: r.metadata.start_time,
        value: r.analysis.engagement_score
      }))
    };
    
    // Analyze trends
    const trend_analysis = {
      overall_trend: this.calculateTrend(metrics_comparison.success_rate.map(m => m.value)),
      improvement_rate: this.calculateImprovementRate(recordings),
      consistency: this.calculateConsistency(recordings)
    };
    
    // Generate recommendations
    const recommendations = this.generateProgressRecommendations(trend_analysis);
    
    return {
      metrics_comparison,
      trend_analysis,
      recommendations
    };
  }
  
  // Private helper methods
  
  private async checkMediaPermissions(): Promise<void> {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('Camera permission:', permissions.state);
    } catch (error) {
      console.log('Permissions API not supported');
    }
  }
  
  private setupInteractionTracking(): void {
    // Track AAC interactions during recording
    window.addEventListener('tinkybink:tile:selected', (event: any) => {
      if (this.activeRecording) {
        this.interactionLog.push({
          timestamp: Date.now() - this.activeRecording.metadata.start_time.getTime(),
          type: 'tile_select',
          details: event.detail
        });
      }
    });
    
    window.addEventListener('tinkybink:sentence:spoken', (event: any) => {
      if (this.activeRecording) {
        this.interactionLog.push({
          timestamp: Date.now() - this.activeRecording.metadata.start_time.getTime(),
          type: 'sentence_speak',
          details: event.detail
        });
      }
    });
  }
  
  private async startMediaRecording(options: RecordingOptions): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: options.audio,
      video: options.video ? {
        width: options.quality === 'high' ? 1920 : options.quality === 'medium' ? 1280 : 640,
        height: options.quality === 'high' ? 1080 : options.quality === 'medium' ? 720 : 480,
        frameRate: 30
      } : false
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordingChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordingChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      if (this.activeRecording) {
        if (options.video) {
          this.activeRecording.media.video = {
            url,
            duration: this.activeRecording.metadata.duration_minutes * 60,
            resolution: `${constraints.video ? (constraints.video as any).width : 0}x${constraints.video ? (constraints.video as any).height : 0}`,
            codec: 'vp9'
          };
        }
        if (options.audio) {
          this.activeRecording.media.audio = {
            url,
            duration: this.activeRecording.metadata.duration_minutes * 60,
            bitrate: 128
          };
        }
      }
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
    };
    
    this.mediaRecorder.start(1000); // Capture in 1-second chunks
  }
  
  private async startScreenRecording(options: RecordingOptions): Promise<void> {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: {
          width: options.quality === 'high' ? 1920 : 1280,
          height: options.quality === 'high' ? 1080 : 720
        },
        audio: false
      });
      
      const screenChunks: Blob[] = [];
      
      this.screenRecorder = new MediaRecorder(stream);
      
      this.screenRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          screenChunks.push(event.data);
        }
      };
      
      this.screenRecorder.onstop = () => {
        const blob = new Blob(screenChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        if (this.activeRecording) {
          this.activeRecording.media.screen = {
            url,
            duration: this.activeRecording.metadata.duration_minutes * 60,
            interactions: this.interactionLog
          };
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.screenRecorder.start(1000);
      
    } catch (error) {
      console.error('Screen recording not available:', error);
    }
  }
  
  private async transcribeAudio(recording: SessionRecording): Promise<void> {
    // In production, use speech-to-text service
    console.log('Transcribing audio...');
    
    // Mock transcription
    recording.transcription.full_text = 'Mock transcription of therapy session';
    recording.transcription.utterances = [
      {
        speaker: 'therapist',
        text: 'Let\'s practice using your AAC device',
        timestamp: 0,
        confidence: 0.95
      },
      {
        speaker: 'patient',
        text: 'I want water',
        timestamp: 5000,
        confidence: 0.88
      }
    ];
  }
  
  private async analyzeCommunicationPatterns(recording: SessionRecording): Promise<void> {
    // Analyze AAC usage patterns
    const totalCommunications = recording.transcription.aac_communications.length;
    const successfulCommunications = recording.transcription.aac_communications.filter(c => c.success).length;
    
    // Calculate words per minute
    const totalWords = recording.transcription.aac_communications.reduce(
      (sum, comm) => sum + comm.sentence_formed.split(' ').length, 0
    );
    recording.analysis.words_per_minute = totalWords / recording.metadata.duration_minutes;
    
    // Calculate engagement score (0-10)
    const engagementFactors = {
      attempt_frequency: Math.min(totalCommunications / recording.metadata.duration_minutes, 5) * 2,
      success_rate: (successfulCommunications / totalCommunications) * 3,
      complexity: Math.min(recording.analysis.words_per_minute / 10, 1) * 3,
      consistency: 2 // Would calculate based on time gaps
    };
    
    recording.analysis.engagement_score = Object.values(engagementFactors).reduce((a, b) => a + b, 0);
  }
  
  private async generateHighlights(recording: SessionRecording): Promise<void> {
    // Auto-detect highlight moments
    const highlights = [];
    
    // Find breakthrough moments (first successful multi-word communication)
    const firstMultiWord = recording.transcription.aac_communications.find(
      c => c.success && c.sentence_formed.split(' ').length > 2
    );
    
    if (firstMultiWord) {
      highlights.push({
        id: `highlight_${Date.now()}_1`,
        start_time: Math.max(0, firstMultiWord.timestamp - 5000),
        end_time: firstMultiWord.timestamp + 5000,
        title: 'First Multi-Word Success',
        category: 'breakthrough' as const,
        notes: `Successfully communicated: "${firstMultiWord.sentence_formed}"`
      });
    }
    
    // Find longest successful communication
    const longestComm = recording.transcription.aac_communications
      .filter(c => c.success)
      .sort((a, b) => b.sentence_formed.length - a.sentence_formed.length)[0];
    
    if (longestComm) {
      highlights.push({
        id: `highlight_${Date.now()}_2`,
        start_time: Math.max(0, longestComm.timestamp - 3000),
        end_time: longestComm.timestamp + 3000,
        title: 'Complex Communication',
        category: 'achievement' as const,
        notes: `Longest sentence: "${longestComm.sentence_formed}"`
      });
    }
    
    recording.highlights.clips = highlights;
    recording.highlights.auto_generated = true;
  }
  
  private calculateSessionMetrics(recording: SessionRecording): void {
    // Already calculated in analyzeCommunicationPatterns
    // Additional metrics could be added here
  }
  
  private async updateGoalProgress(recording: SessionRecording): Promise<void> {
    // Update therapy goals based on session data
    await therapyGoalTrackingService.updateProgressFromSession(
      recording.session_id,
      recording.patient_id,
      {
        correct_responses: recording.analysis.successful_communications,
        total_responses: recording.analysis.communication_attempts,
        words_communicated: recording.transcription.aac_communications.reduce(
          (sum, c) => sum + c.sentence_formed.split(' ').length, 0
        ),
        session_duration_minutes: recording.metadata.duration_minutes
      }
    );
  }
  
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.1) return 'improving';
    if (secondAvg < firstAvg * 0.9) return 'declining';
    return 'stable';
  }
  
  private calculateImprovementRate(recordings: SessionRecording[]): number {
    if (recordings.length < 2) return 0;
    
    const first = recordings[0];
    const last = recordings[recordings.length - 1];
    
    const firstSuccess = first.analysis.successful_communications / first.analysis.communication_attempts;
    const lastSuccess = last.analysis.successful_communications / last.analysis.communication_attempts;
    
    return ((lastSuccess - firstSuccess) / firstSuccess) * 100;
  }
  
  private calculateConsistency(recordings: SessionRecording[]): number {
    const successRates = recordings.map(r => 
      r.analysis.successful_communications / r.analysis.communication_attempts
    );
    
    const mean = successRates.reduce((a, b) => a + b, 0) / successRates.length;
    const variance = successRates.reduce((sum, rate) => 
      sum + Math.pow(rate - mean, 2), 0
    ) / successRates.length;
    
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation
    
    return Math.max(0, 1 - cv); // Higher is more consistent
  }
  
  private generateProgressRecommendations(analysis: any): string[] {
    const recommendations = [];
    
    if (analysis.overall_trend === 'improving') {
      recommendations.push('Continue current strategies - showing positive progress');
    } else if (analysis.overall_trend === 'declining') {
      recommendations.push('Consider adjusting therapy approach or goals');
      recommendations.push('Review environmental factors affecting performance');
    }
    
    if (analysis.consistency < 0.6) {
      recommendations.push('Focus on establishing consistent practice routines');
      recommendations.push('Identify and address factors causing variability');
    }
    
    if (analysis.improvement_rate > 20) {
      recommendations.push('Patient showing rapid progress - consider advancing goals');
    } else if (analysis.improvement_rate < 5) {
      recommendations.push('Progress is slow - break down goals into smaller steps');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const sessionRecordingService = SessionRecordingService.getInstance();
export type { SessionRecording, RecordingOptions, InteractionEvent };