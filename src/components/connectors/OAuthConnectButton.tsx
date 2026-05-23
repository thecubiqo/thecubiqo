'use client';

interface Props {
  platform: string;
  loading?: boolean;
  onConnect: (platform: string) => void;
}

export function OAuthConnectButton({ platform, loading = false, onConnect }: Props) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onConnect(platform)}
      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
    >
      {loading ? 'Connecting' : 'Connect'}
    </button>
  );
}
