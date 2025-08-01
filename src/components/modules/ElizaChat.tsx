'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Brain, Sparkles, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'eliza';
  timestamp: Date;
}

interface Suggestion {
  emoji: string;
  text: string;
}

// Choice detection rules
const CHOICE_RULES: {
  orPattern: RegExp;
  extendedOrPatterns: RegExp[];
  choiceIndicators: string[];
  choiceEmojis: { [key: string]: string };
} = {
  orPattern: /\b(\w+(?:\s+\w+)?)\s+or\s+(\w+(?:\s+\w+)?)\b/gi,
  extendedOrPatterns: [
    /would\s+you\s+(?:like|prefer)\s+(\w+(?:\s+\w+)?)\s+or\s+(\w+(?:\s+\w+)?)/gi,
    /do\s+you\s+want\s+(\w+(?:\s+\w+)?)\s+or\s+(\w+(?:\s+\w+)?)/gi,
    /(\w+(?:\s+\w+)?)\s*,\s*(\w+(?:\s+\w+)?)\s*,?\s*or\s+(\w+(?:\s+\w+)?)/gi,
  ],
  choiceIndicators: ['choose', 'pick', 'select', 'prefer', 'rather', 'option', 'choice', 'decide', 'want'],
  choiceEmojis: {
    'apple': '🍎', 'banana': '🍌', 'cookie': '🍪', 'water': '💧', 'juice': '🥤',
    'milk': '🥛', 'coffee': '☕', 'tea': '🍵', 'pizza': '🍕', 'burger': '🍔',
    'sandwich': '🥪', 'salad': '🥗', 'soup': '🍲', 'pasta': '🍝', 'rice': '🍚',
    'play': '🎮', 'watch': '📺', 'read': '📚', 'sleep': '😴', 'walk': '🚶',
    'run': '🏃', 'sit': '🪑', 'stand': '🧍', 'music': '🎵', 'draw': '🎨',
    'home': '🏠', 'school': '🏫', 'park': '🏞️', 'store': '🏪', 'car': '🚗',
    'bus': '🚌', 'outside': '🌳', 'inside': '🏠', 'upstairs': '⬆️', 'downstairs': '⬇️',
    'happy': '😊', 'sad': '😢', 'angry': '😠', 'tired': '😴', 'hungry': '🍽️',
    'thirsty': '💧', 'hot': '🥵', 'cold': '🥶', 'sick': '🤒', 'better': '😌',
    'yes': '✅', 'no': '❌', 'maybe': '🤷', 'help': '🆘', 'stop': '🛑',
    'go': '🚶', 'wait': '⏸️', 'more': '➕', 'finished': '✅', 'please': '🙏',
    'mom': '👩', 'dad': '👨', 'teacher': '👩‍🏫', 'friend': '👫', 'doctor': '👨‍⚕️',
    'red': '🔴', 'blue': '🔵', 'yellow': '🟡', 'green': '🟢', 'orange': '🟠',
    'book': '📚', 'toy': '🧸', 'ball': '⚽', 'game': '🎮', 'tablet': '📱',
    'now': '⏰', 'later': '⏳', 'tomorrow': '🌅', 'yesterday': '⏮️', 'today': '📅'
  }
};

class ElizaEngine {
  extractChoices(text: string): string[] {
    const lowercaseText = text.toLowerCase();
    const choices: string[] = [];
    
    // Check basic OR pattern
    let match = CHOICE_RULES.orPattern.exec(lowercaseText);
    while (match) {
      choices.push(match[1], match[2]);
      match = CHOICE_RULES.orPattern.exec(lowercaseText);
    }
    
    // Check extended patterns
    CHOICE_RULES.extendedOrPatterns.forEach(pattern => {
      const matches = [...lowercaseText.matchAll(pattern)];
      matches.forEach(m => {
        for (let i = 1; i < m.length; i++) {
          if (m[i]) choices.push(m[i]);
        }
      });
    });
    
    // Remove duplicates and clean
    return [...new Set(choices.map(c => c.trim().toLowerCase()))];
  }

  getEmoji(word: string): string {
    const lower = word.toLowerCase().trim();
    
    // Direct match
    if (CHOICE_RULES.choiceEmojis[lower]) {
      return CHOICE_RULES.choiceEmojis[lower];
    }
    
    // Try removing 's' for plurals
    if (lower.endsWith('s') && CHOICE_RULES.choiceEmojis[lower.slice(0, -1)]) {
      return CHOICE_RULES.choiceEmojis[lower.slice(0, -1)];
    }
    
    // Try partial matches
    for (const [key, emoji] of Object.entries(CHOICE_RULES.choiceEmojis)) {
      if (lower.includes(key) || key.includes(lower)) {
        return emoji;
      }
    }
    
    // Category-based fallbacks
    if (lower.match(/food|eat|meal|lunch|dinner|breakfast/)) return '🍽️';
    if (lower.match(/drink|thirsty/)) return '🥤';
    if (lower.match(/place|go|location/)) return '📍';
    if (lower.match(/time|when/)) return '⏰';
    if (lower.match(/person|people|who/)) return '👤';
    if (lower.match(/thing|item|object/)) return '📦';
    
    return '💭';
  }

  generateSuggestions(text: string): Suggestion[] {
    const lowercaseText = text.toLowerCase();
    let suggestions: Suggestion[] = [];
    
    // First, check if this is a choice question
    const choices = this.extractChoices(text);
    const hasChoiceWord = CHOICE_RULES.choiceIndicators.some(word => 
      lowercaseText.includes(word)
    );
    
    if (choices.length > 0 || hasChoiceWord) {
      // This is a choice question
      if (choices.length > 0) {
        choices.forEach((choice, index) => {
          if (index < 3) {
            const emoji = this.getEmoji(choice);
            suggestions.push({
              emoji: emoji,
              text: `I want ${choice}`
            });
          }
        });
        
        // Fill remaining slots
        if (suggestions.length < 3) {
          if (choices.length === 2) {
            suggestions.push({
              emoji: '🤝',
              text: `Both ${choices[0]} and ${choices[1]}`
            });
          }
          suggestions.push({ emoji: '🤷', text: "Either one is fine" });
          suggestions.push({ emoji: '❌', text: "Neither, thank you" });
        }
      }
    }
    // YES/NO Questions
    else if (lowercaseText.match(/^(do|does|did|are|is|was|were|will|would|could|should|can|may|have|has)\s+you/)) {
      suggestions = [
        { emoji: '✅', text: "Yes!" },
        { emoji: '❌', text: "No" },
        { emoji: '🤔', text: "I'm not sure" }
      ];
    }
    // FEELING Questions
    else if (lowercaseText.match(/how\s+(are|do)\s+you|feel(ing)?/)) {
      suggestions = [
        { emoji: '😊', text: "I'm doing great!" },
        { emoji: '🙂', text: "I'm okay" },
        { emoji: '😔', text: "Not so good" }
      ];
    }
    // WHAT WANT Questions
    else if (lowercaseText.includes('what') && (lowercaseText.includes('want') || lowercaseText.includes('like'))) {
      suggestions = [
        { emoji: '🍕', text: "I want food" },
        { emoji: '💧', text: "I want water" },
        { emoji: '🎮', text: "I want to play" }
      ];
    }
    // WHERE Questions
    else if (lowercaseText.startsWith('where')) {
      suggestions = [
        { emoji: '🏠', text: "At home" },
        { emoji: '📍', text: "Right here" },
        { emoji: '🤷', text: "I don't know" }
      ];
    }
    // WHEN Questions
    else if (lowercaseText.startsWith('when')) {
      suggestions = [
        { emoji: '⏰', text: "Right now" },
        { emoji: '⏳', text: "Later" },
        { emoji: '🌅', text: "Tomorrow" }
      ];
    }
    // FOOD Related
    else if (lowercaseText.match(/eat|hungry|food|meal|breakfast|lunch|dinner|snack/)) {
      suggestions = [
        { emoji: '🍕', text: "I want pizza" },
        { emoji: '🥗', text: "Something healthy" },
        { emoji: '❌', text: "I'm not hungry" }
      ];
    }
    // HELP Requests
    else if (lowercaseText.includes('help')) {
      suggestions = [
        { emoji: '✅', text: "Yes, please help me" },
        { emoji: '❌', text: "No, I'm okay" },
        { emoji: '🤝', text: "I need help with this" }
      ];
    }
    // Default Eliza-like responses
    else {
      suggestions = [
        { emoji: '💬', text: "Tell me more" },
        { emoji: '🤔', text: "I understand" },
        { emoji: '👍', text: "That's interesting" }
      ];
    }
    
    return suggestions.slice(0, 3);
  }
}

export function ElizaChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome to TinkyBink Eliza! 👋 I'll suggest 3 responses for everything you say.",
      sender: 'eliza',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    { emoji: '👋', text: 'HELLO' },
    { emoji: '✅', text: 'YES' },
    { emoji: '❌', text: 'NO' },
    { emoji: '🙏', text: 'PLEASE' },
    { emoji: '🙏', text: 'THANK YOU' },
    { emoji: '❓', text: 'QUESTION' }
  ]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const elizaEngine = useRef(new ElizaEngine());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Generate suggestions based on user input
    const newSuggestions = elizaEngine.current.generateSuggestions(input);
    setSuggestions(newSuggestions);
    
    setInput('');
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const elizaMessage: Message = {
      id: Date.now().toString(),
      text: suggestion.text,
      sender: 'eliza',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, elizaMessage]);

    // Speak the response
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(suggestion.text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    // Placeholder for speech recognition
    setIsListening(!isListening);
  };

  return (
    <div className="eliza-full-screen">
      {/* Eliza Header */}
      <div className="eliza-header">
        <div className="eliza-brand">
          <div className="eliza-icon">
            <Brain size={32} />
          </div>
          <h1>TinkyBink Eliza</h1>
        </div>
        <div className="eliza-controls">
          <button className="eliza-btn listen">
            <Mic size={20} />
            <span>Start Listening</span>
          </button>
          <button className="eliza-btn back" onClick={onClose}>
            <X size={20} />
            <span>Back to AAC</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="eliza-chat-container">
        {/* Left Side - Chat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="chat-panel"
        >
          {/* Chat Header */}
          <div className="eliza-chat-header">
            <h3 className="eliza-chat-title">
              <Brain size={20} className="inline-block mr-2" />
              Communication Log
            </h3>
          </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="eliza-message"
            >
              {message.sender === 'eliza' && (
                <div className="eliza-label">
                  <Brain size={16} />
                  Eliza
                </div>
              )}
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="eliza-input-area">
          <div className="input-icons">
            <button className="input-icon">
              📎
            </button>
            <button className="input-icon" onClick={toggleListening}>
              🎤
            </button>
            <button className="input-icon">
              📷
            </button>
          </div>
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="eliza-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="send-button"
            >
              Send
            </button>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Suggestions */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="suggestion-board"
      >
        <h3>Eliza Suggestions</h3>
        
        <div className="tiles-grid">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="tile suggested"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="tile-emoji">{suggestion.emoji}</div>
              <div className="tile-text">{suggestion.text}</div>
              <div className="tile-number">{index + 1}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
    </div>
  );
}