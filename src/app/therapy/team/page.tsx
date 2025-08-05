'use client';

import { useState, useEffect } from 'react';
import { interdisciplinaryCollaborationService } from '@/services/interdisciplinary-collaboration-service';

export default function TeamCollaboration() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teamData, setTeamData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    // Mock team data
    const mockTeam = {
      team_info: {
        name: "Emma's Care Team",
        member_count: 6,
        disciplines_represented: ['slp', 'aba', 'ot', 'pt', 'teacher', 'parent'],
        lead_coordinator: 'Dr. Smith'
      },
      members: [
        { id: '1', name: 'Dr. Sarah Smith', role: 'slp', credentials: 'CCC-SLP', avatar: '👩‍⚕️', status: 'online' },
        { id: '2', name: 'Mike Johnson', role: 'aba', credentials: 'BCBA', avatar: '👨‍🏫', status: 'online' },
        { id: '3', name: 'Lisa Chen', role: 'ot', credentials: 'OTR/L', avatar: '👩‍⚕️', status: 'away' },
        { id: '4', name: 'David Kim', role: 'pt', credentials: 'DPT', avatar: '👨‍⚕️', status: 'offline' },
        { id: '5', name: 'Ms. Rodriguez', role: 'teacher', credentials: 'M.Ed', avatar: '👩‍🏫', status: 'online' },
        { id: '6', name: 'Maria (Mom)', role: 'parent', credentials: '', avatar: '👩', status: 'online' }
      ],
      recent_activity: {
        messages: [
          { id: 1, sender: 'Dr. Sarah Smith', content: 'Emma showed great progress in today\'s session!', time: '2 hours ago', priority: 'normal' },
          { id: 2, sender: 'Mike Johnson', content: 'Updated behavior data - reduction in challenging behaviors', time: '4 hours ago', priority: 'normal' },
          { id: 3, sender: 'Lisa Chen', content: 'Fine motor goals need adjustment based on latest assessment', time: '1 day ago', priority: 'high' }
        ]
      },
      goals_overview: {
        total_goals: 8,
        active_goals: 6,
        achieved_goals: 2,
        progress_summary: [
          { goal: 'Functional communication for daily needs', progress: 78, trend: 'improving' },
          { goal: 'Reduce challenging behaviors', progress: 65, trend: 'improving' },
          { goal: 'Fine motor skills for device use', progress: 42, trend: 'stable' }
        ]
      },
      upcoming_events: [
        { id: 1, title: 'Monthly Team Meeting', date: '2024-01-15', time: '10:00 AM', type: 'progress_review' },
        { id: 2, title: 'IEP Planning Session', date: '2024-01-22', time: '2:00 PM', type: 'initial_planning' }
      ]
    };
    
    setTeamData(mockTeam);
    setMessages(mockTeam.recent_activity.messages);
    setSharedGoals(mockTeam.goals_overview.progress_summary);
    setUpcomingMeetings(mockTeam.upcoming_events);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'You',
      content: newMessage,
      time: 'Just now',
      priority: 'normal'
    };

    setMessages([message, ...messages]);
    setNewMessage('');

    // In production, would call the service
    // await interdisciplinaryCollaborationService.sendTeamMessage(...)
  };

  const updateGoalProgress = async (goalIndex: number, newProgress: number) => {
    const updatedGoals = [...sharedGoals];
    updatedGoals[goalIndex].progress = newProgress;
    setSharedGoals(updatedGoals);
  };

  if (!teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading team data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤝 {teamData.team_info.name}</h1>
          <p className="text-blue-200">
            {teamData.team_info.member_count} team members • Led by {teamData.team_info.lead_coordinator}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
            { id: 'messages', label: '💬 Messages', icon: '💬' },
            { id: 'goals', label: '🎯 Shared Goals', icon: '🎯' },
            { id: 'meetings', label: '📅 Meetings', icon: '📅' },
            { id: 'assessments', label: '📋 Assessments', icon: '📋' },
            { id: 'reports', label: '📈 Reports', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">👥 Team Members</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamData.members.map((member: any) => (
                  <div key={member.id} className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{member.avatar}</div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">{member.name}</div>
                        <div className="text-blue-200 text-sm">
                          {member.role.toUpperCase()} {member.credentials && `• ${member.credentials}`}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        member.status === 'online' ? 'bg-green-400' :
                        member.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{teamData.goals_overview.active_goals}</div>
                <div className="text-white text-sm">Active Goals</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{teamData.goals_overview.achieved_goals}</div>
                <div className="text-white text-sm">Achieved</div>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{upcomingMeetings.length}</div>
                <div className="text-white text-sm">Meetings</div>
              </div>
              <div className="bg-pink-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-pink-400">{messages.length}</div>
                <div className="text-white text-sm">Messages</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">📰 Recent Activity</h2>
              <div className="space-y-3">
                {messages.slice(0, 5).map(message => (
                  <div key={message.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-white font-semibold mb-1">{message.sender}</div>
                        <div className="text-blue-200">{message.content}</div>
                      </div>
                      <div className="text-gray-400 text-sm">{message.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Message Input */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">💬 Team Messages</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message to the team..."
                  className="flex-1 p-3 bg-white/20 rounded-lg text-white placeholder-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map(message => (
                  <div key={message.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-white font-semibold">{message.sender}</div>
                      <div className="text-gray-400 text-sm">{message.time}</div>
                    </div>
                    <div className="text-blue-200">{message.content}</div>
                    {message.priority === 'high' && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-red-500/30 text-red-200 rounded text-xs">
                          🚨 High Priority
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shared Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">🎯 Shared Goals</h2>
                <button className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all">
                  ➕ Add Goal
                </button>
              </div>

              <div className="space-y-4">
                {sharedGoals.map((goal, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-2">{goal.goal}</h3>
                        <div className="flex items-center gap-4">
                          <span className="text-blue-200">Progress: {goal.progress}%</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            goal.trend === 'improving' ? 'bg-green-500/30 text-green-200' :
                            goal.trend === 'stable' ? 'bg-yellow-500/30 text-yellow-200' :
                            'bg-red-500/30 text-red-200'
                          }`}>
                            {goal.trend === 'improving' ? '📈' : goal.trend === 'stable' ? '➡️' : '📉'} {goal.trend}
                          </span>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-all">
                        Update
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-white/20 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Contributing Disciplines */}
                    <div className="flex gap-2">
                      <span className="text-gray-300 text-sm">Contributing:</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs">SLP</span>
                        <span className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded text-xs">ABA</span>
                        <span className="px-2 py-1 bg-pink-500/30 text-pink-200 rounded text-xs">OT</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">📅 Team Meetings</h2>
                <button className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all">
                  📅 Schedule Meeting
                </button>
              </div>

              <div className="space-y-4">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="bg-white/5 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-2">{meeting.title}</h3>
                        <div className="text-blue-200 mb-2">
                          📅 {meeting.date} at {meeting.time}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          meeting.type === 'progress_review' ? 'bg-green-500/30 text-green-200' :
                          meeting.type === 'initial_planning' ? 'bg-blue-500/30 text-blue-200' :
                          'bg-purple-500/30 text-purple-200'
                        }`}>
                          {meeting.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-all">
                          Join
                        </button>
                        <button className="px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-all">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Integrated Assessments</h2>
            
            <div className="grid gap-4">
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold">Annual Assessment 2024</h3>
                    <p className="text-blue-200 text-sm">Multi-disciplinary evaluation in progress</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-yellow-500/30 text-yellow-200 rounded text-xs">IN PROGRESS</span>
                    <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all">
                      View
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-gray-300 mb-2">Assessment Progress:</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-green-500/30 text-green-200 rounded text-xs">✅ SLP Complete</span>
                    <span className="px-2 py-1 bg-green-500/30 text-green-200 rounded text-xs">✅ ABA Complete</span>
                    <span className="px-2 py-1 bg-yellow-500/30 text-yellow-200 rounded text-xs">🔄 OT In Progress</span>
                    <span className="px-2 py-1 bg-gray-500/30 text-gray-200 rounded text-xs">⏳ PT Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Team Reports</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button className="p-6 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-white font-semibold mb-1">Progress Summary Report</div>
                <div className="text-blue-200 text-sm">Comprehensive progress across all disciplines</div>
              </button>
              
              <button className="p-6 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-white font-semibold mb-1">IEP Report</div>
                <div className="text-blue-200 text-sm">Educational planning documentation</div>
              </button>
              
              <button className="p-6 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-white font-semibold mb-1">Insurance Report</div>
                <div className="text-blue-200 text-sm">Medical necessity and progress documentation</div>
              </button>
              
              <button className="p-6 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left">
                <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                <div className="text-white font-semibold mb-1">Family Report</div>
                <div className="text-blue-200 text-sm">Family-friendly progress summary</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}