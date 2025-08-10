/**
 * Appointment Scheduling Service
 * Comprehensive scheduling system for teachers/professionals with Medicare billing integration
 * Automatically generates billing codes and documentation for scheduled sessions
 */

import { therapySessionLogger } from './therapy-session-logger';
import { getBillingIntegrationService } from '../modules/professional/billing-integration-service';
import { userHistoryTrackingService } from './user-history-tracking-service';
import { realtimeUpdatesService } from './realtime-updates-service';

export interface Appointment {
  appointment_id: string;
  professional_id: string;
  patient_id: string;
  appointment_type: 'evaluation' | 'individual_therapy' | 'group_therapy' | 'teletherapy' | 'consultation' | 'assessment';
  scheduled_date: Date;
  scheduled_time: string; // HH:MM format
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  
  // Location
  location_type: 'in_person' | 'telehealth' | 'home_visit' | 'school_visit';
  location_details?: {
    address?: string;
    room_number?: string;
    telehealth_link?: string;
    special_instructions?: string;
  };
  
  // Billing Information
  billing_info: {
    cpt_code: string;
    modifiers?: string[];
    authorization_number?: string;
    diagnosis_codes: string[];
    estimated_reimbursement: number;
    copay_amount: number;
    insurance_verified: boolean;
    prior_auth_required: boolean;
    prior_auth_status?: 'pending' | 'approved' | 'denied';
  };
  
  // Clinical Information
  clinical_info: {
    treatment_goals: string[];
    session_plan: string;
    materials_needed: string[];
    homework_assigned?: string;
    parent_participation_required: boolean;
  };
  
  // Recurring appointment info
  recurring_info?: {
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    frequency: number; // e.g., every 2 weeks
    days_of_week?: number[]; // 0-6 for Sunday-Saturday
    end_date?: Date;
    exceptions?: Date[]; // dates to skip
    master_appointment_id: string;
  };
  
  // Reminders and notifications
  reminder_settings: {
    patient_reminder: boolean;
    patient_reminder_hours: number; // hours before appointment
    professional_reminder: boolean;
    professional_reminder_minutes: number; // minutes before
    parent_notification: boolean;
    reminder_sent: boolean;
  };
  
  // Notes and documentation
  notes?: {
    pre_session_notes?: string;
    post_session_notes?: string;
    billing_notes?: string;
    clinical_observations?: string[];
  };
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface TimeSlot {
  start_time: string; // HH:MM
  end_time: string;
  available: boolean;
  appointment_id?: string;
  break_time?: boolean;
}

export interface ProfessionalSchedule {
  professional_id: string;
  schedule_date: Date;
  working_hours: {
    start: string; // HH:MM
    end: string;
    lunch_break?: {
      start: string;
      end: string;
    };
  };
  time_slots: TimeSlot[];
  total_appointments: number;
  total_billable_hours: number;
  estimated_daily_revenue: number;
}

export interface AppointmentTemplate {
  template_id: string;
  template_name: string;
  professional_id: string;
  appointment_type: Appointment['appointment_type'];
  default_duration: number;
  default_cpt_code: string;
  default_modifiers?: string[];
  default_goals: string[];
  default_materials: string[];
  default_location_type: Appointment['location_type'];
}

export interface BillingReport {
  report_id: string;
  period: { start: Date; end: Date };
  professional_id: string;
  summary: {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    no_shows: number;
    total_billable_hours: number;
    total_billed: number;
    total_collected: number;
    outstanding_balance: number;
  };
  by_insurance: Map<string, {
    appointments: number;
    billed: number;
    collected: number;
    pending: number;
  }>;
  by_cpt_code: Map<string, {
    count: number;
    total_billed: number;
    average_reimbursement: number;
  }>;
}

export class AppointmentSchedulingService {
  private static instance: AppointmentSchedulingService;
  private appointments: Map<string, Appointment> = new Map();
  private schedules: Map<string, Map<string, ProfessionalSchedule>> = new Map(); // professionalId -> date -> schedule
  private templates: Map<string, AppointmentTemplate> = new Map();
  private billingService = getBillingIntegrationService();
  
  // Medicare/Medicaid specific settings
  private medicareSettings = {
    session_limits: {
      evaluation: { max_per_year: 2, requires_md_referral: true },
      individual_therapy: { max_per_week: 3, max_duration: 60 },
      group_therapy: { max_per_week: 2, max_participants: 4 },
      teletherapy: { max_per_month: 8, requires_approval: true }
    },
    billing_rules: {
      min_session_duration: 8, // minutes for billing
      documentation_deadline_hours: 48,
      concurrent_therapy_allowed: false,
      student_supervision_allowed: true
    }
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): AppointmentSchedulingService {
    if (!AppointmentSchedulingService.instance) {
      AppointmentSchedulingService.instance = new AppointmentSchedulingService();
    }
    return AppointmentSchedulingService.instance;
  }

  private initialize(): void {
    console.log('📅 Appointment Scheduling Service initialized');
    this.loadScheduleData();
    this.setupDefaultTemplates();
    this.startReminderService();
  }

  /**
   * Create a new appointment with automatic billing setup
   */
  async createAppointment(
    appointment: Omit<Appointment, 'appointment_id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<Appointment | null> {
    try {
      // Verify insurance authorization
      const authCheck = await this.verifyInsuranceAuthorization(
        appointment.patient_id,
        appointment.billing_info.cpt_code,
        appointment.scheduled_date
      );
      
      if (!authCheck.authorized) {
        console.error('Insurance authorization failed:', authCheck.reason);
        return null;
      }

      // Check for scheduling conflicts
      const conflict = this.checkScheduleConflict(
        appointment.professional_id,
        appointment.scheduled_date,
        appointment.scheduled_time,
        appointment.duration_minutes
      );
      
      if (conflict) {
        console.error('Schedule conflict detected');
        return null;
      }

      // Check Medicare limits
      const limitsOk = await this.checkMedicareLimits(
        appointment.patient_id,
        appointment.appointment_type,
        appointment.scheduled_date
      );
      
      if (!limitsOk) {
        console.error('Medicare session limits exceeded');
        return null;
      }

      // Create the appointment
      const newAppointment: Appointment = {
        ...appointment,
        appointment_id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date(),
        billing_info: {
          ...appointment.billing_info,
          insurance_verified: authCheck.authorized,
          prior_auth_status: authCheck.prior_auth_required ? 'pending' : 'approved'
        }
      };

      this.appointments.set(newAppointment.appointment_id, newAppointment);
      
      // Update professional's schedule
      this.updateProfessionalSchedule(
        newAppointment.professional_id,
        newAppointment.scheduled_date,
        newAppointment
      );

      // Send confirmation notifications
      await this.sendAppointmentConfirmation(newAppointment);
      
      // Schedule reminders
      this.scheduleReminders(newAppointment);

      this.saveScheduleData();
      console.log(`📅 Appointment created: ${newAppointment.appointment_id}`);
      
      return newAppointment;
      
    } catch (error) {
      console.error('Failed to create appointment:', error);
      return null;
    }
  }

  /**
   * Start appointment and begin therapy session logging
   */
  async startAppointment(appointmentId: string): Promise<boolean> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment || appointment.status !== 'confirmed') {
      console.error('Appointment not found or not confirmed');
      return false;
    }

    appointment.status = 'in_progress';
    appointment.updated_at = new Date();

    // Start therapy session for billing
    const therapySessionId = therapySessionLogger.startToolSession(
      appointment.patient_id,
      this.getSessionDescription(appointment),
      appointment.clinical_info.treatment_goals
    );

    // Store session ID for later
    appointment.notes = {
      ...appointment.notes,
      billing_notes: `Therapy Session ID: ${therapySessionId}`
    };

    // Start user history tracking
    userHistoryTrackingService.startUserSession(
      appointment.patient_id,
      'guided_therapy',
      appointment.clinical_info.treatment_goals
    );

    // Send real-time update
    realtimeUpdatesService.sendRecommendationUpdate(appointment.patient_id, {
      recommendation_id: 'therapy_session_start',
      user_id: appointment.patient_id,
      generated_at: new Date(),
      recommendation_type: 'immediate_action',
      priority_level: 'high',
      confidence_score: 100,
      title: 'Therapy Session Started',
      description: `Your ${appointment.appointment_type} session has begun`,
      specific_actions: appointment.clinical_info.treatment_goals,
      expected_outcomes: ['Progress toward therapy goals'],
      optimal_timing: {
        session_frequency: 'now',
        duration_minutes: appointment.duration_minutes
      },
      rationale: 'Scheduled therapy session',
      supporting_data: {
        user_patterns: [],
        performance_trends: [],
        ai_insights: [],
        therapeutic_alignment: appointment.clinical_info.treatment_goals
      },
      implementation: {
        game_activities: [],
        progression_milestones: [],
        success_metrics: []
      },
      adaptation_triggers: [],
      status: 'active',
      progress_tracking: {
        attempts: 0,
        successes: 0,
        current_milestone: 0,
        last_activity: new Date()
      }
    } as any);

    this.saveScheduleData();
    return true;
  }

  /**
   * Complete appointment and generate billing
   */
  async completeAppointment(
    appointmentId: string,
    completionData: {
      actual_duration_minutes: number;
      goals_addressed: string[];
      progress_notes: string;
      homework_assigned?: string;
      next_session_recommendations?: string;
      billing_notes?: string;
    }
  ): Promise<boolean> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment || appointment.status !== 'in_progress') {
      console.error('Appointment not in progress');
      return false;
    }

    // Verify minimum duration for Medicare billing
    if (completionData.actual_duration_minutes < this.medicareSettings.billing_rules.min_session_duration) {
      console.error(`Session too short for billing (min: ${this.medicareSettings.billing_rules.min_session_duration} minutes)`);
      return false;
    }

    appointment.status = 'completed';
    appointment.updated_at = new Date();
    appointment.notes = {
      ...appointment.notes,
      post_session_notes: completionData.progress_notes,
      clinical_observations: completionData.goals_addressed,
      billing_notes: completionData.billing_notes
    };

    if (completionData.homework_assigned) {
      appointment.clinical_info.homework_assigned = completionData.homework_assigned;
    }

    // End therapy session and generate billing
    const therapySessionId = this.extractTherapySessionId(appointment);
    if (therapySessionId) {
      await therapySessionLogger.endToolSession(
        therapySessionId,
        completionData.progress_notes,
        completionData.goals_addressed
      );
    }

    // End user history session
    await userHistoryTrackingService.endUserSession(
      appointment.patient_id,
      completionData.progress_notes
    );

    // Generate billing claim
    const claim = await this.generateBillingClaim(appointment, completionData.actual_duration_minutes);
    
    if (claim) {
      console.log(`💰 Billing claim generated: ${claim.id}`);
      
      // Send billing confirmation
      await this.sendBillingConfirmation(appointment, claim);
    }

    // Schedule next appointment if recurring
    if (appointment.recurring_info) {
      await this.scheduleNextRecurringAppointment(appointment);
    }

    this.saveScheduleData();
    return true;
  }

  /**
   * Get professional's schedule for a date
   */
  getProfessionalSchedule(professionalId: string, date: Date): ProfessionalSchedule | null {
    const dateKey = this.getDateKey(date);
    const professionalSchedules = this.schedules.get(professionalId);
    
    if (!professionalSchedules) return null;
    
    return professionalSchedules.get(dateKey) || null;
  }

  /**
   * Get available time slots for booking
   */
  getAvailableTimeSlots(
    professionalId: string,
    date: Date,
    appointmentType: Appointment['appointment_type'],
    duration: number
  ): TimeSlot[] {
    const schedule = this.getProfessionalSchedule(professionalId, date);
    if (!schedule) return [];

    const availableSlots: TimeSlot[] = [];
    const slotDuration = 15; // 15-minute increments
    const slotsNeeded = Math.ceil(duration / slotDuration);

    for (let i = 0; i <= schedule.time_slots.length - slotsNeeded; i++) {
      let allAvailable = true;
      
      // Check if consecutive slots are available
      for (let j = 0; j < slotsNeeded; j++) {
        if (!schedule.time_slots[i + j].available || schedule.time_slots[i + j].break_time) {
          allAvailable = false;
          break;
        }
      }

      if (allAvailable) {
        availableSlots.push({
          start_time: schedule.time_slots[i].start_time,
          end_time: schedule.time_slots[i + slotsNeeded - 1].end_time,
          available: true
        });
        
        // Skip ahead to avoid overlapping slots
        i += slotsNeeded - 1;
      }
    }

    return availableSlots;
  }

  /**
   * Generate billing report for professional
   */
  async generateBillingReport(
    professionalId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BillingReport> {
    const appointments = Array.from(this.appointments.values()).filter(apt =>
      apt.professional_id === professionalId &&
      apt.scheduled_date >= startDate &&
      apt.scheduled_date <= endDate
    );

    const summary = {
      total_appointments: appointments.length,
      completed_appointments: appointments.filter(a => a.status === 'completed').length,
      cancelled_appointments: appointments.filter(a => a.status === 'cancelled').length,
      no_shows: appointments.filter(a => a.status === 'no_show').length,
      total_billable_hours: 0,
      total_billed: 0,
      total_collected: 0,
      outstanding_balance: 0
    };

    const byInsurance = new Map<string, any>();
    const byCptCode = new Map<string, any>();

    // Calculate statistics
    for (const appointment of appointments) {
      if (appointment.status === 'completed') {
        summary.total_billable_hours += appointment.duration_minutes / 60;
        summary.total_billed += appointment.billing_info.estimated_reimbursement;
        
        // Group by insurance
        const profile = this.billingService.getBillingProfile(appointment.patient_id);
        if (profile) {
          const insurer = profile.insuranceInfo.provider;
          const existing = byInsurance.get(insurer) || {
            appointments: 0,
            billed: 0,
            collected: 0,
            pending: 0
          };
          
          existing.appointments += 1;
          existing.billed += appointment.billing_info.estimated_reimbursement;
          byInsurance.set(insurer, existing);
        }

        // Group by CPT code
        const cptCode = appointment.billing_info.cpt_code;
        const existingCpt = byCptCode.get(cptCode) || {
          count: 0,
          total_billed: 0,
          average_reimbursement: 0
        };
        
        existingCpt.count += 1;
        existingCpt.total_billed += appointment.billing_info.estimated_reimbursement;
        existingCpt.average_reimbursement = existingCpt.total_billed / existingCpt.count;
        byCptCode.set(cptCode, existingCpt);
      }
    }

    return {
      report_id: `report_${Date.now()}`,
      period: { start: startDate, end: endDate },
      professional_id: professionalId,
      summary,
      by_insurance: byInsurance,
      by_cpt_code: byCptCode
    };
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: Date,
    newTime: string
  ): Promise<boolean> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment || ['completed', 'cancelled'].includes(appointment.status)) {
      return false;
    }

    // Check new slot availability
    const conflict = this.checkScheduleConflict(
      appointment.professional_id,
      newDate,
      newTime,
      appointment.duration_minutes
    );

    if (conflict) {
      console.error('New time slot has conflict');
      return false;
    }

    // Remove from old schedule
    this.removeFromSchedule(appointment);

    // Update appointment
    appointment.scheduled_date = newDate;
    appointment.scheduled_time = newTime;
    appointment.status = 'rescheduled';
    appointment.updated_at = new Date();

    // Add to new schedule
    this.updateProfessionalSchedule(
      appointment.professional_id,
      newDate,
      appointment
    );

    // Send rescheduling notifications
    await this.sendRescheduleNotification(appointment);

    // Reschedule reminders
    this.scheduleReminders(appointment);

    this.saveScheduleData();
    return true;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason: string,
    cancelledBy: 'patient' | 'professional' | 'system'
  ): Promise<boolean> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment || ['completed', 'cancelled'].includes(appointment.status)) {
      return false;
    }

    appointment.status = 'cancelled';
    appointment.updated_at = new Date();
    appointment.notes = {
      ...appointment.notes,
      billing_notes: `Cancelled by ${cancelledBy}: ${reason}`
    };

    // Remove from schedule
    this.removeFromSchedule(appointment);

    // Send cancellation notifications
    await this.sendCancellationNotification(appointment, reason);

    // Handle late cancellation fees if applicable
    const hoursUntilAppointment = (appointment.scheduled_date.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilAppointment < 24 && cancelledBy === 'patient') {
      await this.applyLateCancellationFee(appointment);
    }

    this.saveScheduleData();
    return true;
  }

  /**
   * Create recurring appointments with advanced pattern support
   */
  async createRecurringAppointments(
    baseAppointment: Omit<Appointment, 'appointment_id' | 'created_at' | 'updated_at' | 'status'>,
    recurringPattern: {
      pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      frequency: number;
      days_of_week?: number[];
      end_date: Date;
      skip_holidays?: boolean;
      exceptions?: Date[];
      occurrence_count?: number; // Alternative to end_date
      allow_conflicts?: boolean;
      auto_adjust_conflicts?: boolean;
    }
  ): Promise<{ 
    created: Appointment[]; 
    skipped: { date: Date; reason: string }[];
    failed: { date: Date; error: string }[];
  }> {
    const results = {
      created: [] as Appointment[],
      skipped: [] as { date: Date; reason: string }[],
      failed: [] as { date: Date; error: string }[]
    };
    
    const masterAppointmentId = `master_${Date.now()}`;
    let currentDate = new Date(baseAppointment.scheduled_date);
    const endDate = recurringPattern.end_date || new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
    let occurrenceCount = 0;
    const maxOccurrences = recurringPattern.occurrence_count || Number.MAX_SAFE_INTEGER;

    // Pre-check Medicare limits for the entire series
    const projectedDates = this.getProjectedRecurringDates(currentDate, recurringPattern, endDate);
    const medicareWarnings = await this.checkMedicareSeriesLimits(
      baseAppointment.patient_id,
      baseAppointment.appointment_type,
      projectedDates
    );
    
    if (medicareWarnings.length > 0) {
      console.warn('Medicare limit warnings:', medicareWarnings);
    }

    while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
      // Check if this date should be skipped
      if (recurringPattern.exceptions?.some(exc => 
        exc.toDateString() === currentDate.toDateString()
      )) {
        results.skipped.push({ 
          date: new Date(currentDate), 
          reason: 'Exception date specified' 
        });
        currentDate = this.getNextDate(currentDate, recurringPattern);
        continue;
      }

      if (recurringPattern.skip_holidays && this.isHoliday(currentDate)) {
        results.skipped.push({ 
          date: new Date(currentDate), 
          reason: 'Holiday' 
        });
        currentDate = this.getNextDate(currentDate, recurringPattern);
        continue;
      }

      // Check for conflicts
      const conflict = this.checkScheduleConflict(
        baseAppointment.professional_id,
        currentDate,
        baseAppointment.scheduled_time,
        baseAppointment.duration_minutes
      );

      if (conflict && !recurringPattern.allow_conflicts) {
        if (recurringPattern.auto_adjust_conflicts) {
          // Try to find alternative time slot
          const alternativeSlot = this.findNearestAvailableSlot(
            baseAppointment.professional_id,
            currentDate,
            baseAppointment.scheduled_time,
            baseAppointment.duration_minutes
          );
          
          if (alternativeSlot) {
            baseAppointment.scheduled_time = alternativeSlot.start_time;
            console.log(`📅 Auto-adjusted time to ${alternativeSlot.start_time} for ${currentDate.toDateString()}`);
          } else {
            results.skipped.push({ 
              date: new Date(currentDate), 
              reason: 'Schedule conflict - no alternative slot available' 
            });
            currentDate = this.getNextDate(currentDate, recurringPattern);
            continue;
          }
        } else {
          results.skipped.push({ 
            date: new Date(currentDate), 
            reason: 'Schedule conflict' 
          });
          currentDate = this.getNextDate(currentDate, recurringPattern);
          continue;
        }
      }

      // Create appointment for this date
      const appointmentData = {
        ...baseAppointment,
        scheduled_date: new Date(currentDate),
        recurring_info: {
          pattern: recurringPattern.pattern,
          frequency: recurringPattern.frequency,
          days_of_week: recurringPattern.days_of_week,
          end_date: recurringPattern.end_date,
          exceptions: recurringPattern.exceptions,
          master_appointment_id: masterAppointmentId
        }
      };

      try {
        const appointment = await this.createAppointment(appointmentData);
        if (appointment) {
          results.created.push(appointment);
          occurrenceCount++;
        } else {
          results.failed.push({ 
            date: new Date(currentDate), 
            error: 'Failed to create appointment' 
          });
        }
      } catch (error) {
        results.failed.push({ 
          date: new Date(currentDate), 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }

      // Move to next date
      currentDate = this.getNextDate(currentDate, recurringPattern);
    }

    console.log(`📅 Recurring appointments summary: ${results.created.length} created, ${results.skipped.length} skipped, ${results.failed.length} failed`);
    
    // Send summary notification
    if (results.created.length > 0) {
      await this.sendRecurringAppointmentSummary(
        baseAppointment.patient_id,
        results,
        masterAppointmentId
      );
    }

    return results;
  }

  /**
   * Update all appointments in a recurring series
   */
  async updateRecurringSeries(
    masterAppointmentId: string,
    updates: Partial<Appointment>,
    updateScope: 'all' | 'future' | 'single',
    targetAppointmentId?: string
  ): Promise<{ updated: number; failed: number }> {
    const results = { updated: 0, failed: 0 };
    const now = new Date();

    const seriesAppointments = Array.from(this.appointments.values()).filter(apt =>
      apt.recurring_info?.master_appointment_id === masterAppointmentId
    );

    for (const appointment of seriesAppointments) {
      let shouldUpdate = false;

      switch (updateScope) {
        case 'all':
          shouldUpdate = true;
          break;
        case 'future':
          shouldUpdate = appointment.scheduled_date >= now && appointment.status !== 'completed';
          break;
        case 'single':
          shouldUpdate = appointment.appointment_id === targetAppointmentId;
          break;
      }

      if (shouldUpdate) {
        try {
          // Apply updates
          Object.assign(appointment, updates);
          appointment.updated_at = new Date();
          
          // If time/date changed, check for conflicts
          if (updates.scheduled_date || updates.scheduled_time) {
            const conflict = this.checkScheduleConflict(
              appointment.professional_id,
              appointment.scheduled_date,
              appointment.scheduled_time,
              appointment.duration_minutes
            );
            
            if (conflict) {
              console.warn(`Conflict detected for appointment ${appointment.appointment_id}`);
              results.failed++;
              continue;
            }
          }

          // Update schedule if needed
          if (updates.scheduled_date || updates.scheduled_time || updates.duration_minutes) {
            this.removeFromSchedule(appointment);
            this.updateProfessionalSchedule(
              appointment.professional_id,
              appointment.scheduled_date,
              appointment
            );
          }

          results.updated++;
        } catch (error) {
          console.error(`Failed to update appointment ${appointment.appointment_id}:`, error);
          results.failed++;
        }
      }
    }

    this.saveScheduleData();
    console.log(`📅 Updated ${results.updated} appointments in series ${masterAppointmentId}`);
    
    return results;
  }

  /**
   * Cancel entire recurring series or future appointments
   */
  async cancelRecurringSeries(
    masterAppointmentId: string,
    cancelScope: 'all' | 'future',
    reason: string,
    cancelledBy: 'patient' | 'professional' | 'system'
  ): Promise<{ cancelled: number; fees_applied: number }> {
    const results = { cancelled: 0, fees_applied: 0 };
    const now = new Date();

    const seriesAppointments = Array.from(this.appointments.values()).filter(apt =>
      apt.recurring_info?.master_appointment_id === masterAppointmentId &&
      apt.status !== 'completed' && apt.status !== 'cancelled'
    );

    for (const appointment of seriesAppointments) {
      const shouldCancel = cancelScope === 'all' || 
        (cancelScope === 'future' && appointment.scheduled_date >= now);

      if (shouldCancel) {
        const cancelled = await this.cancelAppointment(
          appointment.appointment_id,
          `${reason} (Series cancellation)`,
          cancelledBy
        );
        
        if (cancelled) {
          results.cancelled++;
          
          // Check if late cancellation fee applies
          const hoursUntilAppointment = (appointment.scheduled_date.getTime() - Date.now()) / (1000 * 60 * 60);
          if (hoursUntilAppointment < 24 && cancelledBy === 'patient') {
            results.fees_applied++;
          }
        }
      }
    }

    console.log(`📅 Cancelled ${results.cancelled} appointments from series ${masterAppointmentId}`);
    return results;
  }

  // Private helper methods

  private async verifyInsuranceAuthorization(
    patientId: string,
    cptCode: string,
    serviceDate: Date
  ): Promise<{ authorized: boolean; reason?: string; prior_auth_required?: boolean }> {
    const profile = this.billingService.getBillingProfile(patientId);
    if (!profile) {
      return { authorized: false, reason: 'No billing profile found' };
    }

    const authStatus = this.billingService.checkAuthorizationStatus(patientId);
    if (!authStatus.hasActive) {
      return { authorized: false, reason: 'No active authorization' };
    }

    // Check if CPT code requires prior authorization
    const requiresPriorAuth = this.checkPriorAuthRequirement(cptCode, profile.insuranceInfo.provider);
    
    return {
      authorized: true,
      prior_auth_required: requiresPriorAuth
    };
  }

  private checkScheduleConflict(
    professionalId: string,
    date: Date,
    time: string,
    duration: number
  ): boolean {
    const schedule = this.getProfessionalSchedule(professionalId, date);
    if (!schedule) return false;

    const requestedStart = this.timeToMinutes(time);
    const requestedEnd = requestedStart + duration;

    // Check each existing appointment
    for (const appointment of this.appointments.values()) {
      if (
        appointment.professional_id === professionalId &&
        appointment.scheduled_date.toDateString() === date.toDateString() &&
        appointment.status !== 'cancelled'
      ) {
        const aptStart = this.timeToMinutes(appointment.scheduled_time);
        const aptEnd = aptStart + appointment.duration_minutes;

        // Check for overlap
        if (
          (requestedStart >= aptStart && requestedStart < aptEnd) ||
          (requestedEnd > aptStart && requestedEnd <= aptEnd) ||
          (requestedStart <= aptStart && requestedEnd >= aptEnd)
        ) {
          return true; // Conflict found
        }
      }
    }

    return false;
  }

  private async checkMedicareLimits(
    patientId: string,
    appointmentType: Appointment['appointment_type'],
    scheduledDate: Date
  ): Promise<boolean> {
    const limits = this.medicareSettings.session_limits[appointmentType];
    if (!limits) return true;

    // Count existing appointments of this type
    const existingAppointments = Array.from(this.appointments.values()).filter(apt =>
      apt.patient_id === patientId &&
      apt.appointment_type === appointmentType &&
      apt.status !== 'cancelled'
    );

    // Check weekly limits
    if ('max_per_week' in limits) {
      const weekStart = new Date(scheduledDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weeklyCount = existingAppointments.filter(apt =>
        apt.scheduled_date >= weekStart && apt.scheduled_date <= weekEnd
      ).length;

      if (weeklyCount >= limits.max_per_week) {
        console.log(`Weekly limit reached for ${appointmentType}`);
        return false;
      }
    }

    // Check yearly limits
    if ('max_per_year' in limits) {
      const yearStart = new Date(scheduledDate.getFullYear(), 0, 1);
      const yearEnd = new Date(scheduledDate.getFullYear(), 11, 31);

      const yearlyCount = existingAppointments.filter(apt =>
        apt.scheduled_date >= yearStart && apt.scheduled_date <= yearEnd
      ).length;

      if (yearlyCount >= limits.max_per_year) {
        console.log(`Yearly limit reached for ${appointmentType}`);
        return false;
      }
    }

    return true;
  }

  private updateProfessionalSchedule(
    professionalId: string,
    date: Date,
    appointment: Appointment
  ): void {
    const dateKey = this.getDateKey(date);
    
    if (!this.schedules.has(professionalId)) {
      this.schedules.set(professionalId, new Map());
    }

    const professionalSchedules = this.schedules.get(professionalId)!;
    let schedule = professionalSchedules.get(dateKey);

    if (!schedule) {
      // Create default schedule
      schedule = this.createDefaultSchedule(professionalId, date);
      professionalSchedules.set(dateKey, schedule);
    }

    // Mark time slots as unavailable
    const startMinutes = this.timeToMinutes(appointment.scheduled_time);
    const endMinutes = startMinutes + appointment.duration_minutes;
    const slotDuration = 15; // 15-minute slots

    schedule.time_slots.forEach(slot => {
      const slotStart = this.timeToMinutes(slot.start_time);
      const slotEnd = this.timeToMinutes(slot.end_time);

      if (slotStart >= startMinutes && slotEnd <= endMinutes) {
        slot.available = false;
        slot.appointment_id = appointment.appointment_id;
      }
    });

    // Update statistics
    schedule.total_appointments += 1;
    schedule.total_billable_hours += appointment.duration_minutes / 60;
    schedule.estimated_daily_revenue += appointment.billing_info.estimated_reimbursement;
  }

  private async generateBillingClaim(
    appointment: Appointment,
    actualDuration: number
  ): Promise<any> {
    // Calculate units for billing (each unit = 15 minutes for most codes)
    const units = Math.ceil(actualDuration / 15);
    
    const sessionData = {
      sessionId: appointment.appointment_id,
      date: appointment.scheduled_date,
      duration: actualDuration,
      cptCode: appointment.billing_info.cpt_code,
      modifiers: appointment.billing_info.modifiers,
      units: units,
      rate: appointment.billing_info.estimated_reimbursement / units,
      amount: appointment.billing_info.estimated_reimbursement,
      supervisionRequired: false,
      notes: appointment.notes?.billing_notes
    };

    const claim = this.billingService.createClaim(
      appointment.patient_id,
      [appointment.appointment_id],
      { submitImmediately: true }
    );

    return claim;
  }

  private async sendAppointmentConfirmation(appointment: Appointment): Promise<void> {
    // Send real-time notification
    await realtimeUpdatesService.sendRecommendationUpdate(appointment.patient_id, {
      recommendation_id: 'appointment_confirmation',
      user_id: appointment.patient_id,
      generated_at: new Date(),
      recommendation_type: 'immediate_action',
      priority_level: 'medium',
      confidence_score: 100,
      title: 'Appointment Confirmed',
      description: `Your ${appointment.appointment_type} appointment is confirmed for ${appointment.scheduled_date.toLocaleDateString()} at ${appointment.scheduled_time}`,
      specific_actions: ['Add to calendar', 'Review session goals', 'Prepare questions'],
      expected_outcomes: appointment.clinical_info.treatment_goals,
      optimal_timing: {
        session_frequency: 'once',
        duration_minutes: appointment.duration_minutes,
        time_of_day: appointment.scheduled_time
      },
      rationale: 'Scheduled therapy appointment',
      supporting_data: {
        user_patterns: [],
        performance_trends: [],
        ai_insights: [],
        therapeutic_alignment: appointment.clinical_info.treatment_goals
      },
      implementation: {
        game_activities: [],
        progression_milestones: [],
        success_metrics: []
      },
      adaptation_triggers: [],
      status: 'active',
      progress_tracking: {
        attempts: 0,
        successes: 0,
        current_milestone: 0,
        last_activity: new Date()
      }
    } as any);

    console.log(`📧 Appointment confirmation sent for ${appointment.appointment_id}`);
  }

  private scheduleReminders(appointment: Appointment): void {
    if (!appointment.reminder_settings.patient_reminder) return;

    const reminderTime = new Date(appointment.scheduled_date);
    reminderTime.setHours(
      parseInt(appointment.scheduled_time.split(':')[0]) - appointment.reminder_settings.patient_reminder_hours
    );

    // Schedule reminder (in production, this would use a job queue)
    const timeUntilReminder = reminderTime.getTime() - Date.now();
    if (timeUntilReminder > 0) {
      setTimeout(() => {
        this.sendAppointmentReminder(appointment);
      }, timeUntilReminder);
    }
  }

  private async sendAppointmentReminder(appointment: Appointment): Promise<void> {
    // Mark reminder as sent
    appointment.reminder_settings.reminder_sent = true;
    this.saveScheduleData();

    console.log(`🔔 Reminder sent for appointment ${appointment.appointment_id}`);
  }

  private createDefaultSchedule(professionalId: string, date: Date): ProfessionalSchedule {
    const schedule: ProfessionalSchedule = {
      professional_id: professionalId,
      schedule_date: date,
      working_hours: {
        start: '08:00',
        end: '17:00',
        lunch_break: {
          start: '12:00',
          end: '13:00'
        }
      },
      time_slots: [],
      total_appointments: 0,
      total_billable_hours: 0,
      estimated_daily_revenue: 0
    };

    // Generate 15-minute time slots
    const startMinutes = this.timeToMinutes(schedule.working_hours.start);
    const endMinutes = this.timeToMinutes(schedule.working_hours.end);
    const lunchStartMinutes = this.timeToMinutes(schedule.working_hours.lunch_break!.start);
    const lunchEndMinutes = this.timeToMinutes(schedule.working_hours.lunch_break!.end);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
      const isLunchTime = minutes >= lunchStartMinutes && minutes < lunchEndMinutes;
      
      schedule.time_slots.push({
        start_time: this.minutesToTime(minutes),
        end_time: this.minutesToTime(minutes + 15),
        available: !isLunchTime,
        break_time: isLunchTime
      });
    }

    return schedule;
  }

  private setupDefaultTemplates(): void {
    // Create common appointment templates
    const templates = [
      {
        template_id: 'eval_initial',
        template_name: 'Initial Evaluation',
        appointment_type: 'evaluation' as const,
        default_duration: 60,
        default_cpt_code: '92523',
        default_goals: ['Assess communication needs', 'Determine AAC requirements', 'Establish baseline'],
        default_materials: ['Assessment forms', 'AAC device options', 'Parent questionnaire']
      },
      {
        template_id: 'therapy_individual',
        template_name: 'Individual Therapy Session',
        appointment_type: 'individual_therapy' as const,
        default_duration: 30,
        default_cpt_code: '92507',
        default_goals: ['AAC device training', 'Communication practice', 'Skill development'],
        default_materials: ['AAC device', 'Visual supports', 'Practice materials']
      },
      {
        template_id: 'therapy_group',
        template_name: 'Group Therapy Session',
        appointment_type: 'group_therapy' as const,
        default_duration: 45,
        default_cpt_code: '92508',
        default_goals: ['Social communication', 'Peer interaction', 'Group activities'],
        default_materials: ['Group activity materials', 'AAC devices', 'Social stories']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.template_id, {
        ...template,
        professional_id: 'default',
        default_location_type: 'in_person'
      });
    });
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private getSessionDescription(appointment: Appointment): string {
    const typeDescriptions = {
      evaluation: 'AAC Evaluation',
      individual_therapy: 'Individual AAC Therapy',
      group_therapy: 'Group AAC Therapy',
      teletherapy: 'Teletherapy Session',
      consultation: 'Consultation',
      assessment: 'Assessment'
    };

    return typeDescriptions[appointment.appointment_type] || 'Therapy Session';
  }

  private extractTherapySessionId(appointment: Appointment): string | null {
    if (!appointment.notes?.billing_notes) return null;
    
    const match = appointment.notes.billing_notes.match(/Therapy Session ID: ([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  private checkPriorAuthRequirement(cptCode: string, insurer: string): boolean {
    // Medicare/Medicaid prior auth requirements
    const requiresPriorAuth = {
      '92607': true, // AAC device evaluation
      '92608': true, // AAC device follow-up
      '98966': true  // Teletherapy
    };

    return requiresPriorAuth[cptCode] || false;
  }

  private isHoliday(date: Date): boolean {
    // Simple holiday check - in production would use comprehensive calendar
    const holidays = [
      '01-01', // New Year's Day
      '07-04', // Independence Day
      '12-25'  // Christmas
    ];

    const monthDay = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return holidays.includes(monthDay);
  }

  private getNextDate(currentDate: Date, pattern: any): Date {
    const next = new Date(currentDate);
    
    switch (pattern.pattern) {
      case 'daily':
        next.setDate(next.getDate() + pattern.frequency);
        break;
      case 'weekly':
        if (pattern.days_of_week && pattern.days_of_week.length > 0) {
          // Find next occurrence on specified days
          let daysAdded = 0;
          do {
            next.setDate(next.getDate() + 1);
            daysAdded++;
          } while (!pattern.days_of_week.includes(next.getDay()) && daysAdded < 7);
        } else {
          next.setDate(next.getDate() + (7 * pattern.frequency));
        }
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        const currentDay = currentDate.getDate();
        next.setMonth(next.getMonth() + pattern.frequency);
        // Handle month-end edge cases
        if (next.getDate() !== currentDay) {
          next.setDate(0); // Last day of previous month
        }
        break;
    }

    return next;
  }

  private getProjectedRecurringDates(
    startDate: Date,
    pattern: any,
    endDate: Date
  ): Date[] {
    const dates: Date[] = [];
    let current = new Date(startDate);
    
    while (current <= endDate && dates.length < 100) { // Limit to prevent infinite loops
      dates.push(new Date(current));
      current = this.getNextDate(current, pattern);
    }
    
    return dates;
  }

  private async checkMedicareSeriesLimits(
    patientId: string,
    appointmentType: Appointment['appointment_type'],
    projectedDates: Date[]
  ): Promise<string[]> {
    const warnings: string[] = [];
    const limits = this.medicareSettings.session_limits[appointmentType];
    if (!limits) return warnings;

    // Group dates by week and year
    const weeklyGroups = new Map<string, Date[]>();
    const yearlyGroups = new Map<number, Date[]>();

    projectedDates.forEach(date => {
      // Weekly grouping
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, []);
      }
      weeklyGroups.get(weekKey)!.push(date);

      // Yearly grouping
      const year = date.getFullYear();
      if (!yearlyGroups.has(year)) {
        yearlyGroups.set(year, []);
      }
      yearlyGroups.get(year)!.push(date);
    });

    // Check weekly limits
    if ('max_per_week' in limits) {
      weeklyGroups.forEach((dates, weekKey) => {
        if (dates.length > limits.max_per_week) {
          warnings.push(`Week of ${weekKey}: ${dates.length} appointments exceed weekly limit of ${limits.max_per_week}`);
        }
      });
    }

    // Check yearly limits
    if ('max_per_year' in limits) {
      yearlyGroups.forEach((dates, year) => {
        if (dates.length > limits.max_per_year) {
          warnings.push(`Year ${year}: ${dates.length} appointments exceed yearly limit of ${limits.max_per_year}`);
        }
      });
    }

    return warnings;
  }

  private findNearestAvailableSlot(
    professionalId: string,
    date: Date,
    preferredTime: string,
    duration: number
  ): TimeSlot | null {
    const availableSlots = this.getAvailableTimeSlots(
      professionalId,
      date,
      'individual_therapy', // Default type
      duration
    );

    if (availableSlots.length === 0) return null;

    // Convert preferred time to minutes for comparison
    const preferredMinutes = this.timeToMinutes(preferredTime);

    // Find closest slot
    let closestSlot = availableSlots[0];
    let minDifference = Math.abs(this.timeToMinutes(closestSlot.start_time) - preferredMinutes);

    availableSlots.forEach(slot => {
      const difference = Math.abs(this.timeToMinutes(slot.start_time) - preferredMinutes);
      if (difference < minDifference) {
        minDifference = difference;
        closestSlot = slot;
      }
    });

    return closestSlot;
  }

  private async sendRecurringAppointmentSummary(
    patientId: string,
    results: { 
      created: Appointment[]; 
      skipped: { date: Date; reason: string }[];
      failed: { date: Date; error: string }[];
    },
    masterAppointmentId: string
  ): Promise<void> {
    const summary = {
      total_scheduled: results.created.length,
      total_skipped: results.skipped.length,
      total_failed: results.failed.length,
      first_appointment: results.created[0]?.scheduled_date,
      last_appointment: results.created[results.created.length - 1]?.scheduled_date,
      estimated_total_cost: results.created.reduce((sum, apt) => 
        sum + apt.billing_info.estimated_reimbursement, 0
      ),
      estimated_copay_total: results.created.reduce((sum, apt) => 
        sum + apt.billing_info.copay_amount, 0
      )
    };

    await realtimeUpdatesService.sendRecommendationUpdate(patientId, {
      recommendation_id: `recurring_series_${masterAppointmentId}`,
      user_id: patientId,
      generated_at: new Date(),
      recommendation_type: 'informational',
      priority_level: 'medium',
      confidence_score: 100,
      title: 'Recurring Appointments Scheduled',
      description: `${summary.total_scheduled} appointments scheduled from ${summary.first_appointment?.toLocaleDateString()} to ${summary.last_appointment?.toLocaleDateString()}`,
      specific_actions: [
        `Review ${summary.total_scheduled} scheduled appointments`,
        `Total estimated cost: $${summary.estimated_total_cost.toFixed(2)}`,
        `Total estimated copay: $${summary.estimated_copay_total.toFixed(2)}`
      ],
      expected_outcomes: ['Regular therapy sessions', 'Consistent progress tracking'],
      optimal_timing: {
        session_frequency: 'recurring',
        duration_minutes: 0
      },
      rationale: 'Recurring appointment series created',
      supporting_data: {
        user_patterns: [],
        performance_trends: [],
        ai_insights: [`${results.skipped.length} dates skipped`, `${results.failed.length} appointments failed`],
        therapeutic_alignment: []
      },
      implementation: {
        game_activities: [],
        progression_milestones: [],
        success_metrics: []
      },
      adaptation_triggers: [],
      status: 'active',
      progress_tracking: {
        attempts: 0,
        successes: 0,
        current_milestone: 0,
        last_activity: new Date()
      }
    } as any);

    console.log(`📧 Recurring appointment summary sent for series ${masterAppointmentId}`);
  }

  private removeFromSchedule(appointment: Appointment): void {
    const schedule = this.getProfessionalSchedule(
      appointment.professional_id,
      appointment.scheduled_date
    );
    
    if (schedule) {
      // Mark slots as available again
      schedule.time_slots.forEach(slot => {
        if (slot.appointment_id === appointment.appointment_id) {
          slot.available = true;
          slot.appointment_id = undefined;
        }
      });
      
      // Update statistics
      schedule.total_appointments -= 1;
      schedule.total_billable_hours -= appointment.duration_minutes / 60;
      schedule.estimated_daily_revenue -= appointment.billing_info.estimated_reimbursement;
    }
  }

  private async sendRescheduleNotification(appointment: Appointment): Promise<void> {
    console.log(`📅 Reschedule notification sent for ${appointment.appointment_id}`);
  }

  private async sendCancellationNotification(appointment: Appointment, reason: string): Promise<void> {
    console.log(`❌ Cancellation notification sent for ${appointment.appointment_id}: ${reason}`);
  }

  private async sendBillingConfirmation(appointment: Appointment, claim: any): Promise<void> {
    console.log(`💰 Billing confirmation sent for ${appointment.appointment_id}`);
  }

  private async applyLateCancellationFee(appointment: Appointment): Promise<void> {
    console.log(`💸 Late cancellation fee applied for ${appointment.appointment_id}`);
  }

  private async scheduleNextRecurringAppointment(appointment: Appointment): Promise<void> {
    if (!appointment.recurring_info) return;

    const nextDate = this.getNextDate(
      appointment.scheduled_date,
      appointment.recurring_info
    );

    if (nextDate <= appointment.recurring_info.end_date!) {
      const nextAppointment = {
        ...appointment,
        scheduled_date: nextDate,
        status: 'scheduled' as const,
        notes: {
          pre_session_notes: `Recurring appointment from master ID: ${appointment.recurring_info.master_appointment_id}`
        }
      };

      delete (nextAppointment as any).appointment_id;
      delete (nextAppointment as any).created_at;
      delete (nextAppointment as any).updated_at;

      await this.createAppointment(nextAppointment);
    }
  }

  private startReminderService(): void {
    // Check for reminders every hour
    setInterval(() => {
      this.checkAndSendReminders();
    }, 60 * 60 * 1000);
  }

  private checkAndSendReminders(): void {
    const now = new Date();
    
    for (const appointment of this.appointments.values()) {
      if (
        appointment.status === 'confirmed' &&
        appointment.reminder_settings.patient_reminder &&
        !appointment.reminder_settings.reminder_sent
      ) {
        const reminderTime = new Date(appointment.scheduled_date);
        reminderTime.setHours(
          parseInt(appointment.scheduled_time.split(':')[0]) - appointment.reminder_settings.patient_reminder_hours
        );

        if (now >= reminderTime) {
          this.sendAppointmentReminder(appointment);
        }
      }
    }
  }

  private loadScheduleData(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const savedAppointments = localStorage.getItem('appointmentSchedules');
      if (savedAppointments) {
        const data = JSON.parse(savedAppointments);
        data.forEach((apt: any) => {
          apt.scheduled_date = new Date(apt.scheduled_date);
          apt.created_at = new Date(apt.created_at);
          apt.updated_at = new Date(apt.updated_at);
          if (apt.recurring_info?.end_date) {
            apt.recurring_info.end_date = new Date(apt.recurring_info.end_date);
          }
          this.appointments.set(apt.appointment_id, apt);
        });
      }
      console.log('📅 Schedule data loaded successfully');
    } catch (error) {
      console.warn('Could not load schedule data:', error);
    }
  }

  private saveScheduleData(): void {
    try {
      const appointments = Array.from(this.appointments.values());
      localStorage.setItem('appointmentSchedules', JSON.stringify(appointments));
    } catch (error) {
      console.warn('Could not save schedule data:', error);
    }
  }
}

// Export singleton instance
export const appointmentSchedulingService = AppointmentSchedulingService.getInstance();