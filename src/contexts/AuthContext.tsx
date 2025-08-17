// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = { id: string; name: string; email: string };

type AuthState = {
  user: User | null;
  login: (email: string, name: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);
const LS_KEY = "pm.user.v1";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(LS_KEY, JSON.stringify(user));
    else localStorage.removeItem(LS_KEY);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      login: (email: string, name: string) =>
        setUser({ id: crypto.randomUUID(), name, email }),
      logout: () => setUser(null),
    }),
    [user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
