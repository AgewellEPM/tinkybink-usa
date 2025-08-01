class SubscriptionManager {
      constructor() {
        this.plans = {
          starter: {
            name: 'Starter',
            price: 49,
            features: ['5 Users', 'Basic Analytics', 'Email Support'],
            limits: { users: 5, storage: 10 }
          },
          professional: {
            name: 'Professional',
            price: 199,
            features: ['25 Users', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
            limits: { users: 25, storage: 100 }
          },
          enterprise: {
            name: 'Enterprise',
            price: 999,
            features: ['Unlimited Users', 'AI Analytics', '24/7 Support', 'White Label', 'API Access'],
            limits: { users: -1, storage: -1 }
          }
        };
        this.currentPlan = null;
        this.usage = { users: 0, storage: 0 };
      }
      
      async subscribeToPlan(planId, paymentMethod) {
        const plan = this.plans[planId];
        if (!plan) throw new Error('Invalid plan');
        
        try {
          // Process payment
          const payment = await window.paymentProcessor.createSubscription({
            priceId: `price_${planId}`,
            customerId: window.authSystem.getCurrentUser().stripeCustomerId,
            plan: planId,
            trialDays: planId === 'enterprise' ? 30 : 14
          });
          
          if (payment.status === 'active') {
            this.currentPlan = planId;
            this.updateFeatureAccess();
            this.notifyPlanChange();
          }
          
          return payment;
        } catch (error) {
          console.error('Subscription failed:', error);
          throw error;
        }
      }
      
      updateFeatureAccess() {
        const plan = this.plans[this.currentPlan];
        
        // Enable/disable features based on plan
        window.features = {
          aiAnalytics: ['professional', 'enterprise'].includes(this.currentPlan),
          customBranding: ['professional', 'enterprise'].includes(this.currentPlan),
          apiAccess: this.currentPlan === 'enterprise',
          prioritySupport: ['professional', 'enterprise'].includes(this.currentPlan)
        };
        
        // Update UI to reflect features
        this.updateUIFeatures();
      }
      
      updateUIFeatures() {
        // Hide/show UI elements based on plan
        document.querySelectorAll('[data-feature]').forEach(element => {
          const feature = element.dataset.feature;
          element.style.display = window.features[feature] ? '' : 'none';
        });
      }
      
      checkUsageLimits() {
        const plan = this.plans[this.currentPlan];
        if (!plan) return;
        
        const warnings = [];
        
        if (plan.limits.users !== -1 && this.usage.users >= plan.limits.users * 0.8) {
          warnings.push(`Approaching user limit (${this.usage.users}/${plan.limits.users})`);
        }
        
        if (plan.limits.storage !== -1 && this.usage.storage >= plan.limits.storage * 0.8) {
          warnings.push(`Approaching storage limit (${this.usage.storage}GB/${plan.limits.storage}GB)`);
        }
        
        if (warnings.length > 0) {
          this.showUsageWarnings(warnings);
        }
      }
      
      showUsageWarnings(warnings) {
        const container = document.createElement('div');
        container.className = 'usage-warnings';
        container.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          background: #ff9800;
          color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-width: 300px;
          z-index: 1000;
        `;
        
        container.innerHTML = `
          <h4 style="margin: 0 0 8px 0;">Usage Warning</h4>
          ${warnings.map(w => `<p style="margin: 4px 0;">${w}</p>`).join('')}
          <button onclick="window.subscriptionManager.upgradePlan()" style="
            background: white;
            color: #ff9800;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 8px;
          ">Upgrade Plan</button>
        `;
        
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 10000);
      }
      
      upgradePlan() {
        // Show upgrade modal
        window.showPricingModal();
      }
      
      async cancelSubscription() {
        if (!this.currentPlan) return;
        
        try {
          const result = await window.paymentProcessor.cancelSubscription(
            window.authSystem.getCurrentUser().subscriptionId
          );
          
          if (result.status === 'canceled') {
            this.currentPlan = null;
            this.updateFeatureAccess();
            this.notifyPlanChange();
          }
          
          return result;
        } catch (error) {
          console.error('Cancellation failed:', error);
          throw error;
        }
      }
      
      notifyPlanChange() {
        // Notify all connected clients of plan change
        window.collaboration?.broadcast({
          type: 'plan_changed',
          plan: this.currentPlan,
          features: window.features
        });
      }
      
      async generateInvoice(period) {
        const invoice = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          period,
          plan: this.plans[this.currentPlan],
          usage: this.usage,
          total: this.calculateTotal(),
          items: this.getInvoiceItems()
        };
        
        return invoice;
      }
      
      calculateTotal() {
        const plan = this.plans[this.currentPlan];
        let total = plan.price;
        
        // Add overage charges
        if (plan.limits.users !== -1 && this.usage.users > plan.limits.users) {
          total += (this.usage.users - plan.limits.users) * 10; // $10 per extra user
        }
        
        if (plan.limits.storage !== -1 && this.usage.storage > plan.limits.storage) {
          total += (this.usage.storage - plan.limits.storage) * 0.50; // $0.50 per extra GB
        }
        
        return total;
      }
      
      getInvoiceItems() {
        const items = [
          {
            description: `${this.plans[this.currentPlan].name} Plan`,
            amount: this.plans[this.currentPlan].price
          }
        ];
        
        const plan = this.plans[this.currentPlan];
        
        if (plan.limits.users !== -1 && this.usage.users > plan.limits.users) {
          items.push({
            description: `Additional Users (${this.usage.users - plan.limits.users})`,
            amount: (this.usage.users - plan.limits.users) * 10
          });
        }
        
        if (plan.limits.storage !== -1 && this.usage.storage > plan.limits.storage) {
          items.push({
            description: `Additional Storage (${this.usage.storage - plan.limits.storage}GB)`,
            amount: (this.usage.storage - plan.limits.storage) * 0.50
          });
        }
        
        return items;
      }
    }
    
    // White Label Configuration System