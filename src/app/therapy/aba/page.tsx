'use client';

import { useState, useEffect } from 'react';
import { abaDataCollectionService } from '@/services/aba-data-collection-service';

export default function ABADataCollection() {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [behaviors, setBehaviors] = useState<any[]>([]);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [showQuickRecord, setShowQuickRecord] = useState(false);

  useEffect(() => {
    loadBehaviors();
  }, []);

  const loadBehaviors = async () => {
    // Mock behaviors for demo
    setBehaviors([
      {
        id: 'behavior_1',
        name: 'Spontaneous Request',
        category: 'communication',
        measurement_type: 'frequency'
      },
      {
        id: 'behavior_2', 
        name: 'Functional Communication',
        category: 'communication',
        measurement_type: 'frequency'
      },
      {
        id: 'behavior_3',
        name: 'Joint Attention',
        category: 'social',
        measurement_type: 'frequency'
      }
    ]);
  };

  const startDataCollection = async () => {
    if (selectedBehaviors.length === 0) {
      alert('Please select at least one behavior to track');
      return;
    }

    const sessionId = `session_${Date.now()}`;
    const environment = {
      location: 'therapy room',
      people_present: ['therapist', 'patient'],
      activity: 'AAC practice',
      noise_level: 'quiet' as const,
      time_of_day: 'morning' as const
    };

    try {
      await abaDataCollectionService.startDataCollection(
        sessionId,
        'patient_123',
        selectedBehaviors,
        environment
      );
      
      setActiveSession(sessionId);
      setSessionData({
        startTime: new Date(),
        behaviors: selectedBehaviors.map(id => ({
          id,
          name: behaviors.find(b => b.id === id)?.name,
          count: 0,
          lastOccurrence: null
        }))
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const recordBehavior = async (behaviorId: string, occurred: boolean) => {
    if (!activeSession) return;

    try {
      await abaDataCollectionService.recordBehavior(
        behaviorId,
        'patient_123',
        'therapist_456',
        {
          behavior: {
            occurred,
            intensity: 3
          },
          antecedent: {
            type: 'verbal_prompt',
            description: 'Therapist asked "What do you want?"',
            intensity: 2
          },
          consequence: {
            type: 'praise',
            description: 'Great job!',
            delivered_by: 'therapist',
            timing: 'immediate'
          },
          environment: {
            location: 'therapy room',
            people_present: ['therapist', 'patient'],
            activity: 'AAC practice',
            noise_level: 'quiet',
            time_of_day: 'morning'
          }
        }
      );

      // Update local state
      if (occurred && sessionData) {
        const updatedBehaviors = sessionData.behaviors.map((b: any) => 
          b.id === behaviorId 
            ? { ...b, count: b.count + 1, lastOccurrence: new Date() }
            : b
        );
        setSessionData({ ...sessionData, behaviors: updatedBehaviors });
      }

    } catch (error) {
      console.error('Failed to record behavior:', error);
    }
  };

  const stopSession = async () => {
    if (!activeSession) return;

    try {
      const summary = await abaDataCollectionService.stopDataCollection();
      setActiveSession(null);
      setSessionData(null);
      alert('Session completed! Summary: ' + JSON.stringify(summary, null, 2));
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 ABA Data Collection</h1>
          <p className="text-blue-200">Real-time behavior tracking and analysis</p>
        </div>

        {!activeSession ? (
          /* Session Setup */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Behavior Selection */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Select Behaviors to Track</h2>
              
              <div className="space-y-4">
                {behaviors.map(behavior => (
                  <label key={behavior.id} className="flex items-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBehaviors.includes(behavior.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBehaviors([...selectedBehaviors, behavior.id]);
                        } else {
                          setSelectedBehaviors(selectedBehaviors.filter(id => id !== behavior.id));
                        }
                      }}
                      className="mr-4 w-5 h-5"
                    />
                    <div>
                      <div className="text-white font-semibold">{behavior.name}</div>
                      <div className="text-blue-200 text-sm">
                        {behavior.category} • {behavior.measurement_type}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={startDataCollection}
                disabled={selectedBehaviors.length === 0}
                className="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Start Data Collection Session
              </button>
            </div>

            {/* Quick Access Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-blue-500/20 rounded-lg text-white hover:bg-blue-500/30 transition-all">
                  📊 View Reports
                </button>
                <button className="p-4 bg-purple-500/20 rounded-lg text-white hover:bg-purple-500/30 transition-all">
                  📈 Generate Graphs
                </button>
                <button className="p-4 bg-yellow-500/20 rounded-lg text-white hover:bg-yellow-500/30 transition-all">
                  ➕ Create Behavior
                </button>
                <button className="p-4 bg-pink-500/20 rounded-lg text-white hover:bg-pink-500/30 transition-all">
                  📤 Export Data
                </button>
              </div>

              {/* Recent Sessions */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Recent Sessions</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-white text-sm">Today 2:30 PM</div>
                    <div className="text-blue-200 text-xs">3 behaviors • 45 min • 87% accuracy</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-white text-sm">Yesterday 10:15 AM</div>
                    <div className="text-blue-200 text-xs">2 behaviors • 30 min • 92% accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Session Interface */
          <div className="space-y-6">
            {/* Session Status */}
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">🔴 Active Session</h2>
                  <p className="text-green-200">
                    Started: {sessionData?.startTime?.toLocaleTimeString()} • 
                    Duration: {Math.floor((Date.now() - new Date(sessionData?.startTime).getTime()) / 60000)} min
                  </p>
                </div>
                <button
                  onClick={stopSession}
                  className="px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
                >
                  ⏹️ Stop Session
                </button>
              </div>
            </div>

            {/* Behavior Tracking Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessionData?.behaviors.map((behavior: any) => (
                <div key={behavior.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">{behavior.name}</h3>
                  
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {behavior.count}
                    </div>
                    <div className="text-blue-200 text-sm">
                      Total Occurrences
                    </div>
                    {behavior.lastOccurrence && (
                      <div className="text-xs text-gray-300 mt-1">
                        Last: {new Date(behavior.lastOccurrence).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => recordBehavior(behavior.id, true)}
                      className="py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all"
                    >
                      ✅ Occurred
                    </button>
                    <button
                      onClick={() => recordBehavior(behavior.id, false)}
                      className="py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all"
                    >
                      ❌ No Response
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Record Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Quick Record</h3>
                <button
                  onClick={() => setShowQuickRecord(!showQuickRecord)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {showQuickRecord ? '▼' : '►'} Advanced ABC Data
                </button>
              </div>

              {showQuickRecord && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white mb-2">Antecedent</label>
                    <select className="w-full p-2 rounded bg-white/20 text-white">
                      <option>Verbal Prompt</option>
                      <option>Visual Cue</option>
                      <option>Environmental</option>
                      <option>Peer Interaction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-2">Intensity</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Notes</label>
                    <input 
                      type="text" 
                      placeholder="Quick notes..."
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hotkey Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">⌨️ Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-blue-200">Ctrl + 1: Record Behavior 1</div>
                <div className="text-blue-200">Ctrl + 2: Record Behavior 2</div>
                <div className="text-blue-200">Ctrl + 3: Record Behavior 3</div>
                <div className="text-blue-200">Ctrl + Space: Stop Session</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}