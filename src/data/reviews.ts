export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: string; // ISO
  helpful: number;
};

export const seedReviews: Review[] = [
  {
    id: "r-1",
    productId: "p-1",
    author: "Артём",
    rating: 5,
    text: "Gut.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    helpful: 4,
  },
  {
    id: "r-2",
    productId: "p-3",
    author: "Марина",
    rating: 4,
    text: "Gut.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    helpful: 2,
  },
  {
    id: "r-3",
    productId: "p-2",
    author: "Денис",
    rating: 5,
    text: "Gut.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    helpful: 3,
  },
];
