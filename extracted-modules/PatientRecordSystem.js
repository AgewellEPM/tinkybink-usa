class PatientRecordSystem {
      constructor() {
        this.patients = this.loadData('patients') || [];
        this.sessions = this.loadData('sessions') || [];
        this.activities = this.loadData('activities') || [];
        this.billingEvents = this.loadData('billingEvents') || [];
        this.exports = this.loadData('exports') || [];
      }
      
      // Patient Management
      addPatient(patientData) {
        const patient = {
          id: 'PT' + Date.now(),
          patientId: patientData.patientId || this.generatePatientId(),
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          dateOfBirth: patientData.dateOfBirth,
          contactInfo: {
            phone: patientData.phone || '',
            email: patientData.email || '',
            address: patientData.address || '',
            emergencyContact: patientData.emergencyContact || ''
          },
          assignedTherapist: patientData.therapist || 'default_therapist',
          diagnoses: patientData.diagnoses || [],
          therapyGoals: patientData.goals || [],
          insuranceProvider: {
            primary: patientData.primaryInsurance || '',
            secondary: patientData.secondaryInsurance || '',
            memberId: patientData.memberId || '',
            groupId: patientData.groupId || ''
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };
        
        this.patients.push(patient);
        this.saveData('patients', this.patients);
        return patient;
      }
      
      updatePatient(patientId, updates) {
        const index = this.patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
          this.patients[index] = { ...this.patients[index], ...updates, updatedAt: new Date().toISOString() };
          this.saveData('patients', this.patients);
          return this.patients[index];
        }
        return null;
      }
      
      getPatient(patientId) {
        return this.patients.find(p => p.id === patientId);
      }
      
      getAllPatients() {
        return this.patients;
      }
      
      // Session Management
      addSession(sessionData) {
        const session = {
          id: 'SS' + Date.now(),
          patientId: sessionData.patientId,
          therapistId: sessionData.therapistId || 'default_therapist',
          sessionDate: sessionData.date || new Date().toISOString(),
          duration: sessionData.duration || 30,
          sessionType: sessionData.type || 'individual_therapy',
          goals: sessionData.goals || [],
          activities: sessionData.activities || [],
          notes: sessionData.notes || '',
          cptCode: sessionData.cptCode || '92507',
          outcomes: sessionData.outcomes || {},
          billable: sessionData.billable !== false,
          status: 'completed',
          createdAt: new Date().toISOString()
        };
        
        this.sessions.push(session);
        this.saveData('sessions', this.sessions);
        return session;
      }
      
      getPatientSessions(patientId) {
        return this.sessions.filter(s => s.patientId === patientId);
      }
      
      // Activity Tracking
      logActivity(activityData) {
        const activity = {
          id: 'AC' + Date.now(),
          sessionId: activityData.sessionId,
          patientId: activityData.patientId,
          activityName: activityData.name,
          activityType: activityData.type || 'learning_game',
          startTime: activityData.startTime || new Date().toISOString(),
          endTime: activityData.endTime,
          duration: activityData.duration,
          score: activityData.score,
          accuracy: activityData.accuracy,
          responses: activityData.responses || [],
          cptCode: activityData.cptCode,
          billableUnits: Math.ceil((activityData.duration || 0) / 900), // 15-minute units
          metadata: activityData.metadata || {}
        };
        
        this.activities.push(activity);
        this.saveData('activities', this.activities);
        return activity;
      }
      
      // Billing Event Management
      createBillingEvent(eventData) {
        const billingEvent = {
          id: 'BE' + Date.now(),
          claimId: 'CLM-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6),
          patientId: eventData.patientId,
          sessionId: eventData.sessionId,
          serviceDate: eventData.serviceDate || new Date().toISOString().split('T')[0],
          cptCode: eventData.cptCode,
          cptDescription: eventData.cptDescription,
          units: eventData.units || 1,
          rate: eventData.rate || 65.00,
          totalAmount: (eventData.rate || 65.00) * (eventData.units || 1),
          diagnosisCodes: eventData.diagnosisCodes || [],
          providerNPI: eventData.providerNPI || '1234567890',
          facilityNPI: eventData.facilityNPI || '0987654321',
          insuranceInfo: eventData.insuranceInfo || {},
          status: 'ready_to_submit',
          submittedAt: null,
          paidAt: null,
          createdAt: new Date().toISOString()
        };
        
        this.billingEvents.push(billingEvent);
        this.saveData('billingEvents', this.billingEvents);
        return billingEvent;
      }
      
      // Data persistence
      saveData(key, data) {
        try {
          localStorage.setItem('tinkyBink_' + key, JSON.stringify(data));
          // Also save to IndexedDB for better persistence
          this.saveToIndexedDB(key, data);
        } catch (error) {
          console.error('Error saving data:', error);
        }
      }
      
      loadData(key) {
        try {
          const data = localStorage.getItem('tinkyBink_' + key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.error('Error loading data:', error);
          return null;
        }
      }
      
      // IndexedDB for better persistence
      async saveToIndexedDB(key, data) {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open('TinkyBinkDB', 1);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['healthData'], 'readwrite');
            const store = transaction.objectStore('healthData');
            store.put({ key, data, timestamp: new Date().toISOString() });
            transaction.oncomplete = () => resolve();
          };
          
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('healthData')) {
              db.createObjectStore('healthData', { keyPath: 'key' });
            }
          };
        });
      }
      
      generatePatientId() {
        const prefix = 'TB';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return prefix + timestamp + random;
      }
    }
    
    // 2. Insurance & Clearinghouse Integration