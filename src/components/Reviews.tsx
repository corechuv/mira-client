import React, { useEffect, useMemo, useState } from "react";
import styles from "./Reviews.module.scss";
import { Review, seedReviews } from "@/data/reviews";

type Props = { productId: string };

const LS_KEY = "pm.reviews.v1";
const LS_VOTES = "pm.reviews.votes.v1";

function loadAll(): Review[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Review[];
  } catch {}
  // если пусто — засеять дефолт
  localStorage.setItem(LS_KEY, JSON.stringify(seedReviews));
  return seedReviews;
}

function saveAll(list: Review[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function loadVotes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_VOTES) || "[]");
  } catch {
    return [];
  }
}
function saveVotes(ids: string[]) {
  localStorage.setItem(LS_VOTES, JSON.stringify(ids));
}

const Stars: React.FC<{ value: number; size?: "sm" | "md"; onChange?: (v: 1|2|3|4|5)=>void; interactive?: boolean }> = ({ value, size="md", onChange, interactive }) => {
  const arr = [1,2,3,4,5] as const;
  return (
    <div className={`${styles.stars} ${styles[size]}`} role={interactive ? "radiogroup" : undefined}>
      {arr.map(n => (
        <button
          key={n}
          type="button"
          aria-label={`${n} из 5`}
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
  const [all, setAll] = useState<Review[]>(() => loadAll());
  const [votes, setVotes] = useState<string[]>(() => loadVotes());
  const list = useMemo(() => all.filter(r => r.productId === productId), [all, productId]);

  // агрегаты
  const stats = useMemo(() => {
    const total = list.length;
    const sum = list.reduce((s, r) => s + r.rating, 0);
    const avg = total ? +(sum / total).toFixed(2) : 0;
    const dist: Record<1|2|3|4|5, number> = {1:0,2:0,3:0,4:0,5:0};
    list.forEach(r => { dist[r.rating as 1|2|3|4|5]++; });
    return { total, avg, dist };
  }, [list]);

  // управление: сорт/фильтр/пагинация
  const [sort, setSort] = useState<"new"|"helpful"|"rating_desc"|"rating_asc">("new");
  const [onlyRating, setOnlyRating] = useState<0|1|2|3|4|5>(0);
  const [limit, setLimit] = useState(4);

  const shown = useMemo(() => {
    let arr = list.slice();
    if (onlyRating) arr = arr.filter(r => r.rating === onlyRating);
    switch (sort) {
      case "helpful": arr.sort((a,b)=> b.helpful - a.helpful || +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      case "rating_desc": arr.sort((a,b)=> b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      case "rating_asc": arr.sort((a,b)=> a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      default: arr.sort((a,b)=> +new Date(b.createdAt) - +new Date(a.createdAt)); break;
    }
    return arr.slice(0, limit);
  }, [list, sort, onlyRating, limit]);

  // голос "полезно"
  const vote = (id: string) => {
    if (votes.includes(id)) return;
    const next = all.map(r => r.id === id ? { ...r, helpful: r.helpful + 1 } : r);
    setAll(next); saveAll(next);
    const nv = [...votes, id]; setVotes(nv); saveVotes(nv);
  };

  // форма добавления
  const [name, setName] = useState("");
  const [rating, setRating] = useState<1|2|3|4|5>(5);
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const review: Review = {
      id: crypto.randomUUID(),
      productId,
      author: name.trim(),
      rating,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      helpful: 0,
    };
    const next = [review, ...all];
    setAll(next); saveAll(next);
    setName(""); setText(""); setRating(5);
    if (onlyRating && onlyRating !== rating) setOnlyRating(0);
  };

  useEffect(() => {
    // если список пуст и нет seed по этому товару — ничего не делаем.
  }, [productId]);

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.score}>
          <div className={styles.avg}>{stats.avg.toFixed(1)}</div>
          <Stars value={Math.round(stats.avg)} size="md" />
          <div className={styles.total}>{stats.total} отзывов</div>
        </div>

        <ul className={styles.dist}>
          {[5,4,3,2,1].map((n) => {
            const count = stats.dist[n as 1|2|3|4|5] || 0;
            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
            return (
              <li key={n} className={styles.distRow}>
                <button
                  className={`${styles.badge} ${onlyRating === n ? styles.badgeActive : ""}`}
                  onClick={() => setOnlyRating(onlyRating === (n as any) ? 0 : (n as any))}
                >
                  {n}★
                </button>
                <div className={styles.bar}>
                  <span style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.count}>{count}</span>
              </li>
            );
          })}
        </ul>

        <div className={styles.controls}>
          <select className="input" value={sort} onChange={e => setSort(e.target.value as any)}>
            <option value="new">Сначала новые</option>
            <option value="helpful">Сначала полезные</option>
            <option value="rating_desc">С высокой оценкой</option>
            <option value="rating_asc">С низкой оценкой</option>
          </select>
        </div>
      </div>

      <div className={styles.list}>
        {shown.map(r => (
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
                aria-label="Отзыв был полезен"
                title="Отзыв был полезен"
              >
                👍 Полезно {r.helpful}
              </button>
            </footer>
          </article>
        ))}
        {list.length === 0 && (
          <div className="card" style={{ padding: ".8rem" }}>
            Пока нет отзывов — будьте первым!
          </div>
        )}
      </div>

      {shown.length < list.length && (
        <div className={styles.moreRow}>
          <button className="btn" onClick={() => setLimit(l => l + 4)}>Показать ещё</button>
        </div>
      )}

      <form className={`card ${styles.form}`} onSubmit={submit}>
        <h4 className={styles.formTitle}>Добавить отзыв</h4>
        <div className={styles.ratingRow}>
          <span>Ваша оценка:</span>
          <Stars value={rating} size="md" interactive onChange={setRating} />
        </div>
        <input
          className="input"
          placeholder="Имя"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          className="input"
          placeholder="Ваш отзыв"
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          required
        />
        <button className="btn btnPrimary" type="submit">Опубликовать</button>
      </form>
    </section>
  );
}
