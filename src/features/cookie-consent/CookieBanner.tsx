// src/features/cookie-consent/CookieBanner.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./CookieBanner.module.scss";
import { useConsent } from "./ConsentContext";

export type CookieBannerProps = {
  policyLink?: string;           // ссылка на политику cookies
  className?: string;            // дополнительный класс
};

const CookieBanner: React.FC<CookieBannerProps> = ({ policyLink, className }) => {
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
    <div className={styles.wrapper} role="dialog" aria-modal="true" aria-label="Настройки cookie">
      <div className={`${styles.banner} ${className ?? ""}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Мы используем cookie</h3>
        </div>

        <p className={styles.text}>
          Необходимые cookie обеспечивают базовые функции сайта и всегда включены.
          Вы можете настроить использование аналитических и маркетинговых cookie.{" "}
          {policyLink ? (<a href={policyLink} target="_blank" rel="noreferrer">Подробнее в политике cookie</a>) : null}.
        </p>

        <div className={styles.controls}>
          <div className={styles.switch} aria-live="polite">
            <div className={`${styles.toggle} ${styles.on}`} aria-hidden>
              <input type="checkbox" checked readOnly aria-label="Необходимые cookie" />
            </div>
            <div className={styles.switchText}>
              <label>Необходимые</label>
              <span>Нельзя отключить</span>
            </div>
          </div>

          <div className={styles.switch}>
            <div className={`${styles.toggle} ${analytics ? styles.on : ""}`}>
              <input
                type="checkbox"
                checked={analytics}
                onChange={() => setAnalytics(v => !v)}
                aria-label="Аналитические cookie"
              />
            </div>
            <div className={styles.switchText}>
              <label>Аналитика</label>
              <span>Помогают улучшать продукт</span>
            </div>
          </div>

          <div className={styles.switch}>
            <div className={`${styles.toggle} ${marketing ? styles.on : ""}`}>
              <input
                type="checkbox"
                checked={marketing}
                onChange={() => setMarketing(v => !v)}
                aria-label="Маркетинговые cookie"
              />
            </div>
            <div className={styles.switchText}>
              <label>Маркетинг</label>
              <span>Персонализированные предложения</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            ref={firstBtnRef}
            className={`${styles.btn} ${styles.primary}`}
            onClick={acceptAll}
          >
            Принять все
          </button>

          <button className={`${styles.btn} ${styles.ghost}`} onClick={() => save({ analytics, marketing })}>
            Сохранить выбор
          </button>

          <button className={`${styles.btn} ${styles.danger}`} onClick={declineAll}>
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
