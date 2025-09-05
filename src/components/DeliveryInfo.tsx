// src/components/DeliveryInfo.tsx
import styles from "./DeliveryInfo.module.scss";
import { fmtEUR } from "@/utils/money";
import { useCart } from "@/contexts/CartContext";
import React, { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { PickupLocation } from "@/types/location";

const VAT_RATE = 0.19;
const FREE_THRESHOLD = 49; // €
const DHL_COST = 4.99;
const EXPRESS_COST = 12.9;

// sessionStorage ключ для выбранного пункта (подхват на Checkout)
const PACK_CHOICE_KEY = "pm.packstation.choice.v1";

// простой кэш результатов, чтобы не жечь лимит DHL (500/сутки)
const LOC_CACHE_KEY = "pm.loc.cache.v1";
type CacheMap = Record<string, { ts: number; items: PickupLocation[] }>;
const getCache = (): CacheMap => {
  try { return JSON.parse(localStorage.getItem(LOC_CACHE_KEY) || "{}"); } catch { return {}; }
};
const putCache = (k: string, items: PickupLocation[]) => {
  const map = getCache();
  map[k] = { ts: Date.now(), items };
  localStorage.setItem(LOC_CACHE_KEY, JSON.stringify(map));
};

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

  // ---- расчёт доставки, как было ----
  const [qty, setQty] = useState<number>(1);
  const inc = () => setQty(q => Math.min(99, q + 1));
  const dec = () => setQty(q => Math.max(1, q - 1));
  const onQtyInput = (v: string) => {
    const n = Math.max(1, Math.min(99, Number(v.replace(/\D+/g, "")) || 1));
    setQty(n);
  };

  const subtotalWithThis = total + productPrice * qty;
  const leftToFree = Math.max(0, FREE_THRESHOLD - subtotalWithThis);
  const dhlCost = leftToFree === 0 ? 0 : DHL_COST;
  const packstationCost = dhlCost;

  const vatForItem = useMemo(() => {
    const vat = productPrice - productPrice / (1 + VAT_RATE);
    return Math.round(vat * 100) / 100;
  }, [productPrice]);

  const now = new Date();
  const paketStart = addBusinessDays(now, 2);
  const paketEnd = addBusinessDays(now, 3);
  const expressDay = addBusinessDays(now, 1);

  // ---- НОВОЕ: поиск DHL Packstation / Postfiliale ----
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  const findLocations = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null); setSavedHint(null);
    const plz = zip.trim();
    const ort = city.trim();
    if (!/^\d{3,5}$/.test(plz)) { setErr("Введите корректный PLZ (минимум 3 цифры)."); return; }

    // 24h кэш
    const key = `${plz}|${ort}|packstation`;
    const cache = getCache();
    const cached = cache[key];
    if (cached && Date.now() - cached.ts < 86400000) {
      setLocations(cached.items);
      return;
    }

    setLoading(true);
    try {
      const res = await api.locations.search(plz, ort || undefined, "packstation", 5, 10);
      setLocations(res);
      putCache(key, res);
      if (!res.length) setErr("Рядом ничего не найдено. Попробуйте другой PLZ/город.");
    } catch (e: any) {
      setErr(e?.message || "Не удалось получить пункты DHL.");
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (loc: PickupLocation) => {
    try {
      sessionStorage.setItem(PACK_CHOICE_KEY, JSON.stringify({
        id: loc.id,
        name: loc.name,
        number: loc.packstationNumber ?? null,
        street: loc.street,
        houseNo: loc.houseNo ?? "",
        zip: loc.zip,
        city: loc.city,
        savedAt: new Date().toISOString(),
      }));
      setSavedHint(`Сохранено: ${loc.name}${loc.packstationNumber ? ` №${loc.packstationNumber}` : ""}, ${[loc.street, loc.houseNo].filter(Boolean).join(" ")}, ${loc.zip} ${loc.city}. Откройте «Оформление», чтобы выбрать этот пункт.`);
    } catch { /* ignore */ }
  };

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

      {/* НОВОЕ: быстрый поиск пунктов DHL рядом */}
      <div className="hr" style={{ marginTop: ".75rem" }} />
      <div style={{ marginTop: ".5rem" }}>
        <div style={{ fontWeight: 600, marginBottom: ".4rem" }}>Найти ближайшую Packstation</div>
        <form onSubmit={findLocations} style={{ display: "grid", gap: ".5rem", gridTemplateColumns: "120px 1fr auto" }}>
          <input className="input" placeholder="PLZ" value={zip} onChange={e => setZip(e.target.value)} inputMode="numeric" />
          <input className="input" placeholder="Город (опц.)" value={city} onChange={e => setCity(e.target.value)} />
          <button className="btn">Найти</button>
        </form>
        {err && <div className="card" style={{ padding: ".6rem", marginTop: ".5rem" }}>{err}</div>}
        {loading && <div className="card" style={{ padding: ".6rem", marginTop: ".5rem" }}>Ищем ближайшие пункты…</div>}
        {!loading && locations.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: ".6rem 0 0 0", display: "grid", gap: ".5rem" }}>
            {locations.slice(0, 6).map(loc => (
              <li key={loc.id} className="card" style={{ padding: ".6rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".75rem" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {loc.name}{loc.packstationNumber ? ` №${loc.packstationNumber}` : ""}
                  </div>
                  <div style={{ opacity: .8 }}>
                    {[loc.street, loc.houseNo].filter(Boolean).join(" ")}, {loc.zip} {loc.city}
                    {typeof loc.distance === "number" ? ` • ${loc.distance.toFixed(1)} km` : ""}
                  </div>
                </div>
                <button className="btn" onClick={() => selectLocation(loc)}>Выбрать</button>
              </li>
            ))}
          </ul>
        )}
        {savedHint && (
          <div className="card" style={{ padding: ".6rem", marginTop: ".5rem" }}>
            {savedHint}
          </div>
        )}
      </div>

      {/* Информация — списком */}
      <ul className={styles.infoList}>
        <li>
          <span className={styles.icon} aria-hidden />
          <div>
            <div className={styles.infoTitle}>НДС (MwSt)</div>
            <div className={styles.infoText}>
              Цена включает 19% НДС. Для {qty} шт: ≈ <b>{fmtEUR(vatForItem * qty)}</b>.
            </div>
          </div>
        </li>
        <li>
          <span className={styles.icon} aria-hidden />
          <div>
            <div className={styles.infoTitle}>Оплата</div>
            <div className={styles.infoText}>Visa, Mastercard.</div>
          </div>
        </li>
        <li>
          <span className={styles.icon} aria-hidden />
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
