class AuditService {
      constructor() {
        this.auditEvents = [];
        this.initialize();
      }
      
      initialize() {
        this.setupAuditTrail();
        console.log('Audit Service initialized');
      }
      
      setupAuditTrail() {
        // Monitor critical functions
        this.monitorUserActions();
        this.monitorDataAccess();
        this.monitorSystemEvents();
      }
      
      monitorUserActions() {
        // Track tile interactions for therapy sessions
        const originalSpeak = window.speak;
        window.speak = (text) => {
          this.logEvent('user_interaction', {
            action: 'speak',
            content: text,
            timestamp: new Date().toISOString()
          });
          return originalSpeak(text);
        };
      }
      
      monitorDataAccess() {
        // Already handled by HIPAAService
      }
      
      monitorSystemEvents() {
        window.addEventListener('beforeunload', () => {
          this.logEvent('session_end', {
            duration: Date.now() - this.sessionStart,
            timestamp: new Date().toISOString()
          });
        });
        
        this.sessionStart = Date.now();
        this.logEvent('session_start', {
          timestamp: new Date().toISOString()
        });
      }
      
      logEvent(eventType, eventData) {
        const hipaa = moduleSystem.get('HIPAAService');
        const auditEvent = {
          eventId: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          eventType,
          eventData,
          userId: hipaa.getCurrentUserId(),
          sessionId: hipaa.getSessionId(),
          timestamp: new Date().toISOString()
        };
        
        this.auditEvents.push(auditEvent);
        
        // Keep only last 500 events
        if (this.auditEvents.length > 500) {
          this.auditEvents = this.auditEvents.slice(-500);
        }
        
        this.saveAuditEvents();
      }
      
      getAuditReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const filteredEvents = this.auditEvents.filter(event => {
          const eventTime = new Date(event.timestamp);
          return eventTime >= start && eventTime <= end;
        });
        
        return {
          startDate,
          endDate,
          totalEvents: filteredEvents.length,
          events: filteredEvents,
          summary: this.generateAuditSummary(filteredEvents)
        };
      }
      
      generateAuditSummary(events) {
        const summary = {
          userInteractions: 0,
          dataAccesses: 0,
          systemEvents: 0,
          complianceEvents: 0
        };
        
        events.forEach(event => {
          switch (event.eventType) {
            case 'user_interaction':
              summary.userInteractions++;
              break;
            case 'patient_accessed':
            case 'patient_created':
            case 'patient_updated':
              summary.dataAccesses++;
              break;
            case 'session_start':
            case 'session_end':
              summary.systemEvents++;
              break;
            case 'compliance_check':
              summary.complianceEvents++;
              break;
          }
        });
        
        return summary;
      }
      
      saveAuditEvents() {
        const hipaa = moduleSystem.get('HIPAAService');
        const encrypted = hipaa.encrypt(this.auditEvents);
        localStorage.setItem('audit_events', encrypted);
      }
      
      loadAuditEvents() {
        const hipaa = moduleSystem.get('HIPAAService');
        try {
          const encrypted = localStorage.getItem('audit_events');
          if (encrypted) {
            this.auditEvents = hipaa.decrypt(encrypted);
          }
        } catch (error) {
          console.error('Failed to load audit events:', error);
          this.auditEvents = [];
        }
      }
    }