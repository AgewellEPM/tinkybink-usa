import React, { useEffect, useState } from 'react';
import { useHealthcare } from '@/contexts/HealthcareContext';
import { logger } from '@/services/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'therapist' | 'billing' | 'viewer';
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole, 
  requiredPermissions = [],
  fallback 
}) => {
  const { isAuthenticated, user, login } = useHealthcare();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('demo@tinkybink.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    if (!isAuthenticated) {
      setShowLogin(true);
      logger.info('User not authenticated, showing login');
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      logger.info('User logged in successfully', { email });
      setShowLogin(false);
    } catch (err) {
      logger.error('Login failed', { email, error: err });
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check role-based access
  const hasRequiredRole = () => {
    if (!requiredRole || !user) return true;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // Check specific role
    return user.role === requiredRole;
  };

  // Check permission-based access
  const hasRequiredPermissions = () => {
    if (!requiredPermissions.length || !user) return true;
    
    return requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
  };

  // Skip authentication entirely in development
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>;
  }
  
  // Show login modal if not authenticated
  if (!isAuthenticated || showLogin) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}>
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            color: 'var(--primary-color)'
          }}>
            🏥 Healthcare Login
          </h2>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '14px',
                color: '#ddd'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="provider@healthcare.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '14px',
                color: '#ddd'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '16px'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid #e74c3c',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                color: '#e74c3c',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#555' : 'linear-gradient(135deg, #7b3ff2, #ff006e)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#999'
          }}>
            <p>Demo credentials:</p>
            <p>admin@tinkybink.com / demo123</p>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(52, 152, 219, 0.1)',
            border: '1px solid rgba(52, 152, 219, 0.3)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#3498db'
          }}>
            <strong>🔒 Security Notice:</strong> This system contains protected health information (PHI). 
            Unauthorized access is prohibited and all activities are logged for HIPAA compliance.
          </div>
        </div>
      </div>
    );
  }

  // Check authorization
  if (!hasRequiredRole() || !hasRequiredPermissions()) {
    logger.warn('Access denied', { 
      userId: user?.id,
      requiredRole,
      requiredPermissions,
      userRole: user?.role,
      userPermissions: user?.permissions
    });

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: 'rgba(231, 76, 60, 0.1)',
        border: '1px solid #e74c3c',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#e74c3c' }}>Access Denied</h3>
        <p>You don&apos;t have permission to access this resource.</p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
          Required role: {requiredRole || 'Any'}<br/>
          {requiredPermissions.length > 0 && (
            <>Required permissions: {requiredPermissions.join(', ')}</>
          )}
        </p>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
};