// src/components/LanguageSwitcher.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n, Locale } from "@/i18n/I18nContext";
import styles from "./LanguageSwitcher.module.scss";

type Variant = "auto" | "mobile" | "desktop";

type Props = {
    variant?: Variant;      // "auto" (default), "mobile", "desktop"
    withFlags?: boolean;    // показывать флаги (default: true)
    className?: string;
    ariaLabel?: string;
};

const langs: Array<{ code: Locale; label: string }> = [
    { code: "ru", label: "Рус" },
    { code: "uk", label: "Укр" },
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
];

const flag = (code: Locale) => {
    switch (code) {
        case "ru": return "🇷🇺";
        case "uk": return "🇺🇦";
        case "en": return "🇬🇧"; // для EN используем 🇬🇧
        case "de": return "🇩🇪";
    }
};

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
}: Props) {
    const { locale, setLocale } = useI18n();
    const isMobile = useIsMobile();
    const mode: Exclude<Variant, "auto"> = useMemo(
        () => (variant === "auto" ? (isMobile ? "mobile" : "desktop") : variant),
        [variant, isMobile]
    );

    // --- Desktop: обычный <select> с флагами ---
    if (mode === "desktop") {
        return (
            <label className={`${styles.wrap} ${styles.desktop} ${className ?? ""}`} aria-label={ariaLabel}>
                <select
                    className={`${styles.select} input`}
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    aria-label={ariaLabel}
                >
                    {langs.map(l => (
                        <option key={l.code} value={l.code}>
                            {withFlags ? `${flag(l.code)} ` : ""}{l.label}
                        </option>
                    ))}
                </select>
            </label>
        );
    }

    // --- Mobile: кнопка + оверлей-меню ---
    return <MobileLangMenu
        locale={locale}
        setLocale={setLocale}
        withFlags={withFlags}
        className={className}
        ariaLabel={ariaLabel}
    />;
}

/* ================= Mobile menu ================= */

function MobileLangMenu({
    locale,
    setLocale,
    withFlags,
    className,
    ariaLabel,
}: {
    locale: Locale;
    setLocale: (l: Locale) => void;
    withFlags: boolean;
    className?: string;
    ariaLabel: string;
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const onChoose = (code: Locale) => {
        setLocale(code);
        setOpen(false);
        // вернуть фокус на кнопку
        requestAnimationFrame(() => btnRef.current?.focus());
    };

    return (
        <div className={`${styles.wrap} ${styles.mobile} ${className ?? ""}`}>
            <button
                ref={btnRef}
                type="button"
                className={styles.trigger}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => setOpen(v => !v)}
            >
                {withFlags && <span className={styles.flag} aria-hidden>{flag(locale)}</span>}
                <span className={styles.label}>
                    {langs.find(l => l.code === locale)?.label ?? locale.toUpperCase()}
                </span>
            </button>

            {open && (
                <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={ariaLabel}>
                    <div className={styles.backdrop} onClick={() => setOpen(false)} />
                    <div className={styles.sheet} role="listbox" aria-label={ariaLabel}>
                        <div className={styles.sheetHead}>
                            <div className={styles.sheetTitle}>{ariaLabel}</div>
                            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">×</button>
                        </div>
                        <ul className={styles.menuList}>
                            {langs.map(l => {
                                const active = l.code === locale;
                                return (
                                    <li key={l.code}>
                                        <button
                                            className={`${styles.menuItem} ${active ? styles.active : ""}`}
                                            role="option"
                                            aria-selected={active}
                                            onClick={() => onChoose(l.code)}
                                        >
                                            {withFlags && <span className={styles.flag} aria-hidden>{flag(l.code)}</span>}
                                            <span className={styles.menuLabel}>{l.label}</span>
                                            {active && <span className={styles.check} aria-hidden>✓</span>}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
