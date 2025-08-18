import styles from "./Footer.module.scss";
import { Link } from "@/router/Router";

type IconItem = {
  src: string;
  alt: string;
  href?: string;
  h?: number | string;     // кастомная высота (например, 18 | "22px")
  hSm?: number | string;   // высота на мобилке (опционально)
};

const payments: IconItem[] = [
  { src: "/icons/visa.svg", alt: "Visa", h: 18 },
  { src: "/icons/mastercard.svg", alt: "Mastercard", h: 34 },
];

const shipping: IconItem[] = [
  { src: "/icons/dhl.svg", alt: "DHL", h: 12, hSm: 12 },
];

const socials: IconItem[] = [
  { src: "/icons/meta.svg", alt: "Meta", href: "#", h: 34 },
  { src: "/icons/instagram.svg", alt: "Instagram", href: "#", h: 18 },
  { src: "/icons/x.svg", alt: "X", href: "#", h: 16 },
  { src: "/icons/tiktok.svg", alt: "TikTok", href: "#", h: 34 },
  { src: "/icons/youtube.svg", alt: "YouTube", href: "#", h: 30 },
];

// svg→png fallback
const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const el = e.currentTarget;
  if (el.dataset.fallback === "1") return;
  el.dataset.fallback = "1";
  el.src = el.src.replace(".svg", ".png");
};

// helper: приводит число к px
const toPx = (v?: number | string) => (typeof v === "number" ? `${v}px` : v);

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <div className={styles.brand}>
              <img src="/logo.png" alt="Mira" />
            </div>
          </div>

          <nav className={styles.links} aria-label="Ссылки">
            <Link to="/catalog">Каталог</Link>
            <Link to="/profile?tab=orders">Заказы</Link>
            <Link to="/profile">Профиль</Link>
          </nav>
        </div>

        <div className={styles.iconSection}>
          <div className={styles.iconGroup} aria-label="Доставка">
            <span className={styles.groupTitle}>Доставка</span>
            <ul className={styles.icons}>
              {shipping.map((i) => (
                <li key={i.alt} className={styles.iconItem}>
                  <img
                    src={i.src}
                    alt={i.alt}
                    onError={onImgError}
                    style={
                      {
                        // кастомные высоты через CSS-переменные
                        ["--h" as any]: toPx(i.h),
                        ["--h-sm" as any]: toPx(i.hSm),
                      } as React.CSSProperties
                    }
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.iconGroup} aria-label="Оплата">
            <span className={styles.groupTitle}>Оплата</span>
            <ul className={styles.icons}>
              {payments.map((i) => (
                <li key={i.alt} className={styles.iconItem}>
                  <img
                    src={i.src}
                    alt={i.alt}
                    onError={onImgError}
                    style={
                      {
                        ["--h" as any]: toPx(i.h),
                        ["--h-sm" as any]: toPx(i.hSm),
                      } as React.CSSProperties
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <ul>
              <li>
                <Link to="/privacy">Политика конфиденциальности</Link>
              </li>
              <li>
                <Link to="/terms">Условия использования</Link>
              </li>
              <li>
                <Link to="/cookies">Политика использования cookies</Link>
              </li>
            </ul>
          </div>
          <div className={styles.copy}>© {new Date().getFullYear()} Mira</div>
        </div>

        <div className={styles.iconGroup} style={{ display: "flex", marginTop: 30, marginLeft: "-18px", justifyContent: "start" }} aria-label="Соцсети">
          <ul className={styles.icons}>
            {socials.map((i) => (
              <li key={i.alt} className={styles.iconItem}>
                <a
                  href={i.href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={i.alt}
                  className={styles.iconLink}
                >
                  <img
                    src={i.src}
                    alt=""
                    onError={onImgError}
                    style={
                      {
                        ["--h" as any]: toPx(i.h),
                        ["--h-sm" as any]: toPx(i.hSm),
                      } as React.CSSProperties
                    }
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
