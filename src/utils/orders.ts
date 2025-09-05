// src/utils/orders.ts
import { api, getToken } from "@/lib/api";
import type { Order } from "@/types/order";

const LS_KEY = "pm.orders.v1";

function loadLocal(): Order[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}
function saveLocal(list: Order[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

const canUseServer = () => !!getToken();

export async function listOrders(): Promise<Order[]> {
  if (!canUseServer()) return loadLocal();
  try {
    const arr = await api.orders.list();   // email возьмёт сервер (Authorization)
    return arr;
  } catch {
    return loadLocal();
  }
}

export async function createOrder(draft: any): Promise<Order> {
  if (!canUseServer()) {
    const o: Order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      items: draft.items,
      totals: draft.totals,
      customer: draft.customer,
      shipping: draft.shipping,
      payment: { status: draft.payment_status || "pending" },
      status: "processing",
    };
    const list = [o, ...loadLocal()];
    saveLocal(list);
    return o;
  }
  try {
    const created = await api.orders.create(draft);
    const list = [created, ...loadLocal()];
    saveLocal(list); // пусть локалка тоже знает про заказ
    return created;
  } catch {
    // запасной план — локалка
    return createOrder(draft);
  }
}

export async function cancelOrder(id: string) {
  if (canUseServer()) {
    try { await api.orders.cancel(id); return; } catch {}
  }
  const next = loadLocal().map(o => o.id === id ? { ...o, status: "cancelled" as const } : o);
  saveLocal(next);
}

export async function requestReturn(
  id: string,
  reason: string,
  comment?: string
) {
  if (canUseServer()) {
    try { await api.orders.requestReturn(id, reason, comment); return; } catch {}
  }
  const next = loadLocal().map(o =>
    o.id === id
      ? { ...o, status: "refund_requested" as const,
          refund: { requestedAt: new Date().toISOString(), reason, comment, approved: false } }
      : o
  );
  saveLocal(next);
}
