// src/components/LanguageSwitcher.tsx
import type React from "react";
import { useEffect, useMemo, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import { useI18n, Locale } from "@/i18n/I18nContext";
import styles from "./LanguageSwitcher.module.scss";

type Variant = "auto" | "mobile" | "desktop";

type Props = {
  variant?: Variant;      // "auto" (default), "mobile", "desktop"
  withFlags?: boolean;    // показывать флаги (default: true)
  className?: string;
  ariaLabel?: string;
  renderFlag?: (code: Locale, svgProps?: React.SVGProps<SVGSVGElement>) => React.ReactNode;
};

const langs: Array<{ code: Locale; label: string }> = [
  { code: "ru", label: "Рус" },
  { code: "uk", label: "Укр" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

/** Inline-SVG по умолчанию */
const defaultRenderFlag: NonNullable<Props["renderFlag"]> = (code, svgProps) => {
  const base = {
    viewBox: "0 0 18 12",
    width: 18,
    height: 12,
    role: "img",
    "aria-hidden": true,
    focusable: false,
    ...svgProps,
  } as const;

  switch (code) {
    case "ru":
      return (
        <svg {...base}>
          <rect width="18" height="12" fill="#fff" />
          <rect y="4" width="18" height="4" fill="#1C57A5" />
          <rect y="8" width="18" height="4" fill="#D52B1E" />
        </svg>
      );
    case "uk":
      return (
        <svg {...base}>
          <rect width="18" height="6" fill="#0057B7" />
          <rect y="6" width="18" height="6" fill="#FFD700" />
        </svg>
      );
    case "en":
      return (
        <svg {...base}>
          <rect width="18" height="12" fill="#012169" />
          <path d="M0,0 L18,12 M18,0 L0,12" stroke="#fff" strokeWidth="2.4" />
          <path d="M0,0 L18,12 M18,0 L0,12" stroke="#C8102E" strokeWidth="1.2" />
          <rect x="7.2" width="3.6" height="12" fill="#fff" />
          <rect y="4.2" width="18" height="3.6" fill="#fff" />
          <rect x="7.8" width="2.4" height="12" fill="#C8102E" />
          <rect y="4.8" width="18" height="2.4" fill="#C8102E" />
        </svg>
      );
    case "de":
      return (
        <svg {...base}>
          <rect width="18" height="4" fill="#000" />
          <rect y="4" width="18" height="4" fill="#DD0000" />
          <rect y="8" width="18" height="4" fill="#FFCE00" />
        </svg>
      );
  }
};

/* ---------- Portal (SSR-safe) ---------- */
function usePortalRoot(id = "ls-portal-root") {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    let root = document.getElementById(id) as HTMLElement | null;
    let created = false;
    if (!root) {
      root = document.createElement("div");
      root.id = id;
      document.body.appendChild(root);
      created = true;
    }
    setEl(root);
    return () => {
      // при желании можно не удалять узел (оставить кэшированный контейнер)
      if (created && root?.parentNode) root.parentNode.removeChild(root);
    };
  }, [id]);
  return el;
}

function Portal({ children }: { children: React.ReactNode }) {
  const root = usePortalRoot();
  if (!root) return null;
  return createPortal(children, root);
}

/* ---------- helpers ---------- */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

export default function LanguageSwitcher({
  variant = "auto",
  withFlags = true,
  className,
  ariaLabel = "Language",
  renderFlag = defaultRenderFlag,
}: Props) {
  const { locale, setLocale } = useI18n();
  const isMobile = useIsMobile();
  const mode: Exclude<Variant, "auto"> = useMemo(
    () => (variant === "auto" ? (isMobile ? "mobile" : "desktop") : variant),
    [variant, isMobile]
  );

  return (
    <LangMenu
      kind={mode}
      locale={locale}
      setLocale={setLocale}
      withFlags={withFlags}
      className={className}
      ariaLabel={ariaLabel}
      renderFlag={renderFlag}
    />
  );
}

/* ================= Unified menu (mobile = bottom sheet, desktop = centered modal) ================= */

function LangMenu({
  kind,
  locale,
  setLocale,
  withFlags,
  className,
  ariaLabel,
  renderFlag,
}: {
  kind: "mobile" | "desktop";
  locale: Locale;
  setLocale: (l: Locale) => void;
  withFlags: boolean;
  className?: string;
  ariaLabel: string;
  renderFlag: NonNullable<Props["renderFlag"]>;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusIndex, setFocusIndex] = useState<number>(
    Math.max(0, langs.findIndex((l) => l.code === locale))
  );
  const titleId = useId();

  // esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);

  // focus selected on open
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, langs.findIndex((l) => l.code === locale));
    setFocusIndex(idx);
    const t = requestAnimationFrame(() => {
      optionRefs.current[idx]?.focus();
      optionRefs.current[idx]?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(t);
  }, [open, locale]);

  const onChoose = (code: Locale) => {
    setLocale(code);
    setOpen(false);
    requestAnimationFrame(() => btnRef.current?.focus());
  };

  const clamp = (i: number) => (i < 0 ? langs.length - 1 : i >= langs.length ? 0 : i);
  const onListKeyDown = (e: React.KeyboardEvent) => {
    const { key } = e;
    if (key === "ArrowDown" || key === "ArrowUp" || key === "Home" || key === "End") {
      e.preventDefault();
      let next = focusIndex;
      if (key === "ArrowDown") next = clamp(focusIndex + 1);
      if (key === "ArrowUp") next = clamp(focusIndex - 1);
      if (key === "Home") next = 0;
      if (key === "End") next = langs.length - 1;
      setFocusIndex(next);
      optionRefs.current[next]?.focus();
      optionRefs.current[next]?.scrollIntoView({ block: "nearest" });
    }
    if (key === "Enter" || key === " ") {
      e.preventDefault();
      const l = langs[focusIndex];
      if (l) onChoose(l.code);
    }
  };

  const overlay = (
    <div
      className={`${styles.overlay} ${styles[kind]}`} // важно: мобильная/десктопная ветка на самом overlay
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label={ariaLabel}
    >
      <div className={styles.backdrop} onClick={() => setOpen(false)} />
      <div
        className={kind === "mobile" ? styles.sheet : styles.dialog}
        role="listbox"
        aria-label={ariaLabel}
        onKeyDown={onListKeyDown}
      >
        <div className={kind === "mobile" ? styles.sheetHead : styles.dialogHead}>
          <div id={titleId} className={kind === "mobile" ? styles.sheetTitle : styles.dialogTitle}>
            {ariaLabel}
          </div>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>

        <ul className={styles.menuList}>
          {langs.map((l, idx) => {
            const active = l.code === locale;
            return (
              <li key={l.code}>
                <button
                  ref={(el) => (optionRefs.current[idx] = el)}
                  className={`${styles.menuItem} ${active ? styles.active : ""}`}
                  role="option"
                  aria-selected={active}
                  tabIndex={idx === focusIndex ? 0 : -1}
                  onMouseEnter={() => setFocusIndex(idx)}
                  onClick={() => onChoose(l.code)}
                >
                  <span className={styles.leftPart}>
                    {withFlags && (
                      <span className={styles.flag} aria-hidden>
                        {renderFlag(l.code, { className: styles.flagSvg })}
                      </span>
                    )}
                    <span className={styles.menuLabel}>{l.label}</span>
                  </span>
                  {active && <span className={styles.check} aria-hidden>✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  return (
    <div className={`${styles.wrap} ${styles[kind]} ${className ?? ""}`}>
      <button
        ref={btnRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(v => !v)}
      >
        {withFlags && (
          <span className={styles.flag} aria-hidden>
            {renderFlag(locale, { className: styles.flagSvg })}
          </span>
        )}
        <span className={styles.label}>
          {langs.find(l => l.code === locale)?.label ?? locale.toUpperCase()}
        </span>
      </button>

      {open && <Portal>{overlay}</Portal>}
    </div>
  );
}
