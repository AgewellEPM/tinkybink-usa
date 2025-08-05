import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { healthcareAPI, HealthcareAPIError } from '@/services/healthcare-api';
import { z } from 'zod';

// Types
interface HealthcareContextType {
  // Authentication
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  // Loading states
  loading: {
    patients: boolean;
    claims: boolean;
    sessions: boolean;
    analytics: boolean;
  };
  
  // Error states
  errors: {
    patients: Error | null;
    claims: Error | null;
    sessions: Error | null;
    analytics: Error | null;
  };
  
  // Data
  patients: Patient[];
  claims: Claim[];
  sessions: Session[];
  analytics: AnalyticsData | null;
  
  // API Methods
  fetchPatients: (params?: any) => Promise<void>;
  fetchClaims: (params?: any) => Promise<void>;
  fetchSessions: (patientId: string) => Promise<void>;
  fetchAnalytics: (startDate: string, endDate: string) => Promise<void>;
  
  createPatient: (data: Omit<Patient, 'id'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient>;
  submitClaim: (claimId: string) => Promise<void>;
  createSession: (data: Omit<Session, 'id'>) => Promise<Session>;
  
  // Real-time updates
  subscribeToUpdates: (callback: (update: any) => void) => () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'therapist' | 'billing' | 'viewer';
  permissions: string[];
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  medicareId?: string;
  medicaidId?: string;
  primaryInsurance?: string;
  diagnosis: string[];
  status: 'active' | 'inactive' | 'discharged';
  lastSession?: string;
  upcomingSessions?: number;
}

interface Claim {
  id: string;
  patientId: string;
  patientName?: string;
  dateOfService: string;
  cptCode: string;
  modifiers: string[];
  units: number;
  diagnosisCodes: string[];
  insuranceType: 'medicare' | 'medicaid' | 'private';
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'denied';
  totalCharge: number;
  paidAmount?: number;
  denialReason?: string;
}

interface Session {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  duration: number;
  cptCode: string;
  goals: string[];
  interventions: string[];
  progress: string;
  planOfCare: string;
  signature?: string;
  supervisorSignature?: string;
}

interface AnalyticsData {
  revenue: number;
  claims: number;
  approvalRate: number;
  avgReimbursement: number;
  topCPTCodes: Array<{ code: string; count: number; revenue: number }>;
  payerMix: Array<{ payer: string; percentage: number; revenue: number }>;
}

// Create context
const HealthcareContext = createContext<HealthcareContextType | undefined>(undefined);

// WebSocket connection for real-time updates
let ws: WebSocket | null = null;

export const HealthcareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState({
    patients: false,
    claims: false,
    sessions: false,
    analytics: false,
  });
  
  // Error states
  const [errors, setErrors] = useState<{
    patients: Error | null;
    claims: Error | null;
    sessions: Error | null;
    analytics: Error | null;
  }>({
    patients: null,
    claims: null,
    sessions: null,
    analytics: null,
  });
  
  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = sessionStorage.getItem('healthcare_auth_token');
    if (token) {
      setIsAuthenticated(true);
      // TODO: Verify token and fetch user profile
    }
  }, []);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (isAuthenticated && !ws) {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.tinkybink.com/ws';
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        handleRealtimeUpdate(update);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        ws = null;
      };
    }
    
    return () => {
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, [isAuthenticated]);

  // Handle real-time updates
  const handleRealtimeUpdate = (update: any) => {
    switch (update.type) {
      case 'patient_updated':
        setPatients(prev => prev.map(p => 
          p.id === update.data.id ? { ...p, ...update.data } : p
        ));
        break;
      
      case 'claim_status_changed':
        setClaims(prev => prev.map(c => 
          c.id === update.data.id ? { ...c, status: update.data.status } : c
        ));
        break;
      
      case 'new_session':
        setSessions(prev => [...prev, update.data]);
        break;
      
      default:
        console.log('Unknown update type:', update.type);
    }
  };

  // Authentication methods
  const login = async (email: string, password: string) => {
    try {
      await healthcareAPI.authenticate({ email, password });
      setIsAuthenticated(true);
      
      // Fetch user profile
      // const userProfile = await healthcareAPI.getUserProfile();
      // setUser(userProfile);
      
      // For now, mock user
      setUser({
        id: '1',
        email,
        name: 'Healthcare Provider',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('healthcare_auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setPatients([]);
    setClaims([]);
    setSessions([]);
    setAnalytics(null);
  };

  // API methods with error handling and loading states
  const fetchPatients = async (params?: any) => {
    setLoading(prev => ({ ...prev, patients: true }));
    setErrors(prev => ({ ...prev, patients: null }));
    
    try {
      const { patients } = await healthcareAPI.getPatients(params);
      setPatients(patients);
    } catch (error) {
      setErrors(prev => ({ ...prev, patients: error as Error }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, patients: false }));
    }
  };

  const fetchClaims = async (params?: any) => {
    setLoading(prev => ({ ...prev, claims: true }));
    setErrors(prev => ({ ...prev, claims: null }));
    
    try {
      const { claims } = await healthcareAPI.getClaims(params);
      setClaims(claims);
    } catch (error) {
      setErrors(prev => ({ ...prev, claims: error as Error }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, claims: false }));
    }
  };

  const fetchSessions = async (patientId: string) => {
    setLoading(prev => ({ ...prev, sessions: true }));
    setErrors(prev => ({ ...prev, sessions: null }));
    
    try {
      const sessions = await healthcareAPI.getSessionsByPatient(patientId);
      setSessions(sessions);
    } catch (error) {
      setErrors(prev => ({ ...prev, sessions: error as Error }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  };

  const fetchAnalytics = async (startDate: string, endDate: string) => {
    setLoading(prev => ({ ...prev, analytics: true }));
    setErrors(prev => ({ ...prev, analytics: null }));
    
    try {
      const data = await healthcareAPI.getBillingAnalytics({
        startDate,
        endDate,
        groupBy: 'month',
      });
      setAnalytics(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, analytics: error as Error }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  const createPatient = async (data: Omit<Patient, 'id'>): Promise<Patient> => {
    try {
      const patient = await healthcareAPI.createPatient(data);
      setPatients(prev => [...prev, patient]);
      return patient;
    } catch (error) {
      console.error('Create patient error:', error);
      throw error;
    }
  };

  const updatePatient = async (id: string, data: Partial<Patient>): Promise<Patient> => {
    try {
      const patient = await healthcareAPI.updatePatient(id, data);
      setPatients(prev => prev.map(p => p.id === id ? patient : p));
      return patient;
    } catch (error) {
      console.error('Update patient error:', error);
      throw error;
    }
  };

  const submitClaim = async (claimId: string) => {
    try {
      const claim = await healthcareAPI.submitClaim(claimId);
      setClaims(prev => prev.map(c => c.id === claimId ? claim : c));
    } catch (error) {
      console.error('Submit claim error:', error);
      throw error;
    }
  };

  const createSession = async (data: Omit<Session, 'id'>): Promise<Session> => {
    try {
      const session = await healthcareAPI.createSession(data);
      setSessions(prev => [...prev, session]);
      return session;
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  };

  const subscribeToUpdates = useCallback((callback: (update: any) => void) => {
    // Subscribe to WebSocket updates
    const handler = (event: MessageEvent) => {
      const update = JSON.parse(event.data);
      callback(update);
    };
    
    if (ws) {
      ws.addEventListener('message', handler);
    }
    
    // Return unsubscribe function
    return () => {
      if (ws) {
        ws.removeEventListener('message', handler);
      }
    };
  }, []);

  const value: HealthcareContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    errors,
    patients,
    claims,
    sessions,
    analytics,
    fetchPatients,
    fetchClaims,
    fetchSessions,
    fetchAnalytics,
    createPatient,
    updatePatient,
    submitClaim,
    createSession,
    subscribeToUpdates,
  };

  return (
    <HealthcareContext.Provider value={value}>
      {children}
    </HealthcareContext.Provider>
  );
};

// Custom hook to use healthcare context
export const useHealthcare = () => {
  const context = useContext(HealthcareContext);
  if (context === undefined) {
    throw new Error('useHealthcare must be used within a HealthcareProvider');
  }
  return context;
};