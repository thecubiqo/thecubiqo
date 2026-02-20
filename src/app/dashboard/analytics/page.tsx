import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | CubiQo',
  description: 'View analytics and insights for your deployed applications',
};

export default function AnalyticsDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Monitor your application's performance and user engagement</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Visitors"
            value="0"
            change="+0%"
            trend="up"
          />
          <MetricCard
            title="Page Views"
            value="0"
            change="+0%"
            trend="up"
          />
          <MetricCard
            title="Bounce Rate"
            value="0%"
            change="-0%"
            trend="down"
          />
          <MetricCard
            title="Avg Session"
            value="0s"
            change="+0%"
            trend="up"
          />
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Traffic Trends</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p>Chart coming soon</p>
                <p className="text-sm mt-2">PostHog integration pending</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🥧</div>
                <p>Chart coming soon</p>
                <p className="text-sm mt-2">Data collection pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
          <div className="text-center text-gray-500 py-8">
            <p>No data available yet</p>
            <p className="text-sm mt-2">Deploy your first app to see analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold">{value}</div>
        <div className={`text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </div>
      </div>
    </div>
  );
}
