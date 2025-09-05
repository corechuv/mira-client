// src/pages/Contacts.tsx
import React, { useState } from "react";
import styles from "./Contact.module.scss";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function Contact() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь должна быть отправка на ваш backend (fetch/axios). Сейчас просто имитируем отправку.
    setSubmitted(true);
  };

  return (
    <main className={styles.container}>
      <h1>Контакты</h1>
      <p className={styles.meta}>Применимое право: Германия · Последнее обновление: 05.09.2025</p>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2>Реквизиты компании</h2>
          <p>
            <strong>&lt;Название компании&gt;</strong><br/>
            &lt;Улица, дом, индекс, город, Германия&gt;<br/>
            E‑mail: <a href="mailto:&lt;email&gt;">&lt;email&gt;</a><br/>
            Тел.: &lt;+49 ..........&gt;
          </p>
          <p>
            Ответственное лицо (Vertretungsberechtigte/r): &lt;ФИО&gt;<br/>
            Торговый реестр (Handelsregister): &lt;Суд и номер HRB/HRA&gt;<br/>
            USt‑IdNr. (НДС): &lt;DE*********&gt;<br/>
            Ответственный за контент по § 18 Abs. 2 MStV: &lt;ФИО, адрес&gt;
          </p>
        </div>

        <div className={styles.card}>
          <h2>Форма обратной связи</h2>
          {!submitted ? (
            <form className={styles.form} onSubmit={onSubmit}>
              <label>
                <span>Ваше имя</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  maxLength={120}
                  placeholder="Иван Иванов"
                />
              </label>

              <label>
                <span>E‑mail</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  placeholder="you@example.com"
                />
              </label>

              <label>
                <span>Тема</span>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  maxLength={140}
                  placeholder="Вопрос по заказу"
                />
              </label>

              <label>
                <span>Сообщение</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  required
                  rows={6}
                  placeholder="Опишите ваш запрос"
                />
              </label>

              <p className={styles.legal}>
                Отправляя запрос, вы подтверждаете, что ознакомились с нашей <a href="/privacy">Политикой конфиденциальности</a>.
                Правовое основание обработки: исполнение преддоговорных мер/ответ на запрос (ст. 6(1)(b) DSGVO) или наш законный интерес (ст. 6(1)(f) DSGVO).
              </p>

              <button type="submit" className={styles.button}>Отправить</button>
            </form>
          ) : (
            <div className={styles.success} role="status" aria-live="polite">
              <p><strong>Спасибо!</strong> Ваше сообщение отправлено. Мы свяжемся с вами по указанному адресу электронной почты.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2>Как нас найти</h2>
        <p>
          В целях защиты данных мы не встраиваем внешние карты по умолчанию. Откройте маршрут во внешнем сервисе:
          {" "}
          <a href="&lt;ссылка на OpenStreetMap/Google Maps с координатами офиса&gt;" rel="noopener noreferrer" target="_blank">
            показать на карте
          </a>.
        </p>
      </section>

      <section>
        <h2>Часы работы</h2>
        <ul>
          <li>Пн–Пт: 09:00–18:00 (CET/CEST)</li>
          <li>Сб–Вс и праздничные дни: выходной</li>
        </ul>
      </section>

    </main>
  );
}