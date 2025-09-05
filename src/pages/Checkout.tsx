// src/pages/Checkout.tsx
import Field from "@/components/Field";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./Checkout.module.scss";
import { Link, navigate } from "@/router/Router";
import { useEffect, useMemo, useState } from "react";
import {
  loadAddresses,
  saveAddresses as saveAddressesLocal,
  addrLabel,
  listAddresses as listAddressesSrv,
  createAddress as createAddressSrv,
} from "@/utils/addresses";
import type { Address, PackType, ShipMethod } from "@/types";
import { api } from "@/lib/api";

const FREE_THRESHOLD = 49; // € — бесплатная доставка DHL/Packstation от этой суммы
const VAT_RATE = 0.19;

const fmtEUR = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

function calcShipping(method: ShipMethod, subtotal: number) {
  switch (method) {
    case "dhl":
    case "packstation":
      return subtotal >= FREE_THRESHOLD ? 0 : 4.99;
    case "express":
      return 12.9;
    case "pickup":
      return 0;
  }
}

export default function Checkout() {
  const { items, total } = useCart();
  const { user } = useAuth();

  // адресная книга
  const [addresses, setAddresses] = useState<Address[]>(loadAddresses);
  const defaultAddr = addresses.find(a => a.isDefault) ?? addresses[0] ?? null;

  // синхронизируем с бэком при монтировании
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await listAddressesSrv();
      if (mounted) setAddresses(list);
    })();
    return () => { mounted = false; };
  }, []);

  // способ доставки
  const [shipMethod, setShipMethod] = useState<ShipMethod>(() => {
    const list = loadAddresses();
    const d = list.find(a => a.isDefault) ?? list[0];
    return d?.packType ? "packstation" : "dhl";
  });

  // режим адреса
  const [addrMode, setAddrMode] = useState<"book" | "manual">(addresses.length ? "book" : "manual");
  const [selectedId, setSelectedId] = useState<string | null>(defaultAddr?.id ?? null);

  // совместимые адреса
  const compatibleAddresses = useMemo(() => {
    if (shipMethod === "packstation") return addresses.filter(a => !!a.packType);
    if (shipMethod === "pickup") return []; // адрес не нужен
    return addresses.filter(a => !a.packType);
  }, [addresses, shipMethod]);

  const selectedAddr = useMemo(() => {
    const found = addresses.find(a => a.id === selectedId) || null;
    if (!found) return null;
    if (shipMethod === "packstation" && !found.packType) return null;
    if ((shipMethod === "dhl" || shipMethod === "express") && found.packType) return null;
    return found;
  }, [addresses, selectedId, shipMethod]);

  useEffect(() => {
    if (shipMethod === "pickup") return; // адрес не нужен
    if (selectedAddr) return;
    const first = compatibleAddresses[0];
    if (first) setSelectedId(first.id);
  }, [shipMethod, compatibleAddresses, selectedAddr]);

  // суммы
  const subtotal = total;
  const shipCost = useMemo(() => calcShipping(shipMethod, subtotal), [shipMethod, subtotal]);
  const grand = subtotal + shipCost;
  const vatIncluded = +(grand - grand / (1 + VAT_RATE)).toFixed(2);

  // контакты
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  // ручной обычный адрес
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");

  // ручной packstation
  const [packType, setPackType] = useState<PackType>("packstation");
  const [postNummer, setPostNummer] = useState("");
  const [stationNr, setStationNr] = useState("");

  const [extra, setExtra] = useState("");
  const [agree, setAgree] = useState(true);

  // флаги сохранения
  const firstAddress = addresses.length === 0;
  const [saveToBook, setSaveToBook] = useState<boolean>(firstAddress);
  const [makeDefault, setMakeDefault] = useState<boolean>(firstAddress);
  const [savedFlash, setSavedFlash] = useState(false);

  // валидность ручного адреса
  const isManualValid = useMemo(() => {
    if (shipMethod === "packstation") {
      return !!postNummer && !!stationNr && /^\d{5}$/.test(zip) && city.trim().length > 0;
    }
    if (shipMethod === "pickup") return true;
    return !!street && !!house && /^\d{5}$/.test(zip) && city.trim().length > 0;
  }, [shipMethod, postNummer, stationNr, zip, city, street, house]);

  const eta =
    shipMethod === "express" ? "1 Werktag"
      : shipMethod === "pickup" ? "Сразу после подтверждения (самовывоз)"
        : "2–3 Werktage";

  // единый билдер нового адреса из ручных полей
  const buildManualAddress = (): Address => {
    const id = crypto.randomUUID();
    if (shipMethod === "packstation") {
      return {
        id,
        firstName, lastName, phone,
        street: "", house: "",
        zip, city,
        note: extra,
        packType,
        postNummer, stationNr,
        isDefault: makeDefault || addresses.length === 0,
      };
    }
    return {
      id,
      firstName, lastName, phone,
      street, house,
      zip, city,
      note: extra,
      packType: "", postNummer: "", stationNr: "",
      isDefault: makeDefault || addresses.length === 0,
    };
  };

  // ЯВНОЕ сохранение адреса (без перехода к оплате)
  const saveManualNow = async () => {
    if (!saveToBook) return;
    if (!isManualValid) {
      alert("Проверьте обязательные поля адреса.");
      return;
    }
    const newAddr = buildManualAddress();
    try {
      const next = await createAddressSrv(newAddr);
      setAddresses(next);
      const saved = next.find(a => a.id === newAddr.id) || next[next.length - 1];
      setSelectedId(saved?.id ?? null);
      setAddrMode("book");
      if (saved?.packType && shipMethod !== "packstation") setShipMethod("packstation");
      if (!saved?.packType && shipMethod === "packstation") setShipMethod("dhl");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
    } catch (e: any) {
      alert(e?.message || "Не удалось сохранить адрес.");
    }
  };

  // сабмит — сохраняем драфт и переходим на оплату
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert("Корзина пуста");
    if (!agree) return alert("Необходимо согласиться с условиями.");

    let addressForDraft:
      | { street: string; house: string; zip: string; city: string; note?: string }
      | { postNummer: string; stationNr: string; zip: string; city: string; note?: string }
      | { pickup: string };

    if (shipMethod === "pickup") {
      addressForDraft = { pickup: "Berlin-Mitte, Mon–Sat 10–20" };
    } else if (addrMode === "book") {
      if (!selectedAddr) return alert("Выберите сохранённый адрес или переключитесь на ввод вручную.");
      if (shipMethod === "packstation") {
        if (!selectedAddr.packType || !selectedAddr.postNummer || !selectedAddr.stationNr || !selectedAddr.zip || !selectedAddr.city) {
          return alert("Выбранный адрес не подходит для Packstation/Postfiliale.");
        }
        addressForDraft = {
          postNummer: selectedAddr.postNummer!,
          stationNr: selectedAddr.stationNr!,
          zip: selectedAddr.zip,
          city: selectedAddr.city,
          note: selectedAddr.note,
        };
      } else {
        if (!selectedAddr.street || !selectedAddr.house || !selectedAddr.zip || !selectedAddr.city) {
          return alert("В сохранённом адресе не заполнены обязательные поля.");
        }
        addressForDraft = {
          street: selectedAddr.street,
          house: selectedAddr.house,
          zip: selectedAddr.zip,
          city: selectedAddr.city,
          note: selectedAddr.note,
        };
      }
    } else {
      if (!isManualValid) return alert("Проверьте обязательные поля адреса.");
      if (saveToBook) {
        try {
          const newAddr = buildManualAddress();
          const next = await createAddressSrv(newAddr);
          setAddresses(next);
          const saved = next.find(a => a.id === newAddr.id) || newAddr;
          setSelectedId(saved.id);
          setAddrMode("book");
        } catch {
          const newAddr = buildManualAddress();
          const next = [...addresses, newAddr];
          saveAddressesLocal(next);
          setAddresses(next);
          setSelectedId(newAddr.id);
          setAddrMode("book");
        }
      }
      addressForDraft = shipMethod === "packstation"
        ? { postNummer, stationNr, zip, city, note: extra }
        : { street, house, zip, city, note: extra };
    }

    const draft = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      currency: "EUR",
      vatRate: VAT_RATE,
      totals: { subtotal, shipping: shipCost, grand, vatIncluded },
      items,
      customer: { firstName, lastName, email, phone },
      shipping: {
        method: shipMethod,
        packType: shipMethod === "packstation"
          ? (addrMode === "book" ? (selectedAddr?.packType || "packstation") : packType)
          : null,
        address: addressForDraft,
      },
    };

    localStorage.setItem("pm.checkoutDraft.v1", JSON.stringify(draft));
    navigate("/payment");
  };

  const freeLeft = Math.max(0, FREE_THRESHOLD - subtotal);
  const freeNote =
    shipMethod === "dhl" || shipMethod === "packstation"
      ? freeLeft > 0
        ? `Добавьте ещё ${fmtEUR(freeLeft)} для бесплатной доставки`
        : "У вас бесплатная доставка"
      : null;

  return (
    <div className="container">
      <h1>Оформление заказа</h1>
      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={onSubmit}>
          <h3 className={styles.sectionTitle}>Получатель</h3>
          <div className={styles.twoCols}>
            <Field label="Имя (Vorname)">
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </Field>
            <Field label="Фамилия (Nachname)">
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </Field>
          </div>
          <div className={styles.twoCols}>
            <Field label="Email">
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Телефон (опционально)">
              <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 ..." />
            </Field>
          </div>

          <h3 className={styles.sectionTitle}>Доставка (Deutschland, DHL)</h3>

          <div className={styles.shipOptions + ""}>
            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "dhl"} onChange={() => setShipMethod("dhl")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>DHL Paket • 2–3 Werktage</div>
                <div className={styles.shipMeta}>
                  {subtotal >= FREE_THRESHOLD ? "Бесплатно от 49 € — у вас бесплатно" : fmtEUR(4.99)} · отслеживание
                </div>
              </div>
              <div className={styles.shipPrice}>{subtotal >= FREE_THRESHOLD ? fmtEUR(0) : fmtEUR(4.99)}</div>
            </label>

            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "express"} onChange={() => setShipMethod("express")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>DHL Express • 1 Werktag</div>
                <div className={styles.shipMeta}>курьер, приоритетная обработка</div>
              </div>
              <div className={styles.shipPrice}>{fmtEUR(12.9)}</div>
            </label>

            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "packstation"} onChange={() => setShipMethod("packstation")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>DHL Packstation / Postfiliale</div>
                <div className={styles.shipMeta}>
                  {subtotal >= FREE_THRESHOLD ? "Бесплатно" : fmtEUR(4.99)} · забрать в удобное время
                </div>
              </div>
              <div className={styles.shipPrice}>{subtotal >= FREE_THRESHOLD ? fmtEUR(0) : fmtEUR(4.99)}</div>
            </label>

            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "pickup"} onChange={() => setShipMethod("pickup")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>Самовывоз • Berlin-Mitte</div>
                <div className={styles.shipMeta}>после подтверждения, без очереди</div>
              </div>
              <div className={styles.shipPrice}>{fmtEUR(0)}</div>
            </label>
          </div>

          {/* Адрес (кроме самовывоза) */}
          {shipMethod !== "pickup" && (
            <div className={styles.addrBlock}>
              <div className={styles.addrHead}>
                <h3>Адрес доставки</h3>
                <div className={styles.addrMode}>
                  <label>
                    <input
                      type="radio"
                      name="addrmode"
                      checked={addrMode === "book"}
                      onChange={() => setAddrMode("book")}
                      disabled={compatibleAddresses.length === 0}
                    />
                    <span>Сохранённый</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="addrmode"
                      checked={addrMode === "manual" || compatibleAddresses.length === 0}
                      onChange={() => setAddrMode("manual")}
                    />
                    <span>Новый</span>
                  </label>
                </div>
              </div>

              {/* Сохранённый адрес */}
              {addrMode === "book" && compatibleAddresses.length > 0 && (
                <>
                  <Field label="Выберите адрес">
                    <select
                      className="input"
                      value={selectedId || ""}
                      onChange={(e) => setSelectedId(e.target.value || null)}
                    >
                      {compatibleAddresses.map(a => (
                        <option key={a.id} value={a.id}>
                          {addrLabel(a)}{a.isDefault ? " — основной" : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {selectedAddr ? (
                    <div className={styles.addrPreview + ""}>
                      <div className={styles.previewRow}>
                        <div className={styles.previewCol}>
                          <div className={styles.previewName}>
                            {[selectedAddr.firstName, selectedAddr.lastName].filter(Boolean).join(" ")}
                          </div>
                          {!selectedAddr.packType ? (
                            <>
                              <div>{[selectedAddr.street, selectedAddr.house].filter(Boolean).join(" ")}</div>
                              <div>{[selectedAddr.zip, selectedAddr.city].filter(Boolean).join(" ")}</div>
                            </>
                          ) : (
                            <>
                              <div>{selectedAddr.packType === "postfiliale" ? "Postfiliale" : "Packstation"} #{selectedAddr.stationNr}</div>
                              <div>{[selectedAddr.zip, selectedAddr.city].filter(Boolean).join(" ")}</div>
                              <div className={styles.muted}>Postnummer: {selectedAddr.postNummer}</div>
                            </>
                          )}
                          {selectedAddr.note && <div className={styles.muted}>{selectedAddr.note}</div>}
                        </div>
                        <div className={styles.previewActions}>
                          <Link to="/profile?tab=address" className="btn">Управлять адресами</Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: ".7rem" }}>
                      Нет подходящего адреса. Переключитесь на «Новый» или добавьте адрес в <Link to="/profile?tab=address">профиле</Link>.
                    </div>
                  )}
                </>
              )}

              {/* Новый адрес + моментальное сохранение */}
              {(addrMode === "manual" || compatibleAddresses.length === 0) && (
                <>
                  {shipMethod === "packstation" ? (
                    <>
                      <div className={styles.twoCols}>
                        <Field label="Тип пункта">
                          <select className="input" value={packType} onChange={(e) => setPackType(e.target.value as PackType)}>
                            <option value="packstation">Packstation</option>
                            <option value="postfiliale">Postfiliale</option>
                          </select>
                        </Field>
                        <Field label="Postnummer (DHL Kunden-Nr)">
                          <input className="input" value={postNummer} onChange={(e) => setPostNummer(e.target.value)} required />
                        </Field>
                      </div>
                      <div className={styles.twoCols}>
                        <Field label={packType === "packstation" ? "Packstation Nr" : "Filiale Nr"}>
                          <input className="input" value={stationNr} onChange={(e) => setStationNr(e.target.value)} required />
                        </Field>
                        <Field label="PLZ">
                          <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} required pattern="\d{5}" />
                        </Field>
                      </div>
                      <Field label="Город (Ort)">
                        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
                      </Field>
                    </>
                  ) : (
                    <>
                      <div className={styles.twoCols}>
                        <Field label="Улица (Straße)">
                          <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} required />
                        </Field>
                        <Field label="Дом (Hausnummer)">
                          <input className="input" value={house} onChange={(e) => setHouse(e.target.value)} required />
                        </Field>
                      </div>
                      <div className={styles.twoCols}>
                        <Field label="PLZ">
                          <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} required pattern="\d{5}" />
                        </Field>
                        <Field label="Город (Ort)">
                          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
                        </Field>
                      </div>
                    </>
                  )}

                  <Field label="Комментарий для курьера (необязательно)">
                    <textarea rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Звонить перед доставкой, оставить у соседа и т.п." />
                  </Field>

                  <div className={styles.saveAddressRow}>
                    <label className={styles.check}>
                      <input type="checkbox" checked={saveToBook} onChange={(e) => setSaveToBook(e.target.checked)} />
                      <span>Сохранить адрес в моих адресах</span>
                    </label>
                    {saveToBook && (
                      <>
                        <label className={styles.check}>
                          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
                          <span>Сделать основным</span>
                        </label>
                        <div className={styles.manualSaveRow}>
                          <button
                            type="button"
                            className="btn"
                            onClick={saveManualNow}
                            disabled={!isManualValid}
                            title={!isManualValid ? "Заполните обязательные поля" : "Сохранит адрес не переходя к оплате"}
                          >
                            Сохранить адрес сейчас
                          </button>
                          {savedFlash && <span className={styles.okMark}>Сохранено ✓</span>}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <label className={styles.agree}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>Я согласен с условиями и политикой возврата.</span>
          </label>

          <button className="btn btnPrimary" type="submit">Далее — к оплате</button>
        </form>

        <aside className={"card " + styles.aside}>
          <div className={styles.totalRow}><span>Товаров</span><b>{items.length}</b></div>
          <div className={styles.totalRow}><span>Сумма товаров</span><b>{fmtEUR(subtotal)}</b></div>
          <div className={styles.totalRow}><span>Доставка ({eta})</span><b>{fmtEUR(shipCost)}</b></div>
          {freeNote && (
            <div className={styles.noteBar} data-good={freeLeft <= 0}>
              {freeNote}
            </div>
          )}
          <div className="hr" />
          <div className={styles.totalBig}><span>К оплате</span><b>{fmtEUR(grand)}</b></div>
          <div className={styles.vatNote}>Включая НДС 19%: {fmtEUR(vatIncluded)}</div>

          {items.length === 0 && (
            <div className={styles.empty}>
              Корзина пуста. <Link to="/catalog">Перейти в каталог</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
