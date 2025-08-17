import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SearchOverlay.module.scss";
import { products as seed } from "@/data/products";
import { useProducts } from "@/contexts/ProductsContext";
import { Link, navigate } from "@/router/Router";
import Icon from "./Icon";

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
  // не монтируем в DOM, если закрыт
  if (!isOpen) return null;

  const { setSearch, setFilterPath } = useProducts();
  const [q, setQ] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // автофокус и установка стартового значения
  useEffect(() => {
    setQ(initialQuery || "");
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [initialQuery]);

  // ESC для закрытия
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // блок скролла (надёжно: html + body) и корректный откат
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
    setFilterPath([]); // сбрасываем путь
    setSearch(q);      // прокидываем поисковый текст
    onClose();
    navigate("/catalog");
  };

  const content = (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Поиск по каталогу">
      <div className={styles.backdrop} onClick={onClose} />

      {/* сцена: хиро (адаптивная высота) + скроллируемые результаты */}
      <div className={styles.stage}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.inner}>
            <form className={styles.searchForm} onSubmit={(e) => { e.preventDefault(); openAll(); }}>
              <div className={styles.searchBox}>
                <input
                  ref={inputRef}
                  className={styles.searchInput + " input"}
                  placeholder="Поиск по товарам…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск"
                />
                {!!q && (
                  <div
                    className={styles.clearBtn}
                    onClick={() => setQ("")}
                    aria-label="Очистить"
                  >
                    <Icon name="close" size="1.1rem" />
                  </div>
                )}
              </div>

              <button type="submit" className="btn btnPrimary">Все результаты</button>
            </form>

            {/* подсказки */}
            <div className={styles.trends}>
              <span className={styles.trendLabel}>Популярное:</span>
              {["Наушники", "Кроссовки", "Лампа", "Куртка"].map(t => (
                <button
                  key={t}
                  type="button"
                  className={styles.trend}
                  onClick={() => setQ(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Кнопка закрытия — не перекрывает инпут */}
          <div
            className={styles.closeBtn + ""}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <Icon name="close" size="1.8rem" />
          </div>
        </section>

        {/* РЕЗУЛЬТАТЫ */}
        <section className={styles.results}>
          <div className={styles.inner}>
            {!q && (
              <div className={styles.hint}>
                Введите запрос: название товара, категорию или часть описания.
              </div>
            )}

            {q && results.length === 0 && (
              <div className={styles.empty}>
                Ничего не найдено. <button className="btn" onClick={openAll}>Открыть каталог</button>
              </div>
            )}

            {results.length > 0 && (
              <>
                <ul className={styles.list} role="listbox" aria-label="Результаты поиска">
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
                    Показать все результаты
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
