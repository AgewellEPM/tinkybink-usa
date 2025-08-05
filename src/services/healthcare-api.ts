// Healthcare API Service Layer for Production Integration
import { z } from 'zod';

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.tinkybink.com',
  version: 'v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Validation Schemas
const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
  medicareId: z.string().regex(/^\d{9}[A-Za-z]?$/).optional(),
  medicaidId: z.string().optional(),
  primaryInsurance: z.string().optional(),
  diagnosis: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'discharged']),
  consentDate: z.string().optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional()
});

const ClaimSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  dateOfService: z.string(),
  cptCode: z.string().regex(/^\d{5}$/),
  modifiers: z.array(z.string()),
  units: z.number().int().positive(),
  diagnosisCodes: z.array(z.string()),
  insuranceType: z.enum(['medicare', 'medicaid', 'private']),
  status: z.enum(['draft', 'submitted', 'pending', 'approved', 'denied']),
  totalCharge: z.number().positive(),
  paidAmount: z.number().optional(),
  denialReason: z.string().optional()
});

const SessionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  therapistId: z.string(),
  date: z.string(),
  duration: z.number().int().positive(),
  cptCode: z.string(),
  goals: z.array(z.string()),
  interventions: z.array(z.string()),
  progress: z.string(),
  planOfCare: z.string(),
  signature: z.string().optional(),
  supervisorSignature: z.string().optional()
});

// Error handling
export class HealthcareAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'HealthcareAPIError';
  }
}

// Retry logic for resilient API calls
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts: number = API_CONFIG.retryAttempts,
  delay: number = API_CONFIG.retryDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, attempts - 1, delay * 2);
  }
}

// API Client class
export class HealthcareAPI {
  private authToken: string | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.baseUrl}/${API_CONFIG.version}`;
  }

  // Authentication
  async authenticate(credentials: { email: string; password: string }): Promise<void> {
    try {
      // Mock authentication for development
      if (process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Accept demo credentials
        if (credentials.email === 'demo@tinkybink.com' && credentials.password === 'demo123') {
          this.authToken = 'mock-auth-token-' + Date.now();
          localStorage.setItem('authToken', this.authToken);
          return;
        } else {
          throw new HealthcareAPIError(
            'Invalid credentials. Use demo@tinkybink.com / demo123',
            'AUTH_FAILED',
            401
          );
        }
      }
      
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new HealthcareAPIError(
          'Authentication failed',
          'AUTH_FAILED',
          response.status
        );
      }

      const data = await response.json();
      this.authToken = data.token;
      
      // Store token securely
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('healthcare_auth_token', data.token);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.authToken && typeof window !== 'undefined') {
      this.authToken = sessionStorage.getItem('healthcare_auth_token');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
            ...options.headers,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new HealthcareAPIError(
            errorData.message || 'API request failed',
            errorData.code || 'API_ERROR',
            res.status,
            errorData
          );
        }

        return res.json();
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HealthcareAPIError('Request timeout', 'TIMEOUT', 408);
      }
      
      throw error;
    }
  }

  // Patient Management APIs
  async getPatients(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ patients: z.infer<typeof PatientSchema>[]; total: number }> {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await this.request<any>(`/patients?${queryParams}`);
    
    // Validate response data
    const patients = z.array(PatientSchema).parse(response.patients);
    return { patients, total: response.total };
  }

  async getPatient(id: string): Promise<z.infer<typeof PatientSchema>> {
    const response = await this.request<any>(`/patients/${id}`);
    return PatientSchema.parse(response);
  }

  async createPatient(data: Omit<z.infer<typeof PatientSchema>, 'id'>): Promise<z.infer<typeof PatientSchema>> {
    const validated = PatientSchema.omit({ id: true }).parse(data);
    const response = await this.request<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
    return PatientSchema.parse(response);
  }

  async updatePatient(id: string, data: Partial<z.infer<typeof PatientSchema>>): Promise<z.infer<typeof PatientSchema>> {
    const response = await this.request<any>(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return PatientSchema.parse(response);
  }

  // Claims Management APIs
  async getClaims(params?: {
    page?: number;
    limit?: number;
    status?: string;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ claims: z.infer<typeof ClaimSchema>[]; total: number }> {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await this.request<any>(`/claims?${queryParams}`);
    
    const claims = z.array(ClaimSchema).parse(response.claims);
    return { claims, total: response.total };
  }

  async submitClaim(claimId: string): Promise<z.infer<typeof ClaimSchema>> {
    const response = await this.request<any>(`/claims/${claimId}/submit`, {
      method: 'POST',
    });
    return ClaimSchema.parse(response);
  }

  async batchSubmitClaims(claimIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const response = await this.request<any>('/claims/batch-submit', {
      method: 'POST',
      body: JSON.stringify({ claimIds }),
    });
    return response;
  }

  // Session Documentation APIs
  async createSession(data: Omit<z.infer<typeof SessionSchema>, 'id'>): Promise<z.infer<typeof SessionSchema>> {
    const validated = SessionSchema.omit({ id: true }).parse(data);
    const response = await this.request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
    return SessionSchema.parse(response);
  }

  async getSessionsByPatient(patientId: string): Promise<z.infer<typeof SessionSchema>[]> {
    const response = await this.request<any>(`/patients/${patientId}/sessions`);
    return z.array(SessionSchema).parse(response);
  }

  // Billing Analytics APIs
  async getBillingAnalytics(params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<{
    revenue: number;
    claims: number;
    approvalRate: number;
    avgReimbursement: number;
    topCPTCodes: Array<{ code: string; count: number; revenue: number }>;
    payerMix: Array<{ payer: string; percentage: number; revenue: number }>;
  }> {
    const queryParams = new URLSearchParams(params as any).toString();
    return await this.request(`/analytics/billing?${queryParams}`);
  }

  // Production Monitoring APIs
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeUsers: number;
    services: Array<{
      name: string;
      status: 'up' | 'down';
      lastCheck: string;
    }>;
  }> {
    return await this.request('/monitoring/health');
  }

  async getSystemMetrics(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
    network: {
      in: number;
      out: number;
    };
    database: {
      connections: number;
      queryTime: number;
    };
  }> {
    return await this.request('/monitoring/metrics');
  }

  // Clearinghouse Integration
  async submitToClearinghouse(claims: string[]): Promise<{
    batchId: string;
    submittedCount: number;
    errors: Array<{ claimId: string; error: string }>;
  }> {
    return await this.request('/clearinghouse/submit', {
      method: 'POST',
      body: JSON.stringify({ claims }),
    });
  }

  async checkClearinghouseStatus(batchId: string): Promise<{
    status: 'processing' | 'completed' | 'failed';
    processedCount: number;
    acceptedCount: number;
    rejectedCount: number;
    rejections: Array<{
      claimId: string;
      reason: string;
      code: string;
    }>;
  }> {
    return await this.request(`/clearinghouse/status/${batchId}`);
  }

  // White Label Configuration
  async getWhiteLabelConfig(): Promise<{
    brandName: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    customDomain: string;
    features: Record<string, boolean>;
  }> {
    return await this.request('/whitelabel/config');
  }

  async updateWhiteLabelConfig(config: any): Promise<void> {
    await this.request('/whitelabel/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // File Uploads (for logos, documents, etc.)
  async uploadFile(file: File, type: 'logo' | 'document' | 'report'): Promise<{
    url: string;
    id: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new HealthcareAPIError('Upload failed', 'UPLOAD_FAILED', response.status);
    }

    return response.json();
  }

  // Export functionality
  async exportData(params: {
    type: 'patients' | 'claims' | 'sessions' | 'analytics';
    format: 'csv' | 'xlsx' | 'pdf';
    dateFrom?: string;
    dateTo?: string;
    filters?: Record<string, any>;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams(params as any).toString();
    
    const response = await fetch(`${this.baseUrl}/export?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
      },
    });

    if (!response.ok) {
      throw new HealthcareAPIError('Export failed', 'EXPORT_FAILED', response.status);
    }

    return response.blob();
  }
}

// Create singleton instance
export const healthcareAPI = new HealthcareAPI();