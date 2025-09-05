import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";


export type SortKey = "popular" | "price-asc" | "price-desc";

export type ProductsState = {
  // полный список из API
  all: Product[];
  // отфильтрованный список (под текущие фильтры)
  products: Product[];

  // фильтры/сортировки
  search: string; setSearch: (q: string) => void;
  category: string; setCategory: (c: string) => void;
  sort: SortKey; setSort: (s: SortKey) => void;
  filterPath: string[]; setFilterPath: (p: string[]) => void;

  // цена/рейтинг
  priceFrom: number; priceTo: number;
  setPriceFrom: (n: number) => void; setPriceTo: (n: number) => void;
  priceBounds: { min: number; max: number };
  ratingMin: number; setRatingMin: (n: number) => void;

  loading: boolean; error: string | null;
  resetFilters: () => void;
};

const Ctx = createContext<ProductsState | null>(null);

export const ProductsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { locale } = useI18n();
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      try {
        const items = await api.products();   // locale уже прикрутится внутри req()
        if (!dead) { setAll(items); setError(null); }
      } catch (e: any) {
        if (!dead) setError(e?.message || "Не удалось загрузить каталог");
      } finally { if (!dead) setLoading(false); }
    })();
    return () => { dead = true; };
  }, [locale]);

  const priceMin = all.length ? Math.min(...all.map(p => p.price)) : 0;
  const priceMax = all.length ? Math.max(...all.map(p => p.price)) : 1000;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [sort, setSort] = useState<SortKey>("popular");
  const [filterPath, setFilterPath] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState<number>(priceMin);
  const [priceTo, setPriceTo] = useState<number>(priceMax);
  const [ratingMin, setRatingMin] = useState<number>(0);

  // сброс когда меняется ассортимент
  useEffect(() => {
    setPriceFrom(priceMin);
    setPriceTo(priceMax);
  }, [priceMin, priceMax]);

  const products = useMemo(() => {
    let list = all.slice();

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

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        p => p.title.toLowerCase().includes(q)
          || p.short.toLowerCase().includes(q)
          || p.description.toLowerCase().includes(q)
      );
    }

    list = list.filter(p => p.price >= priceFrom && p.price <= priceTo);
    if (ratingMin > 0) list = list.filter(p => (p.rating ?? 0) >= ratingMin);

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      default:           list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    }
    return list;
  }, [all, search, category, sort, filterPath, priceFrom, priceTo, ratingMin]);

  const resetFilters = () => {
    setSearch(""); setCategory("Все"); setSort("popular"); setFilterPath([]);
    setPriceFrom(priceMin); setPriceTo(priceMax); setRatingMin(0);
  };

  return (
    <Ctx.Provider
      value={{
        all,
        products,
        search, setSearch,
        category, setCategory,
        sort, setSort,
        filterPath, setFilterPath,
        priceFrom, setPriceFrom,
        priceTo, setPriceTo,
        priceBounds: { min: priceMin, max: priceMax },
        ratingMin, setRatingMin,
        loading, error,
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
