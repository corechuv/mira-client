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
              <h1 className={styles.title}>Title</h1>
              <p className={styles.subtitle}>
                Description
              </p>
              <div className={styles.actions}>
                <Link to="/catalog" className="btn btnPrimary">{t("home.toCatalog", "В каталог")}</Link>
              </div>
              <div style={{ padding: "4px 0" }}></div>
              <div className={styles.actions}>
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