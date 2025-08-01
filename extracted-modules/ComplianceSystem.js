class ComplianceSystem {
      constructor() {
        this.regulations = {
          HIPAA: true,
          COPPA: true,
          FERPA: true,
          GDPR: true,
          CCPA: true,
          PIPEDA: true // Canadian privacy
        };
        this.auditLog = [];
        this.encryptionKey = this.generateEncryptionKey();
      }
      
      generateEncryptionKey() {
        // In production, use proper key management service
        return crypto.getRandomValues(new Uint8Array(32));
      }
      
      async encryptPHI(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        const key = await crypto.subtle.importKey(
          'raw',
          this.encryptionKey,
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          dataBuffer
        );
        
        return {
          encrypted: new Uint8Array(encrypted),
          iv
        };
      }
      
      async decryptPHI(encryptedData) {
        const key = await crypto.subtle.importKey(
          'raw',
          this.encryptionKey,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: encryptedData.iv },
          key,
          encryptedData.encrypted
        );
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
      }
      
      logActivity(activityType, details) {
        const entry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type: activityType,
          details,
          userId: window.authSystem?.getCurrentUser()?.id,
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent
        };
        
        this.auditLog.push(entry);
        
        // Store encrypted in database
        this.storeAuditEntry(entry);
        
        // Check for compliance violations
        this.checkCompliance(entry);
      }
      
      getClientIP() {
        // In production, get from server
        return 'xxx.xxx.xxx.xxx';
      }
      
      async storeAuditEntry(entry) {
        const encrypted = await this.encryptPHI(entry);
        
        // Store in secure database
        await fetch('/api/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authSystem?.getToken()}`
          },
          body: JSON.stringify(encrypted)
        });
      }
      
      checkCompliance(entry) {
        // HIPAA minimum necessary rule
        if (entry.type === 'patient_data_access') {
          this.validateMinimumNecessary(entry);
        }
        
        // COPPA parental consent
        if (entry.details.patientAge < 13 && !entry.details.parentalConsent) {
          this.flagViolation('COPPA', 'Missing parental consent');
        }
        
        // GDPR data retention
        if (this.regulations.GDPR) {
          this.checkDataRetention(entry);
        }
      }
      
      validateMinimumNecessary(entry) {
        const allowedRoles = ['therapist', 'supervisor', 'billing'];
        const userRole = entry.details.userRole;
        
        if (!allowedRoles.includes(userRole)) {
          this.flagViolation('HIPAA', 'Unauthorized access attempt');
        }
      }
      
      flagViolation(regulation, reason) {
        const violation = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          regulation,
          reason,
          severity: 'high'
        };
        
        // Alert compliance officer
        this.alertComplianceOfficer(violation);
        
        // Log violation
        this.logActivity('compliance_violation', violation);
      }
      
      alertComplianceOfficer(violation) {
        // Send email/SMS to compliance officer
        fetch('/api/alerts/compliance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(violation)
        });
      }
      
      async generateComplianceReport(dateRange) {
        const report = {
          generatedAt: new Date().toISOString(),
          dateRange,
          regulations: this.regulations,
          summary: {
            totalActivities: this.auditLog.length,
            violations: this.auditLog.filter(e => e.type === 'compliance_violation').length,
            dataBreaches: 0,
            unauthorizedAccess: this.auditLog.filter(e => e.type === 'unauthorized_access').length
          },
          recommendations: this.generateRecommendations()
        };
        
        return report;
      }
      
      generateRecommendations() {
        const recommendations = [];
        
        // Check password policy
        if (!window.authSystem?.hasStrongPasswordPolicy()) {
          recommendations.push('Implement stronger password requirements');
        }
        
        // Check encryption
        if (!this.isEncryptionCompliant()) {
          recommendations.push('Upgrade to AES-256 encryption');
        }
        
        // Check audit retention
        if (this.auditLog.length > 10000) {
          recommendations.push('Archive old audit logs');
        }
        
        return recommendations;
      }
      
      isEncryptionCompliant() {
        // Check if using appropriate encryption standards
        return true; // Simplified for demo
      }
      
      checkDataRetention(entry) {
        // GDPR requires data deletion after purpose fulfilled
        const retentionPeriods = {
          session_data: 90, // days
          patient_records: 7 * 365, // 7 years
          audit_logs: 3 * 365 // 3 years
        };
        
        // Check if data exceeds retention period
        const dataAge = (Date.now() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        const maxRetention = retentionPeriods[entry.type] || 365;
        
        if (dataAge > maxRetention) {
          this.scheduleDataDeletion(entry);
        }
      }
      
      scheduleDataDeletion(entry) {
        // Schedule deletion in compliance with regulations
        setTimeout(() => {
          this.deleteData(entry.id);
        }, 24 * 60 * 60 * 1000); // Delete after 24 hours
      }
      
      async deleteData(entryId) {
        // Secure deletion with audit trail
        this.logActivity('data_deletion', { entryId, reason: 'retention_policy' });
        
        // Remove from database
        await fetch(`/api/data/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${window.authSystem?.getToken()}`
          }
        });
      }
    }
    
    // Subscription Management System