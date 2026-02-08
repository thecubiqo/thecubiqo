'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { Session } from '@/types/session';

interface AgentWithSessions extends Agent {
  sessions: Session[];
}

export default function AgentDashboard() {
  const [agents, setAgents] = useState<AgentWithSessions[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      
      // Load sessions for each agent
      const agentsWithSessions = await Promise.all(
        data.agents.map(async (agent: Agent) => {
          const sessionsRes = await fetch(`/api/agents/${agent.id}/sessions`);
          const sessionsData = await sessionsRes.json();
          return { ...agent, sessions: sessionsData.sessions || [] };
        })
      );

      setAgents(agentsWithSessions);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedAgent) return;

    setLoading(true);
    const userMessage = chatInput;
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const res = await fetch(`/api/agents/${selectedAgent}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'error', content: 'Failed to get response' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const spawnTask = async (agentId: string, task: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/spawn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });

      const data = await res.json();
      alert(`Task spawned! Run ID: ${data.runId}`);
      loadAgents();
    } catch (error) {
      alert('Failed to spawn task');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Agent Sidebar */}
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Agents</h2>
        
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-3 mb-2 rounded cursor-pointer transition ${
              selectedAgent === agent.id
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedAgent(agent.id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{agent.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  agent.status === 'running'
                    ? 'bg-green-500'
                    : agent.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              >
                {agent.status}
              </span>
            </div>
            
            <div className="text-xs text-gray-400 mt-1">
              {agent.currentTasks.length} tasks
            </div>

            {agent.currentTasks.length > 0 && (
              <div className="mt-2 space-y-1">
                {agent.currentTasks.map((task) => (
                  <div key={task.id} className="text-xs bg-gray-900 p-2 rounded">
                    <div className="flex justify-between">
                      <span className="truncate">{task.description.slice(0, 30)}...</span>
                      <span className={`ml-2 ${
                        task.status === 'running' ? 'text-yellow-400' :
                        task.status === 'done' ? 'text-green-400' :
                        task.status === 'failed' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedAgent ? (
          <>
            <div className="bg-gray-800 p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                Chat with {agents.find((a) => a.id === selectedAgent)?.name}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded ${
                    msg.role === 'user'
                      ? 'bg-blue-600 ml-auto max-w-2xl'
                      : msg.role === 'error'
                      ? 'bg-red-600 max-w-2xl'
                      : 'bg-gray-700 max-w-2xl'
                  }`}
                >
                  <div className="text-xs text-gray-300 mb-1">
                    {msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'Agent'}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div className="bg-gray-700 p-3 rounded max-w-2xl">
                  <div className="text-xs text-gray-300 mb-1">Agent</div>
                  <div className="animate-pulse">Thinking...</div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Send a message..."
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select an agent to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
