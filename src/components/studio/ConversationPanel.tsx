'use client';

import { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ConversationPanelProps {
  onCodeGenerated?: (code: string, language: string) => void;
}

export default function ConversationPanel({ onCodeGenerated }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    try {
      // Call real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: 'studio-session',
          context: 'studio-builder',
          history: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiContent = data.response || 'I apologize, I couldn\'t process that request. Please try again.';
      
      // Add AI response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: aiContent,
      }]);

      // Extract code blocks and push to editor
      if (onCodeGenerated) {
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockRegex.exec(aiContent)) !== null) {
          const lang = match[1] || 'typescript';
          const code = match[2].trim();
          if (code) {
            onCodeGenerated(code, lang);
            break; // Only apply first code block
          }
        }
      }
    } catch (error) {
      console.error('AI API error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-2xl">💬</div>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            AI Assistant
          </h2>
        </div>
        <p className="text-xs text-gray-400">Build with conversation</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">Start Building with AI</h3>
            <p className="text-sm text-gray-400 mb-4">
              Describe your app and I'll help you build it. Try:
            </p>
            <div className="space-y-2 text-left">
              <button
                onClick={() => setInput("Create a Next.js blog with Tailwind CSS")}
                className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg text-sm text-gray-300 transition-colors border border-gray-700 hover:border-teal-500"
              >
                💡 "Create a Next.js blog with Tailwind CSS"
              </button>
              <button
                onClick={() => setInput("Build a todo app with React")}
                className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg text-sm text-gray-300 transition-colors border border-gray-700 hover:border-teal-500"
              >
                ✅ "Build a todo app with React"
              </button>
              <button
                onClick={() => setInput("Create a landing page for a startup")}
                className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg text-sm text-gray-300 transition-colors border border-gray-700 hover:border-teal-500"
              >
                🚀 "Create a landing page for a startup"
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] rounded-lg p-3 shadow-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white' 
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content.split(/(```\w*\n[\s\S]*?```)/g).map((part, j) => {
                      const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/);
                      if (codeMatch) {
                        return (
                          <div key={j} className="my-2">
                            <div className="flex items-center justify-between bg-gray-900/50 px-3 py-1 rounded-t text-xs text-gray-400">
                              <span>{codeMatch[1] || 'code'}</span>
                              {onCodeGenerated && (
                                <button
                                  onClick={() => onCodeGenerated(codeMatch[2].trim(), codeMatch[1] || 'typescript')}
                                  className="text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                  Apply to Editor →
                                </button>
                              )}
                            </div>
                            <pre className="bg-gray-900/80 px-3 py-2 rounded-b text-xs overflow-x-auto">
                              <code>{codeMatch[2].trim()}</code>
                            </pre>
                          </div>
                        );
                      }
                      return <span key={j}>{part}</span>;
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder={isLoading ? "AI is thinking..." : "Describe what you want to build..."}
            disabled={isLoading}
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 transition-all placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-teal-500/50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
