import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ProductsRail.module.scss";
import { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";

type Props = {
  title?: string;
  items: Product[];
  excludeId?: string;
  showControls?: boolean; // NEW: стрелки даже без title
};

export default function ProductsRail({ title, items, excludeId, showControls = true }: Props) {
  const list = useMemo(
    () => (excludeId ? items.filter((p) => p.id !== excludeId) : items),
    [items, excludeId]
  );

  if (!list.length) return null;

  const ref = useRef<HTMLDivElement | null>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const updateArrows = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanL(scrollLeft > 2);
    setCanR(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    updateArrows();
    const el = ref.current;
    if (!el) return;
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // если список поменялся — пересчитать состояние стрелок
  useEffect(() => {
    updateArrows();
  }, [list.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className={styles.wrap}>
      {(title || showControls) && (
        <div className={styles.head}>
          <h3>{title}</h3>
          {showControls && (
            <div className={styles.controls}>
              <button className="btn" onClick={() => scrollBy(-1)} disabled={!canL} aria-label="Назад">←</button>
              <button className="btn" onClick={() => scrollBy(1)} disabled={!canR} aria-label="Вперёд">→</button>
            </div>
          )}
        </div>
      )}

      <div className={styles.viewport}>
        <div className={styles.gradientLeft} aria-hidden />
        <div className={styles.gradientRight} aria-hidden />

        <div ref={ref} className={styles.track}>
          {list.map((p) => (
            <div key={p.id} className={styles.item}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
