class BillingService {
      constructor() {
        this.cptCodes = new Map();
        this.hcpcsCodes = new Map();
        this.sessions = [];
        this.initialize();
      }
      
      initialize() {
        this.setupBillingCodes();
        console.log('Billing Service initialized with Medicare/Medicaid codes');
      }
      
      setupBillingCodes() {
        // Speech-Language Pathology CPT Codes
        this.cptCodes.set('92507', {
          code: '92507',
          description: 'Treatment of speech, language, voice, communication, and/or auditory processing disorder; individual',
          category: 'SLP',
          medicareRate: 85.50,
          medicaidRate: 78.25,
          duration: 15,
          modifiers: ['59', 'GP', 'GN']
        });
        
        this.cptCodes.set('92508', {
          code: '92508',
          description: 'Treatment of speech, language, voice, communication, and/or auditory processing disorder; group',
          category: 'SLP',
          medicareRate: 42.75,
          medicaidRate: 39.10,
          duration: 15,
          modifiers: ['59', 'GP', 'GN']
        });
        
        // Occupational Therapy CPT Codes
        this.cptCodes.set('97165', {
          code: '97165',
          description: 'Occupational therapy evaluation, low complexity',
          category: 'OT',
          medicareRate: 92.33,
          medicaidRate: 84.50,
          duration: 30,
          modifiers: ['GP', 'GO']
        });
        
        this.cptCodes.set('97166', {
          code: '97166',
          description: 'Occupational therapy evaluation, moderate complexity',
          category: 'OT',
          medicareRate: 137.84,
          medicaidRate: 126.15,
          duration: 45,
          modifiers: ['GP', 'GO']
        });
        
        this.cptCodes.set('97167', {
          code: '97167',
          description: 'Occupational therapy evaluation, high complexity',
          category: 'OT',
          medicareRate: 184.45,
          medicaidRate: 168.80,
          duration: 60,
          modifiers: ['GP', 'GO']
        });
        
        // Therapeutic Activities
        this.cptCodes.set('97530', {
          code: '97530',
          description: 'Therapeutic activities, direct patient contact',
          category: 'Therapy',
          medicareRate: 68.25,
          medicaidRate: 62.45,
          duration: 15,
          modifiers: ['GP', 'GN', 'GO']
        });
        
        // AAC Device Training
        this.cptCodes.set('92609', {
          code: '92609',
          description: 'Therapeutic services for the use of speech-generating device, including programming and modification',
          category: 'AAC',
          medicareRate: 95.75,
          medicaidRate: 87.65,
          duration: 15,
          modifiers: ['GP', 'GN']
        });
        
        // HCPCS Codes for AAC Devices
        this.hcpcsCodes.set('E2500', {
          code: 'E2500',
          description: 'Speech generating device, digitized speech, using pre-recorded messages',
          category: 'DME',
          medicareRate: 1250.00,
          medicaidRate: 1150.00,
          rental: false
        });
        
        this.hcpcsCodes.set('E2502', {
          code: 'E2502',
          description: 'Speech generating device, digitized speech, using pre-recorded messages, multiple methods',
          category: 'DME',
          medicareRate: 2850.00,
          medicaidRate: 2610.00,
          rental: false
        });
      }
      
      createSession(patientId, providerId, serviceType, duration, notes) {
        const hipaa = moduleSystem.get('HIPAAService');
        const session = {
          sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          patientId: patientId,
          providerId: providerId,
          serviceType: serviceType,
          startTime: new Date().toISOString(),
          duration: duration,
          notes: notes,
          billingStatus: 'pending',
          cptCode: this.getCPTCode(serviceType),
          created: new Date().toISOString()
        };
        
        // Encrypt session data
        const encryptedSession = hipaa.encrypt(session);
        this.sessions.push(encryptedSession);
        
        hipaa.logAccess('session_created', `Session created for patient ${patientId}`);
        this.saveToStorage();
        return session.sessionId;
      }
      
      getCPTCode(serviceType) {
        const codeMap = {
          'individual_slp': '92507',
          'group_slp': '92508',
          'ot_eval_low': '97165',
          'ot_eval_mod': '97166',
          'ot_eval_high': '97167',
          'therapeutic_activity': '97530',
          'aac_training': '92609'
        };
        return codeMap[serviceType] || '92507';
      }
      
      generateClaim(sessionId, insuranceType = 'medicare') {
        const hipaa = moduleSystem.get('HIPAAService');
        const session = this.getSession(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }
        
        const cptInfo = this.cptCodes.get(session.cptCode);
        const rate = insuranceType === 'medicare' ? cptInfo.medicareRate : cptInfo.medicaidRate;
        
        const claim = {
          claimId: 'claim_' + Date.now(),
          sessionId: sessionId,
          patientId: session.patientId,
          providerId: session.providerId,
          serviceDate: session.startTime.split('T')[0],
          cptCode: session.cptCode,
          description: cptInfo.description,
          units: Math.ceil(session.duration / cptInfo.duration),
          rate: rate,
          totalCharge: rate * Math.ceil(session.duration / cptInfo.duration),
          insuranceType: insuranceType,
          modifiers: cptInfo.modifiers,
          diagnosisCodes: ['F80.9'], // Communication disorder, unspecified
          created: new Date().toISOString()
        };
        
        hipaa.logAccess('claim_generated', `Claim generated for session ${sessionId}`);
        return claim;
      }
      
      getSession(sessionId) {
        const hipaa = moduleSystem.get('HIPAAService');
        const encryptedSession = this.sessions.find(s => {
          try {
            const decrypted = hipaa.decrypt(s);
            return decrypted.sessionId === sessionId;
          } catch (error) {
            return false;
          }
        });
        
        if (encryptedSession) {
          return hipaa.decrypt(encryptedSession);
        }
        return null;
      }
      
      getBillingReport(startDate, endDate, insuranceType = 'all') {
        const hipaa = moduleSystem.get('HIPAAService');
        const sessions = this.sessions.map(s => hipaa.decrypt(s))
          .filter(session => {
            const sessionDate = new Date(session.startTime);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return sessionDate >= start && sessionDate <= end;
          });
        
        const totalSessions = sessions.length;
        const totalRevenue = sessions.reduce((sum, session) => {
          const cptInfo = this.cptCodes.get(session.cptCode);
          const rate = insuranceType === 'medicare' ? cptInfo.medicareRate : cptInfo.medicaidRate;
          return sum + (rate * Math.ceil(session.duration / cptInfo.duration));
        }, 0);
        
        hipaa.logAccess('billing_report', `Report generated: ${totalSessions} sessions, $${totalRevenue}`);
        
        return {
          startDate,
          endDate,
          totalSessions,
          totalRevenue,
          sessions: sessions.map(s => ({
            sessionId: s.sessionId,
            patientId: s.patientId,
            serviceType: s.serviceType,
            duration: s.duration,
            cptCode: s.cptCode,
            estimatedRevenue: this.calculateSessionRevenue(s, insuranceType)
          }))
        };
      }
      
      calculateSessionRevenue(session, insuranceType) {
        const cptInfo = this.cptCodes.get(session.cptCode);
        const rate = insuranceType === 'medicare' ? cptInfo.medicareRate : cptInfo.medicaidRate;
        return rate * Math.ceil(session.duration / cptInfo.duration);
      }
      
      saveToStorage() {
        const hipaa = moduleSystem.get('HIPAAService');
        const encrypted = hipaa.encrypt(this.sessions);
        localStorage.setItem('billing_sessions', encrypted);
      }
      
      loadFromStorage() {
        const hipaa = moduleSystem.get('HIPAAService');
        try {
          const encrypted = localStorage.getItem('billing_sessions');
          if (encrypted) {
            this.sessions = hipaa.decrypt(encrypted);
          }
        } catch (error) {
          console.error('Failed to load billing sessions:', error);
          this.sessions = [];
        }
      }
    }