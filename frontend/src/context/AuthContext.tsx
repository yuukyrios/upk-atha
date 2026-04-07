import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  token: string | null;
  login: (nickname: string, password: string) => Promise<void>;
  register: (nickname: string, password: string, email?: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("mechadex_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mechadex_token"));
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("mechadex_guest") === "true");

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.userType === "admin" || user?.user_type === "admin";

  const persistAuth = useCallback((t: string, u: User) => {
    localStorage.setItem("mechadex_token", t);
    localStorage.setItem("mechadex_user", JSON.stringify(u));
    localStorage.removeItem("mechadex_guest");
    setToken(t);
    setUser(u);
    setIsGuest(false);
  }, []);

  const login = async (nickname: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>("/auth/login", { nickname, password });
    persistAuth(data.token, data.user);
  };

  const register = async (nickname: string, password: string, email?: string) => {
    const body: Record<string, string> = { nickname, password };
    if (email) body.email = email;
    const data = await api.post<{ token: string; user: User }>("/auth/register", body);
    persistAuth(data.token, data.user);
  };

  const continueAsGuest = () => {
    localStorage.setItem("mechadex_guest", "true");
    localStorage.removeItem("mechadex_token");
    localStorage.removeItem("mechadex_user");
    setUser(null);
    setToken(null);
    setIsGuest(true);
  };

  const logout = () => {
    localStorage.removeItem("mechadex_token");
    localStorage.removeItem("mechadex_user");
    localStorage.removeItem("mechadex_guest");
    setUser(null);
    setToken(null);
    setIsGuest(false);
  };

  const updateUser = (partial: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    setUser(updated);
    localStorage.setItem("mechadex_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isGuest, isAdmin, token, login, register, continueAsGuest, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
