// src/components/ProductsRail.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ProductsRail.module.scss";
import { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import Icon from "./Icon";

type Props = {
  title?: string;
  items: Product[];
  excludeId?: string;
  showControls?: boolean; // стрелки даже без title
};

export default function ProductsRail({ title, items, excludeId, showControls = true }: Props) {
  const list = useMemo(
    () => (excludeId ? items.filter((p) => p.id !== excludeId) : items),
    [items, excludeId]
  );

  const ref = useRef<HTMLDivElement | null>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanL(scrollLeft > 2);
    setCanR(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateArrows();

    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateArrows);
      ro.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [updateArrows]);

  // если список поменялся — пересчитать состояние стрелок
  useEffect(() => {
    updateArrows();
  }, [updateArrows, list.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  // ВАЖНО: guard только после всех хуков
  if (!list.length) return null;

  return (
    <section className={styles.wrap}>
      {(title || showControls) && (
        <div className={styles.head}>
          <h3>{title}</h3>
          {showControls && (
            <div className={styles.controls}>
              <button className={styles.btnIcon} onClick={() => scrollBy(-1)} disabled={!canL} aria-label="Назад">
                <Icon name="arrow-left" size="1.8rem" />
              </button>
              <button className={styles.btnIcon} onClick={() => scrollBy(1)} disabled={!canR} aria-label="Вперёд">
                <Icon name="arrow-right" size="1.8rem" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.viewport}>

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
