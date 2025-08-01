class PaymentProcessor {
      constructor() {
        this.stripeKey = process.env.STRIPE_KEY;
        this.squareKey = process.env.SQUARE_KEY;
        this.paypalKey = process.env.PAYPAL_KEY;
        this.activeProcessor = 'stripe';
      }
      
      async processPayment(paymentData) {
        switch (this.activeProcessor) {
          case 'stripe':
            return this.processStripePayment(paymentData);
          case 'square':
            return this.processSquarePayment(paymentData);
          case 'paypal':
            return this.processPayPalPayment(paymentData);
          default:
            throw new Error('No payment processor configured');
        }
      }
      
      async processStripePayment(data) {
        try {
          const response = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              amount: Math.round(data.amount * 100), // Convert to cents
              currency: data.currency || 'usd',
              payment_method: data.paymentMethodId,
              confirm: true,
              metadata: {
                patientId: data.patientId,
                sessionId: data.sessionId,
                invoiceId: data.invoiceId
              }
            })
          });
          
          const result = await response.json();
          this.logPayment(result, 'stripe');
          return result;
        } catch (error) {
          console.error('Stripe payment failed:', error);
          throw error;
        }
      }
      
      async processSquarePayment(data) {
        try {
          const response = await fetch('https://connect.squareup.com/v2/payments', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.squareKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              source_id: data.sourceId,
              amount_money: {
                amount: Math.round(data.amount * 100),
                currency: data.currency || 'USD'
              },
              reference_id: data.invoiceId
            })
          });
          
          const result = await response.json();
          this.logPayment(result, 'square');
          return result;
        } catch (error) {
          console.error('Square payment failed:', error);
          throw error;
        }
      }
      
      async processPayPalPayment(data) {
        try {
          const response = await fetch('https://api.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.paypalKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              intent: 'CAPTURE',
              purchase_units: [{
                amount: {
                  currency_code: data.currency || 'USD',
                  value: data.amount.toFixed(2)
                },
                reference_id: data.invoiceId
              }]
            })
          });
          
          const result = await response.json();
          this.logPayment(result, 'paypal');
          return result;
        } catch (error) {
          console.error('PayPal payment failed:', error);
          throw error;
        }
      }
      
      async createSubscription(subscriptionData) {
        if (this.activeProcessor !== 'stripe') {
          throw new Error('Subscriptions only supported with Stripe');
        }
        
        try {
          const response = await fetch('https://api.stripe.com/v1/subscriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              customer: subscriptionData.customerId,
              items: [{ price: subscriptionData.priceId }],
              trial_period_days: subscriptionData.trialDays || 14,
              metadata: {
                organizationId: subscriptionData.organizationId,
                plan: subscriptionData.plan
              }
            })
          });
          
          return await response.json();
        } catch (error) {
          console.error('Subscription creation failed:', error);
          throw error;
        }
      }
      
      async cancelSubscription(subscriptionId) {
        try {
          const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.stripeKey}`
            }
          });
          
          return await response.json();
        } catch (error) {
          console.error('Subscription cancellation failed:', error);
          throw error;
        }
      }
      
      logPayment(result, processor) {
        const log = {
          timestamp: new Date().toISOString(),
          processor,
          transactionId: result.id,
          amount: result.amount,
          status: result.status,
          metadata: result.metadata
        };
        
        // Store in compliance log
        window.complianceSystem?.logActivity('payment_processed', log);
      }
    }
    
    // Compliance and Regulatory System