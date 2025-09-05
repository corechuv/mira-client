// src/features/cookie-consent/CookieBanner.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./CookieBanner.module.scss";
import { useConsent } from "./ConsentContext";
import { useI18n } from "@/i18n/I18nContext";

export type CookieBannerProps = {
    policyLink?: string;           // ссылка на политику cookies
    className?: string;            // дополнительный класс
};

const CookieBanner: React.FC<CookieBannerProps> = ({ policyLink, className }) => {
    const { t } = useI18n();
    const { ready, showBanner, acceptAll, declineAll, save } = useConsent();
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);
    const firstBtnRef = useRef<HTMLButtonElement | null>(null);

    // Фокус на кнопке при появлении
    useEffect(() => {
        if (ready && showBanner) {
            firstBtnRef.current?.focus();
        }
    }, [ready, showBanner]);

    if (!ready || !showBanner) return null;

    return (
        <div
            className={styles.wrapper}
            role="dialog"
            aria-modal="true"
            aria-label={t("cookie.aria.dialog")}
        >
            <div className={`${styles.banner} ${className ?? ""}`}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{t("cookie.title")}</h3>
                </div>

                <p className={styles.text}>
                    {t("cookie.desc")}{" "}
                    {policyLink ? (
                        <a href={policyLink} target="_blank" rel="noreferrer">
                            {t("cookie.policyLink")}
                        </a>
                    ) : null}
                    .
                </p>

                <div className={styles.controls}>
                    <div className={styles.switch} aria-live="polite">
                        <div className={`${styles.toggle} ${styles.on}`} aria-hidden>
                            <input
                                type="checkbox"
                                checked
                                readOnly
                                aria-label={t("cookie.aria.necessary")}
                            />
                        </div>
                        <div className={styles.switchText}>
                            <label>{t("cookie.group.necessary")}</label>
                            <span>{t("cookie.group.necessaryNote")}</span>
                        </div>
                    </div>

                    <div className={styles.switch}>
                        <div className={`${styles.toggle} ${analytics ? styles.on : ""}`}>
                            <input
                                type="checkbox"
                                checked={analytics}
                                onChange={() => setAnalytics(v => !v)}
                                aria-label={t("cookie.aria.analytics")}
                            />
                        </div>
                        <div className={styles.switchText}>
                            <label>{t("cookie.group.analytics")}</label>
                            <span>{t("cookie.group.analyticsNote")}</span>
                        </div>
                    </div>

                    <div className={styles.switch}>
                        <div className={`${styles.toggle} ${marketing ? styles.on : ""}`}>
                            <input
                                type="checkbox"
                                checked={marketing}
                                onChange={() => setMarketing(v => !v)}
                                aria-label={t("cookie.aria.marketing")}
                            />
                        </div>
                        <div className={styles.switchText}>
                            <label>{t("cookie.group.marketing")}</label>
                            <span>{t("cookie.group.marketingNote")}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        ref={firstBtnRef}
                        className={`${styles.btn} ${styles.primary}`}
                        onClick={acceptAll}
                    >
                        {t("cookie.actions.acceptAll")}
                    </button>

                    <button
                        className={`${styles.btn} ${styles.ghost}`}
                        onClick={() => save({ analytics, marketing })}
                    >
                        {t("cookie.actions.save")}
                    </button>

                    <button
                        className={`${styles.btn} ${styles.danger}`}
                        onClick={declineAll}
                    >
                        {t("cookie.actions.decline")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
