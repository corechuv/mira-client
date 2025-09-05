import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCookie, setCookie } from "../../lib/cookies";

type Category = "necessary" | "analytics" | "marketing";

export type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: number;     // для инвалидации при изменении политики
  timestamp: number;   // unix ms
};

type Ctx = {
  ready: boolean;                      // контекст инициализирован (клиент)
  consent: Consent | null;
  showBanner: boolean;
  setShowBanner: (v: boolean) => void;

  isAllowed: (c: Exclude<Category, "necessary">) => boolean;
  acceptAll: () => void;
  declineAll: () => void;
  save: (data: Partial<Pick<Consent, "analytics" | "marketing">>) => void;
};

const ConsentContext = createContext<Ctx | null>(null);

export type ConsentProviderProps = {
  children: React.ReactNode;
  cookieName?: string;          // имя cookie (по умолчанию "app_consent")
  cookieDays?: number;          // срок жизни (по умолчанию 365)
  policyVersion?: number;       // увеличьте, если меняется политика
  sameSite?: "Lax" | "Strict" | "None";
  domain?: string;
};

export const ConsentProvider: React.FC<ConsentProviderProps> = ({
  children,
  cookieName = "app_consent",
  cookieDays = 365,
  policyVersion = 1,
  sameSite = "Lax",
  domain
}) => {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Загрузка из cookie
  useEffect(() => {
    const raw = getCookie(cookieName);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Consent;
        setConsent(parsed);
        setShowBanner(parsed.version !== policyVersion);
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
    setReady(true);
  }, [cookieName, policyVersion]);

  const persist = useCallback((c: Consent) => {
    setConsent(c);
    setCookie(cookieName, JSON.stringify(c), {
      days: cookieDays,
      sameSite,
      domain
    });
  }, [cookieDays, cookieName, sameSite, domain]);

  const acceptAll = useCallback(() => {
    const c: Consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      version: policyVersion,
      timestamp: Date.now()
    };
    persist(c);
    setShowBanner(false);
  }, [persist, policyVersion]);

  const declineAll = useCallback(() => {
    const c: Consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      version: policyVersion,
      timestamp: Date.now()
    };
    persist(c);
    setShowBanner(false);
  }, [persist, policyVersion]);

  const save = useCallback((data: Partial<Pick<Consent, "analytics" | "marketing">>) => {
    const c: Consent = {
      necessary: true,
      analytics: !!data.analytics,
      marketing: !!data.marketing,
      version: policyVersion,
      timestamp: Date.now()
    };
    persist(c);
    setShowBanner(false);
  }, [persist, policyVersion]);

  const isAllowed = useCallback((key: Exclude<Category, "necessary">) => {
    return !!consent?.[key];
  }, [consent]);

  const value = useMemo<Ctx>(() => ({
    ready, consent, showBanner, setShowBanner, isAllowed, acceptAll, declineAll, save
  }), [ready, consent, showBanner, isAllowed, acceptAll, declineAll, save]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
};

// Хук для потребителей
export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
