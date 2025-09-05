// src/components/FiltersPanel.tsx
import { useMemo, useState } from "react";
import styles from "./FiltersPanel.module.scss";
import { useProducts, SortKey } from "@/contexts/ProductsContext";
import { categories } from "@/data/categories";
import { useI18n } from "@/i18n/I18nContext";

type Props = {
  onApply?: () => void;
  inModal?: boolean;
};

/* ===== Dual range ===== */
function DualRange({
  min, max, from, to, onFrom, onTo, ariaFrom, ariaTo,
}: {
  min: number; max: number; from: number; to: number;
  onFrom: (n: number) => void; onTo: (n: number) => void;
  ariaFrom: string; ariaTo: string;
}) {
  const [active, setActive] = useState<"from" | "to" | null>(null);

  const span = Math.max(1, max - min);
  const pct = (n: number) => ((n - min) / span) * 100;
  const pFrom = pct(from);
  const pTo = pct(to);

  const bg = `linear-gradient(to right,
    rgba(255,255,255,.18) 0%,
    rgba(255,255,255,.18) ${pFrom}%,
    var(--pink) ${pFrom}%,
    var(--pink) ${pTo}%,
    rgba(255,255,255,.18) ${pTo}%,
    rgba(255,255,255,.18) 100%)`;

  const toNum = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className={styles.rangeWrap} style={{ background: bg }}>
      {/* левая ручка */}
      <input
        aria-label={ariaFrom}
        type="range"
        min={min}
        max={max}
        step={1}
        value={from}
        onChange={(e) => onFrom(Math.min(toNum(e.target.value), to))}
        onMouseDown={() => setActive("from")}
        onTouchStart={() => setActive("from")}
        onMouseUp={() => setActive(null)}
        onTouchEnd={() => setActive(null)}
        className={styles.range}
        style={{ zIndex: active === "from" ? 2 : 1 }}
      />

      {/* правая ручка */}
      <input
        aria-label={ariaTo}
        type="range"
        min={min}
        max={max}
        step={1}
        value={to}
        onChange={(e) => onTo(Math.max(toNum(e.target.value), from))}
        onMouseDown={() => setActive("to")}
        onTouchStart={() => setActive("to")}
        onMouseUp={() => setActive(null)}
        onTouchEnd={() => setActive(null)}
        className={styles.range}
        style={{ zIndex: active === "to" ? 2 : 1 }}
      />
    </div>
  );
}

/* ===== Панель фильтров ===== */
export default function FiltersPanel({ onApply, inModal }: Props) {
  const { t } = useI18n();

  const {
    search, setSearch,
    sort, setSort,
    filterPath, setFilterPath,
    priceFrom, setPriceFrom,
    priceTo, setPriceTo,
    priceBounds,
    ratingMin, setRatingMin,
    resetFilters,
  } = useProducts();

  /* категории 1-2-3 уровня */
  const cat1 = filterPath[0] || "";
  const cat2 = filterPath[1] || "";
  const cat3 = filterPath[2] || "";

  const opts1 = useMemo(() => categories.map(c => c.title), []);
  const opts2 = useMemo(() => {
    const c = categories.find(x => x.title === cat1);
    return c?.children?.map(s => s.title) || [];
  }, [cat1]);
  const opts3 = useMemo(() => {
    const c = categories.find(x => x.title === cat1);
    const s = c?.children?.find(x => x.title === cat2);
    return s?.children?.map(l => l.title) || [];
  }, [cat1, cat2]);

  const onCat1 = (v: string) => v ? setFilterPath([v]) : setFilterPath([]);
  const onCat2 = (v: string) => v ? setFilterPath([cat1, v]) : setFilterPath([cat1]);
  const onCat3 = (v: string) => v ? setFilterPath([cat1, cat2, v]) : setFilterPath([cat1, cat2]);

  /* цена локально (для плавного UX) */
  const [from, setFrom] = useState<number>(priceFrom);
  const [to, setTo] = useState<number>(priceTo);
  const clampFrom = (n: number) => Math.max(priceBounds.min, Math.min(n, to));
  const clampTo   = (n: number) => Math.min(priceBounds.max, Math.max(n, from));
  const changeFrom = (n: number) => { const v = clampFrom(n); setFrom(v); setPriceFrom(v); };
  const changeTo   = (n: number)   => { const v = clampTo(n);   setTo(v); setPriceTo(v); };

  const applyAndClose = () => { onApply?.(); };
  const resetAll = () => {
    resetFilters();
    setFrom(priceBounds.min);
    setTo(priceBounds.max);
  };

  const parseNum = (v: string, fallback: number) => {
    const n = Number(v); return Number.isFinite(n) ? n : fallback;
  };

  return (
    <div className={styles.panel}>
      {/* Поиск */}
      <label className={styles.field}>
        <span>{t("filters.search.label")}</span>
        <input
          className="input"
          placeholder={t("filters.search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {/* Категории */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t("filters.categories.title")}</div>

        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>{t("filters.categories.section")}</span>
            <select className="input" value={cat1} onChange={e => onCat1(e.target.value)}>
              <option value="">—</option>
              {opts1.map(ti => <option key={ti} value={ti}>{ti}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("filters.categories.subsection")}</span>
            <select className="input" value={cat2} onChange={e => onCat2(e.target.value)} disabled={!cat1}>
              <option value="">—</option>
              {opts2.map(ti => <option key={ti} value={ti}>{ti}</option>)}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span>{t("filters.categories.category")}</span>
          <select className="input" value={cat3} onChange={e => onCat3(e.target.value)} disabled={!cat2}>
            <option value="">—</option>
            {opts3.map(ti => <option key={ti} value={ti}>{ti}</option>)}
          </select>
        </label>

        {filterPath.length > 0 && (
          <div className={styles.chips}>
            <span className="badge">{filterPath.join(" / ")}</span>
            <button type="button" className="btn" onClick={() => setFilterPath([])}>
              {t("filters.categories.resetPath")}
            </button>
          </div>
        )}
      </div>

      {/* Цена */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t("filters.price.title")}</div>

        <div className={styles.priceRow}>
          <label className={styles.priceField}>
            <span>{t("filters.price.from")}</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              step={1}
              min={priceBounds.min}
              max={to}
              value={from}
              onChange={(e) => changeFrom(parseNum(e.target.value, priceBounds.min))}
            />
          </label>
          <label className={styles.priceField}>
            <span>{t("filters.price.to")}</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              step={1}
              min={from}
              max={priceBounds.max}
              value={to}
              onChange={(e) => changeTo(parseNum(e.target.value, priceBounds.max))}
            />
          </label>
        </div>

        <DualRange
          min={priceBounds.min}
          max={priceBounds.max}
          from={from}
          to={to}
          onFrom={changeFrom}
          onTo={changeTo}
          ariaFrom={t("filters.price.minAria")}
          ariaTo={t("filters.price.maxAria")}
        />

        <div className={styles.rangeLabels}>
          <span>{priceBounds.min}</span>
          <span>{priceBounds.max}</span>
        </div>
      </div>

      {/* Рейтинг */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t("filters.rating.title")}</div>
        <div className={styles.ratingChips}>
          <button
            type="button"
            className={ratingMin === 0 ? styles.chipActive : styles.chip}
            onClick={() => setRatingMin(0)}
          >
            {t("filters.rating.all")}
          </button>
          {[4, 3, 2].map(n => (
            <button
              type="button"
              key={n}
              className={ratingMin === n ? styles.chipActive : styles.chip}
              onClick={() => setRatingMin(n)}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      {/* Сортировка */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t("filters.sort.title")}</div>
        <select
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="popular">{t("sort.popular")}</option>
          <option value="price-asc">{t("sort.priceAsc")}</option>
          <option value="price-desc">{t("sort.priceDesc")}</option>
        </select>
      </div>

      {/* Кнопки */}
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={resetAll}>
          {t("filters.actions.reset")}
        </button>
        {inModal && (
          <button type="button" className="btn btnPrimary" onClick={applyAndClose}>
            {t("filters.actions.apply")}
          </button>
        )}
      </div>
    </div>
  );
}
