'use client';

import React from 'react';
import FocusAreaDashboard from '@/components/focus-area-dashboard';

export default function FocusDashboardPage() {
  // In a real app, this would come from authentication/session
  const userId = 'demo_user_123';

  return (
    <div className="focus-dashboard-page">
      <div className="page-header">
        <h1>🎯 Personal Learning Dashboard</h1>
        <p>Your AI-powered learning insights and personalized recommendations</p>
      </div>
      
      <FocusAreaDashboard 
        userId={userId}
        className="main-dashboard"
      />

      <style jsx>{`
        .focus-dashboard-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 40px 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .page-header h1 {
          margin: 0 0 12px 0;
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header p {
          margin: 0;
          font-size: 18px;
          color: #666;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .main-dashboard {
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .focus-dashboard-page {
            padding: 10px;
          }

          .page-header {
            padding: 20px;
            margin-bottom: 20px;
          }

          .page-header h1 {
            font-size: 28px;
          }

          .page-header p {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}