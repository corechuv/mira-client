// src/types/order.ts
import type { CartItem } from "./cart";
import type { ShipMethod } from "./shipping";

export type OrderStatus =
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refunded";

export type RefundInfo = {
  requestedAt: string;
  reason?: string;
  comment?: string;
  approved?: boolean;
  processedAt?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  total?: number;
  totals?: { subtotal?: number; shipping?: number; grand: number };
  customer?: { email?: string };
  shipping?: { method?: ShipMethod; packType?: "packstation" | "postfiliale" | null };
  payment?: { status?: "paid" | "pending" | "failed"; last4?: string };
  status?: OrderStatus;
  refund?: RefundInfo;
};
