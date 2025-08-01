/**
 * Real-Time Collaboration Service
 * Module 26: Real-time collaboration for multi-therapist sessions
 */

interface CollaborationSession {
  sessionId: string;
  type: 'therapy' | 'assessment' | 'training';
  participants: string[];
  createdAt: string;
  isActive: boolean;
  settings: {
    allowScreenShare: boolean;
    allowVoiceChat: boolean;
    allowCursorShare: boolean;
    allowBoardSync: boolean;
  };
}

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export class CollaborationService {
  private static instance: CollaborationService;
  private peers: Map<string, PeerConnection> = new Map();
  private websocket: WebSocket | null = null;
  private currentSession: CollaborationSession | null = null;
  private userId: string | null = null;
  private localStream: MediaStream | null = null;
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  private constructor() {
    this.initializeCollaboration();
  }

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  initialize(): void {
    console.log('🤝 Real-Time Collaboration Service initialized');
  }

  private initializeCollaboration(): void {
    // Set user ID from auth system if available
    if (typeof window !== 'undefined') {
      const authSystem = (window as any).authSystem;
      if (authSystem?.isAuthenticated()) {
        this.userId = authSystem.getCurrentUser().id;
      } else {
        this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }
  }

  /**
   * Connect to collaboration server
   */
  async connectToCollaborationServer(serverUrl = 'wss://tinkybink-collab.herokuapp.com'): Promise<void> {
    try {
      this.websocket = new WebSocket(serverUrl);
      
      this.websocket.onopen = () => {
        console.log('🌐 Connected to collaboration server');
        this.sendMessage({
          type: 'auth',
          userId: this.userId,
          token: (window as any).authSystem?.currentUser?.token
        });
      };
      
      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };
      
      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
      this.websocket.onclose = () => {
        console.log('📡 Disconnected from collaboration server');
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.connectToCollaborationServer(serverUrl), 5000);
      };
    } catch (error) {
      console.error('❌ Failed to connect to collaboration server:', error);
    }
  }

  /**
   * Create a new collaboration session
   */
  async createSession(sessionType: 'therapy' | 'assessment' | 'training' = 'therapy'): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CollaborationSession = {
      sessionId,
      type: sessionType,
      participants: [this.userId!],
      createdAt: new Date().toISOString(),
      isActive: true,
      settings: {
        allowScreenShare: true,
        allowVoiceChat: true,
        allowCursorShare: true,
        allowBoardSync: true
      }
    };
    
    this.currentSession = session;
    
    // Store session locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('collaboration_session', JSON.stringify(session));
    }
    
    // Notify server
    this.sendMessage({
      type: 'create_session',
      session
    });
    
    console.log(`🎯 Created collaboration session: ${sessionId}`);
    return sessionId;
  }

  /**
   * Join an existing collaboration session
   */
  async joinSession(sessionId: string): Promise<void> {
    this.sendMessage({
      type: 'join_session',
      sessionId,
      userId: this.userId
    });
    
    console.log(`🔗 Joining collaboration session: ${sessionId}`);
  }

  /**
   * Start video call with peers
   */
  async startVideoCall(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.displayLocalVideo();
      
      // Start peer connections for all participants
      this.peers.forEach((peer, peerId) => {
        this.addStreamToPeer(peer, this.localStream!);
      });
      
      console.log('📹 Video call started');
    } catch (error) {
      console.error('❌ Failed to start video call:', error);
    }
  }

  /**
   * Share screen with peers
   */
  async startScreenShare(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing not supported');
      }
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      // Replace video track with screen share
      this.peers.forEach((peer) => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };
      
      console.log('🖥️ Screen sharing started');
    } catch (error) {
      console.error('❌ Screen sharing failed:', error);
    }
  }

  /**
   * Stop screen sharing and restore camera
   */
  async stopScreenShare(): Promise<void> {
    if (this.localStream) {
      this.peers.forEach((peer) => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && this.localStream) {
          sender.replaceTrack(this.localStream.getVideoTracks()[0]);
        }
      });
    }
    
    console.log('🔚 Screen sharing stopped');
  }

  /**
   * Share cursor position with peers
   */
  startCursorSharing(): void {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (event: MouseEvent) => {
      const data = {
        type: 'cursor_position',
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      };
      
      this.broadcastToDataChannels(data);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    console.log('👆 Cursor sharing enabled');
  }

  /**
   * Sync board changes with peers
   */
  syncBoardChange(change: any): void {
    const data = {
      type: 'board_change',
      change,
      userId: this.userId,
      timestamp: Date.now()
    };
    
    this.broadcastToDataChannels(data);
  }

  /**
   * Sync settings changes with peers
   */
  syncSettingsChange(settings: any): void {
    const data = {
      type: 'settings_update',
      settings,
      userId: this.userId,
      timestamp: Date.now()
    };
    
    this.broadcastToDataChannels(data);
  }

  /**
   * Initiate handoff to another therapist
   */
  async initiateHandoff(targetTherapistId: string): Promise<any> {
    const handoffData = {
      type: 'handoff_request',
      from: this.userId,
      to: targetTherapistId,
      sessionData: this.getCurrentSessionData(),
      timestamp: Date.now()
    };
    
    this.sendMessage(handoffData);
    
    return handoffData;
  }

  /**
   * End collaboration session
   */
  endSession(): void {
    // Close all peer connections
    this.peers.forEach((peer) => {
      peer.connection.close();
    });
    this.peers.clear();
    
    // Close data channels
    this.dataChannels.clear();
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Remove video elements
    if (typeof document !== 'undefined') {
      document.getElementById('collaborationVideoContainer')?.remove();
      document.querySelectorAll('[id^="remoteVideo_"]').forEach(el => el.remove());
    }
    
    // Notify server
    this.sendMessage({
      type: 'end_session',
      sessionId: this.currentSession?.sessionId
    });
    
    this.currentSession = null;
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('collaboration_session');
    }
    
    console.log('🔚 Collaboration session ended');
  }

  /**
   * Get list of active participants
   */
  getActiveParticipants(): string[] {
    return this.currentSession?.participants || [];
  }

  /**
   * Check if currently in a collaboration session
   */
  isInSession(): boolean {
    return !!this.currentSession?.isActive;
  }

  // Private helper methods
  private sendMessage(message: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'user_joined':
        this.handleUserJoined(message);
        break;
      case 'user_left':
        this.handleUserLeft(message);
        break;
      case 'offer':
        this.handleOffer(message);
        break;
      case 'answer':
        this.handleAnswer(message);
        break;
      case 'ice_candidate':
        this.handleIceCandidate(message);
        break;
      case 'data_message':
        this.handleDataMessage(message);
        break;
    }
  }

  private async handleUserJoined(message: any): Promise<void> {
    const { userId } = message;
    
    if (userId === this.userId) return;
    
    // Create peer connection
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    // Create data channel
    const dataChannel = pc.createDataChannel('collaboration', { ordered: true });
    this.setupDataChannel(dataChannel, userId);
    
    this.peers.set(userId, {
      id: userId,
      connection: pc,
      dataChannel
    });
    
    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    this.sendMessage({
      type: 'offer',
      offer,
      to: userId,
      from: this.userId
    });
  }

  private handleUserLeft(message: any): void {
    const { userId } = message;
    
    const peer = this.peers.get(userId);
    if (peer) {
      peer.connection.close();
      this.peers.delete(userId);
    }
    
    this.dataChannels.delete(userId);
  }

  private async handleOffer(message: any): Promise<void> {
    const { from, offer } = message;
    
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.peers.set(from, {
      id: from,
      connection: pc
    });
    
    this.sendMessage({
      type: 'answer',
      answer,
      to: from,
      from: this.userId
    });
  }

  private async handleAnswer(message: any): Promise<void> {
    const { from, answer } = message;
    
    const peer = this.peers.get(from);
    if (peer) {
      await peer.connection.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(message: any): Promise<void> {
    const { from, candidate } = message;
    
    const peer = this.peers.get(from);
    if (peer) {
      await peer.connection.addIceCandidate(candidate);
    }
  }

  private handleDataMessage(message: any): void {
    const { data, from } = message;
    
    if (data.type === 'board_change') {
      this.applyBoardChange(data);
    } else if (data.type === 'settings_update') {
      this.applySettingsUpdate(data);
    } else if (data.type === 'cursor_position') {
      this.showCursorPosition(from, data.x, data.y);
    }
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`📡 Data channel opened with ${peerId}`);
      this.dataChannels.set(peerId, dataChannel);
    };
    
    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleDataMessage({ data, from: peerId });
    };
  }

  private broadcastToDataChannels(data: any): void {
    const message = JSON.stringify(data);
    this.dataChannels.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }

  private displayLocalVideo(): void {
    if (typeof document === 'undefined' || !this.localStream) return;
    
    const videoContainer = document.createElement('div');
    videoContainer.id = 'collaborationVideoContainer';
    videoContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 12px;
      padding: 15px;
      z-index: 10000;
    `;
    
    const localVideo = document.createElement('video');
    localVideo.srcObject = this.localStream;
    localVideo.autoplay = true;
    localVideo.muted = true;
    localVideo.style.cssText = `
      width: 100%;
      border-radius: 8px;
      margin-bottom: 10px;
    `;
    
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 10px;
    `;
    
    controls.innerHTML = `
      <button onclick="window.collaborationService.toggleAudio()" style="padding: 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white; cursor: pointer;">🎤</button>
      <button onclick="window.collaborationService.toggleVideo()" style="padding: 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white; cursor: pointer;">📹</button>
      <button onclick="window.collaborationService.endCall()" style="padding: 8px; background: #ff4444; border: none; border-radius: 50%; color: white; cursor: pointer;">📞</button>
    `;
    
    videoContainer.appendChild(localVideo);
    videoContainer.appendChild(controls);
    document.body.appendChild(videoContainer);
  }

  private addStreamToPeer(peer: PeerConnection, stream: MediaStream): void {
    stream.getTracks().forEach(track => {
      peer.connection.addTrack(track, stream);
    });
  }

  private applyBoardChange(data: any): void {
    // Apply board changes from other participants
    console.log('📋 Applying board change:', data);
  }

  private applySettingsUpdate(data: any): void {
    // Apply settings updates from other participants
    console.log('⚙️ Applying settings update:', data);
  }

  private showCursorPosition(userId: string, x: number, y: number): void {
    if (typeof document === 'undefined') return;
    
    let cursor = document.getElementById(`cursor_${userId}`);
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = `cursor_${userId}`;
      cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: #ff6b6b;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: all 0.1s ease;
      `;
      document.body.appendChild(cursor);
    }
    
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
  }

  private getCurrentSessionData(): any {
    return {
      session: this.currentSession,
      boardState: (window as any).moduleSystem?.get('BoardManager')?.getCurrentBoard(),
      settings: (window as any).moduleSystem?.get('DataService')?.getSettings()
    };
  }
}

// Export singleton getter function
export function getCollaborationService(): CollaborationService {
  return CollaborationService.getInstance();
}