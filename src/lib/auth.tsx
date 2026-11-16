"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  apiRequest,
  getStoredToken,
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

  const refreshMe = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest<RawAuthPayload>("/api/auth/me");
      setUser(normalizeAuthUser(data));
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (nim: string, password: string) => {
    const data = await apiRequest<RawAuthPayload>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ nim, password }),
    });
    if (!data.accessToken) {
      throw new Error("Token autentikasi tidak ditemukan pada respons login");
    }
    const normalizedUser = normalizeAuthUser(data);
    setStoredToken(data.accessToken);
    setUser(normalizedUser);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const can = useCallback(
    (moduleCode: string, action: keyof PermissionEntry) => {
      if (!user) return false;
      if (user.roleName === "Admin" || user.roleCode === "admin") return true;
      return Boolean(user.permissions?.[moduleCode]?.[action]);
    },
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
