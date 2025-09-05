// src/utils/addresses.ts
import { api, getToken } from "@/lib/api";
import type { Address, PackType } from "@/types";

export const ADDR_SINGLE_KEY = "pm.address.v1";   // старый формат (один адрес)
export const ADDR_LIST_KEY   = "pm.addresses.v1"; // основной список

/* ================= Local storage ================= */
export function loadAddresses(): Address[] {
  try {
    const listRaw = localStorage.getItem(ADDR_LIST_KEY);
    if (listRaw) {
      const list = JSON.parse(listRaw) as Address[];
      return Array.isArray(list) ? ensureSingleDefault(list) : [];
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

export function saveAddresses(list: Address[]) {
  const clean = ensureSingleDefault(list);
  localStorage.setItem(ADDR_LIST_KEY, JSON.stringify(clean));
  const def = clean.find(a => a.isDefault) ?? clean[0];
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

/* ================= Helpers ================= */
function ensureSingleDefault(list: Address[]): Address[] {
  const arr = [...list];
  const idx = arr.findIndex(a => a.isDefault);
  if (idx === -1 && arr.length) arr[0].isDefault = true;
  if (idx !== -1) {
    let found = false;
    for (const a of arr) {
      if (a.isDefault && !found) { found = true; continue; }
      if (a.isDefault && found) a.isDefault = false;
    }
  }
  return arr;
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

/* ================ Server-aware store ================ */
/** есть ли смысл битьcя в сервер сейчас */
const canUseServer = () => !!getToken();

/** Синхронизировать список адресов из API в локальное хранилище (если авторизован). */
export async function syncFromServer(): Promise<Address[]> {
  if (!canUseServer()) return loadAddresses();
  try {
    const list = await api.addresses.list();
    saveAddresses(list as Address[]);
    return list as Address[];
  } catch {
    return loadAddresses();
  }
}

/** Server-aware: получить текущие адреса (с попыткой синхронизации). */
export async function listAddresses(): Promise<Address[]> {
  return canUseServer() ? await syncFromServer() : loadAddresses();
}

/** Server-aware: создать адрес и обновить локальное хранилище. Возвращает актуальный список. */
export async function createAddress(a: Address): Promise<Address[]> {
  const list = loadAddresses();
  if (!canUseServer()) {
    const id = a.id || crypto.randomUUID();
    const created = { ...a, id };
    let next = [...list, created];
    if (created.isDefault) next = next.map(x => ({ ...x, isDefault: x.id === created.id }));
    saveAddresses(next);
    return next;
  }
  try {
    const created = await api.addresses.create(a as any);
    // сливаем, заменяя по id
    let next = [...list.filter(x => x.id !== created.id), created as Address];
    if ((created as Address).isDefault) next = next.map(x => ({ ...x, isDefault: x.id === created.id }));
    saveAddresses(next);
    return next;
  } catch {
    // фолбэк в локалку
    const id = a.id || crypto.randomUUID();
    const created = { ...a, id };
    let next = [...list, created];
    if (created.isDefault) next = next.map(x => ({ ...x, isDefault: x.id === created.id }));
    saveAddresses(next);
    return next;
  }
}

/** Server-aware: обновить адрес по id. Возвращает актуальный список. */
export async function updateAddress(id: string, patch: Partial<Address>): Promise<Address[]> {
  const list = loadAddresses();
  const target = list.find(x => x.id === id);
  if (!target) return list;

  if (!canUseServer()) {
    let next = list.map(x => x.id === id ? { ...x, ...patch } : x);
    if (patch.isDefault) next = next.map(x => ({ ...x, isDefault: x.id === id }));
    saveAddresses(next);
    return next;
  }
  try {
    const updated = await api.addresses.update(id, patch as any);
    let next = list.map(x => x.id === id ? (updated as Address) : x);
    if ((updated as Address).isDefault) next = next.map(x => ({ ...x, isDefault: x.id === id }));
    saveAddresses(next);
    return next;
  } catch {
    let next = list.map(x => x.id === id ? { ...x, ...patch } : x);
    if (patch.isDefault) next = next.map(x => ({ ...x, isDefault: x.id === id }));
    saveAddresses(next);
    return next;
  }
}

/** Server-aware: удалить адрес. Возвращает актуальный список. */
export async function removeAddress(id: string): Promise<Address[]> {
  const list = loadAddresses();
  if (!canUseServer()) {
    const next = ensureAfterRemoval(list, id);
    saveAddresses(next);
    return next;
  }
  try {
    await api.addresses.remove(id);
    const next = ensureAfterRemoval(list, id);
    saveAddresses(next);
    return next;
  } catch {
    const next = ensureAfterRemoval(list, id);
    saveAddresses(next);
    return next;
  }
}

function ensureAfterRemoval(list: Address[], id: string): Address[] {
  const next = list.filter(x => x.id !== id);
  if (!next.some(x => x.isDefault) && next.length > 0) next[0].isDefault = true;
  return next;
}

/** Server-aware: назначить адрес по умолчанию. Возвращает актуальный список. */
export async function setDefaultAddress(id: string): Promise<Address[]> {
  const list = loadAddresses();
  if (!canUseServer()) {
    const next = list.map(x => ({ ...x, isDefault: x.id === id }));
    saveAddresses(next);
    return next;
  }
  try {
    await api.addresses.setDefault(id);
    const next = list.map(x => ({ ...x, isDefault: x.id === id }));
    saveAddresses(next);
    return next;
  } catch {
    const next = list.map(x => ({ ...x, isDefault: x.id === id }));
    saveAddresses(next);
    return next;
  }
}
