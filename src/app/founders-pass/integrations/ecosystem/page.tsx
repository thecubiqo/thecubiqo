// SaaS & Business Integration Ecosystem
'use client';

import { useState, useMemo } from 'react';
import { SAAS_INTEGRATIONS } from '@/data/saas-integrations';

export default function EcosystemPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter integrations based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return SAAS_INTEGRATIONS;
    }

    const query = searchQuery.toLowerCase();
    return SAAS_INTEGRATIONS.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.subcategory?.toLowerCase().includes(query) ||
          category.label.toLowerCase().includes(query)
      ),
    })).filter((category) => category.items.length > 0);
  }, [searchQuery]);

  const totalIntegrations = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  }, [filteredCategories]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">SaaS & Business Integration Ecosystem</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Comprehensive overview of supported integrations across {SAAS_INTEGRATIONS.length} categories.
        </p>

        {/* Search/Filter Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations..."
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {totalIntegrations} integration{totalIntegrations !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">No integrations found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h2 className="font-semibold text-lg">{category.label}</h2>
                    <p className="text-xs text-zinc-500">
                      {category.items.length} integration{category.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Integration Items */}
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div
                      key={`${category.id}-${item.name}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-sm text-zinc-200">{item.name}</span>
                      {item.subcategory && (
                        <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded text-xs font-medium whitespace-nowrap">
                          {item.subcategory}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
