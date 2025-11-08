import React from "react";
import styles from "./Banners.module.scss";

export type BannerItem = {
  image: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  alt?: string;
};

export type BannersProps = {
  items: BannerItem[];
  /** по умолчанию 100svh (высота экрана с учётом мобильных панелей) */
  fullScreen?: boolean;
};

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

const Banners: React.FC<BannersProps> = ({ items, fullScreen = true }) => {
  if (!items?.length) return null;

  return (
    <section
      className={cx(styles.stack, fullScreen && styles.stackFull)}
      aria-label="Промо баннеры"
    >
      {items.map((item, idx) => {
        const side = idx % 2 === 0 ? "left" : "right";
        return (
          <article
            className={cx(styles.banner, styles[side])}
            key={`${item.image}-${idx}`}
            aria-roledescription="баннер"
          >
            {/* Само изображение на заднем плане */}
            <img
              className={styles.bg}
              src={item.image}
              alt={item.alt ?? item.title ?? ""}
              loading="lazy"
              decoding="async"
            />

            {/* Затемнение/градиент под текст для читабельности */}
            <div className={styles.overlay} aria-hidden="true" />

            {/* Контентная карточка (плоская) */}
            <div className={styles.content}>
              {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
              {item.title && <h2 className={styles.title}>{item.title}</h2>}
              {item.description && <p className={styles.desc}>{item.description}</p>}
              {item.ctaHref && item.ctaLabel && (
                <a className={styles.cta} href={item.ctaHref}>
                  {item.ctaLabel}
                </a>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default Banners;
