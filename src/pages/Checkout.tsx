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
import { useI18n } from "@/i18n/I18nContext";

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
  const { t } = useI18n();
  const { items, total } = useCart();
  const { user } = useAuth();

  // адресная книга
  const [addresses, setAddresses] = useState<Address[]>(loadAddresses);
  const defaultAddr = addresses.find(a => a.isDefault) ?? addresses[0] ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await listAddressesSrv();
      if (mounted) setAddresses(list);
    })();
    return () => { mounted = false; };
  }, []);

  const [shipMethod, setShipMethod] = useState<ShipMethod>(() => {
    const list = loadAddresses();
    const d = list.find(a => a.isDefault) ?? list[0];
    return d?.packType ? "packstation" : "dhl";
  });

  const [addrMode, setAddrMode] = useState<"book" | "manual">(addresses.length ? "book" : "manual");
  const [selectedId, setSelectedId] = useState<string | null>(defaultAddr?.id ?? null);

  const compatibleAddresses = useMemo(() => {
    if (shipMethod === "packstation") return addresses.filter(a => !!a.packType);
    if (shipMethod === "pickup") return [];
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
    if (shipMethod === "pickup") return;
    if (selectedAddr) return;
    const first = compatibleAddresses[0];
    if (first) setSelectedId(first.id);
  }, [shipMethod, compatibleAddresses, selectedAddr]);

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

  const firstAddress = addresses.length === 0;
  const [saveToBook, setSaveToBook] = useState<boolean>(firstAddress);
  const [makeDefault, setMakeDefault] = useState<boolean>(firstAddress);
  const [savedFlash, setSavedFlash] = useState(false);

  const isManualValid = useMemo(() => {
    if (shipMethod === "packstation") {
      return !!postNummer && !!stationNr && /^\d{5}$/.test(zip) && city.trim().length > 0;
    }
    if (shipMethod === "pickup") return true;
    return !!street && !!house && /^\d{5}$/.test(zip) && city.trim().length > 0;
  }, [shipMethod, postNummer, stationNr, zip, city, street, house]);

  const eta =
    shipMethod === "express" ? t("eta.express")
      : shipMethod === "pickup" ? t("eta.pickup")
        : t("eta.standard");

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

  const saveManualNow = async () => {
    if (!saveToBook) return;
    if (!isManualValid) {
      alert(t("alert.checkRequired"));
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
      alert(e?.message || t("alert.saveAddressFailed"));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert(t("alert.cartEmpty"));
    if (!agree) return alert(t("alert.mustAgree"));

    let addressForDraft:
      | { street: string; house: string; zip: string; city: string; note?: string }
      | { postNummer: string; stationNr: string; zip: string; city: string; note?: string }
      | { pickup: string };

    if (shipMethod === "pickup") {
      addressForDraft = { pickup: "Berlin-Mitte, Mon–Sat 10–20" };
    } else if (addrMode === "book") {
      if (!selectedAddr) return alert(t("alert.selectSavedOrManual"));
      if (shipMethod === "packstation") {
        if (!selectedAddr.packType || !selectedAddr.postNummer || !selectedAddr.stationNr || !selectedAddr.zip || !selectedAddr.city) {
          return alert(t("alert.addrNotSuitablePack"));
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
          return alert(t("alert.savedAddressMissingFields"));
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
      if (!isManualValid) return alert(t("alert.checkRequired"));
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
        ? t("checkout.addMoreForFree").replace("{amount}", fmtEUR(freeLeft))
        : t("checkout.youHaveFree")
      : null;

  return (
    <div className="container">
      <h1>{t("checkout.title")}</h1>
      <div className={styles.grid}>
        <form className={`card ${styles.form}`} onSubmit={onSubmit}>
          <h3 className={styles.sectionTitle}>{t("checkout.recipient")}</h3>
          <div className={styles.twoCols}>
            <Field label={t("field.firstName")}>
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </Field>
            <Field label={t("field.lastName")}>
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </Field>
          </div>
          <div className={styles.twoCols}>
            <Field label={t("field.email")}>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label={t("field.phoneOptional")}>
              <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 ..." />
            </Field>
          </div>

          <h3 className={styles.sectionTitle}>{t("checkout.shippingTitle")}</h3>

          <div className={styles.shipOptions + ""}>
            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "dhl"} onChange={() => setShipMethod("dhl")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>{t("ship.dhl")}</div>
                <div className={styles.shipMeta}>
                  {subtotal >= FREE_THRESHOLD ? t("ship.freeFrom49WithYouFree") : `${fmtEUR(4.99)} · ${t("ship.tracking")}`}
                </div>
              </div>
              <div className={styles.shipPrice}>{subtotal >= FREE_THRESHOLD ? fmtEUR(0) : fmtEUR(4.99)}</div>
            </label>

            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "express"} onChange={() => setShipMethod("express")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>{t("ship.express")}</div>
                <div className={styles.shipMeta}>{t("ship.express.meta")}</div>
              </div>
              <div className={styles.shipPrice}>{fmtEUR(12.9)}</div>
            </label>

            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "packstation"} onChange={() => setShipMethod("packstation")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>{t("ship.packstation")}</div>
                <div className={styles.shipMeta}>
                  {subtotal >= FREE_THRESHOLD ? (t("footer.free") ?? (t("cart.total") && "Бесплатно")) : fmtEUR(4.99)} · {(t("home.recommended") ?? "забрать в удобное время")}
                </div>
              </div>
              <div className={styles.shipPrice}>{subtotal >= FREE_THRESHOLD ? fmtEUR(0) : fmtEUR(4.99)}</div>
            </label>

            <label className={styles.shipRow}>
              <input type="radio" name="ship" checked={shipMethod === "pickup"} onChange={() => setShipMethod("pickup")} />
              <div className={styles.shipBody}>
                <div className={styles.shipTitle}>{t("ship.pickup")}</div>
                <div className={styles.shipMeta}>{t("ship.pickup.meta")}</div>
              </div>
              <div className={styles.shipPrice}>{fmtEUR(0)}</div>
            </label>
          </div>

          {shipMethod !== "pickup" && (
            <div className={styles.addrBlock}>
              <div className={styles.addrHead}>
                <h3>{t("checkout.address.title")}</h3>
                <div className={styles.addrMode}>
                  <label>
                    <input
                      type="radio"
                      name="addrmode"
                      checked={addrMode === "book"}
                      onChange={() => setAddrMode("book")}
                      disabled={compatibleAddresses.length === 0}
                    />
                    <span>{t("checkout.address.saved")}</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="addrmode"
                      checked={addrMode === "manual" || compatibleAddresses.length === 0}
                      onChange={() => setAddrMode("manual")}
                    />
                    <span>{t("checkout.address.new")}</span>
                  </label>
                </div>
              </div>

              {addrMode === "book" && compatibleAddresses.length > 0 && (
                <>
                  <Field label={t("checkout.address.choose")}>
                    <select
                      className="input"
                      value={selectedId || ""}
                      onChange={(e) => setSelectedId(e.target.value || null)}
                    >
                      {compatibleAddresses.map(a => (
                        <option key={a.id} value={a.id}>
                          {addrLabel(a)}{a.isDefault ? t("address.primarySuffix") : ""}
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
                          <Link to="/profile?tab=address" className="btn">{t("checkout.address.manage")}</Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: ".7rem" }}>
                      {t("checkout.address.noSuitable")}{" "}
                      <Link to="/profile?tab=address">{t("checkout.address.manage")}</Link>.
                    </div>
                  )}
                </>
              )}

              {(addrMode === "manual" || compatibleAddresses.length === 0) && (
                <>
                  {shipMethod === "packstation" ? (
                    <>
                      <div className={styles.twoCols}>
                        <Field label={t("field.pack.type")}>
                          <select className="input" value={packType} onChange={(e) => setPackType(e.target.value as PackType)}>
                            <option value="packstation">Packstation</option>
                            <option value="postfiliale">Postfiliale</option>
                          </select>
                        </Field>
                        <Field label={t("field.postnummer")}>
                          <input className="input" value={postNummer} onChange={(e) => setPostNummer(e.target.value)} required />
                        </Field>
                      </div>
                      <div className={styles.twoCols}>
                        <Field label={packType === "packstation" ? t("field.packstationNr") : t("field.filialeNr")}>
                          <input className="input" value={stationNr} onChange={(e) => setStationNr(e.target.value)} required />
                        </Field>
                        <Field label={t("field.plz")}>
                          <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} required pattern="\d{5}" />
                        </Field>
                      </div>
                      <Field label={t("field.city")}>
                        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
                      </Field>
                    </>
                  ) : (
                    <>
                      <div className={styles.twoCols}>
                        <Field label={t("field.street")}>
                          <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} required />
                        </Field>
                        <Field label={t("field.house")}>
                          <input className="input" value={house} onChange={(e) => setHouse(e.target.value)} required />
                        </Field>
                      </div>
                      <div className={styles.twoCols}>
                        <Field label={t("field.plz")}>
                          <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} required pattern="\d{5}" />
                        </Field>
                        <Field label={t("field.city")}>
                          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
                        </Field>
                      </div>
                    </>
                  )}

                  <Field label={t("field.courierNote")}>
                    <textarea
                      rows={3}
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                      placeholder={t("placeholder.courierNote")}
                    />
                  </Field>

                  <div className={styles.saveAddressRow}>
                    <label className={styles.check}>
                      <input type="checkbox" checked={saveToBook} onChange={(e) => setSaveToBook(e.target.checked)} />
                      <span>{t("checkout.saveAddress")}</span>
                    </label>
                    {saveToBook && (
                      <>
                        <label className={styles.check}>
                          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
                          <span>{t("checkout.makeDefault")}</span>
                        </label>
                        <div className={styles.manualSaveRow}>
                          <button
                            type="button"
                            className="btn"
                            onClick={saveManualNow}
                            disabled={!isManualValid}
                            title={!isManualValid ? t("checkout.fillRequired") : t("checkout.saveNowTitle")}
                          >
                            {t("checkout.saveNow")}
                          </button>
                          {savedFlash && <span className={styles.okMark}>{t("checkout.saved")}</span>}
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
            <span>{t("checkout.agree")}</span>
          </label>

          <button className="btn btnPrimary" type="submit">{t("checkout.submit")}</button>
        </form>

        <aside className={"card " + styles.aside}>
          <div className={styles.totalRow}><span>{t("checkout.itemsCount")}</span><b>{items.length}</b></div>
          <div className={styles.totalRow}><span>{t("checkout.subtotal")}</span><b>{fmtEUR(subtotal)}</b></div>
          <div className={styles.totalRow}>
            <span>{`${t("checkout.shipping")}${eta ? ` (${eta})` : ""}`}</span>
            <b>{fmtEUR(shipCost)}</b>
          </div>
          {freeNote && (
            <div className={styles.noteBar} data-good={freeLeft <= 0}>
              {freeNote}
            </div>
          )}
          <div className="hr" />
          <div className={styles.totalBig}><span>{t("checkout.toPay")}</span><b>{fmtEUR(grand)}</b></div>
          <div className={styles.vatNote}>{t("checkout.vatIncluded").replace("{amount}", fmtEUR(vatIncluded))}</div>

          {items.length === 0 && (
            <div className={styles.empty}>
              {t("cart.empty")}. <Link to="/catalog">{t("home.toCatalog")}</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
