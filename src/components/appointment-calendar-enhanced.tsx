'use client';

import React, { useState, useEffect } from 'react';
import { appointmentSchedulingService, Appointment, TimeSlot, ProfessionalSchedule } from '@/services/appointment-scheduling-service';
import { getBillingIntegrationService } from '@/modules/professional/billing-integration-service';
import RecurringAppointmentModal from './recurring-appointment-modal';

interface AppointmentCalendarProps {
  professionalId: string;
  patientId?: string;
  mode: 'professional' | 'patient' | 'admin';
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  appointments: Appointment[];
  isToday: boolean;
  isSelected: boolean;
}

export default function AppointmentCalendarEnhanced({ 
  professionalId, 
  patientId,
  mode = 'professional',
  className = '' 
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedule, setSchedule] = useState<ProfessionalSchedule | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    loadAppointments();
  }, [currentDate, professionalId]);

  useEffect(() => {
    if (selectedDate) {
      loadDaySchedule(selectedDate);
    }
  }, [selectedDate]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from API
      // For now, using the service to get real appointments
      const savedAppointments = localStorage.getItem('appointmentSchedules');
      if (savedAppointments) {
        const data = JSON.parse(savedAppointments);
        const parsedAppointments = data.map((apt: any) => ({
          ...apt,
          scheduled_date: new Date(apt.scheduled_date),
          created_at: new Date(apt.created_at),
          updated_at: new Date(apt.updated_at)
        }));
        setAppointments(parsedAppointments);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDaySchedule = async (date: Date) => {
    const daySchedule = appointmentSchedulingService.getProfessionalSchedule(professionalId, date);
    setSchedule(daySchedule);
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const dayAppointments = appointments.filter(apt => 
        apt.scheduled_date.toDateString() === date.toDateString()
      );
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        appointments: dayAppointments,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false
      });
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleNewAppointment = () => {
    if (selectedDate) {
      setSelectedAppointment(null);
      setShowAppointmentModal(true);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getAppointmentColor = (appointment: Appointment): string => {
    const colors = {
      evaluation: '#667eea',
      individual_therapy: '#48bb78',
      group_therapy: '#ed8936',
      teletherapy: '#38b2ac',
      consultation: '#e53e3e',
      assessment: '#805ad5'
    };
    return colors[appointment.appointment_type] || '#718096';
  };

  const getAppointmentIcon = (type: string): string => {
    const icons = {
      evaluation: '📋',
      individual_therapy: '👤',
      group_therapy: '👥',
      teletherapy: '💻',
      consultation: '💬',
      assessment: '📊'
    };
    return icons[type as keyof typeof icons] || '📅';
  };

  return (
    <div className={`appointment-calendar-enhanced ${className}`}>
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="header-left">
          <h2>Appointment Schedule</h2>
          <p className="subtitle">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="header-right">
          <div className="view-toggle">
            {['month', 'week', 'day'].map(view => (
              <button
                key={view}
                onClick={() => setViewMode(view as any)}
                className={`view-button ${viewMode === view ? 'active' : ''}`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
          <div className="nav-buttons">
            <button onClick={() => navigateMonth('prev')} className="nav-button">←</button>
            <button onClick={() => setCurrentDate(new Date())} className="today-button">Today</button>
            <button onClick={() => navigateMonth('next')} className="nav-button">→</button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={handleNewAppointment} className="new-appointment-button">
          + New Appointment
        </button>
        <button onClick={() => setShowRecurringModal(true)} className="recurring-appointment-button">
          🔁 Recurring Series
        </button>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <div className="calendar-grid">
          {/* Day Headers */}
          <div className="day-headers">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="days-grid">
            {generateCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''}`}
                onClick={() => handleDateClick(day.date)}
              >
                <div className="day-number">{day.date.getDate()}</div>
                <div className="day-appointments">
                  {day.appointments.slice(0, 3).map((apt, i) => (
                    <div
                      key={i}
                      className="appointment-dot"
                      style={{ backgroundColor: getAppointmentColor(apt) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(apt);
                      }}
                      title={`${apt.scheduled_time} - ${apt.appointment_type}`}
                    >
                      {getAppointmentIcon(apt.appointment_type)} {apt.scheduled_time}
                    </div>
                  ))}
                  {day.appointments.length > 3 && (
                    <div className="more-appointments">+{day.appointments.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && viewMode === 'month' && (
        <div className="selected-date-details">
          <h3>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="day-appointments-list">
            {appointments
              .filter(apt => apt.scheduled_date.toDateString() === selectedDate.toDateString())
              .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
              .map(apt => (
                <AppointmentCard
                  key={apt.appointment_id}
                  appointment={apt}
                  onClick={() => handleAppointmentClick(apt)}
                />
              ))}
          </div>
          <button onClick={handleNewAppointment} className="add-appointment-button">
            + Add Appointment
          </button>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          date={selectedDate}
          professionalId={professionalId}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
            loadAppointments();
          }}
        />
      )}
      
      {/* Recurring Appointment Modal */}
      <RecurringAppointmentModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        baseAppointment={{
          professional_id: professionalId,
          patient_id: patientId || '',
          scheduled_date: selectedDate || new Date(),
          scheduled_time: '09:00',
          duration_minutes: 30,
          appointment_type: 'individual_therapy',
          location_type: 'in_person',
          billing_info: {
            cpt_code: '92507',
            modifiers: [],
            diagnosis_codes: ['F80.2'],
            estimated_reimbursement: 150,
            copay_amount: 25,
            insurance_verified: false,
            prior_auth_required: false
          },
          clinical_info: {
            treatment_goals: ['AAC device training', 'Communication practice'],
            session_plan: 'Standard therapy session',
            materials_needed: ['AAC device', 'Visual supports'],
            parent_participation_required: false
          },
          reminder_settings: {
            patient_reminder: true,
            patient_reminder_hours: 24,
            professional_reminder: true,
            professional_reminder_minutes: 15,
            parent_notification: true,
            reminder_sent: false
          },
          created_by: professionalId
        }}
        onSuccess={(appointments) => {
          console.log(`Created ${appointments.length} recurring appointments`);
          loadAppointments();
          setShowRecurringModal(false);
        }}
      />

      <style jsx>{`
        .appointment-calendar-enhanced {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .header-left h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .subtitle {
          margin: 4px 0 0 0;
          color: #666;
          font-size: 16px;
        }

        .header-right {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          background: #f0f0f0;
          padding: 4px;
          border-radius: 8px;
        }

        .view-button {
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .view-button.active {
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .nav-buttons {
          display: flex;
          gap: 8px;
        }

        .nav-button, .today-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .nav-button:hover, .today-button:hover {
          background: #f8f9fa;
          border-color: #667eea;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .new-appointment-button, .recurring-appointment-button {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .new-appointment-button:hover {
          background: #5a67d8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .recurring-appointment-button {
          background: #48bb78;
        }

        .recurring-appointment-button:hover {
          background: #38a169;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
        }

        .calendar-grid {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .day-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .day-header {
          padding: 12px;
          text-align: center;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          min-height: 100px;
          padding: 8px;
          border: 1px solid #e9ecef;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .calendar-day:hover {
          background: #f8f9fa;
        }

        .calendar-day.other-month {
          color: #adb5bd;
          background: #fafafa;
        }

        .calendar-day.today {
          background: #e7f3ff;
        }

        .calendar-day.selected {
          background: #f0f7ff;
          border-color: #667eea;
        }

        .day-number {
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .day-appointments {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .appointment-dot {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          transition: transform 0.1s;
        }

        .appointment-dot:hover {
          transform: scale(1.05);
        }

        .more-appointments {
          font-size: 11px;
          color: #6c757d;
          font-style: italic;
        }

        .selected-date-details {
          margin-top: 24px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .selected-date-details h3 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #333;
        }

        .day-appointments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .add-appointment-button {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .add-appointment-button:hover {
          background: #5a6fd8;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        @media (max-width: 768px) {
          .calendar-header {
            flex-direction: column;
            gap: 16px;
          }

          .header-right {
            flex-direction: column;
            width: 100%;
          }

          .action-buttons {
            flex-direction: column;
          }

          .new-appointment-button, .recurring-appointment-button {
            width: 100%;
          }

          .calendar-day {
            min-height: 80px;
            padding: 4px;
          }

          .appointment-dot {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) {
  const statusColors = {
    scheduled: '#667eea',
    confirmed: '#48bb78',
    completed: '#38a169',
    cancelled: '#e53e3e',
    no_show: '#ed8936',
    rescheduled: '#dd6b20',
    in_progress: '#3182ce'
  };

  return (
    <div className="appointment-card" onClick={onClick}>
      <div className="appointment-time">
        {appointment.scheduled_time} - {appointment.duration_minutes} min
      </div>
      <div className="appointment-type">
        {appointment.appointment_type.replace(/_/g, ' ')}
      </div>
      <div className="appointment-details">
        <span className="patient-name">Patient #{appointment.patient_id.slice(-4)}</span>
        <span 
          className="status-badge" 
          style={{ backgroundColor: statusColors[appointment.status] }}
        >
          {appointment.status}
        </span>
      </div>
      <div className="billing-info">
        <span>CPT: {appointment.billing_info.cpt_code}</span>
        <span>${appointment.billing_info.estimated_reimbursement}</span>
      </div>

      <style jsx>{`
        .appointment-card {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .appointment-card:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .appointment-time {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .appointment-type {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          text-transform: capitalize;
        }

        .appointment-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .patient-name {
          font-size: 14px;
          color: #495057;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .billing-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}

// Appointment Modal Component
function AppointmentModal({
  appointment,
  date,
  professionalId,
  onClose
}: {
  appointment: Appointment | null;
  date: Date | null;
  professionalId: string;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    patient_id: appointment?.patient_id || '',
    appointment_type: appointment?.appointment_type || 'individual_therapy',
    scheduled_time: appointment?.scheduled_time || '09:00',
    duration_minutes: appointment?.duration_minutes || 30,
    location_type: appointment?.location_type || 'in_person',
    cpt_code: appointment?.billing_info?.cpt_code || '92507',
    diagnosis_codes: appointment?.billing_info?.diagnosis_codes || ['F80.2'],
    treatment_goals: appointment?.clinical_info?.treatment_goals || [''],
    materials_needed: appointment?.clinical_info?.materials_needed || ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (appointment) {
      // Update existing appointment
      console.log('Updating appointment:', appointment.appointment_id);
    } else if (date) {
      // Create new appointment
      const newAppointment = {
        professional_id: professionalId,
        patient_id: formData.patient_id,
        appointment_type: formData.appointment_type as any,
        scheduled_date: date,
        scheduled_time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
        location_type: formData.location_type as any,
        billing_info: {
          cpt_code: formData.cpt_code,
          diagnosis_codes: formData.diagnosis_codes,
          estimated_reimbursement: 150,
          copay_amount: 25,
          insurance_verified: false,
          prior_auth_required: false
        },
        clinical_info: {
          treatment_goals: formData.treatment_goals.filter(g => g),
          session_plan: 'Standard therapy session',
          materials_needed: formData.materials_needed.filter(m => m),
          parent_participation_required: false
        },
        reminder_settings: {
          patient_reminder: true,
          patient_reminder_hours: 24,
          professional_reminder: true,
          professional_reminder_minutes: 15,
          parent_notification: true,
          reminder_sent: false
        },
        created_by: professionalId
      };

      const created = await appointmentSchedulingService.createAppointment(newAppointment);
      if (created) {
        console.log('Appointment created:', created.appointment_id);
      }
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{appointment ? 'Edit Appointment' : 'New Appointment'}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient ID</label>
            <input
              type="text"
              value={formData.patient_id}
              onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Appointment Type</label>
            <select
              value={formData.appointment_type}
              onChange={(e) => setFormData({...formData, appointment_type: e.target.value as 'assessment' | 'evaluation' | 'teletherapy' | 'individual_therapy' | 'group_therapy' | 'consultation'})}
            >
              <option value="evaluation">Evaluation</option>
              <option value="individual_therapy">Individual Therapy</option>
              <option value="group_therapy">Group Therapy</option>
              <option value="teletherapy">Teletherapy</option>
              <option value="consultation">Consultation</option>
              <option value="assessment">Assessment</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
              >
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
                <option value="90">90</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Location Type</label>
            <select
              value={formData.location_type}
              onChange={(e) => setFormData({...formData, location_type: e.target.value as 'in_person' | 'telehealth' | 'home_visit' | 'school_visit'})}
            >
              <option value="in_person">In Person</option>
              <option value="telehealth">Telehealth</option>
              <option value="home_visit">Home Visit</option>
              <option value="school_visit">School Visit</option>
            </select>
          </div>

          <div className="form-group">
            <label>CPT Code</label>
            <input
              type="text"
              value={formData.cpt_code}
              onChange={(e) => setFormData({...formData, cpt_code: e.target.value})}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {appointment ? 'Update' : 'Create'} Appointment
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
          }

          .modal-header h3 {
            margin: 0;
            font-size: 20px;
            color: #333;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 24px;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .close-button:hover {
            background: #f0f0f0;
            color: #333;
          }

          form {
            padding: 20px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
            font-size: 14px;
          }

          input, select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          input:focus, select:focus {
            outline: none;
            border-color: #667eea;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px;
            border-top: 1px solid #e9ecef;
          }

          .cancel-button, .submit-button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .cancel-button {
            background: #f0f0f0;
            color: #333;
          }

          .cancel-button:hover {
            background: #e0e0e0;
          }

          .submit-button {
            background: #667eea;
            color: white;
          }

          .submit-button:hover {
            background: #5a67d8;
          }
        `}</style>
      </div>
    </div>
  );
}