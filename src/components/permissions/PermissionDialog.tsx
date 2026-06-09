'use client';

/**
 * PermissionDialog — surfaces permission requests to the user.
 *
 * Usage:
 *   <PermissionDialog
 *     permissions={['mic', 'camera']}
 *     reason="CubiQo needs mic access to transcribe your voice messages."
 *     onGranted={() => ...}
 *     onDenied={() => ...}
 *   />
 *
 * Writes the result to user_permissions via POST /api/agent/understand-classify.
 * Also requests the native browser permission (mic/camera) before storing.
 */

import { useState } from 'react';
import { Camera, Mic, MapPin, Bell, Eye, Globe, FolderOpen, Plug, ShieldCheck, X } from 'lucide-react';
import { authHeaders } from '@/next/lib/supabase-browser';

export type PermissionKey =
  | 'mic'
  | 'camera'
  | 'location'
  | 'push'
  | 'tracking'
  | 'memory'
  | 'browser_access'
  | 'file_access'
  | 'external_app_access';

const PERMISSION_META: Record<PermissionKey, { label: string; description: string; icon: React.ReactNode; browserApi?: 'microphone' | 'camera' | 'geolocation' | 'notifications' }> = {
  mic: {
    label: 'Microphone',
    description: 'Transcribe your voice messages and commands into text.',
    icon: <Mic className="h-5 w-5" />,
    browserApi: 'microphone',
  },
  camera: {
    label: 'Camera',
    description: 'Analyse images or video frames — describe, OCR, detect objects.',
    icon: <Camera className="h-5 w-5" />,
    browserApi: 'camera',
  },
  location: {
    label: 'Location',
    description: 'Use your location for geofenced reminders and local search.',
    icon: <MapPin className="h-5 w-5" />,
    browserApi: 'geolocation',
  },
  push: {
    label: 'Push notifications',
    description: 'Receive proactive alerts from CubiQo — due dates, blockers, cost spikes.',
    icon: <Bell className="h-5 w-5" />,
    browserApi: 'notifications',
  },
  tracking: {
    label: 'Activity tracking',
    description: 'Track task completion and session patterns to improve suggestions.',
    icon: <Eye className="h-5 w-5" />,
  },
  memory: {
    label: 'Memory',
    description: 'Store goals, preferences, and context across sessions.',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  browser_access: {
    label: 'Browser automation',
    description: 'Allow CubiQo to control a cloud browser for tasks on your behalf.',
    icon: <Globe className="h-5 w-5" />,
  },
  file_access: {
    label: 'File access',
    description: 'Read and write files for research, resume tailoring, and document tasks.',
    icon: <FolderOpen className="h-5 w-5" />,
  },
  external_app_access: {
    label: 'External apps',
    description: 'Connect and act through your linked apps (Gmail, LinkedIn, Shopify, etc.).',
    icon: <Plug className="h-5 w-5" />,
  },
};

type PermissionState = 'granted' | 'denied' | 'pending';

type Props = {
  permissions: PermissionKey[];
  reason?: string;
  onGranted?: (granted: PermissionKey[]) => void;
  onDenied?: () => void;
  onDismiss?: () => void;
};

async function requestBrowserPermission(api: 'microphone' | 'camera' | 'geolocation' | 'notifications'): Promise<'granted' | 'denied' | 'pending'> {
  try {
    if (api === 'geolocation') {
      return await new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          () => resolve('denied'),
          { timeout: 5000 }
        );
      });
    }
    if (api === 'notifications') {
      const result = await Notification.requestPermission();
      return result === 'granted' ? 'granted' : 'denied';
    }
    // mic / camera
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: api === 'microphone',
      video: api === 'camera',
    });
    stream.getTracks().forEach(t => t.stop()); // release immediately
    return 'granted';
  } catch {
    return 'denied';
  }
}

async function storePermissions(updates: Partial<Record<PermissionKey, PermissionState>>) {
  const headers = await authHeaders();
  if (!headers.Authorization) return;

  await fetch('/api/agent/understand-classify', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: '_permission_update',
      permissions: updates,
    }),
  }).catch(() => null);
}

export function PermissionDialog({ permissions, reason, onGranted, onDenied, onDismiss }: Props) {
  const [states, setStates] = useState<Partial<Record<PermissionKey, PermissionState>>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pending = permissions.filter(p => !states[p]);

  async function allow() {
    setLoading(true);
    const results: Partial<Record<PermissionKey, PermissionState>> = {};

    for (const perm of permissions) {
      const meta = PERMISSION_META[perm];
      let state: PermissionState = 'granted';

      if (meta.browserApi) {
        state = await requestBrowserPermission(meta.browserApi);
      }

      results[perm] = state;
      setStates(prev => ({ ...prev, [perm]: state }));
    }

    await storePermissions(results);
    setLoading(false);
    setDone(true);

    const granted = Object.entries(results)
      .filter(([, v]) => v === 'granted')
      .map(([k]) => k as PermissionKey);

    if (granted.length) onGranted?.(granted);
    else onDenied?.();
  }

  async function deny() {
    const results = Object.fromEntries(permissions.map(p => [p, 'denied' as PermissionState]));
    await storePermissions(results);
    onDenied?.();
  }

  if (done) {
    const allGranted = permissions.every(p => states[p] === 'granted');
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm text-emerald-300">
        <ShieldCheck className="mb-1 h-4 w-4 inline mr-1" />
        {allGranted
          ? `${permissions.length === 1 ? 'Permission' : 'Permissions'} granted — CubiQo is ready.`
          : 'Some permissions were denied. You can update them in Settings.'}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-neutral-950 p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Permission request</p>
          <h3 className="text-base font-semibold text-slate-50">
            {permissions.length === 1
              ? `Allow ${PERMISSION_META[permissions[0]]?.label}`
              : `Allow ${permissions.length} permissions`}
          </h3>
          {reason && <p className="mt-1 text-sm text-slate-400">{reason}</p>}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <ul className="mb-5 space-y-3">
        {permissions.map(perm => {
          const meta = PERMISSION_META[perm];
          const state = states[perm];
          return (
            <li key={perm} className="flex items-start gap-3">
              <span className={`mt-0.5 ${
                state === 'granted' ? 'text-emerald-400'
                : state === 'denied' ? 'text-rose-400'
                : 'text-cyan-300'
              }`}>
                {meta.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100">{meta.label}</p>
                <p className="text-xs text-slate-400">{meta.description}</p>
              </div>
              {state && (
                <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                  state === 'granted' ? 'bg-emerald-400/10 text-emerald-300'
                  : 'bg-rose-400/10 text-rose-300'
                }`}>
                  {state}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <button
          onClick={allow}
          disabled={loading}
          className="flex-1 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {loading ? 'Requesting…' : 'Allow'}
        </button>
        <button
          onClick={deny}
          disabled={loading}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-900 disabled:opacity-60"
        >
          Deny
        </button>
      </div>

      <p className="mt-3 text-[0.65rem] text-slate-600 text-center">
        You can change permissions any time in Settings → Permissions.
      </p>
    </div>
  );
}

/**
 * Inline permission gate — renders children if permission is granted,
 * otherwise shows the dialog inline.
 */
export function WithPermission({
  permission,
  reason,
  children,
}: {
  permission: PermissionKey;
  reason: string;
  children: React.ReactNode;
}) {
  const [granted, setGranted] = useState(false);
  const [denied, setDenied] = useState(false);

  if (granted) return <>{children}</>;

  if (denied) {
    return (
      <div className="rounded-lg border border-rose-400/20 bg-rose-500/5 p-3 text-sm text-rose-300">
        Permission denied. Enable {PERMISSION_META[permission]?.label} in Settings to use this feature.
      </div>
    );
  }

  return (
    <PermissionDialog
      permissions={[permission]}
      reason={reason}
      onGranted={() => setGranted(true)}
      onDenied={() => setDenied(true)}
    />
  );
}
