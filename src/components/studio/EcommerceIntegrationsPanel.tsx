'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────── */
type IntegrationStatus = 'configured' | 'not-configured';
type IntegrationCategory = 'store' | 'fulfillment' | 'payment' | 'analytics' | 'deploy';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  docsUrl: string;
  envVars: string[];
  status: IntegrationStatus;
  category: IntegrationCategory;
}

/* ─── Integration Definitions ────────────────────────────── */
const INTEGRATIONS: Integration[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Power your storefront with Shopify — products, inventory, checkout.',
    icon: '🛍️',
    docsUrl: 'https://shopify.dev/docs/api/storefront',
    envVars: ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_STOREFRONT_TOKEN', 'SHOPIFY_ADMIN_API_KEY'],
    status: 'not-configured',
    category: 'store',
  },
  {
    id: 'printify',
    name: 'Printify',
    description: 'On-demand print fulfillment — T-shirts, hoodies, accessories and more.',
    icon: '🖨️',
    docsUrl: 'https://developers.printify.com',
    envVars: ['PRINTIFY_API_KEY', 'PRINTIFY_SHOP_ID'],
    status: 'not-configured',
    category: 'fulfillment',
  },
  {
    id: 'printful',
    name: 'Printful',
    description: 'Drop shipping and fulfillment with global warehouses and custom branding.',
    icon: '📦',
    docsUrl: 'https://developers.printful.com',
    envVars: ['PRINTFUL_API_KEY'],
    status: 'not-configured',
    category: 'fulfillment',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments worldwide — cards, wallets, and subscriptions.',
    icon: '💳',
    docsUrl: 'https://stripe.com/docs/api',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    status: 'not-configured',
    category: 'payment',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy your store instantly to the global edge network.',
    icon: '▲',
    docsUrl: 'https://vercel.com/docs/rest-api',
    envVars: ['VERCEL_TOKEN', 'VERCEL_ORG_ID'],
    status: 'not-configured',
    category: 'deploy',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track visitors, conversions, and revenue with GA4.',
    icon: '📊',
    docsUrl: 'https://developers.google.com/analytics',
    envVars: ['NEXT_PUBLIC_GA_ID'],
    status: 'not-configured',
    category: 'analytics',
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Email and SMS marketing automation for e-commerce brands.',
    icon: '✉️',
    docsUrl: 'https://developers.klaviyo.com',
    envVars: ['KLAVIYO_API_KEY'],
    status: 'not-configured',
    category: 'analytics',
  },
];

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  store: 'Store',
  fulfillment: 'Fulfillment',
  payment: 'Payment',
  analytics: 'Analytics',
  deploy: 'Deploy',
};

const CATEGORY_COLORS: Record<IntegrationCategory, string> = {
  store: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  fulfillment: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  payment: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  analytics: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  deploy: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

type CategoryFilter = IntegrationCategory | 'all';

/* ─── Component ──────────────────────────────────────────── */
export default function EcommerceIntegrationsPanel() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = activeCategory === 'all'
    ? INTEGRATIONS
    : INTEGRATIONS.filter(i => i.category === activeCategory);

  const categories: CategoryFilter[] = ['all', 'store', 'fulfillment', 'payment', 'analytics', 'deploy'];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f11] text-white">
      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Getting Started */}
        <section>
          <h2 className="text-sm font-semibold text-white mb-4">Getting Started</h2>
          <ol className="space-y-3" role="list">
            {[
              { n: '01', label: 'Pick a template', desc: 'Use the AI Builder tab to generate a Volbak-style store with Stripe + Printify.' },
              { n: '02', label: 'Configure integrations', desc: 'Add the required environment variables for each service below.' },
              { n: '03', label: 'Deploy to Vercel', desc: 'Click Deploy in the top-right to push your store to production.' },
            ].map(step => (
              <li key={step.n} className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-gray-800">
                <span className="text-2xl font-black text-indigo-500/40 leading-none shrink-0 w-8">{step.n}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Integrations */}
        <section>
          <h2 className="text-sm font-semibold text-white mb-4">Integrations</h2>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by category">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'bg-white/[0.04] border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Cards */}
          <ul className="grid grid-cols-1 gap-3" role="list">
            {filtered.map(integration => {
              const isExpanded = expandedIds.has(integration.id);
              const isConfigured = integration.status === 'configured';

              return (
                <li
                  key={integration.id}
                  className="rounded-xl border border-gray-800 bg-white/[0.02] overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 p-4">
                    <span className="text-xl shrink-0">{integration.icon}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{integration.name}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[integration.category]}`}>
                          {CATEGORY_LABELS[integration.category]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{integration.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status badge */}
                      {isConfigured ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 size={12} />
                          Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400">
                          <AlertCircle size={12} />
                          Setup required
                        </span>
                      )}

                      {/* Expand toggle */}
                      <button
                        onClick={() => toggleExpand(integration.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${integration.name} details`}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2">Required environment variables</p>
                        <div className="space-y-1.5">
                          {integration.envVars.map(envVar => (
                            <code
                              key={envVar}
                              className="block text-xs font-mono bg-black/40 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-lg"
                            >
                              {envVar}
                            </code>
                          ))}
                        </div>
                      </div>

                      <a
                        href={integration.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLink size={12} />
                        View documentation
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
