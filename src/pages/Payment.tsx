import styles from "./Payment.module.scss";
import { useEffect, useMemo, useState } from "react";
import { navigate } from "@/router/Router";
import Field from "@/components/Field";
import { useCart } from "@/contexts/CartContext";

const fmtEUR = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function Payment() {
  const draftRaw = localStorage.getItem("pm.checkoutDraft.v1");
  const draft = draftRaw ? JSON.parse(draftRaw) : null;
  const { clear } = useCart();

  useEffect(() => {
    if (!draft) navigate("/checkout");
  }, [draft]);

  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");

  if (!draft) return null;

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    // здесь в будущем будет Stripe; сейчас просто финализируем заказ
    const order = {
      ...draft,
      payment: {
        method: "card",
        status: "paid",
        last4: number.replace(/\s+/g, "").slice(-4),
      },
    };
    const KEY = "pm.orders.v1";
    const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
    localStorage.setItem(KEY, JSON.stringify([order, ...prev]));
    localStorage.removeItem("pm.checkoutDraft.v1");
    clear();
    navigate("/profile?tab=orders");
  };

  const sum = draft.totals as { subtotal: number; shipping: number; grand: number; vatIncluded: number };

  return (
    <div className="container">
      <h1>Оплата картой</h1>
      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={pay}>

          <Field label="Держатель карты">
            <input className="input" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="IVAN IVANOV" required />
          </Field>
          <div className={styles.twoCols}>
            <Field label="Номер карты">
              <input
                className="input"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                pattern="[\d\s]{12,23}"
                required
              />
            </Field>
            <div className={styles.twoColsInner}>
              <Field label="MM/YY">
                <input className="input" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="12/29" pattern="\d{2}/\d{2}" required />
              </Field>
              <Field label="CVC">
                <input className="input" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" pattern="\d{3,4}" required />
              </Field>
            </div>
          </div>

          <button className="btn btnPrimary" type="submit">
            Оплатить {fmtEUR(sum.grand)}
          </button>
        </form>

        <aside className={"card " + styles.aside}>
          <div className={styles.title}>Итог заказа</div>
          <div className={styles.row}><span>Товары</span><b>{fmtEUR(sum.subtotal)}</b></div>
          <div className={styles.row}><span>Доставка</span><b>{fmtEUR(sum.shipping)}</b></div>
          <div className="hr" />
          <div className={styles.rowBig}><span>К оплате</span><b>{fmtEUR(sum.grand)}</b></div>
          <div className={styles.vatNote}>Включая НДС 19%: {fmtEUR(sum.vatIncluded)}</div>

          <div className="hr" />
          <div className={styles.title}>Доставка</div>
          <div className={styles.small}>
            {draft.shipping.method === "pickup" && "Самовывоз — Berlin-Mitte"}
            {draft.shipping.method === "dhl" && "DHL Paket"}
            {draft.shipping.method === "express" && "DHL Express"}
            {draft.shipping.method === "packstation" &&
              (draft.shipping.packType === "packstation" ? "DHL Packstation" : "DHL Postfiliale")}
          </div>
        </aside>
      </div>
    </div>
  );
}
