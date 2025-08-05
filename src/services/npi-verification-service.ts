/**
 * NPI Verification Service
 * Enterprise-grade National Provider Identifier lookup and validation system
 * Integrates with CMS NPI Registry API for real-time provider verification
 * 
 * Features:
 * - Real-time NPI validation against CMS registry
 * - Speech-Language Pathologist specialty verification
 * - Practice address auto-population
 * - Comprehensive credential validation
 * - Provider search and discovery
 * - Professional validation reports
 * 
 * @author TinkyBink AAC Platform
 * @version 2.0.0
 */

/**
 * Comprehensive NPI Provider Information
 * Contains all verified data from CMS National Provider Identifier Registry
 */
export interface NPIProvider {
  /** 10-digit National Provider Identifier */
  npi: string;
  
  /** Full provider name (organization or individual) */
  name: string;
  
  /** Individual provider's first name (if applicable) */
  firstName?: string;
  
  /** Individual provider's last name (if applicable) */
  lastName?: string;
  
  /** Primary healthcare taxonomy code */
  taxonomy: string;
  
  /** Taxonomy description (human-readable specialty) */
  taxonomyDescription?: string;
  
  /** Primary practice location details */
  primaryPracticeAddress: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone?: string;
    fax?: string;
  };
  
  /** Alternative names or DBA names */
  otherNames?: string[];
  
  /** Professional credentials (MD, SLP, etc.) */
  credentials?: string[];
  
  /** Date provider was first enumerated in NPI registry */
  enumDate: string;
  
  /** Last update date in NPI registry */
  lastUpdated: string;
  
  /** Current enrollment status */
  status: 'Active' | 'Deactivated';
  
  /** Additional practice locations */
  additionalLocations?: Array<{
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone?: string;
  }>;
  
  /** Provider's gender (if individual) */
  gender?: 'M' | 'F';
  
  /** Sole proprietor indicator */
  soleProprietor?: boolean;
  
  /** Organization subpart indicator */
  organizationSubpart?: boolean;
}

/**
 * NPI Lookup Operation Result
 * Standardized response format for all NPI verification operations
 */
export interface NPILookupResult {
  /** Whether the lookup operation was successful */
  success: boolean;
  
  /** Verified provider information (if successful) */
  provider?: NPIProvider;
  
  /** Human-readable error message (if failed) */
  error?: string;
  
  /** Detailed error code for programmatic handling */
  errorCode?: 'INVALID_FORMAT' | 'NOT_FOUND' | 'API_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMITED';
  
  /** API response metadata */
  metadata?: {
    responseTime: number;
    apiVersion: string;
    resultCount: number;
  };
}

class NPIVerificationService {
  private static instance: NPIVerificationService;
  private readonly NPI_REGISTRY_URL = 'https://npiregistry.cms.hhs.gov/api';
  private readonly API_VERSION = '2.1';
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private lastRequestTime = 0;

  private constructor() {}

  static getInstance(): NPIVerificationService {
    if (!NPIVerificationService.instance) {
      NPIVerificationService.instance = new NPIVerificationService();
    }
    return NPIVerificationService.instance;
  }

  /**
   * Verify a National Provider Identifier against CMS registry
   * @param npi 10-digit National Provider Identifier
   * @returns Promise<NPILookupResult> Verification result with provider data
   */
  async verifyNPI(npi: string): Promise<NPILookupResult> {
    const startTime = Date.now();
    
    try {
      // Validate NPI format
      const formatValidation = this.validateNPIFormat(npi);
      if (!formatValidation.isValid) {
        return {
          success: false,
          error: formatValidation.error,
          errorCode: 'INVALID_FORMAT',
          metadata: {
            responseTime: Date.now() - startTime,
            apiVersion: this.API_VERSION,
            resultCount: 0
          }
        };
      }

      // Apply rate limiting
      await this.enforceRateLimit();

      // Build API request
      const url = this.buildNPILookupURL(npi);
      
      const response = await this.makeAPIRequest(url);
      
      if (!response.ok) {
        const errorCode = response.status === 429 ? 'RATE_LIMITED' : 'API_ERROR';
        throw new Error(`NPI Registry API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.result_count === 0) {
        return {
          success: false,
          error: `NPI ${npi} not found in CMS registry. Please verify the number is correct.`,
          errorCode: 'NOT_FOUND',
          metadata: {
            responseTime: Date.now() - startTime,
            apiVersion: this.API_VERSION,
            resultCount: 0
          }
        };
      }

      const providerData = data.results[0];
      const provider = this.parseProviderData(providerData);

      return {
        success: true,
        provider,
        metadata: {
          responseTime: Date.now() - startTime,
          apiVersion: this.API_VERSION,
          resultCount: data.result_count
        }
      };

    } catch (error) {
      console.error('NPI verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: `Unable to verify NPI: ${errorMessage}. Please check your connection and try again.`,
        errorCode: 'NETWORK_ERROR',
        metadata: {
          responseTime: Date.now() - startTime,
          apiVersion: this.API_VERSION,
          resultCount: 0
        }
      };
    }
  }

  async searchProviders(query: {
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    city?: string;
    state?: string;
    taxonomy?: string;
  }): Promise<{ success: boolean; providers?: NPIProvider[]; error?: string }> {
    try {
      const params = new URLSearchParams();
      
      if (query.firstName) params.append('first_name', query.firstName);
      if (query.lastName) params.append('last_name', query.lastName);
      if (query.organizationName) params.append('organization_name', query.organizationName);
      if (query.city) params.append('city', query.city);
      if (query.state) params.append('state', query.state);
      if (query.taxonomy) params.append('taxonomy_description', query.taxonomy);
      
      params.append('limit', '20');
      params.append('version', '2.1');

      const response = await fetch(`${this.NPI_REGISTRY_URL}/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`NPI Registry API error: ${response.status}`);
      }

      const data = await response.json();
      
      const providers = data.results?.map((result: any) => this.parseProviderData(result)) || [];

      return {
        success: true,
        providers
      };

    } catch (error) {
      console.error('Provider search failed:', error);
      return {
        success: false,
        error: 'Unable to search providers. Please try again later.'
      };
    }
  }

  /**
   * Determine if provider is qualified for speech-language pathology services
   * @param provider NPIProvider object to check
   * @returns boolean True if provider is qualified SLP
   */
  isSpeechTherapist(provider: NPIProvider): boolean {
    const speechTaxonomies = new Map([
      ['235Z00000X', 'Speech-Language Pathologist'],
      ['2355A2700X', 'Audiologist'],
      ['235500000X', 'Specialist/Technologist Other'],
      ['2355S0801X', 'Speech-Language Assistant'],
      ['235500000X', 'Speech, Language and Hearing Service Providers']
    ]);

    return speechTaxonomies.has(provider.taxonomy);
  }

  /**
   * Get human-readable specialty description for provider
   * @param provider NPIProvider object
   * @returns string Specialty description
   */
  getSpecialtyDescription(provider: NPIProvider): string {
    const specialtyMap = new Map([
      ['235Z00000X', 'Speech-Language Pathologist'],
      ['2355A2700X', 'Audiologist'],
      ['235500000X', 'Speech/Language Specialist'],
      ['2355S0801X', 'Speech-Language Assistant']
    ]);

    return specialtyMap.get(provider.taxonomy) || 'Healthcare Provider';
  }

  async validateTherapistCredentials(npi: string): Promise<{
    isValid: boolean;
    isSpeechTherapist: boolean;
    isActive: boolean;
    provider?: NPIProvider;
    error?: string;
  }> {
    const result = await this.verifyNPI(npi);
    
    if (!result.success || !result.provider) {
      return {
        isValid: false,
        isSpeechTherapist: false,
        isActive: false,
        error: result.error
      };
    }

    const provider = result.provider;
    const isSpeechTherapist = this.isSpeechTherapist(provider);
    const isActive = provider.status === 'Active';

    return {
      isValid: true,
      isSpeechTherapist,
      isActive,
      provider
    };
  }

  /**
   * Comprehensive NPI format validation with detailed error reporting
   * @param npi String to validate as NPI
   * @returns Validation result with specific error details
   */
  private validateNPIFormat(npi: string): { isValid: boolean; error?: string; cleanedNPI?: string } {
    if (!npi || typeof npi !== 'string') {
      return { isValid: false, error: 'NPI is required and must be a string' };
    }

    // Remove all non-digit characters
    const cleaned = npi.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      return { isValid: false, error: 'NPI must contain digits' };
    }
    
    if (cleaned.length < 10) {
      return { isValid: false, error: `NPI must be 10 digits (provided: ${cleaned.length} digits)` };
    }
    
    if (cleaned.length > 10) {
      return { isValid: false, error: `NPI must be exactly 10 digits (provided: ${cleaned.length} digits)` };
    }

    // Validate Luhn algorithm (NPI uses Luhn check digit)
    if (!this.validateLuhnChecksum(cleaned)) {
      return { isValid: false, error: 'Invalid NPI: checksum validation failed' };
    }

    return { isValid: true, cleanedNPI: cleaned };
  }

  /**
   * Validate NPI using Luhn algorithm checksum
   * @param npi 10-digit NPI string
   * @returns boolean True if checksum is valid
   */
  private validateLuhnChecksum(npi: string): boolean {
    // NPI uses Luhn algorithm with prefix "80840"
    const fullNumber = '80840' + npi;
    let sum = 0;
    let isEven = false;

    // Process digits from right to left
    for (let i = fullNumber.length - 2; i >= 0; i--) {
      let digit = parseInt(fullNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit = digit - 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(npi[9]);
  }

  /**
   * Parse raw CMS API response into structured NPIProvider object
   * @param data Raw provider data from CMS API
   * @returns Structured NPIProvider object
   */
  private parseProviderData(data: any): NPIProvider {
    const basic = data.basic;
    const addresses = data.addresses || [];
    const taxonomies = data.taxonomies || [];
    
    // Find primary practice address (prefer LOCATION over MAILING)
    const practiceAddress = addresses.find((addr: any) => addr.address_purpose === 'LOCATION') || 
                           addresses.find((addr: any) => addr.address_purpose === 'MAILING') ||
                           addresses[0] || {};

    // Get additional locations (excluding primary)
    const additionalLocations = addresses
      .filter((addr: any) => addr !== practiceAddress)
      .map((addr: any) => ({
        address1: addr.address_1 || '',
        address2: addr.address_2,
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postal_code || '',
        phone: addr.telephone_number
      }));

    // Parse name with proper fallbacks
    const providerName = basic.organization_name || 
                        `${basic.first_name || ''} ${basic.last_name || ''}`.trim() ||
                        'Unknown Provider';

    // Get primary taxonomy
    const primaryTaxonomy = taxonomies[0] || {};

    return {
      npi: data.number,
      name: providerName,
      firstName: basic.first_name,
      lastName: basic.last_name,
      taxonomy: primaryTaxonomy.code || '',
      taxonomyDescription: primaryTaxonomy.desc,
      primaryPracticeAddress: {
        address1: practiceAddress.address_1 || '',
        address2: practiceAddress.address_2,
        city: practiceAddress.city || '',
        state: practiceAddress.state || '',
        postalCode: practiceAddress.postal_code || '',
        phone: practiceAddress.telephone_number,
        fax: practiceAddress.fax_number
      },
      additionalLocations: additionalLocations.length > 0 ? additionalLocations : undefined,
      otherNames: basic.other_names?.map((name: any) => 
        name.organization_name || `${name.first_name || ''} ${name.last_name || ''}`.trim()
      ).filter(Boolean),
      credentials: basic.credentials?.filter(Boolean) || [],
      enumDate: basic.enumeration_date,
      lastUpdated: basic.last_updated,
      status: basic.status === 'A' ? 'Active' : 'Deactivated',
      gender: basic.gender,
      soleProprietor: basic.sole_proprietor === 'YES',
      organizationSubpart: basic.organization_subpart === 'YES'
    };
  }

  /**
   * Build NPI lookup URL with proper parameters
   * @param npi NPI to lookup
   * @returns Complete API URL
   */
  private buildNPILookupURL(npi: string): string {
    const params = new URLSearchParams({
      number: npi,
      version: this.API_VERSION,
      pretty: 'false'
    });
    
    return `${this.NPI_REGISTRY_URL}/?${params.toString()}`;
  }

  /**
   * Make API request with timeout and proper error handling
   * @param url API endpoint URL
   * @returns Promise<Response> API response
   */
  private async makeAPIRequest(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TinkyBink-AAC-Platform/2.0'
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Enforce rate limiting between API requests
   */
  private async enforceRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Format NPI for display with proper spacing and validation
   * @param npi Raw NPI input
   * @returns Formatted NPI string
   */
  formatNPI(npi: string): string {
    const validation = this.validateNPIFormat(npi);
    if (validation.isValid && validation.cleanedNPI) {
      // Format as: 1234567890
      return validation.cleanedNPI;
    }
    return npi; // Return original if invalid
  }

  /**
   * Format NPI for display with grouping (for UI display)
   * @param npi NPI to format
   * @returns Human-readable NPI format
   */
  formatNPIForDisplay(npi: string): string {
    const validation = this.validateNPIFormat(npi);
    if (validation.isValid && validation.cleanedNPI) {
      // Format as: 1234-567-890
      const cleaned = validation.cleanedNPI;
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return npi;
  }

  /**
   * Generate comprehensive validation report for provider
   * @param provider NPIProvider to analyze
   * @returns Detailed validation report with recommendations
   */
  generateNPIValidationReport(provider: NPIProvider): {
    summary: string;
    overallStatus: 'excellent' | 'good' | 'warning' | 'error';
    details: Array<{ 
      label: string; 
      value: string; 
      status: 'good' | 'warning' | 'error';
      description?: string;
    }>;
    recommendations: string[];
    eligibilityScore: number;
  } {
    const details = [
      {
        label: 'NPI Status',
        value: provider.status,
        status: provider.status === 'Active' ? 'good' as const : 'error' as const,
        description: provider.status === 'Active' 
          ? 'Provider is actively enrolled and can bill Medicare/Medicaid'
          : 'Provider is deactivated and cannot bill government insurance'
      },
      {
        label: 'Provider Specialty',
        value: this.getSpecialtyDescription(provider),
        status: this.isSpeechTherapist(provider) ? 'good' as const : 'warning' as const,
        description: this.isSpeechTherapist(provider)
          ? 'Qualified to provide speech-language pathology services'
          : 'May require additional verification for SLP services'
      },
      {
        label: 'Practice Address',
        value: `${provider.primaryPracticeAddress.city}, ${provider.primaryPracticeAddress.state}`,
        status: provider.primaryPracticeAddress.city ? 'good' as const : 'warning' as const,
        description: 'Primary practice location for service delivery'
      },
      {
        label: 'Credentials',
        value: provider.credentials?.join(', ') || 'Not specified',
        status: (provider.credentials && provider.credentials.length > 0) ? 'good' as const : 'warning' as const,
        description: 'Professional credentials and certifications'
      },
      {
        label: 'Enumeration Date',
        value: new Date(provider.enumDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        status: 'good' as const,
        description: 'Date when NPI was first issued'
      },
      {
        label: 'Last Registry Update',
        value: new Date(provider.lastUpdated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        status: this.isRecentlyUpdated(provider.lastUpdated) ? 'good' as const : 'warning' as const,
        description: 'Most recent update to NPI registry information'
      }
    ];

    // Calculate eligibility score (0-100)
    let score = 0;
    if (provider.status === 'Active') score += 40;
    if (this.isSpeechTherapist(provider)) score += 30;
    if (provider.primaryPracticeAddress.city) score += 15;
    if (provider.credentials && provider.credentials.length > 0) score += 10;
    if (this.isRecentlyUpdated(provider.lastUpdated)) score += 5;

    // Generate recommendations
    const recommendations = [];
    if (provider.status !== 'Active') {
      recommendations.push('Reactivate NPI status with CMS before providing services');
    }
    if (!this.isSpeechTherapist(provider)) {
      recommendations.push('Verify speech-language pathology credentials and update taxonomy code');
    }
    if (!provider.credentials || provider.credentials.length === 0) {
      recommendations.push('Add professional credentials (CCC-SLP, state license) to NPI profile');
    }
    if (!this.isRecentlyUpdated(provider.lastUpdated)) {
      recommendations.push('Review and update NPI registry information if needed');
    }
    if (score >= 85) {
      recommendations.push('Provider is fully qualified for AAC therapy billing');
    }

    // Determine overall status
    let overallStatus: 'excellent' | 'good' | 'warning' | 'error';
    if (score >= 90) overallStatus = 'excellent';
    else if (score >= 75) overallStatus = 'good';
    else if (score >= 50) overallStatus = 'warning';
    else overallStatus = 'error';

    const summary = this.generateSummaryText(provider, score);

    return { 
      summary, 
      overallStatus,
      details, 
      recommendations,
      eligibilityScore: score
    };
  }

  /**
   * Check if NPI registry information was recently updated
   * @param lastUpdated Last update date string
   * @returns boolean True if updated within last 2 years
   */
  private isRecentlyUpdated(lastUpdated: string): boolean {
    const updateDate = new Date(lastUpdated);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return updateDate >= twoYearsAgo;
  }

  /**
   * Generate summary text based on provider validation
   * @param provider NPIProvider object
   * @param score Eligibility score
   * @returns Summary text
   */
  private generateSummaryText(provider: NPIProvider, score: number): string {
    if (score >= 90) {
      return `${provider.name} is fully verified and eligible for AAC therapy billing with excellent credentials and active NPI status.`;
    } else if (score >= 75) {
      return `${provider.name} is verified and eligible for AAC therapy billing with good standing in the NPI registry.`;
    } else if (score >= 50) {
      return `${provider.name} is found in NPI registry but may require additional verification or credential updates for optimal billing eligibility.`;
    } else {
      return `${provider.name} has significant limitations that may prevent AAC therapy billing. Immediate attention required to resolve credential or status issues.`;
    }
  }
}

// Export singleton instance and types
export const npiVerificationService = NPIVerificationService.getInstance();
export type { NPIProvider, NPILookupResult };

// Export additional utility types
export type NPIValidationReport = ReturnType<typeof NPIVerificationService.prototype.generateNPIValidationReport>;
export type ProviderSearchQuery = Parameters<typeof NPIVerificationService.prototype.searchProviders>[0];