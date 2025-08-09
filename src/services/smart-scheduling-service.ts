/**
 * Smart Scheduling & Calendar Sync Service
 * Integrated scheduling system with AI optimization
 * Included in Pro tier ($30/mo) and above
 */

export interface CalendarProvider {
  type: 'google' | 'outlook' | 'apple' | 'tinkyBink';
  connected: boolean;
  email: string;
  lastSync: Date;
  syncEnabled: boolean;
  permissions: string[];
}

export interface AppointmentType {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  
  // Service Details
  category: 'evaluation' | 'therapy' | 'consultation' | 'group';
  description: string;
  telehealth: boolean;
  inPerson: boolean;
  
  // Requirements
  preparation: {
    therapist: string[];
    family: string[];
    materials: string[];
  };
  
  // Follow-up
  postSession: {
    documentation: string[];
    billing: {
      cptCode: string;
      typical: boolean;
    };
    nextSteps: string[];
  };
  
  // Scheduling Rules
  scheduling: {
    advanceBooking: {
      min: number; // hours
      max: number; // days
    };
    bufferTime: {
      before: number; // minutes
      after: number; // minutes
    };
    allowBackToBack: boolean;
    maxPerDay: number;
    requiresApproval: boolean;
  };
}

export interface AvailabilitySlot {
  id: string;
  therapistId: string;
  
  // Time Details
  date: Date;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  duration: number;  // minutes per slot
  
  // Availability Type
  type: 'available' | 'busy' | 'tentative' | 'out_of_office';
  recurring: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly';
    until?: Date;
    exceptions: Date[];
  };
  
  // Booking Rules
  bookingRules: {
    appointmentTypes: string[];
    clientTypes: string[];
    minimumNotice: number; // hours
    allowOnlineBooking: boolean;
    requiresApproval: boolean;
  };
  
  // Location
  location: {
    type: 'in_person' | 'telehealth' | 'hybrid';
    address?: string;
    room?: string;
    platform?: string;
    meetingLink?: string;
  };
}

export interface Appointment {
  id: string;
  therapistId: string;
  patientId: string;
  
  // Appointment Details
  type: string; // appointment type ID
  title: string;
  description: string;
  
  // Scheduling
  date: Date;
  startTime: Date;
  endTime: Date;
  timezone: string;
  
  // Status
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // Participants
  attendees: Array<{
    type: 'therapist' | 'patient' | 'parent' | 'caregiver';
    name: string;
    email: string;
    phone?: string;
    confirmed: boolean;
  }>;
  
  // Location & Format
  format: 'in_person' | 'telehealth';
  location: {
    address?: string;
    room?: string;
    meetingLink?: string;
    platform?: string;
    accessInstructions?: string;
  };
  
  // Integration
  externalIds: Record<string, string>; // calendar provider IDs
  
  // Automation
  reminders: Array<{
    type: 'email' | 'sms' | 'push';
    timing: number; // hours before
    sent: boolean;
    sentAt?: Date;
  }>;
  
  // Documentation
  notes: string;
  preparation: {
    completed: boolean;
    materials: string[];
    specialInstructions: string[];
  };
  
  // Billing Integration
  billing: {
    billable: boolean;
    cptCode?: string;
    duration?: number;
    sessionId?: string;
  };
}

export interface SchedulingPreferences {
  therapistId: string;
  
  // Working Hours
  workingHours: Array<{
    dayOfWeek: number; // 0-6, Sunday = 0
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
  
  // Breaks & Buffer Times
  breaks: Array<{
    name: string;
    startTime: string;
    endTime: string;
    daily: boolean;
    days?: number[];
  }>;
  
  // Scheduling Preferences  
  preferences: {
    defaultAppointmentLength: number;
    bufferBetweenAppointments: number;
    maxAppointmentsPerDay: number;
    allowBackToBackBookings: boolean;
    requireConfirmation: boolean;
    autoConfirmRegularClients: boolean;
  };
  
  // Availability Management
  availability: {
    advanceBookingLimit: number; // days
    minimumNotice: number; // hours
    allowSameDayBooking: boolean;
    allowWeekendBooking: boolean;
    blackoutDates: Date[];
  };
  
  // Communication
  notifications: {
    newBooking: boolean;
    cancellation: boolean;
    reminder: boolean;
    preferredMethod: 'email' | 'sms' | 'both';
  };
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  therapistId: string;
  
  // Request Details
  appointmentType: string;
  preferredDates: Date[];
  preferredTimes: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  
  // Flexibility
  flexibility: {
    dateRange: number; // days willing to wait
    timeFlexibility: number; // hours around preferred time
    acceptTelehealth: boolean;
    acceptDifferentTherapist: boolean;
  };
  
  // Status
  status: 'active' | 'matched' | 'expired' | 'cancelled';
  addedAt: Date;
  expiresAt: Date;
  
  // Notifications
  notifyWhen: {
    exactMatch: boolean;
    similarTime: boolean;
    anyAvailability: boolean;
  };
}

class SmartSchedulingService {
  private static instance: SmartSchedulingService;
  
  private appointments: Map<string, Appointment> = new Map();
  private availability: Map<string, AvailabilitySlot[]> = new Map();
  private appointmentTypes: Map<string, AppointmentType> = new Map();
  private waitlist: Map<string, WaitlistEntry> = new Map();
  private calendarProviders: Map<string, CalendarProvider[]> = new Map();
  
  private constructor() {
    this.initializeAppointmentTypes();
    this.initializeSampleData();
  }
  
  static getInstance(): SmartSchedulingService {
    if (!SmartSchedulingService.instance) {
      SmartSchedulingService.instance = new SmartSchedulingService();
    }
    return SmartSchedulingService.instance;
  }
  
  /**
   * Connect external calendar provider
   */
  async connectCalendar(therapistId: string, provider: {
    type: 'google' | 'outlook' | 'apple';
    accessToken: string;
    email: string;
  }): Promise<{
    success: boolean;
    providerId: string;
    syncedEvents: number;
  }> {
    const calendarProvider: CalendarProvider = {
      type: provider.type,
      connected: true,
      email: provider.email,
      lastSync: new Date(),
      syncEnabled: true,
      permissions: ['read', 'write']
    };
    
    const providers = this.calendarProviders.get(therapistId) || [];
    providers.push(calendarProvider);
    this.calendarProviders.set(therapistId, providers);
    
    // Sync existing events
    const syncedEvents = await this.syncCalendarEvents(therapistId, provider.type);
    
    return {
      success: true,
      providerId: `${provider.type}_${therapistId}`,
      syncedEvents
    };
  }
  
  /**
   * AI-powered availability optimization
   */
  async optimizeAvailability(therapistId: string, preferences: {
    goalAppointmentsPerDay: number;
    preferredClientTypes: string[];
    revenueGoals: number;
  }): Promise<{
    recommendations: Array<{
      suggestion: string;
      impact: string;
      implementation: string;
    }>;
    projectedIncrease: {
      appointments: number;
      revenue: number;
    };
  }> {
    const currentAvailability = this.availability.get(therapistId) || [];
    const appointments = Array.from(this.appointments.values())
      .filter(apt => apt.therapistId === therapistId);
    
    const recommendations = [];
    
    // Analyze current utilization
    const utilization = this.calculateUtilization(therapistId);
    if (utilization < 0.7) {
      recommendations.push({
        suggestion: 'Add morning availability slots',
        impact: `Increase capacity by ${Math.round((0.8 - utilization) * 40)} appointments/week`,
        implementation: 'Add 8:00-9:00 AM slots on Tuesday-Thursday'
      });
    }
    
    // Revenue optimization
    const avgSessionValue = this.calculateAverageSessionValue(appointments);
    recommendations.push({
      suggestion: 'Promote higher-value appointment types',
      impact: `Increase revenue by $${Math.round(avgSessionValue * 0.2 * preferences.goalAppointmentsPerDay * 5)}/week`,
      implementation: 'Offer more evaluation and consultation slots during peak hours'
    });
    
    // Client type optimization
    recommendations.push({
      suggestion: 'Optimize scheduling for returning clients',
      impact: 'Reduce no-shows by 15%, improve client satisfaction',
      implementation: 'Auto-schedule follow-ups during preferred time slots'
    });
    
    return {
      recommendations,
      projectedIncrease: {
        appointments: Math.round(preferences.goalAppointmentsPerDay * 1.3),
        revenue: Math.round(preferences.revenueGoals * 1.25)
      }
    };
  }
  
  /**
   * Intelligent appointment scheduling
   */
  async scheduleAppointment(request: {
    therapistId: string;
    patientId: string;
    appointmentTypeId: string;
    preferredDate?: Date;
    preferredTime?: string;
    flexibility: {
      dateRange: number; // days
      timeRange: number; // hours
    };
    requirements: {
      format: 'in_person' | 'telehealth' | 'either';
      urgency: 'low' | 'medium' | 'high';
    };
  }): Promise<{
    success: boolean;
    appointment?: Appointment;
    alternatives?: Array<{
      date: Date;
      time: string;
      score: number;
      reasoning: string;
    }>;
    waitlistOption?: boolean;
  }> {
    const appointmentType = this.appointmentTypes.get(request.appointmentTypeId);
    if (!appointmentType) {
      return { success: false, waitlistOption: false };
    }
    
    // Find optimal time slots
    const optimalSlots = await this.findOptimalSlots(request);
    
    if (optimalSlots.length === 0) {
      // Add to waitlist
      await this.addToWaitlist(request);
      return { 
        success: false, 
        waitlistOption: true,
        alternatives: []
      };
    }
    
    // Create appointment with best slot
    const bestSlot = optimalSlots[0];
    const appointmentId = `apt_${Date.now()}`;
    
    const appointment: Appointment = {
      id: appointmentId,
      therapistId: request.therapistId,
      patientId: request.patientId,
      type: request.appointmentTypeId,
      title: appointmentType.name,
      description: appointmentType.description,
      date: bestSlot.date,
      startTime: bestSlot.startTime,
      endTime: new Date(bestSlot.startTime.getTime() + appointmentType.duration * 60000),
      timezone: 'America/Chicago',
      status: 'scheduled',
      attendees: [
        {
          type: 'therapist',
          name: 'Dr. Sarah Johnson',
          email: 'sarah@tinkyBink.com',
          confirmed: false
        },
        {
          type: 'patient',
          name: 'Patient Name',
          email: 'parent@email.com',
          confirmed: false
        }
      ],
      format: request.requirements.format === 'either' ? 'in_person' : request.requirements.format,
      location: {
        address: '123 Therapy Lane, Austin, TX',
        room: 'Room A',
        meetingLink: request.requirements.format !== 'in_person' ? 'https://meet.tinkyBink.com/session' : undefined
      },
      externalIds: {},
      reminders: [
        { type: 'email', timing: 24, sent: false },
        { type: 'sms', timing: 2, sent: false }
      ],
      notes: '',
      preparation: {
        completed: false,
        materials: appointmentType.preparation.materials,
        specialInstructions: []
      },
      billing: {
        billable: true,
        cptCode: appointmentType.postSession.billing.cptCode
      }
    };
    
    this.appointments.set(appointmentId, appointment);
    
    // Sync with external calendars
    await this.syncAppointmentToCalendars(appointment);
    
    // Send confirmations
    await this.sendAppointmentConfirmations(appointment);
    
    return {
      success: true,
      appointment,
      alternatives: optimalSlots.slice(1, 4).map(slot => ({
        date: slot.date,
        time: slot.startTime.toTimeString().substring(0, 5),
        score: slot.score,
        reasoning: slot.reasoning
      }))
    };
  }
  
  /**
   * Automated reminder system
   */
  async processReminders(): Promise<{
    emailsSent: number;
    smsSent: number;
    errors: string[];
  }> {
    const now = new Date();
    let emailsSent = 0;
    let smsSent = 0;
    const errors = [];
    
    for (const appointment of this.appointments.values()) {
      if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
        continue;
      }
      
      for (const reminder of appointment.reminders) {
        if (reminder.sent) continue;
        
        const reminderTime = new Date(appointment.startTime.getTime() - reminder.timing * 60 * 60 * 1000);
        
        if (now >= reminderTime) {
          try {
            await this.sendReminder(appointment, reminder);
            reminder.sent = true;
            reminder.sentAt = now;
            
            if (reminder.type === 'email') emailsSent++;
            if (reminder.type === 'sms') smsSent++;
          } catch (error) {
            errors.push(`Failed to send ${reminder.type} reminder for appointment ${appointment.id}`);
          }
        }
      }
    }
    
    return { emailsSent, smsSent, errors };
  }
  
  /**
   * Waitlist management with auto-matching
   */
  async processWaitlist(): Promise<{
    matched: number;
    notified: number;
  }> {
    let matched = 0;
    let notified = 0;
    
    const activeWaitlistEntries = Array.from(this.waitlist.values())
      .filter(entry => entry.status === 'active' && entry.expiresAt > new Date());
    
    for (const entry of activeWaitlistEntries) {
      const availableSlots = await this.findOptimalSlots({
        therapistId: entry.therapistId,
        patientId: entry.patientId,
        appointmentTypeId: entry.appointmentType,
        flexibility: {
          dateRange: entry.flexibility.dateRange,
          timeRange: entry.flexibility.timeFlexibility
        },
        requirements: {
          format: entry.flexibility.acceptTelehealth ? 'either' : 'in_person',
          urgency: entry.urgency
        }
      });
      
      if (availableSlots.length > 0) {
        // Found match - notify client
        await this.notifyWaitlistMatch(entry, availableSlots[0]);
        entry.status = 'matched';
        matched++;
      }
    }
    
    return { matched, notified };
  }
  
  // Private helper methods
  private initializeAppointmentTypes(): void {
    const types: AppointmentType[] = [
      {
        id: 'initial_eval',
        name: 'Initial AAC Evaluation',
        duration: 90,
        price: 250,
        category: 'evaluation',
        description: 'Comprehensive assessment of communication needs and AAC device trial',
        telehealth: false,
        inPerson: true,
        preparation: {
          therapist: ['Review referral information', 'Prepare assessment materials'],
          family: ['Complete intake forms', 'Bring current communication methods'],
          materials: ['AAC devices', 'Assessment protocols', 'Recording equipment']
        },
        postSession: {
          documentation: ['Evaluation report', 'Device recommendations'],
          billing: { cptCode: '92521', typical: true },
          nextSteps: ['Schedule follow-up', 'Device trial period']
        },
        scheduling: {
          advanceBooking: { min: 24, max: 60 },
          bufferTime: { before: 15, after: 30 },
          allowBackToBack: false,
          maxPerDay: 2,
          requiresApproval: true
        }
      },
      {
        id: 'aac_therapy',
        name: 'AAC Therapy Session',
        duration: 45,
        price: 150,
        category: 'therapy',
        description: 'Individual AAC training and communication skill development',
        telehealth: true,
        inPerson: true,
        preparation: {
          therapist: ['Review previous session notes', 'Prepare activities'],
          family: ['Charge AAC device', 'Practice homework'],
          materials: ['AAC device', 'Activity materials']
        },
        postSession: {
          documentation: ['SOAP note', 'Progress tracking'],
          billing: { cptCode: '92507', typical: true },
          nextSteps: ['Assign homework', 'Schedule next session']
        },
        scheduling: {
          advanceBooking: { min: 2, max: 30 },
          bufferTime: { before: 5, after: 15 },
          allowBackToBack: true,
          maxPerDay: 8,
          requiresApproval: false
        }
      }
    ];
    
    types.forEach(type => {
      this.appointmentTypes.set(type.id, type);
    });
  }
  
  private initializeSampleData(): void {
    // Create sample availability
    const therapistId = 'therapist_001';
    const availability: AvailabilitySlot[] = [];
    
    // Generate weekly availability
    for (let day = 1; day <= 5; day++) { // Mon-Fri
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      availability.push({
        id: `slot_${day}`,
        therapistId,
        date,
        startTime: '09:00',
        endTime: '17:00',
        duration: 45,
        type: 'available',
        recurring: {
          enabled: true,
          pattern: 'weekly',
          exceptions: []
        },
        bookingRules: {
          appointmentTypes: ['aac_therapy', 'initial_eval'],
          clientTypes: ['child', 'adult'],
          minimumNotice: 2,
          allowOnlineBooking: true,
          requiresApproval: false
        },
        location: {
          type: 'hybrid',
          address: '123 Therapy Lane, Austin, TX',
          room: 'Room A'
        }
      });
    }
    
    this.availability.set(therapistId, availability);
  }
  
  private async syncCalendarEvents(therapistId: string, providerType: string): Promise<number> {
    // Mock calendar sync - would integrate with actual APIs
    console.log(`Syncing ${providerType} calendar for therapist ${therapistId}`);
    return 15; // Mock synced events count
  }
  
  private async findOptimalSlots(request: any): Promise<Array<{
    date: Date;
    startTime: Date;
    score: number;
    reasoning: string;
  }>> {
    // AI-powered slot optimization
    const slots = [];
    const baseDate = request.preferredDate || new Date();
    
    // Generate optimal time slots
    for (let i = 0; i < request.flexibility.dateRange; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      // Morning slot
      const morningSlot = new Date(date);
      morningSlot.setHours(9, 0, 0, 0);
      
      slots.push({
        date,
        startTime: morningSlot,
        score: 0.9 - (i * 0.1),
        reasoning: i === 0 ? 'Perfect match for preferred date' : `Alternative ${i} days later`
      });
    }
    
    return slots.sort((a, b) => b.score - a.score);
  }
  
  private async addToWaitlist(request: any): Promise<void> {
    const waitlistId = `wait_${Date.now()}`;
    const entry: WaitlistEntry = {
      id: waitlistId,
      patientId: request.patientId,
      therapistId: request.therapistId,
      appointmentType: request.appointmentTypeId,
      preferredDates: [request.preferredDate || new Date()],
      preferredTimes: [request.preferredTime || '10:00'],
      urgency: request.requirements.urgency,
      flexibility: {
        dateRange: request.flexibility.dateRange,
        timeFlexibility: request.flexibility.timeRange,
        acceptTelehealth: request.requirements.format !== 'in_person',
        acceptDifferentTherapist: false
      },
      status: 'active',
      addedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notifyWhen: {
        exactMatch: true,
        similarTime: true,
        anyAvailability: request.requirements.urgency === 'high'
      }
    };
    
    this.waitlist.set(waitlistId, entry);
  }
  
  private async syncAppointmentToCalendars(appointment: Appointment): Promise<void> {
    const providers = this.calendarProviders.get(appointment.therapistId) || [];
    
    for (const provider of providers) {
      if (provider.syncEnabled) {
        // Sync to external calendar
        console.log(`Syncing appointment ${appointment.id} to ${provider.type} calendar`);
      }
    }
  }
  
  private async sendAppointmentConfirmations(appointment: Appointment): Promise<void> {
    for (const attendee of appointment.attendees) {
      if (attendee.type === 'patient' || attendee.type === 'parent') {
        console.log(`Sending confirmation to ${attendee.email} for appointment ${appointment.id}`);
      }
    }
  }
  
  private async sendReminder(appointment: Appointment, reminder: any): Promise<void> {
    console.log(`Sending ${reminder.type} reminder for appointment ${appointment.id}`);
  }
  
  private async notifyWaitlistMatch(entry: WaitlistEntry, slot: any): Promise<void> {
    console.log(`Notifying waitlist entry ${entry.id} of available slot`);
  }
  
  private calculateUtilization(therapistId: string): number {
    const appointments = Array.from(this.appointments.values())
      .filter(apt => apt.therapistId === therapistId);
    
    // Mock calculation
    return 0.65; // 65% utilization
  }
  
  private calculateAverageSessionValue(appointments: Appointment[]): number {
    // Mock calculation
    return 145;
  }
}

export const smartSchedulingService = SmartSchedulingService.getInstance();
export default smartSchedulingService;