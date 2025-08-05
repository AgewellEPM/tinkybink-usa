// Platform Integration Service - Module 45
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getCloudSyncService } from '../communication/cloud-sync-service';
import { getAPIIntegrationService } from './api-integration-service';

interface PlatformCapabilities {
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web';
  version: string;
  features: Set<string>;
  permissions: Map<string, boolean>;
  hardware: {
    camera: boolean;
    microphone: boolean;
    speaker: boolean;
    vibration: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
    proximity: boolean;
    ambientLight: boolean;
    bluetooth: boolean;
    nfc: boolean;
    biometric: boolean;
  };
}

interface AppIntegration {
  id: string;
  name: string;
  package: string;
  installed: boolean;
  version?: string;
  capabilities: string[];
  urlScheme?: string;
  deepLinks?: Map<string, string>;
}

interface SystemService {
  id: string;
  name: string;
  type: 'notification' | 'calendar' | 'contacts' | 'reminders' | 'health' | 'location' | 'files';
  available: boolean;
  permission: 'granted' | 'denied' | 'not-requested';
  sync: boolean;
}

interface ShareTarget {
  id: string;
  name: string;
  icon: string;
  type: 'app' | 'service' | 'contact';
  action: (data: any) => Promise<void>;
}

interface WidgetConfig {
  id: string;
  type: 'home' | 'lock' | 'notification' | 'today';
  size: 'small' | 'medium' | 'large';
  refreshInterval: number;
  data: any;
}

export class PlatformIntegrationService {
  private static instance: PlatformIntegrationService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private cloudSyncService = getCloudSyncService();
  private apiIntegrationService = getAPIIntegrationService();
  
  private capabilities: PlatformCapabilities;
  private appIntegrations: Map<string, AppIntegration> = new Map();
  private systemServices: Map<string, SystemService> = new Map();
  private shareTargets: Map<string, ShareTarget> = new Map();
  private widgets: Map<string, WidgetConfig> = new Map();
  private platformBridge: any = null;

  private constructor() {
    this.capabilities = this.detectPlatformCapabilities();
    this.initializePlatformIntegrations();
  }

  static getInstance(): PlatformIntegrationService {
    if (!PlatformIntegrationService.instance) {
      PlatformIntegrationService.instance = new PlatformIntegrationService();
    }
    return PlatformIntegrationService.instance;
  }

  initialize(): void {
    console.log('PlatformIntegrationService initializing...');
    this.setupPlatformBridge();
    this.discoverInstalledApps();
    this.registerSystemServices();
    this.setupShareTargets();
    this.initializeWidgets();
    this.registerForPlatformEvents();
    console.log('PlatformIntegrationService initialized');
  }

  private detectPlatformCapabilities(): PlatformCapabilities {
    const ua = navigator.userAgent;
    let os: PlatformCapabilities['os'] = 'web';
    let version = 'unknown';

    // Detect OS
    if (/iPhone|iPad|iPod/.test(ua)) {
      os = 'ios';
      version = ua.match(/OS (\d+_\d+)/)?.[1].replace('_', '.') || 'unknown';
    } else if (/Android/.test(ua)) {
      os = 'android';
      version = ua.match(/Android (\d+\.\d+)/)?.[1] || 'unknown';
    } else if (/Windows/.test(ua)) {
      os = 'windows';
      version = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || 'unknown';
    } else if (/Mac/.test(ua)) {
      os = 'macos';
      version = ua.match(/Mac OS X (\d+_\d+)/)?.[1].replace('_', '.') || 'unknown';
    } else if (/Linux/.test(ua)) {
      os = 'linux';
    }

    // Detect features
    const features = new Set<string>();
    
    // PWA features
    if ('serviceWorker' in navigator) features.add('service-worker');
    if ('PushManager' in window) features.add('push-notifications');
    if ('share' in navigator) features.add('web-share');
    if ('bluetooth' in navigator) features.add('web-bluetooth');
    if ('usb' in navigator) features.add('web-usb');
    if ('serial' in navigator) features.add('web-serial');
    if ('nfc' in navigator) features.add('web-nfc');
    if ('geolocation' in navigator) features.add('geolocation');
    if ('mediaDevices' in navigator) features.add('media-devices');
    if ('requestIdleCallback' in window) features.add('idle-detection');
    if ('getInstalledRelatedApps' in navigator) features.add('related-apps');
    if ('contacts' in navigator) features.add('contacts-api');
    if ('share' in navigator && (navigator as any).canShare) features.add('advanced-share');
    
    // Native app features (when running in Capacitor/Cordova)
    if ((window as any).Capacitor) {
      features.add('capacitor');
      features.add('native-bridge');
    }
    if ((window as any).cordova) {
      features.add('cordova');
      features.add('native-bridge');
    }

    // Detect hardware capabilities
    const hardware = {
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      speaker: 'speechSynthesis' in window,
      vibration: 'vibrate' in navigator,
      accelerometer: 'DeviceMotionEvent' in window,
      gyroscope: 'DeviceOrientationEvent' in window,
      magnetometer: 'Magnetometer' in window,
      proximity: 'ProximitySensor' in window,
      ambientLight: 'AmbientLightSensor' in window,
      bluetooth: 'bluetooth' in navigator,
      nfc: 'nfc' in navigator,
      biometric: 'credentials' in navigator || 'TouchID' in window || 'FaceID' in window
    };

    return {
      os,
      version,
      features,
      permissions: new Map(),
      hardware
    };
  }

  private initializePlatformIntegrations(): void {
    // iOS integrations
    if (this.capabilities.os === 'ios') {
      this.registerAppIntegration({
        id: 'proloquo',
        name: 'Proloquo',
        package: 'com.assistiveware.proloquo',
        installed: false,
        capabilities: ['aac', 'symbols'],
        urlScheme: 'proloquo://',
        deepLinks: new Map([
          ['import', 'proloquo://import?data='],
          ['speak', 'proloquo://speak?text=']
        ])
      });

      this.registerAppIntegration({
        id: 'shortcuts',
        name: 'Shortcuts',
        package: 'com.apple.shortcuts',
        installed: true,
        capabilities: ['automation', 'voice'],
        urlScheme: 'shortcuts://',
        deepLinks: new Map([
          ['run', 'shortcuts://run-shortcut?name='],
          ['create', 'shortcuts://create-shortcut']
        ])
      });
    }

    // Android integrations
    if (this.capabilities.os === 'android') {
      this.registerAppIntegration({
        id: 'google-assistant',
        name: 'Google Assistant',
        package: 'com.google.android.apps.googleassistant',
        installed: true,
        capabilities: ['voice', 'actions'],
        deepLinks: new Map([
          ['voice', 'googleassistant://voice'],
          ['routine', 'googleassistant://routine']
        ])
      });

      this.registerAppIntegration({
        id: 'tasker',
        name: 'Tasker',
        package: 'net.dinglisch.android.taskerm',
        installed: false,
        capabilities: ['automation', 'events'],
        urlScheme: 'tasker://',
        deepLinks: new Map([
          ['task', 'tasker://task?name='],
          ['event', 'tasker://event?trigger=']
        ])
      });
    }

    // Cross-platform integrations
    this.registerAppIntegration({
      id: 'zoom',
      name: 'Zoom',
      package: 'us.zoom.videomeetings',
      installed: false,
      capabilities: ['video', 'communication'],
      urlScheme: 'zoom://',
      deepLinks: new Map([
        ['join', 'zoom://zoom.us/join?confno='],
        ['start', 'zoom://zoom.us/start?confno=']
      ])
    });

    this.registerAppIntegration({
      id: 'teams',
      name: 'Microsoft Teams',
      package: 'com.microsoft.teams',
      installed: false,
      capabilities: ['video', 'communication', 'collaboration'],
      urlScheme: 'msteams://',
      deepLinks: new Map([
        ['chat', 'msteams://teams.microsoft.com/l/chat/'],
        ['call', 'msteams://teams.microsoft.com/l/call/']
      ])
    });
  }

  private setupPlatformBridge(): void {
    // Setup native bridge if available
    if (this.capabilities.features.has('capacitor')) {
      this.platformBridge = (window as any).Capacitor;
    } else if (this.capabilities.features.has('cordova')) {
      this.platformBridge = (window as any).cordova;
    } else {
      // Web platform - use available APIs
      this.platformBridge = {
        plugins: {},
        platform: 'web'
      };
    }
  }

  private async discoverInstalledApps(): Promise<void> {
    // Check for installed related apps (Chrome 85+)
    if ('getInstalledRelatedApps' in navigator) {
      try {
        const relatedApps = await (navigator as any).getInstalledRelatedApps();
        relatedApps.forEach((app: any) => {
          const integration = Array.from(this.appIntegrations.values())
            .find(i => i.package === app.id);
          if (integration) {
            integration.installed = true;
            integration.version = app.version;
          }
        });
      } catch (error) {
        console.log('Related apps API not available');
      }
    }

    // Platform-specific app detection
    if (this.platformBridge?.plugins?.AppAvailability) {
      for (const [id, app] of this.appIntegrations) {
        try {
          const installed = await this.checkAppInstalled(app.package);
          app.installed = installed;
        } catch (error) {
          app.installed = false;
        }
      }
    }
  }

  private registerSystemServices(): void {
    // Notification service
    this.registerSystemService({
      id: 'notifications',
      name: 'System Notifications',
      type: 'notification',
      available: 'Notification' in window,
      permission: Notification.permission as any || 'not-requested',
      sync: true
    });

    // Calendar service
    this.registerSystemService({
      id: 'calendar',
      name: 'Calendar',
      type: 'calendar',
      available: this.isCalendarAvailable(),
      permission: 'not-requested',
      sync: true
    });

    // Contacts service
    this.registerSystemService({
      id: 'contacts',
      name: 'Contacts',
      type: 'contacts',
      available: 'contacts' in navigator || this.hasNativeContacts(),
      permission: 'not-requested',
      sync: true
    });

    // Reminders service
    this.registerSystemService({
      id: 'reminders',
      name: 'Reminders',
      type: 'reminders',
      available: this.isRemindersAvailable(),
      permission: 'not-requested',
      sync: true
    });

    // Health service
    this.registerSystemService({
      id: 'health',
      name: 'Health Data',
      type: 'health',
      available: this.isHealthAvailable(),
      permission: 'not-requested',
      sync: false
    });

    // Location service
    this.registerSystemService({
      id: 'location',
      name: 'Location Services',
      type: 'location',
      available: 'geolocation' in navigator,
      permission: 'not-requested',
      sync: false
    });

    // Files service
    this.registerSystemService({
      id: 'files',
      name: 'File System',
      type: 'files',
      available: 'showOpenFilePicker' in window || this.hasNativeFiles(),
      permission: 'granted',
      sync: true
    });
  }

  private setupShareTargets(): void {
    // Native share
    if (this.capabilities.features.has('web-share')) {
      this.registerShareTarget({
        id: 'native-share',
        name: 'Share',
        icon: '📤',
        type: 'service',
        action: async (data) => {
          if (navigator.share) {
            await navigator.share(data);
          }
        }
      });
    }

    // Copy to clipboard
    this.registerShareTarget({
      id: 'clipboard',
      name: 'Copy',
      icon: '📋',
      type: 'service',
      action: async (data) => {
        const text = data.text || data.url || JSON.stringify(data);
        await navigator.clipboard.writeText(text);
      }
    });

    // Email
    this.registerShareTarget({
      id: 'email',
      name: 'Email',
      icon: '✉️',
      type: 'service',
      action: async (data) => {
        const subject = encodeURIComponent(data.title || 'TinkyBink AAC');
        const body = encodeURIComponent(data.text || '');
        window.open(`mailto:?subject=${subject}&body=${body}`);
      }
    });

    // SMS
    if (this.capabilities.os === 'ios' || this.capabilities.os === 'android') {
      this.registerShareTarget({
        id: 'sms',
        name: 'Message',
        icon: '💬',
        type: 'service',
        action: async (data) => {
          const body = encodeURIComponent(data.text || '');
          window.open(`sms:?body=${body}`);
        }
      });
    }

    // Platform-specific apps
    this.appIntegrations.forEach((app, id) => {
      if (app.installed && app.deepLinks?.has('import')) {
        this.registerShareTarget({
          id: `app-${id}`,
          name: app.name,
          icon: '📱',
          type: 'app',
          action: async (data) => {
            const url = app.deepLinks!.get('import') + encodeURIComponent(JSON.stringify(data));
            window.open(url);
          }
        });
      }
    });
  }

  private initializeWidgets(): void {
    // Home screen widget (iOS 14+, Android)
    if (this.supportsWidgets()) {
      this.createWidget({
        id: 'quick-phrase',
        type: 'home',
        size: 'medium',
        refreshInterval: 3600000, // 1 hour
        data: {
          title: 'Quick Phrases',
          phrases: this.getFrequentPhrases()
        }
      });

      this.createWidget({
        id: 'daily-goal',
        type: 'home',
        size: 'small',
        refreshInterval: 300000, // 5 minutes
        data: {
          title: 'Daily Goal',
          progress: this.getDailyProgress()
        }
      });
    }

    // Today/notification widget
    if (this.supportsTodayWidget()) {
      this.createWidget({
        id: 'communication-stats',
        type: 'today',
        size: 'large',
        refreshInterval: 600000, // 10 minutes
        data: {
          title: 'Communication Stats',
          stats: this.getCommunicationStats()
        }
      });
    }
  }

  private registerForPlatformEvents(): void {
    // App lifecycle events
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onAppBackground();
      } else {
        this.onAppForeground();
      }
    });

    // Deep linking
    if (this.platformBridge?.App) {
      this.platformBridge.App.addListener('appUrlOpen', (data: any) => {
        this.handleDeepLink(data.url);
      });
    }

    // System events
    window.addEventListener('online', () => this.onNetworkChange(true));
    window.addEventListener('offline', () => this.onNetworkChange(false));

    // Share target (when app is registered as share target)
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        if (launchParams.targetURL?.includes('share-target')) {
          this.handleIncomingShare(launchParams);
        }
      });
    }

    // Platform-specific events
    if (this.capabilities.os === 'ios') {
      window.addEventListener('statusTap', () => this.onStatusBarTap());
    }
  }

  // Permission management
  async requestPermission(permission: string): Promise<boolean> {
    try {
      switch (permission) {
        case 'notification':
          if ('Notification' in window) {
            const result = await Notification.requestPermission();
            this.capabilities.permissions.set('notification', result === 'granted');
            return result === 'granted';
          }
          break;

        case 'camera':
        case 'microphone':
          const constraints = permission === 'camera' 
            ? { video: true } 
            : { audio: true };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          stream.getTracks().forEach(track => track.stop());
          this.capabilities.permissions.set(permission, true);
          return true;

        case 'location':
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                this.capabilities.permissions.set('location', true);
                resolve(true);
              },
              () => {
                this.capabilities.permissions.set('location', false);
                resolve(false);
              }
            );
          });

        case 'contacts':
          if ('contacts' in navigator) {
            await (navigator as any).contacts.select(['name'], { multiple: false });
            this.capabilities.permissions.set('contacts', true);
            return true;
          }
          break;

        case 'calendar':
        case 'reminders':
          // Platform-specific implementation
          if (this.platformBridge?.plugins?.Calendar) {
            const granted = await this.platformBridge.plugins.Calendar.requestPermission();
            this.capabilities.permissions.set(permission, granted);
            return granted;
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to request ${permission} permission:`, error);
      this.capabilities.permissions.set(permission, false);
    }

    return false;
  }

  // App integration methods
  async launchApp(appId: string, action?: string, data?: any): Promise<boolean> {
    const app = this.appIntegrations.get(appId);
    if (!app || !app.installed) return false;

    try {
      let url = app.urlScheme;
      
      if (action && app.deepLinks?.has(action)) {
        url = app.deepLinks.get(action)!;
        if (data) {
          url += encodeURIComponent(typeof data === 'string' ? data : JSON.stringify(data));
        }
      }

      // Try to open the app
      if (this.platformBridge?.plugins?.AppLauncher) {
        await this.platformBridge.plugins.AppLauncher.openUrl({ url });
      } else {
        window.open(url, '_system');
      }

      this.analyticsService.trackEvent('app_launched', {
        appId,
        action
      });

      return true;
    } catch (error) {
      console.error(`Failed to launch ${appId}:`, error);
      return false;
    }
  }

  async shareToApp(appId: string, data: any): Promise<boolean> {
    const app = this.appIntegrations.get(appId);
    if (!app || !app.installed) return false;

    return this.launchApp(appId, 'import', data);
  }

  // System service methods
  async createNotification(options: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
    requireInteraction?: boolean;
  }): Promise<void> {
    const service = this.systemServices.get('notifications');
    if (!service || service.permission !== 'granted') {
      const granted = await this.requestPermission('notification');
      if (!granted) return;
    }

    if ('Notification' in window) {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
        actions: options.actions
      });

      notification.onclick = () => {
        window.focus();
        if (options.data?.action) {
          this.handleNotificationAction(options.data.action);
        }
      };
    } else if (this.platformBridge?.plugins?.LocalNotifications) {
      // Native notification
      await this.platformBridge.plugins.LocalNotifications.schedule({
        notifications: [{
          title: options.title,
          body: options.body,
          id: Date.now(),
          extra: options.data
        }]
      });
    }
  }

  async addCalendarEvent(event: {
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
    reminder?: number; // minutes before
  }): Promise<boolean> {
    const service = this.systemServices.get('calendar');
    if (!service || service.permission !== 'granted') {
      const granted = await this.requestPermission('calendar');
      if (!granted) return false;
    }

    try {
      if (this.platformBridge?.plugins?.Calendar) {
        await this.platformBridge.plugins.Calendar.createEvent({
          title: event.title,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          location: event.location,
          notes: event.notes,
          firstReminderMinutes: event.reminder
        });
        return true;
      } else {
        // Web fallback - create .ics file
        const icsContent = this.createICSFile(event);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title}.ics`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
      }
    } catch (error) {
      console.error('Failed to add calendar event:', error);
      return false;
    }
  }

  async getContacts(filter?: string): Promise<Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }>> {
    const service = this.systemServices.get('contacts');
    if (!service || service.permission !== 'granted') {
      const granted = await this.requestPermission('contacts');
      if (!granted) return [];
    }

    try {
      if ('contacts' in navigator) {
        const props = ['name', 'email', 'tel', 'icon'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: true });
        
        return contacts.map((contact: any) => ({
          id: contact.email?.[0] || contact.tel?.[0] || contact.name?.[0],
          name: contact.name?.[0] || 'Unknown',
          email: contact.email?.[0],
          phone: contact.tel?.[0],
          avatar: contact.icon?.[0]
        })).filter((c: any) => 
          !filter || c.name.toLowerCase().includes(filter.toLowerCase())
        );
      } else if (this.platformBridge?.plugins?.Contacts) {
        const result = await this.platformBridge.plugins.Contacts.getContacts();
        return result.contacts.filter((c: any) => 
          !filter || c.displayName.toLowerCase().includes(filter.toLowerCase())
        );
      }
    } catch (error) {
      console.error('Failed to get contacts:', error);
    }

    return [];
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    const service = this.systemServices.get('location');
    if (!service || service.permission !== 'granted') {
      const granted = await this.requestPermission('location');
      if (!granted) return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Share functionality
  async share(data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    // Check if advanced sharing is available
    if (navigator.share && (!data.files || (navigator as any).canShare?.(data))) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Fallback to share targets
    const targets = this.getShareTargets();
    if (targets.length > 0) {
      // Show share UI
      return this.showShareUI(data, targets);
    }

    return false;
  }

  private async showShareUI(data: any, targets: ShareTarget[]): Promise<boolean> {
    return new Promise((resolve) => {
      // Create share dialog
      const dialog = document.createElement('div');
      dialog.className = 'platform-share-dialog';
      dialog.innerHTML = `
        <div class="share-content">
          <h3>Share via</h3>
          <div class="share-targets">
            ${targets.map(target => `
              <button class="share-target" data-id="${target.id}">
                <span class="share-icon">${target.icon}</span>
                <span class="share-name">${target.name}</span>
              </button>
            `).join('')}
          </div>
          <button class="share-cancel">Cancel</button>
        </div>
      `;

      // Handle target selection
      dialog.addEventListener('click', async (e) => {
        const target = (e.target as HTMLElement).closest('.share-target');
        if (target) {
          const targetId = target.getAttribute('data-id');
          const shareTarget = targets.find(t => t.id === targetId);
          if (shareTarget) {
            try {
              await shareTarget.action(data);
              resolve(true);
            } catch (error) {
              console.error('Share action failed:', error);
              resolve(false);
            }
          }
          dialog.remove();
        } else if ((e.target as HTMLElement).classList.contains('share-cancel')) {
          dialog.remove();
          resolve(false);
        }
      });

      document.body.appendChild(dialog);
    });
  }

  // Widget management
  private createWidget(config: WidgetConfig): void {
    this.widgets.set(config.id, config);
    
    if (this.platformBridge?.plugins?.Widget) {
      this.platformBridge.plugins.Widget.create(config);
    } else {
      // Web widget fallback (using Web App Manifest)
      this.updateWebWidget(config);
    }
  }

  updateWidget(widgetId: string, data: any): void {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    widget.data = { ...widget.data, ...data };
    
    if (this.platformBridge?.plugins?.Widget) {
      this.platformBridge.plugins.Widget.update(widgetId, data);
    } else {
      this.updateWebWidget(widget);
    }
  }

  private updateWebWidget(widget: WidgetConfig): void {
    // Store widget data for PWA
    this.dataService.setData(`widget_${widget.id}`, widget.data);
    
    // Update badge if applicable
    if ('setAppBadge' in navigator && widget.data.badge) {
      (navigator as any).setAppBadge(widget.data.badge);
    }
  }

  // Platform-specific features
  async enableSiriShortcuts(): Promise<void> {
    if (this.capabilities.os !== 'ios') return;
    
    if (this.platformBridge?.plugins?.SiriShortcuts) {
      const shortcuts = [
        {
          key: 'speak-sentence',
          title: 'Speak Current Sentence',
          suggestedPhrase: 'Speak my sentence',
          isEligibleForSearch: true,
          isEligibleForPrediction: true
        },
        {
          key: 'quick-phrase',
          title: 'Quick Phrase',
          suggestedPhrase: 'Say hello',
          isEligibleForSearch: true,
          isEligibleForPrediction: true
        }
      ];
      
      for (const shortcut of shortcuts) {
        await this.platformBridge.plugins.SiriShortcuts.donate(shortcut);
      }
    }
  }

  async setupAndroidQuickSettings(): Promise<void> {
    if (this.capabilities.os !== 'android') return;
    
    if (this.platformBridge?.plugins?.QuickSettings) {
      await this.platformBridge.plugins.QuickSettings.create({
        tiles: [
          {
            id: 'speak-tile',
            label: 'Speak',
            icon: 'ic_speak',
            action: 'com.tinkybink.SPEAK'
          },
          {
            id: 'clear-tile',
            label: 'Clear',
            icon: 'ic_clear',
            action: 'com.tinkybink.CLEAR'
          }
        ]
      });
    }
  }

  // Event handlers
  private onAppBackground(): void {
    // Save state
    this.cloudSyncService.syncNow();
    
    // Update widgets
    this.widgets.forEach(widget => {
      this.updateWidget(widget.id, {
        lastUpdated: new Date().toISOString()
      });
    });
  }

  private onAppForeground(): void {
    // Refresh data
    this.discoverInstalledApps();
    
    // Check for updates
    this.checkForUpdates();
  }

  private onNetworkChange(online: boolean): void {
    if (online) {
      // Resume sync
      this.cloudSyncService.resumeSync();
    } else {
      // Pause sync
      this.cloudSyncService.pauseSync();
    }
  }

  private handleDeepLink(url: string): void {
    // Parse deep link
    const parsed = new URL(url);
    const action = parsed.pathname.substring(1);
    const params = Object.fromEntries(parsed.searchParams);
    
    // Handle action
    switch (action) {
      case 'speak':
        window.dispatchEvent(new CustomEvent('deepLinkSpeak', {
          detail: { text: params.text }
        }));
        break;
      case 'import':
        window.dispatchEvent(new CustomEvent('deepLinkImport', {
          detail: { data: params.data }
        }));
        break;
    }
  }

  private handleIncomingShare(launchParams: any): void {
    // Handle shared content
    const files = launchParams.files || [];
    const text = launchParams.text || '';
    const url = launchParams.url || '';
    
    window.dispatchEvent(new CustomEvent('incomingShare', {
      detail: { files, text, url }
    }));
  }

  private onStatusBarTap(): void {
    // iOS status bar tap - scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private handleNotificationAction(action: string): void {
    window.dispatchEvent(new CustomEvent('notificationAction', {
      detail: { action }
    }));
  }

  // Helper methods
  private registerAppIntegration(app: AppIntegration): void {
    this.appIntegrations.set(app.id, app);
  }

  private registerSystemService(service: SystemService): void {
    this.systemServices.set(service.id, service);
  }

  private registerShareTarget(target: ShareTarget): void {
    this.shareTargets.set(target.id, target);
  }

  private async checkAppInstalled(packageId: string): Promise<boolean> {
    if (this.platformBridge?.plugins?.AppAvailability) {
      try {
        const result = await this.platformBridge.plugins.AppAvailability.check({
          package: packageId
        });
        return result.available;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  private isCalendarAvailable(): boolean {
    return this.platformBridge?.plugins?.Calendar !== undefined;
  }

  private isRemindersAvailable(): boolean {
    return this.capabilities.os === 'ios' || this.capabilities.os === 'android';
  }

  private isHealthAvailable(): boolean {
    return (this.capabilities.os === 'ios' && this.platformBridge?.plugins?.HealthKit) ||
           (this.capabilities.os === 'android' && this.platformBridge?.plugins?.GoogleFit);
  }

  private hasNativeContacts(): boolean {
    return this.platformBridge?.plugins?.Contacts !== undefined;
  }

  private hasNativeFiles(): boolean {
    return this.platformBridge?.plugins?.Filesystem !== undefined;
  }

  private supportsWidgets(): boolean {
    return this.capabilities.os === 'ios' || this.capabilities.os === 'android';
  }

  private supportsTodayWidget(): boolean {
    return this.capabilities.os === 'ios';
  }

  private getFrequentPhrases(): string[] {
    return this.dataService.getData('frequent_phrases') || [
      'Hello',
      'Thank you',
      'I need help',
      'Yes',
      'No'
    ];
  }

  private getDailyProgress(): { current: number; goal: number } {
    const stats = this.dataService.getData('daily_stats') || {};
    return {
      current: stats.sentencesToday || 0,
      goal: stats.dailyGoal || 50
    };
  }

  private getCommunicationStats(): any {
    return this.dataService.getData('communication_stats') || {
      todaySentences: 0,
      weeklyAverage: 0,
      favoriteWords: [],
      streak: 0
    };
  }

  private createICSFile(event: any): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TinkyBink AAC//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@tinkybink.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${event.title}`,
      event.location ? `LOCATION:${event.location}` : '',
      event.notes ? `DESCRIPTION:${event.notes}` : '',
      event.reminder ? `BEGIN:VALARM
TRIGGER:-PT${event.reminder}M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');
  }

  private async checkForUpdates(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    }
  }

  // Public API
  getPlatform(): PlatformCapabilities {
    return { ...this.capabilities };
  }

  isFeatureAvailable(feature: string): boolean {
    return this.capabilities.features.has(feature);
  }

  isHardwareAvailable(hardware: keyof PlatformCapabilities['hardware']): boolean {
    return this.capabilities.hardware[hardware];
  }

  hasPermission(permission: string): boolean {
    return this.capabilities.permissions.get(permission) || false;
  }

  getInstalledApps(): AppIntegration[] {
    return Array.from(this.appIntegrations.values())
      .filter(app => app.installed);
  }

  getAvailableApps(): AppIntegration[] {
    return Array.from(this.appIntegrations.values());
  }

  getSystemServices(): SystemService[] {
    return Array.from(this.systemServices.values());
  }

  getShareTargets(): ShareTarget[] {
    return Array.from(this.shareTargets.values());
  }

  isNativePlatform(): boolean {
    return this.capabilities.features.has('native-bridge');
  }

  isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  getAppVersion(): string {
    return this.dataService.getData('app_version') || '1.0.0';
  }

  async openAppStore(): Promise<void> {
    const appId = this.dataService.getData('app_store_id');
    
    if (this.capabilities.os === 'ios' && appId) {
      window.open(`https://apps.apple.com/app/id${appId}`, '_blank');
    } else if (this.capabilities.os === 'android' && appId) {
      window.open(`https://play.google.com/store/apps/details?id=${appId}`, '_blank');
    } else {
      window.open('https://tinkybink.com/download', '_blank');
    }
  }
}

export function getPlatformIntegrationService(): PlatformIntegrationService {
  return PlatformIntegrationService.getInstance();
}