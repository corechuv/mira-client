// src/pages/Payment.tsx
import styles from "./Payment.module.scss";
import { useEffect, useMemo, useState } from "react";
import { navigate } from "@/router/Router";
import { useCart } from "@/contexts/CartContext";
import { fmtEUR } from "@/utils/money";
import { api } from "@/lib/api";

import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useI18n } from "@/i18n/I18nContext";

export default function Payment() {
  const { t } = useI18n();
  const draftRaw = localStorage.getItem("pm.checkoutDraft.v1");
  const draft = draftRaw ? JSON.parse(draftRaw) : null;

  useEffect(() => {
    if (!draft) navigate("/checkout");
  }, [draft]);
  if (!draft) return null;

  const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    return pk ? loadStripe(pk) : null;
  }, [pk]);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cents = Math.round(Number(draft?.totals?.grand || 0) * 100);
        const { client_secret } = await api.payments.createIntent(cents, "EUR");
        setClientSecret(client_secret);
      } catch (e: any) {
        setErr(e?.message || t("payment.createIntentFailed"));
      }
    })();
  }, []);

  if (!pk) {
    return (
      <div className="container">
        <h1>{t("payment.title")}</h1>
        <div className="card" style={{ padding: "1rem" }}>
          {t("payment.formUnavailable")}
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container">
        <h1>{t("payment.title")}</h1>
        <div className="card" style={{ padding: "1rem" }}>{err}</div>
      </div>
    );
  }
  if (!clientSecret || !stripePromise) {
    return (
      <div className="container">
        <h1>{t("payment.title")}</h1>
        <div className="card" style={{ padding: "1rem" }}>{t("payment.loading")}</div>
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
  const { t } = useI18n();
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
      setError(stripeErr.message || t("payment.declined"));
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const last4 =
        (paymentIntent as any)?.charges?.data?.[0]?.payment_method_details?.card?.last4 || undefined;

      try {
        const orderPayload = {
          ...draft,
          payment_status: "paid",
          payment: { method: "card", status: "paid", last4 },
        };
        const created = await api.orders.create(orderPayload);
        try {
          const KEY = "pm.orders.v1";
          const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
          localStorage.setItem(KEY, JSON.stringify([created, ...prev]));
        } catch { }
      } catch {
        const KEY = "pm.orders.v1";
        const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
        const offline = {
          ...draft,
          payment: { method: "card", status: "paid", last4 },
          status: "processing",
        };
        localStorage.setItem(KEY, JSON.stringify([offline, ...prev]));
      }

      localStorage.removeItem("pm.checkoutDraft.v1");
      clear();
      navigate("/profile?tab=orders");
    } else {
      setLoading(false);
      setError(t("payment.notCompleted"));
    }
  };

  return (
    <div className="container">
      <h1>{t("payment.payByCardTitle")}</h1>
      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={pay}>
          <div className={styles.sectionTitle}>{t("payment.cardDetails")}</div>
          <PaymentElement />
          {error && <div className="error" style={{ marginTop: ".75rem" }}>{error}</div>}
          <button className="btn btnPrimary" type="submit" disabled={!stripe || loading} style={{ marginTop: "1rem" }}>
            {loading ? t("payment.processing") : t("payment.pay").replace("{amount}", fmtEUR(sum.grand))}
          </button>
        </form>

        <aside className={"card " + styles.aside}>
          <div className={styles.title}>{t("payment.orderSummary")}</div>
          <div className={styles.row}><span>{t("payment.items")}</span><b>{fmtEUR(sum.subtotal)}</b></div>
          <div className={styles.row}><span>{t("payment.shipping")}</span><b>{fmtEUR(sum.shipping)}</b></div>
          <div className="hr" />
          <div className={styles.rowBig}><span>{t("payment.toPay")}</span><b>{fmtEUR(sum.grand)}</b></div>
          <div className={styles.vatNote}>{t("payment.vatIncluded").replace("{amount}", fmtEUR(sum.vatIncluded))}</div>
          <div className="hr" />
          <div className={styles.title}>{t("checkout.shipping")}</div>
          <div className={styles.small}>
            {draft.shipping.method === "pickup" && t("payment.method.pickup")}
            {draft.shipping.method === "dhl" && t("payment.method.dhl")}
            {draft.shipping.method === "express" && t("payment.method.express")}
            {draft.shipping.method === "packstation" &&
              (draft.shipping.packType === "packstation" ? t("payment.method.packstation") : t("payment.method.postfiliale"))}
          </div>
        </aside>
      </div>
    </div>
  );
}
