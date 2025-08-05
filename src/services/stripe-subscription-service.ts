/**
 * Stripe Platform Subscription Service
 * Handles subscription billing for platform access (NOT patient billing)
 */

import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import { authService, UserRole } from './auth-service';
import { mlDataCollection } from './ml-data-collection';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-config';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any
});

// Client-side Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  // Free tier for students
  student_free: {
    id: 'student_free',
    name: 'Student - Free',
    description: 'Free access for AAC users',
    price: 0,
    features: [
      'Unlimited AAC communication',
      'Basic word prediction',
      'Progress tracking',
      'Cloud sync'
    ]
  },
  
  // Parent/Caregiver plans
  parent_basic: {
    id: 'parent_basic',
    name: 'Parent Basic',
    description: 'Monitor one student',
    price: 9.99,
    priceId: process.env.STRIPE_PARENT_BASIC_PRICE_ID,
    features: [
      'Monitor 1 student',
      'Daily progress reports',
      'Communication history',
      'Basic analytics'
    ]
  },
  parent_premium: {
    id: 'parent_premium',
    name: 'Parent Premium',
    description: 'Monitor multiple children',
    price: 19.99,
    priceId: process.env.STRIPE_PARENT_PREMIUM_PRICE_ID,
    features: [
      'Monitor up to 5 students',
      'Real-time alerts',
      'Advanced analytics',
      'Video session recordings',
      'Therapy goal tracking'
    ]
  },
  
  // Teacher plans
  teacher_classroom: {
    id: 'teacher_classroom',
    name: 'Teacher - Classroom',
    description: 'For classroom use',
    price: 29.99,
    priceId: process.env.STRIPE_TEACHER_CLASSROOM_PRICE_ID,
    features: [
      'Up to 30 students',
      'Classroom management',
      'Group activities',
      'Progress reports',
      'Curriculum integration'
    ]
  },
  teacher_school: {
    id: 'teacher_school',
    name: 'Teacher - School',
    description: 'School-wide license',
    price: 199.99,
    priceId: process.env.STRIPE_TEACHER_SCHOOL_PRICE_ID,
    features: [
      'Unlimited students',
      'Multiple teachers',
      'Admin dashboard',
      'Custom branding',
      'Priority support'
    ]
  },
  
  // Therapist/Clinic plans
  therapist_solo: {
    id: 'therapist_solo',
    name: 'Therapist - Solo Practice',
    description: 'Individual practice',
    price: 49.99,
    priceId: process.env.STRIPE_THERAPIST_SOLO_PRICE_ID,
    features: [
      'Up to 50 patients',
      'Medicare/Medicaid billing integration',
      'Session documentation',
      'Progress tracking',
      'Outcome reporting'
    ]
  },
  therapist_clinic: {
    id: 'therapist_clinic',
    name: 'Therapist - Clinic',
    description: 'Multi-therapist clinic',
    price: 299.99,
    priceId: process.env.STRIPE_THERAPIST_CLINIC_PRICE_ID,
    features: [
      'Unlimited patients',
      'Multiple therapists',
      'Billing integration',
      'White labeling',
      'Advanced analytics',
      'API access'
    ]
  },
  
  // Enterprise
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solution',
    price: null, // Custom pricing
    features: [
      'Custom user limits',
      'Dedicated support',
      'Custom integrations',
      'On-premise option',
      'SLA guarantee',
      'Training included'
    ]
  }
};

export interface SubscriptionData {
  userId: string;
  customerId: string;
  subscriptionId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  features: string[];
  usage?: {
    studentsMonitored: number;
    studentsLimit: number;
    apiCallsThisMonth: number;
    storageUsedGB: number;
  };
}

class StripeSubscriptionService {
  private static instance: StripeSubscriptionService;

  private constructor() {}

  static getInstance(): StripeSubscriptionService {
    if (!StripeSubscriptionService.instance) {
      StripeSubscriptionService.instance = new StripeSubscriptionService();
    }
    return StripeSubscriptionService.instance;
  }

  // Get recommended plan based on user role
  getRecommendedPlan(role: UserRole): string {
    switch (role) {
      case 'student':
        return 'student_free';
      case 'parent':
        return 'parent_basic';
      case 'teacher':
        return 'teacher_classroom';
      case 'therapist':
        return 'therapist_solo';
      case 'admin':
        return 'enterprise';
      default:
        return 'student_free';
    }
  }

  // Create Stripe customer
  async createCustomer(userId: string, email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          platform: 'tinkybink_aac'
        }
      });

      // Save customer ID to Firebase
      await updateDoc(doc(db, 'users', userId), {
        stripeCustomerId: customer.id,
        updatedAt: serverTimestamp()
      });

      // Track for ML
      mlDataCollection.trackError(new Error('stripe_customer_created'), {
        customerId: customer.id,
        userId
      });

      return customer.id;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  // Create checkout session for subscription
  async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Get or create customer
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      let customerId = userData?.stripeCustomerId;

      if (!customerId) {
        customerId = await this.createCustomer(
          userId,
          user.email!,
          user.displayName!
        );
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan || !plan.priceId) {
        throw new Error('Invalid plan selected');
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        allow_promotion_codes: true,
        subscription_data: {
          trial_period_days: 14, // 14-day free trial
          metadata: {
            userId,
            planId
          }
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId
        }
      });

      // Track checkout initiation for ML
      mlDataCollection.trackNavigation('pricing', 'stripe_checkout', 'subscription');

      return session.url!;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  // Get user's subscription details
  async getSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (!userData?.stripeCustomerId || !userData?.stripeSubscriptionId) {
        return null;
      }

      const subscription = await stripe.subscriptions.retrieve(
        userData.stripeSubscriptionId
      );

      const plan = Object.values(SUBSCRIPTION_PLANS).find(
        p => p.priceId === subscription.items.data[0]?.price.id
      );

      return {
        userId,
        customerId: userData.stripeCustomerId,
        subscriptionId: subscription.id,
        planId: plan?.id || 'unknown',
        status: subscription.status as any,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        features: plan?.features || [],
        usage: await this.getUsageData(userId, plan?.id)
      };
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Update subscription
  async updateSubscription(userId: string, newPlanId: string): Promise<void> {
    try {
      const subscription = await this.getSubscription(userId);
      if (!subscription) throw new Error('No active subscription');

      const newPlan = SUBSCRIPTION_PLANS[newPlanId as keyof typeof SUBSCRIPTION_PLANS];
      if (!newPlan || !newPlan.priceId) throw new Error('Invalid plan');

      // Update subscription
      await stripe.subscriptions.update(subscription.subscriptionId, {
        items: [{
          id: subscription.subscriptionId,
          price: newPlan.priceId,
        }],
        proration_behavior: 'create_prorations',
      });

      // Update in Firebase
      await updateDoc(doc(db, 'users', userId), {
        subscriptionPlan: newPlanId,
        updatedAt: serverTimestamp()
      });

      // Track for ML
      mlDataCollection.trackNavigation(
        `plan_${subscription.planId}`,
        `plan_${newPlanId}`,
        'subscription_update'
      );
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, immediate: boolean = false): Promise<void> {
    try {
      const subscription = await this.getSubscription(userId);
      if (!subscription) throw new Error('No active subscription');

      if (immediate) {
        await stripe.subscriptions.cancel(subscription.subscriptionId);
      } else {
        await stripe.subscriptions.update(subscription.subscriptionId, {
          cancel_at_period_end: true
        });
      }

      // Update in Firebase
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: immediate ? 'canceled' : 'canceling',
        updatedAt: serverTimestamp()
      });

      // Track for ML
      mlDataCollection.trackError(new Error('subscription_canceled'), {
        userId,
        planId: subscription.planId,
        immediate
      });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Create billing portal session
  async createBillingPortalSession(userId: string, returnUrl: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const customerId = userDoc.data()?.stripeCustomerId;
      
      if (!customerId) throw new Error('No customer found');

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Failed to create billing portal session:', error);
      throw error;
    }
  }

  // Check feature access
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    // Students always have free access
    const user = authService.getCurrentUser();
    if (user?.role === 'student') return true;

    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return false;
    }

    // Check specific features
    const plan = SUBSCRIPTION_PLANS[subscription.planId as keyof typeof SUBSCRIPTION_PLANS];
    return plan?.features.some(f => f.toLowerCase().includes(feature.toLowerCase())) || false;
  }

  // Get usage data for current billing period
  private async getUsageData(userId: string, planId?: string): Promise<any> {
    // This would query Firebase for actual usage
    // For now, return mock data
    return {
      studentsMonitored: 3,
      studentsLimit: planId?.includes('premium') ? 5 : 1,
      apiCallsThisMonth: 1250,
      storageUsedGB: 0.5
    };
  }

  // Handle webhook events from Stripe
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as any);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as any);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as any);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as any);
        break;
    }
  }

  private async handleCheckoutComplete(session: any): Promise<void> {
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;

    await updateDoc(doc(db, 'users', userId), {
      stripeSubscriptionId: session.subscription,
      subscriptionPlan: planId,
      subscriptionStatus: 'active',
      updatedAt: serverTimestamp()
    });

    // Track successful subscription for ML
    mlDataCollection.trackError(new Error('subscription_success'), {
      userId,
      planId,
      amount: session.amount_total
    });
  }

  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    // Update subscription status in Firebase
    const userId = subscription.metadata.userId;
    await updateDoc(doc(db, 'users', userId), {
      subscriptionStatus: subscription.status,
      updatedAt: serverTimestamp()
    });
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const userId = subscription.metadata.userId;
    await updateDoc(doc(db, 'users', userId), {
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      updatedAt: serverTimestamp()
    });
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    // Notify user of payment failure
    console.error('Payment failed for invoice:', invoice.id);
  }
}

// Export singleton instance
export const stripeSubscriptionService = StripeSubscriptionService.getInstance();

// Export Stripe promise for components
export { stripePromise };