// src/pages/Home.tsx
import styles from "./Home.module.scss";
import { Link } from "@/router/Router";
import { useProducts } from "@/contexts/ProductsContext";
import ProductCard from "@/components/ProductCard";
import ProductsRail from "@/components/ProductsRail";
import { products as allProducts } from "@/data/products"; // для длинной ленты
import { useI18n } from "@/i18n/I18nContext";
import Carousel from "@/components/Carousel/Carousel";

const slides = [
  { src: "/banners/IMG_7429.JPG", alt: "Скидки до 50%" },
  { src: "/banners/IMG_7425.JPG", alt: "Новая коллекция" },
  { src: "/banners/IMG_7428.JPG", alt: "Новая коллекция" },
  { src: "/banners/IMG_7421.JPG", alt: "Новая коллекция" },
  { src: "/banners/IMG_7426.JPG", alt: "Новая коллекция" },
  {
    src: "/banners/IMG_7430.JPG",
    alt: "Бесплатная доставка",
    href: "/",
  },
];


export default function Home() {
  const { products } = useProducts();
  const top = products.slice(0, 4);
  const { t } = useI18n();

  return (
    <div className="container">
      <section className={styles.hero} style={{display: "none"}}>
        <div className={`${styles.heroCard}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h1 className={styles.title}>Sample</h1>
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

      <Carousel
        slides={slides}
        aspectRatio="3/1"
        autoPlay
        interval={3500}
        loop
        showArrows
        showDots
        onIndexChange={(i) => console.log("index:", i)}
      />


      <section className={styles.section}>
        <ProductsRail title={t("home.popular", "Популярное")} items={top} />
      </section>

      <section className={styles.section}>
        <ProductsRail title={t("home.recommended", "Рекомендуем")} items={allProducts} />
      </section>
    </div>
  );
}