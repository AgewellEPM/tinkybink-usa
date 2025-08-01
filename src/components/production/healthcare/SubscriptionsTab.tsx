import React from 'react';

export const SubscriptionsTab: React.FC = () => {
  const subscriptionPlans = [
    {
      name: 'Starter',
      price: 99,
      features: [
        'Up to 50 patients',
        '2 therapist accounts',
        'Email support',
        'Basic reporting'
      ],
      clinics: 12,
      isActive: false
    },
    {
      name: 'Professional',
      price: 299,
      features: [
        'Up to 200 patients',
        '10 therapist accounts',
        'Priority support',
        'Video sessions',
        'API access'
      ],
      clinics: 28,
      isActive: true
    },
    {
      name: 'Enterprise',
      price: 999,
      features: [
        'Unlimited patients',
        'Unlimited therapists',
        'Dedicated support',
        'White labeling',
        'Custom features'
      ],
      clinics: 7,
      isActive: false
    }
  ];

  const revenueData = {
    monthly: 14950,
    quarterly: 42850,
    yearly: 156340,
    growth: 18
  };

  return (
    <div id="subscriptions-tab" className="tab-content">
      <h3>Subscription Management</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {subscriptionPlans.map((plan, index) => (
          <div 
            key={plan.name}
            style={{ 
              background: plan.isActive 
                ? 'linear-gradient(135deg, rgba(123, 63, 242, 0.2), rgba(255, 0, 110, 0.2))' 
                : 'rgba(255,255,255,0.05)', 
              padding: '20px', 
              borderRadius: '8px', 
              textAlign: 'center',
              border: plan.isActive ? '2px solid var(--primary-color)' : 'none'
            }}
          >
            <h4>{plan.name}</h4>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              margin: '10px 0' 
            }}>
              ${plan.price}
              <span style={{ fontSize: '16px', fontWeight: 'normal' }}>/mo</span>
            </div>
            <ul style={{ 
              textAlign: 'left', 
              margin: '15px 0',
              listStyle: 'none',
              padding: 0
            }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ marginBottom: '5px' }}>• {feature}</li>
              ))}
            </ul>
            <div style={{ 
              color: plan.isActive ? 'var(--primary-color)' : '#888' 
            }}>
              {plan.clinics} clinics
            </div>
          </div>
        ))}
      </div>
      
      <h4>Revenue Overview</h4>
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px', 
          textAlign: 'center' 
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              ${revenueData.monthly.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Monthly Revenue</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              ${revenueData.quarterly.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Quarterly Revenue</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              ${revenueData.yearly.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Yearly Revenue</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
              +{revenueData.growth}%
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Growth Rate</div>
          </div>
        </div>
      </div>

      <h4>Subscription Analytics</h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '20px' 
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h5>Plan Distribution</h5>
          <div style={{ marginTop: '15px' }}>
            {subscriptionPlans.map((plan) => {
              const total = subscriptionPlans.reduce((sum, p) => sum + p.clinics, 0);
              const percentage = Math.round((plan.clinics / total) * 100);
              
              return (
                <div key={plan.name} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '10px' 
                }}>
                  <span>{plan.name}:</span>
                  <span>{percentage}% ({plan.clinics} clinics)</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h5>Key Metrics</h5>
          <div style={{ marginTop: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Total Clinics:</span>
              <strong>{subscriptionPlans.reduce((sum, p) => sum + p.clinics, 0)}</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Average Revenue per Clinic:</span>
              <strong>
                ${Math.round(revenueData.monthly / subscriptionPlans.reduce((sum, p) => sum + p.clinics, 0))}
              </strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px' 
            }}>
              <span>Churn Rate:</span>
              <strong style={{ color: '#e74c3c' }}>2.3%</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between' 
            }}>
              <span>Customer Lifetime Value:</span>
              <strong style={{ color: '#2ecc71' }}>$8,450</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};