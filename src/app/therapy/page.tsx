'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TherapyHub() {
  const [userRole, setUserRole] = useState<'slp' | 'aba' | 'ot' | 'pt' | 'admin'>('slp');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock data
    setRecentActivity([
      { id: 1, type: 'session', title: 'Emma completed Picture Naming game', time: '2 hours ago', icon: '🎮' },
      { id: 2, type: 'goal', title: 'Marcus achieved communication goal milestone', time: '4 hours ago', icon: '🎯' },
      { id: 3, type: 'team', title: 'New message in Sophia\'s care team', time: '1 day ago', icon: '💬' },
      { id: 4, type: 'data', title: 'ABA data collection completed for Alex', time: '1 day ago', icon: '📊' }
    ]);

    setUpcomingTasks([
      { id: 1, title: 'Team meeting for Emma Johnson', due: 'Tomorrow 10:00 AM', priority: 'high' },
      { id: 2, title: 'Generate insurance report for Marcus', due: 'Friday', priority: 'medium' },
      { id: 3, title: 'Review Sophia\'s assessment results', due: 'Next Monday', priority: 'low' }
    ]);
  };

  const therapyModules = {
    core: [
      {
        id: 'aba',
        title: 'ABA Data Collection',
        description: 'Real-time behavior tracking and analysis',
        icon: '🎯',
        color: 'from-blue-500 to-cyan-500',
        href: '/therapy/aba',
        features: ['ABC Data', 'Frequency Recording', 'IOA Calculations', 'Automatic Graphs']
      },
      {
        id: 'games',
        title: 'Therapy Games',
        description: 'Evidence-based interactive games',
        icon: '🎮',
        color: 'from-purple-500 to-pink-500',
        href: '/therapy/games',
        features: ['50+ Games', 'Adaptive Difficulty', 'Progress Tracking', 'Multiplayer']
      },
      {
        id: 'team',
        title: 'Team Collaboration',
        description: 'Interdisciplinary coordination',
        icon: '🤝',
        color: 'from-green-500 to-teal-500',
        href: '/therapy/team',
        features: ['Team Messaging', 'Shared Goals', 'Case Conferences', 'Assessments']
      },
      {
        id: 'analytics',
        title: 'Advanced Analytics',
        description: 'AI-powered insights and reports',
        icon: '📊',
        color: 'from-orange-500 to-red-500',
        href: '/therapy/analytics',
        features: ['AI Insights', 'Peer Benchmarking', 'Custom Reports', 'Predictive Modeling']
      }
    ],
    specialized: [
      {
        id: 'goals',
        title: 'Goal Tracking',
        description: 'SMART goal management',
        icon: '🎯',
        color: 'from-indigo-500 to-purple-500',
        href: '/therapy/goals',
        features: ['SMART Goals', 'Progress Monitoring', 'Goal Banks', 'Achievement Tracking']
      },
      {
        id: 'boards',
        title: 'Board Builder',
        description: 'Custom AAC board creation',
        icon: '🎨',
        color: 'from-pink-500 to-rose-500',
        href: '/therapy/boards',
        features: ['Drag & Drop', 'AI Symbols', 'Voice Recording', 'Template Sharing']
      },
      {
        id: 'sessions',
        title: 'Session Recording',
        description: 'Video analysis and highlights',
        icon: '🎥',
        color: 'from-yellow-500 to-orange-500',
        href: '/therapy/sessions',
        features: ['Video Recording', 'Auto Transcription', 'Highlight Reels', 'Progress Videos']
      },
      {
        id: 'assessments',
        title: 'Assessments',
        description: 'Integrated evaluation tools',
        icon: '📋',
        color: 'from-teal-500 to-green-500',
        href: '/therapy/assessments',
        features: ['Multi-Disciplinary', 'Standard Scores', 'Report Generation', 'Progress Tracking']
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏥 Professional Therapy Hub</h1>
          <p className="text-slate-200">Integrated tools for SLP, ABA, OT, PT professionals</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">12</div>
            <div className="text-white text-sm">Active Patients</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">47</div>
            <div className="text-white text-sm">Sessions This Week</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">28</div>
            <div className="text-white text-sm">Goals Achieved</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-pink-400">95%</div>
            <div className="text-white text-sm">Team Satisfaction</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Core Modules */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">🚀 Core Therapy Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {therapyModules.core.map(module => (
                <Link key={module.id} href={module.href}>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition-all transform hover:scale-105 cursor-pointer">
                    <div className="flex items-center mb-4">
                      <div className="text-4xl mr-4">{module.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{module.title}</h3>
                        <p className="text-slate-200 text-sm">{module.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {module.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mr-2"></div>
                          <span className="text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-4 px-4 py-2 bg-gradient-to-r ${module.color} rounded-lg text-white text-center font-semibold`}>
                      Launch Module
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity & Tasks */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">📈 Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="text-xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="text-white text-sm">{activity.title}</div>
                      <div className="text-slate-400 text-xs">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">📅 Upcoming Tasks</h3>
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-white text-sm font-medium">{task.title}</div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        task.priority === 'high' ? 'bg-red-500/30 text-red-200' :
                        task.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                        'bg-green-500/30 text-green-200'
                      }`}>
                        {task.priority}
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs">{task.due}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full p-3 bg-blue-500/20 rounded-lg text-white hover:bg-blue-500/30 transition-all text-left">
                  🆕 Start New Session
                </button>
                <button className="w-full p-3 bg-green-500/20 rounded-lg text-white hover:bg-green-500/30 transition-all text-left">
                  📊 Generate Report
                </button>
                <button className="w-full p-3 bg-purple-500/20 rounded-lg text-white hover:bg-purple-500/30 transition-all text-left">
                  👥 Message Team
                </button>
                <button className="w-full p-3 bg-pink-500/20 rounded-lg text-white hover:bg-pink-500/30 transition-all text-left">
                  🎯 Add New Goal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Specialized Tools */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">🛠️ Specialized Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {therapyModules.specialized.map(module => (
              <Link key={module.id} href={module.href}>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/15 transition-all transform hover:scale-105 cursor-pointer">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{module.icon}</div>
                    <h3 className="text-lg font-bold text-white">{module.title}</h3>
                    <p className="text-slate-200 text-sm">{module.description}</p>
                  </div>
                  
                  <div className="space-y-1">
                    {module.features.map((feature, index) => (
                      <div key={index} className="text-xs text-slate-300 text-center">
                        • {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Role-Based Quick Access */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">👨‍⚕️ Role-Based Dashboard</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {['slp', 'aba', 'ot', 'pt', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => setUserRole(role as any)}
                className={`p-3 rounded-lg font-semibold transition-all ${
                  userRole === role 
                    ? 'bg-white text-slate-900' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userRole === 'slp' && (
              <>
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🗣️</div>
                  <div className="text-white font-semibold">Speech Therapy</div>
                  <div className="text-blue-200 text-sm">Language assessments</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎮</div>
                  <div className="text-white font-semibold">Communication Games</div>
                  <div className="text-purple-200 text-sm">Interactive activities</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-white font-semibold">Progress Reports</div>
                  <div className="text-green-200 text-sm">Insurance documentation</div>
                </div>
                <div className="bg-pink-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-white font-semibold">Family Training</div>
                  <div className="text-pink-200 text-sm">Caregiver resources</div>
                </div>
              </>
            )}

            {userRole === 'aba' && (
              <>
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-white font-semibold">Data Collection</div>
                  <div className="text-blue-200 text-sm">ABC analysis tools</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-white font-semibold">Behavior Programs</div>
                  <div className="text-yellow-200 text-sm">Skill acquisition</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-white font-semibold">Visual Graphs</div>
                  <div className="text-green-200 text-sm">Progress monitoring</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🧩</div>
                  <div className="text-white font-semibold">Discrete Trials</div>
                  <div className="text-purple-200 text-sm">Structured teaching</div>
                </div>
              </>
            )}

            {userRole === 'ot' && (
              <>
                <div className="bg-orange-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">✋</div>
                  <div className="text-white font-semibold">Fine Motor</div>
                  <div className="text-orange-200 text-sm">Hand strengthening</div>
                </div>
                <div className="bg-teal-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="text-white font-semibold">Sensory Activities</div>
                  <div className="text-teal-200 text-sm">Integration therapy</div>
                </div>
                <div className="bg-indigo-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🔧</div>
                  <div className="text-white font-semibold">Adaptive Tools</div>
                  <div className="text-indigo-200 text-sm">Device modifications</div>
                </div>
                <div className="bg-pink-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-white font-semibold">ADL Training</div>
                  <div className="text-pink-200 text-sm">Daily living skills</div>
                </div>
              </>
            )}

            {userRole === 'pt' && (
              <>
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🚶</div>
                  <div className="text-white font-semibold">Mobility Training</div>
                  <div className="text-blue-200 text-sm">Gait analysis</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">💪</div>
                  <div className="text-white font-semibold">Strength Building</div>
                  <div className="text-green-200 text-sm">Exercise programs</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">⚖️</div>
                  <div className="text-white font-semibold">Balance Training</div>
                  <div className="text-purple-200 text-sm">Fall prevention</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-white font-semibold">Positioning</div>
                  <div className="text-yellow-200 text-sm">Seating assessments</div>
                </div>
              </>
            )}

            {userRole === 'admin' && (
              <>
                <div className="bg-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-white font-semibold">User Management</div>
                  <div className="text-red-200 text-sm">Team administration</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-white font-semibold">System Analytics</div>
                  <div className="text-blue-200 text-sm">Usage reports</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="text-white font-semibold">Configuration</div>
                  <div className="text-green-200 text-sm">System settings</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="text-white font-semibold">Security</div>
                  <div className="text-purple-200 text-sm">HIPAA compliance</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}