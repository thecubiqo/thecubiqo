'use client';

import React from 'react';
import type { CommandType } from '@/lib/verbal-commands/types';

interface Service {
  id: CommandType;
  icon: string;
  name: string;
  description: string;
  connected: boolean;
}

const services: Service[] = [
  {
    id: 'email',
    icon: '📧',
    name: 'Gmail',
    description: 'Send, read, and search emails',
    connected: false,
  },
  {
    id: 'twitter',
    icon: '🐦',
    name: 'Twitter',
    description: 'Post tweets and check your timeline',
    connected: false,
  },
  {
    id: 'maps',
    icon: '🗺️',
    name: 'Maps',
    description: 'Find locations, directions, and nearby places',
    connected: false,
  },
  {
    id: 'uber',
    icon: '🚗',
    name: 'Uber',
    description: 'Request rides and check driver status',
    connected: false,
  },
  {
    id: 'whatsapp',
    icon: '💬',
    name: 'WhatsApp',
    description: 'Send messages to your contacts',
    connected: false,
  },
];

export function VerbalCommandsPanel() {
  const handleConnect = (serviceId: CommandType) => {
    // Placeholder for future OAuth flow
    console.log(`Connect to ${serviceId}`);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-white mb-2">
        🗣️ Verbal Commands
      </h3>
      <p className="text-white/50 text-sm mb-6">
        Natural language commands for external services
      </p>

      {/* Services List */}
      <div className="space-y-0">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
          >
            {/* Service Info */}
            <div className="flex items-center flex-1">
              <span className="text-2xl mr-3">{service.icon}</span>
              <div className="flex-1">
                <div className="text-white font-medium">{service.name}</div>
                <div className="text-white/50 text-sm">{service.description}</div>
              </div>
            </div>

            {/* Status & Action */}
            <div className="flex items-center gap-3">
              <span
                className={
                  service.connected
                    ? 'px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs'
                    : 'px-2 py-1 bg-white/5 text-white/40 rounded text-xs'
                }
              >
                {service.connected ? 'Connected' : 'Not Connected'}
              </span>
              {!service.connected && (
                <button
                  onClick={() => handleConnect(service.id)}
                  className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Description */}
      <p className="text-white/40 text-sm mt-4">
        Use natural language to control these services through CubiQo. Say things like
        &quot;Send an email to...&quot; or &quot;Find coffee shops near me&quot;.
      </p>
    </div>
  );
}
