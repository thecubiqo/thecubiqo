import { createClient } from '@/lib/supabase/server'
import { DatabaseWithAbTesting } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/AppLayout'

export const dynamic = 'force-dynamic'

async function getExperiments() {
    const supabase = await createClient()
    const db = supabase as unknown as SupabaseClient<DatabaseWithAbTesting>

    const { data: experiments } = await db
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false })

    if (!experiments) return []

    // For each experiment, get stats
    const experimentsWithStats = await Promise.all(experiments.map(async (exp) => {
        // get user counts per variant
        const { data: assignments } = await db
            .from('experiment_assignments')
            .select('variant')
            .eq('experiment_id', exp.id)

        // get event counts/values per variant
        const { data: events } = await db
            .from('experiment_events')
            .select('variant, value, event_name')
            .eq('experiment_id', exp.id)

        const stats = (exp.variants as string[]).map(variant => {
            const variantAssignments = assignments?.filter(a => a.variant === variant).length || 0
            const variantEvents = events?.filter(e => e.variant === variant) || []
            const totalValue = variantEvents.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

            return {
                variant,
                users: variantAssignments,
                conversions: variantEvents.length,
                value: totalValue,
                conversionRate: variantAssignments > 0 ? (variantEvents.length / variantAssignments * 100).toFixed(1) : '0.0'
            }
        })

        return { ...exp, stats }
    }))

    return experimentsWithStats
}

export default async function ExperimentsPage() {
    const experiments = await getExperiments()

    return (
        <AppLayout>
            <div className="min-h-screen text-white p-4 md:p-8 bg-black/40 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    {/* Premium Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-2xl">🧪</span>
                                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                                    Neuro-Experiments
                                </h1>
                            </div>
                            <p className="text-gray-400 font-medium">
                                Analyze intent-driven variations and conversion flows.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <a
                                href="/admin"
                                className="px-6 py-2.5 bg-gray-900 border border-gray-800 text-gray-400 rounded-xl hover:text-white hover:border-gray-600 transition-all font-semibold"
                            >
                                ← System Dashboard
                            </a>
                            <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all">
                                + Create Multi-Variant
                            </button>
                        </div>
                    </header>

                    <div className="grid gap-10">
                        {experiments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl">
                                <span className="text-6xl mb-4">🔍</span>
                                <p className="text-gray-500 text-xl font-medium">No experiments active in this cluster.</p>
                                <p className="text-gray-600 mt-2">Seed a test via Supabase or CLI to begin.</p>
                            </div>
                        ) : (
                            experiments.map(exp => (
                                <section
                                    key={exp.id}
                                    className="relative group bg-gray-900/50 rounded-[2rem] border border-gray-800 p-8 transition-all hover:bg-gray-900/80 overflow-hidden"
                                >
                                    {/* Animated Background Glow */}
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all" />

                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-bold text-white tracking-tight">{exp.name}</h2>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${exp.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                    'bg-gray-800 text-gray-500 border border-gray-700'
                                                    }`}>
                                                    {exp.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">{exp.description || 'Continuous optimization flow for user engagement.'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] uppercase text-gray-500 tracking-widest font-bold">Launch Cluster</span>
                                            <span className="font-mono text-gray-300 bg-black/40 px-3 py-1 rounded-lg border border-gray-800">
                                                {new Date(exp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 relative z-10">
                                        {exp.stats.map((stat, idx) => (
                                            <div
                                                key={stat.variant}
                                                className={`p-6 rounded-2xl border ${idx === 0 ? 'bg-white/5 border-white/10' : 'bg-gray-900/60 border-gray-700/30'
                                                    } relative overflow-hidden group/card`}
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                                            Variant {stat.variant}
                                                        </h3>
                                                        <div className="text-2xl font-bold text-white">{stat.conversionRate}%</div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${idx === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                                        }`}>
                                                        {idx === 0 ? 'CONTROL' : 'CHALLENGER'}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs text-gray-500 font-medium">Assignments</span>
                                                        <span className="text-lg font-bold text-gray-200">{stat.users}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${idx === 0 ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500'}`}
                                                            style={{ width: `${stat.conversionRate}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Asset Management Trigger - FOR "B" CHALLENGER ONLY */}
                                                {idx > 0 && (
                                                    <div className="mt-8 pt-6 border-t border-gray-800">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">GIF Asset Layer</span>
                                                            <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 rounded">PENDING</span>
                                                        </div>
                                                        <button
                                                            className="w-full py-4 bg-gray-950 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 transition-all flex flex-col items-center justify-center gap-2 group/upload"
                                                        >
                                                            <span className="text-xl group-hover/upload:scale-125 transition-transform">🖼️</span>
                                                            <span className="text-[10px] uppercase font-bold tracking-widest">Drop GIF to Apply Variant B Design</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Integrated Flow Graph (Mockup for Visual) */}
                                    <div className="p-4 bg-black/30 rounded-2xl border border-gray-800/60 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest px-4">
                                            <span>Pulse Trace</span>
                                            <div className="flex gap-1">
                                                {[...Array(20)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1 bg-purple-500/40 rounded-full"
                                                        style={{ height: `${Math.random() * 20 + 5}px` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-black text-purple-400 tracking-widest hover:text-purple-300 transition-colors mr-4">
                                            EXPORT RAW TELEMETRY →
                                        </button>
                                    </div>
                                </section>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
