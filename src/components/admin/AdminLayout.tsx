'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Activity,
    Users,
    Flag,
    LineChart,
    Settings,
    Terminal,
    LogOut,
    Mail,
    Shield,
    Globe,
    CalendarClock,
    BookOpen,
    HeartPulse,
    Wrench,
    Compass
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Network Ops', href: '/admin/noc', icon: Activity },
    { name: 'System Health', href: '/admin/health', icon: HeartPulse },
    { name: 'Events', href: '/admin/events', icon: CalendarClock },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Feature Flags', href: '/admin/feature-flags', icon: Flag },
    { name: 'Journey', href: '/admin/journey', icon: Compass },
    { name: 'Journal', href: '/admin/journal', icon: BookOpen },
    { name: 'Self-Heal', href: '/admin/self-heal', icon: Wrench },
    { name: 'Analytics', href: '/admin/analytics', icon: LineChart },
    { name: 'Security', href: '/admin/security', icon: Shield },
    { name: 'Social Army', href: '/admin/social-army', icon: Globe },
    { name: 'Emails', href: '/admin/email-preview', icon: Mail },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen bg-gray-950 text-white flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col fixed h-full z-10 shrink-0">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <Terminal size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">CubiQo Admin</h1>
                            <p className="text-xs text-white/40 uppercase tracking-widest">Control Room</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive
                                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} className={isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-white transition-colors'} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto w-full">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
