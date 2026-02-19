'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Agent } from '@/types/agent';

interface AgentCatalogEntry {
  displayName: string;
  description: string;
  category: 'research' | 'creative' | 'technical' | 'business' | 'productivity';
  icon: string; // emoji
  color: string; // tailwind gradient classes
  capabilities: string[];
  quickActions: { label: string; prompt: string }[];
}

export const AGENT_CATALOG: Record<string, AgentCatalogEntry> = {
  a1: {
    displayName: 'Henry (Coordinator)',
    description: 'Your AI project lead who coordinates tasks, breaks down complex problems, and manages workflow',
    category: 'productivity',
    icon: '🎯',
    color: 'from-purple-500 to-pink-600',
    capabilities: ['Task Management', 'Project Planning', 'Team Coordination', 'Workflow Optimization'],
    quickActions: [
      { label: 'Plan a project', prompt: 'Help me plan a project' },
      { label: 'Break down a task', prompt: 'Break down this task into steps' },
      { label: 'Coordinate team', prompt: 'Help coordinate team activities' },
    ],
  },
  a2: {
    displayName: 'Dev (Engineer)',
    description: 'Full-stack developer for coding, debugging, architecture, and technical problem-solving',
    category: 'technical',
    icon: '💻',
    color: 'from-blue-500 to-cyan-600',
    capabilities: ['Full-Stack Development', 'Code Review', 'Architecture Design', 'Debugging'],
    quickActions: [
      { label: 'Debug an issue', prompt: 'Help me debug this issue' },
      { label: 'Review code', prompt: 'Review my code' },
      { label: 'Build a feature', prompt: 'Help me build a feature' },
    ],
  },
  a3: {
    displayName: 'Writer (Content)',
    description: 'Content specialist for articles, documentation, copywriting, and creative writing',
    category: 'creative',
    icon: '✍️',
    color: 'from-amber-500 to-orange-600',
    capabilities: ['Content Writing', 'Documentation', 'Copywriting', 'Creative Stories'],
    quickActions: [
      { label: 'Write a blog post', prompt: 'Write a blog post about' },
      { label: 'Draft documentation', prompt: 'Help me write documentation' },
      { label: 'Create copy', prompt: 'Create marketing copy' },
    ],
  },
  a4: {
    displayName: 'Tester (QA)',
    description: 'Quality assurance expert for testing, bug verification, and ensuring reliability',
    category: 'technical',
    icon: '🔍',
    color: 'from-green-500 to-emerald-600',
    capabilities: ['Test Planning', 'Bug Detection', 'Quality Assurance', 'Test Automation'],
    quickActions: [
      { label: 'Write test cases', prompt: 'Help me write test cases' },
      { label: 'Find bugs', prompt: 'Help me find bugs in' },
      { label: 'Test a feature', prompt: 'Test this feature' },
    ],
  },
  a5: {
    displayName: 'Marketing Pro',
    description: 'Growth and marketing strategist for campaigns, social media, and brand building',
    category: 'business',
    icon: '📈',
    color: 'from-pink-500 to-rose-600',
    capabilities: ['Marketing Strategy', 'Social Media', 'Campaign Planning', 'Brand Building'],
    quickActions: [
      { label: 'Create a campaign', prompt: 'Create a marketing campaign' },
      { label: 'Write social posts', prompt: 'Write social media posts' },
      { label: 'Analyze market', prompt: 'Analyze market trends' },
    ],
  },
  a6: {
    displayName: 'Animator (Visual)',
    description: 'Visual design and animation specialist for stunning UI interactions',
    category: 'creative',
    icon: '🎨',
    color: 'from-indigo-500 to-purple-600',
    capabilities: ['UI Design', 'Animation', 'Visual Effects', 'Component Design'],
    quickActions: [
      { label: 'Design a component', prompt: 'Design a UI component' },
      { label: 'Create animations', prompt: 'Create animations for' },
      { label: 'UI review', prompt: 'Review UI design' },
    ],
  },
  a7: {
    displayName: 'Business Advisor',
    description: 'Business development expert for strategy, outreach, partnerships, and customer relations',
    category: 'business',
    icon: '💼',
    color: 'from-teal-500 to-cyan-600',
    capabilities: ['Business Strategy', 'Partnerships', 'Customer Relations', 'Market Research'],
    quickActions: [
      { label: 'Business strategy', prompt: 'Help with business strategy' },
      { label: 'Draft proposal', prompt: 'Draft a business proposal' },
      { label: 'Market research', prompt: 'Conduct market research' },
    ],
  },
};

const defaultEntry: AgentCatalogEntry = {
  displayName: 'Custom Agent',
  description: 'A custom AI agent tailored to your specific needs',
  category: 'productivity',
  icon: '🤖',
  color: 'from-gray-500 to-slate-600',
  capabilities: ['Custom Tasks', 'Flexible Operations'],
  quickActions: [
    { label: 'Start task', prompt: 'Help me with a task' },
  ],
};

interface AgentHubProps {
  onSelectAgent: (agentId: string, initialPrompt?: string) => void;
  onCreateAgent: () => void;
  selectedAgentId?: string | null;
}

type CategoryFilter = 'all' | 'research' | 'creative' | 'technical' | 'business' | 'productivity';

const AgentHub: React.FC<AgentHubProps> = ({ onSelectAgent, onCreateAgent, selectedAgentId }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      setAgents(data.agents || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    // Poll every 5 seconds for status updates, only when tab is visible
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchAgents();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAgentMetadata = (agent: Agent) => {
    return AGENT_CATALOG[agent.id] || {
      ...defaultEntry,
      displayName: agent.name,
    };
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'idle':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: Agent['status']) => {
    switch (status) {
      case 'idle':
        return 'Available';
      case 'running':
        return 'Active';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (categoryFilter === 'all') return true;
    const metadata = getAgentMetadata(agent);
    return metadata.category === categoryFilter;
  });

  const getCategoryCount = (category: CategoryFilter) => {
    if (category === 'all') return agents.length;
    return agents.filter((agent) => getAgentMetadata(agent).category === category).length;
  };

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'research', label: 'Research' },
    { key: 'creative', label: 'Creative' },
    { key: 'technical', label: 'Technical' },
    { key: 'business', label: 'Business' },
    { key: 'productivity', label: 'Productivity' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-400">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Error: {error}</p>
          <button
            onClick={fetchAgents}
            className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Agent Hub</h1>
              <p className="text-gray-400 mt-1">Your AI team, ready to help</p>
            </div>
          </div>
          <button
            onClick={onCreateAgent}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
          >
            <Plus className="w-5 h-5" />
            Create Agent
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => {
          const count = getCategoryCount(category.key);
          const isActive = categoryFilter === category.key;
          return (
            <button
              key={category.key}
              onClick={() => setCategoryFilter(category.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {category.label}
              <span className="ml-2 text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Agent Cards Grid */}
      {filteredAgents.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <p className="text-xl text-gray-400">No agents available</p>
            <p className="text-gray-500 mt-2">Create your first agent to get started</p>
            <button
              onClick={onCreateAgent}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Create Agent
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => {
            const metadata = getAgentMetadata(agent);
            const isSelected = selectedAgentId === agent.id;

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`relative group cursor-pointer rounded-2xl bg-gray-800/50 backdrop-blur border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  isSelected
                    ? 'border-purple-500 shadow-xl shadow-purple-500/30'
                    : 'border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {/* Card Content */}
                <div className="p-6">
                  {/* Icon and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${metadata.color} flex items-center justify-center text-3xl shadow-lg`}>
                      {metadata.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(agent.status)}
                      <span className="text-xs text-gray-400">{getStatusText(agent.status)}</span>
                    </div>
                  </div>

                  {/* Name and Category */}
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-white mb-1">{metadata.displayName}</h3>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${metadata.color} text-white`}>
                      {metadata.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{metadata.description}</p>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {metadata.capabilities.slice(0, 3).map((capability, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded-md border border-gray-600/50"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {metadata.quickActions.slice(0, 2).map((action, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAgent(agent.id, action.prompt);
                          }}
                          className="px-3 py-2 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 rounded-lg transition-colors border border-gray-600/30 hover:border-gray-500"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Task Count (if running) */}
                  {agent.currentTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Activity className="w-3 h-3" />
                        <span>{agent.currentTasks.length} active task{agent.currentTasks.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentHub;
