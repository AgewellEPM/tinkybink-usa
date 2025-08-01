class BillingInsuranceManager {
      constructor() {
        this.patients = this.loadPatients();
        this.claims = this.loadClaims();
        this.sessions = this.loadSessions();
        this.insurance = window.HealthcareSystem.insurance;
        this.payment = window.HealthcareSystem.payment;
        this.initializeData();
      }
      
      loadPatients() {
        // Load from localStorage or generate demo data
        const stored = localStorage.getItem('tinkybink_patients');
        if (stored) return JSON.parse(stored);
        
        // Generate demo patients
        const patients = [
          {
            id: 'P001',
            name: 'Emily Johnson',
            dob: '2015-03-15',
            insurance: 'Blue Cross Blue Shield',
            insuranceId: 'BCBS123456789',
            diagnosis: 'F84.0',
            therapist: 'Dr. Sarah Miller',
            status: 'active',
            sessionsPerWeek: 3,
            copay: 25
          },
          {
            id: 'P002',
            name: 'Michael Chen',
            dob: '2016-07-22',
            insurance: 'Aetna',
            insuranceId: 'AET987654321',
            diagnosis: 'F84.0',
            therapist: 'Dr. Sarah Miller',
            status: 'active',
            sessionsPerWeek: 2,
            copay: 30
          },
          {
            id: 'P003',
            name: 'Sophia Rodriguez',
            dob: '2014-11-08',
            insurance: 'United Healthcare',
            insuranceId: 'UHC456789123',
            diagnosis: 'F84.0',
            therapist: 'Dr. James Wilson',
            status: 'active',
            sessionsPerWeek: 4,
            copay: 20
          },
          {
            id: 'P004',
            name: 'Liam Thompson',
            dob: '2017-02-28',
            insurance: 'Cigna',
            insuranceId: 'CIG789123456',
            diagnosis: 'F84.0',
            therapist: 'Dr. Emily Davis',
            status: 'active',
            sessionsPerWeek: 3,
            copay: 35
          },
          {
            id: 'P005',
            name: 'Olivia Martinez',
            dob: '2015-09-12',
            insurance: 'Medicaid',
            insuranceId: 'MCD321654987',
            diagnosis: 'F84.0',
            therapist: 'Dr. Sarah Miller',
            status: 'active',
            sessionsPerWeek: 5,
            copay: 0
          }
        ];
        
        localStorage.setItem('tinkybink_patients', JSON.stringify(patients));
        return patients;
      }
      
      loadClaims() {
        const stored = localStorage.getItem('tinkybink_claims');
        if (stored) return JSON.parse(stored);
        
        // Generate demo claims
        const claims = [];
        const statuses = ['pending', 'approved', 'denied', 'processing'];
        const procedures = [
          { code: '97153', description: 'Adaptive behavior treatment', rate: 125 },
          { code: '97155', description: 'Adaptive behavior treatment with protocol', rate: 100 },
          { code: '97156', description: 'Family adaptive behavior treatment', rate: 110 }
        ];
        
        // Generate claims for the past 3 months
        const now = new Date();
        for (let i = 0; i < 90; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          
          // Generate 2-5 claims per day
          const dailyClaims = Math.floor(Math.random() * 4) + 2;
          for (let j = 0; j < dailyClaims; j++) {
            const patient = this.patients[Math.floor(Math.random() * this.patients.length)];
            const procedure = procedures[Math.floor(Math.random() * procedures.length)];
            const units = Math.floor(Math.random() * 4) + 1;
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            claims.push({
              id: `CLM${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${j}`,
              patientId: patient.id,
              patientName: patient.name,
              insurance: patient.insurance,
              dateOfService: date.toISOString().split('T')[0],
              procedure: procedure.code,
              description: procedure.description,
              units: units,
              rate: procedure.rate,
              amount: units * procedure.rate,
              status: status,
              submittedDate: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
              processedDate: status !== 'pending' ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
              denialReason: status === 'denied' ? ['Authorization expired', 'Missing documentation', 'Frequency limitation exceeded'][Math.floor(Math.random() * 3)] : null
            });
          }
        }
        
        localStorage.setItem('tinkybink_claims', JSON.stringify(claims));
        return claims;
      }
      
      loadSessions() {
        const stored = localStorage.getItem('tinkybink_sessions');
        if (stored) return JSON.parse(stored);
        
        // Generate demo sessions
        const sessions = [];
        const sessionTypes = ['Individual', 'Group', 'Family', 'Assessment'];
        const locations = ['Clinic', 'Home', 'School', 'Telehealth'];
        
        // Generate sessions for the past month
        const now = new Date();
        for (let i = 0; i < 30; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          
          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          
          // Generate sessions for each patient
          this.patients.forEach(patient => {
            if (Math.random() < 0.8) { // 80% attendance rate
              sessions.push({
                id: `SES${date.getTime()}${patient.id}`,
                patientId: patient.id,
                patientName: patient.name,
                date: date.toISOString().split('T')[0],
                startTime: '14:00',
                endTime: '15:00',
                duration: 60,
                type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                therapist: patient.therapist,
                goals: ['Communication', 'Social Skills', 'Behavior Management'],
                progress: Math.floor(Math.random() * 100),
                notes: 'Patient showed good engagement during session.',
                billed: Math.random() > 0.1,
                paid: Math.random() > 0.3
              });
            }
          });
        }
        
        localStorage.setItem('tinkybink_sessions', JSON.stringify(sessions));
        return sessions;
      }
      
      initializeData() {
        // Update dashboard metrics
        this.updateBillingMetrics();
        this.updateInsuranceMetrics();
        this.populatePatientList();
        this.populateClaimsList();
        this.createAnalyticsCharts();
      }
      
      updateBillingMetrics() {
        // Calculate metrics for current month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthClaims = this.claims.filter(claim => {
          const claimDate = new Date(claim.dateOfService);
          return claimDate.getMonth() === currentMonth && claimDate.getFullYear() === currentYear;
        });
        
        // Total billed
        const totalBilled = monthClaims.reduce((sum, claim) => sum + claim.amount, 0);
        
        // Pending payments
        const pendingPayments = monthClaims
          .filter(claim => claim.status === 'pending' || claim.status === 'processing')
          .reduce((sum, claim) => sum + claim.amount, 0);
        
        // Denied claims
        const deniedClaims = monthClaims
          .filter(claim => claim.status === 'denied')
          .reduce((sum, claim) => sum + claim.amount, 0);
        
        // Collection rate
        const approvedClaims = monthClaims.filter(claim => claim.status === 'approved');
        const collectionRate = approvedClaims.length > 0 ? 
          (approvedClaims.length / monthClaims.length * 100).toFixed(1) : 0;
        
        // Update UI
        const updateElement = (id, value) => {
          const el = document.getElementById(id);
          if (el) el.textContent = typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
        };
        
        updateElement('totalBilled', totalBilled);
        updateElement('pendingPayments', pendingPayments);
        updateElement('deniedClaims', deniedClaims);
        updateElement('collectionRate', collectionRate);
        
        // Update claims overview in production dashboard
        const claimsOverview = document.querySelector('#billing-tab .report-card');
        if (claimsOverview) {
          const pendingCount = monthClaims.filter(c => c.status === 'pending').length;
          const approvedCount = monthClaims.filter(c => c.status === 'approved').length;
          const deniedCount = monthClaims.filter(c => c.status === 'denied').length;
          
          const overviewHTML = `
            <h4>Claims Overview</h4>
            <div style="margin: 15px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Pending Claims:</span>
                <strong>${pendingCount} ($${pendingPayments.toLocaleString()})</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Approved (MTD):</span>
                <strong>${approvedCount} ($${approvedClaims.reduce((s, c) => s + c.amount, 0).toLocaleString()})</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Denied:</span>
                <strong style="color: #e74c3c;">${deniedCount} ($${deniedClaims.toLocaleString()})</strong>
              </div>
            </div>
          `;
          
          const existingOverview = claimsOverview.querySelector('h4');
          if (existingOverview && existingOverview.textContent === 'Claims Overview') {
            claimsOverview.innerHTML = overviewHTML;
          }
        }
      }
      
      updateInsuranceMetrics() {
        // Group claims by insurance
        const insuranceStats = {};
        this.claims.forEach(claim => {
          if (!insuranceStats[claim.insurance]) {
            insuranceStats[claim.insurance] = {
              total: 0,
              approved: 0,
              denied: 0,
              pending: 0,
              amount: 0
            };
          }
          
          insuranceStats[claim.insurance].total++;
          insuranceStats[claim.insurance].amount += claim.amount;
          
          if (claim.status === 'approved') insuranceStats[claim.insurance].approved++;
          else if (claim.status === 'denied') insuranceStats[claim.insurance].denied++;
          else if (claim.status === 'pending') insuranceStats[claim.insurance].pending++;
        });
        
        // Update insurance breakdown
        const breakdownContainer = document.querySelector('.insurance-breakdown');
        if (breakdownContainer) {
          let html = '<h4>Insurance Provider Breakdown</h4>';
          Object.entries(insuranceStats).forEach(([insurance, stats]) => {
            const approvalRate = ((stats.approved / stats.total) * 100).toFixed(1);
            html += `
              <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <h5>${insurance}</h5>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
                  <div>Total Claims: ${stats.total}</div>
                  <div>Total Amount: $${stats.amount.toLocaleString()}</div>
                  <div>Approval Rate: ${approvalRate}%</div>
                  <div>Pending: ${stats.pending}</div>
                </div>
              </div>
            `;
          });
          breakdownContainer.innerHTML = html;
        }
      }
      
      populatePatientList() {
        const patientList = document.getElementById('patientList');
        if (!patientList) return;
        
        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        this.patients.forEach(patient => {
          const recentSessions = this.sessions.filter(s => s.patientId === patient.id).slice(0, 5);
          const totalBilled = this.claims
            .filter(c => c.patientId === patient.id)
            .reduce((sum, c) => sum + c.amount, 0);
          
          html += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer;"
                 onclick="window.billingManager.showPatientDetails('${patient.id}')">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h5 style="margin: 0; color: #4A90E2;">${patient.name}</h5>
                  <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    ${patient.insurance} • ID: ${patient.insuranceId}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 14px; color: #00C851;">$${totalBilled.toLocaleString()}</div>
                  <div style="font-size: 11px; color: #999;">${patient.sessionsPerWeek}x/week</div>
                </div>
              </div>
            </div>
          `;
        });
        html += '</div>';
        patientList.innerHTML = html;
      }
      
      populateClaimsList() {
        const claimsContainer = document.querySelector('.recent-claims');
        if (!claimsContainer) return;
        
        const recentClaims = this.claims.slice(0, 10);
        let html = '<h4>Recent Claims</h4><div style="max-height: 300px; overflow-y: auto;">';
        
        recentClaims.forEach(claim => {
          const statusColor = {
            approved: '#00C851',
            pending: '#FFC107',
            denied: '#F44336',
            processing: '#2196F3'
          }[claim.status];
          
          html += `
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; margin-bottom: 8px;
                       border-left: 4px solid ${statusColor};">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600;">${claim.patientName}</div>
                  <div style="font-size: 12px; color: #999;">
                    ${claim.procedure} • ${claim.dateOfService} • ${claim.insurance}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="color: ${statusColor}; font-weight: 600;">$${claim.amount}</div>
                  <div style="font-size: 11px; color: ${statusColor};">${claim.status.toUpperCase()}</div>
                </div>
              </div>
              ${claim.denialReason ? `<div style="font-size: 11px; color: #F44336; margin-top: 5px;">Denial: ${claim.denialReason}</div>` : ''}
            </div>
          `;
        });
        
        html += '</div>';
        claimsContainer.innerHTML = html;
      }
      
      createAnalyticsCharts() {
        // Revenue trend chart
        const revenueCanvas = document.getElementById('revenueChart');
        if (revenueCanvas && window.Chart) {
          const ctx = revenueCanvas.getContext('2d');
          
          // Calculate monthly revenue for the past 6 months
          const monthlyRevenue = [];
          const monthLabels = [];
          
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const monthClaims = this.claims.filter(claim => {
              const claimDate = new Date(claim.dateOfService);
              return claimDate.getMonth() === date.getMonth() && 
                     claimDate.getFullYear() === date.getFullYear() &&
                     claim.status === 'approved';
            });
            
            const revenue = monthClaims.reduce((sum, claim) => sum + claim.amount, 0);
            monthlyRevenue.push(revenue);
            monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
          }
          
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: monthLabels,
              datasets: [{
                label: 'Monthly Revenue',
                data: monthlyRevenue,
                borderColor: '#00C851',
                backgroundColor: 'rgba(0, 200, 81, 0.1)',
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '$' + value.toLocaleString();
                    }
                  }
                }
              }
            }
          });
        }
        
        // Insurance distribution chart
        const insuranceCanvas = document.getElementById('insuranceChart');
        if (insuranceCanvas && window.Chart) {
          const ctx = insuranceCanvas.getContext('2d');
          
          const insuranceCounts = {};
          this.patients.forEach(patient => {
            insuranceCounts[patient.insurance] = (insuranceCounts[patient.insurance] || 0) + 1;
          });
          
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: Object.keys(insuranceCounts),
              datasets: [{
                data: Object.values(insuranceCounts),
                backgroundColor: [
                  '#4A90E2',
                  '#00C851',
                  '#FFC107',
                  '#F44336',
                  '#9C27B0'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }
      }
      
      showPatientDetails(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        `;
        
        const patientSessions = this.sessions.filter(s => s.patientId === patientId);
        const patientClaims = this.claims.filter(c => c.patientId === patientId);
        const totalBilled = patientClaims.reduce((sum, c) => sum + c.amount, 0);
        const totalPaid = patientClaims.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
        
        modal.innerHTML = `
          <div style="background: #1e1e1e; border-radius: 12px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2>${patient.name}</h2>
              <button onclick="this.closest('.modal').remove()" style="background: none; border: none; color: #999; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
              <div>
                <h4>Patient Information</h4>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                  <p><strong>DOB:</strong> ${patient.dob}</p>
                  <p><strong>Insurance:</strong> ${patient.insurance}</p>
                  <p><strong>Insurance ID:</strong> ${patient.insuranceId}</p>
                  <p><strong>Diagnosis:</strong> ${patient.diagnosis}</p>
                  <p><strong>Therapist:</strong> ${patient.therapist}</p>
                  <p><strong>Sessions/Week:</strong> ${patient.sessionsPerWeek}</p>
                  <p><strong>Copay:</strong> $${patient.copay}</p>
                </div>
              </div>
              
              <div>
                <h4>Financial Summary</h4>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                  <p><strong>Total Billed:</strong> $${totalBilled.toLocaleString()}</p>
                  <p><strong>Total Paid:</strong> $${totalPaid.toLocaleString()}</p>
                  <p><strong>Outstanding:</strong> $${(totalBilled - totalPaid).toLocaleString()}</p>
                  <p><strong>Total Sessions:</strong> ${patientSessions.length}</p>
                  <p><strong>Attendance Rate:</strong> ${((patientSessions.length / (patient.sessionsPerWeek * 4)) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <h4>Recent Sessions</h4>
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 20px;">
              ${patientSessions.slice(0, 10).map(session => `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>${session.date} • ${session.type} • ${session.location}</span>
                    <span style="color: ${session.billed ? '#00C851' : '#FFC107'}">
                      ${session.billed ? 'Billed' : 'Pending'}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div style="display: flex; gap: 10px;">
              <button class="action-btn" onclick="window.billingManager.createClaim('${patientId}')">Create Claim</button>
              <button class="action-btn" onclick="window.billingManager.checkEligibility('${patientId}')">Check Eligibility</button>
              <button class="action-btn secondary" onclick="window.billingManager.exportPatientReport('${patientId}')">Export Report</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
      }
      
      async createClaim(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;
        
        // Get unbilled sessions
        const unbilledSessions = this.sessions.filter(s => 
          s.patientId === patientId && !s.billed
        );
        
        if (unbilledSessions.length === 0) {
          alert('No unbilled sessions found for this patient.');
          return;
        }
        
        // Create claim for each session
        for (const session of unbilledSessions) {
          const claim = {
            patientData: {
              insuranceId: patient.insuranceId,
              dateOfBirth: patient.dob,
              providerId: 'PROV123456'
            },
            units: session.duration / 15, // 15-minute units
            charge: 125 * (session.duration / 60), // $125 per hour
            serviceDate: session.date,
            procedureCode: '97153'
          };
          
          try {
            const result = await this.insurance.submitClaim(claim);
            console.log('Claim submitted:', result);
            
            // Mark session as billed
            session.billed = true;
            
            // Add to claims list
            this.claims.push({
              id: result.claimId || `CLM${Date.now()}`,
              patientId: patient.id,
              patientName: patient.name,
              insurance: patient.insurance,
              dateOfService: session.date,
              procedure: '97153',
              description: 'Adaptive behavior treatment',
              units: claim.units,
              rate: 125,
              amount: claim.charge,
              status: 'pending',
              submittedDate: new Date().toISOString()
            });
          } catch (error) {
            console.error('Claim submission failed:', error);
          }
        }
        
        // Save updated data
        localStorage.setItem('tinkybink_sessions', JSON.stringify(this.sessions));
        localStorage.setItem('tinkybink_claims', JSON.stringify(this.claims));
        
        // Refresh UI
        this.initializeData();
        alert(`${unbilledSessions.length} claims submitted successfully!`);
      }
      
      async checkEligibility(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;
        
        try {
          const result = await this.insurance.verifyEligibility({
            insuranceId: patient.insuranceId,
            dateOfBirth: patient.dob,
            providerId: 'PROV123456'
          });
          
          alert(`Eligibility Status: ${result.eligible ? 'Eligible' : 'Not Eligible'}\n` +
                `Coverage: ${result.coverage || 'N/A'}\n` +
                `Copay: $${result.copay || patient.copay}\n` +
                `Deductible Met: ${result.deductibleMet ? 'Yes' : 'No'}`);
        } catch (error) {
          alert('Eligibility check failed. Please try again.');
        }
      }
      
      exportPatientReport(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;
        
        const sessions = this.sessions.filter(s => s.patientId === patientId);
        const claims = this.claims.filter(c => c.patientId === patientId);
        
        const report = {
          patient,
          sessions,
          claims,
          summary: {
            totalSessions: sessions.length,
            totalBilled: claims.reduce((sum, c) => sum + c.amount, 0),
            totalPaid: claims.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0),
            attendanceRate: ((sessions.length / (patient.sessionsPerWeek * 4)) * 100).toFixed(1)
          },
          generatedAt: new Date().toISOString()
        };
        
        // Download as JSON
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient-report-${patient.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
      
      // Real-time claim status updates
      async updateClaimStatuses() {
        const pendingClaims = this.claims.filter(c => c.status === 'pending' || c.status === 'processing');
        
        for (const claim of pendingClaims) {
          try {
            const status = await this.insurance.checkClaimStatus(claim.id);
            if (status.status !== claim.status) {
              claim.status = status.status;
              claim.processedDate = new Date().toISOString();
              
              // Show notification
              this.showClaimNotification(claim, status);
            }
          } catch (error) {
            console.error('Status check failed for claim:', claim.id);
          }
        }
        
        // Save updated claims
        localStorage.setItem('tinkybink_claims', JSON.stringify(this.claims));
        this.updateBillingMetrics();
      }
      
      showClaimNotification(claim, status) {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${status.status === 'approved' ? '#00C851' : '#F44336'};
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 20px;">${status.status === 'approved' ? '✅' : '❌'}</span>
            <div>
              <div style="font-weight: 600;">Claim ${status.status === 'approved' ? 'Approved' : 'Denied'}</div>
              <div style="font-size: 14px;">${claim.patientName} - $${claim.amount}</div>
              ${status.denialReason ? `<div style="font-size: 12px; margin-top: 4px;">${status.denialReason}</div>` : ''}
            </div>
          </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
    }
    
    // Initialize billing manager
    window.billingManager = new BillingInsuranceManager();
    
    // Auto-update claim statuses every 5 minutes
    setInterval(() => {
      window.billingManager.updateClaimStatuses();
    }, 5 * 60 * 1000);
    
    // Session documentation function
    window.createBillingSession = function() {
      const patientId = document.getElementById('sessionPatient')?.value;
      const sessionType = document.getElementById('sessionType')?.value;
      const duration = parseInt(document.getElementById('sessionDuration')?.value) || 60;
      const notes = document.getElementById('sessionNotes')?.value;
      
      if (!patientId || !sessionType) {
        alert('Please select a patient and session type.');
        return;
      }
      
      const patient = window.billingManager.patients.find(p => p.id === patientId);
      if (!patient) {
        alert('Patient not found.');
        return;
      }
      
      // Create new session
      const session = {
        id: `SES${Date.now()}${patientId}`,
        patientId: patient.id,
        patientName: patient.name,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        endTime: new Date(Date.now() + duration * 60000).toTimeString().split(' ')[0].substring(0, 5),
        duration: duration,
        type: sessionType,
        location: 'Clinic',
        therapist: patient.therapist,
        goals: ['Communication', 'AAC Training'],
        progress: 75,
        notes: notes,
        billed: false,
        paid: false
      };
      
      window.billingManager.sessions.push(session);
      localStorage.setItem('tinkybink_sessions', JSON.stringify(window.billingManager.sessions));
      
      // Reset form
      document.getElementById('sessionPatient').value = '';
      document.getElementById('sessionDuration').value = '';
      document.getElementById('sessionNotes').value = '';
      
      // Refresh billing data
      window.billingManager.initializeData();
      
      alert(`Session documented for ${patient.name}!`);
    };
    
    // Populate patient dropdown
    window.populatePatientDropdown = function() {
      const dropdown = document.getElementById('sessionPatient');
      if (!dropdown) return;
      
      dropdown.innerHTML = '<option value="">Select Patient...</option>';
      window.billingManager.patients.forEach(patient => {
        dropdown.innerHTML += `<option value="${patient.id}">${patient.name} - ${patient.insurance}</option>`;
      });
    };
    
    window.searchPatients = function() {
      const searchTerm = document.getElementById('patientSearch')?.value.toLowerCase() || '';
      const filteredPatients = window.billingManager.patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.insurance.toLowerCase().includes(searchTerm) ||
        p.insuranceId.toLowerCase().includes(searchTerm)
      );
      
      const patientList = document.getElementById('patientList');
      if (!patientList) return;
      
      if (filteredPatients.length === 0) {
        patientList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No patients found</div>';
        return;
      }
      
      let html = '<div style="max-height: 400px; overflow-y: auto;">';
      filteredPatients.forEach(patient => {
        const totalBilled = window.billingManager.claims
          .filter(c => c.patientId === patient.id)
          .reduce((sum, c) => sum + c.amount, 0);
        
        html += `
          <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer;"
               onclick="window.billingManager.showPatientDetails('${patient.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h5 style="margin: 0; color: #4A90E2;">${patient.name}</h5>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                  ${patient.insurance} • ID: ${patient.insuranceId}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 14px; color: #00C851;">$${totalBilled.toLocaleString()}</div>
                <div style="font-size: 11px; color: #999;">${patient.sessionsPerWeek}x/week</div>
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';
      patientList.innerHTML = html;
    };
    
    window.showAddPatientForm = function() {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;
      
      modal.innerHTML = `
        <div style="background: #1e1e1e; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>Add New Patient</h2>
            <button onclick="this.closest('.modal').remove()" style="background: none; border: none; color: #999; font-size: 24px; cursor: pointer;">&times;</button>
          </div>
          
          <form onsubmit="addNewPatient(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <input type="text" id="newPatientName" placeholder="Patient Name" required 
                     style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 6px; color: white;">
              <input type="date" id="newPatientDOB" required 
                     style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 6px; color: white;">
              <select id="newPatientInsurance" required 
                      style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 6px; color: white;">
                <option value="">Select Insurance</option>
                <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
                <option value="Aetna">Aetna</option>
                <option value="United Healthcare">United Healthcare</option>
                <option value="Cigna">Cigna</option>
                <option value="Medicaid">Medicaid</option>
                <option value="Medicare">Medicare</option>
              </select>
              <input type="text" id="newPatientInsuranceId" placeholder="Insurance ID" required 
                     style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 6px; color: white;">
              <select id="newPatientTherapist" required 
                      style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 6px; color: white;">
                <option value="">Select Therapist</option>
                <option value="Dr. Sarah Miller">Dr. Sarah Miller</option>
                <option value="Dr. James Wilson">Dr. James Wilson</option>
                <option value="Dr. Emily Davis">Dr. Emily Davis</option>
              </select>
              <input type="number" id="newPatientCopay" placeholder="Copay Amount" min="0" 
                     style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 6px; color: white;">
            </div>
            <div style="text-align: right;">
              <button type="button" onclick="this.closest('.modal').remove()" 
                      style="padding: 12px 24px; margin-right: 10px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
              <button type="submit" 
                      style="padding: 12px 24px; background: #4A90E2; color: white; border: none; border-radius: 6px; cursor: pointer;">Add Patient</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
    };
    
    window.addNewPatient = function(event) {
      event.preventDefault();
      
      const newPatient = {
        id: `P${String(window.billingManager.patients.length + 1).padStart(3, '0')}`,
        name: document.getElementById('newPatientName').value,
        dob: document.getElementById('newPatientDOB').value,
        insurance: document.getElementById('newPatientInsurance').value,
        insuranceId: document.getElementById('newPatientInsuranceId').value,
        diagnosis: 'F84.0',
        therapist: document.getElementById('newPatientTherapist').value,
        status: 'active',
        sessionsPerWeek: 3,
        copay: parseInt(document.getElementById('newPatientCopay').value) || 0
      };
      
      window.billingManager.patients.push(newPatient);
      localStorage.setItem('tinkybink_patients', JSON.stringify(window.billingManager.patients));
      
      // Close modal
      document.querySelector('.modal').remove();
      
      // Refresh UI
      window.billingManager.initializeData();
      window.populatePatientDropdown();
      
      alert(`Patient ${newPatient.name} added successfully!`);
    };
    
    window.generateBillingReport = function() {
      const report = {
        generated: new Date().toISOString(),
        summary: {
          totalPatients: window.billingManager.patients.length,
          totalClaims: window.billingManager.claims.length,
          totalSessions: window.billingManager.sessions.length,
          monthlyRevenue: window.billingManager.claims
            .filter(c => c.status === 'approved' && new Date(c.dateOfService).getMonth() === new Date().getMonth())
            .reduce((sum, c) => sum + c.amount, 0)
        },
        patients: window.billingManager.patients,
        claims: window.billingManager.claims,
        sessions: window.billingManager.sessions
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    };
    
    window.exportClaims = function() {
      const convertToCSV = (data) => {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
          headers.map(header => JSON.stringify(row[header] || '')).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
      };
      
      const csv = convertToCSV(window.billingManager.claims);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claims-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    };
    
    window.viewAllClaims = function() {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;
      
      const sortedClaims = [...window.billingManager.claims].sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
      
      let claimsHTML = `
        <div style="background: #1e1e1e; border-radius: 12px; padding: 30px; max-width: 1200px; width: 95%; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>All Insurance Claims (${sortedClaims.length} total)</h2>
            <button onclick="this.closest('.modal').remove()" style="background: none; border: none; color: #999; font-size: 24px; cursor: pointer;">&times;</button>
          </div>
          
          <div style="max-height: 70vh; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: rgba(255,255,255,0.1);">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Claim ID</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Patient</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Date</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Procedure</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Amount</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Status</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      sortedClaims.forEach(claim => {
        const statusColor = {
          approved: '#00C851',
          pending: '#FFC107',
          denied: '#F44336',
          processing: '#2196F3'
        }[claim.status];
        
        claimsHTML += `
          <tr style="border-bottom: 1px solid #333;">
            <td style="padding: 10px;">${claim.id}</td>
            <td style="padding: 10px;">${claim.patientName}</td>
            <td style="padding: 10px;">${claim.dateOfService}</td>
            <td style="padding: 10px;">${claim.procedure}</td>
            <td style="padding: 10px;">$${claim.amount}</td>
            <td style="padding: 10px; color: ${statusColor}; font-weight: 600;">${claim.status.toUpperCase()}</td>
          </tr>
        `;
      });
      
      claimsHTML += `
              </tbody>
            </table>
          </div>
        </div>
      `;
      
      modal.innerHTML = claimsHTML;
      document.body.appendChild(modal);
    };
    
    // Initialize patient dropdown on load
    setTimeout(() => {
      window.populatePatientDropdown();
    }, 1000);
    
    // Add AI animations
    const aiStyle = document.createElement('style');
    aiStyle.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      @keyframes slideInLeft {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutLeft {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(-100%);
          opacity: 0;
        }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(-50%) translateX(0); }
        25% { transform: translateX(-50%) translateX(-10px); }
        75% { transform: translateX(-50%) translateX(10px); }
      }
    `;
    document.head.appendChild(aiStyle);
    
    // Add collaboration animations
    const collabStyle = document.createElement('style');
    collabStyle.textContent = `
      @keyframes slideDown {
        from {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        to {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(collabStyle);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);