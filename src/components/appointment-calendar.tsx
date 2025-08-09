'use client';

import React, { useState, useEffect } from 'react';
import { appointmentSchedulingService, Appointment, TimeSlot, ProfessionalSchedule } from '@/services/appointment-scheduling-service';
import { getBillingIntegrationService } from '@/modules/professional/billing-integration-service';

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

export default function AppointmentCalendar({ 
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
      const allAppointments = Array.from({ length: 20 }, (_, i) => {
        const date = new Date(currentDate);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        
        return {
          appointment_id: `demo_${i}`,
          professional_id: professionalId,
          patient_id: `patient_${i % 5}`,
          appointment_type: ['evaluation', 'individual_therapy', 'group_therapy'][i % 3] as any,
          scheduled_date: date,
          scheduled_time: `${9 + (i % 8)}:${i % 2 === 0 ? '00' : '30'}`,
          duration_minutes: [30, 45, 60][i % 3],
          status: ['scheduled', 'confirmed', 'completed'][i % 3] as any,
          location_type: 'in_person' as any,
          billing_info: {
            cpt_code: ['92507', '92508', '92523'][i % 3],
            estimated_reimbursement: [150, 75, 200][i % 3],
            copay_amount: 25,
            insurance_verified: true,
            prior_auth_required: false,
            diagnosis_codes: ['F80.2']
          },
          clinical_info: {
            treatment_goals: ['Improve communication', 'AAC device training'],
            session_plan: 'Standard therapy session',
            materials_needed: ['AAC device', 'Visual supports'],
            parent_participation_required: i % 2 === 0
          },
          reminder_settings: {
            patient_reminder: true,
            patient_reminder_hours: 24,
            professional_reminder: true,
            professional_reminder_minutes: 15,
            parent_notification: true,
            reminder_sent: false
          },
          created_at: new Date(),
          updated_at: new Date(),
          created_by: professionalId
        } as Appointment;
      });

      setAppointments(allAppointments);
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
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      const dayAppointments = appointments.filter(apt => 
        apt.scheduled_date.toDateString() === current.toDateString()
      );

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        appointments: dayAppointments,
        isToday: current.toDateString() === new Date().toDateString(),
        isSelected: selectedDate?.toDateString() === current.toDateString()
      });

      current.setDate(current.getDate() + 1);
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
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getAppointmentColor = (appointment: Appointment): string => {
    const colors = {
      scheduled: '#ffc107',
      confirmed: '#28a745',
      in_progress: '#007bff',
      completed: '#6c757d',
      cancelled: '#dc3545',
      no_show: '#ff6b6b',
      rescheduled: '#fd7e14'
    };
    return colors[appointment.status] || '#6c757d';
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

  if (loading) {
    return (
      <div className={`appointment-calendar loading ${className}`}>
        <div className="loading-spinner">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className={`appointment-calendar ${className}`}>
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

      {/* Day View */}
      {viewMode === 'day' && selectedDate && (
        <DayView
          date={selectedDate}
          appointments={appointments.filter(apt => 
            apt.scheduled_date.toDateString() === selectedDate.toDateString()
          )}
          schedule={schedule}
          onAppointmentClick={handleAppointmentClick}
          onNewAppointment={handleNewAppointment}
        />
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          appointments={appointments}
          onAppointmentClick={handleAppointmentClick}
          onDateClick={handleDateClick}
        />
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
          <button onClick={handleNewAppointment} className="new-appointment-button">
            + New Appointment
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

      <style jsx>{`
        .appointment-calendar {
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
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        .more-appointments {
          font-size: 11px;
          color: #666;
          margin-top: 2px;
        }

        .selected-date-details {
          margin-top: 24px;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .selected-date-details h3 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 20px;
        }

        .day-appointments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .new-appointment-button {
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

        .new-appointment-button:hover {
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

          .view-toggle {
            width: 100%;
            justify-content: center;
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
function AppointmentCard({ 
  appointment, 
  onClick 
}: { 
  appointment: Appointment; 
  onClick: () => void;
}) {
  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: { bg: '#fff3cd', color: '#856404', text: 'Scheduled' },
      confirmed: { bg: '#d4edda', color: '#155724', text: 'Confirmed' },
      in_progress: { bg: '#cce5ff', color: '#004085', text: 'In Progress' },
      completed: { bg: '#e2e3e5', color: '#383d41', text: 'Completed' },
      cancelled: { bg: '#f8d7da', color: '#721c24', text: 'Cancelled' },
      no_show: { bg: '#f8d7da', color: '#721c24', text: 'No Show' },
      rescheduled: { bg: '#ffeaa7', color: '#856404', text: 'Rescheduled' }
    };
    return badges[status as keyof typeof badges] || badges.scheduled;
  };

  const status = getStatusBadge(appointment.status);

  return (
    <div className="appointment-card" onClick={onClick}>
      <div className="appointment-time">
        {appointment.scheduled_time} - {appointment.duration_minutes} min
      </div>
      <div className="appointment-type">
        {appointment.appointment_type.replace('_', ' ').toUpperCase()}
      </div>
      <div className="appointment-details">
        <span className="patient-name">Patient #{appointment.patient_id.split('_')[1]}</span>
        <span 
          className="status-badge"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          {status.text}
        </span>
      </div>
      <div className="billing-info">
        <span className="cpt-code">CPT: {appointment.billing_info.cpt_code}</span>
        <span className="reimbursement">${appointment.billing_info.estimated_reimbursement}</span>
      </div>

      <style jsx>{`
        .appointment-card {
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e9ecef;
        }

        .appointment-card:hover {
          background: #e9ecef;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
        }

        .billing-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #6c757d;
        }

        .reimbursement {
          font-weight: 600;
          color: #28a745;
        }
      `}</style>
    </div>
  );
}

// Day View Component
function DayView({ 
  date, 
  appointments, 
  schedule,
  onAppointmentClick,
  onNewAppointment
}: {
  date: Date;
  appointments: Appointment[];
  schedule: ProfessionalSchedule | null;
  onAppointmentClick: (apt: Appointment) => void;
  onNewAppointment: () => void;
}) {
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

  return (
    <div className="day-view">
      <div className="day-header">
        <h3>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
        <button onClick={onNewAppointment} className="add-button">+ Add Appointment</button>
      </div>

      <div className="time-grid">
        {hours.map(hour => (
          <div key={hour} className="time-slot">
            <div className="time-label">
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
            <div className="slot-content">
              {appointments
                .filter(apt => parseInt(apt.scheduled_time.split(':')[0]) === hour)
                .map(apt => (
                  <div
                    key={apt.appointment_id}
                    className="appointment-block"
                    style={{
                      backgroundColor: getAppointmentColor(apt),
                      height: `${(apt.duration_minutes / 60) * 60}px`
                    }}
                    onClick={() => onAppointmentClick(apt)}
                  >
                    <div className="appointment-content">
                      <strong>{apt.scheduled_time}</strong>
                      <span>{apt.appointment_type.replace('_', ' ')}</span>
                      <span>Patient #{apt.patient_id.split('_')[1]}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .day-view {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .day-header h3 {
          margin: 0;
          color: #333;
        }

        .add-button {
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .add-button:hover {
          background: #5a6fd8;
        }

        .time-grid {
          display: flex;
          flex-direction: column;
        }

        .time-slot {
          display: flex;
          min-height: 60px;
          border-bottom: 1px solid #e9ecef;
        }

        .time-label {
          width: 80px;
          padding: 8px;
          color: #6c757d;
          font-size: 14px;
          text-align: right;
        }

        .slot-content {
          flex: 1;
          padding: 4px;
          position: relative;
        }

        .appointment-block {
          position: absolute;
          left: 0;
          right: 0;
          padding: 8px;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .appointment-block:hover {
          transform: translateX(2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .appointment-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
        }

        .appointment-content strong {
          font-size: 14px;
        }
      `}</style>
    </div>
  );

  function getAppointmentColor(appointment: Appointment): string {
    const colors = {
      scheduled: '#ffc107',
      confirmed: '#28a745',
      in_progress: '#007bff',
      completed: '#6c757d',
      cancelled: '#dc3545',
      no_show: '#ff6b6b',
      rescheduled: '#fd7e14'
    };
    return colors[appointment.status] || '#6c757d';
  }
}

// Week View Component
function WeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onDateClick
}: {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (apt: Appointment) => void;
  onDateClick: (date: Date) => void;
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="week-view">
      <div className="week-header">
        {weekDays.map((date, index) => (
          <div 
            key={index} 
            className={`week-day-header ${date.toDateString() === new Date().toDateString() ? 'today' : ''}`}
            onClick={() => onDateClick(date)}
          >
            <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="day-date">{date.getDate()}</div>
          </div>
        ))}
      </div>

      <div className="week-content">
        {weekDays.map((date, index) => (
          <div key={index} className="week-day-column">
            {appointments
              .filter(apt => apt.scheduled_date.toDateString() === date.toDateString())
              .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
              .map(apt => (
                <div
                  key={apt.appointment_id}
                  className="week-appointment"
                  style={{ backgroundColor: getAppointmentColor(apt) }}
                  onClick={() => onAppointmentClick(apt)}
                >
                  <div className="appointment-time">{apt.scheduled_time}</div>
                  <div className="appointment-type">{apt.appointment_type.replace('_', ' ')}</div>
                </div>
              ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        .week-view {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .week-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .week-day-header {
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .week-day-header:hover {
          background: #e9ecef;
        }

        .week-day-header.today {
          background: #e7f3ff;
        }

        .day-name {
          font-weight: 600;
          color: #495057;
          margin-bottom: 4px;
        }

        .day-date {
          font-size: 18px;
          color: #333;
        }

        .week-content {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          min-height: 400px;
        }

        .week-day-column {
          border-right: 1px solid #e9ecef;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .week-day-column:last-child {
          border-right: none;
        }

        .week-appointment {
          padding: 8px;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .week-appointment:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .appointment-time {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .appointment-type {
          font-size: 11px;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );

  function getAppointmentColor(appointment: Appointment): string {
    const colors = {
      scheduled: '#ffc107',
      confirmed: '#28a745',
      in_progress: '#007bff',
      completed: '#6c757d',
      cancelled: '#dc3545',
      no_show: '#ff6b6b',
      rescheduled: '#fd7e14'
    };
    return colors[appointment.status] || '#6c757d';
  }
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
          estimated_reimbursement: 150, // Would calculate based on CPT code
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

  const handleStartSession = async () => {
    if (appointment) {
      const started = await appointmentSchedulingService.startAppointment(appointment.appointment_id);
      if (started) {
        console.log('Session started');
        onClose();
      }
    }
  };

  const handleCompleteSession = async () => {
    if (appointment) {
      const completed = await appointmentSchedulingService.completeAppointment(appointment.appointment_id, {
        actual_duration_minutes: appointment.duration_minutes,
        goals_addressed: appointment.clinical_info.treatment_goals,
        progress_notes: 'Session completed successfully',
        homework_assigned: 'Practice AAC device daily'
      });
      if (completed) {
        console.log('Session completed and billed');
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{appointment ? 'Edit Appointment' : 'New Appointment'}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-group">
            <label>Patient ID</label>
            <input
              type="text"
              value={formData.patient_id}
              onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Appointment Type</label>
              <select
                value={formData.appointment_type}
                onChange={e => setFormData({ ...formData, appointment_type: e.target.value as 'evaluation' | 'individual_therapy' | 'group_therapy' | 'teletherapy' | 'consultation' | 'assessment' })}
              >
                <option value="evaluation">Evaluation</option>
                <option value="individual_therapy">Individual Therapy</option>
                <option value="group_therapy">Group Therapy</option>
                <option value="teletherapy">Teletherapy</option>
                <option value="consultation">Consultation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <select
                value={formData.duration_minutes}
                onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              >
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
                <option value="90">90</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CPT Code</label>
              <select
                value={formData.cpt_code}
                onChange={e => setFormData({ ...formData, cpt_code: e.target.value })}
              >
                <option value="92507">92507 - Speech Therapy</option>
                <option value="92508">92508 - Group Therapy</option>
                <option value="92523">92523 - Evaluation</option>
                <option value="92607">92607 - AAC Evaluation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <select
                value={formData.location_type}
                onChange={e => setFormData({ ...formData, location_type: e.target.value as 'in_person' | 'telehealth' | 'home_visit' | 'school_visit' })}
              >
                <option value="in_person">In Person</option>
                <option value="telehealth">Telehealth</option>
                <option value="home_visit">Home Visit</option>
                <option value="school_visit">School Visit</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Treatment Goals</label>
            {formData.treatment_goals.map((goal, index) => (
              <input
                key={index}
                type="text"
                value={goal}
                onChange={e => {
                  const newGoals = [...formData.treatment_goals];
                  newGoals[index] = e.target.value;
                  setFormData({ ...formData, treatment_goals: newGoals });
                }}
                placeholder="Enter treatment goal"
              />
            ))}
            <button
              type="button"
              onClick={() => setFormData({ 
                ...formData, 
                treatment_goals: [...formData.treatment_goals, ''] 
              })}
              className="add-field-button"
            >
              + Add Goal
            </button>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            {appointment?.status === 'confirmed' && (
              <button type="button" onClick={handleStartSession} className="start-button">
                Start Session
              </button>
            )}
            {appointment?.status === 'in_progress' && (
              <button type="button" onClick={handleCompleteSession} className="complete-button">
                Complete & Bill
              </button>
            )}
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
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e9ecef;
          }

          .modal-header h3 {
            margin: 0;
            color: #333;
            font-size: 20px;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6c757d;
          }

          .appointment-form {
            padding: 24px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #495057;
            font-size: 14px;
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #667eea;
          }

          .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
          }

          .add-field-button {
            margin-top: 8px;
            padding: 6px 12px;
            background: #f8f9fa;
            border: 1px solid #ced4da;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            color: #495057;
            transition: all 0.2s;
          }

          .add-field-button:hover {
            background: #e9ecef;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            padding-top: 16px;
            border-top: 1px solid #e9ecef;
          }

          .cancel-button,
          .submit-button,
          .start-button,
          .complete-button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }

          .cancel-button {
            background: #f8f9fa;
            color: #495057;
            border: 1px solid #ced4da;
          }

          .cancel-button:hover {
            background: #e9ecef;
          }

          .submit-button {
            background: #667eea;
            color: white;
          }

          .submit-button:hover {
            background: #5a6fd8;
          }

          .start-button {
            background: #007bff;
            color: white;
          }

          .start-button:hover {
            background: #0056b3;
          }

          .complete-button {
            background: #28a745;
            color: white;
          }

          .complete-button:hover {
            background: #218838;
          }
        `}</style>
      </div>
    </div>
  );
}