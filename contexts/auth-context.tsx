import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { api, type ApiError } from '@/lib/api';
import { getItemAsync, setItemAsync, deleteItemAsync } from '@/lib/secure-storage';

const AUTH_TOKEN_KEY = 'course_app_access_token';
const REFRESH_TOKEN_KEY = 'course_app_refresh_token';
const USER_KEY = 'course_app_user';

export type User = {
  id: string;
  email: string;
  username: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(raw: unknown): User {
  const o = raw as Record<string, unknown>;
  const username = String(
    o?.username ??
    (typeof o?.email === 'string' ? o.email.split('@')[0] : undefined) ??
    'User'
  );
  const name = String(
    o?.name ??
    o?.fullName ??
    o?.displayName ??
    username.charAt(0).toUpperCase() + username.slice(1)
  );
  return {
    id: String(o?.id ?? o?.userId ?? ''),
    email: String(o?.email ?? ''),
    username,
    name,
  };
}

function storeAuth(accessToken: string, refreshToken: string | undefined, user: User): Promise<void> {
  return Promise.all([
    setItemAsync(AUTH_TOKEN_KEY, accessToken),
    refreshToken ? setItemAsync(REFRESH_TOKEN_KEY, refreshToken) : Promise.resolve(),
    setItemAsync(USER_KEY, JSON.stringify(user)),
  ]).then(() => undefined);
}

function clearAuth(): Promise<void> {
  return Promise.all([
    deleteItemAsync(AUTH_TOKEN_KEY),
    deleteItemAsync(REFRESH_TOKEN_KEY),
    deleteItemAsync(USER_KEY),
  ]).then(() => undefined);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    const promise = (async () => {
      try {
        const res = await api.refresh();
        const token = res.accessToken ?? (res as Record<string, string>).access_token;
        const refresh = res.refreshToken ?? (res as Record<string, string>).refresh_token;
        if (!token) return false;
        const userJson = await getItemAsync(USER_KEY);
        const existingUser = userJson ? (JSON.parse(userJson) as User) : null;
        if (existingUser) {
          await storeAuth(token, refresh, existingUser);
        } else {
          await setItemAsync(AUTH_TOKEN_KEY, token);
          if (refresh) await setItemAsync(REFRESH_TOKEN_KEY, refresh);
        }
        return true;
      } catch {
        await clearAuth();
        setUser(null);
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
    refreshPromiseRef.current = promise;
    return promise;
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [token, userJson] = await Promise.all([
        getItemAsync(AUTH_TOKEN_KEY),
        getItemAsync(USER_KEY),
      ]);
      if (!token || !userJson) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const parsed = JSON.parse(userJson) as User;
      setUser(parsed);

      try {
        const me = await api.me();
        setUser(normalizeUser(me));
        await setItemAsync(USER_KEY, JSON.stringify(normalizeUser(me)));
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr?.status === 401) {
          const refreshed = await refreshToken();
          if (!refreshed) setUser(null);
        } else if (apiErr?.status === 404) {
          // /users/me not implemented - keep stored user
        } else {
          setUser(null);
          await clearAuth();
        }
      }
    } catch {
      setUser(null);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (!email.trim() || !password.trim()) {
        return { success: false, error: 'Email and password are required' };
      }
      const domain = email.trim().toLowerCase().split('@')[1] ?? '';
      if (['example.com', 'example.org', 'example.net', 'test.com'].includes(domain)) {
        return { success: false, error: 'Please use a real email address. example.com and similar test domains are not accepted.' };
      }
      try {
        const res = await api.login(email.trim(), password.trim());
        const resAny = res as Record<string, unknown>;
        const token = (res.accessToken ?? resAny.token ?? resAny.access_token) as string | undefined;
        const refresh = (res.refreshToken ?? resAny.refresh_token) as string | undefined;
        const userData = res.user ?? resAny.user;
        if (!token) {
          return { success: false, error: 'Invalid response from server' };
        }
        const u = normalizeUser(userData ?? { email: email.trim(), username: email.split('@')[0] });
        await storeAuth(token, refresh, u);
        setUser(u);
        return { success: true };
      } catch (err) {
        const apiErr = err as ApiError;
        return {
          success: false,
          error: apiErr?.userMessage ?? apiErr?.message ?? 'Login failed. Please try again.',
        };
      }
    },
    []
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      username: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!email.trim() || !password.trim()) {
        return { success: false, error: 'Email and password are required' };
      }
      const domain = email.trim().toLowerCase().split('@')[1] ?? '';
      if (['example.com', 'example.org', 'example.net', 'test.com'].includes(domain)) {
        return { success: false, error: 'Please use a real email address. example.com and similar test domains are not accepted.' };
      }
      if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }
      const finalUsername = (username || email.split('@')[0]).trim();
      if (finalUsername.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      try {
        await api.register({
          email: email.trim(),
          password,
          username: finalUsername,
        });
        // FreeAPI register doesn't return tokens; login to get them
        const loginResult = await api.login(email.trim(), password);
        const resAny = loginResult as Record<string, unknown>;
        const token = (loginResult.accessToken ?? resAny.token ?? resAny.access_token) as string | undefined;
        const refresh = (loginResult.refreshToken ?? resAny.refresh_token) as string | undefined;
        const userData = loginResult.user ?? resAny.user;
        if (!token) {
          return { success: false, error: 'Registration successful. Please sign in.' };
        }
        const u = normalizeUser(userData ?? { email: email.trim(), username: username || email.split('@')[0] });
        await storeAuth(token, refresh, u);
        setUser(u);
        return { success: true };
      } catch (err) {
        const apiErr = err as ApiError;
        return {
          success: false,
          error: apiErr?.userMessage ?? apiErr?.message ?? 'Registration failed. Please try again.',
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await clearAuth();
      setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
