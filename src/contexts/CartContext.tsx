import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "@/data/products";

export type CartItem = {
  id: string;
  qty: number;
  price: number;
  title: string;
  slug: string;
  imageUrl?: string;
};

type CartState = {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  totalQty: number;
};

const CartCtx = createContext<CartState | null>(null);

const LS_KEY = "pm.cart.v1";

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartState>(() => {
    const add = (product: Product, qty = 1) => {
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === product.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          return next;
        }
        return [...prev, { id: product.id, qty, price: product.price, title: product.title, slug: product.slug, imageUrl: product.imageUrl }];
      });
    };
    const remove = (id: string) => setItems(prev => prev.filter(i => i.id != id));
    const setQty = (id: string, qty: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
    const clear = () => setItems([]);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    return { items, add, remove, setQty, clear, total, totalQty };
  }, [items]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};