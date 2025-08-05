// Enterprise Integration Service - Module 60
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getMultiTenantService } from './multi-tenant-service';
import { getRBACService } from './rbac-service';
import { getAuditService } from './audit-service';

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'sso' | 'database' | 'file_system' | 'messaging' | 'analytics' | 'crm';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  configuration: IntegrationConfig;
  authentication: AuthConfig;
  dataMapping: DataMapping;
  syncSettings: SyncSettings;
  monitoring: MonitoringConfig;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
  lastError?: string;
}

interface IntegrationConfig {
  baseUrl?: string;
  version?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
  customHeaders?: Record<string, string>;
  parameters?: Record<string, unknown>;
  features: string[];
}

interface AuthConfig {
  type: 'none' | 'api_key' | 'oauth2' | 'jwt' | 'basic' | 'custom';
  credentials: Record<string, string>;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes?: string[];
  expiresAt?: Date;
  autoRefresh: boolean;
}

interface DataMapping {
  inbound: FieldMapping[];
  outbound: FieldMapping[];
  transformations: DataTransformation[];
  filters: DataFilter[];
}

interface FieldMapping {
  source: string;
  target: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}

interface DataTransformation {
  id: string;
  name: string;
  type: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'custom';
  config: Record<string, unknown>;
  enabled: boolean;
}

interface DataFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'starts_with' | 'ends_with';
  value: unknown;
  condition: 'and' | 'or';
}

interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'range' | 'custom';
  value?: unknown;
  message?: string;
}

interface SyncSettings {
  enabled: boolean;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  frequency: 'realtime' | 'interval' | 'scheduled' | 'manual';
  interval?: number; // milliseconds
  schedule?: {
    type: 'daily' | 'weekly' | 'monthly' | 'cron';
    value: string;
  };
  batchSize: number;
  conflictResolution: 'source_wins' | 'target_wins' | 'merge' | 'manual';
  deltaSync: boolean;
  compressionEnabled: boolean;
}

interface MonitoringConfig {
  enabled: boolean;
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    endpoint?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number; // days
    includeHeaders: boolean;
    includeBody: boolean;
  };
  alerting: {
    enabled: boolean;
    thresholds: {
      errorRate: number;
      responseTime: number;
      successRate: number;
    };
    channels: string[];
  };
}

interface SyncEvent {
  id: string;
  integrationId: string;
  timestamp: Date;
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'auth_refreshed' | 'health_check';
  direction?: 'inbound' | 'outbound';
  recordsProcessed?: number;
  recordsSucceeded?: number;
  recordsFailed?: number;
  duration: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
  metadata?: Record<string, unknown>;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  integrationId?: string;
  tenantId: string;
  headers?: Record<string, string>;
  retryPolicy: {
    enabled: boolean;
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    initialDelay: number;
  };
  signatureValidation: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  totalDeliveries: number;
  successfulDeliveries: number;
}

interface APIConnection {
  id: string;
  name: string;
  baseUrl: string;
  authentication: AuthConfig;
  endpoints: APIEndpoint[];
  rateLimiting: RateLimitConfig;
  caching: CacheConfig;
  monitoring: APIMonitoringConfig;
  tenantId: string;
  createdAt: Date;
  status: 'connected' | 'disconnected' | 'error';
}

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
  parameters?: Parameter[];
  requestSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  timeout: number;
  cacheTtl?: number;
  rateLimit?: number;
}

interface Parameter {
  name: string;
  type: 'query' | 'header' | 'path' | 'body';
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: unknown;
}

interface RateLimitConfig {
  enabled: boolean;
  requests: number;
  window: number; // milliseconds
  strategy: 'sliding_window' | 'fixed_window' | 'token_bucket';
  burstLimit?: number;
}

interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'ttl';
  keyGeneration: 'url' | 'custom';
  varyBy?: string[];
}

interface APIMonitoringConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  trackMetrics: boolean;
  alertOnErrors: boolean;
  performanceThresholds: {
    responseTime: number;
    errorRate: number;
  };
  uptime: {
    checkInterval: number;
    healthEndpoint?: string;
  };
}

interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  version: string;
  configuration: Partial<IntegrationConfig>;
  authentication: Partial<AuthConfig>;
  dataMapping: Partial<DataMapping>;
  syncSettings: Partial<SyncSettings>;
  documentation: {
    setupGuide: string;
    apiReference: string;
    examples: Record<string, unknown>[];
  };
  requirements: string[];
  supportedFeatures: string[];
}

export class EnterpriseIntegrationService {
  private static instance: EnterpriseIntegrationService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private multiTenantService = getMultiTenantService();
  private rbacService = getRBACService();
  private auditService = getAuditService();
  
  private integrations: Map<string, Integration> = new Map();
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private apiConnections: Map<string, APIConnection> = new Map();
  private syncEvents: Map<string, SyncEvent> = new Map();
  private templates: Map<string, IntegrationTemplate> = new Map();
  
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  
  private eventQueue: SyncEvent[] = [];
  private isProcessingQueue = false;
  private isInitialized = false;

  private constructor() {
    this.initializeTemplates();
  }

  static getInstance(): EnterpriseIntegrationService {
    if (!EnterpriseIntegrationService.instance) {
      EnterpriseIntegrationService.instance = new EnterpriseIntegrationService();
    }
    return EnterpriseIntegrationService.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    console.log('EnterpriseIntegrationService initializing...');
    this.loadIntegrations();
    this.loadWebhooks();
    this.loadAPIConnections();
    this.setupEventListeners();
    this.startSyncProcessors();
    this.startHealthChecks();
    this.startEventProcessor();
    this.isInitialized = true;
    console.log('EnterpriseIntegrationService initialized');
  }

  private initializeTemplates(): void {
    // Salesforce CRM Template
    this.templates.set('salesforce', {
      id: 'salesforce',
      name: 'Salesforce CRM',
      description: 'Integrate with Salesforce for customer relationship management',
      provider: 'Salesforce',
      category: 'CRM',
      version: '1.0.0',
      configuration: {
        baseUrl: 'https://api.salesforce.com',
        version: 'v52.0',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        features: ['contacts', 'accounts', 'opportunities', 'cases']
      },
      authentication: {
        type: 'oauth2',
        scopes: ['api', 'refresh_token'],
        autoRefresh: true
      },
      dataMapping: {
        inbound: [
          { source: 'Name', target: 'name', type: 'string', required: true },
          { source: 'Email', target: 'email', type: 'string', required: true }
        ],
        outbound: [
          { source: 'name', target: 'Name', type: 'string', required: true },
          { source: 'email', target: 'Email', type: 'string', required: true }
        ],
        transformations: [],
        filters: []
      },
      syncSettings: {
        enabled: true,
        direction: 'bidirectional',
        frequency: 'interval',
        interval: 3600000, // 1 hour
        batchSize: 100,
        conflictResolution: 'source_wins',
        deltaSync: true,
        compressionEnabled: true
      },
      documentation: {
        setupGuide: 'https://developer.salesforce.com/docs',
        apiReference: 'https://developer.salesforce.com/docs/api-explorer',
        examples: []
      },
      requirements: ['Salesforce Developer Account', 'Connected App'],
      supportedFeatures: ['Real-time sync', 'Bulk operations', 'Custom fields']
    });

    // Microsoft Graph Template
    this.templates.set('microsoft-graph', {
      id: 'microsoft-graph',
      name: 'Microsoft Graph',
      description: 'Integrate with Microsoft 365 services',
      provider: 'Microsoft',
      category: 'Productivity',
      version: '1.0.0',
      configuration: {
        baseUrl: 'https://graph.microsoft.com',
        version: 'v1.0',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        features: ['users', 'calendar', 'mail', 'files']
      },
      authentication: {
        type: 'oauth2',
        scopes: ['User.Read', 'Calendars.ReadWrite', 'Mail.Send'],
        autoRefresh: true
      },
      dataMapping: {
        inbound: [],
        outbound: [],
        transformations: [],
        filters: []
      },
      syncSettings: {
        enabled: true,
        direction: 'outbound',
        frequency: 'realtime',
        batchSize: 50,
        conflictResolution: 'source_wins',
        deltaSync: true,
        compressionEnabled: false
      },
      documentation: {
        setupGuide: 'https://docs.microsoft.com/graph',
        apiReference: 'https://docs.microsoft.com/graph/api/overview',
        examples: []
      },
      requirements: ['Azure AD Application', 'Admin Consent'],
      supportedFeatures: ['Change notifications', 'Batch requests', 'Delta queries']
    });

    // Google Workspace Template
    this.templates.set('google-workspace', {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Integrate with Google Workspace applications',
      provider: 'Google',
      category: 'Productivity',
      version: '1.0.0',
      configuration: {
        baseUrl: 'https://www.googleapis.com',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        features: ['drive', 'calendar', 'gmail', 'contacts']
      },
      authentication: {
        type: 'oauth2',
        scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/calendar'],
        autoRefresh: true
      },
      dataMapping: {
        inbound: [],
        outbound: [],
        transformations: [],
        filters: []
      },
      syncSettings: {
        enabled: true,
        direction: 'bidirectional',
        frequency: 'interval',
        interval: 1800000, // 30 minutes
        batchSize: 100,
        conflictResolution: 'merge',
        deltaSync: true,
        compressionEnabled: false
      },
      documentation: {
        setupGuide: 'https://developers.google.com/workspace',
        apiReference: 'https://developers.google.com/workspace/reference',
        examples: []
      },
      requirements: ['Google Cloud Project', 'OAuth 2.0 Credentials'],
      supportedFeatures: ['Push notifications', 'Batch operations', 'Incremental sync']
    });
  }

  private setupEventListeners(): void {
    // Listen for integration events
    window.addEventListener('integrationRequest', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleIntegrationRequest(customEvent.detail);
    });

    // Listen for webhook events
    window.addEventListener('webhookReceived', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleWebhookEvent(customEvent.detail);
    });

    // Listen for sync requests
    window.addEventListener('syncRequested', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleSyncRequest(customEvent.detail);
    });
  }

  // Integration Management
  async createIntegration(config: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Integration> {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    if (!this.rbacService.hasPermission('integration.create')) {
      throw new Error('Insufficient permissions to create integration');
    }

    const integrationId = `integration-${Date.now()}`;
    const integration: Integration = {
      ...config,
      id: integrationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate configuration
    this.validateIntegrationConfig(integration);

    // Test connection
    if (integration.status === 'active') {
      const testResult = await this.testIntegrationConnection(integration);
      if (!testResult.success) {
        integration.status = 'error';
        integration.lastError = testResult.error;
      }
    }

    this.integrations.set(integrationId, integration);
    this.saveIntegrations();

    // Set up sync schedule if enabled
    if (integration.syncSettings.enabled && integration.syncSettings.frequency === 'interval') {
      this.setupSyncSchedule(integration);
    }

    // Set up health checks
    if (integration.monitoring.healthCheck.enabled) {
      this.setupHealthCheck(integration);
    }

    this.auditService.logAction('integration_created', {
      integrationId,
      name: integration.name,
      type: integration.type,
      provider: integration.provider
    });

    this.analyticsService.trackEvent('integration_created', {
      integrationId,
      type: integration.type,
      provider: integration.provider
    });

    return integration;
  }

  async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    if (!this.canManageIntegration(integration)) {
      throw new Error('Insufficient permissions to update integration');
    }

    // Apply updates
    Object.assign(integration, updates);
    integration.updatedAt = new Date();

    // Validate updated configuration
    this.validateIntegrationConfig(integration);

    // Update sync schedule if changed
    if (updates.syncSettings) {
      this.clearSyncSchedule(integration);
      if (integration.syncSettings.enabled && integration.syncSettings.frequency === 'interval') {
        this.setupSyncSchedule(integration);
      }
    }

    // Update health checks if changed
    if (updates.monitoring) {
      this.clearHealthCheck(integration);
      if (integration.monitoring.healthCheck.enabled) {
        this.setupHealthCheck(integration);
      }
    }

    this.integrations.set(integrationId, integration);
    this.saveIntegrations();

    this.auditService.logAction('integration_updated', {
      integrationId,
      changes: Object.keys(updates)
    });

    return integration;
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    if (!this.canManageIntegration(integration)) {
      throw new Error('Insufficient permissions to delete integration');
    }

    // Clear schedules
    this.clearSyncSchedule(integration);
    this.clearHealthCheck(integration);

    // Remove integration
    this.integrations.delete(integrationId);
    this.saveIntegrations();

    // Clean up related webhooks
    const relatedWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.integrationId === integrationId);
    
    relatedWebhooks.forEach(webhook => {
      this.webhooks.delete(webhook.id);
    });

    this.auditService.logAction('integration_deleted', {
      integrationId,
      name: integration.name
    });
  }

  // Webhook Management
  async createWebhook(config: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'totalDeliveries' | 'successfulDeliveries'>): Promise<WebhookEndpoint> {
    if (!this.rbacService.hasPermission('webhook.create')) {
      throw new Error('Insufficient permissions to create webhook');
    }

    const webhookId = `webhook-${Date.now()}`;
    const webhook: WebhookEndpoint = {
      ...config,
      id: webhookId,
      createdAt: new Date(),
      totalDeliveries: 0,
      successfulDeliveries: 0
    };

    this.webhooks.set(webhookId, webhook);
    this.saveWebhooks();

    this.auditService.logAction('webhook_created', {
      webhookId,
      name: webhook.name,
      url: webhook.url
    });

    return webhook;
  }

  async deliverWebhook(webhookId: string, event: string, payload: unknown): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || !webhook.active) {
      return false;
    }

    if (!webhook.events.includes(event)) {
      return false;
    }

    webhook.totalDeliveries++;
    webhook.lastTriggered = new Date();

    try {
      const success = await this.sendWebhookPayload(webhook, event, payload);
      if (success) {
        webhook.successfulDeliveries++;
      }
      
      this.webhooks.set(webhookId, webhook);
      this.saveWebhooks();
      
      return success;
    } catch (error) {
      console.error(`Webhook delivery failed: ${webhookId}`, error);
      return false;
    }
  }

  private async sendWebhookPayload(webhook: WebhookEndpoint, event: string, payload: unknown): Promise<boolean> {
    const webhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TinkyBink-AAC-Webhook/1.0',
      ...webhook.headers
    };

    // Add signature if validation is enabled
    if (webhook.signatureValidation && webhook.secret) {
      const signature = this.generateWebhookSignature(JSON.stringify(webhookPayload), webhook.secret);
      headers['X-TinkyBink-Signature'] = signature;
    }

    let attempt = 0;
    const maxAttempts = webhook.retryPolicy.enabled ? webhook.retryPolicy.maxAttempts : 1;

    while (attempt < maxAttempts) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload)
        });

        if (response.ok) {
          return true;
        }

        // Log error and retry if applicable
        console.warn(`Webhook delivery attempt ${attempt + 1} failed: ${response.status}`);
        
        if (attempt < maxAttempts - 1 && webhook.retryPolicy.enabled) {
          const delay = this.calculateRetryDelay(webhook.retryPolicy, attempt);
          await this.delay(delay);
        }

      } catch (error) {
        console.error(`Webhook delivery attempt ${attempt + 1} error:`, error);
        
        if (attempt < maxAttempts - 1 && webhook.retryPolicy.enabled) {
          const delay = this.calculateRetryDelay(webhook.retryPolicy, attempt);
          await this.delay(delay);
        }
      }

      attempt++;
    }

    return false;
  }

  private generateWebhookSignature(payload: string, secret: string): string {
    // Simple HMAC-SHA256 signature (in production, use crypto library)
    return `sha256=${Buffer.from(payload + secret).toString('base64')}`;
  }

  private calculateRetryDelay(retryPolicy: WebhookEndpoint['retryPolicy'], attempt: number): number {
    const { backoffStrategy, initialDelay } = retryPolicy;
    
    switch (backoffStrategy) {
      case 'fixed':
        return initialDelay;
      case 'linear':
        return initialDelay * (attempt + 1);
      case 'exponential':
        return initialDelay * Math.pow(2, attempt);
      default:
        return initialDelay;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API Connection Management
  async createAPIConnection(config: Omit<APIConnection, 'id' | 'createdAt' | 'status'>): Promise<APIConnection> {
    if (!this.rbacService.hasPermission('api.create')) {
      throw new Error('Insufficient permissions to create API connection');
    }

    const connectionId = `api-connection-${Date.now()}`;
    const connection: APIConnection = {
      ...config,
      id: connectionId,
      createdAt: new Date(),
      status: 'disconnected'
    };

    // Test connection
    try {
      await this.testAPIConnection(connection);
      connection.status = 'connected';
    } catch (error) {
      connection.status = 'error';
    }

    this.apiConnections.set(connectionId, connection);
    this.saveAPIConnections();

    // Set up rate limiter
    if (connection.rateLimiting.enabled) {
      this.setupRateLimiter(connection);
    }

    this.auditService.logAction('api_connection_created', {
      connectionId,
      name: connection.name,
      baseUrl: connection.baseUrl
    });

    return connection;
  }

  async callAPI(connectionId: string, endpointId: string, parameters?: Record<string, unknown>): Promise<unknown> {
    const connection = this.apiConnections.get(connectionId);
    if (!connection) {
      throw new Error(`API connection ${connectionId} not found`);
    }

    const endpoint = connection.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) {
      throw new Error(`API endpoint ${endpointId} not found`);
    }

    if (!this.canUseAPIConnection(connection)) {
      throw new Error('Insufficient permissions to use API connection');
    }

    // Check rate limiting
    if (connection.rateLimiting.enabled) {
      const rateLimiter = this.rateLimiters.get(connectionId);
      if (rateLimiter && !rateLimiter.canMakeRequest()) {
        throw new Error('Rate limit exceeded');
      }
    }

    // Check cache
    if (connection.caching.enabled && endpoint.method === 'GET') {
      const cacheKey = this.generateCacheKey(connection, endpoint, parameters);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const startTime = Date.now();
    
    try {
      const response = await this.executeAPICall(connection, endpoint, parameters);
      const duration = Date.now() - startTime;

      // Cache response if applicable
      if (connection.caching.enabled && endpoint.method === 'GET' && endpoint.cacheTtl) {
        const cacheKey = this.generateCacheKey(connection, endpoint, parameters);
        this.setCachedResponse(cacheKey, response, endpoint.cacheTtl);
      }

      // Update rate limiter
      if (connection.rateLimiting.enabled) {
        const rateLimiter = this.rateLimiters.get(connectionId);
        if (rateLimiter) {
          rateLimiter.recordRequest();
        }
      }

      // Log metrics
      if (connection.monitoring.trackMetrics) {
        this.recordAPIMetrics(connectionId, endpointId, duration, true);
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error metrics
      if (connection.monitoring.trackMetrics) {
        this.recordAPIMetrics(connectionId, endpointId, duration, false);
      }

      throw error;
    }
  }

  private async executeAPICall(connection: APIConnection, endpoint: APIEndpoint, parameters?: Record<string, unknown>): Promise<unknown> {
    let url = `${connection.baseUrl}${endpoint.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TinkyBink-AAC/1.0'
    };

    // Handle authentication
    await this.addAuthenticationHeaders(connection.authentication, headers);

    // Process parameters
    const { queryParams, pathParams, headerParams, bodyParams } = this.processParameters(endpoint.parameters || [], parameters || {});

    // Replace path parameters
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, String(value));
    });

    // Add query parameters
    if (Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    // Add header parameters
    Object.assign(headers, headerParams);

    // Prepare request options
    const requestOptions: RequestInit = {
      method: endpoint.method,
      headers
    };

    // Add body for non-GET requests
    if (endpoint.method !== 'GET' && Object.keys(bodyParams).length > 0) {
      requestOptions.body = JSON.stringify(bodyParams);
    }

    // Make request
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async addAuthenticationHeaders(auth: AuthConfig, headers: Record<string, string>): Promise<void> {
    switch (auth.type) {
      case 'api_key':
        if (auth.credentials.apiKey) {
          headers['Authorization'] = `Bearer ${auth.credentials.apiKey}`;
        }
        break;

      case 'basic':
        if (auth.credentials.username && auth.credentials.password) {
          const credentials = Buffer.from(`${auth.credentials.username}:${auth.credentials.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'oauth2':
        if (auth.credentials.accessToken) {
          headers['Authorization'] = `Bearer ${auth.credentials.accessToken}`;
        }
        // Check if token needs refresh
        if (auth.autoRefresh && auth.expiresAt && new Date() >= auth.expiresAt) {
          await this.refreshOAuthToken(auth);
          if (auth.credentials.accessToken) {
            headers['Authorization'] = `Bearer ${auth.credentials.accessToken}`;
          }
        }
        break;

      case 'jwt':
        if (auth.credentials.token) {
          headers['Authorization'] = `Bearer ${auth.credentials.token}`;
        }
        break;
    }
  }

  private async refreshOAuthToken(auth: AuthConfig): Promise<void> {
    if (!auth.refreshUrl || !auth.credentials.refreshToken) {
      throw new Error('Cannot refresh token: missing refresh URL or refresh token');
    }

    try {
      const response = await fetch(auth.refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: auth.credentials.refreshToken,
          client_id: auth.credentials.clientId || '',
          client_secret: auth.credentials.clientSecret || ''
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();
      auth.credentials.accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        auth.credentials.refreshToken = tokenData.refresh_token;
      }
      if (tokenData.expires_in) {
        auth.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      }

    } catch (error) {
      console.error('OAuth token refresh failed:', error);
      throw error;
    }
  }

  private processParameters(parameterDefs: Parameter[], values: Record<string, unknown>) {
    const queryParams: Record<string, unknown> = {};
    const pathParams: Record<string, unknown> = {};
    const headerParams: Record<string, string> = {};
    const bodyParams: Record<string, unknown> = {};

    parameterDefs.forEach(param => {
      const value = values[param.name] ?? param.defaultValue;
      
      if (param.required && value === undefined) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }

      if (value !== undefined) {
        switch (param.type) {
          case 'query':
            queryParams[param.name] = value;
            break;
          case 'path':
            pathParams[param.name] = value;
            break;
          case 'header':
            headerParams[param.name] = String(value);
            break;
          case 'body':
            bodyParams[param.name] = value;
            break;
        }
      }
    });

    return { queryParams, pathParams, headerParams, bodyParams };
  }

  // Sync Processing
  async triggerSync(integrationId: string, direction?: 'inbound' | 'outbound'): Promise<SyncEvent> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    if (!this.canManageIntegration(integration)) {
      throw new Error('Insufficient permissions to trigger sync');
    }

    if (integration.status !== 'active') {
      throw new Error('Integration is not active');
    }

    const syncDirection = direction || integration.syncSettings.direction;
    const eventId = `sync-${integrationId}-${Date.now()}`;
    
    const syncEvent: SyncEvent = {
      id: eventId,
      integrationId,
      timestamp: new Date(),
      type: 'sync_started',
      direction: syncDirection,
      duration: 0,
      status: 'success'
    };

    this.syncEvents.set(eventId, syncEvent);
    this.eventQueue.push(syncEvent);

    // Process sync asynchronously
    this.processSyncEvent(syncEvent).catch(error => {
      console.error(`Sync failed for integration ${integrationId}:`, error);
      syncEvent.status = 'failed';
      syncEvent.error = String(error);
    });

    return syncEvent;
  }

  private async processSyncEvent(syncEvent: SyncEvent): Promise<void> {
    const startTime = Date.now();
    const integration = this.integrations.get(syncEvent.integrationId);
    
    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      let recordsProcessed = 0;
      let recordsSucceeded = 0;
      let recordsFailed = 0;

      // Simulate data processing based on sync direction
      if (syncEvent.direction === 'inbound' || syncEvent.direction === 'bidirectional') {
        const inboundResult = await this.processInboundSync(integration);
        recordsProcessed += inboundResult.processed;
        recordsSucceeded += inboundResult.succeeded;
        recordsFailed += inboundResult.failed;
      }

      if (syncEvent.direction === 'outbound' || syncEvent.direction === 'bidirectional') {
        const outboundResult = await this.processOutboundSync(integration);
        recordsProcessed += outboundResult.processed;
        recordsSucceeded += outboundResult.succeeded;
        recordsFailed += outboundResult.failed;
      }

      // Update sync event
      syncEvent.type = 'sync_completed';
      syncEvent.recordsProcessed = recordsProcessed;
      syncEvent.recordsSucceeded = recordsSucceeded;
      syncEvent.recordsFailed = recordsFailed;
      syncEvent.duration = Date.now() - startTime;
      syncEvent.status = recordsFailed > 0 ? 'partial' : 'success';

      // Update integration
      integration.lastSync = new Date();
      integration.lastError = undefined;

    } catch (error) {
      syncEvent.type = 'sync_failed';
      syncEvent.duration = Date.now() - startTime;
      syncEvent.status = 'failed';
      syncEvent.error = String(error);

      integration.lastError = String(error);
    }

    this.syncEvents.set(syncEvent.id, syncEvent);
    this.integrations.set(integration.id, integration);
    
    this.analyticsService.trackEvent('sync_completed', {
      integrationId: integration.id,
      direction: syncEvent.direction,
      status: syncEvent.status,
      duration: syncEvent.duration,
      recordsProcessed: syncEvent.recordsProcessed
    });
  }

  private async processInboundSync(integration: Integration): Promise<{ processed: number; succeeded: number; failed: number }> {
    // Simulate inbound data processing
    const batchSize = integration.syncSettings.batchSize;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Process data in batches
    for (let i = 0; i < batchSize; i++) {
      try {
        // Simulate processing a record
        await this.delay(10); // Simulate processing time
        processed++;
        succeeded++;
      } catch (error) {
        processed++;
        failed++;
      }
    }

    return { processed, succeeded, failed };
  }

  private async processOutboundSync(integration: Integration): Promise<{ processed: number; succeeded: number; failed: number }> {
    // Simulate outbound data processing
    const batchSize = integration.syncSettings.batchSize;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Process data in batches
    for (let i = 0; i < batchSize; i++) {
      try {
        // Simulate processing a record
        await this.delay(10); // Simulate processing time
        processed++;
        succeeded++;
      } catch (error) {
        processed++;
        failed++;
      }
    }

    return { processed, succeeded, failed };
  }

  // Sync Scheduling
  private setupSyncSchedule(integration: Integration): void {
    if (integration.syncSettings.frequency !== 'interval' || !integration.syncSettings.interval) {
      return;
    }

    const intervalId = setInterval(() => {
      this.triggerSync(integration.id).catch(error => {
        console.error(`Scheduled sync failed for integration ${integration.id}:`, error);
      });
    }, integration.syncSettings.interval);

    this.syncIntervals.set(integration.id, intervalId);
  }

  private clearSyncSchedule(integration: Integration): void {
    const intervalId = this.syncIntervals.get(integration.id);
    if (intervalId) {
      clearInterval(intervalId);
      this.syncIntervals.delete(integration.id);
    }
  }

  // Health Checks
  private setupHealthCheck(integration: Integration): void {
    if (!integration.monitoring.healthCheck.enabled) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await this.performHealthCheck(integration);
      } catch (error) {
        console.error(`Health check failed for integration ${integration.id}:`, error);
      }
    }, integration.monitoring.healthCheck.interval);

    this.healthCheckIntervals.set(integration.id, intervalId);
  }

  private clearHealthCheck(integration: Integration): void {
    const intervalId = this.healthCheckIntervals.get(integration.id);
    if (intervalId) {
      clearInterval(intervalId);
      this.healthCheckIntervals.delete(integration.id);
    }
  }

  private async performHealthCheck(integration: Integration): Promise<void> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.testIntegrationConnection(integration);
      const duration = Date.now() - startTime;

      const healthEvent: SyncEvent = {
        id: `health-${integration.id}-${Date.now()}`,
        integrationId: integration.id,
        timestamp: new Date(),
        type: 'health_check',
        duration,
        status: isHealthy.success ? 'success' : 'failed',
        error: isHealthy.error
      };

      this.syncEvents.set(healthEvent.id, healthEvent);

      // Update integration status
      if (isHealthy.success && integration.status === 'error') {
        integration.status = 'active';
        integration.lastError = undefined;
      } else if (!isHealthy.success && integration.status === 'active') {
        integration.status = 'error';
        integration.lastError = isHealthy.error;
      }

      this.integrations.set(integration.id, integration);

    } catch (error) {
      console.error(`Health check error for integration ${integration.id}:`, error);
    }
  }

  private async testIntegrationConnection(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate connection test based on integration type
      switch (integration.type) {
        case 'api':
          return await this.testAPIIntegration(integration);
        case 'database':
          return await this.testDatabaseIntegration(integration);
        case 'webhook':
          return { success: true }; // Webhooks are passive
        default:
          return { success: true };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async testAPIIntegration(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const testUrl = integration.configuration.baseUrl || 'https://httpbin.org/status/200';
      const response = await fetch(testUrl, {
        method: 'GET',
        timeout: integration.configuration.timeout
      });
      
      return { success: response.ok };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async testDatabaseIntegration(integration: Integration): Promise<{ success: boolean; error?: string }> {
    // Simulate database connection test
    return { success: true };
  }

  private async testAPIConnection(connection: APIConnection): Promise<void> {
    // Simple connection test
    const response = await fetch(connection.baseUrl, {
      method: 'HEAD'
    });
    
    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.status}`);
    }
  }

  // Rate Limiting
  private setupRateLimiter(connection: APIConnection): void {
    const rateLimiter = new RateLimiter(
      connection.rateLimiting.requests,
      connection.rateLimiting.window,
      connection.rateLimiting.strategy
    );
    
    this.rateLimiters.set(connection.id, rateLimiter);
  }

  // Caching
  private generateCacheKey(connection: APIConnection, endpoint: APIEndpoint, parameters?: Record<string, unknown>): string {
    const baseKey = `${connection.id}:${endpoint.id}`;
    
    if (connection.caching.keyGeneration === 'custom' && connection.caching.varyBy) {
      const varyValues = connection.caching.varyBy
        .map(key => parameters?.[key] || '')
        .join(':');
      return `${baseKey}:${varyValues}`;
    }
    
    return `${baseKey}:${JSON.stringify(parameters || {})}`;
  }

  private getCachedResponse(cacheKey: string): unknown | null {
    const cached = this.dataService.getData(`api_cache_${cacheKey}`);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCachedResponse(cacheKey: string, data: unknown, ttl: number): void {
    this.dataService.setData(`api_cache_${cacheKey}`, {
      data,
      expiresAt: Date.now() + ttl * 1000
    });
  }

  // Metrics
  private recordAPIMetrics(connectionId: string, endpointId: string, duration: number, success: boolean): void {
    const metricsKey = `api_metrics_${connectionId}_${endpointId}`;
    const existing = this.dataService.getData(metricsKey) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      avgDuration: 0
    };

    existing.totalRequests++;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.totalRequests;

    if (success) {
      existing.successfulRequests++;
    } else {
      existing.failedRequests++;
    }

    this.dataService.setData(metricsKey, existing);
  }

  // Event Processing
  private startEventProcessor(): void {
    setInterval(() => {
      this.processEventQueue();
    }, 1000); // Process every second
  }

  private startSyncProcessors(): void {
    // Start scheduled sync processors
    Array.from(this.integrations.values())
      .filter(integration => integration.syncSettings.enabled && integration.syncSettings.frequency === 'interval')
      .forEach(integration => {
        this.setupSyncSchedule(integration);
      });
  }

  private startHealthChecks(): void {
    // Start health check processors
    Array.from(this.integrations.values())
      .filter(integration => integration.monitoring.healthCheck.enabled)
      .forEach(integration => {
        this.setupHealthCheck(integration);
      });
  }

  private processEventQueue(): void {
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const event = this.eventQueue.shift();
      if (event && event.type === 'sync_started') {
        // Event is already being processed by processSyncEvent
      }
    } catch (error) {
      console.error('Event processing error:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Event Handlers
  private handleIntegrationRequest(detail: { action: string; integrationId?: string }): void {
    console.log('Integration request received:', detail);
    
    if (detail.action === 'sync' && detail.integrationId) {
      this.triggerSync(detail.integrationId).catch(console.error);
    }
  }

  private handleWebhookEvent(detail: { webhookId: string; event: string; payload: unknown }): void {
    console.log('Webhook event received:', detail);
    
    this.deliverWebhook(detail.webhookId, detail.event, detail.payload).catch(console.error);
  }

  private handleSyncRequest(detail: { integrationId: string; direction?: string }): void {
    console.log('Sync request received:', detail);
    
    this.triggerSync(detail.integrationId, detail.direction as 'inbound' | 'outbound').catch(console.error);
  }

  // Validation
  private validateIntegrationConfig(integration: Integration): void {
    if (!integration.name || integration.name.trim().length === 0) {
      throw new Error('Integration name is required');
    }

    if (!integration.provider || integration.provider.trim().length === 0) {
      throw new Error('Integration provider is required');
    }

    if (integration.type === 'api' && !integration.configuration.baseUrl) {
      throw new Error('Base URL is required for API integrations');
    }

    if (integration.syncSettings.enabled && integration.syncSettings.frequency === 'interval' && !integration.syncSettings.interval) {
      throw new Error('Sync interval is required when using interval-based sync');
    }
  }

  // Permission Checks
  private canManageIntegration(integration: Integration): boolean {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) return false;

    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant || integration.tenantId !== tenant.id) return false;

    return this.rbacService.hasPermission('integration.manage') ||
           this.rbacService.hasRole('admin') ||
           this.rbacService.hasRole('super-admin');
  }

  private canUseAPIConnection(connection: APIConnection): boolean {
    const currentUser = this.rbacService.getCurrentUser();
    if (!currentUser) return false;

    const tenant = this.multiTenantService.getCurrentTenant();
    if (!tenant || connection.tenantId !== tenant.id) return false;

    return this.rbacService.hasPermission('api.use') ||
           this.rbacService.hasRole('admin') ||
           this.rbacService.hasRole('super-admin');
  }

  // Data Persistence
  private loadIntegrations(): void {
    const saved = this.dataService.getData('integrations');
    if (saved) {
      Object.entries(saved).forEach(([id, data]) => {
        const integration = data as Integration;
        integration.createdAt = new Date(integration.createdAt);
        integration.updatedAt = new Date(integration.updatedAt);
        if (integration.lastSync) {
          integration.lastSync = new Date(integration.lastSync);
        }
        if (integration.authentication.expiresAt) {
          integration.authentication.expiresAt = new Date(integration.authentication.expiresAt);
        }
        
        this.integrations.set(id, integration);
      });
    }
  }

  private saveIntegrations(): void {
    const integrationsData: Record<string, Integration> = {};
    this.integrations.forEach((integration, id) => {
      integrationsData[id] = integration;
    });
    this.dataService.setData('integrations', integrationsData);
  }

  private loadWebhooks(): void {
    const saved = this.dataService.getData('webhooks');
    if (saved) {
      Object.entries(saved).forEach(([id, data]) => {
        const webhook = data as WebhookEndpoint;
        webhook.createdAt = new Date(webhook.createdAt);
        if (webhook.lastTriggered) {
          webhook.lastTriggered = new Date(webhook.lastTriggered);
        }
        
        this.webhooks.set(id, webhook);
      });
    }
  }

  private saveWebhooks(): void {
    const webhooksData: Record<string, WebhookEndpoint> = {};
    this.webhooks.forEach((webhook, id) => {
      webhooksData[id] = webhook;
    });
    this.dataService.setData('webhooks', webhooksData);
  }

  private loadAPIConnections(): void {
    const saved = this.dataService.getData('api_connections');
    if (saved) {
      Object.entries(saved).forEach(([id, data]) => {
        const connection = data as APIConnection;
        connection.createdAt = new Date(connection.createdAt);
        if (connection.authentication.expiresAt) {
          connection.authentication.expiresAt = new Date(connection.authentication.expiresAt);
        }
        
        this.apiConnections.set(id, connection);
      });
    }
  }

  private saveAPIConnections(): void {
    const connectionsData: Record<string, APIConnection> = {};
    this.apiConnections.forEach((connection, id) => {
      connectionsData[id] = connection;
    });
    this.dataService.setData('api_connections', connectionsData);
  }

  // Public API
  getIntegrations(tenantId?: string): Integration[] {
    const currentTenant = tenantId || this.multiTenantService.getCurrentTenant()?.id;
    if (!currentTenant) return [];

    return Array.from(this.integrations.values())
      .filter(integration => integration.tenantId === currentTenant)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getIntegration(integrationId: string): Integration | null {
    const integration = this.integrations.get(integrationId);
    if (!integration || !this.canManageIntegration(integration)) {
      return null;
    }
    return integration;
  }

  getIntegrationTemplates(): IntegrationTemplate[] {
    return Array.from(this.templates.values());
  }

  getWebhooks(tenantId?: string): WebhookEndpoint[] {
    const currentTenant = tenantId || this.multiTenantService.getCurrentTenant()?.id;
    if (!currentTenant) return [];

    return Array.from(this.webhooks.values())
      .filter(webhook => webhook.tenantId === currentTenant)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getAPIConnections(tenantId?: string): APIConnection[] {
    const currentTenant = tenantId || this.multiTenantService.getCurrentTenant()?.id;
    if (!currentTenant) return [];

    return Array.from(this.apiConnections.values())
      .filter(connection => connection.tenantId === currentTenant)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getSyncEvents(integrationId?: string, limit: number = 50): SyncEvent[] {
    let events = Array.from(this.syncEvents.values());
    
    if (integrationId) {
      events = events.filter(event => event.integrationId === integrationId);
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Cleanup
  destroy(): void {
    // Clear all intervals
    this.syncIntervals.forEach(intervalId => clearInterval(intervalId));
    this.healthCheckIntervals.forEach(intervalId => clearInterval(intervalId));
    
    this.syncIntervals.clear();
    this.healthCheckIntervals.clear();
    this.rateLimiters.clear();

    // Save data
    this.saveIntegrations();
    this.saveWebhooks();
    this.saveAPIConnections();
  }
}

// Simple Rate Limiter Implementation
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  private strategy: string;

  constructor(maxRequests: number, windowMs: number, strategy: string = 'sliding_window') {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.strategy = strategy;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.cleanupOldRequests(now);
    
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  private cleanupOldRequests(now: number): void {
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > cutoff);
  }
}

export function getEnterpriseIntegrationService(): EnterpriseIntegrationService {
  return EnterpriseIntegrationService.getInstance();
}