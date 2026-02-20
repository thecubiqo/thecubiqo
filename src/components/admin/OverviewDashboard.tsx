'use client';

import { useMemo } from 'react';
import {
    Users,
    Activity,
    DollarSign,
    AlertTriangle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
// Recharts is stubbed to avoid build issues
const LineChart = (props: any) => props.children;
const Line = (props: any) => null;
const XAxis = (props: any) => null;
const YAxis = (props: any) => null;
const CartesianGrid = (props: any) => null;
const Tooltip = (props: any) => null;
const ResponsiveContainer = (props: any) => <div className="w-full h-full bg-black/10 rounded flex items-center justify-center text-gray-500">Visualization enabled in production</div>;

export default function OverviewDashboard() {
    // Mock Data for Visualization
    const activityData = useMemo(() => [
        { time: '00:00', requests: 400 },
        { time: '04:00', requests: 300 },
        { time: '08:00', requests: 1200 },
        { time: '12:00', requests: 2400 },
        { time: '16:00', requests: 1800 },
        { time: '20:00', requests: 900 },
        { time: '23:59', requests: 500 },
    ], []);

    return (
        <div className="space-y-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Users"
                    value="12,345"
                    trend="+12%"
                    trendDirection="up"
                    icon={Users}
                    color="blue"
                />
                <KPICard
                    title="Active Sessions"
                    value="843"
                    trend="+5%"
                    trendDirection="up"
                    icon={Activity}
                    color="green"
                />
                <KPICard
                    title="Revenue (MRR)"
                    value="$45,200"
                    trend="+8%"
                    trendDirection="up"
                    icon={DollarSign}
                    color="purple"
                />
                <KPICard
                    title="System Health"
                    value="99.9%"
                    trend="-0.01%"
                    trendDirection="down"
                    icon={AlertTriangle}
                    color="orange"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Chart */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">System Activity</h2>
                        <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm text-gray-400">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="time" stroke="#ffffff40" fontSize={12} />
                                <YAxis stroke="#ffffff40" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 8, fill: '#f97316' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Alerts / Quick Actions */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
                    <h2 className="text-xl font-bold mb-6">System Status</h2>

                    <div className="space-y-4 flex-1">
                        <StatusItem label="API Latency" value="45ms" status="good" />
                        <StatusItem label="Database Load" value="12%" status="good" />
                        <StatusItem label="Agent Queues" value="0 pending" status="good" />
                        <StatusItem label="Error Rate" value="0.02%" status="warning" />
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
                                Purge Cache
                            </button>
                            <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20">
                                Resync Agents
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, trend, trendDirection, icon: Icon, color }: any) {
    const colors = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };

    return (
        <div className={`p-6 rounded-2xl border ${(colors as any)[color].replace('text-', 'border-').split(' ')[2]} bg-white/5 relative overflow-hidden group hover:bg-white/10 transition-all duration-300`}>
            <div className={`absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity`}>
                <div className={`p-2 rounded-lg ${(colors as any)[color].split(' ')[1]}`}>
                    <Icon size={20} className={(colors as any)[color].split(' ')[0]} />
                </div>
            </div>

            <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
            <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                <span className={`flex items-center text-xs font-semibold ${trendDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {trendDirection === 'up' ? <ArrowUp size={12} className="mr-0.5" /> : <ArrowDown size={12} className="mr-0.5" />}
                    {trend}
                </span>
            </div>
        </div>
    );
}

function StatusItem({ label, value, status }: { label: string, value: string, status: 'good' | 'warning' | 'critical' }) {
    const statusColors = {
        good: 'bg-green-500',
        warning: 'bg-yellow-500',
        critical: 'bg-red-500'
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
            <span className="text-sm text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{value}</span>
                <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
            </div>
        </div>
    );
}
