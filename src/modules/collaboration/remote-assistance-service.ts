/**
 * Remote Assistance Service
 * Module 29: Allow therapists to remotely control user's board and provide assistance
 */

interface RemoteSession {
  id: string;
  assistantId: string;
  clientId: string;
  status: 'pending' | 'active' | 'paused' | 'ended';
  startTime: string;
  endTime?: string;
  permissions: RemotePermissions;
  activities: RemoteActivity[];
}

interface RemotePermissions {
  canControlCursor: boolean;
  canClickTiles: boolean;
  canChangeBoardsBoolean: boolean;
  canModifySettings: boolean;
  canControlAudio: boolean;
  canSendMessages: boolean;
  canViewScreen: boolean;
  canRecordSession: boolean;
}

interface RemoteActivity {
  timestamp: string;
  type: 'cursor_move' | 'tile_click' | 'board_change' | 'settings_change' | 'message' | 'audio_control';
  userId: string;
  data: any;
}

interface CursorPosition {
  x: number;
  y: number;
  visible: boolean;
}

interface RemoteControl {
  isActive: boolean;
  controlledBy: string;
  permissions: RemotePermissions;
}

export class RemoteAssistanceService {
  private static instance: RemoteAssistanceService;
  private currentSession: RemoteSession | null = null;
  private remoteControl: RemoteControl | null = null;
  private remoteCursor: CursorPosition = { x: 0, y: 0, visible: false };
  private cursorElement: HTMLElement | null = null;
  private isAssistant = false;
  private isClient = false;
  private dataChannel: RTCDataChannel | null = null;

  private constructor() {
    this.setupRemoteControls();
  }

  static getInstance(): RemoteAssistanceService {
    if (!RemoteAssistanceService.instance) {
      RemoteAssistanceService.instance = new RemoteAssistanceService();
    }
    return RemoteAssistanceService.instance;
  }

  initialize(): void {
    console.log('🎮 Remote Assistance Service initialized');
    this.createRemoteCursor();
  }

  /**
   * Request remote assistance
   */
  async requestAssistance(assistantId: string, permissions: Partial<RemotePermissions> = {}): Promise<string> {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const sessionId = `remote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const defaultPermissions: RemotePermissions = {
      canControlCursor: true,
      canClickTiles: true,
      canChangeBoardsBoolean: true,
      canModifySettings: false,
      canControlAudio: true,
      canSendMessages: true,
      canViewScreen: true,
      canRecordSession: false
    };

    this.currentSession = {
      id: sessionId,
      assistantId,
      clientId: currentUser.id,
      status: 'pending',
      startTime: new Date().toISOString(),
      permissions: { ...defaultPermissions, ...permissions },
      activities: []
    };

    // Send assistance request
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'assistance_request',
        session: this.currentSession,
        from: currentUser.id,
        to: assistantId
      });
    }

    this.isClient = true;
    console.log(`🆘 Requested assistance from ${assistantId}`);
    return sessionId;
  }

  /**
   * Accept assistance request
   */
  async acceptAssistanceRequest(sessionId: string): Promise<void> {
    const multiUserService = (window as any).moduleSystem?.get('MultiUserService');
    const currentUser = multiUserService?.getCurrentUser();

    if (!currentUser || !multiUserService?.hasPermission(currentUser.id, 'canManageUsers')) {
      throw new Error('Insufficient permissions to provide assistance');
    }

    // Find pending session
    const session = await this.findSession(sessionId);
    if (!session || session.status !== 'pending') {
      throw new Error('Invalid or expired assistance request');
    }

    session.status = 'active';
    this.currentSession = session;
    this.isAssistant = true;

    // Setup remote control
    this.remoteControl = {
      isActive: true,
      controlledBy: currentUser.id,
      permissions: session.permissions
    };

    // Establish direct connection for remote control
    await this.establishRemoteConnection(session.clientId);

    // Notify client
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'assistance_accepted',
        sessionId,
        assistantId: currentUser.id
      });
    }

    this.logActivity('session_started', { assistantId: currentUser.id });
    console.log(`✅ Accepted assistance request: ${sessionId}`);
  }

  /**
   * Deny assistance request
   */
  denyAssistanceRequest(sessionId: string): void {
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'assistance_denied',
        sessionId
      });
    }

    console.log(`❌ Denied assistance request: ${sessionId}`);
  }

  /**
   * End assistance session
   */
  endAssistance(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'ended';
    this.currentSession.endTime = new Date().toISOString();

    // Disable remote control
    this.remoteControl = null;
    this.hideCursor();
    
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Notify other party
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'assistance_ended',
        sessionId: this.currentSession.id
      });
    }

    this.logActivity('session_ended', {});
    console.log(`🔚 Ended assistance session: ${this.currentSession.id}`);
    
    this.currentSession = null;
    this.isAssistant = false;
    this.isClient = false;
  }

  /**
   * Control remote cursor
   */
  controlCursor(x: number, y: number): void {
    if (!this.isAssistant || !this.remoteControl?.permissions.canControlCursor) {
      return;
    }

    this.sendRemoteCommand('cursor_move', { x, y });
    this.logActivity('cursor_move', { x, y });
  }

  /**
   * Click tile remotely
   */
  remoteClickTile(tileId: string, boardId: string): void {
    if (!this.isAssistant || !this.remoteControl?.permissions.canClickTiles) {
      return;
    }

    this.sendRemoteCommand('tile_click', { tileId, boardId });
    this.logActivity('tile_click', { tileId, boardId });

    // Simulate tile click on client
    if (this.isClient) {
      this.simulateTileClick(tileId);
    }
  }

  /**
   * Change board remotely
   */
  remoteChangeBoard(boardId: string): void {
    if (!this.isAssistant || !this.remoteControl?.permissions.canChangeBoardsBoolean) {
      return;
    }

    this.sendRemoteCommand('board_change', { boardId });
    this.logActivity('board_change', { boardId });

    // Change board on client
    if (this.isClient) {
      const appStore = (window as any).useAppStore?.getState();
      if (appStore) {
        appStore.setCurrentBoard(boardId);
      }
    }
  }

  /**
   * Send message to client
   */
  sendAssistanceMessage(message: string, type: 'info' | 'instruction' | 'encouragement' = 'info'): void {
    if (!this.remoteControl?.permissions.canSendMessages) {
      return;
    }

    const messageData = {
      message,
      type,
      timestamp: new Date().toISOString(),
      from: 'assistant'
    };

    this.sendRemoteCommand('message', messageData);
    this.logActivity('message', messageData);
    
    // Show message on client
    if (this.isClient) {
      this.showAssistanceMessage(messageData);
    }
  }

  /**
   * Control audio settings remotely
   */
  remoteControlAudio(action: 'play' | 'pause' | 'volume', value?: number): void {
    if (!this.remoteControl?.permissions.canControlAudio) {
      return;
    }

    const audioData = { action, value };
    this.sendRemoteCommand('audio_control', audioData);
    this.logActivity('audio_control', audioData);
  }

  /**
   * Establish remote connection
   */
  private async establishRemoteConnection(clientId: string): Promise<void> {
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (!collaborationService) return;

    // Get peer connection for client
    const peerConnection = collaborationService.getPeerConnection(clientId);
    if (!peerConnection) return;

    // Create data channel for remote control
    this.dataChannel = peerConnection.createDataChannel('remote_assistance', { ordered: true });
    
    this.dataChannel.onopen = () => {
      console.log('🔗 Remote control connection established');
    };

    this.dataChannel.onmessage = (event) => {
      const command = JSON.parse(event.data);
      this.handleRemoteCommand(command);
    };
  }

  /**
   * Send remote command
   */
  private sendRemoteCommand(type: string, data: any): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    const command = {
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.currentSession?.id
    };

    this.dataChannel.send(JSON.stringify(command));
  }

  /**
   * Handle received remote command
   */
  private handleRemoteCommand(command: any): void {
    if (!this.isClient) return;

    switch (command.type) {
      case 'cursor_move':
        this.updateRemoteCursor(command.data.x, command.data.y);
        break;
        
      case 'tile_click':
        this.simulateTileClick(command.data.tileId);
        break;
        
      case 'board_change':
        const appStore = (window as any).useAppStore?.getState();
        if (appStore) {
          appStore.setCurrentBoard(command.data.boardId);
        }
        break;
        
      case 'message':
        this.showAssistanceMessage(command.data);
        break;
        
      case 'audio_control':
        this.handleAudioControl(command.data);
        break;
    }
  }

  /**
   * Setup remote control event listeners
   */
  private setupRemoteControls(): void {
    if (typeof window === 'undefined') return;

    // Listen for mouse movements when providing assistance
    document.addEventListener('mousemove', (event) => {
      if (this.isAssistant && this.remoteControl?.isActive) {
        this.controlCursor(event.clientX, event.clientY);
      }
    });

    // Listen for clicks when providing assistance
    document.addEventListener('click', (event) => {
      if (this.isAssistant && this.remoteControl?.permissions.canClickTiles) {
        const target = event.target as HTMLElement;
        const tileElement = target.closest('[data-tile-id]');
        
        if (tileElement) {
          const tileId = tileElement.getAttribute('data-tile-id');
          const boardId = tileElement.getAttribute('data-board-id');
          
          if (tileId && boardId) {
            this.remoteClickTile(tileId, boardId);
          }
        }
      }
    });
  }

  /**
   * Create remote cursor element
   */
  private createRemoteCursor(): void {
    if (typeof document === 'undefined') return;

    this.cursorElement = document.createElement('div');
    this.cursorElement.id = 'remote-cursor';
    this.cursorElement.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      background: #ff6b6b;
      border: 2px solid white;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      display: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    // Add assistant label
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff6b6b;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
    `;
    label.textContent = 'Assistant';

    this.cursorElement.appendChild(label);
    document.body.appendChild(this.cursorElement);
  }

  /**
   * Update remote cursor position
   */
  private updateRemoteCursor(x: number, y: number): void {
    if (!this.cursorElement) return;

    this.remoteCursor = { x, y, visible: true };
    this.cursorElement.style.left = x + 'px';
    this.cursorElement.style.top = y + 'px';
    this.cursorElement.style.display = 'block';

    // Hide cursor after inactivity
    setTimeout(() => {
      if (this.cursorElement) {
        this.cursorElement.style.display = 'none';
      }
    }, 3000);
  }

  /**
   * Hide remote cursor
   */
  private hideCursor(): void {
    if (this.cursorElement) {
      this.cursorElement.style.display = 'none';
    }
  }

  /**
   * Simulate tile click
   */
  private simulateTileClick(tileId: string): void {
    const tileElement = document.querySelector(`[data-tile-id="${tileId}"]`) as HTMLElement;
    if (tileElement) {
      tileElement.click();
      
      // Visual feedback for remote click
      tileElement.style.transform = 'scale(0.95)';
      setTimeout(() => {
        tileElement.style.transform = '';
      }, 150);
    }
  }

  /**
   * Show assistance message
   */
  private showAssistanceMessage(messageData: any): void {
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    const icon = messageData.type === 'instruction' ? '👉' : 
                 messageData.type === 'encouragement' ? '🌟' : 'ℹ️';

    messageElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${icon}</span>
        <div>
          <div style="font-weight: bold; font-size: 12px; opacity: 0.8;">Assistant</div>
          <div>${messageData.message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(messageElement);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  }

  /**
   * Handle audio control
   */
  private handleAudioControl(data: any): void {
    const speechService = (window as any).moduleSystem?.get('SpeechService');
    
    switch (data.action) {
      case 'play':
        if (speechService) {
          speechService.speak('Assistant is helping you');
        }
        break;
        
      case 'pause':
        if (speechService) {
          speechService.stop();
        }
        break;
        
      case 'volume':
        // Adjust system volume if possible
        console.log('Volume control requested:', data.value);
        break;
    }
  }

  /**
   * Log activity
   */
  private logActivity(type: string, data: any): void {
    if (!this.currentSession) return;

    const activity: RemoteActivity = {
      timestamp: new Date().toISOString(),
      type: type as any,
      userId: this.isAssistant ? this.currentSession.assistantId : this.currentSession.clientId,
      data
    };

    this.currentSession.activities.push(activity);
  }

  /**
   * Find session by ID
   */
  private async findSession(sessionId: string): Promise<RemoteSession | null> {
    // In production, this would query a database
    // For now, return the current session if it matches
    return this.currentSession?.id === sessionId ? this.currentSession : null;
  }

  /**
   * Get current assistance session
   */
  getCurrentSession(): RemoteSession | null {
    return this.currentSession;
  }

  /**
   * Check if currently providing assistance
   */
  isProvidingAssistance(): boolean {
    return this.isAssistant && this.currentSession?.status === 'active';
  }

  /**
   * Check if currently receiving assistance
   */
  isReceivingAssistance(): boolean {
    return this.isClient && this.currentSession?.status === 'active';
  }

  /**
   * Get assistance permissions
   */
  getAssistancePermissions(): RemotePermissions | null {
    return this.remoteControl?.permissions || null;
  }

  /**
   * Update assistance permissions
   */
  updatePermissions(permissions: Partial<RemotePermissions>): void {
    if (!this.currentSession || !this.isClient) return;

    this.currentSession.permissions = { ...this.currentSession.permissions, ...permissions };
    
    if (this.remoteControl) {
      this.remoteControl.permissions = this.currentSession.permissions;
    }

    // Notify assistant of permission changes
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'permissions_updated',
        sessionId: this.currentSession.id,
        permissions: this.currentSession.permissions
      });
    }
  }
}

// Export singleton getter function
export function getRemoteAssistanceService(): RemoteAssistanceService {
  return RemoteAssistanceService.getInstance();
}