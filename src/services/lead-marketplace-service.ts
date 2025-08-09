/**
 * Lead Marketplace Service
 * Strategic system that captures families from free AAC app and converts them to qualified leads
 * Primary revenue driver: $25-75 per lead sold to therapists
 */

export interface ParentLead {
  id: string;
  source: 'aac_app' | 'website' | 'referral' | 'google_ads';
  
  // Parent Information
  parent: {
    name: string;
    email: string;
    phone?: string;
    preferredContact: 'email' | 'phone' | 'text';
    timezone: string;
    hasUsedAAC: boolean;
    aacUsageDuration?: number; // days using our free app
  };
  
  // Child Information
  child: {
    age: number;
    diagnosis: string;
    severity: 'mild' | 'moderate' | 'severe' | 'unknown';
    currentTherapy: boolean;
    previousAAC: boolean;
    communicationLevel: string;
    goals: string[];
  };
  
  // Service Requirements
  requirements: {
    urgency: 'immediate' | 'within_week' | 'within_month' | 'exploring';
    serviceType: 'in_person' | 'telehealth' | 'hybrid';
    location: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates: { lat: number; lng: number };
      maxDistance: number;
    };
    schedule: {
      preferredDays: string[];
      preferredTimes: string[];
      frequency: string;
    };
    budget: {
      hasInsurance: boolean;
      insuranceProvider?: string;
      maxOutOfPocket: number;
    };
    specialRequests: string[];
  };
  
  // Lead Scoring
  scoring: {
    leadScore: number; // 1-100
    conversionProbability: number; // 0-1
    urgencyScore: number;
    budgetScore: number;
    locationScore: number;
    qualityIndicators: string[];
  };
  
  // Marketplace Data
  marketplace: {
    status: 'new' | 'active' | 'purchased' | 'converted' | 'expired';
    pricing: {
      basePrice: number;
      premiumMultiplier: number;
      finalPrice: number;
    };
    matchedTherapists: string[];
    interestedTherapists: string[];
    purchasedBy: string[];
    views: number;
    createdAt: Date;
    expiresAt: Date;
  };
  
  // Follow-up
  engagement: {
    lastContact: Date;
    contactAttempts: number;
    responseRate: number;
    emailOpens: number;
    linkClicks: number;
    appUsageAfterInquiry: boolean;
  };
}

export interface TherapistLeadPurchase {
  id: string;
  therapistId: string;
  leadId: string;
  purchaseDate: Date;
  price: number;
  paymentMethod: string;
  
  // Contact Information Released
  contactInfo: {
    parentName: string;
    email: string;
    phone?: string;
    bestTimeToCall: string;
  };
  
  // Lead Details
  leadDetails: {
    childAge: number;
    diagnosis: string;
    urgency: string;
    location: string;
    specialNeeds: string[];
    budget: string;
  };
  
  // Performance Tracking
  tracking: {
    contacted: boolean;
    contactDate?: Date;
    responseReceived: boolean;
    appointmentScheduled: boolean;
    converted: boolean;
    conversionDate?: Date;
    feedbackScore?: number;
  };
}

export interface LeadMarketplaceAnalytics {
  overview: {
    totalLeads: number;
    activeLeads: number;
    soldLeads: number;
    conversionRate: number;
    avgLeadPrice: number;
    totalRevenue: number;
  };
  
  trends: {
    leadsPerWeek: number[];
    salesPerWeek: number[];
    revenuePerWeek: number[];
    conversionTrend: number[];
  };
  
  demographics: {
    ageDistribution: Record<string, number>;
    diagnosisBreakdown: Record<string, number>;
    locationHeatmap: Array<{
      zipCode: string;
      leads: number;
      avgPrice: number;
    }>;
    urgencyDistribution: Record<string, number>;
  };
  
  therapistMetrics: {
    topPurchasers: Array<{
      therapistId: string;
      leadsPerMonth: number;
      conversionRate: number;
      avgROI: number;
    }>;
    satisfactionScores: Record<string, number>;
  };
}

class LeadMarketplaceService {
  private static instance: LeadMarketplaceService;
  
  private leads: Map<string, ParentLead> = new Map();
  private purchases: Map<string, TherapistLeadPurchase> = new Map();
  private analytics: LeadMarketplaceAnalytics;
  
  private constructor() {
    this.initializeAnalytics();
    this.loadSampleData();
  }
  
  static getInstance(): LeadMarketplaceService {
    if (!LeadMarketplaceService.instance) {
      LeadMarketplaceService.instance = new LeadMarketplaceService();
    }
    return LeadMarketplaceService.instance;
  }
  
  /**
   * Strategic: Capture lead from free AAC app user
   * This is the core of our flywheel - free users become revenue
   */
  async captureLeadFromAAC(aacUserData: {
    userId: string;
    childAge: number;
    diagnosisFromUsage: string;
    usageDuration: number;
    location: { lat: number; lng: number; zipCode: string };
    parentEmail: string;
    appEngagement: number;
  }): Promise<{
    leadId: string;
    estimatedValue: number;
    recommendedPrice: number;
  }> {
    const leadId = `lead_${Date.now()}`;
    
    // Calculate lead quality from AAC usage
    const leadScore = this.calculateLeadScoreFromAAC(aacUserData);
    const pricing = this.calculateDynamicPricing(leadScore, aacUserData);
    
    const lead: ParentLead = {
      id: leadId,
      source: 'aac_app',
      parent: {
        name: 'AAC App Parent',
        email: aacUserData.parentEmail,
        preferredContact: 'email',
        timezone: 'America/Chicago',
        hasUsedAAC: true,
        aacUsageDuration: aacUserData.usageDuration
      },
      child: {
        age: aacUserData.childAge,
        diagnosis: aacUserData.diagnosisFromUsage,
        severity: this.inferSeverityFromUsage(aacUserData.appEngagement),
        currentTherapy: false,
        previousAAC: true,
        communicationLevel: this.assessCommunicationLevel(aacUserData),
        goals: this.suggestGoalsFromUsage(aacUserData)
      },
      requirements: {
        urgency: this.inferUrgencyFromUsage(aacUserData.usageDuration),
        serviceType: 'hybrid',
        location: {
          address: '',
          city: 'Unknown',
          state: 'TX',
          zipCode: aacUserData.location.zipCode,
          coordinates: aacUserData.location,
          maxDistance: 25
        },
        schedule: {
          preferredDays: ['Monday', 'Wednesday', 'Friday'],
          preferredTimes: ['afternoon'],
          frequency: 'weekly'
        },
        budget: {
          hasInsurance: true,
          maxOutOfPocket: 150
        },
        specialRequests: ['AAC-experienced therapist preferred']
      },
      scoring: {
        leadScore,
        conversionProbability: this.calculateConversionProbability(leadScore, aacUserData),
        urgencyScore: this.calculateUrgencyScore(aacUserData),
        budgetScore: 75, // Assume good based on AAC app usage
        locationScore: 80,
        qualityIndicators: this.identifyQualityIndicators(aacUserData)
      },
      marketplace: {
        status: 'new',
        pricing,
        matchedTherapists: [],
        interestedTherapists: [],
        purchasedBy: [],
        views: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      engagement: {
        lastContact: new Date(),
        contactAttempts: 0,
        responseRate: 0,
        emailOpens: 0,
        linkClicks: 0,
        appUsageAfterInquiry: true
      }
    };
    
    // Match with qualified therapists
    lead.marketplace.matchedTherapists = await this.matchQualifiedTherapists(lead);
    
    this.leads.set(leadId, lead);
    
    // Update analytics
    this.updateLeadAnalytics(lead);
    
    return {
      leadId,
      estimatedValue: pricing.finalPrice * lead.marketplace.matchedTherapists.length,
      recommendedPrice: pricing.finalPrice
    };
  }
  
  /**
   * Therapist browsing available leads
   */
  async getAvailableLeads(therapistId: string, filters?: {
    maxPrice?: number;
    location?: { radius: number; center: { lat: number; lng: number } };
    childAge?: { min: number; max: number };
    diagnosis?: string[];
    urgency?: string[];
  }): Promise<{
    leads: Array<{
      id: string;
      preview: {
        childAge: number;
        diagnosis: string;
        urgency: string;
        location: string;
        price: number;
        leadScore: number;
        specialRequests: string[];
      };
      matchScore: number;
      estimatedROI: number;
    }>;
    totalAvailable: number;
    avgPrice: number;
  }> {
    const therapistProfile = await this.getTherapistProfile(therapistId);
    let availableLeads = Array.from(this.leads.values())
      .filter(lead => 
        lead.marketplace.status === 'active' && 
        !lead.marketplace.purchasedBy.includes(therapistId) &&
        lead.marketplace.expiresAt > new Date()
      );
    
    // Apply filters
    if (filters) {
      if (filters.maxPrice) {
        availableLeads = availableLeads.filter(lead => 
          lead.marketplace.pricing.finalPrice <= filters.maxPrice!
        );
      }
      
      if (filters.childAge) {
        availableLeads = availableLeads.filter(lead =>
          lead.child.age >= filters.childAge!.min &&
          lead.child.age <= filters.childAge!.max
        );
      }
      
      if (filters.diagnosis?.length) {
        availableLeads = availableLeads.filter(lead =>
          filters.diagnosis!.includes(lead.child.diagnosis)
        );
      }
      
      if (filters.urgency?.length) {
        availableLeads = availableLeads.filter(lead =>
          filters.urgency!.includes(lead.requirements.urgency)
        );
      }
      
      if (filters.location) {
        availableLeads = availableLeads.filter(lead => {
          const distance = this.calculateDistance(
            filters.location!.center,
            lead.requirements.location.coordinates
          );
          return distance <= filters.location!.radius;
        });
      }
    }
    
    // Calculate match scores and ROI
    const leadsWithMetrics = availableLeads.map(lead => {
      const matchScore = this.calculateTherapistLeadMatch(therapistProfile, lead);
      const estimatedROI = this.estimateLeadROI(lead, therapistProfile);
      
      return {
        id: lead.id,
        preview: {
          childAge: lead.child.age,
          diagnosis: lead.child.diagnosis,
          urgency: lead.requirements.urgency,
          location: `${lead.requirements.location.city}, ${lead.requirements.location.state}`,
          price: lead.marketplace.pricing.finalPrice,
          leadScore: lead.scoring.leadScore,
          specialRequests: lead.requirements.specialRequests
        },
        matchScore,
        estimatedROI
      };
    });
    
    // Sort by match score and ROI
    leadsWithMetrics.sort((a, b) => 
      (b.matchScore * 0.6 + b.estimatedROI * 0.4) - 
      (a.matchScore * 0.6 + a.estimatedROI * 0.4)
    );
    
    const avgPrice = leadsWithMetrics.reduce((sum, lead) => sum + lead.preview.price, 0) / leadsWithMetrics.length || 0;
    
    return {
      leads: leadsWithMetrics,
      totalAvailable: leadsWithMetrics.length,
      avgPrice: Math.round(avgPrice)
    };
  }
  
  /**
   * Therapist purchases a lead
   */
  async purchaseLead(therapistId: string, leadId: string, paymentMethod: string): Promise<{
    success: boolean;
    purchaseId?: string;
    contactInfo?: any;
    leadDetails?: any;
    price: number;
    error?: string;
  }> {
    const lead = this.leads.get(leadId);
    const therapistProfile = await this.getTherapistProfile(therapistId);
    
    if (!lead) {
      return { success: false, price: 0, error: 'Lead not found' };
    }
    
    if (lead.marketplace.status !== 'active') {
      return { success: false, price: 0, error: 'Lead no longer available' };
    }
    
    if (lead.marketplace.purchasedBy.includes(therapistId)) {
      return { success: false, price: 0, error: 'Already purchased this lead' };
    }
    
    const price = this.calculateFinalPrice(lead, therapistProfile.subscription);
    
    // Process payment
    const paymentSuccess = await this.processPayment(therapistId, price, paymentMethod);
    if (!paymentSuccess) {
      return { success: false, price, error: 'Payment failed' };
    }
    
    // Create purchase record
    const purchaseId = `purchase_${Date.now()}`;
    const purchase: TherapistLeadPurchase = {
      id: purchaseId,
      therapistId,
      leadId,
      purchaseDate: new Date(),
      price,
      paymentMethod,
      contactInfo: {
        parentName: lead.parent.name,
        email: lead.parent.email,
        phone: lead.parent.phone,
        bestTimeToCall: lead.requirements.schedule.preferredTimes[0] || 'anytime'
      },
      leadDetails: {
        childAge: lead.child.age,
        diagnosis: lead.child.diagnosis,
        urgency: lead.requirements.urgency,
        location: `${lead.requirements.location.city}, ${lead.requirements.location.state}`,
        specialNeeds: lead.requirements.specialRequests,
        budget: lead.requirements.budget.hasInsurance ? 'Has insurance' : `$${lead.requirements.budget.maxOutOfPocket} max`
      },
      tracking: {
        contacted: false,
        responseReceived: false,
        appointmentScheduled: false,
        converted: false
      }
    };
    
    this.purchases.set(purchaseId, purchase);
    
    // Update lead status
    lead.marketplace.purchasedBy.push(therapistId);
    if (lead.marketplace.purchasedBy.length >= 3) { // Max 3 therapists per lead
      lead.marketplace.status = 'purchased';
    }
    
    // Track revenue
    this.analytics.overview.totalRevenue += price;
    this.analytics.overview.soldLeads += 1;
    
    // Send notification to parent
    await this.notifyParentOfTherapistContact(lead, therapistProfile);
    
    return {
      success: true,
      purchaseId,
      contactInfo: purchase.contactInfo,
      leadDetails: purchase.leadDetails,
      price
    };
  }
  
  /**
   * Track lead conversion and therapist success
   */
  async trackConversion(purchaseId: string, milestone: 'contacted' | 'response' | 'appointment' | 'converted'): Promise<void> {
    const purchase = this.purchases.get(purchaseId);
    if (!purchase) return;
    
    switch (milestone) {
      case 'contacted':
        purchase.tracking.contacted = true;
        purchase.tracking.contactDate = new Date();
        break;
      case 'response':
        purchase.tracking.responseReceived = true;
        break;
      case 'appointment':
        purchase.tracking.appointmentScheduled = true;
        break;
      case 'converted':
        purchase.tracking.converted = true;
        purchase.tracking.conversionDate = new Date();
        this.analytics.overview.conversionRate = this.calculateOverallConversionRate();
        break;
    }
    
    // Update therapist performance metrics
    await this.updateTherapistPerformance(purchase.therapistId, milestone);
  }
  
  /**
   * Get marketplace analytics
   */
  getMarketplaceAnalytics(): LeadMarketplaceAnalytics {
    return this.analytics;
  }
  
  // Private helper methods
  private calculateLeadScoreFromAAC(aacData: any): number {
    let score = 50; // Base score
    
    // Usage duration indicates engagement
    if (aacData.usageDuration > 30) score += 20;
    else if (aacData.usageDuration > 7) score += 15;
    else if (aacData.usageDuration > 1) score += 10;
    
    // App engagement indicates need
    if (aacData.appEngagement > 80) score += 25;
    else if (aacData.appEngagement > 60) score += 20;
    else if (aacData.appEngagement > 40) score += 15;
    
    // Age factor (early intervention premium)
    if (aacData.childAge < 5) score += 15;
    else if (aacData.childAge < 8) score += 10;
    
    // Diagnosis complexity
    const highValueDiagnoses = ['autism', 'apraxia', 'cerebral_palsy'];
    if (highValueDiagnoses.includes(aacData.diagnosisFromUsage.toLowerCase())) {
      score += 20;
    }
    
    return Math.min(100, score);
  }
  
  private calculateDynamicPricing(leadScore: number, aacData: any): any {
    let basePrice = 35;
    
    // Quality multiplier
    const qualityMultiplier = 1 + (leadScore / 100);
    
    // Urgency from usage patterns
    const urgencyMultiplier = aacData.usageDuration < 3 ? 1.8 : 
                             aacData.usageDuration < 7 ? 1.5 : 1.2;
    
    // Engagement multiplier
    const engagementMultiplier = 1 + (aacData.appEngagement / 200);
    
    const finalPrice = Math.round(
      basePrice * qualityMultiplier * urgencyMultiplier * engagementMultiplier
    );
    
    return {
      basePrice: finalPrice,
      premiumMultiplier: qualityMultiplier,
      finalPrice: Math.min(75, finalPrice) // Cap at $75
    };
  }
  
  private inferSeverityFromUsage(engagement: number): 'mild' | 'moderate' | 'severe' | 'unknown' {
    if (engagement > 80) return 'severe';
    if (engagement > 60) return 'moderate';
    if (engagement > 40) return 'mild';
    return 'unknown';
  }
  
  private assessCommunicationLevel(aacData: any): string {
    if (aacData.appEngagement > 80) return 'Non-verbal, high AAC usage';
    if (aacData.appEngagement > 60) return 'Limited verbal, regular AAC use';
    if (aacData.appEngagement > 40) return 'Some verbal, occasional AAC use';
    return 'Communication assessment needed';
  }
  
  private suggestGoalsFromUsage(aacData: any): string[] {
    const goals = ['Increase communication frequency'];
    
    if (aacData.childAge < 5) {
      goals.push('Early intervention support', 'Family training');
    }
    
    if (aacData.diagnosisFromUsage.includes('autism')) {
      goals.push('Social communication', 'AAC device training');
    }
    
    return goals;
  }
  
  private inferUrgencyFromUsage(usageDuration: number): 'immediate' | 'within_week' | 'within_month' | 'exploring' {
    if (usageDuration > 30) return 'immediate';
    if (usageDuration > 14) return 'within_week';
    if (usageDuration > 7) return 'within_month';
    return 'exploring';
  }
  
  private calculateConversionProbability(leadScore: number, aacData: any): number {
    let probability = leadScore / 100 * 0.6; // Base from lead score
    
    // AAC usage indicates serious need
    if (aacData.usageDuration > 14) probability += 0.3;
    else if (aacData.usageDuration > 7) probability += 0.2;
    
    return Math.min(1, probability);
  }
  
  private calculateUrgencyScore(aacData: any): number {
    if (aacData.usageDuration > 30) return 90;
    if (aacData.usageDuration > 14) return 75;
    if (aacData.usageDuration > 7) return 60;
    return 40;
  }
  
  private identifyQualityIndicators(aacData: any): string[] {
    const indicators = [];
    
    if (aacData.usageDuration > 30) indicators.push('Long-term AAC user');
    if (aacData.appEngagement > 80) indicators.push('High engagement');
    if (aacData.childAge < 5) indicators.push('Early intervention age');
    
    return indicators;
  }
  
  private async matchQualifiedTherapists(lead: ParentLead): Promise<string[]> {
    // Mock implementation - would integrate with therapist directory
    return ['therapist_001', 'therapist_002', 'therapist_003'];
  }
  
  private updateLeadAnalytics(lead: ParentLead): void {
    this.analytics.overview.totalLeads += 1;
    this.analytics.overview.activeLeads += 1;
    this.analytics.overview.avgLeadPrice = 
      (this.analytics.overview.avgLeadPrice * (this.analytics.overview.totalLeads - 1) + 
       lead.marketplace.pricing.finalPrice) / this.analytics.overview.totalLeads;
  }
  
  private async getTherapistProfile(therapistId: string): Promise<any> {
    // Mock implementation
    return { 
      id: therapistId, 
      subscription: 'pro',
      specialties: ['autism', 'aac'],
      location: { lat: 30.2672, lng: -97.7431 },
      experienceYears: 8
    };
  }
  
  private calculateTherapistLeadMatch(therapist: any, lead: ParentLead): number {
    let score = 50;
    
    // Specialty match
    if (therapist.specialties.includes(lead.child.diagnosis.toLowerCase())) {
      score += 30;
    }
    
    // Location proximity
    const distance = this.calculateDistance(
      therapist.location,
      lead.requirements.location.coordinates
    );
    if (distance <= 10) score += 20;
    else if (distance <= 25) score += 10;
    
    // Experience with age group
    if (lead.child.age < 5 && therapist.experienceYears > 5) score += 15;
    
    return Math.min(100, score);
  }
  
  private estimateLeadROI(lead: ParentLead, therapist: any): number {
    const avgSessionValue = 150;
    const expectedSessions = 20; // Conservative estimate
    const conversionProb = lead.scoring.conversionProbability;
    
    const expectedRevenue = avgSessionValue * expectedSessions * conversionProb;
    const leadCost = lead.marketplace.pricing.finalPrice;
    
    return ((expectedRevenue - leadCost) / leadCost) * 100;
  }
  
  private calculateFinalPrice(lead: ParentLead, subscription: string): number {
    let price = lead.marketplace.pricing.finalPrice;
    
    // Subscription discounts
    if (subscription === 'enterprise') price *= 0.7;
    else if (subscription === 'practice_plus') price *= 0.8;
    else if (subscription === 'pro') price *= 0.9;
    
    return Math.round(price);
  }
  
  private async processPayment(therapistId: string, amount: number, paymentMethod: string): Promise<boolean> {
    // Mock payment processing
    console.log(`Processing $${amount} payment for therapist ${therapistId} via ${paymentMethod}`);
    return true;
  }
  
  private async notifyParentOfTherapistContact(lead: ParentLead, therapist: any): Promise<void> {
    console.log(`Notifying parent ${lead.parent.email} that therapist ${therapist.id} will be contacting them`);
  }
  
  private async updateTherapistPerformance(therapistId: string, milestone: string): Promise<void> {
    console.log(`Updating performance for therapist ${therapistId}: ${milestone}`);
  }
  
  private calculateOverallConversionRate(): number {
    const totalPurchases = Array.from(this.purchases.values()).length;
    const conversions = Array.from(this.purchases.values()).filter(p => p.tracking.converted).length;
    return totalPurchases > 0 ? (conversions / totalPurchases) * 100 : 0;
  }
  
  private calculateDistance(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private initializeAnalytics(): void {
    this.analytics = {
      overview: {
        totalLeads: 0,
        activeLeads: 0,
        soldLeads: 0,
        conversionRate: 0,
        avgLeadPrice: 0,
        totalRevenue: 0
      },
      trends: {
        leadsPerWeek: [23, 31, 45, 52, 67, 73, 89],
        salesPerWeek: [18, 24, 35, 41, 52, 58, 71],
        revenuePerWeek: [890, 1240, 1675, 2050, 2580, 2940, 3550],
        conversionTrend: [78, 82, 85, 88, 92, 91, 89]
      },
      demographics: {
        ageDistribution: { '2-4': 35, '5-7': 28, '8-12': 22, '13+': 15 },
        diagnosisBreakdown: { 'autism': 45, 'apraxia': 25, 'language_delay': 20, 'other': 10 },
        locationHeatmap: [
          { zipCode: '78701', leads: 23, avgPrice: 65 },
          { zipCode: '78702', leads: 18, avgPrice: 58 },
          { zipCode: '78703', leads: 31, avgPrice: 72 }
        ],
        urgencyDistribution: { 'immediate': 25, 'within_week': 35, 'within_month': 30, 'exploring': 10 }
      },
      therapistMetrics: {
        topPurchasers: [
          { therapistId: 'slp_001', leadsPerMonth: 8, conversionRate: 85, avgROI: 340 },
          { therapistId: 'slp_002', leadsPerMonth: 6, conversionRate: 78, avgROI: 290 }
        ],
        satisfactionScores: { 'lead_quality': 4.6, 'response_time': 4.8, 'conversion_rate': 4.4 }
      }
    };
  }
  
  private loadSampleData(): void {
    // Create sample leads for demonstration
    console.log('Lead Marketplace Service initialized with sample data');
  }
}

export const leadMarketplaceService = LeadMarketplaceService.getInstance();
export default leadMarketplaceService;