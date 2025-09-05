// src/pages/Profile.tsx
import { useMemo, useState, useEffect } from "react";
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
  saveAddresses as saveAddressesLocal,
} from "@/utils/addresses";
import type { Address } from "@/types";
import type { Order, OrderStatus } from "@/types";
import { listOrders as listOrdersSrv, requestReturn as requestReturnSrv, cancelOrder as cancelOrderSrv } from "@/utils/orders";


/* ===== Utils ===== */
function addrToLines(a: Address): string[] {
  const l1 = [a.firstName, a.lastName].filter(Boolean).join(" ");
  const l2 = a.packType
    ? `${a.packType === "postfiliale" ? "Postfiliale" : "Packstation"}${a.stationNr ? " #" + a.stationNr : ""}`
    : [a.street, a.house].filter(Boolean).join(" ");
  const l3 = [a.zip, a.city].filter(Boolean).join(" ");
  return [l1, l2, l3].filter(Boolean);
}

const statusLabel: Record<OrderStatus, string> = {
  processing: "Обработка",
  packed: "Собираем",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
  refund_requested: "Возврат запрошен",
  refunded: "Возврат оформлен",
};

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

/* ======================= Вью «гость» ======================= */
function ProfileGuest() {
  return (
    <div className="container">
      <h1>Профиль</h1>
      <div className={`card ${styles.empty}`}>
        <div>Вы не авторизованы.</div>
        <div className={styles.emptyActions}>
          <Link to="/auth?next=/profile" className="btn btnPrimary">Войти / Регистрация</Link>
          <Link to="/" className="btn">На главную</Link>
        </div>
      </div>
    </div>
  );
}

/* ================== Вью «авторизован» ===================== */
function ProfileAuthed() {
  const auth = useAuth();
  const user = auth.user!;

  // tabs
  const initTab = (): "profile" | "address" | "orders" => {
    try {
      const t = new URL(window.location.href).searchParams.get("tab");
      return (t === "address" || t === "orders") ? t : "profile";
    } catch { return "profile"; }
  };
  const [tab, _setTab] = useState<"profile" | "address" | "orders">(initTab());
  const setTab = (t: "profile" | "address" | "orders") => {
    _setTab(t);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", t);
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
      // тут можно показать "Сохранено"
    } catch (err: any) {
      alert(err?.message || "Не удалось сохранить профиль.");
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
      alert("Пожалуйста, заполните имя, фамилию, PLZ и город.");
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
      alert(err?.message || "Не удалось сохранить адрес.");
    } finally {
      setAddrLoading(false);
    }
  };

  const removeAddress = async (id: string) => {
    if (!confirm("Удалить этот адрес?")) return;
    try {
      setAddrLoading(true);
      const next = await removeAddressSrv(id);
      setAddresses(next);
    } catch (err: any) {
      alert(err?.message || "Не удалось удалить адрес.");
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
      alert(err?.message || "Не удалось изменить адрес по умолчанию.");
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
    if (!confirm("Отменить этот заказ?")) return;
    await cancelOrderSrv(o.id);
    await reloadOrders();
    alert("Заказ отменён.");
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
    if (!retReason) { alert("Пожалуйста, выберите причину возврата."); return; }
    await requestReturnSrv(returnForId, retReason, retComment || "");
    setReturnForId(null);
    setRetReason(""); setRetComment("");
    await reloadOrders();
    alert("Запрос на возврат отправлен.");
  };

  return (
    <div className="container">
      <h1>Профиль</h1>

      <div className={styles.tabs} role="tablist">
        <button role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? styles.tabActive : styles.tab} onClick={() => setTab("profile")}>Профиль</button>
        <button role="tab" aria-selected={tab === "address"} className={tab === "address" ? styles.tabActive : styles.tab} onClick={() => setTab("address")}>Адреса</button>
        <button role="tab" aria-selected={tab === "orders"} className={tab === "orders" ? styles.tabActive : styles.tab} onClick={() => setTab("orders")}>Заказы</button>
        <div className={styles.spacer} />
        <button className="btn" onClick={auth.logout}>Выйти</button>
      </div>

      {/* ---------- Профиль ---------- */}
      {tab === "profile" && (
        <form className={`${styles.form}`} onSubmit={saveProfile}>
          <div className={styles.twoCols}>
            <label className={styles.field}>
              <span>Имя</span>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
          </div>
          <button className="btn btnPrimary" type="submit">Сохранить</button>
          <div className={styles.hint}>Эти данные используются для заказов и уведомлений.</div>
        </form>
      )}

      {/* ---------- Адреса ---------- */}
      {tab === "address" && (
        <div className={styles.addrWrap}>
          <div className={styles.addrHead}>
            <h2>Мои адреса</h2>
            <button className="btn btnPrimary" onClick={startAdd} disabled={addrLoading}>Добавить адрес</button>
          </div>

          {addrLoading && (
            <div className="card" style={{ padding: ".7rem" }}>Синхронизируем адреса…</div>
          )}

          {addresses.length === 0 ? (
            <div className="card" style={{ padding: ".9rem" }}>
              Адресов нет. Нажмите <b>«Добавить адрес»</b>, чтобы создать первый.
            </div>
          ) : (
            <div className={styles.addrList}>
              {addresses.map(a => (
                <article key={a.id} className={`${styles.addrCard}`}>
                  <div className={styles.addrTop}>
                    <div className={styles.addrLines}>
                      {addrToLines(a).map((ln, i) => <div key={i}>{ln}</div>)}
                      {a.phone && <div className={styles.muted}>{a.phone}</div>}
                      {a.note && <div className={styles.muted}>{a.note}</div>}
                      {a.packType && a.postNummer && (
                        <div className={styles.muted}>Postnummer: {a.postNummer}</div>
                      )}
                    </div>
                    <div className={styles.addrBadges}>
                      {a.isDefault && <span className="badge">По умолчанию</span>}
                    </div>
                  </div>

                  <div className={styles.addrActions}>
                    {!a.isDefault && <button className="btn" onClick={() => setDefault(a.id)} disabled={addrLoading}>Сделать основным</button>}
                    <button className="btn" onClick={() => startEdit(a)} disabled={addrLoading}>Редактировать</button>
                    <button className="btn" onClick={() => removeAddress(a.id)} disabled={addrLoading}>Удалить</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {showForm && (
            <form className={`card ${styles.form}`} onSubmit={submitAddress}>
              <div className={styles.formHead}>
                <h3>{editingId ? "Редактировать адрес" : "Новый адрес"}</h3>
                {!editingId && addresses.length > 0 && (
                  <label className={styles.checkInline}>
                    <input
                      type="checkbox"
                      checked={!!draft.isDefault}
                      onChange={(e) => setDraft((d: Address) => ({ ...d, isDefault: e.target.checked }))}
                    />
                    <span>Сделать адресом по умолчанию</span>
                  </label>
                )}
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>Имя (Vorname)</span>
                  <input className="input" value={draft.firstName} onChange={e => setDraft((d: Address) => ({ ...d, firstName: e.target.value }))} required />
                </label>
                <label className={styles.field}>
                  <span>Фамилия (Nachname)</span>
                  <input className="input" value={draft.lastName} onChange={e => setDraft((d: Address) => ({ ...d, lastName: e.target.value }))} required />
                </label>
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>Улица (Straße)</span>
                  <input className="input" value={draft.street} onChange={e => setDraft((d: Address) => ({ ...d, street: e.target.value }))} />
                </label>
                <label className={styles.field}>
                  <span>Дом (Hausnummer)</span>
                  <input className="input" value={draft.house} onChange={e => setDraft((d: Address) => ({ ...d, house: e.target.value }))} />
                </label>
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>PLZ</span>
                  <input className="input" value={draft.zip} onChange={e => setDraft((d: Address) => ({ ...d, zip: e.target.value }))} inputMode="numeric" pattern="\d{5}" required />
                </label>
                <label className={styles.field}>
                  <span>Город (Ort)</span>
                  <input className="input" value={draft.city} onChange={e => setDraft((d: Address) => ({ ...d, city: e.target.value }))} required />
                </label>
              </div>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>Телефон</span>
                  <input className="input" value={draft.phone || ""} onChange={e => setDraft((d: Address) => ({ ...d, phone: e.target.value }))} placeholder="+49 ..." />
                </label>
                <label className={styles.field}>
                  <span>Комментарий</span>
                  <input className="input" value={draft.note || ""} onChange={e => setDraft((d: Address) => ({ ...d, note: e.target.value }))} placeholder="Подъезд, этаж, код..." />
                </label>
              </div>

              <div className={`card ${styles.packCard}`}>
                <div className={styles.packTitle}>DHL Packstation / Postfiliale (опционально)</div>
                <div className={styles.twoCols}>
                  <label className={styles.field}>
                    <span>Тип пункта</span>
                    <select className="input" value={draft.packType || ""} onChange={e => setDraft((d: Address) => ({ ...d, packType: e.target.value as any }))}>
                      <option value="">—</option>
                      <option value="packstation">Packstation</option>
                      <option value="postfiliale">Postfiliale</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Postnummer</span>
                    <input className="input" value={draft.postNummer || ""} onChange={e => setDraft((d: Address) => ({ ...d, postNummer: e.target.value }))} />
                  </label>
                </div>
                <div className={styles.twoCols}>
                  <label className={styles.field}>
                    <span>{draft.packType === "postfiliale" ? "Filiale Nr" : "Packstation Nr"}</span>
                    <input className="input" value={draft.stationNr || ""} onChange={e => setDraft((d: Address) => ({ ...d, stationNr: e.target.value }))} />
                  </label>
                  <div />
                </div>
                <div className={styles.packHint}>Эти поля нужны, если хотите доставку в пункт выдачи.</div>
              </div>

              <div className={styles.formActions}>
                <button className="btn" type="button" onClick={cancelForm} disabled={addrLoading}>Отмена</button>
                <button className="btn btnPrimary" type="submit" disabled={addrLoading}>{editingId ? "Сохранить" : "Добавить"}</button>
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
              Заказов пока нет. <Link to="/catalog">Перейти в каталог</Link>
            </div>
          ) : (
            <div className={styles.orderList}>
              {orders.map((o) => {
                const st: OrderStatus = (o.status as OrderStatus) || "processing";
                return (
                  <article key={o.id} className={`card ${styles.orderCard}`}>
                    <header className={styles.orderHead}>
                      <div>Заказ <b>{o.id.slice(0, 8)}</b></div>
                      <div className={styles.orderBadges}>
                        <span className="badge">{new Date(o.createdAt).toLocaleString("de-DE")}</span>
                        {o.payment?.status === "paid"
                          ? <span className="badge" title={`•••• ${o.payment?.last4 || ""}`}>Оплачено</span>
                          : <span className="badge">Ожидает оплаты</span>}
                        <span className={`${styles.statusBadge} badge`} data-variant={BADGES[st] || "info"}>
                          {statusLabel[st]}
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
                              <Link to={`/product/${i.slug}`}>Открыть товар</Link>
                            </div>
                          </div>
                          <div className={styles.itemQty}>×{i.qty}</div>
                          <div className={styles.itemSum}><b>{fmtEUR(i.qty * i.price)}</b></div>
                        </div>
                      ))}
                    </div>

                    <div className="hr" />
                    <div className={styles.totalRow}>
                      <span>Итого</span>
                      <b>{fmtEUR((o as any)._total)}</b>
                    </div>

                    <div className={styles.orderActions}>
                      {canCancel(o as any) && (
                        <button className="btn" onClick={() => cancelOrder(o as any)}>
                          Отменить заказ
                        </button>
                      )}
                      {canRequestReturn(o as any) && (
                        <button className="btn" onClick={() => openReturnForm(o as any)}>
                          Запросить возврат
                        </button>
                      )}
                    </div>

                    {returnForId === o.id && (
                      <form className={styles.returnForm} onSubmit={submitReturn}>
                        <div className={styles.twoCols}>
                          <label className={styles.field}>
                            <span>Причина</span>
                            <select
                              className="input"
                              value={retReason}
                              onChange={(e) => setRetReason(e.target.value)}
                              required
                            >
                              <option value="">— выберите причину —</option>
                              <option value="not_fit">Не подошёл / не понравился</option>
                              <option value="defect">Брак / повреждение</option>
                              <option value="wrong">Неверный товар</option>
                              <option value="other">Другое</option>
                            </select>
                          </label>
                          <label className={styles.field}>
                            <span>Комментарий (необязательно)</span>
                            <input
                              className="input"
                              value={retComment}
                              onChange={(e) => setRetComment(e.target.value)}
                              placeholder="Опишите детали, если нужно"
                            />
                          </label>
                        </div>
                        <div className={styles.formActions}>
                          <button type="button" className="btn" onClick={() => setReturnForId(null)}>Отмена</button>
                          <button type="submit" className="btn btnPrimary">Отправить запрос</button>
                        </div>
                        <div className={styles.hint}>
                          После подтверждения мы пришлём инструкцию по возврату на ваш email.
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

  if (loading) {
    return (
      <div className="container">
        <h1>Профиль</h1>
        <div className="card" style={{ padding: ".9rem" }}>Загружаем профиль…</div>
      </div>
    );
  }

  if (!user) return <ProfileGuest />;
  return <ProfileAuthed />;
}
