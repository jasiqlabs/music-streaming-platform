import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { api, JWT_STORAGE_KEY } from '../services/api';

export type SessionUser = {
  email?: string;
  name?: string;
} & Record<string, unknown>;

type AuthContextValue = {
  token: string | null;
  user: SessionUser | null;
  isRestoring: boolean;
  isLoggingIn: boolean;
  restoreToken: () => Promise<string | null>;
  setToken: (token: string | null) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchSession: () => Promise<SessionUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const candidate =
    record.token ?? record.jwt ?? record.accessToken ?? (record.data as any)?.token;
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
}

function extractUser(data: unknown): SessionUser | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const candidate = record.user ?? record.data ?? record.session ?? record;
  return typeof candidate === 'object' && candidate ? (candidate as SessionUser) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const restoreToken = useCallback(async () => {
    setIsRestoring(true);
    try {
      const stored = await AsyncStorage.getItem(JWT_STORAGE_KEY);
      setTokenState(stored);
      return stored;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const setToken = useCallback(async (next: string | null) => {
    if (next) {
      await AsyncStorage.setItem(JWT_STORAGE_KEY, next);
    } else {
      await AsyncStorage.removeItem(JWT_STORAGE_KEY);
    }
    setTokenState(next);
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await api.get('/auth/session');
      const nextUser = extractUser(res.data);
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoggingIn(true);
      try {
        const res = await api.post('/auth/login', { email, password });
        const nextToken = extractToken(res.data);
        if (!nextToken) {
          throw new Error('Login succeeded but token was not returned by server.');
        }
        await setToken(nextToken);
        await fetchSession();
      } finally {
        setIsLoggingIn(false);
      }
    },
    [fetchSession, setToken]
  );

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, [setToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isRestoring,
      isLoggingIn,
      restoreToken,
      setToken,
      login,
      logout,
      fetchSession,
    }),
    [
      token,
      user,
      isRestoring,
      isLoggingIn,
      restoreToken,
      setToken,
      login,
      logout,
      fetchSession,
    ]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
