import { DashboardStats } from '@/components/DashboardStats'

export default function FoundersDashboard() {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                        F
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Founders Dashboard</h1>
                        <p className="text-white/40">Real-time metrics & system status</p>
                    </div>
                </header>

                <DashboardStats />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-semibold mb-4">Active Experiments</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <span className="text-sm font-mono text-purple-400">AB_TEST_PERSONALITY</span>
                                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">Active</span>
                            </div>
                            <p className="text-xs text-white/40">
                                Testing variant A (Control) vs B (Unhinged routing optimization).
                                Assignments are sticky by session ID.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-semibold mb-4">System Status</h3>
                        <div className="space-y-2 text-sm text-white/60">
                            <div className="flex justify-between">
                                <span>Router</span>
                                <span className="text-green-400">Operational</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Ollama Local</span>
                                <span className="text-green-400">Connected</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Supabase</span>
                                <span className="text-green-400">Connected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
