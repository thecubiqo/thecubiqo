'use client';

import { useState, useRef, useEffect } from 'react';
import { Zap, ChevronRight, FileCode2, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

// ─── Starter Templates ──────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'volbak',
    name: 'Volbak-Style Brand Site',
    icon: '🌑',
    description: 'Full-screen cinematic hero, bold typography, dark luxury aesthetic',
    prompt: `Build me a premium Next.js brand website inspired by Volbak.com design language.

Requirements:
- Full-screen hero section with massive bold headline text, dark near-black background (#0a0a0a)
- Cinematic product video/image area with overlay text
- Navigation: minimal, fixed top, logo left + 3 links right
- Products section: 2-3 cards with hover zoom effect
- Footer: minimal, dark
- Typography: very large (text-7xl to text-9xl for hero), font-black, tracking ultra-tight
- Animation: subtle fade-in on scroll, smooth transitions
- Color palette: near-black bg, white text, no bright colors
- Tailwind CSS + framer-motion for animations
- Mobile responsive

Files to create:
- app/page.tsx (main page with all sections)
- app/layout.tsx (metadata, font imports)  
- app/globals.css (font-face, base styles, custom scrollbar)
- components/Hero.tsx (full-screen hero component)
- components/Nav.tsx (minimal sticky nav)
- components/ProductCard.tsx (product card with hover effects)`,
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    icon: '📊',
    description: 'Dark glassmorphism dashboard with charts and metrics',
    prompt: `Build a premium analytics dashboard in Next.js.

Dark glassmorphism design. Include:
- Sidebar navigation with icons
- KPI cards (revenue, users, conversion, growth) with trend indicators
- Line chart area (use recharts or simple SVG)
- Recent activity feed
- Top performing items table

Files: app/page.tsx, app/layout.tsx, app/globals.css, components/Sidebar.tsx, components/KPICard.tsx, components/ActivityFeed.tsx`,
  },
  {
    id: 'saas',
    name: 'SaaS Landing Page',
    icon: '🚀',
    description: 'Modern SaaS with hero, features, pricing, CTA',
    prompt: `Build a high-converting SaaS landing page in Next.js.

Include: hero with headline + CTA, features grid (6 features), pricing table (3 tiers), FAQ, footer.
Dark mode. Premium feel. Gradient accents on orange/purple.

Files: app/page.tsx, app/layout.tsx, app/globals.css, components/Hero.tsx, components/Features.tsx, components/Pricing.tsx`,
  },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  filesWritten?: { path: string; preview: string }[];
  isLoading?: boolean;
  error?: boolean;
}

interface ConversationPanelProps {
  onCodeGenerated?: (code: string, language: string) => void;
  onFilesWritten?: () => void;
  workspaceId?: string;
}

// ─── Quick prompts ───────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Build a Volbak.com inspired brand site',
  'Create a dark SaaS landing page',
  'Make a full e-commerce product page',
  'Build a portfolio site with animations',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConversationPanel({
  onCodeGenerated,
  onFilesWritten,
  workspaceId = 'studio-default',
}: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowTemplates(false);
    setIsLoading(true);

    // Add loading placeholder
    const loadingId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', isLoading: true }]);

    try {
      const history = messages
        .filter(m => !m.isLoading)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/emergent/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          workspaceId,
          history,
          context: 'studio-builder',
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Agent failed');

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        filesWritten: data.files_written || [],
      };

      setMessages(prev => [...prev.filter(m => !m.isLoading), assistantMessage]);

      // Notify parent about written files so it refreshes the file tree
      if (data.files_written?.length > 0) {
        onFilesWritten?.();

        // Extract first code block for editor
        if (onCodeGenerated) {
          const match = data.reply.match(/```(?:tsx?|jsx?|css)?\n(?:\/\/ [^\n]+\n)?([\s\S]*?)```/);
          if (match) {
            onCodeGenerated(match[1].trim(), 'typescript');
          }
        }
      }

    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Unknown error from agent.',
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const loadTemplate = (template: typeof TEMPLATES[0]) => {
    setInput(template.prompt);
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-black/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03] backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
              EMERGENT <span className="text-white/20">AI</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(v => !v)}
              className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all border border-white/10"
            >
              Templates
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setShowTemplates(true); }}
                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/30 hover:text-red-400 transition-all border border-white/10"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest font-bold">
          Describe what to build → agent writes real files
        </p>
      </div>

      {/* Messages / Templates */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {showTemplates && messages.length === 0 ? (
          /* Templates Panel */
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 px-1">
              Starter Templates
            </p>
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => loadTemplate(t)}
                className="w-full text-left p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-500/30 transition-all group"
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-xs font-black text-white/70 group-hover:text-white transition-colors uppercase tracking-wide">{t.name}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-cyan-400 ml-auto transition-colors" />
                </div>
                <p className="text-[10px] text-white/30 pl-8">{t.description}</p>
              </button>
            ))}

            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 px-1 pt-2">
              Quick Start
            </p>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="w-full text-left px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all text-[11px] text-white/30 hover:text-white/60 flex items-center gap-2"
              >
                <Sparkles className="w-3 h-3 shrink-0 text-cyan-500/40" />
                {p}
              </button>
            ))}
          </div>
        ) : (
          /* Conversation */
          <div className="p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[90%] px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-white/80 font-medium leading-relaxed">
                    {msg.content}
                  </div>
                ) : msg.isLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 animate-pulse">
                      Agent building…
                    </span>
                  </div>
                ) : (
                  <div className={`w-full space-y-2`}>
                    {/* Agent reply — render code blocks cleanly */}
                    <div className={`text-[11px] leading-relaxed text-white/60 whitespace-pre-wrap break-words px-1 ${msg.error ? 'text-red-400' : ''}`}>
                      {renderMessageContent(msg.content)}
                    </div>

                    {/* Files written indicator */}
                    {msg.filesWritten && msg.filesWritten.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-lg bg-green-500/5 border border-green-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-green-400">
                            {msg.filesWritten.length} file{msg.filesWritten.length > 1 ? 's' : ''} written
                          </span>
                        </div>
                        {msg.filesWritten.map(f => (
                          <div key={f.path} className="flex items-center gap-1.5">
                            <FileCode2 className="w-2.5 h-2.5 text-green-400/60 shrink-0" />
                            <span className="text-[10px] text-green-400/70 font-mono truncate">{f.path}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.error && (
                      <div className="flex items-center gap-1.5 text-red-400/60">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[9px] uppercase tracking-widest font-bold">Agent error</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-black/30 backdrop-blur-md shrink-0">
        <div className="relative group rounded-xl overflow-hidden border border-white/10 focus-within:border-cyan-500/30 transition-colors">
          <div className="absolute inset-0 bg-white/[0.02] group-focus-within:bg-cyan-500/5 transition-colors pointer-events-none" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Agent is building…' : 'Describe what to build… (Enter to send, Shift+Enter for new line)'}
            disabled={isLoading}
            rows={3}
            className="relative w-full bg-transparent text-xs text-white/70 placeholder-white/15 outline-none resize-none px-3 py-2.5 font-mono leading-relaxed disabled:opacity-40"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : input.trim() ? (
              <button
                onClick={() => sendMessage(input)}
                className="p-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
              </button>
            ) : null}
          </div>
        </div>
        <p className="text-[9px] text-white/15 mt-1.5 text-center uppercase tracking-widest font-bold">
          Agent writes files directly to your workspace
        </p>
      </div>
    </div>
  );
}

// ─── Render message with code block formatting ────────────────────────────

function renderMessageContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const lang = lines[0];
      // Check if second line is a filename comment
      const isFilename = lines[1]?.match(/^(?:\/\/ |# )(.+\.[a-z]+)/);
      const displayName = isFilename ? isFilename[1] : lang;
      const code = (isFilename ? lines.slice(2) : lines.slice(1)).join('\n');

      return (
        <div key={i} className="my-2 rounded-lg overflow-hidden border border-white/10">
          <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 flex items-center gap-1.5">
            <FileCode2 className="w-3 h-3 text-cyan-400/60" />
            <span className="text-[10px] font-mono text-white/40">{displayName}</span>
          </div>
          <pre className="text-[10px] font-mono text-cyan-200/50 p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
            {code}
          </pre>
        </div>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
