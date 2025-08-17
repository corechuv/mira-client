import { Link } from "@/router/Router";
import styles from "./Breadcrumbs.module.scss";

export type Crumb = {
  label: string;
  to?: string;                 // обычный переход (Link)
  onClick?: () => void;        // произвольное действие (напр. setFilterPath + navigate)
  current?: boolean;           // последний/текущий сегмент
};

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className={styles.wrap} aria-label="Хлебные крошки">
      <ol className={styles.list}>
        {items.map((c, i) => {
          const isLast = i === items.length - 1 || c.current;
          return (
            <li key={`${c.label}_${i}`} className={styles.item} aria-current={isLast ? "page" : undefined}>
              {!isLast && c.to ? (
                <Link to={c.to} className={styles.link}>{c.label}</Link>
              ) : !isLast && c.onClick ? (
                <button className={styles.linkButton} onClick={c.onClick}>{c.label}</button>
              ) : (
                <span className={styles.current}>{c.label}</span>
              )}
              {!isLast && <span className={styles.sep}>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
