// src/utils/addresses.ts
export type PackType = "packstation" | "postfiliale";
export type Address = {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  house: string;
  zip: string;
  city: string;
  phone?: string;
  note?: string;
  packType?: "" | PackType;
  postNummer?: string;
  stationNr?: string;
  isDefault?: boolean;
};

export const ADDR_SINGLE_KEY = "pm.address.v1";   // старый формат (один адрес)
export const ADDR_LIST_KEY   = "pm.addresses.v1"; // новый список

export function loadAddresses(): Address[] {
  try {
    const listRaw = localStorage.getItem(ADDR_LIST_KEY);
    if (listRaw) {
      const list = JSON.parse(listRaw) as Address[];
      return Array.isArray(list) ? list : [];
    }
    // миграция из одного адреса
    const oldRaw = localStorage.getItem(ADDR_SINGLE_KEY);
    if (oldRaw) {
      const a = JSON.parse(oldRaw) as Omit<Address, "id">;
      if (a && typeof a === "object") {
        const migrated: Address = { id: crypto.randomUUID(), ...a, isDefault: true };
        localStorage.setItem(ADDR_LIST_KEY, JSON.stringify([migrated]));
        localStorage.removeItem(ADDR_SINGLE_KEY);
        return [migrated];
      }
    }
  } catch {}
  return [];
}

// write-through: пишем список и дополнительно кладём дефолтный адрес в старый ключ
export function saveAddresses(list: Address[]) {
  localStorage.setItem(ADDR_LIST_KEY, JSON.stringify(list));
  const def = list.find(a => a.isDefault) ?? list[0];
  if (def) {
    const single = {
      firstName: def.firstName,
      lastName: def.lastName,
      street: def.street,
      house: def.house,
      zip: def.zip,
      city: def.city,
      phone: def.phone ?? "",
      note: def.note ?? "",
      packType: def.packType ?? "",
      postNummer: def.postNummer ?? "",
      stationNr: def.stationNr ?? "",
    };
    localStorage.setItem(ADDR_SINGLE_KEY, JSON.stringify(single));
  }
}

export function addrLabel(a: Address) {
  const n = [a.firstName, a.lastName].filter(Boolean).join(" ");
  const s = [a.street, a.house].filter(Boolean).join(" ");
  const c = [a.zip, a.city].filter(Boolean).join(" ");
  const p = a.packType ? (a.packType === "postfiliale" ? "Postfiliale" : "Packstation") : "";
  return [n, a.packType ? `${p} #${a.stationNr || ""}`.trim() : s, c].filter(Boolean).join(" · ");
}

export const emptyAddress = (suggestedName = ""): Address => ({
  id: "",
  firstName: suggestedName || "",
  lastName: "",
  street: "",
  house: "",
  zip: "",
  city: "",
  phone: "",
  note: "",
  packType: "",
  postNummer: "",
  stationNr: "",
  isDefault: false,
});