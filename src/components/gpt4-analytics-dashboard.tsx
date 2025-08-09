'use client';

import { useState, useEffect } from 'react';
import { gpt4AnalyticsService } from '@/services/gpt4-analytics-service';

interface GPT4AnalyticsDashboardProps {
  patientId?: string;
  showConfiguration?: boolean;
}

export function GPT4AnalyticsDashboard({ patientId, showConfiguration = false }: GPT4AnalyticsDashboardProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [realTimeInsights, setRealTimeInsights] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('progress_analysis');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [conversationQuery, setConversationQuery] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    checkConnectionStatus();
    loadRealTimeInsights();
  }, []);

  const checkConnectionStatus = () => {
    const connected = gpt4AnalyticsService.getConnectionStatus();
    setIsConnected(connected);
  };

  const loadRealTimeInsights = () => {
    const insights = gpt4AnalyticsService.getRealTimeInsights(patientId);
    setRealTimeInsights(insights);
  };

  const handleConfigureGPT4 = async () => {
    if (!apiKey.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const success = await gpt4AnalyticsService.configureGPT4Connection(apiKey);
      setIsConnected(success);
      if (success) {
        setShowConfigModal(false);
        setApiKey(''); // Clear for security
      }
    } catch (error) {
      console.error('Configuration failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!isConnected) {
      setShowConfigModal(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisRequest = {
        request_id: `analysis_${Date.now()}`,
        patient_id: patientId,
        analysis_type: selectedAnalysisType as any,
        data_context: {
          patient_profiles: [],
          session_data: [],
          goal_progress: [],
          game_analytics: [],
          communication_logs: [],
          therapy_notes: [],
          timeframe: {
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end_date: new Date()
          }
        },
        output_format: 'detailed_report' as any,
        urgency: 'normal' as any
      };

      const result = await gpt4AnalyticsService.analyzePatientData(analysisRequest);
      setAnalysisResults(prev => [result, ...prev]);
      loadRealTimeInsights();
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConversationQuery = async () => {
    if (!conversationQuery.trim() || !isConnected) return;

    setIsAnalyzing(true);
    try {
      const result = await gpt4AnalyticsService.processConversationalQuery(
        conversationQuery,
        patientId ? { patient_id: patientId } : undefined,
        conversationHistory
      );
      
      setConversationHistory(prev => [...prev, result]);
      setConversationQuery('');
    } catch (error) {
      console.error('Conversation query failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!isConnected) return;

    setIsAnalyzing(true);
    try {
      const patientIds = patientId ? [patientId] : ['demo_patient_1'];
      const timeframe = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const report = await gpt4AnalyticsService.generateProgressReport(patientIds, timeframe);
      setAnalysisResults(prev => [report, ...prev]);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      'trend_detection': '📈',
      'anomaly_alert': '⚠️',
      'breakthrough_signal': '🚀',
      'intervention_effectiveness': '🎯',
      'goal_trajectory': '📊'
    };
    return icons[type as keyof typeof icons] || '💡';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'critical': 'bg-red-100 border-red-400 text-red-800',
      'high': 'bg-orange-100 border-orange-400 text-orange-800',
      'medium': 'bg-yellow-100 border-yellow-400 text-yellow-800',
      'low': 'bg-blue-100 border-blue-400 text-blue-800',
      'informational': 'bg-green-100 border-green-400 text-green-800'
    };
    return colors[severity as keyof typeof colors] || colors.informational;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status & Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">🧠 GPT-4 Analytics</h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          {(showConfiguration || !isConnected) && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isConnected ? 'Reconfigure' : 'Setup GPT-4'}
            </button>
          )}
        </div>

        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {analysisResults.length}
              </div>
              <div className="text-sm text-blue-700">Analyses Completed</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {realTimeInsights.length}
              </div>
              <div className="text-sm text-green-700">Real-Time Insights</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {conversationHistory.length}
              </div>
              <div className="text-sm text-purple-700">AI Conversations</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Interface */}
      {isConnected ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'insights', label: 'Real-Time Insights', icon: '💡' },
                { id: 'analysis', label: 'Deep Analysis', icon: '🔬' },
                { id: 'conversation', label: 'AI Chat', icon: '💬' },
                { id: 'reports', label: 'Reports', icon: '📊' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Real-Time Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">🔴 Live AI Insights</h3>
                  <button
                    onClick={loadRealTimeInsights}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {realTimeInsights.length > 0 ? (
                  <div className="space-y-3">
                    {realTimeInsights.map((insight, index) => (
                      <div
                        key={insight.insight_id || index}
                        className={`border rounded-lg p-4 ${getSeverityColor(insight.severity)}`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getInsightIcon(insight.insight_type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold">{insight.title}</h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs px-2 py-1 bg-white rounded-full">
                                  {Math.round(insight.confidence * 100)}% confidence
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(insight.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm mb-2">{insight.description}</p>
                            
                            {insight.supporting_evidence && insight.supporting_evidence.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs font-medium">Evidence:</span>
                                <ul className="text-xs mt-1 space-y-1">
                                  {insight.supporting_evidence.slice(0, 3).map((evidence: any, i: any) => (
                                    <li key={i} className="flex items-center space-x-1">
                                      <span>•</span>
                                      <span>{evidence}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {insight.recommended_response && insight.recommended_response.length > 0 && (
                              <div className="border-t pt-2 mt-2">
                                <span className="text-xs font-medium">Recommended Actions:</span>
                                <ul className="text-xs mt-1 space-y-1">
                                  {insight.recommended_response.slice(0, 2).map((action: any, i: any) => (
                                    <li key={i} className="flex items-center space-x-1">
                                      <span>→</span>
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🤖</div>
                    <p>No insights available yet</p>
                    <p className="text-sm">Run an analysis to generate AI insights</p>
                  </div>
                )}
              </div>
            )}

            {/* Deep Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedAnalysisType}
                    onChange={(e) => setSelectedAnalysisType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="progress_analysis">Progress Analysis</option>
                    <option value="intervention_recommendation">Intervention Recommendations</option>
                    <option value="breakthrough_prediction">Breakthrough Prediction</option>
                    <option value="comprehensive_review">Comprehensive Review</option>
                    <option value="goal_optimization">Goal Optimization</option>
                    <option value="risk_assessment">Risk Assessment</option>
                  </select>
                  
                  <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isAnalyzing ? '🔄 Analyzing...' : '🚀 Run Analysis'}
                  </button>
                </div>

                {analysisResults.length > 0 && (
                  <div className="space-y-4">
                    {analysisResults.map((result, index) => (
                      <div key={result.response_id || index} className="border rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            🔬 {result.analysis_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Results
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                              {Math.round((result.confidence_score || 0.8) * 100)}% confidence
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(result.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Key Insights */}
                        {result.key_insights && result.key_insights.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold text-gray-700 mb-2">🎯 Key Insights</h5>
                            <ul className="space-y-1">
                              {result.key_insights.map((insight: string, i: number) => (
                                <li key={i} className="flex items-start space-x-2 text-sm">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Detailed Analysis */}
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-700 mb-2">📋 Detailed Analysis</h5>
                          <div className="bg-white rounded-lg p-4 text-sm whitespace-pre-wrap">
                            {result.detailed_analysis || result.formatted_content}
                          </div>
                        </div>

                        {/* Recommendations */}
                        {result.recommendations && (
                          <div className="mb-4">
                            <h5 className="font-semibold text-gray-700 mb-2">💡 Recommendations</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {result.recommendations.immediate_actions && result.recommendations.immediate_actions.length > 0 && (
                                <div className="bg-red-50 rounded-lg p-3">
                                  <h6 className="font-medium text-red-800 mb-2">🚨 Immediate Actions</h6>
                                  <ul className="text-sm space-y-1">
                                    {result.recommendations.immediate_actions.map((action: string, i: number) => (
                                      <li key={i} className="text-red-700">• {action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {result.recommendations.intervention_suggestions && result.recommendations.intervention_suggestions.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <h6 className="font-medium text-blue-800 mb-2">🎯 Interventions</h6>
                                  <ul className="text-sm space-y-1">
                                    {result.recommendations.intervention_suggestions.map((suggestion: string, i: number) => (
                                      <li key={i} className="text-blue-700">• {suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Professional Summary */}
                        {result.professional_summary && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h5 className="font-semibold text-blue-800 mb-2">👨‍⚕️ Professional Summary</h5>
                            <p className="text-blue-700 text-sm">{result.professional_summary}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Conversation Tab */}
            {activeTab === 'conversation' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[400px] bg-gray-50">
                  {conversationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {conversationHistory.map((conv, index) => (
                        <div key={conv.conversation_id || index} className="space-y-2">
                          <div className="flex justify-end">
                            <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
                              {conv.user_query}
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-white border rounded-lg px-4 py-2 max-w-[80%]">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium text-blue-600">🤖 GPT-4</span>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  {Math.round(conv.confidence_level * 100)}%
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap text-sm">{conv.gpt4_response}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-16">
                      <div className="text-4xl mb-4">💬</div>
                      <p className="text-lg font-medium">Start a conversation with GPT-4</p>
                      <p className="text-sm">Ask about patient progress, interventions, or any therapy-related questions</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={conversationQuery}
                    onChange={(e) => setConversationQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleConversationQuery()}
                    placeholder="Ask GPT-4 about patient progress, interventions, or get professional guidance..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleConversationQuery}
                    disabled={!conversationQuery.trim() || isAnalyzing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isAnalyzing ? '...' : 'Send'}
                  </button>
                </div>

                {/* Quick Questions */}
                <div className="flex flex-wrap gap-2">
                  {[
                    'How is the patient progressing?',
                    'What interventions should I try?',
                    'When might we see a breakthrough?',
                    'What are the biggest risk factors?',
                    'How can I improve outcomes?'
                  ].map(question => (
                    <button
                      key={question}
                      onClick={() => setConversationQuery(question)}
                      className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleGenerateReport}
                    disabled={isAnalyzing}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isAnalyzing ? '🔄 Generating...' : '📊 Generate Progress Report'}
                  </button>
                  
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    🖨️ Print
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Available Reports</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">Progress Summary</h4>
                      <p className="text-sm text-gray-600 mb-3">Comprehensive overview of patient progress with AI insights</p>
                      <button className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        Generate
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">Intervention Analysis</h4>
                      <p className="text-sm text-gray-600 mb-3">Detailed analysis of intervention effectiveness</p>
                      <button className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                        Generate
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">Breakthrough Predictions</h4>
                      <p className="text-sm text-gray-600 mb-3">AI-powered predictions of upcoming milestones</p>
                      <button className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                        Generate
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                      <p className="text-sm text-gray-600 mb-3">Identification of potential challenges and solutions</p>
                      <button className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Not Connected State
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect GPT-4 for Advanced Analytics</h3>
          <p className="text-gray-600 mb-6">
            Enable AI-powered insights, predictions, and recommendations by connecting your GPT-4 API
          </p>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔑 Setup GPT-4 Connection
          </button>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔑 Configure GPT-4</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is stored locally and never transmitted to our servers
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfigureGPT4}
                disabled={!apiKey.trim() || isAnalyzing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isAnalyzing ? 'Testing...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}