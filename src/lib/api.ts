// src/lib/api.ts
import type { Product } from "@/types/product";
import type { Order } from "@/types/order";
import type { Review } from "@/types";
import { seedReviews } from "@/data/reviews";

function normalizeReview(r: any): Review {
  return {
    id: r.id ?? r.review_id ?? crypto.randomUUID(),
    productId: r.product_id ?? r.productId ?? "",
    author: r.author ?? r.user ?? "Аноним",
    rating: Number(r.rating ?? 0) as 1|2|3|4|5,
    text: r.text ?? r.body ?? "",
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    helpful: Number(r.helpful ?? r.votes ?? 0),
  };
}

function normalizeProduct(r: any): Product {
  return {
    id: r.id ?? r.product_id ?? "",
    slug: r.slug ?? "",
    title: r.title ?? "",
    category: r.category ?? r.cat ?? "Косметология",
    sub: r.sub ?? undefined,
    leaf: r.leaf ?? undefined,
    price: Number(r.price ?? 0),
    rating: Number(r.rating ?? 0),
    short: r.short ?? "",
    description: r.description ?? "",
    imageUrl: r.image_url ?? r.imageUrl ?? r.image ?? undefined,
    images: r.images ?? undefined,
  };
}

// импорт types Order у вас уже есть
function normalizeOrder(res: any): Order {
  const items = (res.items || []).map((i: any) => ({
    id: i.id,
    qty: Number(i.qty ?? i.quantity ?? 1),
    price: Number(i.price ?? i.unit_price ?? 0),
    title: i.title ?? i.name ?? "",
    slug: i.slug ?? i.product_slug ?? "",
    imageUrl: i.imageUrl ?? i.image_url,
  }));

  const totals = res.totals ?? { grand: res.total ?? items.reduce((s: number, it: any) => s + it.price * it.qty, 0) };

  const paymentStatus =
    res.payment?.status ??
    res.payment_status ??
    res.paymentStatus ??
    (res.paid || res.is_paid ? "paid" : undefined);

  const paymentLast4 =
    res.payment?.last4 ??
    res.card_last4 ?? res.payment_last4 ?? res.cardLast4 ?? res.last4;

  const paymentMethod =
    res.payment?.method ??
    res.payment_method ?? res.paymentMethod ?? (paymentStatus ? "card" : undefined);

  const payment = paymentStatus
    ? { status: paymentStatus, method: paymentMethod, last4: paymentLast4 }
    : (res.payment ?? {});

  return {
    id: res.id,
    createdAt: res.created_at ?? res.createdAt ?? res.created ?? new Date().toISOString(),
    items,
    totals,
    customer: res.customer ?? {},
    shipping: res.shipping ?? {},
    payment,
    status: res.status ?? "processing",
    refund: res.refund ?? undefined,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "pm.token";

/* ====================== Token helpers ====================== */
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/* ========================= Types ========================== */
import type { User, Address } from "@/types";
import { PickupLocation } from "@/types/location";

/* ===================== Base request ======================= */
async function req<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  const method = (init.method || "GET").toUpperCase();
  const isGetLike = method === "GET" || method === "HEAD";

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    ...(!isGetLike ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(API + path, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401) clearToken();
    const msg = await res.text().catch(() => "");
    const err: any = new Error(msg || `HTTP ${res.status}`);
    err.status = res.status; err.path = path; err.method = method;
    throw err;
  }

  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  const txt = await res.text();
  try { return JSON.parse(txt) as T; } catch { }
  return txt as unknown as T;
}

/* ---------- Fallback helpers ---------- */
const RETRY_STATUSES = new Set([400, 404, 405, 415, 422, 501]);

async function tryReq<T>(
  variants: Array<{ path: string; init: RequestInit }>
): Promise<T> {
  let lastErr: any = null;
  for (const v of variants) {
    try {
      return await req<T>(v.path, v.init);
    } catch (e: any) {
      lastErr = e;
      if (!RETRY_STATUSES.has(e?.status)) throw e;
    }
  }
  throw lastErr || new Error("No variants worked");
}

/* ===================== Normalizers ======================== */
function normalizeMe(raw: any): User {
  const u = raw?.user ?? raw;
  return {
    id: u.id ?? u.user_id ?? u.uid ?? "",
    email: u.email ?? u.mail ?? u.username ?? "",
    name: u.name ?? u.fullName ?? u.full_name ?? u.displayName ?? undefined,
  };
}

function normalizeAddr(raw: any): Address {
  const r = Array.isArray(raw) ? raw[0] : raw;
  return {
    id: r.id ?? r._id ?? r.uuid ?? "",
    firstName: r.firstName ?? r.first_name ?? "",
    lastName: r.lastName ?? r.last_name ?? "",
    street: r.street ?? r.address_line1 ?? "",
    house: r.house ?? r.address_line2 ?? "",
    zip: r.zip ?? r.postcode ?? r.post_code ?? "",
    city: r.city ?? r.town ?? r.locality ?? "",
    phone: r.phone ?? r.tel ?? "",
    note: r.note ?? r.comment ?? "",
    packType: r.packType ?? r.pack_type ?? "",
    postNummer: r.postNummer ?? r.post_nummer ?? r.postNumber ?? "",
    stationNr: r.stationNr ?? r.station_nr ?? r.stationNumber ?? "",
    isDefault: !!(r.isDefault ?? r.is_default ?? r.default),
  };
}

function extractAddrArray(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.addresses)) return payload.addresses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/* ================= Payload builders (no duplicates!) ================= */
type ZipKey = "zip" | "postcode";

/** Удаляет undefined/null/пустые строки; false и 0 оставляем */
function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out as Partial<T>;
}

/** Строго snake_case, без camelCase дублей. */
function snakePayload(a: Partial<Address>, zipKey: ZipKey) {
  const hasPack = !!a.packType;
  const base = {
    first_name: a.firstName,
    last_name: a.lastName,
    street: a.street,
    house: a.house,
    city: a.city,
    phone: a.phone,
    note: a.note,
    is_default: a.isDefault ? true : undefined,
    pack_type: hasPack ? a.packType : undefined,
    post_nummer: hasPack ? a.postNummer : undefined,
    station_nr: hasPack ? a.stationNr : undefined,
    // либо zip, либо postcode
    [zipKey]: a.zip,
  } as Record<string, any>;
  // айди при создании не отправляем (сервер обычно сам генерит)
  delete base.id;
  return compact(base);
}

/** Строго camelCase, без snake_case. */
function camelPayload(a: Partial<Address>) {
  const hasPack = !!a.packType;
  const base = {
    firstName: a.firstName,
    lastName: a.lastName,
    street: a.street,
    house: a.house,
    city: a.city,
    phone: a.phone,
    note: a.note,
    isDefault: a.isDefault ? true : undefined,
    packType: hasPack ? a.packType : undefined,
    postNummer: hasPack ? a.postNummer : undefined,
    stationNr: hasPack ? a.stationNr : undefined,
    zip: a.zip,
  };
  // айди при создании не отправляем
  // (при update может быть, но мы в апдейте всё равно отправляем патч без id)
  return compact(base);
}

function compactUser(u: Partial<User>) {
  return compact({ name: u.name, email: u.email });
}

// --- Reviews API (list/add/vote) с офлайн-фолбэком ---
const REV_KEY = "pm.reviews.v1";

// Чтобы сохранить обратную совместимость: api.reviews(productId) == api.reviews.list(productId)
const reviews = (async (productId: string): Promise<Review[]> => {
  return reviews.list(productId);
}) as unknown as {
  (productId: string): Promise<Review[]>;
  list: (productId: string) => Promise<Review[]>;
  add: (payload: { productId: string; author: string; rating: number; text: string }) => Promise<Review>;
  vote: (reviewId: string) => Promise<void>;
};

reviews.list = async (productId: string): Promise<Review[]> => {
  try {
    const res = await req<any>(`/reviews?product_id=${encodeURIComponent(productId)}`);
    const arr = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
    return arr.map(normalizeReview);
  } catch {
    // офлайн: LocalStorage + seed
    const raw = localStorage.getItem(REV_KEY);
    let all: Review[] = raw ? JSON.parse(raw) : [];
    if (all.length === 0) {
      all = seedReviews.slice();
      localStorage.setItem(REV_KEY, JSON.stringify(all));
    }
    return all
      .filter(r => r.productId === productId)
      .sort((a,b)=> +new Date(b.createdAt) - +new Date(a.createdAt));
  }
};

reviews.add = async ({ productId, author, rating, text }) => {
  try {
    const res = await req<any>("/reviews", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, author, rating, text }),
    });
    return normalizeReview(res);
  } catch {
    // офлайн — пишем в локалку
    const r: Review = {
      id: crypto.randomUUID(),
      productId,
      author: (author || "Аноним").trim(),
      rating: Math.min(5, Math.max(1, Number(rating))) as 1|2|3|4|5,
      text: (text || "").trim(),
      createdAt: new Date().toISOString(),
      helpful: 0,
    };
    const raw = localStorage.getItem(REV_KEY);
    const list: Review[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(REV_KEY, JSON.stringify([r, ...list]));
    return r;
  }
};

reviews.vote = async (reviewId: string) => {
  try {
    await req(`/reviews/${encodeURIComponent(reviewId)}/vote`, { method: "POST" });
  } catch {
    // офлайн — инкрементим локально
    const raw = localStorage.getItem(REV_KEY);
    if (!raw) return;
    const list: Review[] = JSON.parse(raw);
    const idx = list.findIndex(r => r.id === reviewId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], helpful: (list[idx].helpful ?? 0) + 1 };
      localStorage.setItem(REV_KEY, JSON.stringify(list));
    }
  }
};

/* ========================= API =========================== */
export const api = {
  register: (name: string, email: string, password: string) =>
    req<any>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  login: (email: string, password: string) =>
    req<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: async (): Promise<User> => normalizeMe(await req<any>("/auth/me")),

  updateMe: async (patch: Partial<User>): Promise<User> => {
    const bodies = [
      compact({ name: patch.name, email: patch.email }),
      compact({ full_name: patch.name, email: patch.email }),
      compact({ displayName: patch.name, email: patch.email }),
    ];

    const variants: Array<{ path: string; init: RequestInit }> = [];
    for (const b of bodies) variants.push({ path: "/auth/me", init: { method: "PATCH", body: JSON.stringify(b) } });
    for (const b of bodies) variants.push({ path: "/users/me", init: { method: "PATCH", body: JSON.stringify(b) } });
    for (const b of bodies) variants.push({ path: "/profile", init: { method: "PATCH", body: JSON.stringify(b) } });
    // иногда PUT
    for (const b of bodies) variants.push({ path: "/auth/me", init: { method: "PUT", body: JSON.stringify(b) } });

    const res = await tryReq<any>(variants);
    return normalizeMe(res);
  },

  reviews,

  locations: {
    async search(zip: string, city?: string, type: "packstation"|"postfiliale"|"parcelshop" = "packstation", radius = 5, results = 10): Promise<PickupLocation[]> {
      const qs = `?zip=${encodeURIComponent(zip)}${city ? `&city=${encodeURIComponent(city)}` : ""}&type=${type}&radius=${radius}&results=${results}`;
      const res = await req<any>(`/locations${qs}`);
      const arr = res?.items ?? res ?? [];
      return arr as PickupLocation[];
    }
  },

  addresses: {
    list: async (): Promise<Address[]> => {
      const data = await req<any>("/addresses");
      const arr = extractAddrArray(data);
      const norm = arr.map(normalizeAddr);
      // гарантируем одиночный дефолт
      if (norm.some(a => a.isDefault)) {
        let seen = false;
        for (const a of norm) {
          if (a.isDefault) {
            if (seen) a.isDefault = false;
            else seen = true;
          }
        }
      }
      return norm;
    },

    create: async (a: Address): Promise<Address> => {
      // пробуем несколько формат/вариантов схемы
      const variants = [
        { path: "/addresses", init: { method: "POST", body: JSON.stringify(snakePayload(a, "zip")) } },
        { path: "/addresses", init: { method: "POST", body: JSON.stringify(snakePayload(a, "postcode")) } },
        { path: "/addresses", init: { method: "POST", body: JSON.stringify(camelPayload(a)) } },
      ];
      const res = await tryReq<any>(variants);
      const created = res?.item ?? res?.data ?? res?.address ?? res;
      return normalizeAddr(created);
    },

    update: async (id: string, patch: Partial<Address>): Promise<Address> => {
      const bodies = [
        JSON.stringify(snakePayload(patch, "zip")),
        JSON.stringify(snakePayload(patch, "postcode")),
        JSON.stringify(camelPayload(patch)),
      ];

      // PUT, затем PATCH, со всеми тремя телами
      const variants: Array<{ path: string; init: RequestInit }> = [];
      for (const b of bodies) variants.push({ path: `/addresses/${id}`, init: { method: "PUT", body: b } });
      for (const b of bodies) variants.push({ path: `/addresses/${id}`, init: { method: "PATCH", body: b } });

      const res = await tryReq<any>(variants);
      const updated = res?.item ?? res?.data ?? res?.address ?? res;
      return normalizeAddr(updated);
    },

    remove: async (id: string): Promise<void> => {
      await req<void>(`/addresses/${id}`, { method: "DELETE" });
    },

    setDefault: async (id: string): Promise<void> => {
      // основной вариант
      try {
        await req<void>(`/addresses/${id}/default`, { method: "POST" });
        return;
      } catch (e: any) {
        if (!RETRY_STATUSES.has(e?.status)) throw e;
      }
      // запасные
      try {
        await req<void>("/addresses/default", {
          method: "POST",
          body: JSON.stringify({ id, is_default: true }),
        });
        return;
      } catch (e: any) {
        if (!RETRY_STATUSES.has(e?.status)) throw e;
      }
      await req<void>(`/addresses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_default: true }),
      });
    },
  },
  // ТОВАРЫ / КАТЕГОРИИ
  products: async (): Promise<Product[]> => {
    // берём побольше, чтобы локально фильтровать как раньше
    const page = await req<any>("/products?limit=100");
    const items = page?.items ?? page ?? [];
    return items.map(normalizeProduct);
  },

  product: async (slug: string): Promise<Product | null> => {
    const raw = await req<any>(`/products/${slug}`);
    return raw ? normalizeProduct(raw) : null;
  },

  categories: async (): Promise<Array<{ title: string; slug: string; children?: any[] }>> => {
    return await req("/categories");
  },

  // ЗАКАЗЫ
  orders: {
    create: async (draft: any): Promise<Order> => {
      const res = await req<any>("/orders", { method: "POST", body: JSON.stringify(draft) });
      return normalizeOrder(res);
    },

    list: async (email?: string): Promise<Order[]> => {
      const qs = email ? `?email=${encodeURIComponent(email)}` : "";
      const arr = await req<any>(`/orders${qs}`);
      return (arr || []).map(normalizeOrder);
    },

    cancel: (orderId: string) =>
      req<void>(`/orders/${orderId}/cancel`, { method: "POST" }),

    requestReturn: (orderId: string, reason: string, comment?: string) =>
      req<void>(`/orders/${orderId}/request-return?reason=${encodeURIComponent(reason)}${comment ? `&comment=${encodeURIComponent(comment)}` : ""}`, { method: "POST" }),

    // опционально: мок-оплата
    pay: (orderId: string, last4 = "4242") =>
      req<void>(`/orders/${orderId}/pay?last4=${encodeURIComponent(last4)}`, { method: "POST" }),
  },
  payments: {
    async createIntent(amountCents: number, currency = "EUR"): Promise<{ client_secret: string }> {
      // на всякий случай не даём отправить < 50 центов (Stripe validation)
      const amt = Math.max(50, Math.round(amountCents));
      return req<{ client_secret: string }>(
        "/payments/intent",
        { method: "POST", body: JSON.stringify({ amount: amt, currency }) }
      );
    },
  },
};
