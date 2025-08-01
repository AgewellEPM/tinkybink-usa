'use client';

import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { useSpeech } from '@/hooks/use-speech';
import { getAnalyticsService } from '@/modules/module-system';

export function SentenceBar() {
  const { sentence, setSentence, clearSentence, setCurrentView } = useAppStore();
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const { speak } = useSpeech();
  const [analytics, setAnalytics] = useState<ReturnType<typeof getAnalyticsService> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAnalytics(getAnalyticsService());
    }
  }, []);
  
  const handleSpeak = () => {
    if (sentence) {
      speak(sentence);
      analytics?.trackSentence(sentence);
    }
  };

  const handleClear = () => {
    clearSentence();
    if (contentEditableRef.current) {
      contentEditableRef.current.textContent = '';
    }
  };

  const handleEliza = () => {
    // Process with Eliza - show Eliza view
    if (sentence) {
      analytics?.track('eliza_process', { sentence });
    }
    setCurrentView('eliza');
  };

  const handleInput = () => {
    if (contentEditableRef.current) {
      setSentence(contentEditableRef.current.textContent || '');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSpeak();
    }
  };

  // Update content editable when sentence changes
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.textContent !== sentence) {
      contentEditableRef.current.textContent = sentence;
    }
  }, [sentence]);

  return (
    <div className="sentence-bar">
      <div
        ref={contentEditableRef}
        className="sentence-content"
        contentEditable
        data-placeholder="Click tiles or type here... Try: 'Do you want apple banana cookie?'"
        onInput={handleInput}
        onKeyPress={handleKeyPress}
        suppressContentEditableWarning
      />
      <div className="sentence-actions">
        <button className="sentence-btn" onClick={handleSpeak} title="Speak (Space)">
          🔊
        </button>
        <button className="sentence-btn" onClick={handleEliza} title="Process with Eliza">
          🧠
        </button>
        <button className="sentence-btn clear" onClick={handleClear} title="Clear (C)">
          🗑️
        </button>
      </div>
    </div>
  );
}