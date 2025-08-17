import { useCart } from "@/contexts/CartContext";
import styles from "./Cart.module.scss";
import { Link } from "@/router/Router";
import { fmtEUR } from "@/utils/money";

export default function Cart() {
  const { items, setQty, remove, total } = useCart();

  return (
    <div className="container">
      <h1>Корзина</h1>
      <div className={`card ${styles.wrap}`}>
        <div className={styles.list}>
          {items.length === 0 && <div className={styles.empty}>Корзина пуста</div>}
          {items.map(i => (
            <div className={styles.row} key={i.id}>
              <div className={styles.cellTitle}>
                <div className={styles.thumb} />
                <div>
                  <div className={styles.title}>{i.title}</div>
                  <Link to={`/product/${i.slug}`} className={styles.link}>Подробнее</Link>
                </div>
              </div>
              <div className={styles.cell}>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={i.qty}
                  onChange={e => setQty(i.id, Math.max(1, Number(e.target.value)))}
                  style={{ width: 80 }}
                />
              </div>
              <div className={styles.cell}>{fmtEUR(i.price * i.qty)}</div>
              <div className={styles.cell}>
                <button className="btn" onClick={() => remove(i.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
        <aside className={styles.aside + " card"}>
          <div className={styles.totalRow}>
            <span>Итого</span>
            <b>{fmtEUR(total)}</b>
          </div>
          <Link to="/checkout" className="btn btnPrimary">Перейти к оформлению</Link>
        </aside>
      </div>
    </div>
  );
}