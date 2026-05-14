"use client";

import { useEffect, useState } from "react";

import {
  addSignal,
  clearSession,
  getOrInitSession,
  setPermission,
  setSummary,
  touchSession,
} from "@/next/lib/memory/local-session";
import type { LocalSession, LocalSignal, PermissionState } from "@/next/types/cubiqo";

export function useAnonymousSession() {
  const [session, setSession] = useState<LocalSession | null>(null);

  useEffect(() => {
    const current = touchSession(getOrInitSession());
    setSession(current);
  }, []);

  return {
    session,
    addSignal(signal: LocalSignal) {
      const next = addSignal(session ?? getOrInitSession(), signal);
      setSession(next);
      return next;
    },
    setPermission(permission: keyof LocalSession["permissions"], status: PermissionState) {
      const next = setPermission(session ?? getOrInitSession(), permission, status);
      setSession(next);
      return next;
    },
    setSummary(summary: string) {
      const next = setSummary(session ?? getOrInitSession(), summary);
      setSession(next);
      return next;
    },
    clear() {
      clearSession();
      setSession(null);
    },
  };
}
