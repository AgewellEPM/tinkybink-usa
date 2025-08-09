'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BellIcon,
  VideoCameraIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  CalendarDaysIcon as CalendarIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid';
import { smartSchedulingService, Appointment, AppointmentType } from '@/services/smart-scheduling-service';

export default function SmartSchedulingPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'availability' | 'appointments' | 'waitlist' | 'settings'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [calendarConnections, setCalendarConnections] = useState<any[]>([]);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any>(null);

  useEffect(() => {
    loadSchedulingData();
  }, []);

  const loadSchedulingData = async () => {
    // Load mock data
    setAppointments([
      {
        id: 'apt_001',
        therapistId: 'therapist_001',
        patientId: 'patient_001',
        type: 'aac_therapy',
        title: 'AAC Therapy - Emma',
        description: 'Individual AAC training session',
        date: new Date(),
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2.75 * 60 * 60 * 1000),
        timezone: 'America/Chicago',
        status: 'confirmed',
        attendees: [
          { type: 'therapist', name: 'Dr. Sarah Johnson', email: 'sarah@tinkyBink.com', confirmed: true },
          { type: 'patient', name: 'Emma Thompson', email: 'parent@email.com', confirmed: true }
        ],
        format: 'in_person',
        location: { address: '123 Therapy Lane', room: 'Room A' },
        externalIds: {},
        reminders: [
          { type: 'email', timing: 24, sent: true, sentAt: new Date() },
          { type: 'sms', timing: 2, sent: false }
        ],
        notes: '',
        preparation: { completed: true, materials: ['AAC device'], specialInstructions: [] },
        billing: { billable: true, cptCode: '92507' }
      }
    ]);

    // Load optimization data
    const optimization = await smartSchedulingService.optimizeAvailability('therapist_001', {
      goalAppointmentsPerDay: 8,
      preferredClientTypes: ['child', 'adolescent'],
      revenueGoals: 6000
    });
    setOptimizationSuggestions(optimization);
  };

  const connectCalendar = async (provider: 'google' | 'outlook' | 'apple') => {
    const result = await smartSchedulingService.connectCalendar('therapist_001', {
      type: provider,
      accessToken: 'mock_token',
      email: 'therapist@email.com'
    });
    
    if (result.success) {
      alert(`${provider} calendar connected! Synced ${result.syncedEvents} events.`);
      loadSchedulingData();
    }
  };

  const scheduleAppointment = async (appointmentData: any) => {
    const result = await smartSchedulingService.scheduleAppointment({
      therapistId: 'therapist_001',
      patientId: appointmentData.patientId,
      appointmentTypeId: appointmentData.type,
      preferredDate: appointmentData.date,
      preferredTime: appointmentData.time,
      flexibility: {
        dateRange: 7,
        timeRange: 2
      },
      requirements: {
        format: appointmentData.format,
        urgency: 'medium'
      }
    });

    if (result.success) {
      alert('Appointment scheduled successfully!');
      setShowNewAppointment(false);
      loadSchedulingData();
    } else if (result.waitlistOption) {
      alert('No availability found. Added to waitlist - you\'ll be notified when a slot opens.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-900/20';
      case 'scheduled': return 'text-blue-400 bg-blue-900/20';
      case 'in_progress': return 'text-purple-400 bg-purple-900/20';
      case 'completed': return 'text-gray-400 bg-gray-900/20';
      case 'cancelled': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { id: 'calendar', title: 'Calendar', icon: CalendarDaysIcon },
    { id: 'availability', title: 'Availability', icon: ClockIcon },
    { id: 'appointments', title: 'Appointments', icon: UserGroupIcon },
    { id: 'waitlist', title: 'Waitlist', icon: BellIcon },
    { id: 'settings', title: 'Settings', icon: Cog6ToothIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Smart Scheduling
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium">
                  <CalendarIconSolid className="h-4 w-4 mr-1" />
                  AI Optimized
                </span>
              </h1>
              <p className="text-gray-400">
                Intelligent scheduling with calendar sync and automated reminders
              </p>
            </div>
            
            <button
              onClick={() => setShowNewAppointment(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              New Appointment
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-800 p-1 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Today's Schedule */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Today's Schedule</h2>
                
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-lg font-bold text-white">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                          
                          <h3 className="text-white font-medium mb-1">{appointment.title}</h3>
                          <p className="text-gray-400 text-sm mb-2">{appointment.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              {appointment.format === 'telehealth' ? (
                                <VideoCameraIcon className="h-4 w-4 text-blue-400" />
                              ) : (
                                <MapPinIcon className="h-4 w-4 text-green-400" />
                              )}
                              <span className="text-gray-300 capitalize">{appointment.format}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <UserGroupIcon className="h-4 w-4 text-purple-400" />
                              <span className="text-gray-300">
                                {appointment.attendees.find(a => a.type === 'patient')?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-green-400 hover:text-green-300 text-sm font-medium">
                            Start Session
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {appointments.length === 0 && (
                    <div className="text-center py-8">
                      <CalendarDaysIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No appointments today</h3>
                      <p className="text-gray-500">Your schedule is clear for today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Weekly Overview */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">This Week</h2>
                
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-sm text-gray-400 mb-2">{day}</div>
                      <div className={`h-20 rounded-lg border-2 ${
                        index === new Date().getDay() 
                          ? 'border-purple-500 bg-purple-900/20' 
                          : 'border-gray-600 bg-gray-700/30'
                      }`}>
                        {index === new Date().getDay() && appointments.length > 0 && (
                          <div className="p-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mb-1"></div>
                            <div className="text-xs text-gray-300">{appointments.length}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <motion.div
              key="availability"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AI Optimization Suggestions */}
              {optimizationSuggestions && (
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <ChartBarIcon className="h-6 w-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">AI Optimization Suggestions</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-white font-medium mb-3">Recommended Changes</h3>
                      <div className="space-y-3">
                        {optimizationSuggestions.recommendations.map((rec: any, index: number) => (
                          <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                            <div className="text-purple-300 font-medium mb-1">{rec.suggestion}</div>
                            <div className="text-gray-400 text-sm mb-2">{rec.impact}</div>
                            <div className="text-gray-500 text-xs">{rec.implementation}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-medium mb-3">Projected Impact</h3>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Additional Appointments</span>
                          <span className="text-green-400 font-bold">
                            +{optimizationSuggestions.projectedIncrease.appointments}/week
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Additional Revenue</span>
                          <span className="text-green-400 font-bold">
                            +${optimizationSuggestions.projectedIncrease.revenue.toLocaleString()}/month
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                    Apply Suggestions
                  </button>
                </div>
              )}

              {/* Current Availability */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Availability Settings</h2>
                  <button className="text-purple-400 hover:text-purple-300 font-medium">
                    Edit Schedule
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-medium mb-3">Working Hours</h3>
                    <div className="space-y-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <div key={day} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <span className="text-gray-300">{day}</span>
                          <span className="text-white font-medium">9:00 AM - 5:00 PM</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-medium mb-3">Appointment Types</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-white font-medium">Initial Evaluation</div>
                        <div className="text-gray-400 text-sm">90 minutes • $250</div>
                      </div>
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-white font-medium">AAC Therapy</div>
                        <div className="text-gray-400 text-sm">45 minutes • $150</div>
                      </div>
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-white font-medium">Follow-up</div>
                        <div className="text-gray-400 text-sm">30 minutes • $100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Calendar Connections */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Calendar Connections</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Google Calendar', icon: '📅', connected: false },
                    { name: 'Outlook Calendar', icon: '📆', connected: true },
                    { name: 'Apple Calendar', icon: '🍎', connected: false }
                  ].map((provider) => (
                    <div key={provider.name} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <div className="text-white font-medium">{provider.name}</div>
                          <div className={`text-sm ${provider.connected ? 'text-green-400' : 'text-gray-400'}`}>
                            {provider.connected ? 'Connected' : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      
                      {provider.connected ? (
                        <div className="flex items-center gap-2">
                          <CheckCircleIconSolid className="h-4 w-4 text-green-400" />
                          <span className="text-green-300 text-sm">Syncing automatically</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => connectCalendar(provider.name.split(' ')[0].toLowerCase() as any)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Reminder Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Email Reminders</div>
                      <div className="text-gray-400 text-sm">Send 24 hours before appointment</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">SMS Reminders</div>
                      <div className="text-gray-400 text-sm">Send 2 hours before appointment</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {showNewAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700"
            >
              <h3 className="text-xl font-bold text-white mb-6">Schedule New Appointment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Patient</label>
                  <select className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600">
                    <option>Emma Thompson</option>
                    <option>Alex Chen</option>
                    <option>Sarah Johnson</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Appointment Type</label>
                  <select className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600">
                    <option>AAC Therapy Session</option>
                    <option>Initial Evaluation</option>
                    <option>Follow-up</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewAppointment(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Mock appointment creation
                    scheduleAppointment({
                      patientId: 'patient_001',
                      type: 'aac_therapy',
                      date: new Date(),
                      time: '10:00',
                      format: 'in_person'
                    });
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Schedule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}