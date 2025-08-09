/**
 * Enhanced Authentication Service with Role Management
 * Handles Google Auth with teacher/parent/student roles
 */

import { 
  signInWithPopup, 
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { mlDataCollection, UserProfile } from './ml-data-collection';

export type UserRole = 'student' | 'teacher' | 'parent' | 'therapist' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
  metadata?: {
    clinicId?: string;
    studentIds?: string[]; // For teachers/parents
    parentIds?: string[]; // For students
    teacherIds?: string[]; // For students
  };
}

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private googleProvider: GoogleAuthProvider;
  private appleProvider: OAuthProvider;

  private constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');
    
    this.appleProvider = new OAuthProvider('apple.com');
    this.appleProvider.addScope('email');
    this.appleProvider.addScope('name');
    
    // Set up auth state listener
    this.initAuthListener();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initAuthListener(): void {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, fetch their role and metadata
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() as UserProfile;
        
        this.currentUser = {
          ...user,
          role: userData?.role,
          metadata: userData?.metadata
        } as AuthUser;

        // Initialize ML data collection for this user
        if (userData) {
          await mlDataCollection.initializeUser(userData);
          await mlDataCollection.startSession(user.uid);
        }
      } else {
        // User is signed out
        if (this.currentUser) {
          await mlDataCollection.endSession();
        }
        this.currentUser = null;
      }
    });
  }

  // Sign in with Google - with role selection
  async signInWithGoogle(preSelectedRole?: UserRole): Promise<AuthUser> {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;

      // Check if user exists in database
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData = userDoc.data() as UserProfile;

      if (!userData || !userData.role) {
        // New user or no role set - prompt for role selection
        const role = preSelectedRole || await this.promptForRole();
        
        // Create user profile
        userData = {
          userId: user.uid,
          email: user.email!,
          displayName: user.displayName || 'User',
          role: role,
          createdAt: new Date(),
          lastActive: new Date(),
          settings: {
            language: 'en',
            voiceSettings: {},
            gridLayout: { columns: 3 },
            preferences: {}
          },
          metadata: await this.getInitialMetadata(role)
        };

        // Save to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });

        // Initialize ML data collection
        await mlDataCollection.initializeUser(userData);
      } else {
        // Update last active
        await setDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp()
        }, { merge: true });
      }

      // Start new session
      await mlDataCollection.startSession(user.uid);

      this.currentUser = {
        ...user,
        role: userData.role,
        metadata: userData.metadata
      } as AuthUser;

      return this.currentUser;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  }

  // Sign in with Apple - with role selection
  async signInWithApple(preSelectedRole?: UserRole): Promise<AuthUser> {
    try {
      const result = await signInWithPopup(auth, this.appleProvider);
      const user = result.user;

      // Check if user exists in database
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData = userDoc.data() as UserProfile;

      if (!userData || !userData.role) {
        // New user or no role set - prompt for role selection
        const role = preSelectedRole || await this.promptForRole();
        
        // Create user profile
        userData = {
          userId: user.uid,
          email: user.email!,
          displayName: user.displayName || 'User',
          role: role,
          createdAt: new Date(),
          lastActive: new Date(),
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true
          },
          metadata: role === 'therapist' ? { 
            clinicId: `clinic_${user.uid}`,
            patientIds: []
          } : role === 'teacher' || role === 'parent' ? {
            studentIds: []
          } : {}
        };

        // Save to database
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });

        // Initialize ML data collection
        await mlDataCollection.initializeUser(userData);
      } else {
        // Update last active
        await setDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp()
        }, { merge: true });
      }

      // Start new session
      await mlDataCollection.startSession(user.uid);

      this.currentUser = {
        ...user,
        role: userData.role,
        metadata: userData.metadata
      } as AuthUser;

      return this.currentUser;
    } catch (error) {
      console.error('Apple sign-in failed:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      // End ML session
      await mlDataCollection.endSession();
      
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  // Get current user with role
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Check if user has specific role
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.currentUser?.role || '' as UserRole);
  }

  // Check if user can access student data
  canAccessStudent(studentId: string): boolean {
    if (!this.currentUser) return false;

    // Admins and therapists can access all
    if (this.hasAnyRole(['admin', 'therapist'])) return true;

    // Students can only access their own data
    if (this.hasRole('student')) {
      return this.currentUser.uid === studentId;
    }

    // Teachers can access their students
    if (this.hasRole('teacher')) {
      return this.currentUser.metadata?.studentIds?.includes(studentId) || false;
    }

    // Parents can access their children
    if (this.hasRole('parent')) {
      return this.currentUser.metadata?.studentIds?.includes(studentId) || false;
    }

    return false;
  }

  // Private helper to prompt for role (would be a UI component)
  private async promptForRole(): Promise<UserRole> {
    // In a real implementation, this would show a UI dialog
    // For now, default to student
    return 'student';
  }

  // Get initial metadata based on role
  private async getInitialMetadata(role: UserRole): Promise<any> {
    switch (role) {
      case 'teacher':
      case 'parent':
        return {
          studentIds: [],
          clinicId: null
        };
      case 'student':
        return {
          parentIds: [],
          teacherIds: [],
          grade: null,
          diagnosis: [],
          therapyGoals: []
        };
      case 'therapist':
        return {
          clinicId: null,
          patientIds: [],
          specializations: []
        };
      case 'admin':
        return {
          permissions: ['all']
        };
      default:
        return {};
    }
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    if (!this.hasRole('admin')) {
      throw new Error('Unauthorized: Only admins can change user roles');
    }

    await setDoc(doc(db, 'users', userId), {
      role: newRole,
      lastModified: serverTimestamp()
    }, { merge: true });
  }

  // Link student to teacher/parent
  async linkUsers(studentId: string, guardianId: string, relationship: 'teacher' | 'parent'): Promise<void> {
    if (!this.hasAnyRole(['admin', 'therapist'])) {
      throw new Error('Unauthorized: Only admins and therapists can link users');
    }

    // Update student's record
    const studentRef = doc(db, 'users', studentId);
    const studentDoc = await getDoc(studentRef);
    const studentData = studentDoc.data();

    if (studentData?.role !== 'student') {
      throw new Error('Target user is not a student');
    }

    const fieldName = relationship === 'teacher' ? 'teacherIds' : 'parentIds';
    const currentIds = studentData.metadata?.[fieldName] || [];

    await setDoc(studentRef, {
      metadata: {
        [fieldName]: [...currentIds, guardianId]
      }
    }, { merge: true });

    // Update guardian's record
    const guardianRef = doc(db, 'users', guardianId);
    const guardianDoc = await getDoc(guardianRef);
    const guardianData = guardianDoc.data();

    if (guardianData?.role !== relationship) {
      throw new Error(`Guardian is not a ${relationship}`);
    }

    const guardianStudentIds = guardianData.metadata?.studentIds || [];
    
    await setDoc(guardianRef, {
      metadata: {
        studentIds: [...guardianStudentIds, studentId]
      }
    }, { merge: true });
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export for use in components
export { auth };
export type { AuthService };