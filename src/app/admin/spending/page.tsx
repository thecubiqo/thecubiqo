'use client';

import { AppLayout } from '@/components/AppLayout';
import { SpendingDashboard } from '@/components/admin/SpendingDashboard';

export default function AdminSpendingPage() {
  return (
    <AppLayout>
      <div className="min-h-screen text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">API Spending</h1>
            <p className="text-gray-400">
              Monitor and manage API spending caps for Anthropic and ElevenLabs
            </p>
          </div>

          <SpendingDashboard />
        </div>
      </div>
    </AppLayout>
  );
}
