// src/components/SearchOverlay.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SearchOverlay.module.scss";
import { products as seed } from "@/data/products";
import { useProducts } from "@/contexts/ProductsContext";
import { Link, navigate } from "@/router/Router";
import Icon from "./Icon";
import { useI18n } from "@/i18n/I18nContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
};

const getRoot = () => {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("pm-modal-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "pm-modal-root";
    document.body.appendChild(el);
  }
  return el;
};

const fmtEUR = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function SearchOverlay({ isOpen, onClose, initialQuery = "" }: Props) {
  if (!isOpen) return null;

  const { t } = useI18n();
  const { setSearch, setFilterPath } = useProducts();
  const [q, setQ] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQ(initialQuery || "");
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [initialQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow || "";
      body.style.overflow = prevBodyOverflow || "";
    };
  }, []);

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return [];
    return seed
      .filter(p =>
        p.title.toLowerCase().includes(qq) ||
        p.short.toLowerCase().includes(qq) ||
        p.description.toLowerCase().includes(qq)
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
  }, [q]);

  const openAll = () => {
    setFilterPath([]);
    setSearch(q);
    onClose();
    navigate("/catalog");
  };

  const trendKeys = ["vitamins", "omega3", "care", "gels"] as const;

  const content = (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={t("search.overlay.aria")}>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.stage}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.inner}>
            <form className={styles.searchForm} onSubmit={(e) => { e.preventDefault(); openAll(); }}>
              <div className={styles.searchBox}>
                <input
                  ref={inputRef}
                  className={styles.searchInput + " input"}
                  placeholder={t("search.input.placeholder")}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label={t("search.input.aria")}
                />
                {!!q && (
                  <div
                    className={styles.clearBtn}
                    onClick={() => setQ("")}
                    aria-label={t("search.clear")}
                    role="button"
                  >
                    <Icon name="close" size="1.1rem" />
                  </div>
                )}
              </div>

              <button type="submit" className="btn btnPrimary">{t("search.allResults")}</button>
            </form>

            {/* подсказки */}
            <div className={styles.trends}>
              <span className={styles.trendLabel}>{t("search.trending")}</span>
              {trendKeys.map((k) => {
                const label = t(`search.trend.${k}`);
                return (
                  <button
                    key={k}
                    type="button"
                    className={styles.trend}
                    onClick={() => setQ(label)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Кнопка закрытия */}
          <div
            className={styles.closeBtn + ""}
            onClick={onClose}
            aria-label={t("search.close")}
            role="button"
          >
            <Icon name="close" size="1.8rem" />
          </div>
        </section>

        {/* РЕЗУЛЬТАТЫ */}
        <section className={styles.results}>
          <div className={styles.inner}>
            {!q && (
              <div className={styles.hint}>
                {t("search.prompt")}
              </div>
            )}

            {q && results.length === 0 && (
              <div className={styles.empty}>
                {t("search.empty")}{" "}
                <button className="btn" onClick={openAll}>{t("search.openCatalog")}</button>
              </div>
            )}

            {results.length > 0 && (
              <>
                <ul className={styles.list} role="listbox" aria-label={t("search.results.aria")}>
                  {results.map(p => (
                    <li key={p.id} className={styles.item}>
                      <Link to={`/product/${p.slug}`} className={styles.itemLink} onClick={onClose}>
                        <div className={styles.thumb}>
                          <img src={p.imageUrl} alt={p.title} />
                        </div>
                        <div className={styles.meta}>
                          <div className={styles.titleRow}>
                            <span className={styles.title}>{p.title}</span>
                            <span className="badge">{p.category}</span>
                          </div>
                          <div className={styles.short}>{p.short}</div>
                          <div className={styles.row}>
                            <span className={styles.price}>{fmtEUR(p.price)}</span>
                            <span className={styles.rating}>★ {p.rating}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className={styles.footerBar}>
                  <button className="btn btnPrimary" onClick={openAll}>
                    {t("search.showAll")}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const root = getRoot();
  return root ? createPortal(content, root) : content;
}
