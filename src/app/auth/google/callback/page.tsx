'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GoogleAuthCallbackContent() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (code) {
      // Send success message to parent window
      window.opener?.postMessage({
        type: 'google-auth-success',
        code: code
      }, window.location.origin);
      
      // Close popup
      window.close();
    } else if (error) {
      // Send error message to parent window
      window.opener?.postMessage({
        type: 'google-auth-error',
        error: error
      }, window.location.origin);
      
      // Close popup
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="auth-callback">
      <div className="loading-container">
        <div className="spinner">🔄</div>
        <h2>Connecting to Google Calendar...</h2>
        <p>Please wait while we complete the connection.</p>
      </div>

      <style jsx>{`
        .auth-callback {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .loading-container {
          text-align: center;
          background: white;
          padding: 48px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          max-width: 400px;
        }

        .spinner {
          font-size: 48px;
          animation: spin 2s linear infinite;
          margin-bottom: 24px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-container h2 {
          color: #1a202c;
          margin-bottom: 16px;
          font-size: 24px;
        }

        .loading-container p {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

export default function GoogleAuthCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleAuthCallbackContent />
    </Suspense>
  );
}