'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserRole } from '@/services/auth-service';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      setError('Please select your role first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.signInWithGoogle(selectedRole);
      redirectUser(selectedRole);
    } catch (error) {
      console.error('Google login failed:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!selectedRole) {
      setError('Please select your role first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.signInWithApple(selectedRole);
      redirectUser(selectedRole);
    } catch (error) {
      console.error('Apple login failed:', error);
      setError('Failed to sign in with Apple. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const redirectUser = (role: UserRole) => {
    switch (role) {
      case 'student':
        router.push('/');
        break;
      case 'teacher':
      case 'parent':
        router.push('/dashboard');
        break;
      case 'therapist':
        router.push('/therapy');
        break;
      case 'admin':
        router.push('/admin');
        break;
    }
  };

  const roles = [
    {
      id: 'student' as UserRole,
      title: 'Student',
      description: 'I use AAC to communicate',
      icon: '🎓',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'parent' as UserRole,
      title: 'Parent/Caregiver',
      description: 'I support someone who uses AAC',
      icon: '👨‍👩‍👧',
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'teacher' as UserRole,
      title: 'Teacher',
      description: 'I teach students who use AAC',
      icon: '👩‍🏫',
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'therapist' as UserRole,
      title: 'Speech Therapist',
      description: 'I provide AAC therapy services',
      icon: '🏥',
      color: 'from-pink-400 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">TinkyBink AAC</h1>
          <p className="text-xl text-gray-300">Professional Communication Platform</p>
        </div>

        {/* Role Selection */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            How will you be using TinkyBink?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {roles.map((role) => (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect(role.id)}
                className={`relative overflow-hidden rounded-xl p-6 text-left transition-all ${
                  selectedRole === role.id
                    ? 'ring-4 ring-white ring-opacity-50'
                    : 'hover:shadow-lg'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-90`} />
                <div className="relative z-10">
                  <div className="text-4xl mb-2">{role.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-1">{role.title}</h3>
                  <p className="text-sm text-white opacity-90">{role.description}</p>
                </div>
                {selectedRole === role.id && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Sign In Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={!selectedRole || isLoading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3 ${
                selectedRole && !isLoading
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg'
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <button
              onClick={handleAppleSignIn}
              disabled={!selectedRole || isLoading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3 ${
                selectedRole && !isLoading
                  ? 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 shadow-lg'
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </>
              )}
            </button>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-400 text-center mt-6">
            By signing in, you agree to our data collection for ML training to improve AAC communication.
            All data is encrypted and used solely for improving the platform.
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="text-white font-semibold mb-1">HIPAA Compliant</h3>
            <p className="text-gray-400 text-sm">Secure healthcare data handling</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🧠</div>
            <h3 className="text-white font-semibold mb-1">ML-Powered</h3>
            <p className="text-gray-400 text-sm">Learns from every interaction</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-white font-semibold mb-1">Progress Tracking</h3>
            <p className="text-gray-400 text-sm">Detailed analytics & reports</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}