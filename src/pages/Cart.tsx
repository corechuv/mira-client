// src/pages/Cart.tsx
import { useCart } from "@/contexts/CartContext";
import styles from "./Cart.module.scss";
import { Link } from "@/router/Router";
import { fmtEUR } from "@/utils/money";
import Icon from "@/components/Icon";
import { useI18n } from "@/i18n/I18nContext";

export default function Cart() {
  const { t } = useI18n();
  const { items, setQty, remove, total } = useCart();

  return (
    <div className="container">
      <h1 className={styles.titlePage}>{t("nav.cart")}</h1>
      <div className={`${styles.wrap}`}>
        <div className={styles.list}>
          {items.length === 0 && <div className={styles.empty}>{t("cart.empty")}</div>}
          {items.map(i => (
            <div className={styles.row} key={i.id}>
              <div className={styles.thumb}>
                <img src={i.imageUrl} alt={i.title} />
              </div>
              <div style={{display: "flex", gap: 10, justifyContent: "space-between", width: "100%", marginRight: "42px"}}>
                <div className={styles.cartDescriptionItem}>
                  <div className={styles.title}>{i.title}</div>
                  <Link to={`/product/${i.slug}`} className={styles.link}>
                    {t("product.open")}
                  </Link>
                  <div
                    className={styles.cell}
                  >
                    <input
                      className={styles.qty}
                      type="number"
                      min={1}
                      value={i.qty}
                      onChange={e => setQty(i.id, Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                </div>
                <div className={styles.cell}>{fmtEUR(i.price * i.qty)}</div>
              </div>
              <div className={styles.cell}>
                <div className={styles.btnIcon} onClick={() => remove(i.id)} role="button" aria-label="remove">
                  <Icon name="close" width={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className={styles.aside}>
          <div className={styles.totalRow}>
            <span>{t("cart.total")}</span>
            <b style={{fontSize: "1.4rem"}}>{fmtEUR(total)}</b>
          </div>
          <Link to="/checkout" className="btn btnPrimary btn100">
            {t("btn.checkout")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
