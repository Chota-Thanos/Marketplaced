'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const SESSION_KEY = 'bx_admin_session';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8h

const AdminAuthContext = createContext({ token: null, user: null, ready: false });

export function readAdminSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.token || Date.now() - session.ts >= SESSION_MAX_AGE_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function writeAdminSession(token, user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user, ts: Date.now() }));
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Holds the admin session for every route under /admin. Sub-routes read the
 * token from here instead of each re-implementing (or skipping) the check.
 */
export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readAdminSession());
    setReady(true);

    // apiClient dispatches this when the API rejects a token, so an expired
    // session bounces to the login screen instead of rendering empty data.
    const onUnauthorized = () => { clearAdminSession(); setSession(null); };
    window.addEventListener('bazaarx:unauthorized', onUnauthorized);
    return () => window.removeEventListener('bazaarx:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback((token, user) => {
    writeAdminSession(token, user);
    setSession({ token, user, ts: Date.now() });
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setSession(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token: session?.token || null, user: session?.user || null, ready, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
