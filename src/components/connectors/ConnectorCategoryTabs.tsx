'use client';

import type { Connector, ConnectorCategory } from '@/next/types/connectors';

const TABS: Array<{ value: ConnectorCategory; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'connected', label: 'Connected' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'banking', label: 'Banking' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'career', label: 'Career' },
  { value: 'ecommerce', label: 'Commerce' },
  { value: 'social', label: 'Social' },
  { value: 'dating', label: 'Dating' },
  { value: 'health', label: 'Health' },
  { value: 'food', label: 'Food' },
  { value: 'property', label: 'Property' },
  { value: 'government', label: 'Gov' },
  { value: 'entertainment', label: 'Media' },
  { value: 'transfers', label: 'Transfers' },
];

interface Props {
  selected: ConnectorCategory;
  onChange: (category: ConnectorCategory) => void;
  connectors: Connector[];
}

export function ConnectorCategoryTabs({ selected, onChange, connectors }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {TABS.map(tab => {
        const count = tab.value === 'all'
          ? connectors.length
          : tab.value === 'connected'
            ? connectors.filter(connector => connector.connected).length
            : connectors.filter(connector => connector.category === tab.value).length;
        if (tab.value !== 'all' && tab.value !== 'connected' && count === 0) return null;
        const isActive = selected === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[10px] transition ${
              isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
