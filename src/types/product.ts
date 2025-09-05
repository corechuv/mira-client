// src/types/product.ts
export type Product = {
  id: string;
  slug: string;
  title: string;
  category: "Косметология" | "Витамины";
  sub?: string;
  leaf?: string;
  price: number;
  rating: number;
  short: string;
  description: string;
  imageUrl?: string;
  images?: string[];
};
