/**
 * Service Adapter
 * Module 42: Universal adapter for integrating external services and APIs
 */

interface ServiceConfig {
  id: string;
  name: string;
  type: 'rest' | 'graphql' | 'websocket' | 'custom';
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  transformers?: {
    request?: (data: any) => any;
    response?: (data: any) => any;
  };
}

interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

interface ServiceRequest {
  service: string;
  method: string;
  endpoint?: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: ServiceError;
  metadata?: {
    duration: number;
    retries: number;
    cached: boolean;
  };
}

interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

interface AdapterPlugin {
  id: string;
  name: string;
  service: string;
  hooks: {
    beforeRequest?: (request: ServiceRequest) => ServiceRequest | Promise<ServiceRequest>;
    afterResponse?: (response: ServiceResponse) => ServiceResponse | Promise<ServiceResponse>;
    onError?: (error: ServiceError) => void;
  };
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export class ServiceAdapter {
  private static instance: ServiceAdapter;
  private services: Map<string, ServiceConfig> = new Map();
  private plugins: Map<string, AdapterPlugin> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private activeRequests: Map<string, Promise<ServiceResponse>> = new Map();
  private metrics: Map<string, ServiceMetrics> = new Map();

  private constructor() {
    this.initializeDefaultServices();
  }

  static getInstance(): ServiceAdapter {
    if (!ServiceAdapter.instance) {
      ServiceAdapter.instance = new ServiceAdapter();
    }
    return ServiceAdapter.instance;
  }

  initialize(): void {
    console.log('🔌 Service Adapter ready - Universal service integration');
    this.setupCacheCleanup();
    this.loadServiceConfigs();
  }

  /**
   * Initialize default service configurations
   */
  private initializeDefaultServices(): void {
    // Speech synthesis service
    this.registerService({
      id: 'speech_synthesis',
      name: 'Speech Synthesis API',
      type: 'custom',
      baseUrl: 'internal://speech',
      transformers: {
        request: (data) => ({
          text: data.text,
          voice: data.voice || 'default',
          rate: data.rate || 1,
          pitch: data.pitch || 1
        })
      }
    });

    // Translation service
    this.registerService({
      id: 'translation',
      name: 'Translation API',
      type: 'rest',
      baseUrl: 'https://api.mymemory.translated.net',
      timeout: 10000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffMs: 5000
      },
      transformers: {
        request: (data) => ({
          q: data.text,
          langpair: `${data.from}|${data.to}`
        }),
        response: (data) => ({
          translatedText: data.responseData?.translatedText,
          match: data.responseData?.match
        })
      }
    });

    // Symbol database service
    this.registerService({
      id: 'symbol_search',
      name: 'Symbol Search API',
      type: 'rest',
      baseUrl: 'https://api.arasaac.org/api',
      headers: {
        'Accept': 'application/json'
      },
      transformers: {
        request: (data) => ({
          keywords: data.query,
          language: data.language || 'en'
        })
      }
    });

    // Analytics service
    this.registerService({
      id: 'analytics',
      name: 'Analytics API',
      type: 'rest',
      baseUrl: '/api/analytics',
      headers: {
        'Content-Type': 'application/json'
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 1.5,
        maxBackoffMs: 3000
      }
    });

    // WebRTC signaling service
    this.registerService({
      id: 'webrtc_signaling',
      name: 'WebRTC Signaling',
      type: 'websocket',
      baseUrl: 'wss://signaling.tinkybink.app',
      timeout: 30000
    });
  }

  /**
   * Register a new service
   */
  registerService(config: ServiceConfig): void {
    this.services.set(config.id, config);
    this.metrics.set(config.id, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastError: null
    });

    console.log(`📌 Registered service: ${config.name}`);
  }

  /**
   * Make a service request
   */
  async request(request: ServiceRequest): Promise<ServiceResponse> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(request);

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: {
          duration: 0,
          retries: 0,
          cached: true
        }
      };
    }

    // Check for duplicate requests
    const existingRequest = this.activeRequests.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Execute request
    const requestPromise = this.executeRequest(request, startTime);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      this.activeRequests.delete(cacheKey);
      return response;
    } catch (error) {
      this.activeRequests.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: AdapterPlugin): void {
    this.plugins.set(plugin.id, plugin);
    console.log(`🔧 Registered adapter plugin: ${plugin.name}`);
  }

  /**
   * Get service metrics
   */
  getMetrics(serviceId?: string): ServiceMetrics | Map<string, ServiceMetrics> {
    if (serviceId) {
      return this.metrics.get(serviceId) || this.createDefaultMetrics();
    }
    return new Map(this.metrics);
  }

  /**
   * Clear cache for a service
   */
  clearCache(serviceId?: string): void {
    if (serviceId) {
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(serviceId)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Update service configuration
   */
  updateService(serviceId: string, config: Partial<ServiceConfig>): boolean {
    const service = this.services.get(serviceId);
    if (!service) return false;

    this.services.set(serviceId, { ...service, ...config });
    return true;
  }

  /**
   * Create custom service wrapper
   */
  createServiceWrapper(serviceId: string): ServiceWrapper {
    const adapter = this;
    
    return {
      get: (endpoint: string, params?: any) => 
        adapter.request({ service: serviceId, method: 'GET', endpoint, params }),
      
      post: (endpoint: string, data?: any) => 
        adapter.request({ service: serviceId, method: 'POST', endpoint, data }),
      
      put: (endpoint: string, data?: any) => 
        adapter.request({ service: serviceId, method: 'PUT', endpoint, data }),
      
      delete: (endpoint: string) => 
        adapter.request({ service: serviceId, method: 'DELETE', endpoint }),
      
      custom: (method: string, endpoint: string, options?: any) => 
        adapter.request({ service: serviceId, method, endpoint, ...options })
    };
  }

  // Private helper methods
  private async executeRequest(request: ServiceRequest, startTime: number): Promise<ServiceResponse> {
    const service = this.services.get(request.service);
    if (!service) {
      return {
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: `Service ${request.service} not found`,
          retryable: false
        }
      };
    }

    // Apply plugins - beforeRequest
    let modifiedRequest = request;
    for (const plugin of this.plugins.values()) {
      if (plugin.service === request.service && plugin.hooks.beforeRequest) {
        modifiedRequest = await plugin.hooks.beforeRequest(modifiedRequest);
      }
    }

    // Transform request
    if (service.transformers?.request) {
      modifiedRequest.data = service.transformers.request(modifiedRequest.data);
    }

    let retries = 0;
    const maxRetries = service.retryPolicy?.maxRetries || 0;

    while (retries <= maxRetries) {
      try {
        let response: ServiceResponse;

        switch (service.type) {
          case 'rest':
            response = await this.executeRestRequest(service, modifiedRequest);
            break;
          case 'graphql':
            response = await this.executeGraphQLRequest(service, modifiedRequest);
            break;
          case 'websocket':
            response = await this.executeWebSocketRequest(service, modifiedRequest);
            break;
          case 'custom':
            response = await this.executeCustomRequest(service, modifiedRequest);
            break;
          default:
            throw new Error(`Unknown service type: ${service.type}`);
        }

        // Transform response
        if (service.transformers?.response && response.data) {
          response.data = service.transformers.response(response.data);
        }

        // Apply plugins - afterResponse
        for (const plugin of this.plugins.values()) {
          if (plugin.service === request.service && plugin.hooks.afterResponse) {
            response = await plugin.hooks.afterResponse(response);
          }
        }

        // Update metrics
        this.updateMetrics(request.service, true, Date.now() - startTime);

        // Cache successful responses
        if (response.success && request.method === 'GET') {
          this.addToCache(this.getCacheKey(request), response.data);
        }

        response.metadata = {
          duration: Date.now() - startTime,
          retries,
          cached: false
        };

        return response;

      } catch (error: any) {
        const serviceError: ServiceError = {
          code: error.code || 'REQUEST_FAILED',
          message: error.message || 'Request failed',
          details: error,
          retryable: this.isRetryableError(error)
        };

        // Apply plugins - onError
        for (const plugin of this.plugins.values()) {
          if (plugin.service === request.service && plugin.hooks.onError) {
            plugin.hooks.onError(serviceError);
          }
        }

        if (serviceError.retryable && retries < maxRetries) {
          retries++;
          await this.backoff(retries, service.retryPolicy);
          continue;
        }

        // Update metrics
        this.updateMetrics(request.service, false, Date.now() - startTime, serviceError);

        return {
          success: false,
          error: serviceError,
          metadata: {
            duration: Date.now() - startTime,
            retries,
            cached: false
          }
        };
      }
    }

    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: 'Maximum retries exceeded',
        retryable: false
      }
    };
  }

  private async executeRestRequest(
    service: ServiceConfig,
    request: ServiceRequest
  ): Promise<ServiceResponse> {
    const url = new URL(request.endpoint || '', service.baseUrl);
    
    if (request.params) {
      Object.entries(request.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = {
      ...service.headers,
      ...request.headers
    };

    if (service.apiKey) {
      headers['Authorization'] = `Bearer ${service.apiKey}`;
    }

    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: request.data ? JSON.stringify(request.data) : undefined,
      signal: AbortSignal.timeout(service.timeout || 30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  }

  private async executeGraphQLRequest(
    service: ServiceConfig,
    request: ServiceRequest
  ): Promise<ServiceResponse> {
    // GraphQL implementation
    const query = request.endpoint; // GraphQL query
    const variables = request.data;

    const response = await fetch(service.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...service.headers
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return { success: true, data: result.data };
  }

  private async executeWebSocketRequest(
    service: ServiceConfig,
    request: ServiceRequest
  ): Promise<ServiceResponse> {
    // WebSocket implementation would handle real-time connections
    // For now, return a placeholder
    return {
      success: true,
      data: { message: 'WebSocket request handled' }
    };
  }

  private async executeCustomRequest(
    service: ServiceConfig,
    request: ServiceRequest
  ): Promise<ServiceResponse> {
    // Handle internal services
    if (service.baseUrl.startsWith('internal://')) {
      const internalService = service.baseUrl.replace('internal://', '');
      
      switch (internalService) {
        case 'speech':
          const speechService = (window as any).moduleSystem?.get('SpeechService');
          if (speechService && request.data?.text) {
            await speechService.speak(request.data.text, request.data);
            return { success: true, data: { spoken: true } };
          }
          break;
      }
    }

    return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Custom service not implemented', retryable: false } };
  }

  private getCacheKey(request: ServiceRequest): string {
    const params = request.params ? JSON.stringify(request.params) : '';
    return `${request.service}:${request.method}:${request.endpoint}:${params}`;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private addToCache(key: string, data: any, ttl = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private isRetryableError(error: any): boolean {
    // Network errors and 5xx errors are retryable
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT' ||
           error.code === 'ENOTFOUND' ||
           (error.status && error.status >= 500);
  }

  private async backoff(retryCount: number, policy?: RetryPolicy): Promise<void> {
    const multiplier = policy?.backoffMultiplier || 2;
    const maxBackoff = policy?.maxBackoffMs || 10000;
    
    const delay = Math.min(
      Math.pow(multiplier, retryCount - 1) * 1000,
      maxBackoff
    );

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private updateMetrics(
    serviceId: string,
    success: boolean,
    duration: number,
    error?: ServiceError
  ): void {
    const metrics = this.metrics.get(serviceId);
    if (!metrics) return;

    metrics.totalRequests++;
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      if (error) {
        metrics.lastError = error;
      }
    }

    // Update average response time
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + duration) / 
      metrics.totalRequests;
  }

  private setupCacheCleanup(): void {
    // Clean expired cache entries every minute
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));
    }, 60000);
  }

  private loadServiceConfigs(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('service_adapter_configs');
      if (saved) {
        const configs = JSON.parse(saved);
        configs.forEach((config: ServiceConfig) => {
          this.registerService(config);
        });
      }
    } catch (error) {
      console.error('Failed to load service configurations:', error);
    }
  }

  private createDefaultMetrics(): ServiceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastError: null
    };
  }
}

// Type definitions
interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastError: ServiceError | null;
}

interface ServiceWrapper {
  get: (endpoint: string, params?: any) => Promise<ServiceResponse>;
  post: (endpoint: string, data?: any) => Promise<ServiceResponse>;
  put: (endpoint: string, data?: any) => Promise<ServiceResponse>;
  delete: (endpoint: string) => Promise<ServiceResponse>;
  custom: (method: string, endpoint: string, options?: any) => Promise<ServiceResponse>;
}

// Export singleton getter function
export function getServiceAdapter(): ServiceAdapter {
  return ServiceAdapter.getInstance();
}