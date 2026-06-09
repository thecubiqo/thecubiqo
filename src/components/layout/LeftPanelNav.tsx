'use client';

import { Brain, MessageSquare, PlugZap, Settings } from 'lucide-react';
import { useState } from 'react';
import { ConnectorHub } from '@/next/components/connectors/ConnectorHub';

type PanelView = 'chat' | 'connectors' | 'memory' | 'settings';

export function LeftPanelNav({ chat }: { chat?: React.ReactNode }) {
  const [view, setView] = useState<PanelView>('chat');
  const navItems = [
    { view: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { view: 'connectors' as const, icon: PlugZap, label: 'Apps' },
    { view: 'memory' as const, icon: Brain, label: 'Memory' },
    { view: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-full min-h-0">
      <nav className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-slate-800 bg-neutral-950 py-3">
        <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-cyan-400 text-sm font-bold text-slate-950">C</div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              title={item.label}
              className={`grid h-8 w-8 place-items-center rounded-lg ${view === item.view ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </nav>
      <div className="min-w-0 flex-1 overflow-hidden p-3">
        {view === 'chat' && (chat || <div className="text-sm text-slate-400">Chat panel</div>)}
        {view === 'connectors' && <ConnectorHub />}
        {view === 'memory' && <div className="text-sm text-slate-400">Memory panel</div>}
        {view === 'settings' && <div className="text-sm text-slate-400">Settings panel</div>}
      </div>
    </div>
  );
}
