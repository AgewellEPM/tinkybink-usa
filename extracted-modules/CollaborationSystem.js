class CollaborationSystem {
      constructor() {
        this.peers = new Map();
        this.localStream = null;
        this.dataChannels = new Map();
        this.collaborativeSessions = new Map();
        this.websocket = null;
        this.roomId = null;
        this.userId = null;
        this.iceServers = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ];
        this.initializeCollaboration();
      }
      
      initializeCollaboration() {
        // Set user ID from auth system
        if (window.authSystem && window.authSystem.isAuthenticated()) {
          this.userId = window.authSystem.getCurrentUser().id;
        }
      }
      
      async connectToCollaborationServer(serverUrl = 'wss://tinkybink-collab.herokuapp.com') {
        try {
          this.websocket = new WebSocket(serverUrl);
          
          this.websocket.onopen = () => {
            console.log('Connected to collaboration server');
            this.sendMessage({
              type: 'auth',
              userId: this.userId,
              token: window.authSystem.currentUser?.token
            });
          };
          
          this.websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
          };
          
          this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
          };
          
          this.websocket.onclose = () => {
            console.log('Disconnected from collaboration server');
            // Attempt reconnection after 5 seconds
            setTimeout(() => this.connectToCollaborationServer(serverUrl), 5000);
          };
        } catch (error) {
          console.error('Failed to connect to collaboration server:', error);
        }
      }
      
      async createSession(sessionType = 'therapy') {
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const session = {
          id: sessionId,
          type: sessionType,
          hostId: this.userId,
          participants: [this.userId],
          createdAt: new Date().toISOString(),
          sharedData: {},
          permissions: {
            [this.userId]: 'host'
          }
        };
        
        this.collaborativeSessions.set(sessionId, session);
        this.roomId = sessionId;
        
        this.sendMessage({
          type: 'create_session',
          session: session
        });
        
        return sessionId;
      }
      
      async joinSession(sessionId, role = 'participant') {
        this.roomId = sessionId;
        
        this.sendMessage({
          type: 'join_session',
          sessionId: sessionId,
          userId: this.userId,
          role: role
        });
        
        // Request current session state
        this.sendMessage({
          type: 'request_state',
          sessionId: sessionId
        });
      }
      
      async startVideoCall() {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          // Display local video
          this.displayLocalVideo();
          
          // Notify other participants
          this.sendMessage({
            type: 'video_call_started',
            userId: this.userId,
            roomId: this.roomId
          });
          
          return true;
        } catch (error) {
          console.error('Failed to start video call:', error);
          return false;
        }
      }
      
      displayLocalVideo() {
        const videoContainer = document.createElement('div');
        videoContainer.id = 'collaborationVideoContainer';
        videoContainer.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 300px;
          height: 200px;
          background: black;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          z-index: 1000;
        `;
        
        const localVideo = document.createElement('video');
        localVideo.id = 'localVideo';
        localVideo.srcObject = this.localStream;
        localVideo.autoplay = true;
        localVideo.muted = true;
        localVideo.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
        `;
        
        const controls = document.createElement('div');
        controls.style.cssText = `
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
        `;
        
        controls.innerHTML = `
          <button onclick="window.collaboration.toggleAudio()" style="padding: 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white;">🎤</button>
          <button onclick="window.collaboration.toggleVideo()" style="padding: 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white;">📹</button>
          <button onclick="window.collaboration.endCall()" style="padding: 8px; background: #ff4444; border: none; border-radius: 50%; color: white;">📞</button>
        `;
        
        videoContainer.appendChild(localVideo);
        videoContainer.appendChild(controls);
        document.body.appendChild(videoContainer);
      }
      
      async createPeerConnection(peerId) {
        const pc = new RTCPeerConnection({ iceServers: this.iceServers });
        
        // Add local stream tracks
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
          });
        }
        
        // Handle remote stream
        pc.ontrack = (event) => {
          this.displayRemoteVideo(peerId, event.streams[0]);
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendMessage({
              type: 'ice_candidate',
              candidate: event.candidate,
              to: peerId,
              from: this.userId
            });
          }
        };
        
        // Create data channel for real-time data sync
        const dataChannel = pc.createDataChannel('collaboration', {
          ordered: true
        });
        
        dataChannel.onopen = () => {
          console.log('Data channel opened with', peerId);
          this.dataChannels.set(peerId, dataChannel);
        };
        
        dataChannel.onmessage = (event) => {
          this.handleDataChannelMessage(peerId, event.data);
        };
        
        pc.ondatachannel = (event) => {
          const channel = event.channel;
          channel.onmessage = (event) => {
            this.handleDataChannelMessage(peerId, event.data);
          };
          this.dataChannels.set(peerId, channel);
        };
        
        this.peers.set(peerId, pc);
        return pc;
      }
      
      displayRemoteVideo(peerId, stream) {
        let remoteVideo = document.getElementById(`remoteVideo_${peerId}`);
        if (!remoteVideo) {
          remoteVideo = document.createElement('video');
          remoteVideo.id = `remoteVideo_${peerId}`;
          remoteVideo.autoplay = true;
          remoteVideo.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 200px;
            height: 150px;
            background: black;
            border-radius: 8px;
            object-fit: cover;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          `;
          document.body.appendChild(remoteVideo);
        }
        remoteVideo.srcObject = stream;
      }
      
      async handleServerMessage(message) {
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
          case 'session_state':
            this.handleSessionState(message);
            break;
          case 'sync_data':
            this.handleSyncData(message);
            break;
          case 'cursor_position':
            this.handleCursorPosition(message);
            break;
          case 'board_update':
            this.handleBoardUpdate(message);
            break;
        }
      }
      
      async handleUserJoined(message) {
        const { userId } = message;
        if (userId !== this.userId) {
          // Create peer connection and send offer
          const pc = await this.createPeerConnection(userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          this.sendMessage({
            type: 'offer',
            offer: offer,
            to: userId,
            from: this.userId
          });
          
          // Show notification
          this.showCollaborationNotification(`${message.userName || userId} joined the session`);
        }
      }
      
      handleUserLeft(message) {
        const { userId } = message;
        
        // Clean up peer connection
        const pc = this.peers.get(userId);
        if (pc) {
          pc.close();
          this.peers.delete(userId);
        }
        
        // Remove remote video
        const remoteVideo = document.getElementById(`remoteVideo_${userId}`);
        if (remoteVideo) {
          remoteVideo.remove();
        }
        
        // Remove data channel
        this.dataChannels.delete(userId);
        
        // Show notification
        this.showCollaborationNotification(`${message.userName || userId} left the session`);
      }
      
      async handleOffer(message) {
        const { from, offer } = message;
        
        const pc = await this.createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.sendMessage({
          type: 'answer',
          answer: answer,
          to: from,
          from: this.userId
        });
      }
      
      async handleAnswer(message) {
        const { from, answer } = message;
        const pc = this.peers.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      }
      
      async handleIceCandidate(message) {
        const { from, candidate } = message;
        const pc = this.peers.get(from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      
      handleSessionState(message) {
        const { session } = message;
        this.collaborativeSessions.set(session.id, session);
        
        // Update UI based on session state
        if (session.sharedData.currentBoard) {
          // Load shared board
          this.loadSharedBoard(session.sharedData.currentBoard);
        }
      }
      
      handleSyncData(message) {
        const { data, timestamp, userId } = message;
        
        // Apply remote changes
        if (data.type === 'tile_update') {
          this.applyTileUpdate(data);
        } else if (data.type === 'board_change') {
          this.applyBoardChange(data);
        } else if (data.type === 'settings_update') {
          this.applySettingsUpdate(data);
        }
        
        // Show real-time indicator
        this.showActivityIndicator(userId, data.type);
      }
      
      handleCursorPosition(message) {
        const { userId, x, y } = message;
        this.updateRemoteCursor(userId, x, y);
      }
      
      handleBoardUpdate(message) {
        const { boardData, userId } = message;
        
        // Update board if not the sender
        if (userId !== this.userId) {
          this.updateSharedBoard(boardData);
        }
      }
      
      sendMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(JSON.stringify(message));
        }
      }
      
      broadcastToDataChannels(data) {
        const message = JSON.stringify(data);
        this.dataChannels.forEach((channel, peerId) => {
          if (channel.readyState === 'open') {
            channel.send(message);
          }
        });
      }
      
      // Collaboration UI Features
      showCollaborationNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'collab-notification';
        notification.textContent = message;
        notification.style.cssText = `
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(123, 63, 242, 0.9);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          animation: slideDown 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideUp 0.3s ease-out';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
      
      updateRemoteCursor(userId, x, y) {
        let cursor = document.getElementById(`cursor_${userId}`);
        if (!cursor) {
          cursor = document.createElement('div');
          cursor.id = `cursor_${userId}`;
          cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: rgba(123, 63, 242, 0.5);
            border: 2px solid var(--primary-color);
            border-radius: 50%;
            pointer-events: none;
            transition: all 0.1s ease-out;
            z-index: 9999;
          `;
          
          const label = document.createElement('span');
          label.style.cssText = `
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
          `;
          label.textContent = userId.substr(0, 8);
          cursor.appendChild(label);
          
          document.body.appendChild(cursor);
        }
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        
        // Remove cursor after inactivity
        clearTimeout(cursor.removeTimeout);
        cursor.removeTimeout = setTimeout(() => cursor.remove(), 5000);
      }
      
      showActivityIndicator(userId, activityType) {
        const indicator = document.createElement('div');
        indicator.className = 'activity-indicator';
        indicator.innerHTML = `
          <span class="user-avatar">${userId.charAt(0).toUpperCase()}</span>
          <span class="activity-text">${activityType.replace('_', ' ')}</span>
        `;
        indicator.style.cssText = `
          position: fixed;
          bottom: 100px;
          left: 20px;
          background: rgba(26, 26, 26, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: fadeIn 0.3s ease-out;
        `;
        
        const avatar = indicator.querySelector('.user-avatar');
        avatar.style.cssText = `
          width: 24px;
          height: 24px;
          background: var(--primary-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
          indicator.style.animation = 'fadeOut 0.3s ease-out';
          setTimeout(() => indicator.remove(), 300);
        }, 2000);
      }
      
      // Collaboration Actions
      shareTileAction(tileId, action) {
        const data = {
          type: 'tile_action',
          tileId: tileId,
          action: action,
          timestamp: Date.now(),
          userId: this.userId
        };
        
        this.broadcastToDataChannels(data);
        this.sendMessage({
          type: 'sync_data',
          data: data,
          roomId: this.roomId
        });
      }
      
      shareBoardUpdate(boardData) {
        const data = {
          type: 'board_update',
          boardData: boardData,
          timestamp: Date.now(),
          userId: this.userId
        };
        
        this.broadcastToDataChannels(data);
        this.sendMessage({
          type: 'board_update',
          ...data,
          roomId: this.roomId
        });
      }
      
      shareSettingsUpdate(settings) {
        const data = {
          type: 'settings_update',
          settings: settings,
          timestamp: Date.now(),
          userId: this.userId
        };
        
        this.broadcastToDataChannels(data);
        this.sendMessage({
          type: 'sync_data',
          data: data,
          roomId: this.roomId
        });
      }
      
      // Track mouse movement for cursor sharing
      startCursorSharing() {
        let lastUpdate = 0;
        document.addEventListener('mousemove', (e) => {
          const now = Date.now();
          if (now - lastUpdate > 100) { // Throttle to 10 updates per second
            this.sendMessage({
              type: 'cursor_position',
              x: e.clientX,
              y: e.clientY,
              userId: this.userId,
              roomId: this.roomId
            });
            lastUpdate = now;
          }
        });
      }
      
      // Handoff system for therapy sessions
      async initiateHandoff(targetTherapistId) {
        const handoffData = {
          fromTherapist: this.userId,
          toTherapist: targetTherapistId,
          sessionId: this.roomId,
          patientData: this.getCurrentPatientData(),
          sessionNotes: this.getSessionNotes(),
          timestamp: new Date().toISOString()
        };
        
        this.sendMessage({
          type: 'handoff_request',
          data: handoffData,
          to: targetTherapistId
        });
        
        return handoffData;
      }
      
      getCurrentPatientData() {
        // Get current patient context
        return {
          patientId: window.currentPatientId,
          currentBoard: window.currentBoard,
          sessionDuration: window.sessionTimer?.duration || 0,
          activitiesCompleted: window.analyticsService?.sessionActivities || []
        };
      }
      
      getSessionNotes() {
        // Get therapist notes from current session
        const notes = document.getElementById('therapistNotes')?.value || '';
        return notes;
      }
      
      // Cleanup
      toggleAudio() {
        const audioTrack = this.localStream?.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          return audioTrack.enabled;
        }
      }
      
      toggleVideo() {
        const videoTrack = this.localStream?.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoTrack.enabled;
          return videoTrack.enabled;
        }
      }
      
      endCall() {
        // Stop local stream
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Close all peer connections
        this.peers.forEach((pc, peerId) => {
          pc.close();
        });
        this.peers.clear();
        
        // Remove video elements
        document.getElementById('collaborationVideoContainer')?.remove();
        document.querySelectorAll('[id^="remoteVideo_"]').forEach(el => el.remove());
        
        // Notify server
        this.sendMessage({
          type: 'end_call',
          userId: this.userId,
          roomId: this.roomId
        });
      }
      
      disconnect() {
        this.endCall();
        this.websocket?.close();
        this.dataChannels.clear();
        this.collaborativeSessions.clear();
      }
    }
    
    // Initialize collaboration system
    window.collaboration = new CollaborationSystem();
    
    // Advanced Analytics & AI System