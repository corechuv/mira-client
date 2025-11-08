// src/components/CatalogTiles/CatalogTiles.tsx
import React from "react";
import styles from "./CatalogTiles.module.scss";

export type CatalogItem = {
  id: string;
  title: string;
  image: string; // URL или импорт ассета
  href?: string; // если есть ссылка на категорию
  onClick?: () => void; // альтернативно — обработчик клика
};

export type CatalogTilesProps = {
  items: CatalogItem[];
  /** Минимальная ширина плитки для авто-сетки (по умолчанию 180px) */
  minTileWidth?: number;
  /** Добавочный className при необходимости */
  className?: string;
  /** Заголовок блока (опционально) */
  heading?: string;
};

const CatalogTiles: React.FC<CatalogTilesProps> = ({
  items,
  minTileWidth = 180,
  className,
  heading,
}) => {
  return (
    <section
      className={[styles.wrapper, className].filter(Boolean).join(" ")}
      style={{ ["--tile-min" as any]: `${minTileWidth}px` }}
      aria-label={heading || "Каталог косметологических аппаратов"}
    >
      {heading && <h2 className={styles.heading}>{heading}</h2>}
      <div className={styles.grid}>
        {items.map((item) => {
          const content = (
            <>
              <div className={styles.media}>
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className={styles.image}
                />
              </div>
              <div className={styles.title}>
                <span>{item.title}</span>
              </div>
            </>
          );

          return item.href ? (
            <a
              key={item.id}
              href={item.href}
              className={styles.card}
              aria-label={item.title}
            >
              {content}
            </a>
          ) : (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={item.onClick}
              aria-label={item.title}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CatalogTiles;
