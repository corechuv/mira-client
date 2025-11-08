// src/pages/Home.tsx
import styles from "./Home.module.scss";
import { Link } from "@/router/Router";
import { useProducts } from "@/contexts/ProductsContext";
import ProductsRail from "@/components/ProductsRail";
import { products as allProducts } from "@/data/products"; // для длинной ленты
import { useI18n } from "@/i18n/I18nContext";
import Carousel from "@/components/Carousel/Carousel";
import CatalogTiles, { CatalogItem } from "@/components/CatalogTiles/CatalogTiles";
import Banners, { BannerItem } from "@/components/Banners";

const items: CatalogItem[] = [
  {
    id: "laser",
    title: "Лазерная эпиляция",
    image:
      "https://images.pexels.com/photos/16032305/pexels-photo-16032305.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/laser-epilation",
  },
  {
    id: "rf",
    title: "RF-лифтинг",
    image:
      "https://images.pexels.com/photos/12556701/pexels-photo-12556701.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/rf-lifting",
  },
  {
    id: "hifu",
    title: "HIFU-системы",
    image:
      "https://images.pexels.com/photos/5069425/pexels-photo-5069425.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/hifu",
  },
  {
    id: "led",
    title: "LED-терапия",
    image:
      "https://images.pexels.com/photos/7216285/pexels-photo-7216285.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/led",
  },
  {
    id: "cryolipolysis",
    title: "Криолиполиз",
    image:
      "https://images.pexels.com/photos/7772648/pexels-photo-7772648.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/cryolipolysis",
  },
  {
    id: "microcurrent",
    title: "Микротоки",
    image:
      "https://images.pexels.com/photos/7446686/pexels-photo-7446686.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/microcurrent",
  },
  {
    id: "cavitation",
    title: "Кавитация",
    image:
      "https://images.pexels.com/photos/7772689/pexels-photo-7772689.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/cavitation",
  },
  {
    id: "darsonval",
    title: "Дарсонваль",
    image:
      "https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=1600",
    href: "/catalog/darsonval",
  },
];

const slides = [
  { src: "/banners/IMG_2.png", alt: "Скидки до 50%" },
  { src: "/banners/IMG_1.png", alt: "Новая коллекция" },
  { src: "/banners/IMG_3.png", alt: "Новая коллекция" },
];

const items1: BannerItem[] = [
  {
    image: "/banners/IMG_2.png",
    title: "Banner",
    subtitle: "Новинка",
    description: "Короткий текст о продукте/акции",
    ctaLabel: "Подробнее",
    ctaHref: "more-1",
  },
];

const items2: BannerItem[] = [
  {
    image: "/banners/IMG_1.png",
    title: "Banner 2",
    description: "Описание второй карточки",
    ctaLabel: "Купить",
    ctaHref: "buy",
  },
  {
    image: "/banners/IMG_3.png",
    title: "Banner 3",
    subtitle: "Sale",
    description: "Список...",
  },
];

export default function Home() {
  const { products } = useProducts();
  const top = products.slice(0, 4);
  const { t } = useI18n();

  return (
    <>
      <section className={styles.hero} style={{ display: "none" }}>
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
        autoPlay
        interval={3500}
        loop
        showArrows
        showDots
        onIndexChange={(i) => console.log("index:", i)}
      />


      <section className={styles.section}>
        <CatalogTiles heading="Каталог аппаратов" items={items} minTileWidth={200} />
      </section>
      <section className={styles.section}>
        <ProductsRail title={t("home.popular", "Популярное")} items={top} />
      </section>
      <section className={styles.section}>
        <Banners items={items1} />
      </section>
      <section className={styles.section}>
        <ProductsRail title={t("home.recommended", "Рекомендуем")} items={allProducts} />
      </section>
      <section className={styles.section}>
        <Banners items={items2} />
      </section>
    </>
  );
}