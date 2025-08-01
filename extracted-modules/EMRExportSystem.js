class EMRExportSystem {
      constructor() {
        this.exportFormats = {
          epic: { type: 'HL7_FHIR', version: 'R4' },
          cerner: { type: 'HL7_CDA', version: '3.0' },
          csv: { type: 'CSV', delimiter: ',' },
          pdf: { type: 'PDF', template: 'clinical' }
        };
      }
      
      // Export session notes
      exportSessionNotes(sessionId, format = 'csv') {
        const session = healthcareDB.sessions.find(s => s.id === sessionId);
        const patient = healthcareDB.getPatient(session?.patientId);
        const activities = healthcareDB.activities.filter(a => a.sessionId === sessionId);
        
        switch (format) {
          case 'epic':
            return this.generateFHIRBundle(session, patient, activities);
          case 'cerner':
            return this.generateHL7CDA(session, patient, activities);
          case 'csv':
            return this.generateCSVExport(session, patient, activities);
          case 'pdf':
            return this.generatePDFReport(session, patient, activities);
          default:
            throw new Error('Unsupported export format: ' + format);
        }
      }
      
      // Generate FHIR bundle for Epic integration
      generateFHIRBundle(session, patient, activities) {
        return {
          resourceType: 'Bundle',
          id: session.id,
          type: 'document',
          timestamp: new Date().toISOString(),
          entry: [
            {
              resource: {
                resourceType: 'Patient',
                id: patient.id,
                name: [{ family: patient.lastName, given: [patient.firstName] }],
                birthDate: patient.dateOfBirth,
                identifier: [{ value: patient.patientId }]
              }
            },
            {
              resource: {
                resourceType: 'Encounter',
                id: session.id,
                status: 'finished',
                class: { code: 'AMB', display: 'ambulatory' },
                subject: { reference: 'Patient/' + patient.id },
                period: {
                  start: session.sessionDate,
                  end: new Date(new Date(session.sessionDate).getTime() + session.duration * 60000).toISOString()
                }
              }
            },
            {
              resource: {
                resourceType: 'Procedure',
                id: 'proc-' + session.id,
                status: 'completed',
                code: {
                  coding: [{
                    system: 'http://www.ama-assn.org/go/cpt',
                    code: session.cptCode,
                    display: 'Speech therapy session'
                  }]
                },
                subject: { reference: 'Patient/' + patient.id },
                performedDateTime: session.sessionDate,
                note: [{ text: session.notes || 'Therapy session completed successfully' }]
              }
            }
          ]
        };
      }
      
      // Generate CSV export
      generateCSVExport(session, patient, activities) {
        const headers = ['Patient_ID', 'Session_Date', 'Duration', 'CPT_Code', 'Activities', 'Score', 'Notes'];
        const activitySummary = activities.map(a => `${a.activityName}(${a.score}%)`).join(';');
        const avgScore = activities.length > 0 ? Math.round(activities.reduce((sum, a) => sum + (a.score || 0), 0) / activities.length) : 0;
        
        const csvRow = [
          patient.patientId,
          session.sessionDate.split('T')[0],
          session.duration + ' min',
          session.cptCode,
          activitySummary,
          avgScore + '%',
          '"' + (session.notes || '').replace(/"/g, '""') + '"'
        ];
        
        return {
          format: 'csv',
          headers: headers.join(','),
          data: csvRow.join(','),
          filename: `session_${session.id}_${new Date().toISOString().split('T')[0]}.csv`
        };
      }
      
      // Bulk export for EMR systems
      exportPatientData(patientId, format = 'fhir') {
        const patient = healthcareDB.getPatient(patientId);
        const sessions = healthcareDB.getPatientSessions(patientId);
        const activities = healthcareDB.activities.filter(a => a.patientId === patientId);
        const billingEvents = healthcareDB.billingEvents.filter(b => b.patientId === patientId);
        
        return {
          patient,
          sessions,
          activities,
          billingEvents,
          exportedAt: new Date().toISOString(),
          format,
          totalSessions: sessions.length,
          totalActivities: activities.length,
          totalBilled: billingEvents.reduce((sum, be) => sum + be.totalAmount, 0)
        };
      }
    }
    
    // 4. Payment Processing System