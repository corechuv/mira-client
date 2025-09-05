// src/components/ThemeToggle.tsx
import Icon from "./Icon";
import styles from "./ThemeToggle.module.scss";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-label={isLight ? "Переключить на тёмную тему" : "Переключить на светлую тему"}
      title={isLight ? "Dark" : "Light"}
    >
      <span className={styles.icon} aria-hidden>
        {isLight ? <Icon name="moon" /> : <Icon name="sun" />}
      </span>
      <span className={styles.label}>{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}
