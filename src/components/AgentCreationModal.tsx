'use client';

import { useState } from 'react';
import { X, Sparkles, Bot, Wrench, FileText, Loader2 } from 'lucide-react';

interface AgentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MODEL_PROVIDERS = [
  {
    provider: 'anthropic',
    label: 'Anthropic (Claude)',
    models: [
      { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
      { value: 'claude-opus-4', label: 'Claude Opus 4' },
      { value: 'claude-haiku-4', label: 'Claude Haiku 4' },
    ]
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    models: [
      { value: 'gpt-5.1', label: 'GPT-5.1' },
      { value: 'gpt-4.5', label: 'GPT-4.5' },
      { value: 'gpt-4o', label: 'GPT-4o' },
    ]
  },
  {
    provider: 'meta',
    label: 'Meta (Llama)',
    models: [
      { value: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
      { value: 'llama-3.1-405b', label: 'Llama 3.1 405B' },
      { value: 'llama-3.1-70b', label: 'Llama 3.1 70B' },
    ]
  },
  {
    provider: 'mistral',
    label: 'Mistral AI',
    models: [
      { value: 'mistral-large-3', label: 'Mistral Large 3' },
      { value: 'mistral-medium', label: 'Mistral Medium' },
      { value: 'mistral-small', label: 'Mistral Small' },
    ]
  },
  {
    provider: 'google',
    label: 'Google (Gemini)',
    models: [
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ]
  },
  {
    provider: 'emergent',
    label: 'Emergent Claude',
    models: [
      { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
      { value: 'claude-opus-4', label: 'Claude Opus 4' },
    ]
  },
  {
    provider: 'minimax',
    label: 'MiniMax',
    models: [
      { value: 'MiniMax-M2', label: 'MiniMax M2' },
      { value: 'MiniMax-M1', label: 'MiniMax M1' },
    ]
  }
];

const AVAILABLE_TOOLS = [
  { id: 'exec', name: 'Execute Shell Commands', description: 'Run shell commands in workspace', icon: '⚡' },
  { id: 'file_read', name: 'Read Files', description: 'Read files from workspace', icon: '📖' },
  { id: 'file_write', name: 'Write Files', description: 'Create and modify files', icon: '✍️' },
  { id: 'file_list', name: 'List Files', description: 'List directory contents', icon: '📁' },
  { id: 'git', name: 'Git Operations', description: 'Git clone, commit, push, pull', icon: '🔀' },
  { id: 'web_search', name: 'Web Search', description: 'Search the internet', icon: '🔍' },
  { id: 'web_fetch', name: 'Web Fetch', description: 'Fetch webpage content', icon: '🌐' },
  { id: 'browser', name: 'Browser Control', description: 'Automate browser actions', icon: '🖥️' },
  { id: 'sessions_spawn', name: 'Spawn Sessions', description: 'Create subagent sessions', icon: '🚀' },
  { id: 'sessions_send', name: 'Send to Sessions', description: 'Send messages to sessions', icon: '💬' },
];

const DEFAULT_SOUL = `# Agent Identity

You are a helpful AI assistant.

## Your Purpose

Help users accomplish their tasks efficiently and thoughtfully.

## Personality

- Professional yet friendly
- Clear and concise communication
- Proactive problem-solving
- Always ask for clarification when needed

## Guidelines

- Think step-by-step through complex problems
- Explain your reasoning when helpful
- Respect user preferences and constraints
- Admit when you don't know something
`;

export default function AgentCreationModal({ isOpen, onClose, onSuccess }: AgentCreationModalProps) {
  const [name, setName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('anthropic');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4');
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(['exec', 'file_read', 'file_write']));
  const [soul, setSoul] = useState(DEFAULT_SOUL);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(0.7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentProvider = MODEL_PROVIDERS.find(p => p.provider === selectedProvider);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const providerConfig = MODEL_PROVIDERS.find(p => p.provider === provider);
    if (providerConfig) {
      setSelectedModel(providerConfig.models[0].value);
    }
  };

  const toggleTool = (toolId: string) => {
    const newTools = new Set(selectedTools);
    if (newTools.has(toolId)) {
      newTools.delete(toolId);
    } else {
      newTools.add(toolId);
    }
    setSelectedTools(newTools);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }

    if (selectedTools.size === 0) {
      setError('Please select at least one tool');
      return;
    }

    setIsSubmitting(true);

    try {
      const agentId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agentId,
          name,
          model: {
            provider: selectedProvider,
            model: selectedModel,
            maxTokens,
            temperature,
          },
          tools: Array.from(selectedTools),
          soul,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create agent');
      }

      // Success!
      onSuccess();
      onClose();
      
      // Reset form
      setName('');
      setSelectedProvider('anthropic');
      setSelectedModel('claude-sonnet-4');
      setSelectedTools(new Set(['exec', 'file_read', 'file_write']));
      setSoul(DEFAULT_SOUL);
      setMaxTokens(4096);
      setTemperature(0.7);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
              <p className="text-blue-100 text-sm">Configure your AI agent's capabilities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Agent Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-semibold">
              <Bot className="w-5 h-5 text-blue-400" />
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Assistant, Code Helper, Data Analyzer"
              className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-white font-semibold">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Model
            </label>
            
            {/* Provider Selection */}
            <div className="grid grid-cols-7 gap-2">
              {MODEL_PROVIDERS.map((provider) => (
                <button
                  key={provider.provider}
                  type="button"
                  onClick={() => handleProviderChange(provider.provider)}
                  disabled={isSubmitting}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedProvider === provider.provider
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
                  }`}
                >
                  {provider.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Model Selection */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              {currentProvider?.models.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  min={256}
                  max={200000}
                  step={256}
                  disabled={isSubmitting}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Temperature</label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={isSubmitting}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Tools Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-white font-semibold">
                <Wrench className="w-5 h-5 text-green-400" />
                Available Tools
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTools(new Set(AVAILABLE_TOOLS.map(t => t.id)))}
                  disabled={isSubmitting}
                  className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded hover:bg-green-600/30 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTools(new Set())}
                  disabled={isSubmitting}
                  className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600/30 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => toggleTool(tool.id)}
                  disabled={isSubmitting}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTools.has(tool.id)
                      ? 'bg-green-600/20 border-green-500/50 shadow-lg shadow-green-500/20'
                      : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tool.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{tool.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{tool.description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedTools.has(tool.id)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-600'
                    }`}>
                      {selectedTools.has(tool.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SOUL Editor */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-semibold">
              <FileText className="w-5 h-5 text-orange-400" />
              Agent SOUL (Personality & Instructions)
            </label>
            <textarea
              value={soul}
              onChange={(e) => setSoul(e.target.value)}
              placeholder="Define your agent's personality, purpose, and guidelines..."
              disabled={isSubmitting}
              rows={12}
              className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono text-sm placeholder:text-gray-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-800/50 border-t border-gray-700 p-6 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {selectedTools.size} tool{selectedTools.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
