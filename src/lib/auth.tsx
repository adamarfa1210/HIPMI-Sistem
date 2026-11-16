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
  setStoredToken,
  type AuthUserProfile,
  type PermissionEntry,
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
      const me = await apiRequest<AuthUserProfile>("/api/auth/me");
      setUser(me);
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
    const data = await apiRequest<{
      accessToken: string;
      user: AuthUserProfile;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ nim, password }),
    });
    setStoredToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const can = useCallback(
    (moduleCode: string, action: keyof PermissionEntry) => {
      if (!user) return false;
      if (user.roleName === "Admin") return true;
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
