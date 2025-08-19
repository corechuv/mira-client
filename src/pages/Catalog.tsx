// src/pages/Catalog.tsx
import { useState } from "react";
import { useProducts } from "@/contexts/ProductsContext";
import ProductCard from "@/components/ProductCard";
import Breadcrumbs, { Crumb } from "@/components/Breadcrumbs";
import { navigate } from "@/router/Router";
import styles from "./Catalog.module.scss";
import FiltersPanel from "@/components/FiltersPanel";
import Modal from "@/components/Modal";

export default function Catalog() {
  const {
    products,
    sort, setSort,
    filterPath, setFilterPath,
  } = useProducts();

  const [openSheet, setOpenSheet] = useState(false);

  const hasPath = filterPath.length > 0;

  const crumbs: Crumb[] = [
    { label: "Главная", to: "/" },
    { label: "Каталог", current: filterPath.length === 0 }
  ];
  filterPath.forEach((name, idx) => {
    const isLast = idx === filterPath.length - 1;
    crumbs.push({
      label: name,
      current: isLast,
      onClick: !isLast
        ? () => { setFilterPath(filterPath.slice(0, idx + 1)); navigate("/catalog"); }
        : undefined
    });
  });

  return (
    <div className="container">
      <Breadcrumbs items={crumbs} />

      <div className={styles.topbar}>
        <button className="btn btnGhost" onClick={()=>setOpenSheet(true)}>Фильтры</button>
        <div className={styles.topbarRight}>
          <label className={styles.sortInline}>
            <select
              className="input"
              value={sort}
              onChange={(e)=>setSort(e.target.value as any)}
            >
              <option value="popular">Сначала популярные</option>
              <option value="price-asc">Сначала дешёвые</option>
              <option value="price-desc">Сначала дорогие</option>
            </select>
          </label>
        </div>
      </div>
      <span className={styles.counter}>Найдено: <b>{products.length}</b></span>

      <div className={styles.layout}>
        {/* Сайдбар (desktop) */}
        <aside className={styles.sidebar}>
          <div className="card" style={{ padding: ".8rem" }}>
            <FiltersPanel />
          </div>
        </aside>

        {/* Результаты */}
        <main className={styles.main}>


          <div className="row">
            {products.map((p) => (
              <div key={p.id} style={{ gridColumn: "span 4" }}>
                <ProductCard product={p} />
              </div>
            ))}
            {products.length === 0 && (
              <div className="card" style={{ padding: "1rem" }}>
                Ничего не найдено. Попробуйте изменить фильтры.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Мобильный bottom-sheet */}
      <Modal
        isOpen={openSheet}
        onClose={()=>setOpenSheet(false)}
        title="Фильтры и сортировка"
        side="bottom"
        width={720} // игнорируется для bottom, оставил на будущее
      >
        <div className={styles.sheetBody}>
          <FiltersPanel inModal onApply={()=>setOpenSheet(false)} />
        </div>
      </Modal>
    </div>
  );
}
