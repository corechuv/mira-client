// src/components/DeliveryInfo.tsx
import styles from "./DeliveryInfo.module.scss";
import { fmtEUR } from "@/utils/money";
import { useCart } from "@/contexts/CartContext";
import React, { useMemo, useState } from "react";

const VAT_RATE = 0.19;
const FREE_THRESHOLD = 49; // €
const DHL_COST = 4.99;
const EXPRESS_COST = 12.9;

function addBusinessDays(base: Date, days: number) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay(); // 0=Sun,6=Sat
    if (wd !== 0 && wd !== 6) added++;
  }
  return d;
}

function fmtDay(d: Date) {
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
}
function fmtRange(a: Date, b: Date) {
  if (a.getTime() === b.getTime()) return fmtDay(a);
  return `${fmtDay(a)} – ${fmtDay(b)}`;
}

export default function DeliveryInfo({ productPrice }: { productPrice: number }) {
  const { total } = useCart();

  // мини-селектор для расчёта (не меняет корзину)
  const [qty, setQty] = useState<number>(1);
  const inc = () => setQty(q => Math.min(99, q + 1));
  const dec = () => setQty(q => Math.max(1, q - 1));
  const onQtyInput = (v: string) => {
    const n = Math.max(1, Math.min(99, Number(v.replace(/\D+/g, "")) || 1));
    setQty(n);
  };

  // суммы
  const subtotalWithThis = total + productPrice * qty;
  const leftToFree = Math.max(0, FREE_THRESHOLD - subtotalWithThis);
  const dhlCost = leftToFree === 0 ? 0 : DHL_COST;
  const packstationCost = dhlCost;

  const vatForItem = useMemo(() => {
    const vat = productPrice - productPrice / (1 + VAT_RATE);
    return Math.round(vat * 100) / 100;
  }, [productPrice]);

  // даты
  const now = new Date();
  const paketStart = addBusinessDays(now, 2);
  const paketEnd = addBusinessDays(now, 3);
  const expressDay = addBusinessDays(now, 1);

  return (
    <section className={`${styles.card}`}>
      <div className={styles.head}>
        <h3>Доставка и оплата</h3>
        <div className={styles.qty}>
          <span className={styles.qtyLabel}>Расчёт для</span>
          <div className={styles.qtyCtrl}>
            <button style={{border: 'none', background: 'none'}} className="btn" onClick={dec} aria-label="Уменьшить">−</button>
            <input
              className={styles.qtyInput}
              value={qty}
              onChange={(e) => onQtyInput(e.target.value)}
              inputMode="numeric"
              aria-label="Количество"
            />
            <button style={{border: 'none', background: 'none'}} className="btn" onClick={inc} aria-label="Увеличить">+</button>
          </div>
        </div>
      </div>

      {/* Варианты доставки — компактным списком */}
      <ul className={styles.shipList} aria-label="Варианты доставки">
        <li className={styles.row}>
          <div className={styles.left}>
            <div className={styles.title}>DHL Paket</div>
            <div className={styles.sub}>2–3 Werktage • {fmtRange(paketStart, paketEnd)}</div>
          </div>
          <div className={styles.right}>
            <b className={leftToFree === 0 ? styles.free : undefined}>{fmtEUR(dhlCost)}</b>
            <div className={styles.note}>
              {leftToFree === 0 ? (
                <span className={styles.freeBadge}>Бесплатная доставка</span>
              ) : (
                <>Бесплатно от {fmtEUR(FREE_THRESHOLD)} · не хватает {fmtEUR(leftToFree)}</>
              )}
            </div>
          </div>
        </li>

        <li className={styles.row}>
          <div className={styles.left}>
            <div className={styles.title}>DHL Express</div>
            <div className={styles.sub}>1 Werktag • {fmtDay(expressDay)}</div>
          </div>
          <div className={styles.right}><b>{fmtEUR(EXPRESS_COST)}</b></div>
        </li>

        <li className={styles.row}>
          <div className={styles.left}>
            <div className={styles.title}>DHL Packstation / Postfiliale</div>
            <div className={styles.sub}>самовывоз • {fmtRange(paketStart, paketEnd)}</div>
          </div>
          <div className={styles.right}>
            <b className={leftToFree === 0 ? styles.free : undefined}>{fmtEUR(packstationCost)}</b>
            <div className={styles.note}>
              {leftToFree === 0 ? (
                <span className={styles.freeBadge}>Бесплатная доставка</span>
              ) : (
                <>Бесплатно от {fmtEUR(FREE_THRESHOLD)} · не хватает {fmtEUR(leftToFree)}</>
              )}
            </div>
          </div>
        </li>

        <li className={styles.row}>
          <div className={styles.left}>
            <div className={styles.title}>Самовывоз (Berlin-Mitte)</div>
            <div className={styles.sub}>сегодня/завтра после подтверждения</div>
          </div>
          <div className={styles.right}><b>{fmtEUR(0)}</b></div>
        </li>
      </ul>

      {/* Информация — тоже списком */}
      <ul className={styles.infoList}>
        <li>
          <span className={styles.icon} aria-hidden>
            {/* НДС */}
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 1 7 7v1h1a2 2 0 0 1 2 2v3.5a4.5 4.5 0 0 1-4.5 4.5H6.5A4.5 4.5 0 0 1 2 15.5V12a2 2 0 0 1 2-2h1V9a7 7 0 0 1 7-7Z"/></svg>
          </span>
          <div>
            <div className={styles.infoTitle}>НДС (MwSt)</div>
            <div className={styles.infoText}>
              Цена включает 19% НДС. Для {qty} шт: ≈ <b>{fmtEUR(vatForItem * qty)}</b>.
            </div>
          </div>
        </li>
        <li>
          <span className={styles.icon} aria-hidden>
            {/* Оплата */}
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18a2 2 0 0 1 2 2v1H1V7a2 2 0 0 1 2-2Zm-2 6h22v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6Zm5 4h4v2H6v-2Z"/></svg>
          </span>
          <div>
            <div className={styles.infoTitle}>Оплата</div>
            <div className={styles.infoText}>
              Visa, Mastercard.
            </div>
          </div>
        </li>
        <li>
          <span className={styles.icon} aria-hidden>
            {/* Возврат */}
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M21 7h-6l-2-2H3a2 2 0 0 0-2 2v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9a2 2 0 0 0-2-2Z"/></svg>
          </span>
          <div>
            <div className={styles.infoTitle}>Возврат</div>
            <div className={styles.infoText}>14 дней. Товары без следов использования и в оригинальной упаковке.</div>
          </div>
        </li>
      </ul>

      <p className={styles.hint}>
        Способ и стоимость доставки выбираются на шаге <b>Оформление</b>. Итог зависит от состава заказа.
      </p>
    </section>
  );
}
