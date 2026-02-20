'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { AGENT_CATALOG } from '@/components/AgentHub';

interface AgentUsePanelProps {
  agentId: string;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent' | 'error';
  content: string;
  timestamp: Date;
}

let messageCounter = 0;
function generateMessageId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export default function AgentUsePanel({ agentId, onClose, initialPrompt }: AgentUsePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [agentStatus, setAgentStatus] = useState<'Available' | 'Active' | 'Error'>('Available');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialPromptSentRef = useRef(false);

  // Get agent catalog entry
  const catalogEntry = AGENT_CATALOG[agentId];

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle backdrop click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const sendMessage = useCallback(async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setAgentStatus('Active');

    try {
      const response = await fetch(`/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: trimmedMessage })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add agent response
      const agentMessage: Message = {
        id: generateMessageId(),
        role: 'agent',
        content: data.response || 'No response received',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);
      setAgentStatus('Available');
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: generateMessageId(),
        role: 'error',
        content: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setAgentStatus('Error');
    } finally {
      setIsLoading(false);
    }
  }, [agentId, isLoading]);

  // Auto-send initial prompt (only once)
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current) {
      initialPromptSentRef.current = true;
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'Available':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'Active':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'Error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'Available':
        return 'text-green-400';
      case 'Active':
        return 'text-blue-400';
      case 'Error':
        return 'text-red-400';
    }
  };

  const getCategoryColor = () => {
    const colors = {
      research: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      creative: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      technical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      business: 'bg-green-500/20 text-green-300 border-green-500/30',
      productivity: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    return colors[catalogEntry?.category || 'technical'];
  };

  if (!catalogEntry) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative h-full w-full md:w-[60%] lg:w-[50%] bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-out"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div 
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${catalogEntry.color} shadow-lg`}
              >
                {catalogEntry.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {catalogEntry.displayName}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor()}`}>
                    {catalogEntry.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon()}
                    <span className={`text-sm font-medium ${getStatusColor()}`}>
                      {agentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Agent Details (Collapsible) */}
        <div className="flex-shrink-0 border-b border-gray-800">
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-300">Agent Details</span>
            {isDetailsExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          {isDetailsExpanded && (
            <div className="px-6 pb-4 space-y-4 transition-all duration-200 ease-out">
              <p className="text-sm text-gray-400">{catalogEntry.description}</p>
              
              {/* Capabilities */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {catalogEntry.capabilities.map((capability, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {catalogEntry.quickActions.length > 0 && (
          <div className="flex-shrink-0 p-4 border-b border-gray-800 bg-gray-800/30">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h4 className="text-xs font-semibold text-gray-400 uppercase">Quick Actions</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {catalogEntry.quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="text-5xl opacity-50">{catalogEntry.icon}</div>
              <h3 className="text-lg font-medium text-gray-400">
                Start chatting with {catalogEntry.displayName}
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                Ask questions, request tasks, or use the quick actions above to get started.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                    : message.role === 'error'
                    ? 'bg-gray-800 border-2 border-red-500/50 text-red-300'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words font-mono">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
