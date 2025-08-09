/**
 * Feature Gate Service
 * Controls access to features based on subscription tier
 * Enforces limits and provides upgrade prompts
 */

import { subscriptionTiersService } from './subscription-tiers-service';
import type { SubscriptionTier, FeatureAccess } from './subscription-tiers-service';

export interface FeatureGate {
  feature: keyof FeatureAccess;
  tier: SubscriptionTier;
  displayName: string;
  description: string;
  upgradeMessage: string;
}

class FeatureGateService {
  private static instance: FeatureGateService;
  
  // Feature definitions with required tiers
  private readonly featureGates: FeatureGate[] = [
    // Billing Features - Professional Tier
    {
      feature: 'billingIntegration',
      tier: 'professional',
      displayName: 'Billing Integration',
      description: 'Process insurance claims and track reimbursements',
      upgradeMessage: 'Upgrade to Professional ($15/mo) to unlock billing features'
    },
    {
      feature: 'medicareMediaidBilling',
      tier: 'professional',
      displayName: 'Medicare/Medicaid Billing',
      description: 'Submit claims to Medicare and Medicaid',
      upgradeMessage: 'Professional plan required for Medicare/Medicaid billing'
    },
    {
      feature: 'cptCodeGeneration',
      tier: 'professional',
      displayName: 'CPT Code Generation',
      description: 'Automatically generate billing codes',
      upgradeMessage: 'Upgrade to Professional to auto-generate CPT codes'
    },
    {
      feature: 'electronicClaims',
      tier: 'professional',
      displayName: 'Electronic Claims',
      description: 'Submit claims electronically to clearinghouses',
      upgradeMessage: 'Electronic claim submission requires Professional plan'
    },
    
    // AI Features - Enterprise Tier
    {
      feature: 'aiReportWriting',
      tier: 'enterprise',
      displayName: 'AI Report Writing',
      description: 'Generate reports automatically with AI',
      upgradeMessage: 'Upgrade to Enterprise ($30/mo) for AI report writing'
    },
    {
      feature: 'aiIEPGoals',
      tier: 'enterprise',
      displayName: 'AI IEP Goals',
      description: 'Generate IEP goals in seconds',
      upgradeMessage: 'Enterprise plan unlocks AI-generated IEP goals'
    },
    {
      feature: 'aiProgressNotes',
      tier: 'enterprise',
      displayName: 'AI Progress Notes',
      description: 'Auto-generate session notes with AI',
      upgradeMessage: 'Save 2+ hours daily with Enterprise AI features'
    },
    {
      feature: 'aiTreatmentPlans',
      tier: 'enterprise',
      displayName: 'AI Treatment Plans',
      description: 'Create comprehensive treatment plans instantly',
      upgradeMessage: 'Enterprise AI creates treatment plans in seconds'
    }
  ];

  private constructor() {
    this.initialize();
  }

  static getInstance(): FeatureGateService {
    if (!FeatureGateService.instance) {
      FeatureGateService.instance = new FeatureGateService();
    }
    return FeatureGateService.instance;
  }

  private initialize(): void {
    console.log('🔒 Feature Gate Service initialized');
  }

  /**
   * Check if user can access a feature
   */
  canAccess(userId: string, feature: keyof FeatureAccess): boolean {
    return subscriptionTiersService.hasAccess(userId, feature);
  }

  /**
   * Gate a feature and return access status with upgrade info
   */
  gateFeature(
    userId: string,
    feature: keyof FeatureAccess
  ): {
    allowed: boolean;
    requiredTier?: SubscriptionTier;
    upgradeMessage?: string;
    trialAvailable?: boolean;
  } {
    const hasAccess = this.canAccess(userId, feature);
    
    if (hasAccess) {
      return { allowed: true };
    }
    
    // Find required tier for this feature
    const gate = this.featureGates.find(g => g.feature === feature);
    const subscription = subscriptionTiersService.getUserSubscription(userId);
    
    return {
      allowed: false,
      requiredTier: gate?.tier,
      upgradeMessage: gate?.upgradeMessage || 'Upgrade required for this feature',
      trialAvailable: subscription.currentTier === 'free'
    };
  }

  /**
   * Check billing features access
   */
  canAccessBilling(userId: string): boolean {
    return subscriptionTiersService.hasBillingAccess(userId);
  }

  /**
   * Check AI features access
   */
  canAccessAI(userId: string): boolean {
    return subscriptionTiersService.hasAIAccess(userId);
  }

  /**
   * Gate billing feature with specific check
   */
  gateBillingFeature(userId: string, featureName: string): {
    allowed: boolean;
    message?: string;
    showUpgrade?: boolean;
  } {
    if (this.canAccessBilling(userId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: `${featureName} requires Professional plan ($15/mo)`,
      showUpgrade: true
    };
  }

  /**
   * Gate AI feature with specific check
   */
  gateAIFeature(userId: string, featureName: string): {
    allowed: boolean;
    message?: string;
    showUpgrade?: boolean;
    estimatedTimeSaved?: string;
  } {
    if (this.canAccessAI(userId)) {
      return { allowed: true };
    }

    const timeSavings: Record<string, string> = {
      'Progress Notes': '30 minutes per session',
      'IEP Goals': '4 hours per student',
      'Treatment Plans': '2 hours per plan',
      'Discharge Summaries': '1 hour per patient',
      'Research Reports': '8 hours per report'
    };

    return {
      allowed: false,
      message: `${featureName} requires Enterprise plan ($30/mo)`,
      showUpgrade: true,
      estimatedTimeSaved: timeSavings[featureName] || '2+ hours'
    };
  }

  /**
   * Check usage limit
   */
  checkLimit(
    userId: string,
    limitType: 'patients' | 'sessions' | 'reports' | 'storage',
    currentValue: number
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    percentUsed: number;
    upgradeRequired?: boolean;
    suggestedTier?: SubscriptionTier;
  } {
    const subscription = subscriptionTiersService.getUserSubscription(userId);
    const limits = subscription.plan.limits;
    
    let limit = 0;
    switch (limitType) {
      case 'patients':
        limit = limits.maxPatients;
        break;
      case 'sessions':
        limit = limits.maxSessions;
        break;
      case 'reports':
        limit = limits.maxReportsPerMonth;
        break;
      case 'storage':
        limit = limits.storageGB;
        break;
    }
    
    const remaining = Math.max(0, limit - currentValue);
    const percentUsed = (currentValue / limit) * 100;
    const allowed = currentValue < limit;
    
    let suggestedTier: SubscriptionTier | undefined;
    if (!allowed) {
      // Suggest upgrade based on current tier
      if (subscription.currentTier === 'free') {
        suggestedTier = 'professional';
      } else if (subscription.currentTier === 'professional') {
        suggestedTier = 'enterprise';
      }
    }
    
    return {
      allowed,
      limit,
      remaining,
      percentUsed,
      upgradeRequired: !allowed,
      suggestedTier
    };
  }

  /**
   * Show upgrade prompt
   */
  showUpgradePrompt(
    feature: keyof FeatureAccess,
    _context?: {
      currentAction?: string;
      potentialValue?: string;
    }
  ): {
    title: string;
    message: string;
    benefits: string[];
    cta: string;
    trialAvailable: boolean;
  } {
    const gate = this.featureGates.find(g => g.feature === feature);
    const requiredTier = gate?.tier || 'professional';
    
    const benefits = this.getTierBenefits(requiredTier);
    
    return {
      title: `Upgrade to ${requiredTier === 'professional' ? 'Professional' : 'Enterprise AI'}`,
      message: gate?.upgradeMessage || 'This feature requires an upgrade',
      benefits,
      cta: requiredTier === 'professional' 
        ? 'Unlock Billing Features - $15/mo'
        : 'Unlock AI Features - $30/mo',
      trialAvailable: true
    };
  }

  /**
   * Get tier benefits for upgrade prompt
   */
  private getTierBenefits(tier: SubscriptionTier): string[] {
    if (tier === 'professional') {
      return [
        '✓ Medicare/Medicaid billing',
        '✓ Auto CPT code generation',
        '✓ Electronic claims submission',
        '✓ Reimbursement tracking',
        '✓ 100 patient profiles',
        '✓ QuickBooks export'
      ];
    } else if (tier === 'enterprise') {
      return [
        '✓ AI writes progress notes (saves 30min/session)',
        '✓ AI generates IEP goals (saves 4hr/student)',
        '✓ AI creates treatment plans instantly',
        '✓ AI research report generation',
        '✓ Everything in Professional',
        '✓ Unlimited everything'
      ];
    }
    return [];
  }

  /**
   * Track feature attempt (for analytics)
   */
  trackFeatureAttempt(
    userId: string,
    feature: keyof FeatureAccess,
    allowed: boolean
  ): void {
    // Track for conversion analytics
    const event = {
      userId,
      feature,
      allowed,
      timestamp: new Date(),
      currentTier: subscriptionTiersService.getUserSubscription(userId).currentTier
    };
    
    // In production, send to analytics service
    console.log('Feature attempt:', event);
    
    // If blocked, increment counter for upgrade prompts
    if (!allowed) {
      this.incrementBlockedAttempts(userId, feature);
    }
  }

  /**
   * Track blocked attempts for smart upgrade prompts
   */
  private blockedAttempts: Map<string, Map<string, number>> = new Map();
  
  private incrementBlockedAttempts(userId: string, feature: keyof FeatureAccess): void {
    if (!this.blockedAttempts.has(userId)) {
      this.blockedAttempts.set(userId, new Map());
    }
    
    const userAttempts = this.blockedAttempts.get(userId)!;
    const current = userAttempts.get(feature) || 0;
    userAttempts.set(feature, current + 1);
    
    // Show special offer after 3 attempts
    if (current + 1 === 3) {
      this.triggerSpecialOffer(userId, feature);
    }
  }

  /**
   * Trigger special offer for frequently attempted features
   */
  private triggerSpecialOffer(userId: string, feature: keyof FeatureAccess): void {
    const gate = this.featureGates.find(g => g.feature === feature);
    if (!gate) return;
    
    // In production, this would trigger a special offer modal or email
    console.log(`Special offer triggered for user ${userId} - feature: ${feature}`);
    
    // Could offer extended trial or discount
    const offer = {
      userId,
      feature,
      tier: gate.tier,
      discount: 0.2, // 20% off first month
      message: `You've tried to use ${gate.displayName} 3 times. Get 20% off your first month!`
    };
    
    // Store offer for later retrieval
    localStorage.setItem(`special_offer_${userId}`, JSON.stringify(offer));
  }

  /**
   * Get active special offers for user
   */
  getSpecialOffers(userId: string): {
    userId: string;
    feature: string;
    tier: SubscriptionTier;
    discount: number;
    message: string;
  } | null {
    const stored = localStorage.getItem(`special_offer_${userId}`);
    return stored ? JSON.parse(stored) : null;
  }
}

// Export singleton
export const featureGateService = FeatureGateService.getInstance();

// Export for use in other services
export function getFeatureGateService(): FeatureGateService {
  return FeatureGateService.getInstance();
}

// React Hook for feature gating
export function useFeatureGate(feature: keyof FeatureAccess) {
  const userId = 'current_user'; // In production, get from auth context
  
  const gate = featureGateService.gateFeature(userId, feature);
  
  return {
    allowed: gate.allowed,
    requiresUpgrade: !gate.allowed,
    requiredTier: gate.requiredTier,
    message: gate.upgradeMessage,
    canTrial: gate.trialAvailable,
    
    // Helper to execute gated action
    executeIfAllowed: (action: () => void, onBlocked?: () => void) => {
      if (gate.allowed) {
        action();
      } else {
        featureGateService.trackFeatureAttempt(userId, feature, false);
        if (onBlocked) {
          onBlocked();
        } else {
          // Default: show upgrade prompt
          alert(gate.upgradeMessage);
        }
      }
    }
  };
}

// React Hook for billing features
export function useBillingGate() {
  const userId = 'current_user';
  const canAccess = featureGateService.canAccessBilling(userId);
  
  return {
    canAccessBilling: canAccess,
    requiresUpgrade: !canAccess,
    upgradeMessage: 'Billing features require Professional plan ($15/mo)',
    
    gateBillingAction: (action: () => void, featureName: string) => {
      const gate = featureGateService.gateBillingFeature(userId, featureName);
      if (gate.allowed) {
        action();
      } else {
        alert(gate.message);
      }
    }
  };
}

// React Hook for AI features  
export function useAIGate() {
  const userId = 'current_user';
  const canAccess = featureGateService.canAccessAI(userId);
  
  return {
    canAccessAI: canAccess,
    requiresUpgrade: !canAccess,
    upgradeMessage: 'AI features require Enterprise plan ($30/mo)',
    
    gateAIAction: (action: () => void, featureName: string) => {
      const gate = featureGateService.gateAIFeature(userId, featureName);
      if (gate.allowed) {
        action();
      } else {
        const message = gate.estimatedTimeSaved 
          ? `${gate.message}\n\nThis feature saves ${gate.estimatedTimeSaved}!`
          : gate.message;
        alert(message);
      }
    }
  };
}