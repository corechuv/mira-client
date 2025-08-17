import { Link } from "@/router/Router";
import { useCart } from "@/contexts/CartContext";
import styles from "./Header.module.scss";
import { useState } from "react";

import Modal from "./Modal";
import CategoryDrawer from "./CategoryDrawer";
import Icon from "./Icon";
import SearchOverlay from "./SearchOverlay";

export default function Header() {
  const { totalQty } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.bar}>
          <Link to="/" className={styles.logo} aria-label="На главную">
            <img src="/logo.png" alt="" className={styles.logoImage} />
          </Link>

          <nav className={styles.nav} aria-label="Навигация">
            <button
              className={styles.btnIcon}
              onClick={() => setSearchOpen(true)}
              aria-label="Поиск"
            >
              <Icon name="search" size="1.8rem" />
            </button>

            <Link to="/profile" className={styles.navItem} aria-label="Профиль">
              <Icon name="profile" size="1.8rem" />
            </Link>


            <Link to="/profile?tab=orders" className={styles.navItem} aria-label="Мои заказы">
              <Icon name="orders" size="1.8rem" />
            </Link>
            
            <Link to="/cart" className={`${styles.navItem} ${styles.cart}`} aria-label="Корзина">
              <Icon name="bag" size="1.8rem" />
              {totalQty > 0 && <span className={styles.countBadge}>{totalQty}</span>}
            </Link>

            <button
              className={styles.btnIcon}
              onClick={() => setDrawerOpen(true)}
              aria-label="Категории"
            >
              <Icon name="menu" size="1.8rem" />
            </button>
          </nav>
        </div>
      </div>

      {/* Категории — выдвижной сайдбар */}
      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Категории"
        width={320}
        side="right"
      >
        <CategoryDrawer onClose={() => setDrawerOpen(false)} />
      </Modal>

      {/* Полноэкранный поиск */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </header>
  );
}
