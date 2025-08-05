'use client';

import { useState, useEffect } from 'react';
import { advancedAnalyticsDashboardService } from '@/services/advanced-analytics-dashboard-service';

export default function TherapyAnalytics() {
  const [selectedPatient, setSelectedPatient] = useState('patient_123');
  const [dateRange, setDateRange] = useState('30days');
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedChart, setSelectedChart] = useState('progress');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPatient, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Mock analytics data
      const mockAnalytics = {
        metrics: {
          communication: {
            total_words: 2847,
            unique_words: 342,
            words_per_minute: 12.4,
            mlut: 3.2,
            vocabulary_growth_rate: 15,
            core_word_usage: 68,
            fringe_word_usage: 32
          },
          engagement: {
            session_frequency: 4.2,
            avg_session_duration: 28,
            total_practice_time: 1680,
            consistency_score: 87,
            motivation_trend: 'increasing' as const
          },
          accuracy: {
            communication_success_rate: 78,
            error_patterns: [
              { type: 'substitution', frequency: 12, context: 'nouns' },
              { type: 'incomplete', frequency: 8, context: 'sentences' }
            ],
            self_correction_rate: 23,
            prompted_vs_spontaneous: { prompted: 145, spontaneous: 89 }
          },
          efficiency: {
            tiles_per_message: 2.8,
            time_to_message: 4.2,
            navigation_efficiency: 85,
            predictive_text_usage: 45
          }
        },
        progress: {
          goal_achievement: [
            {
              goal_id: 'goal_1',
              goal_text: 'Functional communication for daily needs',
              baseline: 20,
              current: 78,
              target: 90,
              percent_complete: 72,
              projected_completion: new Date('2024-03-15')
            },
            {
              goal_id: 'goal_2',
              goal_text: 'Reduce challenging behaviors during transitions',
              baseline: 15,
              current: 8,
              target: 3,
              percent_complete: 58,
              projected_completion: new Date('2024-04-01')
            }
          ],
          regression_analysis: {
            trend_line: [
              { date: new Date('2024-01-01'), value: 20 },
              { date: new Date('2024-01-08'), value: 25 },
              { date: new Date('2024-01-15'), value: 35 },
              { date: new Date('2024-01-22'), value: 42 },
              { date: new Date('2024-01-29'), value: 50 }
            ],
            r_squared: 0.89,
            slope: 2.3,
            prediction_30_days: 65
          }
        },
        benchmarking: {
          peer_group: { size: 127, criteria: ['age:5-7', 'diagnosis:autism', 'device:tablet'] },
          percentile_ranks: {
            words_per_minute: 72,
            vocabulary_size: 65,
            session_engagement: 88,
            progress_rate: 79
          },
          strengths: ['High engagement scores', 'Consistent session attendance'],
          areas_for_growth: ['Vocabulary expansion', 'Spontaneous communication']
        },
        insights: {
          ai_observations: [
            {
              insight: 'Patient shows 40% improvement in morning sessions vs afternoon',
              confidence: 0.87,
              recommendation: 'Schedule therapy sessions in the morning when possible',
              priority: 'high' as const
            },
            {
              insight: 'Vocabulary growth accelerated after predictive text introduction',
              confidence: 0.92,
              recommendation: 'Continue encouraging predictive text usage',
              priority: 'medium' as const
            }
          ]
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    alert(`Generating ${reportType} report...`);
    // In production: await advancedAnalyticsDashboardService.generateReport(...)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Advanced Analytics Dashboard</h1>
          <p className="text-indigo-200">Comprehensive therapy progress analysis and insights</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
            <label className="block text-white mb-2">Patient</label>
            <select 
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full p-3 bg-white/20 rounded-lg text-white"
            >
              <option value="patient_123">Emma Johnson (Age 6)</option>
              <option value="patient_124">Marcus Smith (Age 8)</option>
              <option value="patient_125">Sophia Chen (Age 5)</option>
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
            <label className="block text-white mb-2">Date Range</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-3 bg-white/20 rounded-lg text-white"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
            <label className="block text-white mb-2">Chart Type</label>
            <select 
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
              className="w-full p-3 bg-white/20 rounded-lg text-white"
            >
              <option value="progress">Progress Timeline</option>
              <option value="vocabulary">Vocabulary Growth</option>
              <option value="engagement">Engagement Heatmap</option>
              <option value="skills">Skills Radar</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-500/20 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{analytics.metrics.communication.words_per_minute}</div>
            <div className="text-white text-sm">Words/Min</div>
            <div className="text-green-300 text-xs">+2.1 from last month</div>
          </div>
          
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{analytics.metrics.communication.unique_words}</div>
            <div className="text-white text-sm">Unique Words</div>
            <div className="text-blue-300 text-xs">+{analytics.metrics.communication.vocabulary_growth_rate}% growth</div>
          </div>
          
          <div className="bg-purple-500/20 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{analytics.metrics.accuracy.communication_success_rate}%</div>
            <div className="text-white text-sm">Success Rate</div>
            <div className="text-purple-300 text-xs">+12% from baseline</div>
          </div>
          
          <div className="bg-pink-500/20 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-pink-400">{analytics.metrics.engagement.consistency_score}</div>
            <div className="text-white text-sm">Consistency</div>
            <div className="text-pink-300 text-xs">
              {analytics.metrics.engagement.motivation_trend === 'increasing' ? '📈' : '📉'} {analytics.metrics.engagement.motivation_trend}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Progress Timeline</h2>
            
            {/* Mock Chart */}
            <div className="bg-white/5 rounded-lg p-6 h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-white text-lg mb-2">Interactive Chart</div>
                <div className="text-indigo-200 text-sm">
                  {selectedChart === 'progress' && 'Communication progress over time with trend analysis'}
                  {selectedChart === 'vocabulary' && 'Vocabulary growth by category and complexity'}
                  {selectedChart === 'engagement' && 'Session engagement patterns by time and day'}
                  {selectedChart === 'skills' && 'Multi-dimensional skills assessment radar'}
                </div>
                
                {/* Mock Data Visualization */}
                <div className="mt-6 flex justify-center gap-2">
                  {analytics.progress.regression_analysis.trend_line.map((point: any, index: number) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-t from-blue-500 to-green-500 rounded-t"
                      style={{ 
                        height: `${point.value * 2}px`, 
                        width: '20px',
                        minHeight: '10px'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="space-y-6">
            {/* AI Insights */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">🤖 AI Insights</h3>
              <div className="space-y-4">
                {analytics.insights.ai_observations.map((insight: any, index: number) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className={`px-2 py-1 rounded text-xs mb-2 inline-block ${
                      insight.priority === 'high' ? 'bg-red-500/30 text-red-200' :
                      insight.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                      'bg-green-500/30 text-green-200'
                    }`}>
                      {insight.priority.toUpperCase()} PRIORITY
                    </div>
                    <div className="text-white text-sm mb-2">{insight.insight}</div>
                    <div className="text-indigo-200 text-xs">{insight.recommendation}</div>
                    <div className="text-gray-400 text-xs mt-2">Confidence: {Math.round(insight.confidence * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer Benchmarking */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">📊 Peer Comparison</h3>
              <div className="text-indigo-200 text-sm mb-4">
                Compared to {analytics.benchmarking.peer_group.size} similar patients
              </div>
              
              <div className="space-y-3">
                {Object.entries(analytics.benchmarking.percentile_ranks).map(([metric, percentile]) => (
                  <div key={metric}>
                    <div className="flex justify-between text-white text-sm mb-1">
                      <span>{metric.replace(/_/g, ' ')}</span>
                      <span>{percentile}th percentile</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (percentile as number) >= 75 ? 'bg-green-500' :
                          (percentile as number) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentile}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-white text-sm font-semibold mb-2">Strengths:</div>
                {analytics.benchmarking.strengths.map((strength: string, index: number) => (
                  <div key={index} className="text-green-200 text-xs">• {strength}</div>
                ))}
                
                <div className="text-white text-sm font-semibold mt-3 mb-2">Growth Areas:</div>
                {analytics.benchmarking.areas_for_growth.map((area: string, index: number) => (
                  <div key={index} className="text-yellow-200 text-xs">• {area}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🎯 Goal Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.progress.goal_achievement.map((goal: any, index: number) => (
              <div key={goal.goal_id} className="bg-white/5 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">{goal.goal_text}</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-400">{goal.baseline}</div>
                    <div className="text-xs text-gray-300">Baseline</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{goal.current}</div>
                    <div className="text-xs text-gray-300">Current</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{goal.target}</div>
                    <div className="text-xs text-gray-300">Target</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-white text-sm mb-2">
                    <span>Progress</span>
                    <span>{goal.percent_complete}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${goal.percent_complete}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-indigo-200 text-sm">
                  Projected completion: {new Date(goal.projected_completion).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Generation */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Generate Reports</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => generateReport('Progress Summary')}
              className="p-4 bg-blue-500/20 rounded-lg text-white hover:bg-blue-500/30 transition-all"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Progress Report</div>
            </button>
            
            <button 
              onClick={() => generateReport('Insurance')}
              className="p-4 bg-green-500/20 rounded-lg text-white hover:bg-green-500/30 transition-all"
            >
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold">Insurance Report</div>
            </button>
            
            <button 
              onClick={() => generateReport('IEP')}
              className="p-4 bg-purple-500/20 rounded-lg text-white hover:bg-purple-500/30 transition-all"
            >
              <div className="text-2xl mb-2">🎓</div>
              <div className="font-semibold">IEP Report</div>
            </button>
            
            <button 
              onClick={() => generateReport('Family')}
              className="p-4 bg-pink-500/20 rounded-lg text-white hover:bg-pink-500/30 transition-all"
            >
              <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
              <div className="font-semibold">Family Report</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}