/**
 * Multi-User Support Service
 * Module 27: Permissions, roles, user management for collaboration
 */

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  priority: number;
}

interface CollabUser {
  id: string;
  name: string;
  role: UserRole;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  avatar?: string;
  isTyping?: boolean;
  cursorPosition?: { x: number; y: number };
}

interface UserPermissions {
  canEditBoard: boolean;
  canControlAudio: boolean;
  canManageUsers: boolean;
  canRecordSession: boolean;
  canShareScreen: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canModifySettings: boolean;
}

interface SessionInvite {
  id: string;
  sessionId: string;
  invitedBy: string;
  invitedUser: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export class MultiUserService {
  private static instance: MultiUserService;
  private users: Map<string, CollabUser> = new Map();
  private roles: Map<string, UserRole> = new Map();
  private permissions: Map<string, UserPermissions> = new Map();
  private invites: Map<string, SessionInvite> = new Map();
  private currentUser: CollabUser | null = null;

  // Predefined roles
  private defaultRoles: UserRole[] = [
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['*'], // All permissions
      priority: 100
    },
    {
      id: 'therapist',
      name: 'Lead Therapist',
      permissions: [
        'edit_board', 'control_audio', 'manage_users', 'record_session',
        'share_screen', 'view_analytics', 'export_data', 'modify_settings'
      ],
      priority: 80
    },
    {
      id: 'assistant_therapist',
      name: 'Assistant Therapist',
      permissions: [
        'edit_board', 'control_audio', 'share_screen', 'view_analytics'
      ],
      priority: 60
    },
    {
      id: 'observer',
      name: 'Observer',
      permissions: ['view_analytics'],
      priority: 40
    },
    {
      id: 'student',
      name: 'Student/Trainee',
      permissions: ['edit_board'],
      priority: 20
    }
  ];

  private constructor() {
    this.initializeRoles();
    this.initializeCurrentUser();
  }

  static getInstance(): MultiUserService {
    if (!MultiUserService.instance) {
      MultiUserService.instance = new MultiUserService();
    }
    return MultiUserService.instance;
  }

  initialize(): void {
    console.log('👥 Multi-User Support Service initialized');
    this.setupPresenceTracking();
  }

  /**
   * Initialize default roles
   */
  private initializeRoles(): void {
    this.defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * Initialize current user from auth system
   */
  private initializeCurrentUser(): void {
    if (typeof window === 'undefined') return;

    const authSystem = (window as any).authSystem;
    if (authSystem?.isAuthenticated()) {
      const userData = authSystem.getCurrentUser();
      const role = this.roles.get(userData.role || 'student') || this.roles.get('student')!;
      
      this.currentUser = {
        id: userData.id,
        name: userData.name || 'User',
        role,
        status: 'online',
        lastSeen: new Date().toISOString(),
        avatar: userData.avatar
      };

      this.users.set(this.currentUser.id, this.currentUser);
      this.updateUserPermissions(this.currentUser.id, role);
    } else {
      // Guest user
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestRole = this.roles.get('student')!;
      
      this.currentUser = {
        id: guestId,
        name: 'Guest User',
        role: guestRole,
        status: 'online',
        lastSeen: new Date().toISOString()
      };

      this.users.set(this.currentUser.id, this.currentUser);
      this.updateUserPermissions(this.currentUser.id, guestRole);
    }

    console.log(`👤 Current user initialized: ${this.currentUser.name} (${this.currentUser.role.name})`);
  }

  /**
   * Create a new user role
   */
  createRole(roleData: Omit<UserRole, 'id'>): UserRole {
    const roleId = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const role: UserRole = {
      id: roleId,
      ...roleData
    };

    this.roles.set(roleId, role);
    console.log(`🎭 Created new role: ${role.name}`);
    return role;
  }

  /**
   * Update user permissions based on role
   */
  private updateUserPermissions(userId: string, role: UserRole): void {
    const permissions: UserPermissions = {
      canEditBoard: role.permissions.includes('*') || role.permissions.includes('edit_board'),
      canControlAudio: role.permissions.includes('*') || role.permissions.includes('control_audio'),
      canManageUsers: role.permissions.includes('*') || role.permissions.includes('manage_users'),
      canRecordSession: role.permissions.includes('*') || role.permissions.includes('record_session'),
      canShareScreen: role.permissions.includes('*') || role.permissions.includes('share_screen'),
      canViewAnalytics: role.permissions.includes('*') || role.permissions.includes('view_analytics'),
      canExportData: role.permissions.includes('*') || role.permissions.includes('export_data'),
      canModifySettings: role.permissions.includes('*') || role.permissions.includes('modify_settings')
    };

    this.permissions.set(userId, permissions);
  }

  /**
   * Invite user to collaboration session
   */
  async inviteUser(email: string, roleId: string, sessionId: string): Promise<SessionInvite> {
    if (!this.hasPermission(this.currentUser?.id || '', 'canManageUsers')) {
      throw new Error('Insufficient permissions to invite users');
    }

    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invite: SessionInvite = {
      id: inviteId,
      sessionId,
      invitedBy: this.currentUser?.id || '',
      invitedUser: email,
      role: roleId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      status: 'pending'
    };

    this.invites.set(inviteId, invite);

    // Send invitation through collaboration service
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type: 'user_invite',
        invite
      });
    }

    // Send email invitation (mock implementation)
    await this.sendInvitationEmail(invite);

    console.log(`📧 Invited ${email} to session ${sessionId} as ${roleId}`);
    return invite;
  }

  /**
   * Accept session invitation
   */
  acceptInvite(inviteId: string): void {
    const invite = this.invites.get(inviteId);
    if (!invite) {
      throw new Error('Invitation not found');
    }

    if (invite.status !== 'pending') {
      throw new Error('Invitation already processed');
    }

    if (new Date() > new Date(invite.expiresAt)) {
      invite.status = 'expired';
      throw new Error('Invitation has expired');
    }

    invite.status = 'accepted';
    
    // Join the collaboration session
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.joinSession(invite.sessionId);
    }

    console.log(`✅ Accepted invitation to session ${invite.sessionId}`);
  }

  /**
   * Add user to session
   */
  addUser(userData: Omit<CollabUser, 'lastSeen'>): void {
    const user: CollabUser = {
      ...userData,
      lastSeen: new Date().toISOString()
    };

    this.users.set(user.id, user);
    this.updateUserPermissions(user.id, user.role);

    // Notify other users
    this.broadcastUserUpdate('user_joined', user);
    console.log(`👋 User joined: ${user.name} (${user.role.name})`);
  }

  /**
   * Remove user from session
   */
  removeUser(userId: string): void {
    if (!this.hasPermission(this.currentUser?.id || '', 'canManageUsers')) {
      throw new Error('Insufficient permissions to remove users');
    }

    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      this.permissions.delete(userId);
      
      this.broadcastUserUpdate('user_removed', user);
      console.log(`👋 User removed: ${user.name}`);
    }
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, newRoleId: string): void {
    if (!this.hasPermission(this.currentUser?.id || '', 'canManageUsers')) {
      throw new Error('Insufficient permissions to update user roles');
    }

    const user = this.users.get(userId);
    const newRole = this.roles.get(newRoleId);

    if (!user || !newRole) {
      throw new Error('User or role not found');
    }

    // Check role hierarchy - can't promote to higher role than current user
    if (this.currentUser && newRole.priority > this.currentUser.role.priority) {
      throw new Error('Cannot assign role higher than your own');
    }

    user.role = newRole;
    this.updateUserPermissions(userId, newRole);

    this.broadcastUserUpdate('user_role_updated', user);
    console.log(`🎭 Updated ${user.name} role to ${newRole.name}`);
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userId: string, permission: keyof UserPermissions): boolean {
    const userPermissions = this.permissions.get(userId);
    return userPermissions ? userPermissions[permission] : false;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId: string): UserPermissions | null {
    return this.permissions.get(userId) || null;
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: CollabUser['status']): void {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      user.lastSeen = new Date().toISOString();
      
      this.broadcastUserUpdate('user_status_updated', user);
    }
  }

  /**
   * Update user typing status
   */
  updateTypingStatus(userId: string, isTyping: boolean): void {
    const user = this.users.get(userId);
    if (user) {
      user.isTyping = isTyping;
      this.broadcastUserUpdate('user_typing_updated', user);
    }
  }

  /**
   * Update user cursor position
   */
  updateCursorPosition(userId: string, x: number, y: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.cursorPosition = { x, y };
      this.broadcastUserUpdate('user_cursor_updated', user);
    }
  }

  /**
   * Get all active users
   */
  getActiveUsers(): CollabUser[] {
    return Array.from(this.users.values()).filter(user => user.status !== 'offline');
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): CollabUser | null {
    return this.users.get(userId) || null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): CollabUser | null {
    return this.currentUser;
  }

  /**
   * Get all roles
   */
  getAllRoles(): UserRole[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get pending invitations
   */
  getPendingInvites(): SessionInvite[] {
    return Array.from(this.invites.values()).filter(invite => 
      invite.status === 'pending' && new Date() < new Date(invite.expiresAt)
    );
  }

  /**
   * Setup presence tracking
   */
  private setupPresenceTracking(): void {
    if (typeof window === 'undefined') return;

    // Update user activity on interaction
    const updateActivity = () => {
      if (this.currentUser) {
        this.updateUserStatus(this.currentUser.id, 'online');
      }
    };

    // Track mouse movement, keyboard activity
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('click', updateActivity);

    // Set away status after inactivity
    let inactivityTimer: NodeJS.Timeout;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (this.currentUser) {
          this.updateUserStatus(this.currentUser.id, 'away');
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);

    // Handle page visibility
    document.addEventListener('visibilitychange', () => {
      if (this.currentUser) {
        const status = document.hidden ? 'away' : 'online';
        this.updateUserStatus(this.currentUser.id, status);
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.currentUser) {
        this.updateUserStatus(this.currentUser.id, 'offline');
      }
    });
  }

  /**
   * Broadcast user updates to other participants
   */
  private broadcastUserUpdate(type: string, user: CollabUser): void {
    const collaborationService = (window as any).moduleSystem?.get('CollaborationService');
    if (collaborationService) {
      collaborationService.sendMessage({
        type,
        user,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Send invitation email (mock implementation)
   */
  private async sendInvitationEmail(invite: SessionInvite): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log(`📧 Sending invitation email to ${invite.invitedUser}`);
    
    // Store invitation link for testing
    const inviteLink = `${window.location.origin}/invite/${invite.id}`;
    console.log(`🔗 Invitation link: ${inviteLink}`);
    
    // Mock email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Export singleton getter function
export function getMultiUserService(): MultiUserService {
  return MultiUserService.getInstance();
}