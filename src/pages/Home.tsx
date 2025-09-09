// src/pages/Home.tsx
import styles from "./Home.module.scss";
import { Link } from "@/router/Router";
import { useProducts } from "@/contexts/ProductsContext";
import ProductCard from "@/components/ProductCard";
import ProductsRail from "@/components/ProductsRail";
import { products as allProducts } from "@/data/products"; // для длинной ленты
import { useI18n } from "@/i18n/I18nContext";


export default function Home() {
  const { products } = useProducts();
  const top = products.slice(0, 4);
  const { t } = useI18n();

  return (
    <div className="container">
      <section className={styles.hero}>
        <div className={`${styles.heroCard}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.badge}>новинки</span>
              <h1 className={styles.title}>Шото написать...</h1>
              <p className={styles.subtitle}>
                Шо то дописать...
              </p>
              <div className={styles.actions}>
                <Link to="/catalog" className="btn btnPrimary">{t("home.toCatalog", "В каталог")}</Link>
                <Link to="/profile?tab=orders" className="btn btnGhost">{t("home.myOrders", "Мои заказы")}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className={styles.section}>
        <div className={styles.sectionHead}>
        </div>
        <ProductsRail title={t("home.popular", "Популярное")} items={top} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
        </div>
        <ProductsRail title={t("home.recommended", "Рекомендуем")} items={allProducts} />
      </section>
    </div>
  );
}