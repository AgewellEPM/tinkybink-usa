'use client';

import { useState, useEffect, useRef } from 'react';
import { aiProgressMonitorService } from '@/services/ai-progress-monitor';
import { GPT4AnalyticsDashboard } from '@/components/gpt4-analytics-dashboard';

export default function AIMonitorPage() {
  const [conversationContext, setConversationContext] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('all_patients');
  const [patients, setPatients] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeMonitoring();
    loadPatients();
    startRealTimeUpdates();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeMonitoring = async () => {
    try {
      const context = await aiProgressMonitorService.startConversation('current_user', selectedPatient);
      setConversationContext(context);
      setMessages(context.conversation_history);
      
      // Load alerts
      const currentAlerts = aiProgressMonitorService.getActiveAlerts();
      setAlerts(currentAlerts);
    } catch (error) {
      console.error('Error initializing monitoring:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const allPatients = aiProgressMonitorService.getAllPatients();
      setPatients(allPatients);
      
      if (allPatients.length > 0 && selectedPatient !== 'all_patients') {
        loadPatientDashboard(selectedPatient);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadPatientDashboard = async (patientId: string) => {
    if (patientId === 'all_patients') return;
    
    try {
      const summary = await aiProgressMonitorService.getProgressSummary(patientId);
      setDashboardData(summary);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const startRealTimeUpdates = () => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const currentAlerts = aiProgressMonitorService.getActiveAlerts();
      setAlerts(currentAlerts);
      
      if (selectedPatient !== 'all_patients') {
        loadPatientDashboard(selectedPatient);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !conversationContext || isTyping) return;

    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await aiProgressMonitorService.processUserMessage(
        conversationContext.session_id,
        currentMessage
      );

      // Add user message
      setMessages(prev => [...prev, {
        message_id: `user_${Date.now()}`,
        timestamp: new Date(),
        sender: 'user',
        content: currentMessage,
        message_type: 'question'
      }]);

      setCurrentMessage('');

      // Simulate typing delay
      setTimeout(() => {
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientChange = async (patientId: string) => {
    setSelectedPatient(patientId);
    
    // Start new conversation with selected patient
    const context = await aiProgressMonitorService.startConversation('current_user', patientId);
    setConversationContext(context);
    setMessages(context.conversation_history);
    
    if (patientId !== 'all_patients') {
      loadPatientDashboard(patientId);
    } else {
      setDashboardData(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-400 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      default: return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🤖 AI Progress Monitor</h1>
              <p className="text-gray-600">Real-time insights and conversational guidance</p>
            </div>
            
            {/* Patient Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Focus:</label>
              <select
                value={selectedPatient}
                onChange={(e) => handlePatientChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all_patients">All Patients</option>
                {patients.map(patient => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* GPT-4 Analytics Integration */}
        <div className="mb-8">
          <GPT4AnalyticsDashboard 
            patientId={selectedPatient !== 'all_patients' ? selectedPatient : undefined}
            showConfiguration={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold text-gray-900">AI Assistant - Real-Time Monitoring</h3>
                  <span className="text-sm text-gray-500">
                    {selectedPatient === 'all_patients' ? 'Portfolio View' : patients.find(p => p.patient_id === selectedPatient)?.name}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.message_id || index}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900 border'
                      }`}
                    >
                      {message.sender === 'ai' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-medium text-blue-600">🤖 AI Assistant</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.related_data && (
                        <div className="mt-2 text-xs opacity-75">
                          📊 Data available for deeper analysis
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3 border">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-blue-600">🤖 AI Assistant</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about progress, goals, recommendations, or anything else..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    Send
                  </button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setCurrentMessage('How is progress overall?')}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                  >
                    📊 Progress Check
                  </button>
                  <button
                    onClick={() => setCurrentMessage('What goals need attention?')}
                    className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                  >
                    🎯 Goal Review
                  </button>
                  <button
                    onClick={() => setCurrentMessage('Any recommendations for interventions?')}
                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                  >
                    💡 Get Guidance
                  </button>
                  <button
                    onClick={() => setCurrentMessage('Show me the data trends')}
                    className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
                  >
                    📈 Data Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Dashboard */}
          <div className="space-y-6">
            
            {/* Real-Time Alerts */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🚨 Live Alerts</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
              
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert, index) => (
                    <div
                      key={alert.alert_id || index}
                      className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
                    >
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs mt-1 opacity-80">{alert.message}</div>
                      <div className="text-xs mt-2 text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-sm">No urgent alerts</p>
                </div>
              )}
            </div>

            {/* Patient Dashboard (when specific patient selected) */}
            {dashboardData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Progress Dashboard</h3>
                
                {/* Overall Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-bold text-gray-900">
                      {dashboardData.overall_progress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getProgressColor(dashboardData.overall_progress.percentage)}`}
                      style={{ width: `${dashboardData.overall_progress.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Goals Progress */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">🎯 Primary Goals</h4>
                  <div className="space-y-3">
                    {dashboardData.goal_progress.slice(0, 3).map((goal: any) => (
                      <div key={goal.goal_id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-700 truncate">
                            {goal.title}
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            {goal.progress_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(goal.progress_percentage)}`}
                            style={{ width: `${goal.progress_percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Status: {goal.status.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      L{dashboardData.patient_summary.communication_level}
                    </div>
                    <div className="text-xs text-blue-700">Communication Level</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {dashboardData.patient_summary.days_in_therapy}
                    </div>
                    <div className="text-xs text-green-700">Days in Therapy</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentMessage('Generate a progress report')}
                  className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-blue-900">📋 Generate Report</div>
                  <div className="text-xs text-blue-700">Create comprehensive progress summary</div>
                </button>
                
                <button 
                  onClick={() => setCurrentMessage('What interventions should I try?')}
                  className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-green-900">💡 Get Recommendations</div>
                  <div className="text-xs text-green-700">AI-powered intervention suggestions</div>
                </button>
                
                <button 
                  onClick={() => setCurrentMessage('Predict breakthrough opportunities')}
                  className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-purple-900">🔮 Breakthrough Prediction</div>
                  <div className="text-xs text-purple-700">Identify upcoming opportunities</div>
                </button>
                
                <button 
                  onClick={() => setCurrentMessage('Help me plan next week')}
                  className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-orange-900">🗓️ Session Planning</div>
                  <div className="text-xs text-orange-700">AI-assisted therapy planning</div>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Monitoring</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Collection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Real-time</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Patients Monitored</span>
                  <span className="text-sm font-medium text-gray-900">{patients.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}