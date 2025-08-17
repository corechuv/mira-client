import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.scss";
import Icon from "./Icon";

type Side = "right" | "left" | "bottom";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number;     // px (для left/right)
  side?: Side;
  children: React.ReactNode;
};

// создаём/находим корень для порталов
const getModalRoot = () => {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("pm-modal-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "pm-modal-root";
    document.body.appendChild(el);
  }
  return el;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  width = 360,
  side = "right",
  children,
}: Props) {
  // Esc для закрытия
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // блокируем прокрутку при открытии
  useEffect(() => {
    if (!isOpen) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prevHtmlOverflow; };
  }, [isOpen]);

  const content = (
    <div className={styles.root} data-open={isOpen ? "true" : "false"} aria-hidden={!isOpen}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside
        className={styles.drawer}
        style={{ width: side === "bottom" ? undefined : width }}
        data-side={side}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.head}>
          <div className={styles.title}>{title}</div>
          <div className={styles.btnIcon} onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size="1.8rem" />
          </div>
        </div>
        <div className={styles.body}>{children}</div>
      </aside>
    </div>
  );

  const root = getModalRoot();
  if (!root) return content;
  return createPortal(content, root);
}
