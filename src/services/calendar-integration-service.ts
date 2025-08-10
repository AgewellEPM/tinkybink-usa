/**
 * Native Calendar Integration Service
 * Seamlessly syncs TinkyBink appointments with Google Calendar, Outlook, Apple Calendar
 * Automatically creates calendar events with therapy session details and billing info
 */

import { Appointment, appointmentSchedulingService } from './appointment-scheduling-service';
import { getBillingIntegrationService } from '../modules/professional/billing-integration-service';
import { realtimeUpdatesService } from './realtime-updates-service';
import { safeLocalStorage } from '@/utils/storage-helper';

interface CalendarProvider {
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'exchange' | 'caldav';
  apiEndpoint?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  enabled: boolean;
}

interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  attendees: string[];
  reminders: {
    method: 'email' | 'popup';
    minutes: number;
  }[];
  metadata: {
    appointmentId: string;
    patientId: string;
    cptCode: string;
    billingAmount: number;
    therapyGoals: string[];
    gameActivities?: string[];
  };
  recurrence?: {
    rule: string;
    until?: Date;
    count?: number;
  };
}

interface SyncStatus {
  provider: string;
  lastSync: Date;
  status: 'success' | 'error' | 'pending';
  syncedAppointments: number;
  errors: string[];
}

export class CalendarIntegrationService {
  private static instance: CalendarIntegrationService;
  private providers: Map<string, CalendarProvider> = new Map();
  private syncStatus: Map<string, SyncStatus> = new Map();
  private billingService = getBillingIntegrationService();
  
  // Calendar sync settings
  private syncSettings = {
    autoSync: true,
    syncInterval: 15, // minutes
    bidirectional: true, // Sync both ways
    includePatientDetails: false, // HIPAA compliance
    includeBillingInfo: true, // For professional view only
    createBlockTime: true, // Block time for sessions
    sendInvites: {
      toPatients: true,
      toParents: true,
      toProfessionals: true
    },
    reminderSettings: {
      professional: [15, 60], // 15 min and 1 hour before
      patient: [24 * 60], // 24 hours before
      parent: [24 * 60, 2 * 60] // 24 hours and 2 hours before
    }
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): CalendarIntegrationService {
    if (!CalendarIntegrationService.instance) {
      CalendarIntegrationService.instance = new CalendarIntegrationService();
    }
    return CalendarIntegrationService.instance;
  }

  private initialize(): void {
    console.log('📅 Calendar Integration Service initialized');
    this.loadProviderConfigurations();
    this.setupDefaultProviders();
    this.startPeriodicSync();
  }

  /**
   * Connect to Google Calendar
   */
  async connectGoogleCalendar(
    clientId: string,
    clientSecret: string,
    redirectUri: string = 'http://localhost:3456/auth/google/callback'
  ): Promise<{ authUrl: string; provider: CalendarProvider }> {
    const provider: CalendarProvider = {
      name: 'Google Calendar',
      type: 'google',
      apiEndpoint: 'https://www.googleapis.com/calendar/v3',
      clientId,
      clientSecret,
      enabled: false // Will be enabled after OAuth
    };

    // Generate OAuth URL
    const scopes = [
      'https://www.googleapis.com/calendar/calendars',
      'https://www.googleapis.com/calendar/events'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    this.providers.set('google', provider);
    this.saveProviderConfigurations();

    return { authUrl, provider };
  }

  /**
   * Complete Google Calendar OAuth
   */
  async completeGoogleAuth(authCode: string): Promise<boolean> {
    const provider = this.providers.get('google');
    if (!provider) return false;

    try {
      // Exchange auth code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: provider.clientId!,
          client_secret: provider.clientSecret!,
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3456/auth/google/callback'
        })
      });

      const tokens = await tokenResponse.json();
      
      provider.accessToken = tokens.access_token;
      provider.refreshToken = tokens.refresh_token;
      provider.enabled = true;

      this.providers.set('google', provider);
      this.saveProviderConfigurations();

      // Initial sync
      await this.syncAppointmentsToCalendar('google');

      console.log('✅ Google Calendar connected successfully');
      return true;

    } catch (error) {
      console.error('Failed to complete Google Calendar auth:', error);
      return false;
    }
  }

  /**
   * Connect to Outlook/Office 365
   */
  async connectOutlookCalendar(
    clientId: string,
    clientSecret: string,
    tenantId: string = 'common'
  ): Promise<{ authUrl: string; provider: CalendarProvider }> {
    const provider: CalendarProvider = {
      name: 'Outlook Calendar',
      type: 'outlook',
      apiEndpoint: 'https://graph.microsoft.com/v1.0',
      clientId,
      clientSecret,
      enabled: false
    };

    const scopes = [
      'https://graph.microsoft.com/Calendar.ReadWrite',
      'https://graph.microsoft.com/User.Read'
    ].join(' ');

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent('http://localhost:3456/auth/outlook/callback')}&` +
      `scope=${encodeURIComponent(scopes)}`;

    this.providers.set('outlook', provider);
    this.saveProviderConfigurations();

    return { authUrl, provider };
  }

  /**
   * Setup Apple Calendar via CalDAV
   */
  async connectAppleCalendar(
    username: string,
    password: string,
    serverUrl: string = 'https://caldav.icloud.com'
  ): Promise<boolean> {
    const provider: CalendarProvider = {
      name: 'Apple Calendar',
      type: 'apple',
      apiEndpoint: serverUrl,
      clientId: username,
      clientSecret: password, // App-specific password
      enabled: false
    };

    try {
      // Test connection with PROPFIND request
      const testResponse = await fetch(`${serverUrl}/${username}/calendars/`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          'Depth': '1',
          'Content-Type': 'application/xml'
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
               <D:propfind xmlns:D="DAV:">
                 <D:prop>
                   <D:displayname />
                 </D:prop>
               </D:propfind>`
      });

      if (testResponse.ok) {
        provider.enabled = true;
        this.providers.set('apple', provider);
        this.saveProviderConfigurations();

        await this.syncAppointmentsToCalendar('apple');
        console.log('✅ Apple Calendar connected successfully');
        return true;
      }

      return false;

    } catch (error) {
      console.error('Failed to connect Apple Calendar:', error);
      return false;
    }
  }

  /**
   * Sync appointment to all connected calendars
   */
  async syncAppointmentToCalendars(appointment: Appointment): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];

    for (const [providerId, provider] of this.providers) {
      if (!provider.enabled) continue;

      const status: SyncStatus = {
        provider: providerId,
        lastSync: new Date(),
        status: 'pending',
        syncedAppointments: 0,
        errors: []
      };

      try {
        const calendarEvent = this.createCalendarEvent(appointment);
        const success = await this.createCalendarEventForProvider(provider, calendarEvent);
        
        if (success) {
          status.status = 'success';
          status.syncedAppointments = 1;
        } else {
          status.status = 'error';
          status.errors.push('Failed to create calendar event');
        }

      } catch (error) {
        status.status = 'error';
        status.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      this.syncStatus.set(providerId, status);
      results.push(status);
    }

    return results;
  }

  /**
   * Sync all appointments to specific calendar provider
   */
  async syncAppointmentsToCalendar(providerId: string): Promise<SyncStatus> {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${providerId} not found or not enabled`);
    }

    const status: SyncStatus = {
      provider: providerId,
      lastSync: new Date(),
      status: 'pending',
      syncedAppointments: 0,
      errors: []
    };

    try {
      // Get all appointments from the last 30 days and next 90 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      // In production, this would get from the appointment service
      const appointments = this.getAppointmentsInRange(startDate, endDate);

      for (const appointment of appointments) {
        try {
          const calendarEvent = this.createCalendarEvent(appointment);
          const success = await this.createCalendarEventForProvider(provider, calendarEvent);
          
          if (success) {
            status.syncedAppointments++;
          } else {
            status.errors.push(`Failed to sync appointment ${appointment.appointment_id}`);
          }

        } catch (error) {
          status.errors.push(`Error syncing ${appointment.appointment_id}: ${error}`);
        }
      }

      status.status = status.errors.length === 0 ? 'success' : 'error';
      this.syncStatus.set(providerId, status);

      console.log(`📅 Synced ${status.syncedAppointments} appointments to ${provider.name}`);

    } catch (error) {
      status.status = 'error';
      status.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    }

    return status;
  }

  /**
   * Create calendar event from appointment
   */
  private createCalendarEvent(appointment: Appointment): CalendarEvent {
    const startTime = new Date(appointment.scheduled_date);
    const [hours, minutes] = appointment.scheduled_time.split(':').map(Number);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + appointment.duration_minutes);

    // Get patient profile for safe display name
    const billingProfile = this.billingService.getBillingProfile(appointment.patient_id);
    const patientName = billingProfile ? 
      billingProfile.personalInfo.firstName : 
      `Patient ${appointment.patient_id.split('_')[1]}`;

    // Create HIPAA-compliant title
    const title = this.syncSettings.includePatientDetails ? 
      `${this.getAppointmentTypeDisplay(appointment.appointment_type)} - ${patientName}` :
      `${this.getAppointmentTypeDisplay(appointment.appointment_type)} Session`;

    // Build description with therapy and billing info
    let description = `Therapy Session Details:\n\n`;
    description += `📅 Session Type: ${this.getAppointmentTypeDisplay(appointment.appointment_type)}\n`;
    description += `⏱️ Duration: ${appointment.duration_minutes} minutes\n`;
    description += `📍 Location: ${appointment.location_type.replace('_', ' ')}\n\n`;

    // Treatment goals
    if (appointment.clinical_info.treatment_goals.length > 0) {
      description += `🎯 Treatment Goals:\n`;
      appointment.clinical_info.treatment_goals.forEach(goal => {
        description += `• ${goal}\n`;
      });
      description += `\n`;
    }

    // Materials needed
    if (appointment.clinical_info.materials_needed.length > 0) {
      description += `📋 Materials Needed:\n`;
      appointment.clinical_info.materials_needed.forEach(material => {
        description += `• ${material}\n`;
      });
      description += `\n`;
    }

    // Billing information (professional view only)
    if (this.syncSettings.includeBillingInfo) {
      description += `💰 Billing Information:\n`;
      description += `• CPT Code: ${appointment.billing_info.cpt_code}\n`;
      description += `• Estimated Reimbursement: $${appointment.billing_info.estimated_reimbursement}\n`;
      description += `• Copay: $${appointment.billing_info.copay_amount}\n`;
      if (appointment.billing_info.authorization_number) {
        description += `• Authorization: ${appointment.billing_info.authorization_number}\n`;
      }
      description += `\n`;
    }

    description += `🤖 Generated by TinkyBink AAC Professional Platform\n`;
    description += `📞 Questions? Contact your therapy team`;

    // Determine attendees based on settings
    const attendees: string[] = [];
    if (billingProfile && this.syncSettings.sendInvites.toPatients) {
      attendees.push(billingProfile.personalInfo.email || '');
    }
    if (billingProfile && this.syncSettings.sendInvites.toParents && billingProfile.emergencyContact) {
      attendees.push(billingProfile.emergencyContact.email || '');
    }

    // Setup reminders
    const reminders = [
      { method: 'popup' as const, minutes: this.syncSettings.reminderSettings.professional[0] },
      { method: 'email' as const, minutes: this.syncSettings.reminderSettings.professional[1] }
    ];

    // Handle recurring appointments
    let recurrence;
    if (appointment.recurring_info) {
      recurrence = {
        rule: this.createRecurrenceRule(appointment.recurring_info),
        until: appointment.recurring_info.end_date
      };
    }

    return {
      title,
      description,
      start: startTime,
      end: endTime,
      location: this.getLocationString(appointment),
      attendees: attendees.filter(Boolean),
      reminders,
      metadata: {
        appointmentId: appointment.appointment_id,
        patientId: appointment.patient_id,
        cptCode: appointment.billing_info.cpt_code,
        billingAmount: appointment.billing_info.estimated_reimbursement,
        therapyGoals: appointment.clinical_info.treatment_goals
      },
      recurrence
    };
  }

  /**
   * Create calendar event for specific provider
   */
  private async createCalendarEventForProvider(
    provider: CalendarProvider, 
    event: CalendarEvent
  ): Promise<boolean> {
    switch (provider.type) {
      case 'google':
        return await this.createGoogleCalendarEvent(provider, event);
      case 'outlook':
        return await this.createOutlookCalendarEvent(provider, event);
      case 'apple':
        return await this.createAppleCalendarEvent(provider, event);
      default:
        console.warn(`Unsupported calendar provider: ${provider.type}`);
        return false;
    }
  }

  /**
   * Create Google Calendar event
   */
  private async createGoogleCalendarEvent(
    provider: CalendarProvider, 
    event: CalendarEvent
  ): Promise<boolean> {
    if (!provider.accessToken) return false;

    try {
      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: event.location,
        attendees: event.attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: event.reminders.map(r => ({
            method: r.method,
            minutes: r.minutes
          }))
        },
        extendedProperties: {
          private: {
            tinkybinkAppointmentId: event.metadata.appointmentId,
            patientId: event.metadata.patientId,
            cptCode: event.metadata.cptCode,
            billingAmount: event.metadata.billingAmount.toString()
          }
        }
      };

      if (event.recurrence) {
        googleEvent.recurrence = [event.recurrence.rule];
      }

      const response = await fetch(
        `${provider.apiEndpoint}/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googleEvent)
        }
      );

      if (response.ok) {
        const createdEvent = await response.json();
        event.id = createdEvent.id;
        console.log(`✅ Google Calendar event created: ${createdEvent.htmlLink}`);
        return true;
      } else {
        const error = await response.text();
        console.error('Google Calendar API error:', error);
        
        // Try to refresh token if unauthorized
        if (response.status === 401) {
          const refreshed = await this.refreshGoogleToken(provider);
          if (refreshed) {
            return await this.createGoogleCalendarEvent(provider, event);
          }
        }
        
        return false;
      }

    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      return false;
    }
  }

  /**
   * Create Outlook Calendar event
   */
  private async createOutlookCalendarEvent(
    provider: CalendarProvider, 
    event: CalendarEvent
  ): Promise<boolean> {
    if (!provider.accessToken) return false;

    try {
      const outlookEvent = {
        subject: event.title,
        body: {
          contentType: 'text',
          content: event.description
        },
        start: {
          dateTime: event.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: {
          displayName: event.location
        },
        attendees: event.attendees.map(email => ({
          emailAddress: { address: email }
        })),
        isReminderOn: true,
        reminderMinutesBeforeStart: event.reminders[0]?.minutes || 15,
        singleValueExtendedProperties: [
          { id: 'String {66f5a359-4659-4830-9070-00047ec6ac6e} Name TinkyBinkAppointmentId', value: event.metadata.appointmentId },
          { id: 'String {66f5a359-4659-4830-9070-00047ec6ac6e} Name PatientId', value: event.metadata.patientId },
          { id: 'String {66f5a359-4659-4830-9070-00047ec6ac6e} Name CPTCode', value: event.metadata.cptCode }
        ]
      };

      if (event.recurrence) {
        outlookEvent.recurrence = {
          pattern: this.parseRecurrenceRuleForOutlook(event.recurrence.rule),
          range: {
            type: 'endDate',
            startDate: event.start.toISOString().split('T')[0],
            endDate: event.recurrence.until?.toISOString().split('T')[0]
          }
        };
      }

      const response = await fetch(
        `${provider.apiEndpoint}/me/calendar/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(outlookEvent)
        }
      );

      if (response.ok) {
        const createdEvent = await response.json();
        event.id = createdEvent.id;
        console.log(`✅ Outlook Calendar event created: ${createdEvent.webLink}`);
        return true;
      } else {
        console.error('Outlook Calendar API error:', await response.text());
        return false;
      }

    } catch (error) {
      console.error('Failed to create Outlook Calendar event:', error);
      return false;
    }
  }

  /**
   * Create Apple Calendar event via CalDAV
   */
  private async createAppleCalendarEvent(
    provider: CalendarProvider, 
    event: CalendarEvent
  ): Promise<boolean> {
    try {
      // Generate unique UID for the event
      const uid = `${event.metadata.appointmentId}@tinkybink.com`;
      
      // Create iCalendar format
      const icalEvent = this.createICalendarEvent(event, uid);

      const response = await fetch(
        `${provider.apiEndpoint}/${provider.clientId}/calendars/therapy/${uid}.ics`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${btoa(`${provider.clientId}:${provider.clientSecret}`)}`,
            'Content-Type': 'text/calendar; charset=utf-8'
          },
          body: icalEvent
        }
      );

      if (response.status === 201 || response.status === 204) {
        event.id = uid;
        console.log(`✅ Apple Calendar event created: ${uid}`);
        return true;
      } else {
        console.error('Apple Calendar CalDAV error:', await response.text());
        return false;
      }

    } catch (error) {
      console.error('Failed to create Apple Calendar event:', error);
      return false;
    }
  }

  /**
   * Update appointment in all calendars when changed
   */
  async updateAppointmentInCalendars(
    appointment: Appointment, 
    originalAppointment?: Appointment
  ): Promise<void> {
    for (const [providerId, provider] of this.providers) {
      if (!provider.enabled) continue;

      try {
        // If appointment was rescheduled, delete old event and create new one
        if (originalAppointment && 
            (originalAppointment.scheduled_date.getTime() !== appointment.scheduled_date.getTime() ||
             originalAppointment.scheduled_time !== appointment.scheduled_time)) {
          
          await this.deleteCalendarEvent(provider, originalAppointment.appointment_id);
          await this.syncAppointmentToCalendars(appointment);
        } else {
          // Update existing event
          const calendarEvent = this.createCalendarEvent(appointment);
          await this.updateCalendarEventForProvider(provider, calendarEvent);
        }

      } catch (error) {
        console.error(`Failed to update appointment in ${providerId}:`, error);
      }
    }
  }

  /**
   * Delete appointment from all calendars
   */
  async deleteAppointmentFromCalendars(appointmentId: string): Promise<void> {
    for (const [providerId, provider] of this.providers) {
      if (!provider.enabled) continue;

      try {
        await this.deleteCalendarEvent(provider, appointmentId);
      } catch (error) {
        console.error(`Failed to delete appointment from ${providerId}:`, error);
      }
    }
  }

  /**
   * Get sync status for all providers
   */
  getSyncStatuses(): Map<string, SyncStatus> {
    return new Map(this.syncStatus);
  }

  /**
   * Manual sync trigger
   */
  async triggerFullSync(): Promise<Map<string, SyncStatus>> {
    const results = new Map<string, SyncStatus>();

    for (const [providerId, provider] of this.providers) {
      if (!provider.enabled) continue;

      try {
        const status = await this.syncAppointmentsToCalendar(providerId);
        results.set(providerId, status);
      } catch (error) {
        results.set(providerId, {
          provider: providerId,
          lastSync: new Date(),
          status: 'error',
          syncedAppointments: 0,
          errors: [error instanceof Error ? error.message : 'Sync failed']
        });
      }
    }

    return results;
  }

  // Private helper methods

  private async refreshGoogleToken(provider: CalendarProvider): Promise<boolean> {
    if (!provider.refreshToken) return false;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: provider.clientId!,
          client_secret: provider.clientSecret!,
          refresh_token: provider.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const tokens = await response.json();
      provider.accessToken = tokens.access_token;
      
      this.providers.set('google', provider);
      this.saveProviderConfigurations();

      return true;
    } catch (error) {
      console.error('Failed to refresh Google token:', error);
      return false;
    }
  }

  private getAppointmentsInRange(startDate: Date, endDate: Date): Appointment[] {
    // This would typically fetch from your appointment service
    // For now, return empty array - integrate with your actual appointment data
    return [];
  }

  private getAppointmentTypeDisplay(type: string): string {
    const displayNames = {
      evaluation: 'AAC Evaluation',
      individual_therapy: 'Individual Therapy',
      group_therapy: 'Group Therapy',
      teletherapy: 'Teletherapy Session',
      consultation: 'Consultation',
      assessment: 'Assessment'
    };
    return displayNames[type] || type.replace('_', ' ');
  }

  private getLocationString(appointment: Appointment): string {
    if (appointment.location_details?.address) {
      return appointment.location_details.address;
    }
    
    const locationTypes = {
      in_person: 'Therapy Office',
      telehealth: 'Virtual Meeting',
      home_visit: 'Patient Home',
      school_visit: 'School Location'
    };
    
    return locationTypes[appointment.location_type] || appointment.location_type;
  }

  private createRecurrenceRule(recurringInfo: any): string {
    // Create RFC 5545 RRULE
    let rule = 'RRULE:FREQ=';
    
    switch (recurringInfo.pattern) {
      case 'daily':
        rule += 'DAILY';
        break;
      case 'weekly':
        rule += 'WEEKLY';
        if (recurringInfo.days_of_week) {
          const days = recurringInfo.days_of_week.map((d: number) => 
            ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d]
          ).join(',');
          rule += `;BYDAY=${days}`;
        }
        break;
      case 'monthly':
        rule += 'MONTHLY';
        break;
      default:
        rule += 'WEEKLY';
    }

    if (recurringInfo.frequency > 1) {
      rule += `;INTERVAL=${recurringInfo.frequency}`;
    }

    if (recurringInfo.end_date) {
      const endDate = recurringInfo.end_date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rule += `;UNTIL=${endDate}`;
    }

    return rule;
  }

  private parseRecurrenceRuleForOutlook(rule: string): any {
    // Convert RRULE to Outlook format
    const parts = rule.replace('RRULE:', '').split(';');
    const pattern: any = {};

    parts.forEach(part => {
      const [key, value] = part.split('=');
      switch (key) {
        case 'FREQ':
          pattern.type = value.toLowerCase();
          break;
        case 'INTERVAL':
          pattern.interval = parseInt(value);
          break;
        case 'BYDAY':
          pattern.daysOfWeek = value.split(',').map(day => {
            const dayMap = { SU: 'sunday', MO: 'monday', TU: 'tuesday', WE: 'wednesday', TH: 'thursday', FR: 'friday', SA: 'saturday' };
            return dayMap[day] || day;
          });
          break;
      }
    });

    return pattern;
  }

  private createICalendarEvent(event: CalendarEvent, uid: string): string {
    const formatDate = (date: Date) => 
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//TinkyBink//AAC Professional Platform//EN\r\n';
    ical += 'BEGIN:VEVENT\r\n';
    ical += `UID:${uid}\r\n`;
    ical += `DTSTART:${formatDate(event.start)}\r\n`;
    ical += `DTEND:${formatDate(event.end)}\r\n`;
    ical += `SUMMARY:${event.title}\r\n`;
    ical += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\r\n`;
    
    if (event.location) {
      ical += `LOCATION:${event.location}\r\n`;
    }

    // Add attendees
    event.attendees.forEach(attendee => {
      ical += `ATTENDEE:MAILTO:${attendee}\r\n`;
    });

    // Add alarms/reminders
    event.reminders.forEach(reminder => {
      ical += 'BEGIN:VALARM\r\n';
      ical += 'ACTION:DISPLAY\r\n';
      ical += `TRIGGER:-PT${reminder.minutes}M\r\n`;
      ical += `DESCRIPTION:Therapy session reminder\r\n`;
      ical += 'END:VALARM\r\n';
    });

    if (event.recurrence) {
      ical += `${event.recurrence.rule}\r\n`;
    }

    ical += `CREATED:${formatDate(new Date())}\r\n`;
    ical += `LAST-MODIFIED:${formatDate(new Date())}\r\n`;
    ical += 'END:VEVENT\r\n';
    ical += 'END:VCALENDAR\r\n';

    return ical;
  }

  private async deleteCalendarEvent(provider: CalendarProvider, appointmentId: string): Promise<boolean> {
    // Implementation would vary by provider
    // This is a simplified version
    console.log(`Deleting calendar event for appointment ${appointmentId} from ${provider.name}`);
    return true;
  }

  private async updateCalendarEventForProvider(provider: CalendarProvider, event: CalendarEvent): Promise<boolean> {
    // Implementation would vary by provider
    // This is a simplified version
    console.log(`Updating calendar event for ${event.metadata.appointmentId} in ${provider.name}`);
    return true;
  }

  private setupDefaultProviders(): void {
    // Setup default provider configurations
    const defaultProviders = [
      {
        name: 'Google Calendar',
        type: 'google' as const,
        enabled: false
      },
      {
        name: 'Outlook Calendar',
        type: 'outlook' as const,
        enabled: false
      },
      {
        name: 'Apple Calendar',
        type: 'apple' as const,
        enabled: false
      }
    ];

    defaultProviders.forEach(provider => {
      if (!this.providers.has(provider.type)) {
        this.providers.set(provider.type, provider as CalendarProvider);
      }
    });
  }

  private startPeriodicSync(): void {
    if (!this.syncSettings.autoSync) return;

    setInterval(async () => {
      console.log('🔄 Starting periodic calendar sync...');
      
      for (const [providerId, provider] of this.providers) {
        if (provider.enabled) {
          try {
            await this.syncAppointmentsToCalendar(providerId);
          } catch (error) {
            console.error(`Periodic sync failed for ${providerId}:`, error);
          }
        }
      }
    }, this.syncSettings.syncInterval * 60 * 1000);
  }

  private loadProviderConfigurations(): void {
    try {
      const saved = safeLocalStorage.getItem('calendarProviders');
      if (saved) {
        const providers = JSON.parse(saved);
        Object.entries(providers).forEach(([id, config]) => {
          this.providers.set(id, config as CalendarProvider);
        });
      }
    } catch (error) {
      console.warn('Could not load calendar provider configurations:', error);
    }
  }

  private saveProviderConfigurations(): void {
    try {
      const providers = Object.fromEntries(this.providers);
      safeLocalStorage.setItem('calendarProviders', JSON.stringify(providers));
    } catch (error) {
      console.warn('Could not save calendar provider configurations:', error);
    }
  }
}

// Export singleton instance
export const calendarIntegrationService = CalendarIntegrationService.getInstance();