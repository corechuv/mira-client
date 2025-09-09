// src/components/ProductCard.tsx
import styles from "./ProductCard.module.scss";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types";
import { fmtEUR } from "@/utils/money";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import ImagePlaceholder from "./ImagePlaceholder";


export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { t } = useI18n();
  return (
    <div className={`${styles.card}`}>
      <Link to={`/product/${product.slug}`} className={styles.thumb} aria-label={product.title}>
        <div className={styles.img} role="img" aria-label={product.title}>
          {product.imageUrl ? <img src={product.imageUrl} alt={product.title} /> :
            <ImagePlaceholder />
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
