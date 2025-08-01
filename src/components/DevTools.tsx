'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Bug, ChevronUp, ChevronDown } from 'lucide-react';

export function DevTools() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const store = useAppStore();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-purple-600 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors z-50"
        title="Open Dev Tools"
      >
        <Bug size={20} color="white" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 transition-all ${isMinimized ? 'w-48' : 'w-96'}`}>
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-white">Dev Tools</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Current State */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Current State</h3>
            <div className="bg-gray-800 rounded p-2 text-xs font-mono">
              <div className="text-green-400">Board: {store.currentBoard || 'home'}</div>
              <div className="text-blue-400">History: [{store.boardHistory.join(', ')}]</div>
              <div className="text-yellow-400">Edit Mode: {store.isEditMode ? 'ON' : 'OFF'}</div>
              <div className="text-purple-400">Sentence: "{store.sentence}"</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => store.setCurrentBoard(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={() => store.toggleEditMode()}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded transition-colors"
              >
                Toggle Edit
              </button>
              <button
                onClick={() => store.clearSentence()}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded transition-colors"
              >
                Clear Sentence
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded transition-colors"
              >
                Reload App
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Settings</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Grid Columns</span>
                <input
                  type="range"
                  min="2"
                  max="5"
                  value={store.gridColumns}
                  onChange={(e) => store.updateSettings({ gridColumns: parseInt(e.target.value) })}
                  className="w-24"
                />
                <span className="text-xs text-gray-400 w-8 text-right">{store.gridColumns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Tile Scale</span>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={store.tileScale}
                  onChange={(e) => store.updateSettings({ tileScale: parseFloat(e.target.value) })}
                  className="w-24"
                />
                <span className="text-xs text-gray-400 w-8 text-right">{store.tileScale.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Speech Rate</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={store.speechRate}
                  onChange={(e) => store.updateSettings({ speechRate: parseFloat(e.target.value) })}
                  className="w-24"
                />
                <span className="text-xs text-gray-400 w-8 text-right">{store.speechRate.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Module Status */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Module Status</h3>
            <div className="bg-gray-800 rounded p-2 text-xs">
              <div className="text-gray-300">🟢 UI Components: Active</div>
              <div className="text-gray-300">🟢 Speech Synthesis: Active</div>
              <div className="text-gray-300">🟢 State Management: Active</div>
              <div className="text-gray-500">🟡 Healthcare Modules: Pending</div>
              <div className="text-gray-500">🟡 Billing System: Pending</div>
              <div className="text-gray-500">🟡 AI Features: Pending</div>
            </div>
          </div>

          {/* Console */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Console</h3>
            <div className="bg-gray-800 rounded p-2 h-24 overflow-y-auto">
              <div className="text-xs font-mono text-gray-400">
                <div>[Info] App initialized</div>
                <div>[Info] 64 modules registered</div>
                <div>[Info] Board navigation ready</div>
                <div>[Info] Speech synthesis enabled</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}