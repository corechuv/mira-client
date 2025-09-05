// src/types/cart.ts
export type CartItem = {
  id: string;
  qty: number;
  price: number;
  title: string;
  slug: string;
  imageUrl?: string;
};
