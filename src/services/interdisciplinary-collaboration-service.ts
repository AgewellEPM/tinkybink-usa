/**
 * Interdisciplinary Team Collaboration Service
 * Seamless coordination between SLP, ABA, OT, PT, and other professionals
 * 
 * Features:
 * - Team communication hub
 * - Shared goal alignment
 * - Cross-disciplinary progress tracking
 * - Unified assessment protocols
 * - Case conferencing tools
 * - Treatment plan coordination
 * 
 * @author TinkyBink AAC Platform
 * @version 3.0.0
 */

import { mlDataCollection } from './ml-data-collection';
import { therapyGoalTrackingService } from './therapy-goal-tracking-service';
import { advancedAnalyticsDashboardService } from './advanced-analytics-dashboard-service';

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  credentials: string;
  role: 'slp' | 'aba' | 'ot' | 'pt' | 'psychologist' | 'teacher' | 'parent' | 'caregiver' | 'medical_doctor' | 'nurse';
  specializations: string[];
  
  contact_info: {
    email: string;
    phone?: string;
    office_location?: string;
    availability: Array<{
      day: string;
      start_time: string;
      end_time: string;
    }>;
  };
  
  permissions: {
    view_reports: boolean;
    edit_goals: boolean;
    schedule_sessions: boolean;
    access_recordings: boolean;
    family_communication: boolean;
  };
  
  joined_at: Date;
  last_active: Date;
}

interface CareTeam {
  id: string;
  patient_id: string;
  team_name: string;
  
  members: TeamMember[];
  lead_coordinator: string; // team member id
  
  // Team Configuration
  communication_preferences: {
    primary_channel: 'email' | 'platform' | 'text' | 'video';
    update_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
    meeting_schedule: {
      frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
      day_of_week: string;
      time: string;
      duration_minutes: number;
    };
  };
  
  // Shared Resources
  shared_documents: Array<{
    id: string;
    title: string;
    type: 'assessment' | 'report' | 'plan' | 'resource' | 'form';
    url: string;
    uploaded_by: string;
    uploaded_at: Date;
    permissions: string[]; // team member ids who can access
  }>;
  
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface SharedGoal {
  id: string;
  patient_id: string;
  team_id: string;
  
  // Goal Details
  primary_discipline: 'slp' | 'aba' | 'ot' | 'pt';
  contributing_disciplines: ('slp' | 'aba' | 'ot' | 'pt')[];
  
  goal_statement: string;
  functional_outcome: string;
  
  // Discipline-Specific Objectives
  discipline_objectives: Map<string, {
    objective: string;
    measurement: string;
    frequency: string;
    responsible_team_member: string;
    target_date: Date;
  }>;
  
  // Progress Coordination
  progress_sharing: {
    data_points: Array<{
      discipline: string;
      team_member_id: string;
      date: Date;
      progress_data: any;
      notes: string;
    }>;
    
    consolidated_progress: {
      overall_percentage: number;
      trend: 'improving' | 'stable' | 'declining';
      next_review_date: Date;
    };
  };
  
  status: 'active' | 'achieved' | 'modified' | 'discontinued';
  created_at: Date;
}

interface TeamCommunication {
  id: string;
  team_id: string;
  thread_id?: string; // for threading messages
  
  sender_id: string;
  recipient_ids: string[]; // empty for team-wide messages
  
  message: {
    type: 'text' | 'voice' | 'video' | 'file' | 'goal_update' | 'session_summary';
    content: string;
    attachments?: Array<{
      type: 'image' | 'video' | 'audio' | 'document' | 'data';
      url: string;
      name: string;
    }>;
  };
  
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requires_response: boolean;
  
  // Collaboration Features
  mentions: string[]; // team member ids mentioned
  tags: string[]; // categorization tags
  
  // Status Tracking
  read_by: Array<{
    team_member_id: string;
    read_at: Date;
  }>;
  
  responded_by: Array<{
    team_member_id: string;
    response_message_id: string;
    responded_at: Date;
  }>;
  
  timestamp: Date;
}

interface CaseConference {
  id: string;
  team_id: string;
  patient_id: string;
  
  // Conference Details
  title: string;
  purpose: 'initial_planning' | 'progress_review' | 'discharge_planning' | 'crisis_intervention' | 'transition_planning';
  
  scheduled_date: Date;
  duration_minutes: number;
  location: 'in_person' | 'virtual' | 'hybrid';
  meeting_link?: string;
  
  // Participants
  required_attendees: string[]; // team member ids
  optional_attendees: string[];
  actual_attendees: string[];
  
  // Agenda
  agenda_items: Array<{
    topic: string;
    presenter: string;
    duration_minutes: number;
    supporting_documents: string[];
  }>;
  
  // Discussion & Decisions
  meeting_notes: {
    discussion_points: string[];
    decisions_made: Array<{
      decision: string;
      responsible_party: string;
      due_date: Date;
      follow_up_required: boolean;
    }>;
    action_items: Array<{
      action: string;
      assigned_to: string;
      due_date: Date;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  
  // Follow-up
  next_meeting_date?: Date;
  follow_up_communications: string[]; // message ids
  
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at: Date;
}

interface IntegratedAssessment {
  id: string;
  patient_id: string;
  team_id: string;
  
  // Assessment Overview
  assessment_type: 'initial' | 'progress' | 'annual' | 'discharge' | 'transition';
  assessment_date: Date;
  
  // Multi-Disciplinary Input
  discipline_assessments: Map<string, {
    assessor_id: string;
    assessment_tools: string[];
    raw_scores: Record<string, number>;
    standardized_scores: Record<string, number>;
    percentiles: Record<string, number>;
    qualitative_observations: string;
    recommendations: string[];
    completed_date: Date;
  }>;
  
  // Integrated Analysis
  integrated_summary: {
    primary_concerns: string[];
    strengths: string[];
    areas_of_need: string[];
    functional_impact: string;
    
    // Cross-Disciplinary Patterns
    consistent_findings: string[];
    conflicting_findings: string[];
    gaps_identified: string[];
    
    // Consensus Recommendations
    prioritized_goals: Array<{
      goal: string;
      rationale: string;
      contributing_disciplines: string[];
      timeline: string;
    }>;
  };
  
  // Plan Development
  treatment_plan: {
    service_delivery_model: 'individual' | 'group' | 'consultation' | 'integrated';
    frequency_recommendations: Map<string, string>; // discipline -> frequency
    environment_recommendations: string[];
    family_involvement_plan: string;
    
    coordination_plan: {
      communication_schedule: string;
      progress_monitoring: string;
      data_sharing_protocol: string;
    };
  };
  
  status: 'in_progress' | 'completed' | 'reviewed' | 'approved';
  created_by: string;
  completed_at?: Date;
}

class InterdisciplinaryCollaborationService {
  private static instance: InterdisciplinaryCollaborationService;
  private careTeams: Map<string, CareTeam> = new Map();
  private sharedGoals: Map<string, SharedGoal> = new Map();
  private communications: Map<string, TeamCommunication[]> = new Map(); // teamId -> messages
  private conferences: Map<string, CaseConference> = new Map();
  private assessments: Map<string, IntegratedAssessment> = new Map();
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): InterdisciplinaryCollaborationService {
    if (!InterdisciplinaryCollaborationService.instance) {
      InterdisciplinaryCollaborationService.instance = new InterdisciplinaryCollaborationService();
    }
    return InterdisciplinaryCollaborationService.instance;
  }
  
  /**
   * Initialize collaboration service
   */
  private async initializeService(): Promise<void> {
    console.log('🤝 Initializing Interdisciplinary Collaboration Service...');
    
    // Set up real-time communication
    this.setupRealTimeCommunication();
    
    // Set up automated notifications
    this.setupAutomatedNotifications();
    
    console.log('✅ Collaboration Service Ready');
  }
  
  /**
   * Create care team for patient
   */
  async createCareTeam(
    patientId: string,
    teamName: string,
    leadCoordinatorId: string,
    createdBy: string
  ): Promise<string> {
    const teamId = `team_${Date.now()}`;
    
    const careTeam: CareTeam = {
      id: teamId,
      patient_id: patientId,
      team_name: teamName,
      members: [],
      lead_coordinator: leadCoordinatorId,
      
      communication_preferences: {
        primary_channel: 'platform',
        update_frequency: 'weekly',
        meeting_schedule: {
          frequency: 'biweekly',
          day_of_week: 'Tuesday',
          time: '10:00 AM',
          duration_minutes: 60
        }
      },
      
      shared_documents: [],
      
      created_by: createdBy,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.careTeams.set(teamId, careTeam);
    this.communications.set(teamId, []);
    
    console.log(`✅ Care team created: ${teamName} for patient ${patientId}`);
    
    // Track team creation
    await mlDataCollection.trackInteraction(createdBy, {
      type: 'care_team_created',
      metadata: {
        teamId,
        patientId,
        teamName
      },
      timestamp: new Date()
    });
    
    return teamId;
  }
  
  /**
   * Add team member
   */
  async addTeamMember(
    teamId: string,
    memberData: Partial<TeamMember>
  ): Promise<void> {
    const team = this.careTeams.get(teamId);
    if (!team) throw new Error('Team not found');
    
    const memberId = `member_${Date.now()}`;
    
    const teamMember: TeamMember = {
      id: memberId,
      user_id: memberData.user_id!,
      name: memberData.name!,
      credentials: memberData.credentials || '',
      role: memberData.role!,
      specializations: memberData.specializations || [],
      
      contact_info: memberData.contact_info || {
        email: '',
        availability: []
      },
      
      permissions: memberData.permissions || {
        view_reports: true,
        edit_goals: false,
        schedule_sessions: false,
        access_recordings: false,
        family_communication: false
      },
      
      joined_at: new Date(),
      last_active: new Date()
    };
    
    team.members.push(teamMember);
    team.updated_at = new Date();
    
    // Send welcome message to team
    await this.sendTeamMessage(teamId, 'system', [], {
      type: 'text',
      content: `${teamMember.name} (${teamMember.role.toUpperCase()}) has joined the team!`
    }, 'normal', false);
    
    console.log(`👥 Added team member: ${teamMember.name} (${teamMember.role})`);
  }
  
  /**
   * Create shared goal across disciplines
   */
  async createSharedGoal(
    patientId: string,
    teamId: string,
    goalData: Partial<SharedGoal>
  ): Promise<string> {
    const goalId = `shared_goal_${Date.now()}`;
    
    const sharedGoal: SharedGoal = {
      id: goalId,
      patient_id: patientId,
      team_id: teamId,
      
      primary_discipline: goalData.primary_discipline!,
      contributing_disciplines: goalData.contributing_disciplines || [],
      
      goal_statement: goalData.goal_statement!,
      functional_outcome: goalData.functional_outcome!,
      
      discipline_objectives: goalData.discipline_objectives || new Map(),
      
      progress_sharing: {
        data_points: [],
        consolidated_progress: {
          overall_percentage: 0,
          trend: 'stable',
          next_review_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        }
      },
      
      status: 'active',
      created_at: new Date()
    };
    
    this.sharedGoals.set(goalId, sharedGoal);
    
    // Notify team about new shared goal
    await this.sendTeamMessage(teamId, 'system', [], {
      type: 'goal_update',
      content: `New shared goal created: ${goalData.goal_statement}`
    }, 'normal', false);
    
    console.log(`🎯 Shared goal created: ${goalData.goal_statement}`);
    return goalId;
  }
  
  /**
   * Send message to team
   */
  async sendTeamMessage(
    teamId: string,
    senderId: string,
    recipientIds: string[],
    message: TeamCommunication['message'],
    priority: TeamCommunication['priority'] = 'normal',
    requiresResponse: boolean = false
  ): Promise<string> {
    const messageId = `msg_${Date.now()}`;
    
    const communication: TeamCommunication = {
      id: messageId,
      team_id: teamId,
      sender_id: senderId,
      recipient_ids: recipientIds,
      message,
      priority,
      requires_response: requiresResponse,
      mentions: this.extractMentions(message.content),
      tags: this.extractTags(message.content),
      read_by: [],
      responded_by: [],
      timestamp: new Date()
    };
    
    // Add to team communications
    const teamMessages = this.communications.get(teamId) || [];
    teamMessages.push(communication);
    this.communications.set(teamId, teamMessages);
    
    // Send notifications
    await this.sendMessageNotifications(teamId, communication);
    
    console.log(`💬 Team message sent: ${message.content.substring(0, 50)}...`);
    return messageId;
  }
  
  /**
   * Schedule case conference
   */
  async scheduleCaseConference(
    teamId: string,
    conferenceData: Partial<CaseConference>
  ): Promise<string> {
    const conferenceId = `conf_${Date.now()}`;
    
    const conference: CaseConference = {
      id: conferenceId,
      team_id: teamId,
      patient_id: conferenceData.patient_id!,
      
      title: conferenceData.title || 'Team Case Conference',
      purpose: conferenceData.purpose || 'progress_review',
      
      scheduled_date: conferenceData.scheduled_date!,
      duration_minutes: conferenceData.duration_minutes || 60,
      location: conferenceData.location || 'virtual',
      meeting_link: conferenceData.meeting_link,
      
      required_attendees: conferenceData.required_attendees || [],
      optional_attendees: conferenceData.optional_attendees || [],
      actual_attendees: [],
      
      agenda_items: conferenceData.agenda_items || [],
      
      meeting_notes: {
        discussion_points: [],
        decisions_made: [],
        action_items: []
      },
      
      status: 'scheduled',
      created_by: conferenceData.created_by!,
      created_at: new Date()
    };
    
    this.conferences.set(conferenceId, conference);
    
    // Send calendar invites
    await this.sendConferenceInvites(conference);
    
    console.log(`📅 Case conference scheduled: ${conference.title}`);
    return conferenceId;
  }
  
  /**
   * Update shared goal progress
   */
  async updateSharedGoalProgress(
    goalId: string,
    teamMemberId: string,
    discipline: string,
    progressData: any,
    notes: string
  ): Promise<void> {
    const goal = this.sharedGoals.get(goalId);
    if (!goal) throw new Error('Goal not found');
    
    // Add progress data point
    goal.progress_sharing.data_points.push({
      discipline,
      team_member_id: teamMemberId,
      date: new Date(),
      progress_data: progressData,
      notes
    });
    
    // Recalculate consolidated progress
    await this.recalculateGoalProgress(goal);
    
    // Notify team about progress update
    await this.sendTeamMessage(goal.team_id, teamMemberId, [], {
      type: 'goal_update',
      content: `Progress update for "${goal.goal_statement}": ${notes}`
    }, 'normal', false);
    
    console.log(`📊 Goal progress updated by ${discipline}: ${notes}`);
  }
  
  /**
   * Create integrated assessment
   */
  async createIntegratedAssessment(
    patientId: string,
    teamId: string,
    assessmentType: IntegratedAssessment['assessment_type'],
    createdBy: string
  ): Promise<string> {
    const assessmentId = `assess_${Date.now()}`;
    
    const assessment: IntegratedAssessment = {
      id: assessmentId,
      patient_id: patientId,
      team_id: teamId,
      
      assessment_type: assessmentType,
      assessment_date: new Date(),
      
      discipline_assessments: new Map(),
      
      integrated_summary: {
        primary_concerns: [],
        strengths: [],
        areas_of_need: [],
        functional_impact: '',
        consistent_findings: [],
        conflicting_findings: [],
        gaps_identified: [],
        prioritized_goals: []
      },
      
      treatment_plan: {
        service_delivery_model: 'individual',
        frequency_recommendations: new Map(),
        environment_recommendations: [],
        family_involvement_plan: '',
        coordination_plan: {
          communication_schedule: 'Weekly team check-ins',
          progress_monitoring: 'Bi-weekly data sharing',
          data_sharing_protocol: 'Real-time platform updates'
        }
      },
      
      status: 'in_progress',
      created_by: createdBy
    };
    
    this.assessments.set(assessmentId, assessment);
    
    // Notify team about new assessment
    await this.sendTeamMessage(teamId, createdBy, [], {
      type: 'text',
      content: `New integrated assessment started: ${assessmentType} assessment`
    }, 'high', false);
    
    console.log(`📋 Integrated assessment created: ${assessmentType}`);
    return assessmentId;
  }
  
  /**
   * Add discipline assessment to integrated assessment
   */
  async addDisciplineAssessment(
    assessmentId: string,
    discipline: string,
    assessorId: string,
    assessmentData: any
  ): Promise<void> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) throw new Error('Assessment not found');
    
    assessment.discipline_assessments.set(discipline, {
      assessor_id: assessorId,
      assessment_tools: assessmentData.assessment_tools || [],
      raw_scores: assessmentData.raw_scores || {},
      standardized_scores: assessmentData.standardized_scores || {},
      percentiles: assessmentData.percentiles || {},
      qualitative_observations: assessmentData.qualitative_observations || '',
      recommendations: assessmentData.recommendations || [],
      completed_date: new Date()
    });
    
    // Check if all disciplines have completed their assessments
    const team = this.careTeams.get(assessment.team_id);
    if (team) {
      const requiredDisciplines = [...new Set(team.members.map(m => m.role))];
      const completedDisciplines = Array.from(assessment.discipline_assessments.keys());
      
      if (requiredDisciplines.every(d => completedDisciplines.includes(d))) {
        // All assessments complete - generate integrated summary
        await this.generateIntegratedSummary(assessment);
      }
    }
    
    console.log(`📊 ${discipline} assessment added to integrated assessment`);
  }
  
  /**
   * Get team dashboard data
   */
  async getTeamDashboard(teamId: string): Promise<any> {
    const team = this.careTeams.get(teamId);
    if (!team) throw new Error('Team not found');
    
    // Get team communications
    const recentMessages = (this.communications.get(teamId) || [])
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    // Get shared goals
    const teamGoals = Array.from(this.sharedGoals.values())
      .filter(goal => goal.team_id === teamId);
    
    // Get upcoming conferences
    const upcomingConferences = Array.from(this.conferences.values())
      .filter(conf => conf.team_id === teamId && conf.scheduled_date > new Date())
      .sort((a, b) => a.scheduled_date.getTime() - b.scheduled_date.getTime());
    
    // Calculate team metrics
    const teamMetrics = await this.calculateTeamMetrics(teamId);
    
    return {
      team_info: {
        name: team.team_name,
        member_count: team.members.length,
        disciplines_represented: [...new Set(team.members.map(m => m.role))],
        lead_coordinator: team.members.find(m => m.id === team.lead_coordinator)?.name
      },
      
      recent_activity: {
        messages: recentMessages.slice(0, 5),
        goal_updates: teamGoals.filter(g => 
          g.progress_sharing.data_points.some(dp => 
            (Date.now() - dp.date.getTime()) < 7 * 24 * 60 * 60 * 1000
          )
        )
      },
      
      goals_overview: {
        total_goals: teamGoals.length,
        active_goals: teamGoals.filter(g => g.status === 'active').length,
        achieved_goals: teamGoals.filter(g => g.status === 'achieved').length,
        progress_summary: teamGoals.map(g => ({
          goal: g.goal_statement,
          progress: g.progress_sharing.consolidated_progress.overall_percentage,
          trend: g.progress_sharing.consolidated_progress.trend
        }))
      },
      
      upcoming_events: upcomingConferences.slice(0, 3),
      
      team_metrics: teamMetrics,
      
      communication_stats: {
        messages_this_week: recentMessages.filter(m => 
          (Date.now() - m.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000
        ).length,
        response_rate: this.calculateResponseRate(teamId),
        most_active_member: this.getMostActiveMember(teamId)
      }
    };
  }
  
  // Private helper methods
  
  private setupRealTimeCommunication(): void {
    console.log('🔄 Setting up real-time team communication...');
    
    // Set up WebSocket connections for real-time messaging
    // In production, would use Socket.io or similar
    
    // Set up push notifications
    // In production, would integrate with push notification service
  }
  
  private setupAutomatedNotifications(): void {
    console.log('🔔 Setting up automated notifications...');
    
    // Daily digest notifications
    setInterval(() => {
      this.sendDailyDigests();
    }, 24 * 60 * 60 * 1000); // Daily
    
    // Goal review reminders
    setInterval(() => {
      this.sendGoalReviewReminders();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }
  
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }
  
  private extractTags(content: string): string[] {
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    
    return tags;
  }
  
  private async sendMessageNotifications(teamId: string, message: TeamCommunication): Promise<void> {
    const team = this.careTeams.get(teamId);
    if (!team) return;
    
    // Determine who should be notified
    const recipients = message.recipient_ids.length > 0 ? 
      team.members.filter(m => message.recipient_ids.includes(m.id)) :
      team.members.filter(m => m.id !== message.sender_id);
    
    // Send notifications based on priority and preferences
    for (const recipient of recipients) {
      if (message.priority === 'urgent' || message.mentions.includes(recipient.id)) {
        // Send immediate notification
        console.log(`🚨 Urgent notification sent to ${recipient.name}`);
      } else {
        // Queue for digest
        console.log(`📬 Message queued for ${recipient.name}'s digest`);
      }
    }
  }
  
  private async sendConferenceInvites(conference: CaseConference): Promise<void> {
    const team = this.careTeams.get(conference.team_id);
    if (!team) return;
    
    const allAttendees = [...conference.required_attendees, ...conference.optional_attendees];
    
    for (const attendeeId of allAttendees) {
      const member = team.members.find(m => m.id === attendeeId);
      if (member) {
        // Send calendar invite
        console.log(`📅 Calendar invite sent to ${member.name} for ${conference.title}`);
        
        // Send platform notification
        await this.sendTeamMessage(conference.team_id, 'system', [attendeeId], {
          type: 'text',
          content: `You're invited to: ${conference.title} on ${conference.scheduled_date.toLocaleString()}`
        }, 'high', false);
      }
    }
  }
  
  private async recalculateGoalProgress(goal: SharedGoal): Promise<void> {
    const disciplineProgress = new Map<string, number>();
    
    // Calculate progress for each discipline
    goal.progress_sharing.data_points.forEach(dp => {
      if (!disciplineProgress.has(dp.discipline)) {
        disciplineProgress.set(dp.discipline, []);
      }
      disciplineProgress.get(dp.discipline)!.push(dp.progress_data.percentage || 0);
    });
    
    // Calculate overall progress (weighted average)
    let totalProgress = 0;
    let disciplineCount = 0;
    
    disciplineProgress.forEach((progressValues, discipline) => {
      const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;
      totalProgress += avgProgress;
      disciplineCount++;
    });
    
    goal.progress_sharing.consolidated_progress.overall_percentage = 
      disciplineCount > 0 ? Math.round(totalProgress / disciplineCount) : 0;
    
    // Determine trend
    const recentData = goal.progress_sharing.data_points
      .filter(dp => (Date.now() - dp.date.getTime()) < 14 * 24 * 60 * 60 * 1000)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (recentData.length >= 2) {
      const firstHalf = recentData.slice(0, Math.ceil(recentData.length / 2));
      const secondHalf = recentData.slice(Math.ceil(recentData.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, dp) => sum + (dp.progress_data.percentage || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, dp) => sum + (dp.progress_data.percentage || 0), 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) {
        goal.progress_sharing.consolidated_progress.trend = 'improving';
      } else if (secondAvg < firstAvg - 5) {
        goal.progress_sharing.consolidated_progress.trend = 'declining';
      } else {
        goal.progress_sharing.consolidated_progress.trend = 'stable';
      }
    }
  }
  
  private async generateIntegratedSummary(assessment: IntegratedAssessment): Promise<void> {
    console.log('🔄 Generating integrated assessment summary...');
    
    // Analyze all discipline assessments
    const allFindings: string[] = [];
    const allRecommendations: string[] = [];
    
    assessment.discipline_assessments.forEach((disciplineAssess, discipline) => {
      allFindings.push(...disciplineAssess.qualitative_observations.split('.'));
      allRecommendations.push(...disciplineAssess.recommendations);
    });
    
    // Find consistent patterns across disciplines
    const findingCounts = new Map<string, number>();
    allFindings.forEach(finding => {
      if (finding.trim()) {
        const key = finding.trim().toLowerCase();
        findingCounts.set(key, (findingCounts.get(key) || 0) + 1);
      }
    });
    
    // Findings mentioned by multiple disciplines are consistent
    assessment.integrated_summary.consistent_findings = Array.from(findingCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([finding]) => finding);
    
    // Generate prioritized goals
    const goalPriorities = this.prioritizeGoalsFromAssessment(assessment);
    assessment.integrated_summary.prioritized_goals = goalPriorities;
    
    // Update status
    assessment.status = 'completed';
    assessment.completed_at = new Date();
    
    // Notify team
    await this.sendTeamMessage(assessment.team_id, 'system', [], {
      type: 'text',
      content: `Integrated assessment completed. ${goalPriorities.length} prioritized goals identified.`
    }, 'high', false);
  }
  
  private prioritizeGoalsFromAssessment(assessment: IntegratedAssessment): any[] {
    // Mock goal prioritization - in production would use sophisticated analysis
    return [
      {
        goal: 'Improve functional communication for daily needs',
        rationale: 'Consistently identified across all disciplines as primary need',
        contributing_disciplines: ['slp', 'aba'],
        timeline: '6 months'
      },
      {
        goal: 'Develop fine motor skills for AAC device use',
        rationale: 'Critical for communication independence',
        contributing_disciplines: ['ot', 'slp'],
        timeline: '3 months'
      }
    ];
  }
  
  private async calculateTeamMetrics(teamId: string): Promise<any> {
    // Mock team metrics calculation
    return {
      goal_completion_rate: 78,
      average_response_time_hours: 4.2,
      collaboration_score: 8.5,
      patient_progress_velocity: 12.3
    };
  }
  
  private calculateResponseRate(teamId: string): number {
    const messages = this.communications.get(teamId) || [];
    const messagesRequiringResponse = messages.filter(m => m.requires_response);
    const respondedMessages = messagesRequiringResponse.filter(m => m.responded_by.length > 0);
    
    return messagesRequiringResponse.length > 0 ? 
      (respondedMessages.length / messagesRequiringResponse.length) * 100 : 100;
  }
  
  private getMostActiveMember(teamId: string): string {
    const messages = this.communications.get(teamId) || [];
    const memberActivity = new Map<string, number>();
    
    messages.forEach(msg => {
      memberActivity.set(msg.sender_id, (memberActivity.get(msg.sender_id) || 0) + 1);
    });
    
    const mostActive = Array.from(memberActivity.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    return mostActive ? mostActive[0] : 'none';
  }
  
  private async sendDailyDigests(): Promise<void> {
    console.log('📧 Sending daily team digests...');
    
    for (const [teamId, team] of this.careTeams) {
      const todaysMessages = (this.communications.get(teamId) || [])
        .filter(msg => {
          const today = new Date();
          const msgDate = msg.timestamp;
          return msgDate.toDateString() === today.toDateString();
        });
      
      if (todaysMessages.length > 0) {
        // Send digest to team members
        for (const member of team.members) {
          console.log(`📨 Daily digest sent to ${member.name}: ${todaysMessages.length} updates`);
        }
      }
    }
  }
  
  private async sendGoalReviewReminders(): Promise<void> {
    console.log('⏰ Sending goal review reminders...');
    
    for (const [goalId, goal] of this.sharedGoals) {
      const daysSinceReview = (Date.now() - goal.progress_sharing.consolidated_progress.next_review_date.getTime()) / (24 * 60 * 60 * 1000);
      
      if (daysSinceReview >= 0) { // Review date has passed
        await this.sendTeamMessage(goal.team_id, 'system', [], {
          type: 'goal_update',
          content: `Goal review reminder: "${goal.goal_statement}" is due for progress review.`
        }, 'high', true);
      }
    }
  }
}

// Export singleton instance
export const interdisciplinaryCollaborationService = InterdisciplinaryCollaborationService.getInstance();
export type { TeamMember, CareTeam, SharedGoal, TeamCommunication, CaseConference, IntegratedAssessment };