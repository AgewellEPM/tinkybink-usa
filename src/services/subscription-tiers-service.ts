/**
 * Subscription Tiers Service
 * Manages three-tier pricing model for TinkyBink AAC
 * Free: Full access minus billing
 * Professional ($15): All billing features
 * Enterprise ($30): AI report writing + everything
 */

import { getBillingIntegrationService } from '../modules/professional/billing-integration-service';
// Billing workflow imports would be used in production
// import { getAutoBillingWorkflow } from './auto-billing-workflow';
// import { getBillingIntegrationEnhancements } from './enhanced-billing-rates';

export type SubscriptionTier = 'free' | 'professional' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: FeatureAccess;
  limits: UsageLimits;
  description: string;
  popularBadge?: boolean;
  savings?: string;
}

export interface FeatureAccess {
  // Core AAC Features (All Tiers)
  communicationBoards: boolean;
  customTiles: boolean;
  speechSynthesis: boolean;
  symbolLibrary: boolean;
  userProfiles: boolean;
  dataSync: boolean;
  familySharing: boolean;
  basicReporting: boolean;
  
  // Professional Features ($15/month)
  billingIntegration: boolean;
  insuranceClaims: boolean;
  medicareMediaidBilling: boolean;
  cptCodeGeneration: boolean;
  electronicClaims: boolean;
  reimbursementTracking: boolean;
  authorizationManagement: boolean;
  copayTracking: boolean;
  claimStatusTracking: boolean;
  denialManagement: boolean;
  billingReports: boolean;
  exportToQuickBooks: boolean;
  
  // Enterprise Features ($30/month)
  aiReportWriting: boolean;
  aiProgressNotes: boolean;
  aiIEPGoals: boolean;
  aiTreatmentPlans: boolean;
  aiDischargeSummaries: boolean;
  aiLettersOfMedicalNecessity: boolean;
  aiResearchReports: boolean;
  aiFundingApplications: boolean;
  aiOutcomesPrediction: boolean;
  aiSessionDocumentation: boolean;
  aiParentCommunication: boolean;
  aiPeerReviewedArticles: boolean;
  customAITemplates: boolean;
  bulkReportGeneration: boolean;
  
  // Additional Enterprise Benefits
  prioritySupport: boolean;
  apiAccess: boolean;
  whiteLabeling: boolean;
  multiOrganization: boolean;
  advancedAnalytics: boolean;
  unlimitedStorage: boolean;
  teamCollaboration: boolean;
  customIntegrations: boolean;
}

export interface UsageLimits {
  maxPatients: number;
  maxSessions: number;
  maxReportsPerMonth: number;
  maxTeamMembers: number;
  storageGB: number;
  apiCallsPerMonth: number;
  customBoards: number;
  exportFormats: string[];
}

export interface UserSubscription {
  userId: string;
  currentTier: SubscriptionTier;
  plan: SubscriptionPlan;
  status: 'active' | 'trialing' | 'cancelled' | 'past_due' | 'paused';
  startDate: Date;
  nextBillingDate?: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: PaymentMethod;
  billingHistory: BillingRecord[];
  usage: UsageMetrics;
  trialEndsAt?: Date;
}

export interface PaymentMethod {
  type: 'card' | 'bank' | 'paypal';
  last4: string;
  brand?: string;
  isDefault: boolean;
}

export interface BillingRecord {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
  description: string;
}

export interface UsageMetrics {
  currentPatients: number;
  sessionsThisMonth: number;
  reportsGeneratedThisMonth: number;
  storageUsedGB: number;
  apiCallsThisMonth: number;
  lastActivityDate: Date;
}

class SubscriptionTiersService {
  private static instance: SubscriptionTiersService;
  private userSubscriptions: Map<string, UserSubscription> = new Map();
  private billingService = getBillingIntegrationService();
  
  // Subscription Plans
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'free_tier',
      name: 'Community Edition',
      tier: 'free',
      price: 0,
      billingCycle: 'monthly',
      description: 'Full AAC features for individuals and families. Perfect for personal use.',
      features: {
        // Core Features - ALL FREE!
        communicationBoards: true,
        customTiles: true,
        speechSynthesis: true,
        symbolLibrary: true,
        userProfiles: true,
        dataSync: true,
        familySharing: true,
        basicReporting: true,
        
        // Professional Features - NOT AVAILABLE
        billingIntegration: false,
        insuranceClaims: false,
        medicareMediaidBilling: false,
        cptCodeGeneration: false,
        electronicClaims: false,
        reimbursementTracking: false,
        authorizationManagement: false,
        copayTracking: false,
        claimStatusTracking: false,
        denialManagement: false,
        billingReports: false,
        exportToQuickBooks: false,
        
        // Enterprise Features - NOT AVAILABLE
        aiReportWriting: false,
        aiProgressNotes: false,
        aiIEPGoals: false,
        aiTreatmentPlans: false,
        aiDischargeSummaries: false,
        aiLettersOfMedicalNecessity: false,
        aiResearchReports: false,
        aiFundingApplications: false,
        aiOutcomesPrediction: false,
        aiSessionDocumentation: false,
        aiParentCommunication: false,
        aiPeerReviewedArticles: false,
        customAITemplates: false,
        bulkReportGeneration: false,
        
        // Additional Benefits
        prioritySupport: false,
        apiAccess: false,
        whiteLabeling: false,
        multiOrganization: false,
        advancedAnalytics: false,
        unlimitedStorage: false,
        teamCollaboration: false,
        customIntegrations: false
      },
      limits: {
        maxPatients: 10,
        maxSessions: 100,
        maxReportsPerMonth: 10,
        maxTeamMembers: 1,
        storageGB: 5,
        apiCallsPerMonth: 0,
        customBoards: 50,
        exportFormats: ['PDF', 'PNG']
      }
    },
    {
      id: 'professional_tier',
      name: 'Professional',
      tier: 'professional',
      price: 15,
      billingCycle: 'monthly',
      description: 'Complete billing integration for therapists and clinics. Medicare/Medicaid ready.',
      popularBadge: true,
      features: {
        // Core Features - ALL INCLUDED
        communicationBoards: true,
        customTiles: true,
        speechSynthesis: true,
        symbolLibrary: true,
        userProfiles: true,
        dataSync: true,
        familySharing: true,
        basicReporting: true,
        
        // Professional Features - ALL INCLUDED!
        billingIntegration: true,
        insuranceClaims: true,
        medicareMediaidBilling: true,
        cptCodeGeneration: true,
        electronicClaims: true,
        reimbursementTracking: true,
        authorizationManagement: true,
        copayTracking: true,
        claimStatusTracking: true,
        denialManagement: true,
        billingReports: true,
        exportToQuickBooks: true,
        
        // Enterprise Features - NOT AVAILABLE
        aiReportWriting: false,
        aiProgressNotes: false,
        aiIEPGoals: false,
        aiTreatmentPlans: false,
        aiDischargeSummaries: false,
        aiLettersOfMedicalNecessity: false,
        aiResearchReports: false,
        aiFundingApplications: false,
        aiOutcomesPrediction: false,
        aiSessionDocumentation: false,
        aiParentCommunication: false,
        aiPeerReviewedArticles: false,
        customAITemplates: false,
        bulkReportGeneration: false,
        
        // Additional Benefits
        prioritySupport: false,
        apiAccess: false,
        whiteLabeling: false,
        multiOrganization: false,
        advancedAnalytics: true,
        unlimitedStorage: false,
        teamCollaboration: true,
        customIntegrations: false
      },
      limits: {
        maxPatients: 100,
        maxSessions: 1000,
        maxReportsPerMonth: 50,
        maxTeamMembers: 5,
        storageGB: 25,
        apiCallsPerMonth: 1000,
        customBoards: 200,
        exportFormats: ['PDF', 'PNG', 'CSV', 'Excel']
      }
    },
    {
      id: 'enterprise_tier',
      name: 'Enterprise AI',
      tier: 'enterprise',
      price: 30,
      billingCycle: 'monthly',
      description: 'AI-powered report writing, IEP goals, and research. Everything included.',
      savings: 'Save 4+ hours per day',
      features: {
        // Core Features - ALL INCLUDED
        communicationBoards: true,
        customTiles: true,
        speechSynthesis: true,
        symbolLibrary: true,
        userProfiles: true,
        dataSync: true,
        familySharing: true,
        basicReporting: true,
        
        // Professional Features - ALL INCLUDED
        billingIntegration: true,
        insuranceClaims: true,
        medicareMediaidBilling: true,
        cptCodeGeneration: true,
        electronicClaims: true,
        reimbursementTracking: true,
        authorizationManagement: true,
        copayTracking: true,
        claimStatusTracking: true,
        denialManagement: true,
        billingReports: true,
        exportToQuickBooks: true,
        
        // Enterprise Features - ALL INCLUDED!
        aiReportWriting: true,
        aiProgressNotes: true,
        aiIEPGoals: true,
        aiTreatmentPlans: true,
        aiDischargeSummaries: true,
        aiLettersOfMedicalNecessity: true,
        aiResearchReports: true,
        aiFundingApplications: true,
        aiOutcomesPrediction: true,
        aiSessionDocumentation: true,
        aiParentCommunication: true,
        aiPeerReviewedArticles: true,
        customAITemplates: true,
        bulkReportGeneration: true,
        
        // Additional Benefits - ALL INCLUDED!
        prioritySupport: true,
        apiAccess: true,
        whiteLabeling: true,
        multiOrganization: true,
        advancedAnalytics: true,
        unlimitedStorage: true,
        teamCollaboration: true,
        customIntegrations: true
      },
      limits: {
        maxPatients: 999999, // Unlimited
        maxSessions: 999999, // Unlimited
        maxReportsPerMonth: 999999, // Unlimited
        maxTeamMembers: 999999, // Unlimited
        storageGB: 999999, // Unlimited
        apiCallsPerMonth: 999999, // Unlimited
        customBoards: 999999, // Unlimited
        exportFormats: ['PDF', 'PNG', 'CSV', 'Excel', 'Word', 'JSON', 'XML', 'HL7']
      }
    }
  ];

  // Yearly pricing with 20% discount
  private readonly yearlyPlans = this.plans.map(plan => ({
    ...plan,
    id: `${plan.id}_yearly`,
    billingCycle: 'yearly' as const,
    price: plan.price * 12 * 0.8, // 20% discount
    savings: plan.price > 0 ? `Save $${(plan.price * 12 * 0.2).toFixed(0)}/year` : undefined
  }));

  private constructor() {
    this.initialize();
  }

  static getInstance(): SubscriptionTiersService {
    if (!SubscriptionTiersService.instance) {
      SubscriptionTiersService.instance = new SubscriptionTiersService();
    }
    return SubscriptionTiersService.instance;
  }

  private initialize(): void {
    console.log('💎 Subscription Tiers Service initialized');
    this.loadSubscriptions();
    this.startUsageTracking();
  }

  /**
   * Get user's current subscription
   */
  getUserSubscription(userId: string): UserSubscription {
    let subscription = this.userSubscriptions.get(userId);
    
    if (!subscription) {
      // Default to free tier
      subscription = this.createFreeSubscription(userId);
      this.userSubscriptions.set(userId, subscription);
    }
    
    return subscription;
  }

  /**
   * Check if user has access to a feature
   */
  hasAccess(userId: string, feature: keyof FeatureAccess): boolean {
    const subscription = this.getUserSubscription(userId);
    return subscription.plan.features[feature];
  }

  /**
   * Check if user has billing features
   */
  hasBillingAccess(userId: string): boolean {
    const subscription = this.getUserSubscription(userId);
    return subscription.plan.features.billingIntegration;
  }

  /**
   * Check if user has AI features
   */
  hasAIAccess(userId: string): boolean {
    const subscription = this.getUserSubscription(userId);
    return subscription.plan.features.aiReportWriting;
  }

  /**
   * Upgrade user subscription
   */
  async upgradeSubscription(
    userId: string,
    newTier: SubscriptionTier,
    paymentMethod?: PaymentMethod
  ): Promise<{ success: boolean; subscription?: UserSubscription; error?: string }> {
    const currentSub = this.getUserSubscription(userId);
    
    // Validate upgrade path
    if (currentSub.currentTier === newTier) {
      return { success: false, error: 'Already on this plan' };
    }
    
    // Get new plan
    const newPlan = this.plans.find(p => p.tier === newTier);
    if (!newPlan) {
      return { success: false, error: 'Invalid plan' };
    }
    
    // Check payment method for paid plans
    if (newPlan.price > 0 && !paymentMethod && !currentSub.paymentMethod) {
      return { success: false, error: 'Payment method required' };
    }
    
    // Process upgrade
    try {
      // Calculate prorated amount if upgrading mid-cycle
      const proratedAmount = this.calculateProration(currentSub, newPlan);
      
      // Process payment if needed
      if (proratedAmount > 0) {
        const paymentResult = await this.processPayment(
          userId,
          proratedAmount,
          paymentMethod || currentSub.paymentMethod!
        );
        
        if (!paymentResult.success) {
          return { success: false, error: 'Payment failed' };
        }
      }
      
      // Update subscription
      currentSub.currentTier = newTier;
      currentSub.plan = newPlan;
      currentSub.status = 'active';
      currentSub.nextBillingDate = this.calculateNextBillingDate(newPlan);
      
      if (paymentMethod) {
        currentSub.paymentMethod = paymentMethod;
      }
      
      // Add billing record
      currentSub.billingHistory.push({
        id: `bill_${Date.now()}`,
        date: new Date(),
        amount: proratedAmount,
        status: 'paid',
        description: `Upgraded to ${newPlan.name}`
      });
      
      // Enable features immediately
      this.enableTierFeatures(userId, newTier);
      
      // Save
      this.saveSubscriptions();
      
      // Send confirmation
      await this.sendUpgradeConfirmation(userId, newPlan);
      
      return { success: true, subscription: currentSub };
      
    } catch (error) {
      console.error('Upgrade failed:', error);
      return { success: false, error: 'Upgrade processing failed' };
    }
  }

  /**
   * Downgrade subscription
   */
  async downgradeSubscription(
    userId: string,
    newTier: SubscriptionTier
  ): Promise<{ success: boolean; message: string }> {
    const currentSub = this.getUserSubscription(userId);
    
    // Set to cancel at period end
    currentSub.cancelAtPeriodEnd = true;
    
    // Schedule downgrade
    const message = `Your subscription will be downgraded to ${newTier} at the end of your current billing period (${currentSub.nextBillingDate?.toLocaleDateString()})`;
    
    this.saveSubscriptions();
    
    return { success: true, message };
  }

  /**
   * Start free trial
   */
  async startFreeTrial(
    userId: string,
    tier: 'professional' | 'enterprise',
    days: number = 14
  ): Promise<UserSubscription> {
    const plan = this.plans.find(p => p.tier === tier)!;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + days);
    
    const subscription: UserSubscription = {
      userId,
      currentTier: tier,
      plan,
      status: 'trialing',
      startDate: new Date(),
      trialEndsAt: trialEndDate,
      cancelAtPeriodEnd: false,
      billingHistory: [],
      usage: {
        currentPatients: 0,
        sessionsThisMonth: 0,
        reportsGeneratedThisMonth: 0,
        storageUsedGB: 0,
        apiCallsThisMonth: 0,
        lastActivityDate: new Date()
      }
    };
    
    this.userSubscriptions.set(userId, subscription);
    this.enableTierFeatures(userId, tier);
    this.saveSubscriptions();
    
    // Schedule trial end reminder
    this.scheduleTrialReminders(userId, trialEndDate);
    
    return subscription;
  }

  /**
   * Check and enforce usage limits
   */
  checkUsageLimit(
    userId: string,
    limitType: keyof UsageLimits,
    currentValue: number
  ): { allowed: boolean; limit: number; current: number; upgradeRequired?: SubscriptionTier } {
    const subscription = this.getUserSubscription(userId);
    const limit = subscription.plan.limits[limitType] as number;
    
    if (currentValue >= limit) {
      // Suggest upgrade
      const upgradePlan = this.plans.find(p => 
        (p.limits[limitType] as number) > limit && p.price > subscription.plan.price
      );
      
      return {
        allowed: false,
        limit,
        current: currentValue,
        upgradeRequired: upgradePlan?.tier
      };
    }
    
    return {
      allowed: true,
      limit,
      current: currentValue
    };
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(userId: string, feature: string, _metadata?: Record<string, unknown>): void {
    const subscription = this.getUserSubscription(userId);
    
    // Update usage metrics
    subscription.usage.lastActivityDate = new Date();
    
    // Track specific metrics
    switch (feature) {
      case 'create_patient':
        subscription.usage.currentPatients++;
        break;
      case 'complete_session':
        subscription.usage.sessionsThisMonth++;
        break;
      case 'generate_report':
        subscription.usage.reportsGeneratedThisMonth++;
        break;
      case 'api_call':
        subscription.usage.apiCallsThisMonth++;
        break;
    }
    
    // Check limits
    Object.keys(subscription.plan.limits).forEach(limitKey => {
      const limit = limitKey as keyof UsageLimits;
      const currentValue = this.getCurrentUsageValue(subscription.usage, limit);
      const check = this.checkUsageLimit(userId, limit, currentValue);
      
      if (!check.allowed) {
        this.notifyLimitReached(userId, limit, { upgradeRequired: !!check.upgradeRequired });
      }
    });
    
    this.saveSubscriptions();
  }

  /**
   * Get pricing display data
   */
  getPricingPlans(billingCycle: 'monthly' | 'yearly' = 'monthly'): SubscriptionPlan[] {
    return billingCycle === 'monthly' ? this.plans : this.yearlyPlans;
  }

  /**
   * Get feature comparison matrix
   */
  getFeatureComparison(): {
    categories: {
      name: string;
      features: {
        name: string;
        free: boolean | string;
        professional: boolean | string;
        enterprise: boolean | string;
      }[];
    }[];
  } {
    return {
      categories: [
        {
          name: 'Core AAC Features',
          features: [
            { name: 'Communication Boards', free: true, professional: true, enterprise: true },
            { name: 'Custom Tiles & Symbols', free: true, professional: true, enterprise: true },
            { name: 'Speech Synthesis', free: true, professional: true, enterprise: true },
            { name: 'Family Sharing', free: true, professional: true, enterprise: true },
            { name: 'Data Sync', free: true, professional: true, enterprise: true },
            { name: 'Basic Reports', free: true, professional: true, enterprise: true }
          ]
        },
        {
          name: 'Billing & Insurance',
          features: [
            { name: 'Medicare/Medicaid Billing', free: false, professional: true, enterprise: true },
            { name: 'CPT Code Generation', free: false, professional: true, enterprise: true },
            { name: 'Electronic Claims', free: false, professional: true, enterprise: true },
            { name: 'Reimbursement Tracking', free: false, professional: true, enterprise: true },
            { name: 'Authorization Management', free: false, professional: true, enterprise: true },
            { name: 'QuickBooks Export', free: false, professional: true, enterprise: true }
          ]
        },
        {
          name: 'AI Report Writing',
          features: [
            { name: 'AI Progress Notes', free: false, professional: false, enterprise: true },
            { name: 'AI IEP Goals', free: false, professional: false, enterprise: true },
            { name: 'AI Treatment Plans', free: false, professional: false, enterprise: true },
            { name: 'AI Discharge Summaries', free: false, professional: false, enterprise: true },
            { name: 'AI Research Reports', free: false, professional: false, enterprise: true },
            { name: 'Custom AI Templates', free: false, professional: false, enterprise: true }
          ]
        },
        {
          name: 'Limits',
          features: [
            { name: 'Patients', free: '10', professional: '100', enterprise: 'Unlimited' },
            { name: 'Sessions/Month', free: '100', professional: '1,000', enterprise: 'Unlimited' },
            { name: 'Storage', free: '5 GB', professional: '25 GB', enterprise: 'Unlimited' },
            { name: 'Team Members', free: '1', professional: '5', enterprise: 'Unlimited' },
            { name: 'Priority Support', free: false, professional: false, enterprise: true }
          ]
        }
      ]
    };
  }

  /**
   * Calculate savings for annual vs monthly
   */
  calculateAnnualSavings(tier: SubscriptionTier): number {
    const monthlyPlan = this.plans.find(p => p.tier === tier);
    if (!monthlyPlan || monthlyPlan.price === 0) return 0;
    
    const monthlyCost = monthlyPlan.price * 12;
    const yearlyCost = monthlyPlan.price * 12 * 0.8;
    
    return monthlyCost - yearlyCost;
  }

  // Private helper methods
  
  private createFreeSubscription(userId: string): UserSubscription {
    const freePlan = this.plans.find(p => p.tier === 'free')!;
    
    return {
      userId,
      currentTier: 'free',
      plan: freePlan,
      status: 'active',
      startDate: new Date(),
      cancelAtPeriodEnd: false,
      billingHistory: [],
      usage: {
        currentPatients: 0,
        sessionsThisMonth: 0,
        reportsGeneratedThisMonth: 0,
        storageUsedGB: 0,
        apiCallsThisMonth: 0,
        lastActivityDate: new Date()
      }
    };
  }

  private calculateProration(
    currentSub: UserSubscription,
    newPlan: SubscriptionPlan
  ): number {
    if (!currentSub.nextBillingDate) return newPlan.price;
    
    const now = new Date();
    const daysRemaining = Math.ceil(
      (currentSub.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const daysInPeriod = 30; // Approximate
    const unusedCredit = (currentSub.plan.price * daysRemaining) / daysInPeriod;
    const newCharge = (newPlan.price * daysRemaining) / daysInPeriod;
    
    return Math.max(0, newCharge - unusedCredit);
  }

  private calculateNextBillingDate(plan: SubscriptionPlan): Date {
    const date = new Date();
    
    if (plan.billingCycle === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    return date;
  }

  private async processPayment(
    userId: string,
    amount: number,
    paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; transactionId?: string }> {
    // In production, this would integrate with Stripe/PayPal
    console.log(`Processing payment of $${amount} for user ${userId}`);
    
    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: `txn_${Date.now()}`
        });
      }, 1000);
    });
  }

  private enableTierFeatures(userId: string, tier: SubscriptionTier): void {
    // Enable/disable features based on tier
    const plan = this.plans.find(p => p.tier === tier)!;
    
    // Enable billing features
    if (plan.features.billingIntegration) {
      console.log(`Enabling billing features for user ${userId}`);
      // Enable billing service features
    }
    
    // Enable AI features
    if (plan.features.aiReportWriting) {
      console.log(`Enabling AI features for user ${userId}`);
      // Enable AI service features
    }
  }

  private async sendUpgradeConfirmation(userId: string, plan: SubscriptionPlan): Promise<void> {
    // Send email/notification
    console.log(`Sending upgrade confirmation to user ${userId} for ${plan.name}`);
  }

  private scheduleTrialReminders(userId: string, trialEndDate: Date): void {
    // Schedule reminders at 7 days, 3 days, and 1 day before trial ends
    const reminderDays = [7, 3, 1];
    
    reminderDays.forEach(days => {
      const reminderDate = new Date(trialEndDate);
      reminderDate.setDate(reminderDate.getDate() - days);
      
      if (reminderDate > new Date()) {
        setTimeout(() => {
          this.sendTrialReminder(userId, days);
        }, reminderDate.getTime() - Date.now());
      }
    });
  }

  private sendTrialReminder(userId: string, daysRemaining: number): void {
    console.log(`Trial ending in ${daysRemaining} days for user ${userId}`);
    // Send notification
  }

  private getCurrentUsageValue(usage: UsageMetrics, limit: keyof UsageLimits): number {
    const map: Record<keyof UsageLimits, keyof UsageMetrics | undefined> = {
      maxPatients: 'currentPatients',
      maxSessions: 'sessionsThisMonth',
      maxReportsPerMonth: 'reportsGeneratedThisMonth',
      storageGB: 'storageUsedGB',
      apiCallsPerMonth: 'apiCallsThisMonth',
      maxTeamMembers: undefined,
      customBoards: undefined,
      exportFormats: undefined
    };
    
    const usageKey = map[limit];
    return usageKey ? (usage[usageKey] as number) : 0;
  }

  private notifyLimitReached(
    userId: string,
    limit: keyof UsageLimits,
    check: { upgradeRequired: boolean }
  ): void {
    console.log(`User ${userId} reached limit for ${limit}. Upgrade required: ${check.upgradeRequired}`);
    // Send notification to user
  }

  private startUsageTracking(): void {
    // Reset monthly usage counters
    setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1) { // First day of month
        this.userSubscriptions.forEach(sub => {
          sub.usage.sessionsThisMonth = 0;
          sub.usage.reportsGeneratedThisMonth = 0;
          sub.usage.apiCallsThisMonth = 0;
        });
        this.saveSubscriptions();
      }
    }, 24 * 60 * 60 * 1000); // Daily check
  }

  private loadSubscriptions(): void {
    const saved = localStorage.getItem('user_subscriptions');
    if (saved) {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([userId, sub]: [string, Record<string, unknown>]) => {
        // In production, proper deserialization would be implemented
        this.userSubscriptions.set(userId, sub as unknown as UserSubscription);
      });
    }
  }

  private saveSubscriptions(): void {
    const data: Record<string, UserSubscription> = {};
    this.userSubscriptions.forEach((sub, userId) => {
      data[userId] = sub;
    });
    localStorage.setItem('user_subscriptions', JSON.stringify(data));
  }
}

// Export singleton
export const subscriptionTiersService = SubscriptionTiersService.getInstance();

// Export for use in other services
export function getSubscriptionTiersService(): SubscriptionTiersService {
  return SubscriptionTiersService.getInstance();
}