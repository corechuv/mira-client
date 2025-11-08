// src/pages/Auth.tsx
import { useState } from "react";
import styles from "./Auth.module.scss";
import { Link, navigate } from "@/router/Router";
import { useAuth } from "@/contexts/AuthContext";
import LogoMark from "@/components/Logo/LogoMark";
import { useI18n } from "@/i18n/I18nContext";

export default function Auth() {
  const { t } = useI18n();

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
      setError(err?.message || t("auth.err.loginFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agree) { setError(t("auth.err.agreeRequired")); return; }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(nextURL);
    } catch (err: any) {
      setError(err?.message || t("auth.err.registerFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src="/logo_full.png" />
        </div>
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? styles.tabActive : styles.tab}
            onClick={() => setMode("login")}
          >
            {t("auth.tabs.login")}
          </button>
          <button
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? styles.tabActive : styles.tab}
            onClick={() => setMode("register")}
          >
            {t("auth.tabs.register")}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {mode === "login" ? (
          <form className={styles.form} onSubmit={onLogin}>
            <label className={styles.field}>
              <span>{t("auth.field.email")}</span>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>{t("auth.field.password")}</span>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </label>
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? t("auth.btn.login.busy") : t("auth.btn.login")}
            </button>

            <div className={styles.alt}>
              {t("auth.switch.noAccount")}{" "}
              <button type="button" className={styles.linkBtn} onClick={()=>setMode("register")}>
                {t("auth.switch.create")}
              </button>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={onRegister}>
            <label className={styles.field}>
              <span>{t("auth.field.name")}</span>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder={t("auth.field.name")} />
            </label>
            <label className={styles.field}>
              <span>{t("auth.field.email")}</span>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>{t("auth.field.password")}</span>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
              <span>{t("auth.agree")}</span>
            </label>
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? t("auth.btn.register.busy") : t("auth.btn.register")}
            </button>

            <div className={styles.alt}>
              {t("auth.switch.haveAccount")}{" "}
              <button type="button" className={styles.linkBtn} onClick={()=>setMode("login")}>
                {t("auth.switch.login")}
              </button>
            </div>
          </form>
        )}

        <div className={styles.backRow}>
          <Link to="/" className="btn">{t("auth.backHome")}</Link>
        </div>
      </div>
    </div>
  );
}
