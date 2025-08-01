class PatientService {
      constructor() {
        this.patients = new Map();
        this.initialize();
      }
      
      initialize() {
        this.loadFromStorage();
        console.log('Patient Service initialized');
      }
      
      createPatient(patientData) {
        const hipaa = moduleSystem.get('HIPAAService');
        
        // Validate required fields
        const required = ['firstName', 'lastName', 'dateOfBirth', 'insuranceType'];
        for (const field of required) {
          if (!patientData[field]) {
            throw new Error(`Required field missing: ${field}`);
          }
        }
        
        const patientId = 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const patient = {
          patientId,
          ...patientData,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          active: true
        };
        
        // Encrypt patient data
        const encryptedPatient = hipaa.encrypt(patient);
        this.patients.set(patientId, encryptedPatient);
        
        hipaa.logAccess('patient_created', `Patient created: ${patientId}`);
        this.saveToStorage();
        return patientId;
      }
      
      getPatient(patientId) {
        const hipaa = moduleSystem.get('HIPAAService');
        const encryptedPatient = this.patients.get(patientId);
        
        if (!encryptedPatient) {
          return null;
        }
        
        try {
          const patient = hipaa.decrypt(encryptedPatient);
          hipaa.logAccess('patient_accessed', `Patient accessed: ${patientId}`);
          return patient;
        } catch (error) {
          hipaa.logAccess('patient_access_error', `Failed to access patient: ${patientId}`);
          return null;
        }
      }
      
      updatePatient(patientId, updates) {
        const hipaa = moduleSystem.get('HIPAAService');
        const patient = this.getPatient(patientId);
        
        if (!patient) {
          throw new Error('Patient not found');
        }
        
        const updatedPatient = {
          ...patient,
          ...updates,
          lastModified: new Date().toISOString()
        };
        
        const encryptedPatient = hipaa.encrypt(updatedPatient);
        this.patients.set(patientId, encryptedPatient);
        
        hipaa.logAccess('patient_updated', `Patient updated: ${patientId}`);
        this.saveToStorage();
        return updatedPatient;
      }
      
      searchPatients(query) {
        const hipaa = moduleSystem.get('HIPAAService');
        const results = [];
        
        for (const [patientId, encryptedPatient] of this.patients) {
          try {
            const patient = hipaa.decrypt(encryptedPatient);
            const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
            
            if (fullName.includes(query.toLowerCase()) || 
                patient.patientId.includes(query) ||
                (patient.mrn && patient.mrn.includes(query))) {
              results.push({
                patientId: patient.patientId,
                firstName: patient.firstName,
                lastName: patient.lastName,
                dateOfBirth: patient.dateOfBirth,
                insuranceType: patient.insuranceType
              });
            }
          } catch (error) {
            // Skip corrupted entries
            continue;
          }
        }
        
        hipaa.logAccess('patient_search', `Search performed: "${query}", ${results.length} results`);
        return results;
      }
      
      saveToStorage() {
        const hipaa = moduleSystem.get('HIPAAService');
        const patientsArray = Array.from(this.patients.entries());
        const encrypted = hipaa.encrypt(patientsArray);
        localStorage.setItem('patient_data', encrypted);
      }
      
      loadFromStorage() {
        const hipaa = moduleSystem.get('HIPAAService');
        try {
          const encrypted = localStorage.getItem('patient_data');
          if (encrypted) {
            const patientsArray = hipaa.decrypt(encrypted);
            this.patients = new Map(patientsArray);
          }
        } catch (error) {
          console.error('Failed to load patient data:', error);
          this.patients = new Map();
        }
      }
    }