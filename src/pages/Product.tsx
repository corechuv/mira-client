// src/pages/Product.tsx
import { useRoute } from "@/router/Router";
import styles from "./Product.module.scss";
import { useCart } from "@/contexts/CartContext";
import Breadcrumbs, { Crumb } from "@/components/Breadcrumbs";
import { useProducts } from "@/contexts/ProductsContext";
import { navigate } from "@/router/Router";
import ProductsRail from "@/components/ProductsRail";
import Reviews from "@/components/Reviews";
import { fmtEUR } from "@/utils/money";
import DeliveryInfo from "@/components/DeliveryInfo";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export default function Product() {
  const { params } = useRoute();
  const { add } = useCart();
  const { all, setFilterPath } = useProducts();
  const [product, setProduct] = useState(() => all.find(p => p.slug === params.slug));

  useEffect(() => {
    if (!product) {
      (async () => {
        const p = await api.product(params.slug);
        if (p) setProduct(p);
      })();
    }
  }, [params.slug, product]);

  if (!product) {
    return (
      <div className="container">
        <Breadcrumbs items={[
          { label: "Главная", to: "/" },
          { label: "Каталог", to: "/catalog" },
          { label: "Товар", current: true },
        ]} />
        <div className="card" style={{ padding: '1rem' }}>Товар не найден</div>
      </div>
    );
  }

  const pool = all.filter(p => p.id !== product.id);
  const byLeaf = product.leaf ? pool.filter(p => p.leaf === product.leaf) : [];
  const bySub  = product.sub  ? pool.filter(p => p.sub  === product.sub)  : [];
  const byCat  = pool.filter(p => p.category === product.category);
  const seen = new Set<string>();
  const pick = (arr: typeof pool) => arr.filter(p => !seen.has(p.id) && (seen.add(p.id), true));
  const similar = [...pick(byLeaf), ...pick(bySub), ...pick(byCat)];

  const crumbs: Crumb[] = [
    { label: "Главная", to: "/" },
    { label: "Каталог", to: "/catalog" }
  ];
  if (product.category) crumbs.push({ label: product.category, onClick: () => { setFilterPath([product.category]); navigate("/catalog"); } });
  if (product.sub)      crumbs.push({ label: product.sub,      onClick: () => { setFilterPath([product.category, product.sub!]); navigate("/catalog"); } });
  if (product.leaf)     crumbs.push({ label: product.leaf,     onClick: () => { setFilterPath([product.category, product.sub!, product.leaf!]); navigate("/catalog"); } });
  crumbs.push({ label: product.title, current: true });

  return (
    <div className="container">
      <Breadcrumbs items={crumbs} />

      <div className={`card ${styles.wrap}`}>
        <div className={styles.left}>
          <div className={styles.gallery}>
            <div className={styles.photo}>
              <img src={product.imageUrl} alt={product.title} />
            </div>
            <div className={styles.thumbs}>
              <div className={styles.thumb} />
              <div className={styles.thumb} />
              <div className={styles.thumb} />
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <h1 className={styles.title}>{product.title}</h1>
          <div className={styles.meta}>
            <span className="badge">{product.category}</span>
            <span className="badge">★ {product.rating}</span>
          </div>
          <p className={styles.desc}>{product.description}</p>
          <div className={styles.buy}>
            <div className={styles.price}>{fmtEUR(product.price)}</div>
            <button className="btn btnPrimary" onClick={() => add(product)}>Добавить в корзину</button>
          </div>
          <DeliveryInfo productPrice={product.price} />
        </div>
      </div>

      <Reviews productId={product.id} />
      <ProductsRail title="Похожие товары" items={similar} excludeId={product.id} />
    </div>
  );
}
