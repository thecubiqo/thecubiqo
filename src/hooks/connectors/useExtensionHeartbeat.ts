'use client';

import { useEffect, useState } from 'react';

type ExtensionStatus = 'checking' | 'active' | 'inactive';

export function useExtensionHeartbeat() {
  const [status, setStatus] = useState<ExtensionStatus>('checking');

  useEffect(() => {
    const check = () => {
      const attr = document.documentElement.getAttribute('data-cubiqo-ext');
      setStatus(attr === 'active' ? 'active' : 'inactive');
    };

    const timeout = window.setTimeout(check, 800);
    check();
    return () => window.clearTimeout(timeout);
  }, []);

  return { status };
}
