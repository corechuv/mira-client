import React, { createContext, useContext, useMemo, useState } from "react";
import { products as seed, Product } from "@/data/products";

export type SortKey = "popular" | "price-asc" | "price-desc";

export type ProductsState = {
  products: Product[];

  search: string;
  setSearch: (q: string) => void;

  category: string;                    // базовый селект (если не используется filterPath)
  setCategory: (c: string) => void;

  sort: SortKey;
  setSort: (s: SortKey) => void;

  filterPath: string[];                // [Категория, Подкатегория?, Лист?]
  setFilterPath: (p: string[]) => void;

  // фильтры цены/рейтинга
  priceFrom: number;
  priceTo: number;
  setPriceFrom: (n: number) => void;
  setPriceTo: (n: number) => void;
  priceBounds: { min: number; max: number };

  ratingMin: number;                   // 0..5
  setRatingMin: (n: number) => void;

  resetFilters: () => void;
};

const Ctx = createContext<ProductsState | null>(null);

// глобальные границы цен по сидовым данным
const PRICE_MIN = Math.min(...seed.map(p => p.price));
const PRICE_MAX = Math.max(...seed.map(p => p.price));

export const ProductsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [sort, setSort] = useState<SortKey>("popular");
  const [filterPath, setFilterPath] = useState<string[]>([]);

  const [priceFrom, setPriceFrom] = useState<number>(PRICE_MIN);
  const [priceTo, setPriceTo] = useState<number>(PRICE_MAX);
  const priceBounds = { min: PRICE_MIN, max: PRICE_MAX };

  const [ratingMin, setRatingMin] = useState<number>(0);

  const products = useMemo(() => {
    let list = seed.slice();

    // путь из модалки категорий имеет приоритет
    if (filterPath.length > 0) {
      const [c, s, l] = filterPath;
      list = list.filter(p =>
        (!c || p.category === c) &&
        (!s || p.sub === s) &&
        (!l || p.leaf === l)
      );
    } else if (category !== "Все") {
      list = list.filter(p => p.category === category);
    }

    // поиск
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.short.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // цена
    list = list.filter(p => p.price >= priceFrom && p.price <= priceTo);

    // рейтинг
    if (ratingMin > 0) {
      list = list.filter(p => p.rating >= ratingMin);
    }

    // сортировка
    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      default:           list.sort((a, b) => b.rating - a.rating); break;
    }

    return list;
  }, [search, category, sort, filterPath, priceFrom, priceTo, ratingMin]);

  const resetFilters = () => {
    setSearch("");
    setCategory("Все");
    setSort("popular");
    setFilterPath([]);
    setPriceFrom(PRICE_MIN);
    setPriceTo(PRICE_MAX);
    setRatingMin(0);
  };

  return (
    <Ctx.Provider
      value={{
        products,
        search, setSearch,
        category, setCategory,
        sort, setSort,
        filterPath, setFilterPath,
        priceFrom, setPriceFrom,
        priceTo, setPriceTo,
        priceBounds,
        ratingMin, setRatingMin,
        resetFilters
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
};
