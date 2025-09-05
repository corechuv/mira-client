// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import styles from "./Profile.module.scss";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/router/Router";
import { fmtEUR } from "@/utils/money";
import {
  loadAddresses,
  emptyAddress,
  listAddresses as listAddressesSrv,
  createAddress as createAddressSrv,
  updateAddress as updateAddressSrv,
  removeAddress as removeAddressSrv,
  setDefaultAddress as setDefaultAddressSrv,
} from "@/utils/addresses";
import type { Address } from "@/types";
import type { Order, OrderStatus } from "@/types";
import { listOrders as listOrdersSrv, requestReturn as requestReturnSrv, cancelOrder as cancelOrderSrv } from "@/utils/orders";
import { useI18n, Locale } from "@/i18n/I18nContext";

/* ===== Utils ===== */
function addrToLines(
  a: Address,
  labels: { postfiliale: string; packstation: string }
): string[] {
  const l1 = [a.firstName, a.lastName].filter(Boolean).join(" ");
  const l2 = a.packType
    ? `${a.packType === "postfiliale" ? labels.postfiliale : labels.packstation}${a.stationNr ? " #" + a.stationNr : ""}`
    : [a.street, a.house].filter(Boolean).join(" ");
  const l3 = [a.zip, a.city].filter(Boolean).join(" ");
  return [l1, l2, l3].filter(Boolean);
}

const BADGES: Partial<Record<OrderStatus, "info" | "warn" | "good" | "bad">> = {
  processing: "info",
  packed: "info",
  shipped: "info",
  delivered: "good",
  cancelled: "bad",
  refund_requested: "warn",
  refunded: "good",
};

const nowMs = () => Date.now();
const daysSince = (iso: string) => (nowMs() - +new Date(iso)) / 86400000;

const DATE_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  uk: "uk-UA",
  en: "en-US",
  de: "de-DE",
};

/* ======================= Вью «гость» ======================= */
function ProfileGuest() {
  const { t } = useI18n();
  return (
    <div className="container">
      <h1>{t("profile.title")}</h1>
      <div className={`card ${styles.empty}`}>
        <div>{t("guest.notAuth")}</div>
        <div className={styles.emptyActions}>
          <Link to="/auth?next=/profile" className="btn btnPrimary">{t("guest.login")}</Link>
          <Link to="/" className="btn">{t("guest.home")}</Link>
        </div>
      </div>
    </div>
  );
}

/* ================== Вью «авторизован» ===================== */
function ProfileAuthed() {
  const auth = useAuth();
  const user = auth.user!;
  const { t, locale } = useI18n();

  const statusLabel = (st: OrderStatus) => t(`order.status.${st}`);

  // tabs
  const initTab = (): "profile" | "address" | "orders" => {
    try {
      const tParam = new URL(window.location.href).searchParams.get("tab");
      return (tParam === "address" || tParam === "orders") ? tParam : "profile";
    } catch { return "profile"; }
  };
  const [tab, _setTab] = useState<"profile" | "address" | "orders">(initTab());
  const setTab = (tgt: "profile" | "address" | "orders") => {
    _setTab(tgt);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tgt);
      history.replaceState(null, "", url.toString());
    } catch { }
  };

  /* --------------------- Профиль --------------------- */
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim();
    try {
      await auth.updateProfile({ name: nextName, email: nextEmail });
      // можно показать тост "Сохранено"
    } catch (err: any) {
      alert(err?.message || t("address.saveError"));
    }
  };

  /* --------------------- Адреса --------------------- */
  const [addresses, setAddresses] = useState<Address[]>(loadAddresses());
  const [addrLoading, setAddrLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(addresses.length === 0);
  const suggestFirst = user.name?.split(" ")[0] || "";
  const [draft, setDraft] = useState<Address>(emptyAddress(suggestFirst));

  // первичная синхронизация с сервером
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAddrLoading(true);
      try {
        const list = await listAddressesSrv();
        if (mounted) {
          setAddresses(list);
          setShowForm(list.length === 0);
        }
      } finally {
        if (mounted) setAddrLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const startAdd = () => { setEditingId(null); setDraft(emptyAddress(suggestFirst)); setShowForm(true); };
  const startEdit = (a: Address) => { setEditingId(a.id); setDraft({ ...a }); setShowForm(true); };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setDraft(emptyAddress(suggestFirst)); };

  const submitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = { ...draft };
    if (!d.firstName.trim() || !d.lastName.trim() || !d.zip.trim() || !d.city.trim()) {
      alert(t("address.validateRequired"));
      return;
    }
    d.firstName = d.firstName.trim();
    d.lastName = d.lastName.trim();
    d.street = d.street.trim();
    d.house = d.house.trim();
    d.zip = d.zip.trim();
    d.city = d.city.trim();

    try {
      setAddrLoading(true);
      const next = editingId
        ? await updateAddressSrv(editingId, d)
        : await createAddressSrv({ ...d, id: d.id || crypto.randomUUID() });
      setAddresses(next);
      setShowForm(false);
      setEditingId(null);
      setDraft(emptyAddress(suggestFirst));
    } catch (err: any) {
      alert(err?.message || t("address.saveError"));
    } finally {
      setAddrLoading(false);
    }
  };

  const removeAddress = async (id: string) => {
    if (!confirm(t("address.deleteConfirm"))) return;
    try {
      setAddrLoading(true);
      const next = await removeAddressSrv(id);
      setAddresses(next);
    } catch (err: any) {
      alert(err?.message || t("address.deleteError"));
    } finally {
      setAddrLoading(false);
    }
  };

  const setDefault = async (id: string) => {
    try {
      setAddrLoading(true);
      const next = await setDefaultAddressSrv(id);
      setAddresses(next);
    } catch (err: any) {
      alert(err?.message || t("address.defaultError"));
    } finally {
      setAddrLoading(false);
    }
  };

  /* --------------------- Заказы --------------------- */
  const [orders, setOrders] = useState<Array<Order & { _total: number }>>([]);

  const reloadOrders = async () => {
    const list = await listOrdersSrv();
    const cooked = list
      .map((o) => {
        const total = o.total ?? o.totals?.grand ?? o.items.reduce((s, i) => s + i.price * i.qty, 0);
        const status: OrderStatus = (o.status as OrderStatus) || "processing";
        return { ...o, status, _total: total as number };
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    setOrders(cooked);
  };

  useEffect(() => { reloadOrders(); }, [user.email]);

  const canCancel = (o: Order & { _total: number }): boolean => {
    const st = (o.status as OrderStatus) || "processing";
    if (["cancelled", "shipped", "delivered", "refund_requested", "refunded"].includes(st)) return false;
    const isPaid = o.payment?.status === "paid";
    if (!isPaid) return true;
    return false;
  };

  const canRequestReturn = (o: Order & { _total: number }): boolean => {
    const st = (o.status as OrderStatus) || "processing";
    if (["cancelled", "refund_requested", "refunded"].includes(st)) return false;
    const isPaid = o.payment?.status === "paid";
    if (!isPaid) return false;
    return daysSince(o.createdAt) <= 30;
  };

  const cancelOrder = async (o: Order & { _total: number }) => {
    if (!canCancel(o)) return;
    if (!confirm(t("order.cancelConfirm"))) return;
    await cancelOrderSrv(o.id);
    await reloadOrders();
    alert(t("order.cancelled"));
  };

  // форма возврата
  const [returnForId, setReturnForId] = useState<string | null>(null);
  const [retReason, setRetReason] = useState("");
  const [retComment, setRetComment] = useState("");

  const openReturnForm = (o: Order & { _total: number }) => {
    setReturnForId(o.id);
    setRetReason("");
    setRetComment("");
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForId) return;
    if (!retReason) { alert(t("order.return.missingReason")); return; }
    await requestReturnSrv(returnForId, retReason, retComment || "");
    setReturnForId(null);
    setRetReason(""); setRetComment("");
    await reloadOrders();
    alert(t("order.return.sent"));
  };

  const dateLocale = DATE_LOCALE[locale];

  return (
    <div className="container">
      <h1>{t("profile.title")}</h1>

      <div className={styles.tabs} role="tablist">
        <button role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? styles.tabActive : styles.tab} onClick={() => setTab("profile")}>{t("tabs.profile")}</button>
        <button role="tab" aria-selected={tab === "address"} className={tab === "address" ? styles.tabActive : styles.tab} onClick={() => setTab("address")}>{t("tabs.address")}</button>
        <button role="tab" aria-selected={tab === "orders"} className={tab === "orders" ? styles.tabActive : styles.tab} onClick={() => setTab("orders")}>{t("tabs.orders")}</button>
        <div className={styles.spacer} />
        <button className="btn" onClick={auth.logout}>{t("common.logout")}</button>
      </div>

      {/* ---------- Профиль ---------- */}
      {tab === "profile" && (
        <form className={`${styles.form}`} onSubmit={saveProfile}>
          <div className={styles.twoCols}>
            <label className={styles.field}>
              <span>{t("form.name")}</span>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>{t("form.email")}</span>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
          </div>
          <button className="btn btnPrimary" type="submit">{t("form.save")}</button>
          <div className={styles.hint}>{t("profile.hint")}</div>
        </form>
      )}

      {/* ---------- Адреса ---------- */}
      {tab === "address" && (
        <div className={styles.addrWrap}>
          <div className={styles.addrHead}>
            <h2>{t("address.my")}</h2>
            <button className="btn btnPrimary" onClick={startAdd} disabled={addrLoading}>{t("address.add")}</button>
          </div>

          {addrLoading && (
            <div className="card" style={{ padding: ".7rem" }}>{t("address.sync")}</div>
          )}

          {addresses.length === 0 ? (
            <div className="card" style={{ padding: ".9rem" }}>
              {t("address.empty")}
            </div>
          ) : (
            <div className={styles.addrList}>
              {addresses.map(a => (
                <article key={a.id} className={`${styles.addrCard}`}>
                  <div className={styles.addrTop}>
                    <div className={styles.addrLines}>
                      {addrToLines(a, {
                        postfiliale: t("address.packType.postfiliale"),
                        packstation: t("address.packType.packstation"),
                      }).map((ln, i) => <div key={i}>{ln}</div>)}
                      {a.phone && <div className={styles.muted}>{a.phone}</div>}
                      {a.note && <div className={styles.muted}>{a.note}</div>}
                      {a.packType && a.postNummer && (
                        <div className={styles.muted}>{t("address.pack.postNumber")}: {a.postNummer}</div>
                      )}
                    </div>
                    <div className={styles.addrBadges}>
                      {a.isDefault && <span className="badge">{t("address.default")}</span>}
                    </div>
                  </div>

                  <div className={styles.addrActions}>
                    {!a.isDefault && <button className="btn" onClick={() => setDefault(a.id)} disabled={addrLoading}>{t("address.makeDefault")}</button>}
                    <button className="btn" onClick={() => startEdit(a)} disabled={addrLoading}>{t("address.edit")}</button>
                    <button className="btn" onClick={() => removeAddress(a.id)} disabled={addrLoading}>{t("address.delete")}</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {showForm && (
            <form className={`card ${styles.form}`} onSubmit={submitAddress}>
              <div className={styles.formHead}>
                <h3>{editingId ? t("address.editTitle") : t("address.newTitle")}</h3>
                {!editingId && addresses.length > 0 && (
                  <label className={styles.checkInline}>
                    <input
                      type="checkbox"
                      checked={!!draft.isDefault}
                      onChange={(e) => setDraft((d: Address) => ({ ...d, isDefault: e.target.checked }))}
                    />
                    <span>{t("address.setAsDefault")}</span>
                  </label>
                )}
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>{t("address.firstName")}</span>
                  <input className="input" value={draft.firstName} onChange={e => setDraft((d: Address) => ({ ...d, firstName: e.target.value }))} required />
                </label>
                <label className={styles.field}>
                  <span>{t("address.lastName")}</span>
                  <input className="input" value={draft.lastName} onChange={e => setDraft((d: Address) => ({ ...d, lastName: e.target.value }))} required />
                </label>
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>{t("address.street")}</span>
                  <input className="input" value={draft.street} onChange={e => setDraft((d: Address) => ({ ...d, street: e.target.value }))} />
                </label>
                <label className={styles.field}>
                  <span>{t("address.house")}</span>
                  <input className="input" value={draft.house} onChange={e => setDraft((d: Address) => ({ ...d, house: e.target.value }))} />
                </label>
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>{t("address.zip")}</span>
                  <input className="input" value={draft.zip} onChange={e => setDraft((d: Address) => ({ ...d, zip: e.target.value }))} inputMode="numeric" pattern="\d{5}" required />
                </label>
                <label className={styles.field}>
                  <span>{t("address.city")}</span>
                  <input className="input" value={draft.city} onChange={e => setDraft((d: Address) => ({ ...d, city: e.target.value }))} required />
                </label>
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>{t("address.phone")}</span>
                  <input className="input" value={draft.phone || ""} onChange={e => setDraft((d: Address) => ({ ...d, phone: e.target.value }))} placeholder="+49 ..." />
                </label>
                <label className={styles.field}>
                  <span>{t("address.note")}</span>
                  <input className="input" value={draft.note || ""} onChange={e => setDraft((d: Address) => ({ ...d, note: e.target.value }))} placeholder={t("order.return.commentPh")} />
                </label>
              </div>

              <div className={`card ${styles.packCard}`}>
                <div className={styles.packTitle}>{t("address.pack.title")}</div>
                <div className={styles.twoCols}>
                  <label className={styles.field}>
                    <span>{t("address.pack.type")}</span>
                    <select className="input" value={draft.packType || ""} onChange={e => setDraft((d: Address) => ({ ...d, packType: e.target.value as any }))}>
                      <option value="">—</option>
                      <option value="packstation">{t("address.packType.packstation")}</option>
                      <option value="postfiliale">{t("address.packType.postfiliale")}</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{t("address.pack.postNumber")}</span>
                    <input className="input" value={draft.postNummer || ""} onChange={e => setDraft((d: Address) => ({ ...d, postNummer: e.target.value }))} />
                  </label>
                </div>
                <div className={styles.twoCols}>
                  <label className={styles.field}>
                    <span>{draft.packType === "postfiliale" ? t("address.pack.stationNrFiliale") : t("address.pack.stationNrPack")}</span>
                    <input className="input" value={draft.stationNr || ""} onChange={e => setDraft((d: Address) => ({ ...d, stationNr: e.target.value }))} />
                  </label>
                  <div />
                </div>
                <div className={styles.packHint}>{t("address.pack.hint")}</div>
              </div>

              <div className={styles.formActions}>
                <button className="btn" type="button" onClick={cancelForm} disabled={addrLoading}>{t("common.cancel")}</button>
                <button className="btn btnPrimary" type="submit" disabled={addrLoading}>{editingId ? t("form.save") : t("common.add")}</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ---------- Заказы ---------- */}
      {tab === "orders" && (
        <div className={styles.ordersWrap}>
          {orders.length === 0 ? (
            <div className="card" style={{ padding: ".9rem" }}>
              {t("orders.empty")} <Link to="/catalog">{t("orders.goCatalog")}</Link>
            </div>
          ) : (
            <div className={styles.orderList}>
              {orders.map((o) => {
                const st: OrderStatus = (o.status as OrderStatus) || "processing";
                return (
                  <article key={o.id} className={`card ${styles.orderCard}`}>
                    <header className={styles.orderHead}>
                      <div>{t("order.titleShort")} <b>{o.id.slice(0, 8)}</b></div>
                      <div className={styles.orderBadges}>
                        <span className="badge">{new Date(o.createdAt).toLocaleString(dateLocale)}</span>
                        {o.payment?.status === "paid"
                          ? <span className="badge" title={`•••• ${o.payment?.last4 || ""}`}>{t("order.paid")}</span>
                          : <span className="badge">{t("order.awaitingPayment")}</span>}
                        <span className={`${styles.statusBadge} badge`} data-variant={BADGES[st] || "info"}>
                          {statusLabel(st)}
                        </span>
                      </div>
                    </header>

                    <div className="hr" />
                    <div className={styles.items}>
                      {o.items.map(i => (
                        <div key={i.id} className={styles.itemRow}>
                          <div className={styles.itemLeft}>
                            <div className={styles.thumb}>
                              <img src={i.imageUrl} alt={i.title} />
                            </div>
                            <div>
                              <div className={styles.itemTitle}>{i.title}</div>
                              <Link to={`/product/${i.slug}`}>{t("order.openProduct")}</Link>
                            </div>
                          </div>
                          <div className={styles.itemQty}>×{i.qty}</div>
                          <div className={styles.itemSum}><b>{fmtEUR(i.qty * i.price)}</b></div>
                        </div>
                      ))}
                    </div>

                    <div className="hr" />
                    <div className={styles.totalRow}>
                      <span>{t("order.total")}</span>
                      <b>{fmtEUR((o as any)._total)}</b>
                    </div>

                    <div className={styles.orderActions}>
                      {canCancel(o as any) && (
                        <button className="btn" onClick={() => cancelOrder(o as any)}>
                          {t("order.cancel")}
                        </button>
                      )}
                      {canRequestReturn(o as any) && (
                        <button className="btn" onClick={() => openReturnForm(o as any)}>
                          {t("order.return")}
                        </button>
                      )}
                    </div>

                    {returnForId === o.id && (
                      <form className={styles.returnForm} onSubmit={submitReturn}>
                        <div className={styles.twoCols}>
                          <label className={styles.field}>
                            <span>{t("order.return.reason")}</span>
                            <select
                              className="input"
                              value={retReason}
                              onChange={(e) => setRetReason(e.target.value)}
                              required
                            >
                              <option value="">{t("order.return.select")}</option>
                              <option value="not_fit">{t("order.return.reason.not_fit")}</option>
                              <option value="defect">{t("order.return.reason.defect")}</option>
                              <option value="wrong">{t("order.return.reason.wrong")}</option>
                              <option value="other">{t("order.return.reason.other")}</option>
                            </select>
                          </label>
                          <label className={styles.field}>
                            <span>{t("order.return.commentOpt")}</span>
                            <input
                              className="input"
                              value={retComment}
                              onChange={(e) => setRetComment(e.target.value)}
                              placeholder={t("order.return.commentPh")}
                            />
                          </label>
                        </div>
                        <div className={styles.formActions}>
                          <button type="button" className="btn" onClick={() => setReturnForId(null)}>{t("common.cancel")}</button>
                          <button type="submit" className="btn btnPrimary">{t("order.return.submit")}</button>
                        </div>
                        <div className={styles.hint}>
                          {t("order.return.hint")}
                        </div>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================== Обёртка (экспорт) ===================== */
export default function Profile() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="container">
        <h1>{t("profile.title")}</h1>
        <div className="card" style={{ padding: ".9rem" }}>{t("loading.profile")}</div>
      </div>
    );
  }

  if (!user) return <ProfileGuest />;
  return <ProfileAuthed />;
}
