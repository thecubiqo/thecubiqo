import Link from 'next/link';
import { Bot, Waypoints, MessageSquare, PlugZap, ArrowRight, Sparkles } from 'lucide-react';
import ParticleWaveBg from '../components/ParticleWaveBg';

export default function HeroPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#050510] text-slate-100">
      {/* Particle wave background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParticleWaveBg />
      </div>
      {/* Nav */}
      <header className="relative z-10 flex h-14 items-center justify-between border-b border-slate-800/60 px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/15 text-cyan-300">
            <Bot className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">CubiQo</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-slate-800 px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-900"
          >
            Sign in
          </Link>
          <Link
            href="/chat"
            className="rounded-lg bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
          >
            Try free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative max-w-3xl">
          {/* Capsule pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/8 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-medium tracking-wide text-cyan-300">RGY · Green · Collaborate</span>
          </div>

          <h1 className="mb-5 text-5xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Your AI that{' '}
            <span className="text-cyan-300">does.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-slate-400">
            Give CubiQo a goal. It plans, routes across your tools, and runs — while you stay in the loop.
            Green for building, yellow for exploring, red for urgent. No code required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-cyan-200"
            >
              <Sparkles className="h-4 w-4" />
              Start for free
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 text-base text-slate-300 hover:border-slate-600 hover:bg-slate-900"
            >
              <Waypoints className="h-4 w-4" />
              See DuoMode
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feature row */}
        <div className="relative mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: <MessageSquare className="h-5 w-5" />,
              color: 'text-cyan-300',
              ring: 'border-cyan-400/20 bg-cyan-500/8',
              title: 'Chat that acts',
              body: 'Talk to CubiQo like a colleague. It classifies your intent, picks the right tools, and executes.',
            },
            {
              icon: <Waypoints className="h-5 w-5" />,
              color: 'text-emerald-300',
              ring: 'border-emerald-400/20 bg-emerald-500/8',
              title: 'Capsule dashboard',
              body: 'Every goal becomes a live capsule — task graph, artifact pane, real-time cost meter.',
            },
            {
              icon: <PlugZap className="h-5 w-5" />,
              color: 'text-amber-300',
              ring: 'border-amber-400/20 bg-amber-500/8',
              title: 'Your tools, wired in',
              body: 'Shopify, Notion, Google, Twilio and more. CubiQo routes tasks to the right surface automatically.',
            },
          ].map(f => (
            <div
              key={f.title}
              className={`rounded-2xl border ${f.ring} p-5 text-left backdrop-blur-sm`}
            >
              <span className={`mb-3 block ${f.color}`}>{f.icon}</span>
              <h3 className="mb-1.5 text-sm font-semibold text-slate-100">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>

        {/* RGY capsule strip */}
        <div className="relative mt-12 flex flex-wrap justify-center gap-3">
          {[
            { color: 'bg-emerald-400', ring: 'border-emerald-400/30 bg-emerald-400/5', text: 'text-emerald-100', chip: 'bg-emerald-400/15 text-emerald-200', keyword: 'growth · q3-pipeline', intent: 'Collaborate' },
            { color: 'bg-amber-400', ring: 'border-amber-400/30 bg-amber-400/5', text: 'text-amber-100', chip: 'bg-amber-400/15 text-amber-200', keyword: 'pricing · research', intent: 'Trade' },
            { color: 'bg-rose-400', ring: 'border-rose-400/30 bg-rose-400/5', text: 'text-rose-100', chip: 'bg-rose-400/15 text-rose-200', keyword: 'urgent · launch', intent: 'Socialize' },
          ].map(c => (
            <div key={c.keyword} className={`flex items-center gap-2 rounded-full border ${c.ring} px-3 py-1.5`}>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.color}`} />
              <span className={`text-sm font-medium ${c.text}`}>{c.keyword}</span>
              <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider ${c.chip}`}>{c.intent}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-600">No credit card · works anonymously · sign up to save</p>
      </main>

      <footer className="relative z-10 border-t border-slate-800/60 py-5 text-center text-xs text-slate-600">
        © 2026 CubiQo · <Link href="/login" className="hover:text-slate-400">Sign in</Link> · <Link href="/chat" className="hover:text-slate-400">Open app</Link>
      </footer>
    </div>
  );
}
