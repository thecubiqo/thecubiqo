'use client';

import { Cable, CheckCircle2 } from 'lucide-react';

const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/cubiqo/YOUR_EXTENSION_ID';

interface Props {
  status: 'checking' | 'active' | 'inactive';
}

export function ExtensionStatus({ status }: Props) {
  if (status === 'checking') return null;

  if (status === 'active') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        CubiQo Extension active. Browser execution channel is available.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <div className="flex items-center gap-2">
        <Cable className="h-4 w-4" />
        Install the extension to unlock browser-based apps.
      </div>
      <a
        href={CHROME_EXTENSION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md bg-amber-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-600"
      >
        Install
      </a>
    </div>
  );
}
