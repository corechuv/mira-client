// src/components/Reviews.tsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "./Reviews.module.scss";
import type { Review } from "@/types";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";

type Props = { productId: string };

const LS_VOTES = "pm.reviews.votes.v1";

function loadVotes(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_VOTES) || "[]"); }
  catch { return []; }
}
function saveVotes(ids: string[]) {
  localStorage.setItem(LS_VOTES, JSON.stringify(ids));
}

const Stars: React.FC<{
  value: number;
  size?: "sm" | "md";
  onChange?: (v: 1 | 2 | 3 | 4 | 5) => void;
  interactive?: boolean;
}> = ({ value, size = "md", onChange, interactive }) => {
  const { t } = useI18n();
  const arr = [1, 2, 3, 4, 5] as const;
  return (
    <div className={`${styles.stars} ${styles[size]}`} role={interactive ? "radiogroup" : undefined}>
      {arr.map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} ${t("stars.of5")}`}
          aria-checked={value >= n}
          className={value >= n ? styles.starOn : styles.starOff}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default function Reviews({ productId }: Props) {
  const { t } = useI18n();
  const [all, setAll] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [votes, setVotes] = useState<string[]>(() => loadVotes());

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await api.reviews.list(productId);
        if (mounted) setAll(list);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [productId]);

  const list = useMemo(() => all.filter((r) => r.productId === productId), [all, productId]);

  const [sort, setSort] = useState<"new" | "helpful" | "rating_desc" | "rating_asc">("new");
  const [onlyRating, setOnlyRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [limit, setLimit] = useState(4);

  const filtered = useMemo(() => (onlyRating ? list.filter((r) => r.rating === onlyRating) : list), [list, onlyRating]);

  const shown = useMemo(() => {
    let arr = filtered.slice();
    switch (sort) {
      case "helpful":
        arr.sort((a, b) => b.helpful - a.helpful || +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      case "rating_desc":
        arr.sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      case "rating_asc":
        arr.sort((a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      default:
        arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
    }
    return arr.slice(0, limit);
  }, [filtered, sort, limit]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const sum = filtered.reduce((s, r) => s + r.rating, 0);
    const avg = total ? +(sum / total).toFixed(2) : 0;
    const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filtered.forEach((r) => { dist[r.rating as 1 | 2 | 3 | 4 | 5]++; });
    return { total, avg, dist };
  }, [filtered]);

  const vote = async (id: string) => {
    if (votes.includes(id)) return;
    const nv = [...votes, id];
    setVotes(nv); saveVotes(nv);
    setAll((prev) => prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r)));
    try { await api.reviews.vote(id); } catch { /* optimistic */ }
  };

  const [name, setName] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const author = name.trim();
    const body = text.trim();
    if (!author || !body) return;
    setSubmitting(true);
    try {
      const created = await api.reviews.add({ productId, author, rating, text: body });
      setAll((prev) => [created, ...prev]);
      setName(""); setText(""); setRating(5);
      if (onlyRating && onlyRating !== rating) setOnlyRating(0);
    } catch {
      alert(t("reviews.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.score}>
          <div className={styles.avg}>{stats.avg.toFixed(1)}</div>
          <Stars value={Math.round(stats.avg)} size="md" />
          <div className={styles.total}>{stats.total} {t("reviews.reviews")}</div>
        </div>

        <ul className={styles.dist}>
          {[5, 4, 3, 2, 1].map((n) => {
            const count = stats.dist[n as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
            return (
              <li key={n} className={styles.distRow}>
                <button
                  className={`${styles.badge} ${onlyRating === n ? styles.badgeActive : ""}`}
                  onClick={() => setOnlyRating(onlyRating === (n as any) ? 0 : (n as any))}
                >
                  {n}★
                </button>
                <div className={styles.bar}><span style={{ width: `${pct}%` }} /></div>
                <span className={styles.count}>{count}</span>
              </li>
            );
          })}
        </ul>

        <div className={styles.controls}>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="new">{t("reviews.sort.new")}</option>
            <option value="helpful">{t("reviews.sort.helpful")}</option>
            <option value="rating_desc">{t("reviews.sort.high")}</option>
            <option value="rating_asc">{t("reviews.sort.low")}</option>
          </select>
        </div>
      </div>

      {loading && list.length === 0 && (
        <div className="card" style={{ padding: ".8rem" }}>{t("reviews.loading")}</div>
      )}

      <div className={styles.list}>
        {shown.map((r) => (
          <article key={r.id} className={`card-item ${styles.item}`}>
            <header className={styles.itemHead}>
              <div className={styles.author}>{r.author}</div>
              <div className={styles.meta}>
                <Stars value={r.rating} size="sm" />
                <span className={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </header>
            <p className={styles.text}>{r.text}</p>
            <footer className={styles.itemFoot}>
              <button
                className="btn"
                onClick={() => vote(r.id)}
                disabled={votes.includes(r.id)}
                aria-label={t("reviews.helpfulAria")}
                title={t("reviews.helpfulAria")}
              >
                {t("reviews.helpfulCount").replace("{n}", String(r.helpful))}
              </button>
            </footer>
          </article>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="card" style={{ padding: ".8rem" }}>
            {t("reviews.empty")}
          </div>
        )}
      </div>

      {shown.length < filtered.length && (
        <div className={styles.moreRow}>
          <button className="btn" onClick={() => setLimit((l) => l + 4)}>{t("common.showMore")}</button>
        </div>
      )}

      <form className={`card ${styles.form}`} onSubmit={submit}>
        <h4 className={styles.formTitle}>{t("reviews.addTitle")}</h4>
        <div className={styles.ratingRow}>
          <span>{t("reviews.yourRating")}</span>
          <Stars value={rating} size="md" interactive onChange={setRating} />
        </div>
        <input
          className="input"
          placeholder={t("reviews.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder={t("reviews.textPlaceholder")}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button className="btn btnPrimary" type="submit" disabled={submitting}>
          {submitting ? t("reviews.submitting") : t("reviews.submit")}
        </button>
      </form>
    </section>
  );
}
