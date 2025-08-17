import { Link } from "@/router/Router";
import { useCart } from "@/contexts/CartContext";
import styles from "./Header.module.scss";
import { useState } from "react";

// важно: нужны компоненты Modal и CategoryDrawer
import Modal from "./Modal";
import CategoryDrawer from "./CategoryDrawer";
import Icon from "./Icon";

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
            <Link to="/profile?tab=orders" className={styles.navItem}>
              <Icon name="orders" size="1.8rem" />
            </Link>
            <Link to="/profile" className={styles.navItem}>
              <Icon name="profile" size="1.8rem" />
            </Link>
            <Link to="/cart" className={`${styles.navItem} ${styles.cart}`}>
              <Icon name="bag" size="1.8rem" />
              {totalQty > 0 && <span className={styles.countBadge}>{totalQty}</span>}
            </Link>
            <div
              className={styles.btnIcon}
              onClick={() => setDrawerOpen(true)}
              aria-label="Категории"
            >
              <Icon name="menu" size="1.8rem" />
            </div>
          </nav>
        </div>
      </div>

      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Категории"
        width={320}
        side="right"
      >
        <CategoryDrawer onClose={() => setDrawerOpen(false)} />
      </Modal>
    </header>
  );
}
