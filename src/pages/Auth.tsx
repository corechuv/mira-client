// src/pages/Auth.tsx
import { useState } from "react";
import styles from "./Auth.module.scss";
import { Link, navigate } from "@/router/Router";
import { useAuth } from "@/contexts/AuthContext";
import LogoMark from "@/components/Logo/LogoMark";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login, register } = useAuth();

  // общие поля
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // регистрация
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(true);

  const nextURL = (() => {
    try { return new URL(window.location.href).searchParams.get("next") || "/"; }
    catch { return "/"; }
  })();

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(nextURL);
    } catch (err: any) {
      setError(err?.message || "Не удалось войти.");
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agree) { setError("Необходимо согласиться с условиями."); return; }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(nextURL);
    } catch (err: any) {
      setError(err?.message || "Не удалось создать аккаунт.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <LogoMark className={styles.logoMark} title="Mira Logo" />
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? styles.tabActive : styles.tab}
            onClick={() => setMode("login")}
          >
            Вход
          </button>
          <button
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? styles.tabActive : styles.tab}
            onClick={() => setMode("register")}
          >
            Регистрация
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {mode === "login" ? (
          <form className={styles.form} onSubmit={onLogin}>
            <label className={styles.field}>
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Пароль</span>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </label>
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? "Входим..." : "Войти"}
            </button>

            <div className={styles.alt}>
              Нет аккаунта?{" "}
              <button type="button" className={styles.linkBtn} onClick={()=>setMode("register")}>Создать</button>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={onRegister}>
            <label className={styles.field}>
              <span>Имя</span>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Имя" />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Пароль</span>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
              <span>Я согласен с условиями и политикой конфиденциальности.</span>
            </label>
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? "Создаём..." : "Создать аккаунт"}
            </button>

            <div className={styles.alt}>
              Уже есть аккаунт?{" "}
              <button type="button" className={styles.linkBtn} onClick={()=>setMode("login")}>Войти</button>
            </div>
          </form>
        )}

        <div className={styles.backRow}>
          <Link to="/" className="btn">На главную</Link>
        </div>
      </div>
    </div>
  );
}
