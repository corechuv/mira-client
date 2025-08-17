import { Link } from "@/router/Router";
import { useCart } from "@/contexts/CartContext";
import styles from "./Header.module.scss";
import { useState } from "react";

// важно: нужны компоненты Modal и CategoryDrawer
import Modal from "./Modal";
import CategoryDrawer from "./CategoryDrawer";

export default function Header() {
  const { totalQty } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.bar}>
          <Link to="/" className={styles.logo}>
            <img src="/logo.png" alt="Mira" className={styles.logoImage} />
          </Link>

          <nav className={styles.nav}>
            <Link to="/catalog" className={styles.navItem}>Каталог</Link>
            <Link to="/profile?tab=orders" className={styles.navItem}>Заказы</Link>
            <Link to="/profile" className={styles.navItem}>Профиль</Link>
            <Link to="/cart" className={`${styles.navItem} ${styles.cart}`}>
              <span>Корзина</span>
              {totalQty > 0 && <span className="badge">{totalQty}</span>}
            </Link>
          </nav>

          <button
            className="btn btnGhost"
            onClick={() => setDrawerOpen(true)}
            aria-label="Категории"
          >
            ☰
          </button>
        </div>
      </div>

      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Категории"
        width={380}
        side="right"
      >
        <CategoryDrawer onClose={() => setDrawerOpen(false)} />
      </Modal>
    </header>
  );
}
