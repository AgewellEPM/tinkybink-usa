// API Integration Service - Module 43
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getCloudSyncService } from '../communication/cloud-sync-service';

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  auth?: {
    type: 'none' | 'bearer' | 'api-key' | 'oauth2' | 'basic';
    credentials?: string;
  };
  rateLimit?: {
    requests: number;
    period: number; // in seconds
  };
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  active: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
}

interface APIMapping {
  id: string;
  source: string;
  target: string;
  transform?: (data: any) => any;
  validate?: (data: any) => boolean;
}

interface IntegrationProvider {
  id: string;
  name: string;
  type: 'healthcare' | 'education' | 'communication' | 'analytics' | 'storage';
  endpoints: Map<string, APIEndpoint>;
  mappings: APIMapping[];
  webhooks: WebhookConfig[];
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
}

export class APIIntegrationService {
  private static instance: APIIntegrationService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private cloudSyncService = getCloudSyncService();
  
  private providers: Map<string, IntegrationProvider> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();
  private webhookQueue: Map<string, any[]> = new Map();
  private apiCache: Map<string, { data: any; expires: number }> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): APIIntegrationService {
    if (!APIIntegrationService.instance) {
      APIIntegrationService.instance = new APIIntegrationService();
    }
    return APIIntegrationService.instance;
  }

  initialize(): void {
    console.log('APIIntegrationService initializing...');
    this.loadProviderConfigs();
    this.setupWebhookListeners();
    this.startHealthChecks();
    console.log('APIIntegrationService initialized');
  }

  private initializeProviders(): void {
    // Healthcare providers
    this.registerProvider({
      id: 'epic-fhir',
      name: 'Epic FHIR Integration',
      type: 'healthcare',
      endpoints: new Map([
        ['patient', {
          id: 'epic-patient',
          name: 'Patient API',
          url: 'https://api.epic.com/fhir/r4/Patient',
          method: 'GET',
          auth: { type: 'oauth2' },
          rateLimit: { requests: 100, period: 60 }
        }],
        ['observation', {
          id: 'epic-observation',
          name: 'Observation API',
          url: 'https://api.epic.com/fhir/r4/Observation',
          method: 'GET',
          auth: { type: 'oauth2' },
          rateLimit: { requests: 100, period: 60 }
        }]
      ]),
      mappings: [
        {
          id: 'patient-mapping',
          source: 'fhir.patient',
          target: 'tinkybink.user',
          transform: this.transformFHIRPatient.bind(this)
        }
      ],
      webhooks: [],
      status: 'disconnected'
    });

    // Education providers
    this.registerProvider({
      id: 'clever-api',
      name: 'Clever School Integration',
      type: 'education',
      endpoints: new Map([
        ['students', {
          id: 'clever-students',
          name: 'Students API',
          url: 'https://api.clever.com/v2.1/students',
          method: 'GET',
          auth: { type: 'bearer' },
          rateLimit: { requests: 120, period: 60 }
        }],
        ['sections', {
          id: 'clever-sections',
          name: 'Sections API',
          url: 'https://api.clever.com/v2.1/sections',
          method: 'GET',
          auth: { type: 'bearer' },
          rateLimit: { requests: 120, period: 60 }
        }]
      ]),
      mappings: [
        {
          id: 'student-mapping',
          source: 'clever.student',
          target: 'tinkybink.learner',
          transform: this.transformCleverStudent.bind(this)
        }
      ],
      webhooks: [
        {
          id: 'clever-events',
          name: 'Clever Event Webhook',
          url: '/api/webhooks/clever',
          events: ['students.created', 'students.updated'],
          active: false,
          retryOnFailure: true,
          maxRetries: 3
        }
      ],
      status: 'disconnected'
    });

    // Communication providers
    this.registerProvider({
      id: 'twilio-api',
      name: 'Twilio Communication',
      type: 'communication',
      endpoints: new Map([
        ['sms', {
          id: 'twilio-sms',
          name: 'SMS API',
          url: 'https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json',
          method: 'POST',
          auth: { type: 'basic' },
          rateLimit: { requests: 100, period: 1 }
        }],
        ['voice', {
          id: 'twilio-voice',
          name: 'Voice API',
          url: 'https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Calls.json',
          method: 'POST',
          auth: { type: 'basic' },
          rateLimit: { requests: 100, period: 1 }
        }]
      ]),
      mappings: [],
      webhooks: [
        {
          id: 'twilio-status',
          name: 'Message Status Webhook',
          url: '/api/webhooks/twilio/status',
          events: ['sms.delivered', 'sms.failed'],
          active: false,
          retryOnFailure: false,
          maxRetries: 0
        }
      ],
      status: 'disconnected'
    });

    // Analytics providers
    this.registerProvider({
      id: 'google-analytics',
      name: 'Google Analytics',
      type: 'analytics',
      endpoints: new Map([
        ['events', {
          id: 'ga-events',
          name: 'Events API',
          url: 'https://www.google-analytics.com/mp/collect',
          method: 'POST',
          auth: { type: 'api-key' },
          rateLimit: { requests: 60, period: 1 }
        }],
        ['reports', {
          id: 'ga-reports',
          name: 'Reporting API',
          url: 'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
          method: 'POST',
          auth: { type: 'oauth2' },
          rateLimit: { requests: 100, period: 100 }
        }]
      ]),
      mappings: [
        {
          id: 'event-mapping',
          source: 'tinkybink.event',
          target: 'ga.event',
          transform: this.transformToGAEvent.bind(this)
        }
      ],
      webhooks: [],
      status: 'disconnected'
    });

    // Storage providers
    this.registerProvider({
      id: 's3-storage',
      name: 'AWS S3 Storage',
      type: 'storage',
      endpoints: new Map([
        ['upload', {
          id: 's3-upload',
          name: 'Upload API',
          url: 'https://s3.amazonaws.com/{bucket}',
          method: 'PUT',
          auth: { type: 'bearer' },
          timeout: 300000 // 5 minutes for large files
        }],
        ['download', {
          id: 's3-download',
          name: 'Download API',
          url: 'https://s3.amazonaws.com/{bucket}/{key}',
          method: 'GET',
          auth: { type: 'bearer' }
        }]
      ]),
      mappings: [],
      webhooks: [],
      status: 'disconnected'
    });
  }

  private registerProvider(provider: IntegrationProvider): void {
    this.providers.set(provider.id, provider);
  }

  // Connection management
  async connectProvider(providerId: string, credentials: any): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      // Validate credentials based on auth type
      const isValid = await this.validateCredentials(provider, credentials);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Store encrypted credentials
      await this.storeCredentials(providerId, credentials);

      // Test connection
      const testEndpoint = provider.endpoints.values().next().value;
      if (testEndpoint) {
        await this.callAPI(providerId, testEndpoint.id, {});
      }

      provider.status = 'connected';
      provider.lastSync = new Date();

      // Enable webhooks if configured
      if (provider.webhooks.length > 0) {
        await this.enableWebhooks(providerId);
      }

      this.analyticsService.trackEvent('api_provider_connected', {
        provider: providerId,
        type: provider.type
      });

      return true;
    } catch (error) {
      console.error(`Failed to connect provider ${providerId}:`, error);
      provider.status = 'error';
      return false;
    }
  }

  async disconnectProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    // Disable webhooks
    await this.disableWebhooks(providerId);

    // Clear stored credentials
    await this.clearCredentials(providerId);

    // Clear cache
    this.clearProviderCache(providerId);

    provider.status = 'disconnected';
    provider.lastSync = undefined;

    this.analyticsService.trackEvent('api_provider_disconnected', {
      provider: providerId
    });
  }

  // API calling
  async callAPI(providerId: string, endpointId: string, params: any): Promise<any> {
    const provider = this.providers.get(providerId);
    if (!provider || provider.status !== 'connected') {
      throw new Error(`Provider ${providerId} not connected`);
    }

    const endpoint = provider.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    // Check rate limits
    if (!this.checkRateLimit(providerId, endpointId)) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = this.getCacheKey(providerId, endpointId, params);
    const cached = this.apiCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      // Build request
      const request = await this.buildRequest(provider, endpoint, params);

      // Make API call with retry logic
      const response = await this.executeWithRetry(
        () => fetch(request.url, request.options),
        endpoint.retryPolicy
      );

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Apply transformations
      const transformed = this.applyMappings(provider, data);

      // Cache response
      if (endpoint.method === 'GET') {
        this.apiCache.set(cacheKey, {
          data: transformed,
          expires: Date.now() + (60 * 1000) // 1 minute cache
        });
      }

      // Track usage
      this.trackAPIUsage(providerId, endpointId, true);

      return transformed;
    } catch (error) {
      this.trackAPIUsage(providerId, endpointId, false);
      throw error;
    }
  }

  // Webhook handling
  async handleWebhook(providerId: string, webhookId: string, data: any): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    const webhook = provider.webhooks.find(w => w.id === webhookId);
    if (!webhook || !webhook.active) return;

    // Verify webhook signature if configured
    if (webhook.secret) {
      const isValid = await this.verifyWebhookSignature(data, webhook.secret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return;
      }
    }

    // Queue webhook for processing
    if (!this.webhookQueue.has(webhookId)) {
      this.webhookQueue.set(webhookId, []);
    }
    this.webhookQueue.get(webhookId)!.push(data);

    // Process webhook
    await this.processWebhook(providerId, webhookId, data);
  }

  private async processWebhook(providerId: string, webhookId: string, data: any): Promise<void> {
    try {
      // Apply provider-specific processing
      switch (providerId) {
        case 'clever-api':
          await this.processCleverWebhook(data);
          break;
        case 'twilio-api':
          await this.processTwilioWebhook(data);
          break;
        default:
          // Generic webhook processing
          await this.processGenericWebhook(providerId, data);
      }

      this.analyticsService.trackEvent('webhook_processed', {
        provider: providerId,
        webhook: webhookId
      });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      
      // Retry if configured
      const provider = this.providers.get(providerId);
      const webhook = provider?.webhooks.find(w => w.id === webhookId);
      if (webhook?.retryOnFailure) {
        await this.retryWebhook(providerId, webhookId, data, webhook.maxRetries);
      }
    }
  }

  // Data synchronization
  async syncProviderData(providerId: string, options?: {
    full?: boolean;
    since?: Date;
    entities?: string[];
  }): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider || provider.status !== 'connected') {
      throw new Error(`Provider ${providerId} not available for sync`);
    }

    console.log(`Starting sync for provider ${providerId}`);

    try {
      const syncStartTime = Date.now();
      let syncedCount = 0;

      // Determine what to sync
      const entitiesToSync = options?.entities || Array.from(provider.endpoints.keys());
      
      for (const entity of entitiesToSync) {
        const endpoint = provider.endpoints.get(entity);
        if (!endpoint || endpoint.method !== 'GET') continue;

        // Build sync parameters
        const params = this.buildSyncParams(provider, entity, options);

        // Fetch data
        const data = await this.callAPI(providerId, endpoint.id, params);

        // Process and store synced data
        const processed = await this.processSyncedData(provider, entity, data);
        syncedCount += processed;
      }

      provider.lastSync = new Date();

      // Update sync status
      await this.cloudSyncService.updateSyncStatus({
        providerId,
        lastSync: provider.lastSync,
        itemsSynced: syncedCount,
        duration: Date.now() - syncStartTime
      });

      this.analyticsService.trackEvent('provider_sync_completed', {
        provider: providerId,
        itemsSynced: syncedCount,
        duration: Date.now() - syncStartTime
      });
    } catch (error) {
      console.error(`Sync failed for provider ${providerId}:`, error);
      throw error;
    }
  }

  // Batch operations
  async batchAPICall(providerId: string, operations: Array<{
    endpoint: string;
    params: any;
  }>): Promise<any[]> {
    const provider = this.providers.get(providerId);
    if (!provider || provider.status !== 'connected') {
      throw new Error(`Provider ${providerId} not connected`);
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Execute in parallel with concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < operations.length; i += concurrencyLimit) {
      const batch = operations.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.allSettled(
        batch.map(op => this.callAPI(providerId, op.endpoint, op.params))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            operation: batch[index],
            error: result.reason
          });
        }
      });
    }

    if (errors.length > 0) {
      console.error(`Batch API call had ${errors.length} errors`);
    }

    return results;
  }

  // Helper methods
  private async validateCredentials(provider: IntegrationProvider, credentials: any): Promise<boolean> {
    // Implement provider-specific validation
    switch (provider.auth?.type) {
      case 'oauth2':
        return !!(credentials.accessToken || credentials.clientId && credentials.clientSecret);
      case 'bearer':
        return !!credentials.token;
      case 'api-key':
        return !!credentials.apiKey;
      case 'basic':
        return !!(credentials.username && credentials.password);
      default:
        return true;
    }
  }

  private async storeCredentials(providerId: string, credentials: any): Promise<void> {
    // Encrypt and store credentials
    const encrypted = await this.encryptData(credentials);
    this.dataService.setData(`api_credentials_${providerId}`, encrypted);
  }

  private async clearCredentials(providerId: string): Promise<void> {
    this.dataService.setData(`api_credentials_${providerId}`, null);
  }

  private async getCredentials(providerId: string): Promise<any> {
    const encrypted = this.dataService.getData(`api_credentials_${providerId}`);
    if (!encrypted) return null;
    return await this.decryptData(encrypted);
  }

  private async encryptData(data: any): Promise<string> {
    // Implement encryption (simplified for demo)
    return btoa(JSON.stringify(data));
  }

  private async decryptData(encrypted: string): Promise<any> {
    // Implement decryption (simplified for demo)
    return JSON.parse(atob(encrypted));
  }

  private checkRateLimit(providerId: string, endpointId: string): boolean {
    const key = `${providerId}:${endpointId}`;
    const limiter = this.rateLimiters.get(key);
    const now = Date.now();

    const provider = this.providers.get(providerId);
    const endpoint = provider?.endpoints.get(endpointId);
    const rateLimit = endpoint?.rateLimit;

    if (!rateLimit) return true;

    if (!limiter || limiter.resetTime < now) {
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + (rateLimit.period * 1000)
      });
      return true;
    }

    if (limiter.count < rateLimit.requests) {
      limiter.count++;
      return true;
    }

    return false;
  }

  private getCacheKey(providerId: string, endpointId: string, params: any): string {
    return `${providerId}:${endpointId}:${JSON.stringify(params)}`;
  }

  private clearProviderCache(providerId: string): void {
    const keysToDelete: string[] = [];
    this.apiCache.forEach((value, key) => {
      if (key.startsWith(`${providerId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.apiCache.delete(key));
  }

  private async buildRequest(provider: IntegrationProvider, endpoint: APIEndpoint, params: any): Promise<{
    url: string;
    options: RequestInit;
  }> {
    let url = endpoint.url;
    const credentials = await this.getCredentials(provider.id);

    // Replace URL parameters
    Object.keys(params.urlParams || {}).forEach(key => {
      url = url.replace(`{${key}}`, params.urlParams[key]);
    });

    // Add query parameters for GET requests
    if (endpoint.method === 'GET' && params.query) {
      const queryString = new URLSearchParams(params.query).toString();
      url += `?${queryString}`;
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...endpoint.headers
    };

    // Add authentication
    switch (provider.auth?.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${credentials.token || credentials.accessToken}`;
        break;
      case 'api-key':
        headers['X-API-Key'] = credentials.apiKey;
        break;
      case 'basic':
        const auth = btoa(`${credentials.username}:${credentials.password}`);
        headers['Authorization'] = `Basic ${auth}`;
        break;
    }

    // Build request options
    const options: RequestInit = {
      method: endpoint.method,
      headers,
      ...(endpoint.timeout && { signal: AbortSignal.timeout(endpoint.timeout) })
    };

    // Add body for non-GET requests
    if (endpoint.method !== 'GET' && params.body) {
      options.body = JSON.stringify(params.body);
    }

    return { url, options };
  }

  private async executeWithRetry(
    fn: () => Promise<Response>,
    retryPolicy?: { maxRetries: number; backoffMultiplier: number }
  ): Promise<Response> {
    const policy = retryPolicy || { maxRetries: 3, backoffMultiplier: 2 };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < policy.maxRetries) {
          const delay = Math.pow(policy.backoffMultiplier, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private applyMappings(provider: IntegrationProvider, data: any): any {
    if (!provider.mappings.length) return data;

    let transformed = data;
    provider.mappings.forEach(mapping => {
      if (mapping.validate && !mapping.validate(transformed)) {
        console.warn(`Validation failed for mapping ${mapping.id}`);
        return;
      }

      if (mapping.transform) {
        transformed = mapping.transform(transformed);
      }
    });

    return transformed;
  }

  // Transform functions
  private transformFHIRPatient(fhirData: any): any {
    return {
      id: fhirData.id,
      name: `${fhirData.name?.[0]?.given?.[0]} ${fhirData.name?.[0]?.family}`,
      birthDate: fhirData.birthDate,
      gender: fhirData.gender,
      contact: fhirData.telecom?.[0]?.value
    };
  }

  private transformCleverStudent(cleverData: any): any {
    return {
      id: cleverData.id,
      name: `${cleverData.name.first} ${cleverData.name.last}`,
      grade: cleverData.grade,
      school: cleverData.school,
      email: cleverData.email
    };
  }

  private transformToGAEvent(tinkybinkEvent: any): any {
    return {
      name: tinkybinkEvent.name,
      params: {
        category: tinkybinkEvent.category,
        label: tinkybinkEvent.label,
        value: tinkybinkEvent.value,
        user_id: tinkybinkEvent.userId,
        session_id: tinkybinkEvent.sessionId
      }
    };
  }

  // Webhook processing functions
  private async processCleverWebhook(data: any): Promise<void> {
    if (data.type === 'students.created' || data.type === 'students.updated') {
      // Sync the updated student data
      await this.syncProviderData('clever-api', {
        entities: ['students'],
        since: new Date(Date.now() - 3600000) // Last hour
      });
    }
  }

  private async processTwilioWebhook(data: any): Promise<void> {
    if (data.MessageStatus) {
      // Update message status in local database
      this.dataService.setData(`sms_status_${data.MessageSid}`, data.MessageStatus);
      
      // Notify UI of status update
      window.dispatchEvent(new CustomEvent('smsStatusUpdate', {
        detail: {
          messageId: data.MessageSid,
          status: data.MessageStatus
        }
      }));
    }
  }

  private async processGenericWebhook(providerId: string, data: any): Promise<void> {
    // Store webhook data for processing
    const webhookData = {
      providerId,
      data,
      receivedAt: new Date().toISOString()
    };

    // Queue for processing
    const queue = this.dataService.getData('webhook_queue') || [];
    queue.push(webhookData);
    this.dataService.setData('webhook_queue', queue);

    // Trigger sync if needed
    if (data.requiresSync) {
      await this.syncProviderData(providerId);
    }
  }

  private async verifyWebhookSignature(data: any, secret: string): Promise<boolean> {
    // Implement webhook signature verification
    // This is provider-specific
    return true; // Simplified for demo
  }

  private async retryWebhook(providerId: string, webhookId: string, data: any, maxRetries: number): Promise<void> {
    const retryCount = data._retryCount || 0;
    if (retryCount >= maxRetries) {
      console.error(`Max retries reached for webhook ${webhookId}`);
      return;
    }

    // Schedule retry with exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    setTimeout(() => {
      this.processWebhook(providerId, webhookId, {
        ...data,
        _retryCount: retryCount + 1
      });
    }, delay);
  }

  private async enableWebhooks(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    for (const webhook of provider.webhooks) {
      webhook.active = true;
      // In a real implementation, register webhook URL with provider
    }
  }

  private async disableWebhooks(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    for (const webhook of provider.webhooks) {
      webhook.active = false;
      // In a real implementation, unregister webhook URL with provider
    }
  }

  private buildSyncParams(provider: IntegrationProvider, entity: string, options?: any): any {
    const params: any = { query: {} };

    if (options?.since) {
      params.query.since = options.since.toISOString();
    }

    if (options?.full) {
      params.query.full = true;
    }

    // Provider-specific parameters
    switch (provider.id) {
      case 'clever-api':
        params.query.limit = 100;
        break;
      case 'epic-fhir':
        params.query._count = 50;
        break;
    }

    return params;
  }

  private async processSyncedData(provider: IntegrationProvider, entity: string, data: any): Promise<number> {
    let count = 0;
    const items = Array.isArray(data) ? data : data.entry || [data];

    for (const item of items) {
      // Apply transformations
      const transformed = this.applyMappings(provider, item);

      // Store in local database
      const key = `${provider.id}_${entity}_${item.id || count}`;
      this.dataService.setData(key, transformed);

      count++;
    }

    return count;
  }

  private trackAPIUsage(providerId: string, endpointId: string, success: boolean): void {
    const usage = this.dataService.getData('api_usage') || {};
    const key = `${providerId}_${endpointId}`;
    
    if (!usage[key]) {
      usage[key] = { calls: 0, successes: 0, failures: 0 };
    }

    usage[key].calls++;
    if (success) {
      usage[key].successes++;
    } else {
      usage[key].failures++;
    }

    this.dataService.setData('api_usage', usage);
  }

  private loadProviderConfigs(): void {
    const configs = this.dataService.getData('api_provider_configs') || {};
    Object.entries(configs).forEach(([id, config]: [string, any]) => {
      const provider = this.providers.get(id);
      if (provider) {
        Object.assign(provider, config);
      }
    });
  }

  private setupWebhookListeners(): void {
    // Setup global webhook endpoint listener
    window.addEventListener('webhookReceived', async (event: any) => {
      const { providerId, webhookId, data } = event.detail;
      await this.handleWebhook(providerId, webhookId, data);
    });
  }

  private startHealthChecks(): void {
    // Check provider health every 5 minutes
    setInterval(() => {
      this.providers.forEach(async (provider, id) => {
        if (provider.status === 'connected') {
          try {
            // Simple health check
            const testEndpoint = provider.endpoints.values().next().value;
            if (testEndpoint) {
              await this.callAPI(id, testEndpoint.id, { query: { limit: 1 } });
            }
          } catch (error) {
            console.error(`Health check failed for ${id}:`, error);
            provider.status = 'error';
          }
        }
      });
    }, 5 * 60 * 1000);
  }

  // Public API
  getProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }

  getConnectedProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.status === 'connected');
  }

  getProvider(providerId: string): IntegrationProvider | null {
    return this.providers.get(providerId) || null;
  }

  isProviderConnected(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    return provider?.status === 'connected' || false;
  }

  async getProviderStatus(providerId: string): Promise<{
    connected: boolean;
    lastSync?: Date;
    health: 'healthy' | 'degraded' | 'error';
  }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { connected: false, health: 'error' };
    }

    return {
      connected: provider.status === 'connected',
      lastSync: provider.lastSync,
      health: provider.status === 'connected' ? 'healthy' : 
              provider.status === 'error' ? 'error' : 'degraded'
    };
  }

  getWebhookUrl(providerId: string, webhookId: string): string {
    // In production, this would return the actual webhook URL
    return `${window.location.origin}/api/webhooks/${providerId}/${webhookId}`;
  }

  async testConnection(providerId: string): Promise<boolean> {
    try {
      const provider = this.providers.get(providerId);
      if (!provider || provider.status !== 'connected') return false;

      const testEndpoint = provider.endpoints.values().next().value;
      if (!testEndpoint) return false;

      await this.callAPI(providerId, testEndpoint.id, { query: { limit: 1 } });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export function getAPIIntegrationService(): APIIntegrationService {
  return APIIntegrationService.getInstance();
}