// src/components/Field.tsx
import styles from "./Field.module.scss";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export default function Field({ label, hint, error, children }: Props) {
  return (
    <label className={styles.field}>
      <div className={styles.row}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      <div>{children}</div>
      {error && <div className={styles.error}>{error}</div>}
    </label>
  );
}