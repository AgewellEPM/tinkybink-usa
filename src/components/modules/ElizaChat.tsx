'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'eliza';
  timestamp: Date;
}

export function ElizaChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Eliza, your AAC assistant. I can help you create communication boards, suggest tiles, or answer questions about using TinkyBink.',
      sender: 'eliza',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const elizaResponses = {
    hello: "Hello! How can I help you with your communication needs today?",
    help: "I can help you: 1) Create custom boards, 2) Find appropriate tiles, 3) Set up sequences, 4) Configure speech settings. What would you like to do?",
    board: "I can help create boards for: Daily routines, Medical needs, School activities, or Custom topics. Which interests you?",
    tile: "What kind of tile would you like to add? I can suggest tiles for emotions, needs, activities, or help you create custom ones.",
    speech: "You can adjust speech settings in the settings menu. Would you like help with speech rate, pitch, or volume?",
    default: "That's interesting. Can you tell me more about what you're trying to communicate?",
  };

  const getElizaResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) return elizaResponses.hello;
    if (input.includes('help')) return elizaResponses.help;
    if (input.includes('board')) return elizaResponses.board;
    if (input.includes('tile')) return elizaResponses.tile;
    if (input.includes('speech') || input.includes('voice')) return elizaResponses.speech;
    
    // Smart suggestions based on context
    if (input.includes('create') || input.includes('make')) {
      return "I'd be happy to help you create that! What specific tiles or phrases would you like to include?";
    }
    
    if (input.includes('child') || input.includes('kid')) {
      return "For children, I recommend starting with basic needs (hungry, thirsty, bathroom), emotions (happy, sad, tired), and favorite activities. Would you like me to create a starter board?";
    }
    
    return elizaResponses.default;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate Eliza thinking
    setTimeout(() => {
      const elizaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getElizaResponse(input),
        sender: 'eliza',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, elizaMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Eliza AI Assistant</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 text-gray-200 p-3 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Eliza anything..."
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}