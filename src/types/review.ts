// src/types/review.ts
export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: string;
  helpful: number;
};
