'use client';

import { useAppStore } from '@/store/app-store';
import { Home, Settings, Edit3, Users, Brain } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { isEditMode, toggleEditMode } = useAppStore();

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🗣️</span>
              <h1 className="text-xl font-bold text-white">TinkyBink AAC</h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {/* Home */}
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              title="Home"
            >
              <Home className="w-5 h-5 text-gray-300" />
            </Link>

            {/* Edit Mode Toggle */}
            <button
              onClick={toggleEditMode}
              className={`p-2 rounded-lg transition-colors ${
                isEditMode
                  ? 'bg-purple-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
              title="Edit Mode"
            >
              <Edit3 className="w-5 h-5" />
            </button>

            {/* Eliza AI */}
            <Link
              href="/eliza"
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              title="Eliza AI Assistant"
            >
              <Brain className="w-5 h-5 text-gray-300" />
            </Link>

            {/* Collaboration */}
            <Link
              href="/collaborate"
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              title="Collaborate"
            >
              <Users className="w-5 h-5 text-gray-300" />
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-300" />
            </Link>

            {/* Demo Mode Indicator */}
            <div className="ml-4 border-l border-gray-700 pl-4">
              <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded text-sm">
                Demo Mode
              </span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}