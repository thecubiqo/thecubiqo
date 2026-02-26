import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────

// Mock lucide-react X icon used by EditorTabs
vi.mock('lucide-react', () => ({
  X: ({ size, ...props }: any) => (
    <svg data-testid="x-icon" width={size} height={size} {...props} />
  ),
}));

// Mock Monaco Editor (unused by the 6 components but prevents import failures)
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(() => null),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────

import EditorTabs, { EditorTab } from '@/components/studio/EditorTabs';
import EmptyState from '@/components/studio/EmptyState';
import Toast from '@/components/studio/Toast';
import LoadingSpinner from '@/components/studio/LoadingSpinner';
import StatusBar from '@/components/studio/StatusBar';
import FileExplorer from '@/components/studio/FileExplorer';

// ── Helpers ────────────────────────────────────────────────────────────

function makeTabs(overrides: Partial<EditorTab>[] = []): EditorTab[] {
  const defaults: EditorTab[] = [
    { id: '1', path: 'app/page.tsx', name: 'page.tsx', isDirty: false, language: 'tsx' },
    { id: '2', path: 'lib/utils.ts', name: 'utils.ts', isDirty: true, language: 'typescript' },
    { id: '3', path: 'styles/globals.css', name: 'globals.css', isDirty: false, language: 'css' },
  ];
  return defaults.map((t, i) => ({ ...t, ...overrides[i] }));
}

// ════════════════════════════════════════════════════════════════════════
//  EditorTabs
// ════════════════════════════════════════════════════════════════════════

describe('EditorTabs', () => {
  const onTabChange = vi.fn();
  const onTabClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all provided tabs', () => {
    const tabs = makeTabs();
    render(
      <EditorTabs tabs={tabs} activeTabId="1" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    expect(screen.getByText('page.tsx')).toBeDefined();
    expect(screen.getByText('utils.ts')).toBeDefined();
    expect(screen.getByText('globals.css')).toBeDefined();
  });

  it('highlights the active tab with teal border classes', () => {
    const tabs = makeTabs();
    const { container } = render(
      <EditorTabs tabs={tabs} activeTabId="1" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    // The active tab wrapper should contain the 'border-teal-500' class
    const activeName = screen.getByText('page.tsx');
    const tabWrapper = activeName.closest('div[class*="border-teal-500"]');
    expect(tabWrapper).not.toBeNull();
  });

  it('shows dirty indicator (●) only for dirty tabs', () => {
    const tabs = makeTabs();
    const { container } = render(
      <EditorTabs tabs={tabs} activeTabId="1" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    // Only tab 2 is dirty — expect exactly one ● indicator
    const dirtyMarkers = container.querySelectorAll('span.text-teal-400');
    expect(dirtyMarkers.length).toBe(1);
    expect(dirtyMarkers[0].textContent).toBe('●');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const tabs = makeTabs();
    render(
      <EditorTabs tabs={tabs} activeTabId="1" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    fireEvent.click(screen.getByText('utils.ts'));
    expect(onTabChange).toHaveBeenCalledWith('2');
  });

  it('calls onTabClose (not onTabChange) when close button clicked', () => {
    const tabs = makeTabs();
    render(
      <EditorTabs tabs={tabs} activeTabId="1" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    const closeBtn = screen.getByRole('button', { name: /Close utils\.ts/i });
    fireEvent.click(closeBtn);
    expect(onTabClose).toHaveBeenCalledWith('2');
    // stopPropagation should prevent onTabChange from firing on the close click
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('shows "No files open" when tabs array is empty', () => {
    render(
      <EditorTabs tabs={[]} activeTabId="" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    expect(screen.getByText('No files open')).toBeDefined();
  });

  it('renders correct file icon for each language', () => {
    const tabs: EditorTab[] = [
      { id: 'py', path: 'main.py', name: 'main.py', isDirty: false, language: 'python' },
      { id: 'js', path: 'index.js', name: 'index.js', isDirty: false, language: 'javascript' },
    ];
    render(
      <EditorTabs tabs={tabs} activeTabId="py" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    // Python icon is 🐍, JS icon is 📙
    expect(screen.getByText('🐍')).toBeDefined();
    expect(screen.getByText('📙')).toBeDefined();
  });

  it('falls back to file icon from path extension when language prop is absent', () => {
    const tabs: EditorTab[] = [
      { id: 'rs', path: 'main.rs', name: 'main.rs', isDirty: false }, // no language prop
    ];
    render(
      <EditorTabs tabs={tabs} activeTabId="rs" onTabChange={onTabChange} onTabClose={onTabClose} />,
    );
    // .rs → rust → 🦀
    expect(screen.getByText('🦀')).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════
//  EmptyState
// ════════════════════════════════════════════════════════════════════════

describe('EmptyState', () => {
  it('renders title, description, and default icon', () => {
    render(<EmptyState title="Nothing here" description="Start creating something." />);
    expect(screen.getByText('Nothing here')).toBeDefined();
    expect(screen.getByText('Start creating something.')).toBeDefined();
    // Default icon is 📝
    expect(screen.getByText('📝')).toBeDefined();
  });

  it('renders a custom icon when provided', () => {
    render(<EmptyState icon="🚀" title="Launch" description="Ready to go." />);
    expect(screen.getByText('🚀')).toBeDefined();
  });

  it('renders action button when action prop is provided', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No files"
        description="Create your first file."
        action={{ label: 'Create File', onClick }}
      />,
    );
    const btn = screen.getByRole('button', { name: /Create File/i });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does NOT render a button when action is omitted', () => {
    render(<EmptyState title="Empty" description="Nothing to show." />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
//  Toast
// ════════════════════════════════════════════════════════════════════════

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message text', () => {
    render(<Toast message="Saved!" type="success" onClose={vi.fn()} />);
    expect(screen.getByText('Saved!')).toBeDefined();
  });

  it('renders correct icon per type', () => {
    const { unmount } = render(<Toast message="ok" type="success" onClose={vi.fn()} />);
    expect(screen.getByText('✓')).toBeDefined();
    unmount();

    const { unmount: u2 } = render(<Toast message="fail" type="error" onClose={vi.fn()} />);
    expect(screen.getByText('✕')).toBeDefined();
    u2();

    const { unmount: u3 } = render(<Toast message="warn" type="warning" onClose={vi.fn()} />);
    expect(screen.getByText('⚠')).toBeDefined();
    u3();

    render(<Toast message="info" type="info" onClose={vi.fn()} />);
    expect(screen.getByText('ℹ')).toBeDefined();
  });

  it('applies success background class', () => {
    const { container } = render(<Toast message="ok" type="success" onClose={vi.fn()} />);
    const inner = container.querySelector('.bg-green-500');
    expect(inner).not.toBeNull();
  });

  it('applies error background class', () => {
    const { container } = render(<Toast message="fail" type="error" onClose={vi.fn()} />);
    const inner = container.querySelector('.bg-red-500');
    expect(inner).not.toBeNull();
  });

  it('applies warning background class', () => {
    const { container } = render(<Toast message="warn" type="warning" onClose={vi.fn()} />);
    const inner = container.querySelector('.bg-yellow-500');
    expect(inner).not.toBeNull();
  });

  it('applies info (blue) background class', () => {
    const { container } = render(<Toast message="note" type="info" onClose={vi.fn()} />);
    const inner = container.querySelector('.bg-blue-500');
    expect(inner).not.toBeNull();
  });

  it('auto-closes after the default duration (3000 ms + 300 ms animation)', () => {
    const onClose = vi.fn();
    render(<Toast message="bye" type="info" onClose={onClose} />);

    // Advance past the auto-dismiss timeout (3000 ms)
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onClose).not.toHaveBeenCalled(); // still waiting for 300ms animation

    // Advance past the animation delay
    act(() => { vi.advanceTimersByTime(300); });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('respects a custom duration', () => {
    const onClose = vi.fn();
    render(<Toast message="quick" type="success" duration={1000} onClose={onClose} />);

    act(() => { vi.advanceTimersByTime(999); });
    expect(onClose).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1); }); // hits 1000ms
    act(() => { vi.advanceTimersByTime(300); }); // animation delay
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when close button is clicked manually', () => {
    const onClose = vi.fn();
    const { container } = render(<Toast message="close me" type="info" onClose={onClose} />);

    // The close button is the button inside the toast
    const closeBtn = container.querySelector('button');
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn!);

    // onClose fires after 300ms animation delay
    act(() => { vi.advanceTimersByTime(300); });
    expect(onClose).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════
//  LoadingSpinner
// ════════════════════════════════════════════════════════════════════════

describe('LoadingSpinner', () => {
  it('renders with default (md) size', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.w-8.h-8');
    expect(spinner).not.toBeNull();
  });

  it('renders small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    expect(container.querySelector('.w-4.h-4')).not.toBeNull();
  });

  it('renders large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    expect(container.querySelector('.w-12.h-12')).not.toBeNull();
  });

  it('shows a message when provided', () => {
    render(<LoadingSpinner message="Loading workspace…" />);
    expect(screen.getByText('Loading workspace…')).toBeDefined();
  });

  it('does NOT render a message when not provided', () => {
    const { container } = render(<LoadingSpinner />);
    // No <p> tag should exist
    expect(container.querySelector('p')).toBeNull();
  });

  it('spinner element has animate-spin class', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
//  StatusBar
// ════════════════════════════════════════════════════════════════════════

describe('StatusBar', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.useFakeTimers();
    // Default: online, fetch succeeds
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
    vi.restoreAllMocks();
  });

  it('renders "Connected" when navigator is online and API responds ok', async () => {
    await act(async () => {
      render(<StatusBar />);
    });
    // Allow the health check promise to resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('Connected')).toBeDefined();
  });

  it('renders "Disconnected" when navigator is offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    await act(async () => {
      render(<StatusBar />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('Disconnected')).toBeDefined();
  });

  it('displays the language prop', async () => {
    await act(async () => {
      render(<StatusBar language="Go" />);
    });
    expect(screen.getByText('Go')).toBeDefined();
  });

  it('defaults language to "TypeScript React"', async () => {
    await act(async () => {
      render(<StatusBar />);
    });
    expect(screen.getByText('TypeScript React')).toBeDefined();
  });

  it('shows line/col indicator and encoding', async () => {
    await act(async () => {
      render(<StatusBar />);
    });
    expect(screen.getByText('Ln 1, Col 1')).toBeDefined();
    expect(screen.getByText('UTF-8')).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════
//  FileExplorer
// ════════════════════════════════════════════════════════════════════════

describe('FileExplorer', () => {
  const onFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: API fails → component falls back to mock data
    global.fetch = vi.fn().mockRejectedValue(new Error('network'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Files header', async () => {
    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });
    expect(screen.getByText(/Files/)).toBeDefined();
  });

  it('falls back to mock data when API is unavailable and renders file tree', async () => {
    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });
    // Mock data includes 'app', 'components', 'package.json', 'README.md'
    // Root-level folders open by default (level === 0)
    expect(screen.getByText('app')).toBeDefined();
    expect(screen.getByText('components')).toBeDefined();
    expect(screen.getByText('package.json')).toBeDefined();
    expect(screen.getByText('README.md')).toBeDefined();
  });

  it('shows children of root-level folders (level 0 folders default to open)', async () => {
    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });
    // 'app' folder is level 0 so open by default → children visible
    expect(screen.getByText('page.tsx')).toBeDefined();
    expect(screen.getByText('layout.tsx')).toBeDefined();
    expect(screen.getByText('globals.css')).toBeDefined();
  });

  it('calls onFileSelect when a file is clicked', async () => {
    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });
    fireEvent.click(screen.getByText('page.tsx'));
    expect(onFileSelect).toHaveBeenCalledWith('app/page.tsx');
  });

  it('highlights the current file', async () => {
    let container!: HTMLElement;
    await act(async () => {
      const result = render(
        <FileExplorer onFileSelect={onFileSelect} currentFile="app/page.tsx" />,
      );
      container = result.container;
    });
    // The selected node should have teal highlight class
    const selectedNode = screen.getByText('page.tsx').closest('div[class*="bg-teal-900"]');
    expect(selectedNode).not.toBeNull();
  });

  it('toggles folder open/close on click', async () => {
    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });
    // 'app' is open by default — children visible
    expect(screen.getByText('page.tsx')).toBeDefined();

    // Click 'app' to collapse
    fireEvent.click(screen.getByText('app'));
    expect(screen.queryByText('page.tsx')).toBeNull();

    // Click again to expand
    fireEvent.click(screen.getByText('app'));
    expect(screen.getByText('page.tsx')).toBeDefined();
  });

  it('has a "Create new file" button with correct aria-label', async () => {
    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });
    const newFileBtn = screen.getByRole('button', { name: /Create new file/i });
    expect(newFileBtn).toBeDefined();
  });

  it('has a "Refresh file tree" button', async () => {
    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });
    const refreshBtn = screen.getByRole('button', { name: /Refresh file tree/i });
    expect(refreshBtn).toBeDefined();
  });

  it('renders API data when fetch succeeds', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        type: 'directory',
        files: [
          { name: 'src', type: 'directory' },
          { name: 'index.ts', type: 'file' },
        ],
      }),
    });

    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });

    expect(screen.getByText('src')).toBeDefined();
    expect(screen.getByText('index.ts')).toBeDefined();
  });

  it('calls onFileSelect via new-file prompt flow', async () => {
    // Mock window.prompt to return a filename
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('components/Header.tsx');

    await act(async () => {
      render(<FileExplorer onFileSelect={onFileSelect} currentFile="" />);
    });

    const newFileBtn = screen.getByRole('button', { name: /Create new file/i });
    fireEvent.click(newFileBtn);

    expect(promptSpy).toHaveBeenCalled();
    expect(onFileSelect).toHaveBeenCalledWith('components/Header.tsx');

    promptSpy.mockRestore();
  });
});
