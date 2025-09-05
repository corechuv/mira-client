// src/pages/Cookies.tsx

import React, { useEffect, useState } from "react";
import styles from "./Cookies.module.scss";

type ConsentKey = "necessary" | "analytics" | "marketing";

type ConsentState = Record<ConsentKey, boolean>;

const DEFAULT_CONSENT: ConsentState = { necessary: true, analytics: false, marketing: false };
const STORAGE_KEY = "cookie_consent_v1";

export default function Cookies() {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setConsent(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  }, [consent, loaded]);

  const toggle = (key: ConsentKey) => () => setConsent(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <main className={styles.container}>
      <h1>Политика файлов cookie</h1>
      <p className={styles.meta}>Сайт: &lt;домен&gt; · Германия (DSGVO/TTDSG)</p>

      <section>
        <h2>1. Что такое cookie?</h2>
        <p>
          Cookie — это небольшие файлы, сохраняемые вашим браузером. Они могут быть необходимыми для работы сайта или использоваться
          для аналитики/маркетинга. Для необязательных cookie требуется ваше согласие (ст. 6(1)(a) DSGVO; §25 TTDSG).
        </p>
      </section>

      <section>
        <h2>2. Как мы используем cookie</h2>
        <ul>
          <li><strong>Необходимые</strong> — обеспечивают базовые функции сайта. Основание: законный интерес (ст. 6(1)(f) DSGVO).</li>
          <li><strong>Аналитические</strong> — помогают улучшать сайт. Основание: согласие.</li>
          <li><strong>Маркетинговые</strong> — персонализация/реклама. Основание: согласие.</li>
        </ul>
      </section>

      <section>
        <h2>3. Ваши настройки</h2>
        <div className={styles.card}>
          <label className={styles.row}>
            <input type="checkbox" checked={consent.necessary} disabled />
            <span>Необходимые cookie (всегда активны)</span>
          </label>
          <label className={styles.row}>
            <input type="checkbox" checked={consent.analytics} onChange={toggle("analytics")} />
            <span>Аналитические cookie (по согласию)</span>
          </label>
          <label className={styles.row}>
            <input type="checkbox" checked={consent.marketing} onChange={toggle("marketing")} />
            <span>Маркетинговые cookie (по согласию)</span>
          </label>
          <p className={styles.note}>
            Изменения сохраняются в вашем браузере. Вы можете отозвать согласие в любой момент, изменив настройки выше. Для удаления
            уже установленных идентификаторов очистите cookie в настройках браузера.
          </p>
        </div>
      </section>

      <section>
        <h2>4. Список cookie</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Срок</th>
              <th>Назначение</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>session_id</td>
              <td>Необходимые</td>
              <td>Сеанс</td>
              <td>Поддержка авторизованного сеанса пользователя</td>
            </tr>
            <tr>
              <td>_ga</td>
              <td>Аналитические</td>
              <td>24 месяца</td>
              <td>Аналитика посещений (пример; включайте только при использовании и наличии согласия)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. Контакты</h2>
        <p>
          Вопросы по cookie и согласию: &lt;email&gt;.
        </p>
      </section>
    </main>
  );
}
