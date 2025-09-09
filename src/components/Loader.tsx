import React from "react";
import styles from "./Loader.module.scss";

type Props = {
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  className?: string;
};

export default function Loader({ size = 28, stroke = 3, label, className }: Props) {
  return (
    <div className={`${styles.wrap} ${className || ""}`} role="status" aria-live="polite">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className={styles.spinner}
        aria-hidden="true"
      >
        <circle className={styles.track} cx="25" cy="25" r="20" fill="none" strokeWidth={stroke} />
        <circle
          className={styles.indicator}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
