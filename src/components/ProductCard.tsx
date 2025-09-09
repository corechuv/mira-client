// src/components/ProductCard.tsx
import styles from "./ProductCard.module.scss";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types";
import { fmtEUR } from "@/utils/money";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";


export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { t } = useI18n();
  return (
    <div className={`${styles.card}`}>
      <Link to={`/product/${product.slug}`} className={styles.thumb} aria-label={product.title}>
        <div className={styles.img} role="img" aria-label={product.title}>
          {product.imageUrl ? <img src={product.imageUrl} alt={product.title} /> :
            <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500" role="img">
              <rect width="100%" height="100%" fill="#F5F5F5" />
              <g fill="none" stroke="#4B5563" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
                <rect x="90" y="130" width="320" height="240" rx="24" />
                <path d="M120 330 L200 250 L240 290 L290 230 L360 330" />
              </g>
              <circle cx="374" cy="166" r="14" fill="#4B5563" />
            </svg>
          }
        </div>
      </Link>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <Link to={`/product/${product.slug}`} className={styles.title}>{product.title}</Link>
          <div>
            <span className="badge">{product.category}</span>
          </div>
        </div>
        <p className={styles.desc}>{product.short}</p>
        <div className={styles.bar}>
          <div className={styles.price}>{fmtEUR(product.price)}</div>
          {/* <button className="btn btnPrimary" onClick={() => add(product)}>
            {t("btn.addToCart", "В корзину")}
          </button> */}
        </div>
      </div>
    </div>
  );
}
