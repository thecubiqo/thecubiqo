/**
 * AgentHub and AgentUsePanel Component Tests
 *
 * Tests the agent selection hub and agent interaction panel:
 * - AgentHub: displays available agents, filters by category, handles selection
 * - AgentUsePanel: agent chat interface, quick actions, collapsible details
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import AgentHub from '@/components/AgentHub';
import AgentUsePanel from '@/components/AgentUsePanel';

// --- Mock Agent Data ---

const mockAgents = [
  {
    id: 'a1',
    name: 'A1 (Henry)',
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
    soul: '',
    workspace: '/tmp/workspace',
    tools: ['file_read', 'web_search'],
    maxConcurrent: 5,
    status: 'idle',
    currentTasks: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'a3',
    name: 'A3 (Writer)',
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
    soul: '',
    workspace: '/tmp/workspace',
    tools: ['file_read', 'file_write'],
    maxConcurrent: 3,
    status: 'running',
    currentTasks: [
      { 
        id: 't1', 
        description: 'Writing docs', 
        assignedTo: 'a3', 
        status: 'running', 
        tokenUsage: { input: 0, output: 0, cost: 0 } 
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'a5',
    name: 'A5 (Marketing)',
    model: { provider: 'emergent', model: 'claude-sonnet-4-5', maxTokens: 4096, temperature: 0.7 },
    soul: '',
    workspace: '/tmp/workspace',
    tools: ['web_search', 'email_send'],
    maxConcurrent: 3,
    status: 'idle',
    currentTasks: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// --- Mock fetch and DOM methods ---

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Mock scrollIntoView (not available in jsdom)
  Element.prototype.scrollIntoView = vi.fn();
  
  fetchMock = vi.fn();
  global.fetch = fetchMock;
  
  // Default successful response for /api/agents
  fetchMock.mockImplementation((url) => {
    if (url === '/api/agents') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ agents: mockAgents }),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --- AgentHub Tests ---

describe('AgentHub', () => {
  it('renders loading state initially', () => {
    // Mock a fetch that never resolves to keep loading state
    fetchMock.mockImplementation(() => new Promise(() => {}));

    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={vi.fn()}
        selectedAgentId={null}
      />
    );

    expect(screen.getByText('Loading agents...')).toBeInTheDocument();
  });

  it('renders agent cards after loading', async () => {
    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={vi.fn()}
        selectedAgentId={null}
      />
    );

    // Wait for loading to complete and agents to render
    await waitFor(() => {
      expect(screen.queryByText('Loading agents...')).not.toBeInTheDocument();
    });

    // Check that agent display names from AGENT_CATALOG are shown
    expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();
    expect(screen.getByText('Writer (Content)')).toBeInTheDocument();
    expect(screen.getByText('Marketing Pro')).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    // Mock fetch to reject
    fetchMock.mockRejectedValue(new Error('Failed to fetch agents'));

    const retryHandler = vi.fn();

    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={vi.fn()}
        selectedAgentId={null}
      />
    );

    // Wait for error state to render
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch agents/)).toBeInTheDocument();
    
    // Check retry button exists
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Mock successful retry
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ agents: mockAgents }),
    });

    // Click retry button
    fireEvent.click(retryButton);

    // Wait for agents to load after retry
    await waitFor(() => {
      expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();
    });
  });

  it('calls onSelectAgent when clicking an agent card', async () => {
    const onSelectAgent = vi.fn();

    render(
      <AgentHub
        onSelectAgent={onSelectAgent}
        onCreateAgent={vi.fn()}
        selectedAgentId={null}
      />
    );

    // Wait for agents to load
    await waitFor(() => {
      expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();
    });

    // Click on the Henry agent card
    const henryCard = screen.getByText('Henry (Coordinator)').closest('div[class*="cursor-pointer"]');
    expect(henryCard).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(henryCard!);
    });

    // Verify callback was called with correct agent id
    expect(onSelectAgent).toHaveBeenCalledWith('a1');
  });

  it('calls onCreateAgent when clicking Create Agent button', async () => {
    const onCreateAgent = vi.fn();

    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={onCreateAgent}
        selectedAgentId={null}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading agents...')).not.toBeInTheDocument();
    });

    // Find and click the "Create Agent" button (there are two, get the first one in header)
    const createButtons = screen.getAllByRole('button', { name: /create agent/i });
    
    await act(async () => {
      fireEvent.click(createButtons[0]);
    });

    // Verify callback was called
    expect(onCreateAgent).toHaveBeenCalledTimes(1);
  });

  it('filters agents by category', async () => {
    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={vi.fn()}
        selectedAgentId={null}
      />
    );

    // Wait for agents to load
    await waitFor(() => {
      expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();
    });

    // Initially all agents should be visible
    expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();
    expect(screen.getByText('Writer (Content)')).toBeInTheDocument();
    expect(screen.getByText('Marketing Pro')).toBeInTheDocument();

    // Click the "Creative" category filter
    const creativeButton = screen.getByRole('button', { name: /creative/i });
    
    await act(async () => {
      fireEvent.click(creativeButton);
    });

    // Only Writer (Creative category) should be visible
    await waitFor(() => {
      expect(screen.queryByText('Henry (Coordinator)')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Writer (Content)')).toBeInTheDocument();
    expect(screen.queryByText('Marketing Pro')).not.toBeInTheDocument();
  });

  it('shows all agents when "All" category is selected', async () => {
    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={vi.fn()}
        selectedAgentId={null}
      />
    );

    // Wait for agents to load
    await waitFor(() => {
      expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();
    });

    // Click the "Business" category filter first to filter
    const businessButton = screen.getByRole('button', { name: /business/i });
    
    await act(async () => {
      fireEvent.click(businessButton);
    });

    // Only Marketing Pro should be visible
    await waitFor(() => {
      expect(screen.queryByText('Henry (Coordinator)')).not.toBeInTheDocument();
    });

    // Click "All" to show all agents again
    const allButton = screen.getByRole('button', { name: /^all/i });
    
    await act(async () => {
      fireEvent.click(allButton);
    });

    // All agents should be visible again
    await waitFor(() => {
      expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();
    });
    expect(screen.getByText('Writer (Content)')).toBeInTheDocument();
    expect(screen.getByText('Marketing Pro')).toBeInTheDocument();
  });

  it('shows selected agent with highlight', async () => {
    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={vi.fn()}
        selectedAgentId="a3"
      />
    );

    // Wait for agents to load
    await waitFor(() => {
      expect(screen.getByText('Writer (Content)')).toBeInTheDocument();
    });

    // Find the selected agent card
    const writerCard = screen.getByText('Writer (Content)').closest('div[class*="cursor-pointer"]');
    expect(writerCard).toBeInTheDocument();

    // Check that it has the selected styling (border-purple-500)
    expect(writerCard?.className).toContain('border-purple-500');
  });

  it('shows active task count for running agents', async () => {
    render(
      <AgentHub
        onSelectAgent={vi.fn()}
        onCreateAgent={vi.fn()}
        selectedAgentId={null}
      />
    );

    // Wait for agents to load
    await waitFor(() => {
      expect(screen.getByText('Writer (Content)')).toBeInTheDocument();
    });

    // Check that agent a3 (Writer) shows "1 active task"
    expect(screen.getByText('1 active task')).toBeInTheDocument();

    // Check that other agents don't show task count
    const henryCard = screen.getByText('Henry (Coordinator)').closest('div[class*="cursor-pointer"]');
    expect(henryCard?.textContent).not.toContain('active task');
  });
});

// --- AgentUsePanel Tests ---

describe('AgentUsePanel', () => {
  it('renders agent details from catalog', () => {
    render(
      <AgentUsePanel
        agentId="a1"
        onClose={vi.fn()}
      />
    );

    // Check agent display name
    expect(screen.getByText('Henry (Coordinator)')).toBeInTheDocument();

    // Check agent description
    expect(screen.getByText(/Your AI project lead who coordinates tasks/)).toBeInTheDocument();

    // Check capabilities are displayed
    expect(screen.getByText('Task Management')).toBeInTheDocument();
    expect(screen.getByText('Project Planning')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    render(
      <AgentUsePanel
        agentId="a1"
        onClose={onClose}
      />
    );

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close panel/i });
    
    fireEvent.click(closeButton);

    // Verify callback was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends message and shows response', async () => {
    // Mock the agent run API
    fetchMock.mockImplementation((url) => {
      if (url === '/api/agents/a1/run') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ response: 'Hello! I can help you with that.' }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <AgentUsePanel
        agentId="a1"
        onClose={vi.fn()}
      />
    );

    // Find the input and send button
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type a message
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello, can you help me?' } });
    });

    // Click send
    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Wait for user message to appear
    await waitFor(() => {
      expect(screen.getByText('Hello, can you help me?')).toBeInTheDocument();
    });

    // Wait for agent response to appear
    await waitFor(() => {
      expect(screen.getByText('Hello! I can help you with that.')).toBeInTheDocument();
    });

    // Verify fetch was called with correct parameters
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/agents/a1/run',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'Hello, can you help me?' }),
      })
    );
  });

  it('shows typing indicator while loading', async () => {
    // Mock a slow API response
    fetchMock.mockImplementation((url) => {
      if (url === '/api/agents/a1/run') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ response: 'Response after delay' }),
            });
          }, 100);
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <AgentUsePanel
        agentId="a1"
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type and send a message
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Check for typing indicator (animated dots)
    await waitFor(() => {
      const typingIndicator = screen.getByText('Test message').closest('.max-w-\\[80\\%\\]');
      expect(typingIndicator).toBeInTheDocument();
    });

    // Wait for response to complete
    await waitFor(() => {
      expect(screen.getByText('Response after delay')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows quick action buttons', () => {
    render(
      <AgentUsePanel
        agentId="a1"
        onClose={vi.fn()}
      />
    );

    // Check that quick actions are displayed
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plan a project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /break down a task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /coordinate team/i })).toBeInTheDocument();
  });

  it('sends quick action prompt when clicked', async () => {
    // Mock the agent run API
    fetchMock.mockImplementation((url) => {
      if (url === '/api/agents/a1/run') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ response: 'Sure, let me help you plan a project.' }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <AgentUsePanel
        agentId="a1"
        onClose={vi.fn()}
      />
    );

    // Click the "Plan a project" quick action
    const quickActionButton = screen.getByRole('button', { name: /plan a project/i });

    await act(async () => {
      fireEvent.click(quickActionButton);
    });

    // Wait for the prompt to be sent and response to appear
    await waitFor(() => {
      expect(screen.getByText('Help me plan a project')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Sure, let me help you plan a project.')).toBeInTheDocument();
    });

    // Verify fetch was called with the quick action prompt
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/agents/a1/run',
      expect.objectContaining({
        body: JSON.stringify({ prompt: 'Help me plan a project' }),
      })
    );
  });

  it('shows error message on failed request', async () => {
    // Mock fetch to reject
    fetchMock.mockImplementation((url) => {
      if (url === '/api/agents/a1/run') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <AgentUsePanel
        agentId="a1"
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type and send a message
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Error message should have red border styling
    const errorMessage = screen.getByText('Network error').closest('.max-w-\\[80\\%\\]');
    expect(errorMessage?.className).toContain('border-red-500');
  });

  it('collapses and expands details section', async () => {
    render(
      <AgentUsePanel
        agentId="a1"
        onClose={vi.fn()}
      />
    );

    // Initially details should be expanded (description is visible)
    expect(screen.getByText(/Your AI project lead who coordinates tasks/)).toBeInTheDocument();

    // Find the "Agent Details" toggle button
    const detailsToggle = screen.getByRole('button', { name: /agent details/i });

    // Click to collapse
    await act(async () => {
      fireEvent.click(detailsToggle);
    });

    // Description should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Your AI project lead who coordinates tasks/)).not.toBeInTheDocument();
    });

    // Click to expand again
    await act(async () => {
      fireEvent.click(detailsToggle);
    });

    // Description should be visible again
    await waitFor(() => {
      expect(screen.getByText(/Your AI project lead who coordinates tasks/)).toBeInTheDocument();
    });
  });
});
