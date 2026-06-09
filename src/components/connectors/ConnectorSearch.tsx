'use client';

import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ConnectorSearch({ value, onChange }: Props) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search apps"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border bg-background py-2 pl-8 pr-3 text-xs outline-none ring-primary/20 transition focus:ring-2"
      />
    </label>
  );
}
