// src/pages/Auth.tsx
import { useState } from "react";
import styles from "./Auth.module.scss";
import { Link, navigate } from "@/router/Router";
import { useAuth } from "@/contexts/AuthContext";

type User = { id: string; name: string; email: string };
type StoredUser = User & { password: string };

const USERS_KEY = "pm.users.v1";

function loadUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function saveUsers(list: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  const auth = useAuth();

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

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const users = loadUsers();
    const u = users.find(x => x.email.trim().toLowerCase() === email.trim().toLowerCase());

    // Если хочешь проверять пароль — раскомментируй:
    // if (!u || u.password !== password) { setError("Неверный email или пароль."); return; }

    const displayName = u?.name?.trim() || (email.includes("@") ? email.split("@")[0] : "User");
    try { auth.login(email.trim(), displayName); } catch {}
    navigate(nextURL);
  };

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agree) { setError("Необходимо согласиться с условиями."); return; }

    const users = loadUsers();
    if (users.some(x => x.email.trim().toLowerCase() === email.trim().toLowerCase())) {
      setError("Пользователь с таким email уже существует.");
      return;
    }
    const newU: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim() || (email.includes("@") ? email.split("@")[0] : "User"),
      email: email.trim(),
      password,
    };
    saveUsers([newU, ...users]);

    try { auth.login(newU.email, newU.name); } catch {}
    navigate(nextURL);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <img className={styles.logo} src="/logo.png" alt="Mira" />
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
            <button className="btn btnPrimary" type="submit">Войти</button>

            <div className={styles.alt}>
              Нет аккаунта?{" "}
              <button type="button" className={styles.linkBtn} onClick={()=>setMode("register")}>Создать</button>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={onRegister}>
            <label className={styles.field}>
              <span>Имя</span>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Как к вам обращаться" />
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
            <button className="btn btnPrimary" type="submit">Создать аккаунт</button>

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
