/**
 * White Label Configuration Service
 * Allows clinics, hospitals, and organizations to customize TinkyBink
 * 
 * Features:
 * - Custom branding (logo, colors, fonts)
 * - Custom domain support
 * - Feature toggling per organization
 * - Custom vocabularies and tile sets
 * - Organization-specific integrations
 * - Custom billing and pricing
 * - Multi-tenant architecture
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0
 */

interface WhiteLabelConfig {
  organizationId: string;
  organizationName: string;
  subdomain: string; // e.g., 'childrens-hospital' for childrens-hospital.tinkybink.com
  customDomain?: string; // e.g., 'aac.childrenshospital.org'
  
  // Branding
  branding: {
    logo: {
      light: string; // URL or base64
      dark: string;
      favicon: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      // Semantic colors
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    fonts: {
      heading: string;
      body: string;
      mono: string;
      // Font URLs if custom
      customFontUrls?: string[];
    };
    theme: {
      borderRadius: string;
      shadowStyle: 'none' | 'subtle' | 'medium' | 'strong';
      animationSpeed: 'none' | 'reduced' | 'normal' | 'enhanced';
    };
  };
  
  // Features
  features: {
    // Core AAC
    aac: {
      enabled: boolean;
      customVocabulary: boolean;
      importedTileSets: string[]; // IDs of imported tile sets
    };
    
    // AI Features
    ai: {
      predictiveCommunication: boolean;
      emotionDetection: boolean;
      contextAwareness: boolean;
      customAIModel?: string; // Organization's fine-tuned model
    };
    
    // Accessibility
    accessibility: {
      eyeTracking: boolean;
      switchScanning: boolean;
      headTracking: boolean;
      customAccessMethods: string[];
    };
    
    // Clinical
    clinical: {
      patientManagement: boolean;
      therapyPlanning: boolean;
      progressTracking: boolean;
      clinicalReports: boolean;
      customAssessments: string[];
    };
    
    // Communication
    communication: {
      voiceSynthesis: boolean;
      customVoices: string[];
      videoChat: boolean;
      messaging: boolean;
      emergencyProtocols: boolean;
    };
    
    // Integration
    integrations: {
      ehr: boolean;
      billing: boolean;
      telehealth: boolean;
      customWebhooks: boolean;
    };
  };
  
  // Content
  content: {
    defaultLanguage: string;
    supportedLanguages: string[];
    customCategories: Array<{
      id: string;
      name: string;
      icon: string;
      tiles: Array<{
        id: string;
        text: string;
        image: string;
        audio?: string;
      }>;
    }>;
    preloadedPhrases: string[];
    customSymbolSets: string[];
  };
  
  // Billing
  billing: {
    model: 'free' | 'subscription' | 'usage' | 'enterprise';
    customPricing?: {
      monthly: number;
      annual: number;
      perUser: number;
      features: Record<string, number>;
    };
    paymentMethods: ('stripe' | 'invoice' | 'insurance' | 'custom')[];
    billingContact: string;
  };
  
  // Access Control
  access: {
    selfRegistration: boolean;
    requireApproval: boolean;
    allowedDomains: string[]; // Email domains
    ssoEnabled: boolean;
    ssoProvider?: 'saml' | 'oauth' | 'ldap';
    ssoConfig?: Record<string, any>;
    roleMapping: Record<string, string[]>; // SSO role to app roles
  };
  
  // Compliance
  compliance: {
    hipaaCompliant: boolean;
    dataResidency: 'us' | 'eu' | 'ca' | 'au' | 'custom';
    auditLogging: boolean;
    dataRetentionDays: number;
    customCompliance: string[];
  };
  
  // Support
  support: {
    customSupportEmail: string;
    customSupportPhone?: string;
    showTinkyBinkBranding: boolean;
    customHelpContent?: string;
    trainingMaterials?: string[];
  };
  
  // Advanced
  advanced: {
    customCSS?: string;
    customJS?: string;
    customComponents?: Record<string, string>; // Component overrides
    apiExtensions?: string[];
    webhooks?: Array<{
      event: string;
      url: string;
      headers?: Record<string, string>;
    }>;
  };
}

class WhiteLabelService {
  private static instance: WhiteLabelService;
  private configs: Map<string, WhiteLabelConfig> = new Map();
  private currentConfig: WhiteLabelConfig | null = null;
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): WhiteLabelService {
    if (!WhiteLabelService.instance) {
      WhiteLabelService.instance = new WhiteLabelService();
    }
    return WhiteLabelService.instance;
  }
  
  /**
   * Initialize white label service
   */
  private async initializeService(): Promise<void> {
    console.log('🏢 Initializing White Label Service...');
    
    // Load config based on domain
    await this.loadConfigForDomain();
    
    // Apply initial configuration
    if (this.currentConfig) {
      await this.applyConfiguration(this.currentConfig);
    }
  }
  
  /**
   * Create new white label configuration
   */
  async createWhiteLabelConfig(config: Partial<WhiteLabelConfig>): Promise<string> {
    const configId = `wl_${Date.now()}`;
    
    const fullConfig: WhiteLabelConfig = {
      organizationId: config.organizationId || configId,
      organizationName: config.organizationName || 'Organization',
      subdomain: config.subdomain || 'default',
      
      // Default branding
      branding: config.branding || {
        logo: {
          light: '/logo-light.png',
          dark: '/logo-dark.png',
          favicon: '/favicon.ico'
        },
        colors: {
          primary: '#FF6B6B',
          secondary: '#845EC2',
          accent: '#4ECDC4',
          background: '#1a1a2e',
          text: '#FFFFFF',
          success: '#4ECDC4',
          warning: '#FFE66D',
          error: '#FF6B6B',
          info: '#4E8BFF'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
          mono: 'JetBrains Mono'
        },
        theme: {
          borderRadius: '12px',
          shadowStyle: 'medium',
          animationSpeed: 'normal'
        }
      },
      
      // Default features - all enabled
      features: config.features || {
        aac: {
          enabled: true,
          customVocabulary: true,
          importedTileSets: []
        },
        ai: {
          predictiveCommunication: true,
          emotionDetection: true,
          contextAwareness: true
        },
        accessibility: {
          eyeTracking: true,
          switchScanning: true,
          headTracking: true,
          customAccessMethods: []
        },
        clinical: {
          patientManagement: true,
          therapyPlanning: true,
          progressTracking: true,
          clinicalReports: true,
          customAssessments: []
        },
        communication: {
          voiceSynthesis: true,
          customVoices: [],
          videoChat: true,
          messaging: true,
          emergencyProtocols: true
        },
        integrations: {
          ehr: true,
          billing: true,
          telehealth: true,
          customWebhooks: true
        }
      },
      
      // Default content
      content: config.content || {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'],
        customCategories: [],
        preloadedPhrases: [],
        customSymbolSets: []
      },
      
      // Default billing
      billing: config.billing || {
        model: 'subscription',
        paymentMethods: ['stripe', 'invoice']
      },
      
      // Default access
      access: config.access || {
        selfRegistration: true,
        requireApproval: false,
        allowedDomains: [],
        ssoEnabled: false
      },
      
      // Default compliance
      compliance: config.compliance || {
        hipaaCompliant: true,
        dataResidency: 'us',
        auditLogging: true,
        dataRetentionDays: 365,
        customCompliance: []
      },
      
      // Default support
      support: config.support || {
        customSupportEmail: 'support@' + (config.subdomain || 'organization') + '.com',
        showTinkyBinkBranding: true
      },
      
      // Advanced options
      advanced: config.advanced || {}
    };
    
    // Save configuration
    this.configs.set(fullConfig.organizationId, fullConfig);
    await this.saveConfiguration(fullConfig);
    
    console.log(`✅ White label config created for ${fullConfig.organizationName}`);
    return fullConfig.organizationId;
  }
  
  /**
   * Apply white label configuration
   */
  private async applyConfiguration(config: WhiteLabelConfig): Promise<void> {
    console.log(`🎨 Applying white label config for ${config.organizationName}`);
    
    // Apply branding
    this.applyBranding(config.branding);
    
    // Apply feature flags
    this.applyFeatureFlags(config.features);
    
    // Load custom content
    await this.loadCustomContent(config.content);
    
    // Configure integrations
    await this.configureIntegrations(config);
    
    // Apply custom CSS/JS if provided
    if (config.advanced.customCSS) {
      this.injectCustomCSS(config.advanced.customCSS);
    }
    
    if (config.advanced.customJS) {
      this.injectCustomJS(config.advanced.customJS);
    }
    
    console.log('✅ White label configuration applied');
  }
  
  /**
   * Apply branding changes
   */
  private applyBranding(branding: WhiteLabelConfig['branding']): void {
    const root = document.documentElement;
    
    // Apply colors as CSS variables
    Object.entries(branding.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply fonts
    root.style.setProperty('--font-heading', branding.fonts.heading);
    root.style.setProperty('--font-body', branding.fonts.body);
    root.style.setProperty('--font-mono', branding.fonts.mono);
    
    // Apply theme
    root.style.setProperty('--border-radius', branding.theme.borderRadius);
    root.setAttribute('data-shadow', branding.theme.shadowStyle);
    root.setAttribute('data-animation', branding.theme.animationSpeed);
    
    // Update logo
    this.updateLogos(branding.logo);
    
    // Update favicon
    this.updateFavicon(branding.logo.favicon);
  }
  
  /**
   * Apply feature flags
   */
  private applyFeatureFlags(features: WhiteLabelConfig['features']): void {
    // Store feature flags in global config
    (window as any).__TINKYBINK_FEATURES__ = features;
    
    // Emit feature change event
    window.dispatchEvent(new CustomEvent('tinkybink:features:changed', {
      detail: features
    }));
  }
  
  /**
   * Get configuration for current organization
   */
  async getConfigForOrganization(organizationId: string): Promise<WhiteLabelConfig | null> {
    // Try cache first
    if (this.configs.has(organizationId)) {
      return this.configs.get(organizationId)!;
    }
    
    // Load from storage
    try {
      const config = await this.loadConfiguration(organizationId);
      if (config) {
        this.configs.set(organizationId, config);
        return config;
      }
    } catch (error) {
      console.error('Failed to load white label config:', error);
    }
    
    return null;
  }
  
  /**
   * Update white label configuration
   */
  async updateConfiguration(
    organizationId: string, 
    updates: Partial<WhiteLabelConfig>
  ): Promise<void> {
    const existing = await this.getConfigForOrganization(organizationId);
    if (!existing) {
      throw new Error('Configuration not found');
    }
    
    const updated = { ...existing, ...updates };
    this.configs.set(organizationId, updated);
    
    // Apply if current
    if (this.currentConfig?.organizationId === organizationId) {
      await this.applyConfiguration(updated);
    }
    
    // Save
    await this.saveConfiguration(updated);
  }
  
  /**
   * Export configuration for backup/migration
   */
  exportConfiguration(organizationId: string): WhiteLabelConfig | null {
    return this.configs.get(organizationId) || null;
  }
  
  /**
   * Import configuration
   */
  async importConfiguration(config: WhiteLabelConfig): Promise<void> {
    // Validate configuration
    if (!this.validateConfiguration(config)) {
      throw new Error('Invalid configuration');
    }
    
    // Save and apply
    this.configs.set(config.organizationId, config);
    await this.saveConfiguration(config);
    
    if (!this.currentConfig) {
      await this.applyConfiguration(config);
    }
  }
  
  /**
   * Get current active configuration
   */
  getCurrentConfiguration(): WhiteLabelConfig | null {
    return this.currentConfig;
  }
  
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    if (!this.currentConfig) return true; // All features enabled by default
    
    const features = this.currentConfig.features;
    const [category, subfeature] = feature.split('.');
    
    // Navigate nested feature structure
    const categoryFeatures = (features as any)[category];
    if (!categoryFeatures) return true;
    
    if (subfeature) {
      return categoryFeatures[subfeature] !== false;
    }
    
    return categoryFeatures.enabled !== false;
  }
  
  // Private helper methods
  
  private async loadConfigForDomain(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const hostname = window.location.hostname;
    
    // Check for subdomain
    const subdomain = hostname.split('.')[0];
    
    // Check for custom domain mapping
    const customDomainConfig = await this.getConfigByCustomDomain(hostname);
    if (customDomainConfig) {
      this.currentConfig = customDomainConfig;
      return;
    }
    
    // Check for subdomain config
    const subdomainConfig = await this.getConfigBySubdomain(subdomain);
    if (subdomainConfig) {
      this.currentConfig = subdomainConfig;
      return;
    }
    
    // Use default config
    console.log('Using default TinkyBink configuration');
  }
  
  private updateLogos(logos: WhiteLabelConfig['branding']['logo']): void {
    // Update all logo instances
    const logoElements = document.querySelectorAll('[data-logo]');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    logoElements.forEach(element => {
      if (element instanceof HTMLImageElement) {
        element.src = isDarkMode ? logos.dark : logos.light;
      }
    });
  }
  
  private updateFavicon(faviconUrl: string): void {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || 
                 document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.head.appendChild(link);
  }
  
  private injectCustomCSS(css: string): void {
    const style = document.createElement('style');
    style.id = 'white-label-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }
  
  private injectCustomJS(js: string): void {
    const script = document.createElement('script');
    script.id = 'white-label-custom-js';
    script.textContent = `(function() { ${js} })();`;
    document.body.appendChild(script);
  }
  
  private async loadCustomContent(content: WhiteLabelConfig['content']): Promise<void> {
    // Load custom categories and tiles
    if (content.customCategories.length > 0) {
      console.log(`Loading ${content.customCategories.length} custom categories`);
      // Would integrate with tile service
    }
    
    // Set supported languages
    (window as any).__TINKYBINK_LANGUAGES__ = content.supportedLanguages;
  }
  
  private async configureIntegrations(config: WhiteLabelConfig): Promise<void> {
    // Configure SSO if enabled
    if (config.access.ssoEnabled && config.access.ssoConfig) {
      console.log('Configuring SSO:', config.access.ssoProvider);
      // Would configure SSO provider
    }
    
    // Configure webhooks
    if (config.advanced.webhooks) {
      console.log(`Configuring ${config.advanced.webhooks.length} webhooks`);
      // Would register webhooks
    }
  }
  
  private validateConfiguration(config: any): boolean {
    // Basic validation
    return !!(
      config.organizationId &&
      config.organizationName &&
      config.subdomain &&
      config.branding &&
      config.features
    );
  }
  
  private async saveConfiguration(config: WhiteLabelConfig): Promise<void> {
    // In production, save to database
    localStorage.setItem(`wl_config_${config.organizationId}`, JSON.stringify(config));
  }
  
  private async loadConfiguration(organizationId: string): Promise<WhiteLabelConfig | null> {
    // In production, load from database
    const saved = localStorage.getItem(`wl_config_${organizationId}`);
    return saved ? JSON.parse(saved) : null;
  }
  
  private async getConfigByCustomDomain(domain: string): Promise<WhiteLabelConfig | null> {
    // In production, query database by custom domain
    for (const config of this.configs.values()) {
      if (config.customDomain === domain) {
        return config;
      }
    }
    return null;
  }
  
  private async getConfigBySubdomain(subdomain: string): Promise<WhiteLabelConfig | null> {
    // In production, query database by subdomain
    for (const config of this.configs.values()) {
      if (config.subdomain === subdomain) {
        return config;
      }
    }
    return null;
  }
}

// Export singleton instance
export const whiteLabelService = WhiteLabelService.getInstance();
export type { WhiteLabelConfig };