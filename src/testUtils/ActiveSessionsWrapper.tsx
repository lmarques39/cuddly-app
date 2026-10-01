import React from 'react';
import { ActiveSessionsProvider } from '../features/activeSessions/ActiveSessionsProvider';

/** Tracker hooks/screens read their running timer from ActiveSessionsProvider (#99) — pass this as `wrapper` to render/renderHook. */
export function ActiveSessionsWrapper({ children }: { children: React.ReactNode }) {
  return <ActiveSessionsProvider>{children}</ActiveSessionsProvider>;
}
