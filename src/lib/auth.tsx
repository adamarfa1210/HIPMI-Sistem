"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  apiRequest,
  getStoredToken,
  hasPermission,
  normalizeAuthUser,
  setStoredToken,
  type AuthUserProfile,
  type PermissionEntry,
  type RawAuthPayload,
} from "./api";

interface AuthContextValue {
  user: AuthUserProfile | null;
  loading: boolean;
  login: (nim: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  can: (moduleCode: string, action: keyof PermissionEntry) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const authEpochRef = useRef(0);

  const refreshMe = useCallback(async () => {
    const epoch = ++authEpochRef.current;
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest<RawAuthPayload>("/api/auth/me");
      if (authEpochRef.current !== epoch) return;
      setUser(normalizeAuthUser(data));
    } catch {
      if (authEpochRef.current !== epoch) return;
      setStoredToken(null);
      setUser(null);
    } finally {
      if (authEpochRef.current === epoch) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (nim: string, password: string) => {
    const epoch = ++authEpochRef.current;
    try {
      const data = await apiRequest<RawAuthPayload>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ nim, password }),
      });
      if (authEpochRef.current !== epoch) return;
      if (!data.accessToken) {
        throw new Error("Token autentikasi tidak ditemukan pada respons login");
      }
      const normalizedUser = normalizeAuthUser(data);
      setStoredToken(data.accessToken);
      setUser(normalizedUser);
    } finally {
      if (authEpochRef.current === epoch) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(() => {
    authEpochRef.current += 1;
    setStoredToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const can = useCallback(
    (moduleCode: string, action: keyof PermissionEntry) =>
      hasPermission(user, moduleCode, action),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshMe, can }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
