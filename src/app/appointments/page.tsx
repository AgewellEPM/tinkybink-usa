'use client';

import React from 'react';
import AppointmentCalendarEnhanced from '@/components/appointment-calendar-enhanced';

export default function AppointmentsPage() {
  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>Appointment Scheduling System</h1>
        <p>Manage therapy appointments with Medicare billing integration and recurring series support</p>
      </div>

      <AppointmentCalendarEnhanced 
        professionalId="prof_001"
        patientId="patient_001"
        mode="professional"
      />

      <div className="features-highlight">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Smart Scheduling</h3>
            <p>Create single or recurring appointments with conflict detection</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Medicare Billing</h3>
            <p>Automatic CPT codes and insurance verification</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔁</div>
            <h3>Recurring Series</h3>
            <p>Daily, weekly, biweekly, or monthly patterns with exceptions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚠️</div>
            <h3>Limit Checking</h3>
            <p>Automatic Medicare session limit verification</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Reminders</h3>
            <p>Automated patient and professional notifications</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Comprehensive billing and attendance reports</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .appointments-page {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-header h1 {
          font-size: 36px;
          color: #1a202c;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .page-header p {
          font-size: 18px;
          color: #718096;
        }

        .features-highlight {
          max-width: 1200px;
          margin: 60px auto 40px;
        }

        .features-highlight h2 {
          text-align: center;
          font-size: 28px;
          color: #1a202c;
          margin-bottom: 32px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .feature-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          font-size: 20px;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .feature-card p {
          font-size: 14px;
          color: #718096;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 28px;
          }

          .page-header p {
            font-size: 16px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}