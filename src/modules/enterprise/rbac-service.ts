// Role-based Access Control Service - Module 57
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getAuditService } from './audit-service';
import { getMultiTenantService } from './multi-tenant-service';

interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  type: 'system' | 'custom';
  permissions: string[];
  inherits?: string[]; // Role inheritance
  constraints?: RoleConstraints;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: 'global' | 'tenant' | 'user' | 'resource';
  category: string;
  isSystemPermission: boolean;
}

interface RoleConstraints {
  timeRestrictions?: TimeRestriction[];
  ipRestrictions?: string[];
  deviceRestrictions?: string[];
  locationRestrictions?: string[];
  maxConcurrentSessions?: number;
  sessionDuration?: number;
  requireMFA?: boolean;
}

interface TimeRestriction {
  dayOfWeek: number[];
  startTime: string; // HH:MM format
  endTime: string;
  timezone?: string;
}

interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
  isActive: boolean;
  temporaryElevation?: TemporaryElevation;
}

interface TemporaryElevation {
  permissions: string[];
  reason: string;
  expiresAt: Date;
  approvedBy: string;
}

interface AccessRequest {
  id: string;
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  result: 'granted' | 'denied';
  reason?: string;
  sessionId?: string;
}

interface SecurityPolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enforcement: 'strict' | 'permissive' | 'audit-only';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityRule {
  id: string;
  condition: string; // JavaScript expression
  action: 'allow' | 'deny' | 'require-approval' | 'log-only';
  message?: string;
  priority: number;
}

interface AccessSession {
  id: string;
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  constraints: RoleConstraints;
  startTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export class RBACService {
  private static instance: RBACService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private auditService = getAuditService();
  private multiTenantService = getMultiTenantService();
  
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();
  private accessSessions: Map<string, AccessSession> = new Map();
  private securityPolicies: Map<string, SecurityPolicy> = new Map();
  private accessLog: AccessRequest[] = [];
  
  private sessionCleanupInterval: NodeJS.Timeout | null = null;
  private policyEvaluationCache: Map<string, { result: boolean; expiry: number }> = new Map();

  private constructor() {
    this.initializeSystemRoles();
    this.initializeSystemPermissions();
  }

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  initialize(): void {
    console.log('RBACService initializing...');
    this.loadPersistedData();
    this.startSessionCleanup();
    this.setupEventListeners();
    console.log('RBACService initialized');
  }

  private initializeSystemRoles(): void {
    const systemRoles: Omit<Role, 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
      {
        id: 'super-admin',
        name: 'Super Administrator',
        description: 'Full system access across all tenants',
        type: 'system',
        permissions: ['*']
      },
      {
        id: 'tenant-admin',
        name: 'Tenant Administrator',
        description: 'Full access within tenant scope',
        type: 'system',
        permissions: [
          'tenant:*',
          'users:manage',
          'roles:manage',
          'settings:manage',
          'reports:generate',
          'analytics:view'
        ]
      },
      {
        id: 'clinical-supervisor',
        name: 'Clinical Supervisor',
        description: 'Clinical oversight and patient management',
        type: 'system',
        permissions: [
          'patients:manage',
          'sessions:view',
          'reports:clinical',
          'goals:manage',
          'billing:view'
        ]
      },
      {
        id: 'therapist',
        name: 'Therapist',
        description: 'Patient therapy and progress tracking',
        type: 'system',
        permissions: [
          'patients:view',
          'patients:assigned',
          'sessions:manage',
          'goals:create',
          'boards:create',
          'reports:progress'
        ]
      },
      {
        id: 'teacher',
        name: 'Teacher',
        description: 'Educational content and student progress',
        type: 'system',
        permissions: [
          'students:view',
          'students:assigned',
          'education:manage',
          'games:access',
          'progress:view'
        ]
      },
      {
        id: 'caregiver',
        name: 'Caregiver',
        description: 'Basic patient/student support',
        type: 'system',
        permissions: [
          'communication:assist',
          'boards:use',
          'sessions:basic',
          'progress:view-basic'
        ]
      },
      {
        id: 'patient-user',
        name: 'Patient/Student',
        description: 'End user with communication access',
        type: 'system',
        permissions: [
          'communication:use',
          'boards:personal',
          'games:play',
          'profile:own'
        ]
      },
      {
        id: 'billing-admin',
        name: 'Billing Administrator',
        description: 'Billing and financial management',
        type: 'system',
        permissions: [
          'billing:manage',
          'invoices:create',
          'payments:process',
          'reports:financial'
        ]
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to assigned resources',
        type: 'system',
        permissions: [
          'view:assigned',
          'reports:basic'
        ]
      }
    ];

    systemRoles.forEach(roleData => {
      const role: Role = {
        ...roleData,
        tenantId: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      };
      this.roles.set(role.id, role);
    });
  }

  private initializeSystemPermissions(): void {
    const systemPermissions: Omit<Permission, 'isSystemPermission'>[] = [
      // Global permissions
      { id: '*', name: 'All Permissions', description: 'Unrestricted access', resource: '*', action: '*', scope: 'global', category: 'system' },
      
      // Tenant management
      { id: 'tenant:create', name: 'Create Tenant', description: 'Create new tenants', resource: 'tenant', action: 'create', scope: 'global', category: 'tenant' },
      { id: 'tenant:delete', name: 'Delete Tenant', description: 'Delete tenants', resource: 'tenant', action: 'delete', scope: 'global', category: 'tenant' },
      { id: 'tenant:*', name: 'Tenant Admin', description: 'Full tenant management', resource: 'tenant', action: '*', scope: 'tenant', category: 'tenant' },
      
      // User management
      { id: 'users:create', name: 'Create Users', description: 'Create new users', resource: 'users', action: 'create', scope: 'tenant', category: 'users' },
      { id: 'users:view', name: 'View Users', description: 'View user information', resource: 'users', action: 'view', scope: 'tenant', category: 'users' },
      { id: 'users:edit', name: 'Edit Users', description: 'Modify user information', resource: 'users', action: 'edit', scope: 'tenant', category: 'users' },
      { id: 'users:delete', name: 'Delete Users', description: 'Delete users', resource: 'users', action: 'delete', scope: 'tenant', category: 'users' },
      { id: 'users:manage', name: 'Manage Users', description: 'Full user management', resource: 'users', action: '*', scope: 'tenant', category: 'users' },
      
      // Role management
      { id: 'roles:create', name: 'Create Roles', description: 'Create custom roles', resource: 'roles', action: 'create', scope: 'tenant', category: 'security' },
      { id: 'roles:view', name: 'View Roles', description: 'View role information', resource: 'roles', action: 'view', scope: 'tenant', category: 'security' },
      { id: 'roles:edit', name: 'Edit Roles', description: 'Modify roles', resource: 'roles', action: 'edit', scope: 'tenant', category: 'security' },
      { id: 'roles:assign', name: 'Assign Roles', description: 'Assign roles to users', resource: 'roles', action: 'assign', scope: 'tenant', category: 'security' },
      { id: 'roles:manage', name: 'Manage Roles', description: 'Full role management', resource: 'roles', action: '*', scope: 'tenant', category: 'security' },
      
      // Patient management
      { id: 'patients:create', name: 'Create Patients', description: 'Add new patients', resource: 'patients', action: 'create', scope: 'tenant', category: 'clinical' },
      { id: 'patients:view', name: 'View Patients', description: 'View patient information', resource: 'patients', action: 'view', scope: 'tenant', category: 'clinical' },
      { id: 'patients:assigned', name: 'View Assigned Patients', description: 'View only assigned patients', resource: 'patients', action: 'view', scope: 'user', category: 'clinical' },
      { id: 'patients:edit', name: 'Edit Patients', description: 'Modify patient information', resource: 'patients', action: 'edit', scope: 'tenant', category: 'clinical' },
      { id: 'patients:manage', name: 'Manage Patients', description: 'Full patient management', resource: 'patients', action: '*', scope: 'tenant', category: 'clinical' },
      
      // Session management
      { id: 'sessions:create', name: 'Create Sessions', description: 'Start therapy sessions', resource: 'sessions', action: 'create', scope: 'tenant', category: 'clinical' },
      { id: 'sessions:view', name: 'View Sessions', description: 'View session data', resource: 'sessions', action: 'view', scope: 'tenant', category: 'clinical' },
      { id: 'sessions:basic', name: 'Basic Sessions', description: 'Basic session access', resource: 'sessions', action: 'basic', scope: 'user', category: 'clinical' },
      { id: 'sessions:manage', name: 'Manage Sessions', description: 'Full session management', resource: 'sessions', action: '*', scope: 'tenant', category: 'clinical' },
      
      // Communication
      { id: 'communication:use', name: 'Use Communication', description: 'Use AAC communication features', resource: 'communication', action: 'use', scope: 'user', category: 'communication' },
      { id: 'communication:assist', name: 'Assist Communication', description: 'Help others with communication', resource: 'communication', action: 'assist', scope: 'tenant', category: 'communication' },
      
      // Boards
      { id: 'boards:create', name: 'Create Boards', description: 'Create communication boards', resource: 'boards', action: 'create', scope: 'tenant', category: 'content' },
      { id: 'boards:personal', name: 'Personal Boards', description: 'Access personal boards only', resource: 'boards', action: 'personal', scope: 'user', category: 'content' },
      { id: 'boards:use', name: 'Use Boards', description: 'Use communication boards', resource: 'boards', action: 'use', scope: 'tenant', category: 'content' },
      
      // Analytics and Reports
      { id: 'analytics:view', name: 'View Analytics', description: 'Access analytics dashboards', resource: 'analytics', action: 'view', scope: 'tenant', category: 'reporting' },
      { id: 'reports:basic', name: 'Basic Reports', description: 'Generate basic reports', resource: 'reports', action: 'basic', scope: 'tenant', category: 'reporting' },
      { id: 'reports:progress', name: 'Progress Reports', description: 'Generate progress reports', resource: 'reports', action: 'progress', scope: 'tenant', category: 'reporting' },
      { id: 'reports:clinical', name: 'Clinical Reports', description: 'Generate clinical reports', resource: 'reports', action: 'clinical', scope: 'tenant', category: 'reporting' },
      { id: 'reports:financial', name: 'Financial Reports', description: 'Generate financial reports', resource: 'reports', action: 'financial', scope: 'tenant', category: 'reporting' },
      { id: 'reports:generate', name: 'Generate Reports', description: 'Generate all report types', resource: 'reports', action: '*', scope: 'tenant', category: 'reporting' },
      
      // Billing
      { id: 'billing:view', name: 'View Billing', description: 'View billing information', resource: 'billing', action: 'view', scope: 'tenant', category: 'billing' },
      { id: 'billing:manage', name: 'Manage Billing', description: 'Full billing management', resource: 'billing', action: '*', scope: 'tenant', category: 'billing' },
      
      // Settings
      { id: 'settings:view', name: 'View Settings', description: 'View system settings', resource: 'settings', action: 'view', scope: 'tenant', category: 'configuration' },
      { id: 'settings:manage', name: 'Manage Settings', description: 'Modify system settings', resource: 'settings', action: '*', scope: 'tenant', category: 'configuration' },
      
      // Games and Education
      { id: 'games:play', name: 'Play Games', description: 'Access educational games', resource: 'games', action: 'play', scope: 'user', category: 'education' },
      { id: 'games:access', name: 'Games Access', description: 'Full games access', resource: 'games', action: '*', scope: 'tenant', category: 'education' },
      { id: 'education:manage', name: 'Manage Education', description: 'Manage educational content', resource: 'education', action: '*', scope: 'tenant', category: 'education' },
      
      // Goals
      { id: 'goals:create', name: 'Create Goals', description: 'Create therapy goals', resource: 'goals', action: 'create', scope: 'tenant', category: 'clinical' },
      { id: 'goals:manage', name: 'Manage Goals', description: 'Full goal management', resource: 'goals', action: '*', scope: 'tenant', category: 'clinical' },
      
      // Profile
      { id: 'profile:own', name: 'Own Profile', description: 'Manage own profile', resource: 'profile', action: 'own', scope: 'user', category: 'personal' },
      { id: 'profile:view', name: 'View Profiles', description: 'View user profiles', resource: 'profile', action: 'view', scope: 'tenant', category: 'personal' },
      
      // General viewing
      { id: 'view:assigned', name: 'View Assigned', description: 'View assigned resources only', resource: '*', action: 'view', scope: 'user', category: 'general' }
    ];

    systemPermissions.forEach(permData => {
      const permission: Permission = {
        ...permData,
        isSystemPermission: true
      };
      this.permissions.set(permission.id, permission);
    });
  }

  private setupEventListeners(): void {
    // Listen for tenant changes
    window.addEventListener('tenantChanged', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleTenantChange(customEvent.detail.tenant);
    });

    // Listen for user login/logout
    window.addEventListener('userLogin', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.createAccessSession(customEvent.detail.user);
    });

    window.addEventListener('userLogout', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.endAccessSession(customEvent.detail.sessionId);
    });
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    this.sessionCleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  // Role Management
  async createRole(
    tenantId: string,
    roleData: Omit<Role, 'id' | 'tenantId' | 'type' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    createdBy: string
  ): Promise<Role> {
    const roleId = `role-${Date.now()}`;
    
    const role: Role = {
      ...roleData,
      id: roleId,
      tenantId,
      type: 'custom',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    // Validate permissions
    this.validateRolePermissions(role.permissions);

    this.roles.set(roleId, role);
    this.saveRoles();

    this.auditService.logAction('role_created', {
      roleId,
      tenantId,
      name: role.name,
      permissions: role.permissions.length
    });

    return role;
  }

  async updateRole(
    roleId: string,
    updates: Partial<Pick<Role, 'name' | 'description' | 'permissions' | 'constraints'>>,
    updatedBy: string
  ): Promise<Role> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    if (role.type === 'system') {
      throw new Error('Cannot modify system roles');
    }

    // Validate permissions if being updated
    if (updates.permissions) {
      this.validateRolePermissions(updates.permissions);
    }

    Object.assign(role, updates);
    role.updatedAt = new Date();

    this.roles.set(roleId, role);
    this.saveRoles();

    // Clear permission cache for users with this role
    this.clearPermissionCache(roleId);

    this.auditService.logAction('role_updated', {
      roleId,
      changes: Object.keys(updates),
      updatedBy
    });

    return role;
  }

  async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    if (role.type === 'system') {
      throw new Error('Cannot delete system roles');
    }

    // Check if role is assigned to any users
    const assignedUsers = this.findUsersWithRole(roleId);
    if (assignedUsers.length > 0) {
      throw new Error(`Cannot delete role: assigned to ${assignedUsers.length} users`);
    }

    this.roles.delete(roleId);
    this.saveRoles();

    this.auditService.logAction('role_deleted', {
      roleId,
      name: role.name,
      deletedBy
    });
  }

  // User Role Assignment
  async assignRole(
    userId: string,
    roleId: string,
    tenantId: string,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<UserRole> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    // Check if user already has this role
    const userRoles = this.userRoles.get(userId) || [];
    const existingRole = userRoles.find(ur => 
      ur.roleId === roleId && ur.tenantId === tenantId && ur.isActive
    );

    if (existingRole) {
      throw new Error(`User already has role ${roleId} in tenant ${tenantId}`);
    }

    const userRole: UserRole = {
      userId,
      roleId,
      tenantId,
      assignedAt: new Date(),
      assignedBy,
      expiresAt,
      isActive: true
    };

    userRoles.push(userRole);
    this.userRoles.set(userId, userRoles);
    this.saveUserRoles();

    // Clear user's permission cache
    this.clearUserPermissionCache(userId);

    this.auditService.logAction('role_assigned', {
      userId,
      roleId,
      tenantId,
      assignedBy,
      expiresAt: expiresAt?.toISOString()
    });

    return userRole;
  }

  async revokeRole(
    userId: string,
    roleId: string,
    tenantId: string,
    revokedBy: string
  ): Promise<void> {
    const userRoles = this.userRoles.get(userId) || [];
    const roleIndex = userRoles.findIndex(ur => 
      ur.roleId === roleId && ur.tenantId === tenantId && ur.isActive
    );

    if (roleIndex === -1) {
      throw new Error(`User does not have role ${roleId} in tenant ${tenantId}`);
    }

    userRoles[roleIndex].isActive = false;
    this.userRoles.set(userId, userRoles);
    this.saveUserRoles();

    // Clear user's permission cache
    this.clearUserPermissionCache(userId);

    this.auditService.logAction('role_revoked', {
      userId,
      roleId,
      tenantId,
      revokedBy
    });
  }

  // Permission Checking
  async hasPermission(
    userId: string,
    permission: string,
    tenantId: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    // Check cache first
    const cacheKey = `${userId}:${permission}:${tenantId}`;
    const cached = this.policyEvaluationCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    const result = await this.evaluatePermission(userId, permission, tenantId, context);
    
    // Cache result for 5 minutes
    this.policyEvaluationCache.set(cacheKey, {
      result,
      expiry: Date.now() + 5 * 60 * 1000
    });

    // Log access request
    this.logAccessRequest({
      userId,
      tenantId,
      resource: permission.split(':')[0],
      action: permission.split(':')[1] || 'access',
      context,
      result: result ? 'granted' : 'denied'
    });

    return result;
  }

  private async evaluatePermission(
    userId: string,
    permission: string,
    tenantId: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    // Get user's active roles
    const userRoles = this.getUserActiveRoles(userId, tenantId);
    
    // Check if user has any active roles
    if (userRoles.length === 0) {
      return false;
    }

    // Check each role's permissions
    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (!role) continue;

      // Check role constraints
      if (!this.checkRoleConstraints(userRole, context)) {
        continue;
      }

      // Check permissions
      if (this.roleHasPermission(role, permission, tenantId)) {
        // Check security policies
        if (await this.checkSecurityPolicies(userId, permission, tenantId, context)) {
          return true;
        }
      }
    }

    return false;
  }

  private roleHasPermission(role: Role, permission: string, tenantId: string): boolean {
    // Check for wildcard permission
    if (role.permissions.includes('*')) {
      return true;
    }

    // Check direct permission
    if (role.permissions.includes(permission)) {
      return true;
    }

    // Check wildcard patterns
    for (const rolePermission of role.permissions) {
      if (this.matchesPermissionPattern(permission, rolePermission)) {
        return true;
      }
    }

    // Check inherited permissions
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        const inheritedRole = this.roles.get(inheritedRoleId);
        if (inheritedRole && this.roleHasPermission(inheritedRole, permission, tenantId)) {
          return true;
        }
      }
    }

    return false;
  }

  private matchesPermissionPattern(permission: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(permission);
  }

  private checkRoleConstraints(
    userRole: UserRole,
    context?: Record<string, unknown>
  ): boolean {
    const role = this.roles.get(userRole.roleId);
    if (!role?.constraints) {
      return true;
    }

    const constraints = role.constraints;
    const now = new Date();

    // Check expiration
    if (userRole.expiresAt && now > userRole.expiresAt) {
      return false;
    }

    // Check time restrictions
    if (constraints.timeRestrictions) {
      const allowed = constraints.timeRestrictions.some(restriction => {
        return this.isTimeAllowed(now, restriction);
      });
      if (!allowed) {
        return false;
      }
    }

    // Check IP restrictions
    if (constraints.ipRestrictions && context?.ipAddress) {
      const allowed = constraints.ipRestrictions.some(allowedIP => {
        return this.matchesIPPattern(context.ipAddress as string, allowedIP);
      });
      if (!allowed) {
        return false;
      }
    }

    // Check device restrictions
    if (constraints.deviceRestrictions && context?.deviceId) {
      if (!constraints.deviceRestrictions.includes(context.deviceId as string)) {
        return false;
      }
    }

    return true;
  }

  private isTimeAllowed(now: Date, restriction: TimeRestriction): boolean {
    const dayOfWeek = now.getDay();
    if (!restriction.dayOfWeek.includes(dayOfWeek)) {
      return false;
    }

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= restriction.startTime && currentTime <= restriction.endTime;
  }

  private matchesIPPattern(ip: string, pattern: string): boolean {
    // Simple IP pattern matching (could be enhanced with CIDR support)
    return pattern === '*' || ip === pattern || pattern.includes('*') && new RegExp(pattern.replace(/\*/g, '.*')).test(ip);
  }

  private async checkSecurityPolicies(
    userId: string,
    permission: string,
    tenantId: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    const policies = Array.from(this.securityPolicies.values())
      .filter(p => p.tenantId === tenantId && p.isActive)
      .sort((a, b) => b.rules[0]?.priority - a.rules[0]?.priority);

    for (const policy of policies) {
      for (const rule of policy.rules) {
        if (this.evaluateSecurityRule(rule, { userId, permission, tenantId, ...context })) {
          switch (rule.action) {
            case 'deny':
              return false;
            case 'allow':
              return true;
            case 'require-approval':
              // Would integrate with approval workflow
              return false;
            case 'log-only':
              // Continue evaluation
              break;
          }
        }
      }
    }

    return true; // Default allow if no policies deny
  }

  private evaluateSecurityRule(
    rule: SecurityRule,
    context: Record<string, unknown>
  ): boolean {
    try {
      // Simple expression evaluation (in production, use a safe evaluator)
      const func = new Function('context', `return ${rule.condition}`);
      return func(context);
    } catch (error) {
      console.error('Error evaluating security rule:', error);
      return false;
    }
  }

  // Session Management
  private createAccessSession(user: { id: string; tenantId: string }): void {
    const sessionId = `session-${Date.now()}`;
    const userRoles = this.getUserActiveRoles(user.id, user.tenantId);
    const permissions = this.getUserPermissions(user.id, user.tenantId);
    const constraints = this.getUserConstraints(user.id, user.tenantId);

    const session: AccessSession = {
      id: sessionId,
      userId: user.id,
      tenantId: user.tenantId,
      roles: userRoles.map(ur => ur.roleId),
      permissions,
      constraints,
      startTime: new Date(),
      lastActivity: new Date(),
      ipAddress: 'unknown', // Would be populated from request
      userAgent: 'unknown', // Would be populated from request
      isActive: true
    };

    this.accessSessions.set(sessionId, session);
  }

  private endAccessSession(sessionId: string): void {
    const session = this.accessSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.auditService.logAction('session_ended', {
        sessionId,
        userId: session.userId,
        duration: Date.now() - session.startTime.getTime()
      });
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    this.accessSessions.forEach((session, sessionId) => {
      const maxSessionAge = session.constraints.sessionDuration || 8 * 60 * 60 * 1000; // 8 hours default
      if (now - session.lastActivity.getTime() > maxSessionAge) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.endAccessSession(sessionId);
      this.accessSessions.delete(sessionId);
    });
  }

  // Helper Methods
  private getUserActiveRoles(userId: string, tenantId: string): UserRole[] {
    const userRoles = this.userRoles.get(userId) || [];
    const now = new Date();
    
    return userRoles.filter(ur => 
      ur.tenantId === tenantId &&
      ur.isActive &&
      (!ur.expiresAt || ur.expiresAt > now)
    );
  }

  private getUserPermissions(userId: string, tenantId: string): string[] {
    const userRoles = this.getUserActiveRoles(userId, tenantId);
    const permissions = new Set<string>();

    userRoles.forEach(userRole => {
      const role = this.roles.get(userRole.roleId);
      if (role) {
        role.permissions.forEach(permission => {
          permissions.add(permission);
        });

        // Add inherited permissions
        if (role.inherits) {
          role.inherits.forEach(inheritedRoleId => {
            const inheritedRole = this.roles.get(inheritedRoleId);
            if (inheritedRole) {
              inheritedRole.permissions.forEach(permission => {
                permissions.add(permission);
              });
            }
          });
        }
      }

      // Add temporary elevation permissions
      if (userRole.temporaryElevation && userRole.temporaryElevation.expiresAt > new Date()) {
        userRole.temporaryElevation.permissions.forEach(permission => {
          permissions.add(permission);
        });
      }
    });

    return Array.from(permissions);
  }

  private getUserConstraints(userId: string, tenantId: string): RoleConstraints {
    const userRoles = this.getUserActiveRoles(userId, tenantId);
    const combinedConstraints: RoleConstraints = {};

    userRoles.forEach(userRole => {
      const role = this.roles.get(userRole.roleId);
      if (role?.constraints) {
        // Merge constraints (most restrictive wins)
        if (role.constraints.maxConcurrentSessions) {
          combinedConstraints.maxConcurrentSessions = Math.min(
            combinedConstraints.maxConcurrentSessions || Infinity,
            role.constraints.maxConcurrentSessions
          );
        }

        if (role.constraints.sessionDuration) {
          combinedConstraints.sessionDuration = Math.min(
            combinedConstraints.sessionDuration || Infinity,
            role.constraints.sessionDuration
          );
        }

        if (role.constraints.requireMFA) {
          combinedConstraints.requireMFA = true;
        }

        // Combine restrictions
        if (role.constraints.timeRestrictions) {
          combinedConstraints.timeRestrictions = [
            ...(combinedConstraints.timeRestrictions || []),
            ...role.constraints.timeRestrictions
          ];
        }
      }
    });

    return combinedConstraints;
  }

  private validateRolePermissions(permissions: string[]): void {
    const invalidPermissions: string[] = [];

    permissions.forEach(permission => {
      if (permission === '*') return; // Wildcard allowed

      if (!this.permissions.has(permission) && !permission.includes('*')) {
        invalidPermissions.push(permission);
      }
    });

    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }
  }

  private findUsersWithRole(roleId: string): string[] {
    const usersWithRole: string[] = [];

    this.userRoles.forEach((roles, userId) => {
      const hasRole = roles.some(ur => ur.roleId === roleId && ur.isActive);
      if (hasRole) {
        usersWithRole.push(userId);
      }
    });

    return usersWithRole;
  }

  private logAccessRequest(request: Omit<AccessRequest, 'id' | 'timestamp'>): void {
    const accessRequest: AccessRequest = {
      ...request,
      id: `access-${Date.now()}`,
      timestamp: new Date()
    };

    this.accessLog.push(accessRequest);

    // Keep only last 10000 access requests
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-10000);
    }

    // Track analytics
    this.analyticsService.trackEvent('access_request', {
      resource: request.resource,
      action: request.action,
      result: request.result
    });
  }

  private clearPermissionCache(roleId: string): void {
    // Clear cache entries for users with this role
    const usersWithRole = this.findUsersWithRole(roleId);
    usersWithRole.forEach(userId => {
      this.clearUserPermissionCache(userId);
    });
  }

  private clearUserPermissionCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.policyEvaluationCache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => {
      this.policyEvaluationCache.delete(key);
    });
  }

  private handleTenantChange(tenant: { id: string }): void {
    // Clear permission cache when tenant changes
    this.policyEvaluationCache.clear();
  }

  // Data Persistence
  private loadPersistedData(): void {
    // Load roles
    const savedRoles = this.dataService.getData('rbac_roles');
    if (savedRoles) {
      Object.entries(savedRoles).forEach(([id, roleData]: [string, unknown]) => {
        const role = roleData as Role;
        role.createdAt = new Date(role.createdAt);
        role.updatedAt = new Date(role.updatedAt);
        this.roles.set(id, role);
      });
    }

    // Load permissions
    const savedPermissions = this.dataService.getData('rbac_permissions');
    if (savedPermissions) {
      Object.entries(savedPermissions).forEach(([id, permissionData]: [string, unknown]) => {
        this.permissions.set(id, permissionData as Permission);
      });
    }

    // Load user roles
    const savedUserRoles = this.dataService.getData('rbac_user_roles');
    if (savedUserRoles) {
      Object.entries(savedUserRoles).forEach(([userId, roles]: [string, unknown]) => {
        const userRoles = (roles as UserRole[]).map(ur => ({
          ...ur,
          assignedAt: new Date(ur.assignedAt),
          expiresAt: ur.expiresAt ? new Date(ur.expiresAt) : undefined
        }));
        this.userRoles.set(userId, userRoles);
      });
    }

    // Load security policies
    const savedPolicies = this.dataService.getData('rbac_security_policies');
    if (savedPolicies) {
      Object.entries(savedPolicies).forEach(([id, policyData]: [string, unknown]) => {
        const policy = policyData as SecurityPolicy;
        policy.createdAt = new Date(policy.createdAt);
        policy.updatedAt = new Date(policy.updatedAt);
        this.securityPolicies.set(id, policy);
      });
    }
  }

  private saveRoles(): void {
    const roleData: Record<string, Role> = {};
    this.roles.forEach((role, id) => {
      if (role.type === 'custom') { // Only save custom roles
        roleData[id] = role;
      }
    });
    this.dataService.setData('rbac_roles', roleData);
  }

  private saveUserRoles(): void {
    const userRoleData: Record<string, UserRole[]> = {};
    this.userRoles.forEach((roles, userId) => {
      userRoleData[userId] = roles;
    });
    this.dataService.setData('rbac_user_roles', userRoleData);
  }

  // Public API
  getRoles(tenantId?: string): Role[] {
    const roles = Array.from(this.roles.values());
    if (tenantId) {
      return roles.filter(r => r.tenantId === tenantId || r.tenantId === 'system');
    }
    return roles;
  }

  getPermissions(category?: string): Permission[] {
    const permissions = Array.from(this.permissions.values());
    if (category) {
      return permissions.filter(p => p.category === category);
    }
    return permissions;
  }

  getUserRoles(userId: string, tenantId?: string): UserRole[] {
    const userRoles = this.userRoles.get(userId) || [];
    if (tenantId) {
      return userRoles.filter(ur => ur.tenantId === tenantId && ur.isActive);
    }
    return userRoles.filter(ur => ur.isActive);
  }

  getAccessLog(limit: number = 1000): AccessRequest[] {
    return this.accessLog.slice(-limit);
  }

  async checkMultiplePermissions(
    userId: string,
    permissions: string[],
    tenantId: string,
    context?: Record<string, unknown>
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const permission of permissions) {
      results[permission] = await this.hasPermission(userId, permission, tenantId, context);
    }
    
    return results;
  }

  // Cleanup
  destroy(): void {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
    
    this.saveRoles();
    this.saveUserRoles();
  }
}

export function getRBACService(): RBACService {
  return RBACService.getInstance();
}