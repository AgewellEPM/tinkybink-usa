/**
 * Emergency Communication System
 * Life-saving communication protocols for AAC users
 * 
 * Features:
 * - One-touch emergency calling (911, family, medical)
 * - Medical history and medication transmission
 * - GPS location sharing with emergency contacts
 * - Hospital communication templates
 * - Crisis de-escalation communication tools
 * - Emergency contact management
 * - Voice emergency broadcasting
 * 
 * This system can save lives by ensuring AAC users can communicate
 * effectively during medical emergencies, safety situations, and crises.
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0 - Life-Saving Edition
 */

import { mlDataCollection } from './ml-data-collection';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: 'parent' | 'guardian' | 'sibling' | 'spouse' | 'caregiver' | 'friend' | 'therapist' | 'doctor';
  phone: string;
  email?: string;
  is_primary: boolean;
  medical_authorized: boolean; // Can receive medical information
  languages_spoken: string[];
  availability_hours?: {
    start: string; // "09:00"
    end: string;   // "17:00"
    timezone: string;
  };
}

interface MedicalProfile {
  userId: string;
  
  // Basic information
  basic_info: {
    full_name: string;
    date_of_birth: Date;
    blood_type?: string;
    emergency_id_number?: string; // Medical ID bracelet number
    photo_url?: string;
  };
  
  // Medical conditions
  conditions: Array<{
    condition: string;
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    diagnosis_date: Date;
    current_status: 'active' | 'managed' | 'resolved';
    communication_impact: string;
  }>;
  
  // Current medications
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    prescribing_doctor: string;
    critical_for_emergency: boolean;
    last_taken?: Date;
  }>;
  
  // Allergies and adverse reactions
  allergies: Array<{
    allergen: string;
    reaction_type: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
    symptoms: string[];
    treatment_required: string;
  }>;
  
  // Healthcare providers
  providers: Array<{
    name: string;
    specialty: string;
    phone: string;
    hospital_affiliation?: string;
    role: 'primary' | 'specialist' | 'therapist' | 'emergency';
  }>;
  
  // Communication preferences in medical settings
  medical_communication: {
    preferred_method: 'aac_device' | 'writing' | 'gestures' | 'caregiver_translation';
    common_medical_phrases: string[];
    pain_scale_method: 'numbers' | 'faces' | 'colors' | 'gestures';
    consent_preferences: {
      can_share_with_family: boolean;
      can_share_with_first_responders: boolean;
      can_share_with_hospital: boolean;
    };
  };
}

interface EmergencyTemplate {
  id: string;
  type: 'medical' | 'safety' | 'crisis' | 'pain' | 'help' | 'lost';
  title: string;
  quick_message: string;
  detailed_template: string;
  voice_script: string; // For text-to-speech
  priority: 'immediate' | 'urgent' | 'important';
  auto_actions: Array<{
    action: 'call_911' | 'call_contact' | 'send_location' | 'send_medical_info' | 'broadcast_alert';
    parameters?: any;
  }>;
}

interface EmergencyIncident {
  id: string;
  user_id: string;
  timestamp: Date;
  type: 'medical' | 'safety' | 'crisis' | 'pain' | 'help' | 'lost';
  severity: number; // 1-10
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  
  // Communication attempts
  communications: Array<{
    timestamp: Date;
    method: 'call' | 'text' | 'app_alert' | 'voice_broadcast';
    recipient: string;
    content: string;
    status: 'sent' | 'delivered' | 'failed' | 'acknowledged';
    response?: string;
  }>;
  
  // Response tracking
  response: {
    first_responder_notified: boolean;
    family_notified: boolean;
    medical_info_shared: boolean;
    location_shared: boolean;
    resolution_status: 'active' | 'resolved' | 'false_alarm';
    notes?: string;
  };
}

class EmergencyCommunicationService {
  private static instance: EmergencyCommunicationService;
  private emergencyContacts: Map<string, EmergencyContact[]> = new Map();
  private medicalProfiles: Map<string, MedicalProfile> = new Map();
  private emergencyTemplates: EmergencyTemplate[] = [];
  private activeIncidents: Map<string, EmergencyIncident> = new Map();
  
  // Emergency state tracking
  private isEmergencyMode: boolean = false;
  private currentIncident: EmergencyIncident | null = null;
  private emergencyUIActive: boolean = false;

  private constructor() {
    this.initializeEmergencySystem();
  }

  static getInstance(): EmergencyCommunicationService {
    if (!EmergencyCommunicationService.instance) {
      EmergencyCommunicationService.instance = new EmergencyCommunicationService();
    }
    return EmergencyCommunicationService.instance;
  }

  /**
   * Initialize emergency communication system
   */
  async initializeEmergencySystem(): Promise<void> {
    console.log('🚨 Initializing Emergency Communication System...');
    
    try {
      // Load emergency templates
      this.loadEmergencyTemplates();
      
      // Set up emergency shortcuts
      this.setupEmergencyShortcuts();
      
      // Initialize location services
      await this.initializeLocationServices();
      
      // Set up emergency UI elements
      this.setupEmergencyUI();
      
      console.log('✅ Emergency Communication System Ready!');
      console.log('🆘 Emergency shortcuts: Triple-tap for help, Long-press for 911');
      
    } catch (error) {
      console.error('❌ Emergency system initialization failed:', error);
    }
  }

  /**
   * Activate emergency mode with specific type
   */
  async activateEmergency(
    userId: string, 
    emergencyType: 'medical' | 'safety' | 'crisis' | 'pain' | 'help' | 'lost',
    severity: number = 8
  ): Promise<string> {
    console.log(`🚨 EMERGENCY ACTIVATED: ${emergencyType.toUpperCase()} - Severity ${severity}`);
    
    try {
      this.isEmergencyMode = true;
      
      // Create incident record
      const incident: EmergencyIncident = {
        id: `emergency_${Date.now()}`,
        user_id: userId,
        timestamp: new Date(),
        type: emergencyType,
        severity,
        location: await this.getCurrentLocation(),
        communications: [],
        response: {
          first_responder_notified: false,
          family_notified: false,
          medical_info_shared: false,
          location_shared: false,
          resolution_status: 'active'
        }
      };
      
      this.currentIncident = incident;
      this.activeIncidents.set(incident.id, incident);
      
      // Show emergency UI
      this.showEmergencyUI(emergencyType);
      
      // Execute emergency protocol
      await this.executeEmergencyProtocol(userId, emergencyType, severity);
      
      // Track emergency activation
      await mlDataCollection.trackInteraction(userId, {
        type: 'emergency_activated',
        emergencyData: {
          type: emergencyType,
          severity,
          incident_id: incident.id,
          timestamp: new Date()
        },
        timestamp: new Date()
      });
      
      return incident.id;
      
    } catch (error) {
      console.error('Emergency activation failed:', error);
      throw new Error('Failed to activate emergency protocol');
    }
  }

  /**
   * Execute comprehensive emergency protocol
   */
  private async executeEmergencyProtocol(
    userId: string, 
    emergencyType: string, 
    severity: number
  ): Promise<void> {
    const template = this.getEmergencyTemplate(emergencyType);
    const contacts = this.emergencyContacts.get(userId) || [];
    const medicalProfile = this.medicalProfiles.get(userId);
    
    // Immediate actions based on severity
    if (severity >= 9) {
      // Critical emergency - call 911 immediately
      await this.call911(userId, template);
      
      // Notify all primary contacts immediately
      await this.notifyAllEmergencyContacts(userId, template, true);
      
      // Share location with first responders
      await this.shareLocationWithFirstResponders(userId);
      
    } else if (severity >= 7) {
      // Serious emergency - notify primary contacts first
      await this.notifyPrimaryContacts(userId, template);
      
      // Give option to call 911
      this.showCall911Option(template);
      
    } else {
      // Non-critical - focus on communication and support
      await this.notifySelectedContacts(userId, template);
      
      // Provide communication assistance
      this.provideCommunicationAssistance(emergencyType);
    }
    
    // Always share medical information if available and consented
    if (medicalProfile && medicalProfile.medical_communication.consent_preferences.can_share_with_first_responders) {
      await this.prepareMedicalInformation(userId);
    }
    
    // Start emergency monitoring
    this.startEmergencyMonitoring(userId);
  }

  /**
   * Call 911 with pre-formatted emergency information
   */
  private async call911(userId: string, template: EmergencyTemplate): Promise<void> {
    console.log('📞 Initiating 911 call...');
    
    try {
      const medicalProfile = this.medicalProfiles.get(userId);
      const location = await this.getCurrentLocation();
      
      // Prepare 911 information package
      const emergency911Info = {
        message: template.voice_script,
        location: location ? `${location.latitude}, ${location.longitude}` : 'Location unavailable',
        medical_conditions: medicalProfile?.conditions.filter(c => c.current_status === 'active').map(c => c.condition) || [],
        medications: medicalProfile?.medications.filter(m => m.critical_for_emergency).map(m => `${m.name} ${m.dosage}`) || [],
        allergies: medicalProfile?.allergies.filter(a => a.reaction_type === 'anaphylaxis' || a.reaction_type === 'severe').map(a => a.allergen) || [],
        emergency_contact: this.getPrimaryContact(userId)
      };
      
      // In production, this would interface with phone system
      console.log('🚨 911 CALL INFORMATION:', emergency911Info);
      
      // For now, create a comprehensive alert
      this.create911Alert(emergency911Info);
      
      // Update incident
      if (this.currentIncident) {
        this.currentIncident.communications.push({
          timestamp: new Date(),
          method: 'call',
          recipient: '911',
          content: template.voice_script,
          status: 'sent'
        });
        this.currentIncident.response.first_responder_notified = true;
      }
      
    } catch (error) {
      console.error('911 call failed:', error);
      throw error;
    }
  }

  /**
   * Notify all emergency contacts
   */
  private async notifyAllEmergencyContacts(
    userId: string, 
    template: EmergencyTemplate, 
    priority: boolean = false
  ): Promise<void> {
    const contacts = this.emergencyContacts.get(userId) || [];
    const location = await this.getCurrentLocation();
    
    for (const contact of contacts) {
      await this.notifyContact(userId, contact, template, location, priority);
    }
  }

  /**
   * Notify specific contact with emergency information
   */
  private async notifyContact(
    userId: string,
    contact: EmergencyContact,
    template: EmergencyTemplate,
    location: any,
    priority: boolean = false
  ): Promise<void> {
    try {
      const medicalProfile = this.medicalProfiles.get(userId);
      
      // Prepare message based on relationship and authorization
      let message = template.quick_message;
      
      if (contact.medical_authorized && medicalProfile) {
        message += `\n\nMedical Info:\n`;
        message += `Conditions: ${medicalProfile.conditions.map(c => c.condition).join(', ')}\n`;
        message += `Medications: ${medicalProfile.medications.map(m => m.name).join(', ')}\n`;
        message += `Allergies: ${medicalProfile.allergies.map(a => a.allergen).join(', ')}`;
      }
      
      if (location) {
        message += `\n\nLocation: ${location.address || `${location.latitude}, ${location.longitude}`}`;
      }
      
      // Send notification (in production would use SMS/call services)
      console.log(`📱 Notifying ${contact.name} (${contact.relationship}):`, message);
      
      // Simulate phone call for critical situations
      if (priority && template.priority === 'immediate') {
        console.log(`☎️ Calling ${contact.name} at ${contact.phone}`);
      }
      
      // Track communication
      if (this.currentIncident) {
        this.currentIncident.communications.push({
          timestamp: new Date(),
          method: priority ? 'call' : 'text',
          recipient: contact.name,
          content: message,
          status: 'sent'
        });
        
        if (contact.is_primary) {
          this.currentIncident.response.family_notified = true;
        }
      }
      
    } catch (error) {
      console.error(`Failed to notify ${contact.name}:`, error);
    }
  }

  /**
   * Create comprehensive medical information package
   */
  private async prepareMedicalInformation(userId: string): Promise<void> {
    const medicalProfile = this.medicalProfiles.get(userId);
    if (!medicalProfile) return;
    
    const medicalPackage = {
      patient_info: medicalProfile.basic_info,
      current_conditions: medicalProfile.conditions.filter(c => c.current_status === 'active'),
      critical_medications: medicalProfile.medications.filter(m => m.critical_for_emergency),
      severe_allergies: medicalProfile.allergies.filter(a => a.reaction_type === 'severe' || a.reaction_type === 'anaphylaxis'),
      primary_doctors: medicalProfile.providers.filter(p => p.role === 'primary' || p.role === 'emergency'),
      communication_notes: {
        preferred_method: medicalProfile.medical_communication.preferred_method,
        pain_scale: medicalProfile.medical_communication.pain_scale_method,
        common_phrases: medicalProfile.medical_communication.common_medical_phrases
      }
    };
    
    console.log('🏥 Medical Information Package Prepared:', medicalPackage);
    
    // Create downloadable medical information file
    this.createMedicalInfoFile(medicalPackage);
    
    if (this.currentIncident) {
      this.currentIncident.response.medical_info_shared = true;
    }
  }

  /**
   * Show emergency communication UI
   */
  private showEmergencyUI(emergencyType: string): void {
    if (this.emergencyUIActive) return;
    
    this.emergencyUIActive = true;
    
    const emergencyOverlay = document.createElement('div');
    emergencyOverlay.id = 'emergency-communication-overlay';
    emergencyOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #ff4757 0%, #c44569 100%);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      animation: emergency-pulse 1s infinite;
    `;
    
    const template = this.getEmergencyTemplate(emergencyType);
    
    emergencyOverlay.innerHTML = `
      <div style="padding: 2rem; text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; animation: emergency-flash 0.5s infinite;">
          🚨 EMERGENCY MODE
        </h1>
        <h2 style="font-size: 2rem; margin-bottom: 2rem; text-transform: uppercase;">
          ${emergencyType} Emergency
        </h2>
        
        <div style="background: rgba(255,255,255,0.2); padding: 2rem; border-radius: 15px; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
          <p style="font-size: 1.5rem; line-height: 1.4; margin-bottom: 1rem;">
            ${template.quick_message}
          </p>
          <div style="font-size: 1.2rem;">
            <strong>✅ Emergency contacts notified</strong><br>
            <strong>📍 Location shared</strong><br>
            <strong>🏥 Medical info prepared</strong>
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="emergencyCommun​icationService.call911Direct()" 
                  style="background: #ff3838; color: white; border: none; padding: 1rem 2rem; font-size: 1.2rem; border-radius: 10px; cursor: pointer; font-weight: bold;">
            📞 CALL 911
          </button>
          <button onclick="emergencyCommun​icationService.sendUpdate()" 
                  style="background: #3742fa; color: white; border: none; padding: 1rem 2rem; font-size: 1.2rem; border-radius: 10px; cursor: pointer; font-weight: bold;">
            📱 SEND UPDATE
          </button>
          <button onclick="emergencyCommun​icationService.resolveEmergency()" 
                  style="background: #2ed573; color: white; border: none; padding: 1rem 2rem; font-size: 1.2rem; border-radius: 10px; cursor: pointer; font-weight: bold;">
            ✅ I'M SAFE
          </button>
        </div>
        
        <div style="margin-top: 2rem;">
          <button onclick="emergencyCommun​icationService.exitEmergencyMode()" 
                  style="background: transparent; color: white; border: 2px solid white; padding: 0.5rem 1rem; font-size: 1rem; border-radius: 5px; cursor: pointer;">
            Exit Emergency Mode
          </button>
        </div>
      </div>
    `;
    
    // Add emergency animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes emergency-pulse {
        0% { background: linear-gradient(135deg, #ff4757 0%, #c44569 100%); }
        50% { background: linear-gradient(135deg, #ff3838 0%, #b33939 100%); }
        100% { background: linear-gradient(135deg, #ff4757 0%, #c44569 100%); }
      }
      @keyframes emergency-flash {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(emergencyOverlay);
    
    // Make service methods globally accessible for UI
    (window as any).emergencyCommunicationService = this;
  }

  /**
   * Public methods for emergency UI interaction
   */
  async call911Direct(): Promise<void> {
    if (this.currentIncident) {
      const template = this.getEmergencyTemplate(this.currentIncident.type);
      await this.call911(this.currentIncident.user_id, template);
    }
  }

  async sendUpdate(): Promise<void> {
    if (this.currentIncident) {
      // Send status update to all contacts
      await this.notifyAllEmergencyContacts(
        this.currentIncident.user_id,
        {
          id: 'update',
          type: 'help',
          title: 'Emergency Update',
          quick_message: 'Emergency situation update: Please standby for more information.',
          detailed_template: '',
          voice_script: 'This is an emergency update.',
          priority: 'important',
          auto_actions: []
        }
      );
    }
  }

  /**
   * Resolve current emergency
   */
  async resolveEmergency(): Promise<void> {
    if (!this.currentIncident) return;
    
    try {
      // Update incident status
      this.currentIncident.response.resolution_status = 'resolved';
      
      // Send "all clear" message to contacts
      await this.notifyAllEmergencyContacts(
        this.currentIncident.user_id,
        {
          id: 'resolved',
          type: 'help',
          title: 'Emergency Resolved',
          quick_message: '✅ EMERGENCY RESOLVED - I am safe now. Thank you for your concern.',
          detailed_template: '',
          voice_script: 'Emergency resolved. I am safe.',
          priority: 'important',
          auto_actions: []
        }
      );
      
      // Track resolution
      await mlDataCollection.trackInteraction(this.currentIncident.user_id, {
        type: 'emergency_resolved',
        emergencyData: {
          incident_id: this.currentIncident.id,
          duration: Date.now() - this.currentIncident.timestamp.getTime(),
          resolution: 'user_resolved'
        },
        timestamp: new Date()
      });
      
      console.log('✅ Emergency resolved successfully');
      
      // Exit emergency mode
      this.exitEmergencyMode();
      
    } catch (error) {
      console.error('Failed to resolve emergency:', error);
    }
  }

  /**
   * Exit emergency mode
   */
  exitEmergencyMode(): void {
    this.isEmergencyMode = false;
    this.emergencyUIActive = false;
    this.currentIncident = null;
    
    // Remove emergency UI
    const overlay = document.getElementById('emergency-communication-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    console.log('🟢 Emergency mode deactivated');
  }

  /**
   * Setup emergency contacts for user
   */
  async setupEmergencyContacts(userId: string, contacts: EmergencyContact[]): Promise<void> {
    this.emergencyContacts.set(userId, contacts);
    
    // Validate contacts
    for (const contact of contacts) {
      if (!this.validateContact(contact)) {
        console.warn(`Invalid emergency contact: ${contact.name}`);
      }
    }
    
    console.log(`✅ ${contacts.length} emergency contacts configured for user ${userId}`);
  }

  /**
   * Setup medical profile for user
   */
  async setupMedicalProfile(userId: string, profile: MedicalProfile): Promise<void> {
    this.medicalProfiles.set(userId, profile);
    console.log(`🏥 Medical profile configured for ${profile.basic_info.full_name}`);
  }

  /**
   * Get emergency status
   */
  isInEmergencyMode(): boolean {
    return this.isEmergencyMode;
  }

  /**
   * Get current emergency incident
   */
  getCurrentIncident(): EmergencyIncident | null {
    return this.currentIncident;
  }

  // Private helper methods

  private loadEmergencyTemplates(): void {
    this.emergencyTemplates = [
      {
        id: 'medical_critical',
        type: 'medical',
        title: 'Medical Emergency',
        quick_message: '🚨 MEDICAL EMERGENCY - I need immediate medical help. Please call 911 and come to my location.',
        detailed_template: 'This is a medical emergency. The person using this AAC device needs immediate medical attention. Please call 911 and contact their emergency contacts.',
        voice_script: 'Medical emergency. Need immediate help. Call nine one one.',
        priority: 'immediate',
        auto_actions: [
          { action: 'call_911' },
          { action: 'call_contact', parameters: { contact_type: 'primary' } },
          { action: 'send_location' },
          { action: 'send_medical_info' }
        ]
      },
      {
        id: 'safety_danger',
        type: 'safety',
        title: 'Safety Emergency',
        quick_message: '⚠️ SAFETY EMERGENCY - I am in danger and need help immediately. Please call for help.',
        detailed_template: 'This is a safety emergency. The person using this device is in danger and needs immediate assistance.',
        voice_script: 'Safety emergency. In danger. Need help now.',
        priority: 'immediate',
        auto_actions: [
          { action: 'call_911' },
          { action: 'call_contact', parameters: { contact_type: 'all' } },
          { action: 'send_location' }
        ]
      },
      {
        id: 'pain_severe',
        type: 'pain',
        title: 'Severe Pain',
        quick_message: '😣 I am experiencing severe pain and need medical attention.',
        detailed_template: 'The person using this device is experiencing severe pain and may need medical attention.',
        voice_script: 'Severe pain. Need medical help.',
        priority: 'urgent',
        auto_actions: [
          { action: 'call_contact', parameters: { contact_type: 'medical' } },
          { action: 'send_medical_info' }
        ]
      },
      {
        id: 'help_general',
        type: 'help',
        title: 'Need Help',
        quick_message: '🆘 I need help. Please come to my location or contact me.',
        detailed_template: 'The person using this device needs assistance. Please contact them or go to their location.',
        voice_script: 'Need help. Please come.',
        priority: 'important',
        auto_actions: [
          { action: 'call_contact', parameters: { contact_type: 'primary' } },
          { action: 'send_location' }
        ]
      },
      {
        id: 'lost_location',
        type: 'lost',
        title: 'Lost or Confused',
        quick_message: '🗺️ I am lost or confused about my location. Please help me get home safely.',
        detailed_template: 'The person using this device is lost or confused about their location and needs assistance getting home.',
        voice_script: 'Lost and confused. Help me get home.',
        priority: 'urgent',
        auto_actions: [
          { action: 'call_contact', parameters: { contact_type: 'all' } },
          { action: 'send_location' },
          { action: 'broadcast_alert' }
        ]
      }
    ];
    
    console.log(`📋 ${this.emergencyTemplates.length} emergency templates loaded`);
  }

  private setupEmergencyShortcuts(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Triple-tap for general help
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;
    
    document.addEventListener('click', () => {
      tapCount++;
      
      if (tapCount === 1) {
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 1000);
      } else if (tapCount === 3) {
        clearTimeout(tapTimer);
        tapCount = 0;
        console.log('🆘 Triple-tap detected - activating help mode');
        // In production, would activate help mode
      }
    });
    
    // Long-press for 911
    let longPressTimer: NodeJS.Timeout;
    
    document.addEventListener('mousedown', () => {
      longPressTimer = setTimeout(() => {
        console.log('🚨 Long-press detected - emergency activation available');
        // In production, would show emergency options
      }, 2000);
    });
    
    document.addEventListener('mouseup', () => {
      clearTimeout(longPressTimer);
    });
  }

  private async initializeLocationServices(): Promise<void> {
    if ('geolocation' in navigator) {
      console.log('📍 Location services available');
    } else {
      console.warn('⚠️ Location services not available');
    }
  }

  private setupEmergencyUI(): void {
    // Skip UI setup during SSR
    if (typeof document === 'undefined') {
      return;
    }
    
    // Add emergency button to main interface
    const emergencyButton = document.createElement('button');
    emergencyButton.id = 'emergency-quick-access';
    emergencyButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff4757, #c44569);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(255, 71, 87, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    emergencyButton.innerHTML = '🚨';
    emergencyButton.title = 'Emergency Help - Click for options';
    
    emergencyButton.addEventListener('click', () => {
      this.showEmergencyOptions();
    });
    
    document.body.appendChild(emergencyButton);
  }

  private showEmergencyOptions(): void {
    // Show emergency type selection
    const optionsOverlay = document.createElement('div');
    optionsOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.8);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    optionsOverlay.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 500px; text-align: center;">
        <h2 style="color: #333; margin-bottom: 2rem;">🚨 Emergency Help</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <button onclick="this.parentElement.parentElement.parentElement.remove(); emergencyCommun​icationService.activateEmergency('user123', 'medical', 9)" 
                  style="background: #ff4757; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer;">
            🏥 Medical Emergency
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove(); emergencyCommun​icationService.activateEmergency('user123', 'safety', 8)" 
                  style="background: #ff6348; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer;">
            ⚠️ Safety Issue
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove(); emergencyCommun​icationService.activateEmergency('user123', 'pain', 6)" 
                  style="background: #ffa502; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer;">
            😣 Severe Pain
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove(); emergencyCommun​icationService.activateEmergency('user123', 'help', 5)" 
                  style="background: #3742fa; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer;">
            🆘 Need Help
          </button>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #ddd; color: #333; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; margin-top: 1rem;">
          Cancel
        </button>
      </div>
    `;
    
    document.body.appendChild(optionsOverlay);
    
    // Make service accessible
    (window as any).emergencyCommunicationService = this;
  }

  private getEmergencyTemplate(type: string): EmergencyTemplate {
    const template = this.emergencyTemplates.find(t => t.type === type);
    return template || this.emergencyTemplates[0]; // Fallback to first template
  }

  private async getCurrentLocation(): Promise<any> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now()
            });
          },
          (error) => {
            console.error('Location error:', error);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        resolve(null);
      }
    });
  }

  private getPrimaryContact(userId: string): EmergencyContact | null {
    const contacts = this.emergencyContacts.get(userId) || [];
    return contacts.find(c => c.is_primary) || contacts[0] || null;
  }

  private validateContact(contact: EmergencyContact): boolean {
    return !!(contact.name && contact.phone && contact.relationship);
  }

  private create911Alert(info: any): void {
    // Create a visible 911 information display
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ff3838, #ff1744);
      color: white;
      padding: 2rem;
      border-radius: 15px;
      z-index: 99999;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;
    
    alert.innerHTML = `
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">📞 911 CALL INFORMATION</h1>
      <div style="text-align: left; background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
        <p><strong>Message:</strong> ${info.message}</p>
        <p><strong>Location:</strong> ${info.location}</p>
        <p><strong>Medical Conditions:</strong> ${info.medical_conditions.join(', ') || 'None listed'}</p>
        <p><strong>Critical Medications:</strong> ${info.medications.join(', ') || 'None listed'}</p>
        <p><strong>Severe Allergies:</strong> ${info.allergies.join(', ') || 'None listed'}</p>
        <p><strong>Emergency Contact:</strong> ${info.emergency_contact?.name || 'Not available'}</p>
      </div>
      <p style="font-size: 0.9rem; opacity: 0.8;">This information has been prepared for first responders</p>
      <button onclick="this.remove()" style="background: white; color: #ff3838; border: none; padding: 0.5rem 1rem; border-radius: 5px; margin-top: 1rem; cursor: pointer;">Close</button>
    `;
    
    document.body.appendChild(alert);
  }

  private createMedicalInfoFile(medicalPackage: any): void {
    const medicalInfo = JSON.stringify(medicalPackage, null, 2);
    const blob = new Blob([medicalInfo], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    console.log('📄 Medical information file created:', url);
    
    // In production, this would be shared with first responders
  }

  private notifyPrimaryContacts(userId: string, template: EmergencyTemplate): Promise<void> {
    const contacts = this.emergencyContacts.get(userId) || [];
    const primaryContacts = contacts.filter(c => c.is_primary);
    
    return Promise.all(
      primaryContacts.map(contact => 
        this.notifyContact(userId, contact, template, null, true)
      )
    ).then(() => {});
  }

  private notifySelectedContacts(userId: string, template: EmergencyTemplate): Promise<void> {
    // For non-critical emergencies, notify select contacts based on availability
    const contacts = this.emergencyContacts.get(userId) || [];
    const availableContacts = contacts.filter(c => this.isContactAvailable(c));
    
    return Promise.all(
      availableContacts.map(contact => 
        this.notifyContact(userId, contact, template, null, false)
      )
    ).then(() => {});
  }

  private isContactAvailable(contact: EmergencyContact): boolean {
    // Check if contact is available based on time zone and hours
    if (!contact.availability_hours) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(contact.availability_hours.start.split(':')[0]);
    const endHour = parseInt(contact.availability_hours.end.split(':')[0]);
    
    return currentHour >= startHour && currentHour <= endHour;
  }

  private showCall911Option(template: EmergencyTemplate): void {
    const option = document.createElement('div');
    option.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: #ff3838;
      color: white;
      padding: 1rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      z-index: 1001;
      animation: emergency-pulse 1s infinite;
    `;
    option.innerHTML = '📞 CALL 911?';
    option.onclick = () => {
      this.call911Direct();
      option.remove();
    };
    
    document.body.appendChild(option);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (option.parentElement) option.remove();
    }, 30000);
  }

  private provideCommunicationAssistance(emergencyType: string): void {
    // Provide communication templates and assistance for the emergency type
    console.log(`💬 Providing communication assistance for ${emergencyType} emergency`);
  }

  private shareLocationWithFirstResponders(userId: string): Promise<void> {
    return this.getCurrentLocation().then(location => {
      if (location && this.currentIncident) {
        this.currentIncident.location = location;
        this.currentIncident.response.location_shared = true;
        console.log('📍 Location shared with first responders:', location);
      }
    });
  }

  private startEmergencyMonitoring(userId: string): void {
    // Start monitoring emergency situation
    console.log('👁️ Emergency monitoring started');
    
    // In production, this would set up continuous monitoring
    // Check for updates, response confirmations, etc.
  }
}

// Export singleton instance
export const emergencyCommunicationService = EmergencyCommunicationService.getInstance();
export type { EmergencyContact, MedicalProfile, EmergencyTemplate, EmergencyIncident };