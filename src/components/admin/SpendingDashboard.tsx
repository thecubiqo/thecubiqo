'use client';

import { useState } from 'react';
import { SPENDING_CAPS } from '@/lib/spending-caps';

interface ProviderSpending {
  spent: number;
  cap: number;
  remaining: number;
  percentUsed: number;
}

export function SpendingDashboard() {
  const [spending, setSpending] = useState<Record<string, ProviderSpending>>({
    anthropic: {
      spent: 0,
      cap: SPENDING_CAPS.anthropic,
      remaining: SPENDING_CAPS.anthropic,
      percentUsed: 0,
    },
    elevenlabs: {
      spent: 0,
      cap: SPENDING_CAPS.elevenlabs,
      remaining: SPENDING_CAPS.elevenlabs,
      percentUsed: 0,
    },
  });

  const handleReset = (provider: 'anthropic' | 'elevenlabs') => {
    setSpending((prev) => ({
      ...prev,
      [provider]: {
        spent: 0,
        cap: SPENDING_CAPS[provider],
        remaining: SPENDING_CAPS[provider],
        percentUsed: 0,
      },
    }));
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">💰 Spending Caps</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Anthropic/Claude Card */}
        <div className="border-2 border-blue-500 bg-blue-500/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Anthropic/Claude</h3>
            <button
              onClick={() => handleReset('anthropic')}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Cap:</span>
              <span className="text-white font-semibold">
                ${spending.anthropic.cap.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Current Spend:</span>
              <span className="text-white font-semibold">
                ${spending.anthropic.spent.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Remaining:</span>
              <span className="text-white font-semibold">
                ${spending.anthropic.remaining.toFixed(2)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="pt-2">
              <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${spending.anthropic.percentUsed}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-1 text-center">
                {spending.anthropic.percentUsed.toFixed(1)}% used
              </p>
            </div>
          </div>
        </div>

        {/* ElevenLabs Card */}
        <div className="border-2 border-purple-500 bg-purple-500/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">ElevenLabs TTS</h3>
            <button
              onClick={() => handleReset('elevenlabs')}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Cap:</span>
              <span className="text-white font-semibold">
                ${spending.elevenlabs.cap.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Current Spend:</span>
              <span className="text-white font-semibold">
                ${spending.elevenlabs.spent.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Remaining:</span>
              <span className="text-white font-semibold">
                ${spending.elevenlabs.remaining.toFixed(2)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="pt-2">
              <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${spending.elevenlabs.percentUsed}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-1 text-center">
                {spending.elevenlabs.percentUsed.toFixed(1)}% used
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Estimation Info */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-3">💡 Cost Estimation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-400 font-medium mb-2">Anthropic Claude</p>
            <ul className="space-y-1 text-gray-400">
              <li>• Input tokens: $3 per 1M tokens</li>
              <li>• Output tokens: $15 per 1M tokens</li>
              <li>• Average conversation: ~$0.05-0.15</li>
            </ul>
          </div>
          <div>
            <p className="text-purple-400 font-medium mb-2">ElevenLabs TTS</p>
            <ul className="space-y-1 text-gray-400">
              <li>• Characters: ~$0.30 per 1K characters</li>
              <li>• Average voice response: ~$0.02-0.08</li>
              <li>• High-quality voice synthesis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
