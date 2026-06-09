'use client';

import type { Connector } from '@/next/types/connectors';

interface Props {
  connector: Connector;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TosRiskModal({ connector, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-4 shadow-xl">
        <h2 className="text-sm font-semibold">Terms Notice</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Connecting {connector.displayName} uses an unofficial integration. CubiQo will keep actions reviewable and you can disconnect it any time.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          <li>No credentials are stored by the extension connector.</li>
          <li>Writes still require explicit approval gates.</li>
          <li>Some platforms may restrict unofficial automation.</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600">
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
