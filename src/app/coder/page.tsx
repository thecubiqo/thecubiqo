'use client';

/**
 * CubiQo Store Builder — /coder
 *
 * Clean entry point. All IDE logic lives in StudioLayout.
 * This page handles browser environment checks and the
 * Suspense loading state.
 */

import React, { useState, useEffect, Suspense } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';

/* ─── Loading fallback ────────────────────────────────────── */
function StudioLoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0f0f11]">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-lg animate-pulse">
          C
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Loading Store Builder</h3>
          <p className="text-sm text-gray-500 mt-1">Initializing editor and AI…</p>
        </div>
        <div className="w-48 mx-auto h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full animate-pulse"
            style={{ width: '60%' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Error state ─────────────────────────────────────────── */
function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0f0f11] text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold">Initialization Error</h1>
        <p className="text-gray-400 text-sm">{message}</p>
        <div className="space-y-2 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reload page
          </button>
          <a
            href="/"
            className="block w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Back to CubiQo
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function CoderPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // localStorage.getItem throws a SecurityError in restricted contexts (e.g. sandboxed iframes)
      window.localStorage.getItem('__cubiqo_check__');
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown initialization error';
      setError(msg);
      console.error('CoderPage initialization error:', err);
    }
  }, []);

  if (error) {
    return <ErrorView message={error} />;
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <Suspense fallback={<StudioLoadingFallback />}>
        <StudioLayout />
      </Suspense>
    </div>
  );
}
