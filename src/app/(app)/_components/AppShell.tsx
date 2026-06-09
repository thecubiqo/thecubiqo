'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bot,
  Brain,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PlugZap,
  Send,
  Settings,
  Sparkles,
  Smartphone,
  User,
  Waypoints,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';
import { apiGet, statusTone } from './client-api';
import { NotificationBell } from '@/next/components/notifications/NotificationBell';
import { RightPanel } from './RightPanel';

type ShellSnapshot = {
  rgy?: { status?: string; score?: number };
  billing?: { isPro?: boolean; status?: string };
};

type NavItem = { href: string; label: string; icon: typeof MessageSquare };

const primaryNav: NavItem[] = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/duo', label: 'DuoMode', icon: Waypoints },
  { href: '/messenger', label: 'Messenger', icon: Send },
  { href: '/chatrooms', label: 'Chatrooms', icon: HeartHandshake },
  { href: '/connectors', label: 'Apps', icon: PlugZap }
];

const accountNav: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/account/memory', label: 'Memory', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/account/surfaces', label: 'Surfaces', icon: Smartphone }
];

const mobileNav: NavItem[] = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/duo', label: 'Duo', icon: Waypoints },
  { href: '/chatrooms', label: 'Rooms', icon: HeartHandshake },
  { href: '/connectors', label: 'Apps', icon: PlugZap },
  { href: '/profile', label: 'Me', icon: User }
];

function NavSection({
  label,
  items,
  pathname,
  onNavigate
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <div className="mb-2 px-3 text-[0.65rem] font-bold tracking-[0.2em] text-slate-500">{label}</div>
      <nav className="space-y-1">
        {items.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? 'bg-slate-100 text-slate-950' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function LeftNavContent({
  pathname,
  email,
  snapshot,
  onSignOut,
  onNavigate
}: {
  pathname: string;
  email: string;
  snapshot: ShellSnapshot;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        href="/chat"
        onClick={onNavigate}
        className="mb-5 flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/15 text-cyan-200">
          <Bot className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold">CubiQo</span>
          <span className="block text-xs text-slate-400">your AI that does</span>
        </span>
      </Link>

      <div className="space-y-5">
        <NavSection label="NAVIGATION" items={primaryNav} pathname={pathname} onNavigate={onNavigate} />
        <NavSection label="ACCOUNT" items={accountNav} pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div className="mt-auto space-y-3 pt-5 text-xs text-slate-400">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${statusTone(snapshot.rgy?.status)}`}>
          <Sparkles className="h-3 w-3" />
          <span>
            RGY {snapshot.rgy?.status || '—'}
            {snapshot.rgy?.score != null ? ` · ${snapshot.rgy.score}` : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full rounded-lg border border-slate-800 px-3 py-2 text-left text-slate-300 hover:bg-slate-900"
        >
          {email ? `Sign out · ${email.split('@')[0]}` : 'Sign out'}
        </button>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<ShellSnapshot>({});
  const [email, setEmail] = useState<string>('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase?.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email || '');
    });

    let active = true;
    Promise.allSettled([
      apiGet<ShellSnapshot['rgy']>('/api/rgy/status'),
      apiGet<ShellSnapshot['billing']>('/api/billing/status')
    ]).then(results => {
      if (!active) return;
      setSnapshot({
        rgy: results[0].status === 'fulfilled' ? results[0].value : undefined,
        billing: results[1].status === 'fulfilled' ? results[1].value : undefined
      });
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const pageLabel = useMemo(() => {
    const all = [...primaryNav, ...accountNav];
    const match = all.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return match?.label || 'CubiQo';
  }, [pathname]);

  async function signOut() {
    const supabase = getBrowserSupabase();
    await supabase?.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="h-screen bg-neutral-950 text-slate-100">
      <div className="flex h-full overflow-hidden">
        {/* Desktop left nav (240px) */}
        <aside className="hidden w-60 shrink-0 border-r border-slate-800 bg-neutral-950/95 p-4 md:flex md:flex-col">
          <LeftNavContent pathname={pathname} email={email} snapshot={snapshot} onSignOut={signOut} />
        </aside>

        {/* Mobile slide-over left nav */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-y-auto border-r border-slate-800 bg-neutral-950 p-4">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="mb-3 self-end rounded-md border border-slate-800 p-1 text-slate-400 hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
              <LeftNavContent
                pathname={pathname}
                email={email}
                snapshot={snapshot}
                onSignOut={signOut}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Centre column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 bg-neutral-950/95 px-3 md:px-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-md border border-slate-800 p-2 text-slate-300 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">CubiQo</div>
              <h1 className="truncate text-base font-semibold">{pageLabel}</h1>
            </div>
            <Link
              href="/duo"
              className={`hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-xs sm:flex ${statusTone(
                snapshot.billing?.isPro ? 'active' : snapshot.billing?.status
              )}`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {snapshot.billing?.isPro ? 'Pro' : 'Free'}
            </Link>
            <NotificationBell />
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto bg-slate-950">{children}</main>

          {/* Mobile bottom nav */}
          <nav className="grid h-16 shrink-0 grid-cols-5 border-t border-slate-800 bg-neutral-950 md:hidden">
            {mobileNav.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`grid place-items-center text-[0.65rem] ${active ? 'text-cyan-200' : 'text-slate-500'}`}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right panel (320px) — hide on duo project dashboard (which has its own artifact pane) */}
        {!pathname.startsWith('/duo/') && <RightPanel />}
      </div>
    </div>
  );
}
