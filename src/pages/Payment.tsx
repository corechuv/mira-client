// src/pages/Payment.tsx
import styles from "./Payment.module.scss";
import { useEffect, useMemo, useState } from "react";
import { navigate } from "@/router/Router";
import { useCart } from "@/contexts/CartContext";
import { fmtEUR } from "@/utils/money";
import { api } from "@/lib/api";

import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function Payment() {
  const draftRaw = localStorage.getItem("pm.checkoutDraft.v1");
  const draft = draftRaw ? JSON.parse(draftRaw) : null;

  // ① если нет драфта — уходим на checkout
  useEffect(() => {
    if (!draft) navigate("/checkout");
  }, [draft]);
  if (!draft) return null;

  // ② берём ключ из окружения
  const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

  // ③ лениво загружаем Stripe только если ключ есть
  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    return pk ? loadStripe(pk) : null;
  }, [pk]);

  // ④ грузим client_secret (PaymentIntent) с бэка
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cents = Math.round(Number(draft?.totals?.grand || 0) * 100);
        const { client_secret } = await api.payments.createIntent(cents, "EUR");
        setClientSecret(client_secret);
      } catch (e: any) {
        setErr(e?.message || "Не удалось создать платеж.");
      }
    })();
  }, []);

  // ⑤ фолбэк, если нет publishable key
  if (!pk) {
    return (
      <div className="container">
        <h1>Оплата</h1>
        <div className="card" style={{ padding: "1rem" }}>
          Платёжная форма недоступна: не задан <code>VITE_STRIPE_PUBLISHABLE_KEY</code> при сборке.
          Задайте переменную окружения и пересоберите сайт.
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container">
        <h1>Оплата</h1>
        <div className="card" style={{ padding: "1rem" }}>{err}</div>
      </div>
    );
  }
  if (!clientSecret || !stripePromise) {
    return (
      <div className="container">
        <h1>Оплата</h1>
        <div className="card" style={{ padding: "1rem" }}>Загружаем платёж…</div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <PaymentInner draft={draft} />
    </Elements>
  );
}

function PaymentInner({ draft }: { draft: any }) {
  const { clear } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const sum = draft.totals as { subtotal: number; shipping: number; grand: number; vatIncluded: number };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!stripe || !elements) return;

    setLoading(true);
    const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (stripeErr) {
      setLoading(false);
      setError(stripeErr.message || "Платёж отклонён.");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // попробуем вытащить last4 (если Stripe вернул его в charges)
      const last4 =
        (paymentIntent as any)?.charges?.data?.[0]?.payment_method_details?.card?.last4 || undefined;

      // создаём заказ уже ОПЛАЧЕННЫМ
      try {
        const orderPayload = {
          ...draft,
          payment_status: "paid",
          payment: { method: "card", status: "paid", last4 },
        };
        const created = await api.orders.create(orderPayload);

        // >>> ДОБАВИТЬ: записываем и в локальную историю, чтобы профиль сразу увидел "Оплачено"
        try {
          const KEY = "pm.orders.v1";
          const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
          localStorage.setItem(KEY, JSON.stringify([created, ...prev]));
        } catch { }
      } catch {
        // офлайн-фолбэк
        const KEY = "pm.orders.v1";
        const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
        const offline = {
          ...draft,
          payment: { method: "card", status: "paid", last4 },
          status: "processing",
        };
        localStorage.setItem(KEY, JSON.stringify([offline, ...prev]));
      }

      // очистка: убираем драфт и корзину → на заказы
      localStorage.removeItem("pm.checkoutDraft.v1");
      clear();
      navigate("/profile?tab=orders");
    } else {
      setLoading(false);
      setError("Платёж не был завершён. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="container">
      <h1>Оплата картой</h1>
      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={pay}>
          <div className={styles.sectionTitle}>Данные карты</div>
          <PaymentElement />
          {error && <div className="error" style={{ marginTop: ".75rem" }}>{error}</div>}
          <button className="btn btnPrimary" type="submit" disabled={!stripe || loading} style={{ marginTop: "1rem" }}>
            {loading ? "Обработка…" : `Оплатить ${fmtEUR(sum.grand)}`}
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
