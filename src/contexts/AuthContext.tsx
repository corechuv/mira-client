// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, clearToken } from "@/lib/api";

export type User = { id: string; name?: string; email: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void; // локальное обновление профиля
  updateProfile: (patch: Partial<User>) => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // bootstrap
  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      try {
        // ❗ Всегда пробуем: сработает и для cookie-сессии
        const me = await api.me();
        if (!dead) setUser({ id: me.id, name: me.name, email: me.email });
      } catch {
        clearToken();           // на всякий случай чистим старый JWT, если был
        if (!dead) setUser(null);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    login: async (email: string, password: string) => {
      const resp = await api.login(email, password) as any;
      const tok = resp?.access_token || resp?.token || null;
      if (tok) setToken(tok); else clearToken();
      const me = await api.me();
      setUser({ id: me.id, name: me.name, email: me.email });
    },
    register: async (name: string, email: string, password: string) => {
      const resp = await api.register(name, email, password) as any;
      const tok = resp?.access_token || resp?.token || null;
      if (tok) setToken(tok); else clearToken();
      const me = await api.me();
      setUser({ id: me.id, name: me.name, email: me.email });
    },
    logout: () => { clearToken(); setUser(null); },
    setUser: (u: User) => setUser(u),
    updateProfile: async (patch) => {
      // оптимистично можно сразу обновить локально
      setUser((u) => (u ? { ...u, ...patch } as User : u));
      try {
        const updated = await api.updateMe(patch);
        setUser({ id: updated.id, name: updated.name, email: updated.email });
      } catch (e) {
        // если сервер не принял — откатить нельзя без снапшота; можно просто проглотить/показать тост
        throw e;
      }
    },
  }), [user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
