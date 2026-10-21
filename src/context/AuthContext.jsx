'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const API_BASE = '/api/backend/v1';

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'request_failed');
    error.status = response.status;
    error.code = payload.error;
    throw error;
  }
  return payload;
}

function normalizeSession(payload) {
  const account = payload?.user;
  const scope = payload?.scope;
  if (!account || !scope) return null;

  const activeClient = (scope.clients || []).find((client) => client.id === scope.active_client_id);
  const superAdmin = account.system_role === 'super_admin';
  const agencyRole = superAdmin || ['admin', 'agency'].includes(scope.role);

  return {
    id: account.id,
    uid: account.id,
    email: account.email,
    user: account.email.split('@')[0],
    role: agencyRole ? 'agence' : 'client',
    membershipRole: scope.role,
    systemRole: account.system_role,
    permissions: scope.permissions || [],
    activeClientId: scope.active_client_id,
    clients: scope.clients || [],
    client: activeClient?.name || 'Aucun client actif',
    poste: superAdmin ? 'Super administrateur' : scope.role || 'Membre',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const session = await api('/auth/session');
      const normalized = normalizeSession(session);
      setUser(normalized);
      return normalized;
    } catch (error) {
      if (error.status === 401) setUser(null);
      return null;
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const requestMagicLink = useCallback(async (email) => {
    return api('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }, []);

  const confirmMagicLink = useCallback(async (token) => {
    const session = await api('/auth/magic-link/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    const normalized = normalizeSession(session);
    setUser(normalized);
    return normalized;
  }, []);

  const loginWithPassword = useCallback(async (email, password) => {
    const session = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const normalized = normalizeSession(session);
    setUser(normalized);
    return normalized;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/session', { method: 'DELETE' });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    requestMagicLink,
    confirmMagicLink,
    loginWithPassword,
    logout,
    refreshSession,
    isAgency: user?.role === 'agence',
    isClient: user?.role === 'client',
    isAuthenticated: Boolean(user),
    loadingAuth,
  }), [user, requestMagicLink, confirmMagicLink, loginWithPassword, logout, refreshSession, loadingAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
